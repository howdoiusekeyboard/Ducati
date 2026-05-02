import React, { useState, useEffect } from 'react';
import { useVoice } from '../contexts/VoiceContext';

const FloatingVoiceButton = () => {
  const { 
    isSessionActive, 
    isConnecting, 
    startVoiceSession, 
    stopVoiceSession,
    currentPage 
  } = useVoice();
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Show tooltip for first-time users on landing page
  useEffect(() => {
    if (currentPage === '/' && !localStorage.getItem('hasSeenVoiceTooltip')) {
      setTimeout(() => {
        setShowTooltip(true);
        setPulseAnimation(true);
        localStorage.setItem('hasSeenVoiceTooltip', 'true');
        
        // Hide tooltip after 7 seconds
        setTimeout(() => setShowTooltip(false), 7000);
      }, 3000);
    }
  }, [currentPage]);

  const handleClick = () => {
    setShowTooltip(false);
    if (isSessionActive) {
      stopVoiceSession();
    } else if (!isConnecting) {
      startVoiceSession();
    }
  };

  // Don't show on certain pages
  if (currentPage === '/login' || currentPage === '/terms' || currentPage === '/privacy') {
    return null;
  }

  return (
    <div className="floating-voice-container">
      {showTooltip && (
        <div className="voice-tooltip animate-slideInBounce">
          <div className="tooltip-content">
            <span className="tooltip-icon">👋</span>
            <div>
              <p className="tooltip-title">Your AI Financial Advisor</p>
              <p className="tooltip-text">
                Click the microphone to talk to me! Ask about purchases, get financial advice, or learn how to use Ducati.
              </p>
            </div>
          </div>
          <div className="tooltip-arrow"></div>
          <button 
            className="tooltip-close"
            onClick={() => setShowTooltip(false)}
            aria-label="Close tooltip"
          >
            ×
          </button>
        </div>
      )}
      
      <button
        className={`floating-voice-btn ${isSessionActive ? 'active' : ''} ${isConnecting ? 'connecting' : ''} ${pulseAnimation ? 'pulse-attention' : ''}`}
        onClick={handleClick}
        disabled={isConnecting}
        aria-label={isSessionActive ? 'Stop voice session' : 'Start voice session'}
      >
        <div className="voice-btn-inner">
          {isConnecting ? (
            <>
              <div className="voice-connecting-spinner"></div>
              <span className="voice-btn-icon">🎤</span>
            </>
          ) : isSessionActive ? (
            <>
              <div className="voice-pulse-ring"></div>
              <div className="voice-pulse-ring delay"></div>
              <span className="voice-btn-icon recording">🔴</span>
            </>
          ) : (
            <>
              <span className="voice-btn-icon">🎤</span>
              <div className="voice-sparkle sparkle-1">✨</div>
              <div className="voice-sparkle sparkle-2">✨</div>
              <div className="voice-sparkle sparkle-3">✨</div>
            </>
          )}
        </div>
      </button>
      
      <div className={`voice-status-badge ${isSessionActive ? 'active' : ''}`}>
        {isSessionActive ? 'Voice Active' :
         currentPage === '/' ? 'Ask me anything!' :
         'Tap to Talk'}
      </div>
    </div>
  );
};

export default FloatingVoiceButton;