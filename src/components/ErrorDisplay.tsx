'use client';

import React from 'react';

import { ErrorType } from '@/types/chat';

interface ChatError {
  message: string;
  type: ErrorType;
}

interface ErrorDisplayProps {
  error: ChatError | null;
  onClear: () => void;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClear, onRetry }) => {
  if (!error) return null;

  const config = getErrorConfig(error.type);

  return (
    <div className="mx-6 mt-4">
      <div className={`${config.bgColor} border border-red-200 rounded-lg p-4 animate-fadeIn`} role="alert" aria-live="polite">
        <div className="flex justify-between items-start">
          <div className="flex">
            <div className="flex-shrink-0">
              <ErrorIcon type={error.type} className={`h-5 w-5 ${config.iconColor}`} />
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-danger">Error</span>
              </div>
              <p className={`text-sm ${config.textColor} leading-relaxed`}>{error.message}</p>
              {config.showRetry && (
                <button
                  onClick={onRetry}
                  className="mt-3 inline-flex items-center gap-1 text-xs bg-danger text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors font-medium"
                  aria-label="Retry sending message"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              )}
            </div>
          </div>
          <button 
            onClick={onClear} 
            className="text-text-light hover:text-danger transition-colors p-1 rounded-md hover:bg-red-50" 
            aria-label="Close error message"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function getErrorConfig(type: ErrorType) {
  switch (type) {
    case ErrorType.NETWORK_ERROR:
      return {
        bgColor: 'bg-red-50',
        iconColor: 'text-danger',
        textColor: 'text-red-700',
        showRetry: true
      };
    case ErrorType.RATE_LIMIT_ERROR:
      return {
        bgColor: 'bg-orange-50',
        iconColor: 'text-warning',
        textColor: 'text-orange-700',
        showRetry: true
      };
    case ErrorType.VALIDATION_ERROR:
      return {
        bgColor: 'bg-red-50',
        iconColor: 'text-danger',
        textColor: 'text-red-700',
        showRetry: true
      };
    default:
      return {
        bgColor: 'bg-red-50',
        iconColor: 'text-danger',
        textColor: 'text-red-700',
        showRetry: true
      };
  }
}

function ErrorIcon({ type, className }: { type: ErrorType; className: string }) {
  if (type === ErrorType.NETWORK_ERROR) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    );
  }
  
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );
}

function CloseIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}
export default ErrorDisplay;
