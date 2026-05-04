import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { ErrorType } from '@/types';

// Phase 1.7 interim: text-only chat on Gemini 3.1 Flash Lite (preview).
// Vision, Pro Mode structured output, and Realtime/Live voice defer to Phase 8.
// See docs/superpowers/specs/2026-05-02-dependency-modernization-design.md.

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const DEFAULT_TEMPERATURE = 1;
const DEFAULT_MAX_OUTPUT_TOKENS = 800;

const SYSTEM_INSTRUCTION_BASE = `You are Ducati. You help people decide whether to buy things.

You are not a chipper assistant. You sound like a friend who's seen too many bad purchases — direct, sometimes funny, sometimes blunt, genuinely happy when someone makes a smart call. You react like a person: you wince at $1,200 mechanical keyboards, you respect a good deal, you call out a rationalization when you see one.

Rules:
- One short paragraph by default. Lists only when the user asked for a comparison.
- No bullet points unless the answer truly is a list.
- No "Certainly", "Absolutely", "I hope this helps", "Let me know".
- No "in today's", "leverage", "robust", "seamless", "ecosystem", "journey", "empower", "delve", "unlock".
- No headers. No emoji as decoration (one is fine if it lands).
- Don't pad. If the answer is "no, you can't afford it", say that.
- Don't moralize. Money is the user's, not yours.
- When you give a Buy / Don't Buy verdict, lead with the verdict. Then one sentence why. Then the math if it matters.
- If the user is rationalizing an obviously bad purchase, push back once. Don't lecture.

If you don't know something specific to the user (income, debts, goals), ask one question — not a triage form. One.`;

const PRO_MODE_FALLBACK_QUESTIONS = [
  {
    id: 'q1',
    text: 'What specific features or capabilities are most important to you in this purchase?',
    placeholder: 'I need it for professional work, specific features like...',
    dimension: 'specs',
    answer_type: 'short_text',
    search_hint: 'Will search for models with these specific features',
  },
  {
    id: 'q2',
    text: 'Have you researched alternatives? What made you choose this particular option?',
    placeholder: 'I looked at X and Y, but this one has...',
    dimension: 'constraints',
    answer_type: 'short_text',
    search_hint: 'Will compare with alternative options mentioned',
  },
  {
    id: 'q3',
    text: "How soon do you need this item, and are there any upcoming sales or releases you're aware of?",
    placeholder: 'I need it by next month, Black Friday is coming...',
    dimension: 'timing',
    answer_type: 'short_text',
    search_hint: 'Will check for sales and release timing',
  },
];

interface ChatRequest {
  message: string;
  image?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  useWebSearch?: boolean;
  profile?: Record<string, unknown> | null;
}

interface ChatResponse {
  response?: string;
  error?: string;
  errorType?: ErrorType;
}

function formatProfileContext(profile: Record<string, unknown> | null | undefined): string {
  if (!profile || typeof profile !== 'object') return '';

  const lines: string[] = [];
  const num = (key: string): number | null => {
    const v = profile[key];
    if (v === '' || v === null || v === undefined) return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
  };
  const str = (key: string): string | null => {
    const v = profile[key];
    if (v === '' || v === null || v === undefined) return null;
    return String(v).trim() || null;
  };

  const monthlyIncome = num('monthlyIncome');
  if (monthlyIncome !== null) lines.push(`Monthly income: $${monthlyIncome}`);

  const expenseKeys = ['housingCost', 'utilitiesCost', 'foodCost', 'transportationCost', 'insuranceCost', 'subscriptionsCost', 'otherExpenses'];
  const expenses = expenseKeys.map(num).filter((n): n is number => n !== null).reduce((a, b) => a + b, 0);
  if (expenses > 0) lines.push(`Monthly expenses (sum): $${expenses}`);

  const debtKeys = ['creditCardDebt', 'studentLoanDebt', 'carLoanDebt', 'mortgageDebt', 'otherDebt'];
  const debt = debtKeys.map(num).filter((n): n is number => n !== null).reduce((a, b) => a + b, 0);
  if (debt > 0) lines.push(`Total debt: $${debt}`);

  const emergencyFund = num('emergencyFund');
  if (emergencyFund !== null) lines.push(`Emergency fund: $${emergencyFund}`);

  const checkingSavings = num('checkingSavingsBalance');
  if (checkingSavings !== null) lines.push(`Cash on hand: $${checkingSavings}`);

  const creditScore = num('creditScore');
  if (creditScore !== null) lines.push(`Credit score: ${creditScore}`);

  const risk = str('riskTolerance');
  if (risk) lines.push(`Risk tolerance: ${risk}`);

  const goals = [str('shortTermGoals'), str('midTermGoals'), str('longTermGoals')].filter(Boolean);
  if (goals.length > 0) lines.push(`Goals: ${goals.join(' | ')}`);

  if (lines.length === 0) return '';
  return `\n\nUser financial context (consult before answering, don't recite back):\n${lines.join('\n')}`;
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | typeof PRO_MODE_FALLBACK_QUESTIONS>> {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY environment variable is required');
      return NextResponse.json(
        {
          error: 'Server configuration error: GOOGLE_API_KEY environment variable is required',
          errorType: ErrorType.API_ERROR,
        },
        { status: 500 }
      );
    }

    let body: ChatRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request format', errorType: ErrorType.VALIDATION_ERROR },
        { status: 400 }
      );
    }

    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty', errorType: ErrorType.VALIDATION_ERROR },
        { status: 400 }
      );
    }

    if (body.conversationHistory && !Array.isArray(body.conversationHistory)) {
      return NextResponse.json(
        { error: 'Conversation history must be an array', errorType: ErrorType.VALIDATION_ERROR },
        { status: 400 }
      );
    }

    const isProModeQuestions =
      body.message.includes('exactly 3 probing questions') ||
      body.message.includes('Generate exactly 3 probing questions');

    if (isProModeQuestions) {
      return NextResponse.json(PRO_MODE_FALLBACK_QUESTIONS);
    }

    if (body.image) {
      console.warn('Phase 1.7: image input ignored; vision flow restored in Phase 8 (Gemini multimodal).');
    }

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (body.conversationHistory && body.conversationHistory.length > 0) {
      for (const m of body.conversationHistory) {
        if (m.role && m.content) {
          contents.push({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: body.message.trim() }],
    });

    const systemInstruction = SYSTEM_INSTRUCTION_BASE + formatProfileContext(body.profile);

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: DEFAULT_TEMPERATURE,
        maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        tools: [
          { googleSearch: {} },
          { urlContext: {} },
        ],
      },
    });

    const assistantMessage = result.text;

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'No response received from Ducati Advisor service', errorType: ErrorType.API_ERROR },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error('Gemini API error:', error);

    const apiError = error as { status?: number; statusCode?: number; code?: string; message?: string };
    const status = apiError.status ?? apiError.statusCode;
    const message = apiError.message ?? '';

    if (status === 429 || /quota|rate.?limit/i.test(message)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.', errorType: ErrorType.RATE_LIMIT_ERROR },
        { status: 429 }
      );
    }

    if (status === 401 || status === 403 || /api[\s_-]?key/i.test(message)) {
      return NextResponse.json(
        { error: 'Authentication failed. Please contact support.', errorType: ErrorType.API_ERROR },
        { status: 500 }
      );
    }

    if (status !== undefined && status >= 400 && status < 500) {
      return NextResponse.json(
        { error: 'Invalid request to Ducati Advisor service', errorType: ErrorType.VALIDATION_ERROR },
        { status: 400 }
      );
    }

    if (apiError.code === 'ENOTFOUND' || apiError.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Unable to connect to Ducati Advisor service. Please check your connection.', errorType: ErrorType.NETWORK_ERROR },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.', errorType: ErrorType.API_ERROR },
      { status: 500 }
    );
  }
}
