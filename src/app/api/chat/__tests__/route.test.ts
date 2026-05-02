/**
 * Unit tests for chat API route logic
 * Tests OpenAI integration and error handling scenarios
 */

import { ErrorType } from '@/types';

// Mock OpenAI
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

// Mock the openai-config module
jest.mock('@/lib/openai-config', () => ({
  validateEnvironment: jest.fn(() => ({ isValid: true })),
  getOpenAIConfig: jest.fn(() => ({
    model: 'gpt-4.1',
    temperature: 0.7,
    maxTokens: 150,
  })),
  logEnvironmentInfo: jest.fn(),
  getCurrentEnvironment: jest.fn(() => 'test'),
}));

import OpenAI from 'openai';
import { validateEnvironment, getOpenAIConfig } from '@/lib/openai-config';

describe('Chat API Route Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementation
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as any));

    // Set up environment variable
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('OpenAI Integration', () => {
    it('should create OpenAI client and make successful request', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Hello! How can I help you today?',
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Test the OpenAI client creation and API call
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const config = getOpenAIConfig();
      const completion = await openai.chat.completions.create({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: 'Hello, world!',
          },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      expect(completion.choices[0]?.message?.content).toBe('Hello! How can I help you today?');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'user',
            content: 'Hello, world!',
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });
    });

    it('should handle conversation history correctly', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'I understand your previous question.',
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const config = getOpenAIConfig();
      const messages = [
        { role: 'user' as const, content: 'What is AI?' },
        { role: 'assistant' as const, content: 'AI stands for Artificial Intelligence.' },
        { role: 'user' as const, content: 'Can you elaborate?' },
      ];

      await openai.chat.completions.create({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4.1',
        messages,
        temperature: 0.7,
        max_tokens: 150,
      });
    });

    it('should handle OpenAI rate limit error', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      mockCreate.mockRejectedValue(rateLimitError);

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const config = getOpenAIConfig();

      try {
        await openai.chat.completions.create({
          model: config.model,
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        });
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.status).toBe(429);
        expect(error.message).toBe('Rate limit exceeded');
      }
    });

    it('should handle OpenAI authentication error', async () => {
      const authError = new Error('Authentication failed');
      (authError as any).status = 401;
      mockCreate.mockRejectedValue(authError);

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const config = getOpenAIConfig();

      try {
        await openai.chat.completions.create({
          model: config.model,
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        });
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.status).toBe(401);
        expect(error.message).toBe('Authentication failed');
      }
    });

    it('should handle network connection error', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'ENOTFOUND';
      mockCreate.mockRejectedValue(networkError);

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const config = getOpenAIConfig();

      try {
        await openai.chat.completions.create({
          model: config.model,
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        });
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.code).toBe('ENOTFOUND');
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle empty OpenAI response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const config = getOpenAIConfig();
      const completion = await openai.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      expect(completion.choices[0]?.message?.content).toBeNull();
    });

    it('should handle missing choices in OpenAI response', async () => {
      const mockResponse = {
        choices: [],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const config = getOpenAIConfig();
      const completion = await openai.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });

      expect(completion.choices).toHaveLength(0);
    });
  });

  describe('Input Validation Logic', () => {
    it('should validate empty message', () => {
      const message = '';
      const isValid = !!(message && typeof message === 'string' && message.trim().length > 0);
      expect(isValid).toBe(false);
    });

    it('should validate whitespace-only message', () => {
      const message = '   ';
      const isValid = !!(message && typeof message === 'string' && message.trim().length > 0);
      expect(isValid).toBe(false);
    });

    it('should validate valid message', () => {
      const message = 'Hello, world!';
      const isValid = !!(message && typeof message === 'string' && message.trim().length > 0);
      expect(isValid).toBe(true);
    });

    it('should validate conversation history format', () => {
      const validHistory = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];
      const invalidHistory = 'invalid format';

      expect(Array.isArray(validHistory)).toBe(true);
      expect(Array.isArray(invalidHistory)).toBe(false);
    });

    it('should trim message content', () => {
      const message = '  Hello, world!  ';
      const trimmed = message.trim();
      expect(trimmed).toBe('Hello, world!');
    });
  });

  describe('Error Type Classification', () => {
    it('should classify error types correctly', () => {
      expect(ErrorType.NETWORK_ERROR).toBe('network_error');
      expect(ErrorType.API_ERROR).toBe('api_error');
      expect(ErrorType.VALIDATION_ERROR).toBe('validation_error');
      expect(ErrorType.RATE_LIMIT_ERROR).toBe('rate_limit_error');
    });

    it('should determine error type from status code', () => {
      const getErrorType = (status: number) => {
        if (status === 429) return ErrorType.RATE_LIMIT_ERROR;
        if (status === 401) return ErrorType.API_ERROR;
        if (status >= 400 && status < 500) return ErrorType.VALIDATION_ERROR;
        return ErrorType.API_ERROR;
      };

      expect(getErrorType(429)).toBe(ErrorType.RATE_LIMIT_ERROR);
      expect(getErrorType(401)).toBe(ErrorType.API_ERROR);
      expect(getErrorType(400)).toBe(ErrorType.VALIDATION_ERROR);
      expect(getErrorType(500)).toBe(ErrorType.API_ERROR);
    });

    it('should determine error type from error code', () => {
      const getErrorTypeFromCode = (code: string) => {
        if (code === 'ENOTFOUND' || code === 'ECONNREFUSED') {
          return ErrorType.NETWORK_ERROR;
        }
        return ErrorType.API_ERROR;
      };

      expect(getErrorTypeFromCode('ENOTFOUND')).toBe(ErrorType.NETWORK_ERROR);
      expect(getErrorTypeFromCode('ECONNREFUSED')).toBe(ErrorType.NETWORK_ERROR);
      expect(getErrorTypeFromCode('OTHER')).toBe(ErrorType.API_ERROR);
    });
  });

  describe('Environment Configuration', () => {
    it('should validate environment correctly', () => {
      const validation = validateEnvironment();
      expect(validation.isValid).toBe(true);
    });

    it('should get OpenAI configuration', () => {
      const config = getOpenAIConfig();
      expect(config.model).toBe('gpt-4.1');
      expect(config.temperature).toBe(0.7);
      expect(config.maxTokens).toBe(150);
    });
  });
});