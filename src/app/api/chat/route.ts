import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ErrorType } from '@/types';
import { validateEnvironment, getOpenAIConfig, logEnvironmentInfo, getCurrentEnvironment } from '@/lib/openai-config';

// Function to create OpenAI client when needed
function createOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Request interface for type safety
interface ChatRequest {
  message: string;
  image?: string; // Base64 encoded image
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  useWebSearch?: boolean; // Add support for web search flag
}

// Response interface for type safety
interface ChatResponse {
  response?: string;
  error?: string;
  errorType?: ErrorType;
}

// Type for completion options
interface CompletionOptions {
  model: string;
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
  web_search_options?: {
    search_context_size: 'high' | 'medium' | 'low';
  };
}

// Helper function to attempt to fix truncated JSON
function attemptToFixTruncatedJSON(jsonString: string): string | null {
  try {
    // Try to find where the JSON was likely truncated
    const lastValidChar = jsonString.lastIndexOf('"');
    if (lastValidChar === -1) return null;
    
    // Try to close the JSON structure properly
    let fixedJson = jsonString.substring(0, lastValidChar + 1);
    
    // Count open brackets/braces
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < fixedJson.length; i++) {
      const char = fixedJson[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') openBraces++;
        else if (char === '}') openBraces--;
        else if (char === '[') openBrackets++;
        else if (char === ']') openBrackets--;
      }
    }
    
    // Close any open structures
    while (openBrackets > 0) {
      fixedJson += ']';
      openBrackets--;
    }
    
    while (openBraces > 0) {
      fixedJson += '}';
      openBraces--;
    }
    
    return fixedJson;
  } catch (error) {
    console.error('Error attempting to fix truncated JSON:', error);
    return null;
  }
}

// Enhanced validation for Pro Mode questions
function validateProModeQuestions(questions: any[]): any[] {
  // Ensure we have exactly 3 questions
  if (!Array.isArray(questions) || questions.length < 3) {
    throw new Error('Not enough questions generated');
  }
  
  // Validate each question has required fields
  const validQuestions = questions.filter((q: any) => 
    q.id && typeof q.id === 'string' &&
    q.text && typeof q.text === 'string' &&
    q.placeholder && typeof q.placeholder === 'string'
  );
  
  if (validQuestions.length < 3) {
    throw new Error('Invalid question format');
  }
  
  // Pass through all fields including optional ones
  return validQuestions.slice(0, 3).map((q, index) => ({
    ...q, // Keep all fields including dimension, answer_type, search_hint
    id: q.id || `q${index + 1}`,
    text: q.text,
    placeholder: q.placeholder
  }));
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | any[]>> {
  try {
    // Log environment info for debugging
    const currentEnv = getCurrentEnvironment();
    console.log(`Chat API called - Environment: ${currentEnv}`);
    console.log(`API Key present: ${!!process.env.OPENAI_API_KEY}`);
    console.log(`API Key length: ${process.env.OPENAI_API_KEY?.length || 0}`);
    console.log(`API Key starts with sk-: ${process.env.OPENAI_API_KEY?.startsWith('sk-') || false}`);
    console.log(`API Key format valid: ${process.env.OPENAI_API_KEY?.startsWith('sk-') || false}`);
    console.log(`All env vars:`, Object.keys(process.env).filter(key => key.includes('OPENAI')));
    
    if (currentEnv === 'development') {
      logEnvironmentInfo();
    }

    // Validate environment variables
    const envValidation = validateEnvironment();
    if (!envValidation.isValid) {
      console.error('Environment validation failed:', envValidation.error);
      console.error('OPENAI_API_KEY value:', process.env.OPENAI_API_KEY ? `[${process.env.OPENAI_API_KEY.length} chars]` : 'undefined');
      return NextResponse.json(
        { 
          error: `Server configuration error: ${envValidation.error}`,
          errorType: ErrorType.API_ERROR 
        },
        { status: 500 }
      );
    }

    // Log warnings if any (in development only)
    if (envValidation.warnings && currentEnv === 'development') {
      envValidation.warnings.forEach(warning => {
        console.warn('Environment warning:', warning);
      });
    }

    // Get OpenAI configuration
    const config = getOpenAIConfig();

    // Parse and validate request body
    let body: ChatRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          errorType: ErrorType.VALIDATION_ERROR 
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
      return NextResponse.json(
        { 
          error: 'Message is required and cannot be empty',
          errorType: ErrorType.VALIDATION_ERROR 
        },
        { status: 400 }
      );
    }

    // Validate conversation history if provided
    if (body.conversationHistory && !Array.isArray(body.conversationHistory)) {
      return NextResponse.json(
        { 
          error: 'Conversation history must be an array',
          errorType: ErrorType.VALIDATION_ERROR 
        },
        { status: 400 }
      );
    }

    // Build messages array for OpenAI API
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    
    // Add system message for financial advisor context
    const isProModeQuestions = body.message.includes('exactly 3 probing questions') || 
                              body.message.includes('Generate exactly 3 probing questions');
    
    if (!isProModeQuestions) {
      messages.push({
        role: 'system',
        content: `You are Ducati Advisor, a friendly and knowledgeable AI financial advisor helping users make smart purchasing decisions and achieve their financial goals. Your primary mission is to help users reach their first million through better daily financial decisions.

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

Remember: Every dollar saved and invested wisely brings users closer to financial independence. Help them see how today's smart choices lead to tomorrow's wealth.`
      });
    }
    
    // Add web search system message if requested
    if (body.useWebSearch) {
      messages.push({
        role: 'system',
        content: 'You have access to web search. Use it to find current market information, pricing trends, and expert reviews when analyzing this purchase. Search for recent reviews, pricing history, and upcoming alternatives or models. Include specific findings from your web search in your response.'
      });
    }
    
    // Add conversation history if provided
    if (body.conversationHistory && body.conversationHistory.length > 0) {
      for (const historyMessage of body.conversationHistory) {
        if (historyMessage.role && historyMessage.content) {
          messages.push({
            role: historyMessage.role,
            content: historyMessage.content,
          });
        }
      }
    }
    
    // Add current user message (with image if provided)
    if (body.image) {
      // This is a vision request
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: body.message.trim(),
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${body.image}`,
            },
          },
        ],
      });
    } else {
      // Regular text message
      messages.push({
        role: 'user',
        content: body.message.trim(),
      });
    }

    // Create OpenAI client and make request
    const openai = createOpenAIClient();
    
    // Use gpt-4o-search-preview model if web search is requested
    const model = body.useWebSearch ? 'gpt-4o-search-preview' : (body.image ? 'gpt-4o' : config.model);
    
    const completionOptions: CompletionOptions = {
      model: model,
      messages: messages,
    };

    // Add conditional options
    if (!body.useWebSearch) {
      completionOptions.temperature = config.temperature;
    }
    
    // Use more tokens for Pro Mode questions to avoid truncation
    if (isProModeQuestions) {
      completionOptions.max_tokens = 800; // Increased from default for Pro Mode
    } else {
      completionOptions.max_tokens = body.useWebSearch ? 1000 : config.maxTokens;
    }
    
    if (body.useWebSearch) {
      completionOptions.web_search_options = {
        search_context_size: 'high'
      };
    }
    
    // Add response_format for Pro Mode questions
    if (isProModeQuestions) {
      completionOptions.response_format = { type: "json_object" };
    }
    
    const completion = await openai.chat.completions.create(completionOptions);

    // Extract response from OpenAI
    const assistantMessage = completion.choices[0]?.message?.content;
    
    if (!assistantMessage) {
      return NextResponse.json(
        { 
          error: 'No response received from Ducati Advisor service',
          errorType: ErrorType.API_ERROR 
        },
        { status: 500 }
      );
    }

    // Handle Pro Mode questions response specially
    if (isProModeQuestions) {
      try {
        let parsedResponse;
        
        try {
          parsedResponse = JSON.parse(assistantMessage);
        } catch (initialError) {
          console.error('Initial JSON parse failed, attempting to fix truncated JSON');
          console.error('Raw response:', assistantMessage);
          
          // Try to fix truncated JSON
          const fixedJson = attemptToFixTruncatedJSON(assistantMessage);
          if (fixedJson) {
            console.log('Attempting to parse fixed JSON:', fixedJson);
            parsedResponse = JSON.parse(fixedJson);
          } else {
            throw initialError;
          }
        }
        
        // Check if this has the expected "questions" structure
        if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
          // Validate and pass through all fields
          const validatedQuestions = validateProModeQuestions(parsedResponse.questions);
          return NextResponse.json(validatedQuestions);
        }
        
        // If it doesn't have the expected structure, throw an error
        throw new Error('Response missing questions array');
        
      } catch (parseError) {
        console.error('Error parsing Pro Mode questions:', parseError);
        console.error('Raw response:', assistantMessage);
        
        // Return enhanced fallback questions with all fields
        return NextResponse.json([
          {
            id: 'q1',
            text: 'What specific features or capabilities are most important to you in this purchase?',
            placeholder: 'I need it for professional work, specific features like...',
            dimension: 'specs',
            answer_type: 'short_text',
            search_hint: 'Will search for models with these specific features'
          },
          {
            id: 'q2',
            text: 'Have you researched alternatives? What made you choose this particular option?',
            placeholder: 'I looked at X and Y, but this one has...',
            dimension: 'constraints',
            answer_type: 'short_text',
            search_hint: 'Will compare with alternative options mentioned'
          },
          {
            id: 'q3',
            text: 'How soon do you need this item, and are there any upcoming sales or releases you\'re aware of?',
            placeholder: 'I need it by next month, Black Friday is coming...',
            dimension: 'timing',
            answer_type: 'short_text',
            search_hint: 'Will check for sales and release timing'
          }
        ]);
      }
    }

    // Return successful response for non-Pro Mode requests
    return NextResponse.json({
      response: assistantMessage,
    });

  } catch (error) {
    console.error('OpenAI API error:', error);

    // Type guard for error object
    const openAIError = error as { status?: number; code?: string; message?: string };

    // Handle specific OpenAI errors
    if (openAIError.status === 429) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please wait a moment and try again.',
          errorType: ErrorType.RATE_LIMIT_ERROR 
        },
        { status: 429 }
      );
    }

    if (openAIError.status === 401) {
      return NextResponse.json(
        { 
          error: 'Authentication failed. Please contact support.',
          errorType: ErrorType.API_ERROR 
        },
        { status: 500 }
      );
    }

    if (openAIError.status && openAIError.status >= 400 && openAIError.status < 500) {
      return NextResponse.json(
        { 
          error: 'Invalid request to Ducati Advisor service',
          errorType: ErrorType.VALIDATION_ERROR 
        },
        { status: 400 }
      );
    }

    // Handle network/connection errors
    if (openAIError.code === 'ENOTFOUND' || openAIError.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          error: 'Unable to connect to Ducati Advisor service. Please check your connection.',
          errorType: ErrorType.NETWORK_ERROR 
        },
        { status: 503 }
      );
    }

    // Generic error fallback
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred. Please try again.',
        errorType: ErrorType.API_ERROR 
      },
      { status: 500 }
    );
  }
}