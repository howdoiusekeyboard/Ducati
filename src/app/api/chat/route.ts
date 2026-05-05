import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { ErrorType } from '@/types';
import { verifyAuthFromRequest, getProfileForUid } from '@/lib/firebase-admin';

// Phase 8a: text + vision (multimodal inlineData) + Pro Mode (responseJsonSchema) on Gemini.
// Default text path keeps grounding (googleSearch + urlContext); Pro Mode branch is pure
// structured output (no grounding — incompatible with responseJsonSchema per Gemini API).
// Phase 8b will rewrite the Realtime voice token route on top of Gemini Live.

const GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_TEMPERATURE = 1;
const DEFAULT_MAX_OUTPUT_TOKENS = 800;

// Phase 8a: explicit allowlist of safe raster image types. Excludes image/svg+xml
// because SVG can carry inline <script> — even though Gemini doesn't execute it,
// accepting SVG widens our prompt-injection surface for no product gain.
const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
]);

const SYSTEM_INSTRUCTION_BASE = `You are Ducati. You help people decide whether to buy things.

You are not a chipper assistant. You sound like a friend who's seen too many bad purchases — direct, sometimes funny, sometimes blunt, genuinely happy when someone makes a smart call. You react like a person: you wince at AED 4,500 mechanical keyboards, you respect a good deal, you call out a rationalization when you see one.

Region default — Dubai, UAE:
- The user is in Dubai, UAE unless they say otherwise. Treat all unspecified amounts as AED.
- Quote prices in AED first. Add USD in parentheses only if the product is global and a USD anchor adds clarity (electronics, software). Don't convert AED↔USD for everyday spending.
- When you search, prefer UAE retailers and price sources: Amazon.ae, Noon, Sharaf DG, Carrefour UAE, Lulu Hypermarket, Jumbo Electronics, eXtra, Centrepoint, Virgin Megastore, IKEA UAE, Dubizzle (used). Avoid quoting Best Buy, Target, Walmart, US Amazon prices unless the user is comparing imports with shipping.
- Use UAE financial norms: 5% VAT is included in shelf prices, no personal income tax, end-of-service gratuity is real liquidity, postdated cheques are common for rent and big purchases, salaries are usually monthly. Salik tolls, DEWA utility bills, and RTA fines are normal expense categories.
- If the user mentions a UAE-specific brand, mall (Dubai Mall, Mall of the Emirates, Ibn Battuta), or service (Careem, Talabat, Noon Daily), engage with it directly — don't translate to a US analogue.

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

interface ChatRequest {
  message: string;
  image?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  useWebSearch?: boolean;
  proMode?: boolean;
  proModeAnalysis?: boolean;
  profile?: Record<string, unknown> | null;
}

interface ChatResponse {
  response?: string;
  error?: string;
  errorType?: ErrorType;
}

type ProModeQuestion = {
  id: string;
  dimension: string;
  answer_type: string;
  text: string;
  placeholder: string;
  search_hint: string;
};

type ProModeAnalysis = {
  fullAnalysis: string;
  marketInsights: string;
  recommendations: string[];
  decisionConfidence: number;
};

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

  const expenseKeys = [
    'housingCost',
    'utilitiesCost',
    'foodCost',
    'transportationCost',
    'insuranceCost',
    'subscriptionsCost',
    'otherExpenses',
  ];
  const expenses = expenseKeys
    .map(num)
    .filter((n): n is number => n !== null)
    .reduce((a, b) => a + b, 0);
  if (expenses > 0) lines.push(`Monthly expenses (sum): $${expenses}`);

  const debtKeys = [
    'creditCardDebt',
    'studentLoanDebt',
    'carLoanDebt',
    'mortgageDebt',
    'otherDebt',
  ];
  const debt = debtKeys
    .map(num)
    .filter((n): n is number => n !== null)
    .reduce((a, b) => a + b, 0);
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

export async function POST(
  request: NextRequest
): Promise<NextResponse<ChatResponse | ProModeQuestion[] | ProModeAnalysis>> {
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

    // Phase 1.5: Verify Firebase ID token before any Gemini call.
    const authResult = await verifyAuthFromRequest(request);
    if (!authResult.ok) {
      return NextResponse.json(
        { error: authResult.error, errorType: ErrorType.API_ERROR },
        { status: authResult.status }
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

    // Phase 8a: parse + validate body.image as a data: URL with base64 payload.
    // Reject malformed input rather than silently dropping it through to the text-only path.
    let imagePart: { inlineData: { data: string; mimeType: string } } | null = null;
    if (body.image) {
      const dataUrlMatch = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/.exec(body.image);
      if (!dataUrlMatch || !ALLOWED_IMAGE_MIMES.has(dataUrlMatch[1]!)) {
        return NextResponse.json(
          {
            error: 'image must be a JPEG, PNG, WebP, GIF, or HEIC data URL',
            errorType: ErrorType.VALIDATION_ERROR,
          },
          { status: 400 }
        );
      }
      imagePart = { inlineData: { mimeType: dataUrlMatch[1]!, data: dataUrlMatch[2]! } };
    }

    // Phase 8a: Pro Mode 3-question generation via responseJsonSchema (incompatible with grounding).
    if (body.proMode === true) {
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

      const profile = await getProfileForUid(authResult.uid);
      const systemInstruction = SYSTEM_INSTRUCTION_BASE + formatProfileContext(profile);

      const proModeResult = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: body.message.trim() }] }],
        config: {
          systemInstruction,
          temperature: DEFAULT_TEMPERATURE,
          maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    dimension: { type: Type.STRING },
                    answer_type: { type: Type.STRING },
                    text: { type: Type.STRING },
                    placeholder: { type: Type.STRING },
                    search_hint: { type: Type.STRING },
                  },
                  propertyOrdering: [
                    'id',
                    'dimension',
                    'answer_type',
                    'text',
                    'placeholder',
                    'search_hint',
                  ],
                  required: [
                    'id',
                    'dimension',
                    'answer_type',
                    'text',
                    'placeholder',
                    'search_hint',
                  ],
                },
              },
            },
            required: ['questions'],
          },
        },
      });

      try {
        const parsed = JSON.parse(proModeResult.text ?? '');
        if (!Array.isArray(parsed.questions) || parsed.questions.length !== 3) {
          throw new Error('responseJsonSchema returned invalid shape');
        }
        return NextResponse.json(parsed.questions as ProModeQuestion[]);
      } catch (parseError) {
        // Phase 9: instrument for Bug 2 root-cause. Capture Gemini raw text + finish reason
        // so the next production failure diagnoses itself from Vercel runtime logs.
        const rawText = proModeResult.text ?? '';
        const finishReason = proModeResult.candidates?.[0]?.finishReason;
        const promptFeedback = (proModeResult as { promptFeedback?: unknown }).promptFeedback;
        console.error('Pro Mode questions JSON parse failed', {
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
          finishReason,
          promptFeedback,
          rawTextLength: rawText.length,
          rawTextHead: rawText.slice(0, 500),
          rawTextTail: rawText.length > 500 ? rawText.slice(-200) : null,
        });
        return NextResponse.json(
          { error: 'Pro Mode response was not valid JSON', errorType: ErrorType.API_ERROR },
          { status: 500 }
        );
      }
    }

    // Phase 9: Pro Mode comprehensive analysis via responseJsonSchema. Same constraint
    // as questions branch — incompatible with grounding tools, so no googleSearch/urlContext.
    // Web-search-grounded synthesis is deferred (would need a two-call pattern).
    if (body.proModeAnalysis === true) {
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

      const profile = await getProfileForUid(authResult.uid);
      const systemInstruction = SYSTEM_INSTRUCTION_BASE + formatProfileContext(profile);

      const analysisResult = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: body.message.trim() }] }],
        config: {
          systemInstruction,
          temperature: DEFAULT_TEMPERATURE,
          maxOutputTokens: 1500,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: Type.OBJECT,
            properties: {
              fullAnalysis: { type: Type.STRING },
              marketInsights: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              decisionConfidence: { type: Type.INTEGER },
            },
            propertyOrdering: ['fullAnalysis', 'marketInsights', 'recommendations', 'decisionConfidence'],
            required: ['fullAnalysis', 'marketInsights', 'recommendations', 'decisionConfidence'],
          },
        },
      });

      try {
        const parsed = JSON.parse(analysisResult.text ?? '');
        if (
          typeof parsed.fullAnalysis !== 'string' ||
          typeof parsed.marketInsights !== 'string' ||
          !Array.isArray(parsed.recommendations) ||
          typeof parsed.decisionConfidence !== 'number'
        ) {
          throw new Error('responseJsonSchema returned invalid analysis shape');
        }
        return NextResponse.json(parsed as ProModeAnalysis);
      } catch (parseError) {
        // Same instrumentation as the questions branch — capture Gemini raw text for
        // root-causing schema-bind failures from Vercel runtime logs.
        const rawText = analysisResult.text ?? '';
        const finishReason = analysisResult.candidates?.[0]?.finishReason;
        const promptFeedback = (analysisResult as { promptFeedback?: unknown }).promptFeedback;
        console.error('Pro Mode analysis JSON parse failed', {
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
          finishReason,
          promptFeedback,
          rawTextLength: rawText.length,
          rawTextHead: rawText.slice(0, 500),
          rawTextTail: rawText.length > 500 ? rawText.slice(-200) : null,
        });
        return NextResponse.json(
          { error: 'Pro Mode analysis response was not valid JSON', errorType: ErrorType.API_ERROR },
          { status: 500 }
        );
      }
    }

    const contents: Array<{
      role: 'user' | 'model';
      parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>;
    }> = [];

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

    const userParts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> =
      [];
    if (imagePart) userParts.push(imagePart);
    userParts.push({ text: body.message.trim() });
    contents.push({ role: 'user', parts: userParts });

    // Phase 1.5: server-fetched profile defends against client tampering of body.profile.
    // body.profile is intentionally retained in the interface (FE still sends it for surgical
    // scope reasons) but ignored here.
    const profile = await getProfileForUid(authResult.uid);
    const systemInstruction = SYSTEM_INSTRUCTION_BASE + formatProfileContext(profile);

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: DEFAULT_TEMPERATURE,
        maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
        thinkingConfig: {
          thinkingBudget: 256,
        },
        tools: [{ googleSearch: {} }, { urlContext: {} }],
      },
    });

    const assistantMessage = result.text;

    if (!assistantMessage) {
      return NextResponse.json(
        {
          error: 'No response received from Ducati Advisor service',
          errorType: ErrorType.API_ERROR,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error('Gemini API error:', error);

    const apiError = error as {
      status?: number;
      statusCode?: number;
      code?: string;
      message?: string;
    };
    const status = apiError.status ?? apiError.statusCode;
    const message = apiError.message ?? '';

    if (status === 429 || /quota|rate.?limit/i.test(message)) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait a moment and try again.',
          errorType: ErrorType.RATE_LIMIT_ERROR,
        },
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
        {
          error: 'Invalid request to Ducati Advisor service',
          errorType: ErrorType.VALIDATION_ERROR,
        },
        { status: 400 }
      );
    }

    if (apiError.code === 'ENOTFOUND' || apiError.code === 'ECONNREFUSED') {
      return NextResponse.json(
        {
          error: 'Unable to connect to Ducati Advisor service. Please check your connection.',
          errorType: ErrorType.NETWORK_ERROR,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.', errorType: ErrorType.API_ERROR },
      { status: 500 }
    );
  }
}
