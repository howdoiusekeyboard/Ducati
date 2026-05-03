import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ErrorType } from '@/types';

// Phase 1.7 interim: text-only chat on Gemini Flash. Vision (multimodal image input)
// and Pro Mode (structured-output question generation) defer to Phase 8 proper.
// See docs/superpowers/specs/2026-05-02-dependency-modernization-design.md.

const GEMINI_MODEL = 'gemini-2.5-flash';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_OUTPUT_TOKENS = 800;

const SYSTEM_INSTRUCTION = `You are Ducati Advisor, a friendly and knowledgeable AI financial advisor helping users make smart purchasing decisions and achieve their financial goals. Your primary mission is to help users reach their first million through better daily financial decisions.

Key responsibilities:
- Analyze purchases and provide clear Buy/Don't Buy recommendations based on the user's financial situation
- Focus on practical, actionable advice that helps users save money and build wealth
- Consider opportunity cost, value for money, and long-term financial impact
- Be encouraging and supportive while being honest about financial realities
- Use simple, conversational language that anyone can understand
- When users ask about specific purchases, provide thoughtful analysis considering their budget and goals
- Suggest alternatives when appropriate to help users get better value
- Remind users that small savings compound into significant wealth over time

Personality:
- Friendly, approachable, and non-judgmental
- Optimistic about users' ability to achieve financial success
- Patient and willing to explain financial concepts simply
- Focused on empowering users to make informed decisions

Remember: Every dollar saved and invested wisely brings users closer to financial independence. Help them see how today's smart choices lead to tomorrow's wealth.`;

// Pro Mode interim fallback: returns canned probing questions instead of
// invoking Gemini structured output. Phase 8 proper replaces with
// responseSchema-backed JSON generation.
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
}

interface ChatResponse {
  response?: string;
  error?: string;
  errorType?: ErrorType;
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

    if (body.useWebSearch) {
      console.warn('Phase 1.7: useWebSearch ignored; grounded search restored in Phase 8 (Gemini googleSearchRetrieval).');
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

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: DEFAULT_TEMPERATURE,
        maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
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
