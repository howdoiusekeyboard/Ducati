'use client';

import React from 'react';
import { Bot } from 'lucide-react';

interface LoadingIndicatorProps {
  isLoading: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="mx-6 mt-4">
      <div
        className="bg-primary/5 border-primary/20 animate-fadeIn rounded-lg border p-4"
        aria-live="polite"
        aria-label="Loading message"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="relative">
              {/* Animated dots */}
              <div className="flex items-center gap-1">
                <div className="bg-primary animate-dot-flashing h-2 w-2 rounded-full"></div>
                <div
                  className="bg-primary animate-dot-flashing h-2 w-2 rounded-full"
                  style={{ animationDelay: '0.5s' }}
                ></div>
                <div
                  className="bg-primary animate-dot-flashing h-2 w-2 rounded-full"
                  style={{ animationDelay: '1s' }}
                ></div>
              </div>
            </div>
          </div>
          <div className="ml-4">
            <div className="mb-1 flex items-center gap-2">
              <Bot className="text-primary size-4" aria-hidden="true" />
              <span className="text-primary text-sm font-medium">Ducati</span>
            </div>
            <p className="text-text-medium text-sm italic">Thinking and generating response...</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoadingIndicator;
