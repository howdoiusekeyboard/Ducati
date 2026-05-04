import { useState, useCallback } from 'react';
import { Message, ErrorType } from '@/types/chat';

interface ChatError {
  message: string;
  type: ErrorType;
}

interface UseChatApiReturn {
  sendMessage: (message: string, history: Message[], profile?: Record<string, unknown> | null) => Promise<string | null>;
  isLoading: boolean;
  error: ChatError | null;
  clearError: () => void;
  retry: () => Promise<string | null>;
}

export const useChatApi = (): UseChatApiReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [lastRequest, setLastRequest] = useState<{ message: string; history: Message[]; profile?: Record<string, unknown> | null } | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendMessage = useCallback(async (message: string, history: Message[], profile?: Record<string, unknown> | null): Promise<string | null> => {
    setLastRequest({ message, history, profile });
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationHistory: history.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          profile: profile ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorType = data.errorType || getErrorTypeFromStatus(response.status);
        const error = new Error(data.error || `HTTP error! status: ${response.status}`);
        (error as any).errorType = errorType;
        (error as any).status = response.status;
        throw error;
      }

      if (data.error) {
        const error = new Error(data.error);
        (error as any).errorType = data.errorType || ErrorType.API_ERROR;
        throw error;
      }

      return data.response;
    } catch (err: any) {
      const errorType = err.errorType || getErrorType(err);
      setError({
        message: getErrorMessage(err, errorType),
        type: errorType
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(async (): Promise<string | null> => {
    if (lastRequest) {
      return await sendMessage(lastRequest.message, lastRequest.history, lastRequest.profile);
    }
    return null;
  }, [lastRequest, sendMessage]);

  return { sendMessage, isLoading, error, clearError, retry };
};

function getErrorTypeFromStatus(status: number): ErrorType {
  if (status === 429) return ErrorType.RATE_LIMIT_ERROR;
  if (status === 400) return ErrorType.VALIDATION_ERROR;
  if (status >= 500) return ErrorType.NETWORK_ERROR;
  return ErrorType.API_ERROR;
}

function getErrorType(error: any): ErrorType {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return ErrorType.NETWORK_ERROR;
  }
  return ErrorType.API_ERROR;
}

function getErrorMessage(error: any, type: ErrorType): string {
  switch (type) {
    case ErrorType.NETWORK_ERROR:
      return 'Unable to connect to the server. Please check your internet connection.';
    case ErrorType.RATE_LIMIT_ERROR:
      return 'Too many requests sent. Please wait a moment before sending another message.';
    case ErrorType.VALIDATION_ERROR:
      return 'There was an issue with your message. Please try rephrasing and send again.';
    case ErrorType.API_ERROR:
    default:
      if (error.status === 401) {
        return 'Authentication failed. Please contact support.';
      }
      if (error.status >= 500) {
        return 'The Ducati Advisor service is temporarily unavailable. Please try again in a few moments.';
      }
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}
