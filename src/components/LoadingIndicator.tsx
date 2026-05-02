'use client';

import React from 'react';

interface LoadingIndicatorProps {
  isLoading: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="mx-6 mt-4">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 animate-fadeIn" aria-live="polite" aria-label="Loading message">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="relative">
              {/* Animated dots */}
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-dot-flashing"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-dot-flashing" style={{ animationDelay: '0.5s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-dot-flashing" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
          <div className="ml-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-primary">🤖 Ducati Advisor</span>
            </div>
            <p className="text-sm text-text-medium italic">Thinking and generating response...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LoadingIndicator;
