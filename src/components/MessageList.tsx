'use client';

import React, { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle empty state when no messages exist
  if (messages.length === 0) {
    return (
      <div className="chat-empty-state">
        <div className="empty-state-content">
          <div className="empty-state-icon">💬</div>
          <h3 className="empty-state-title">Welcome to Ducati Advisor!</h3>
          <p className="empty-state-subtitle">
            I&apos;m here to help you make smart purchasing decisions. 
            Ask me about any item you&apos;re thinking of buying, or start a voice conversation!
          </p>
          <div className="empty-state-tips">
            <p className="empty-state-tip">💡 Try asking: &quot;Should I buy a new iPhone?&quot;</p>
            <p className="empty-state-tip">💡 Or: &quot;Help me decide between a laptop and tablet&quot;</p>
            <p className="empty-state-tip">💡 Or click the microphone to talk to me!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-messages" role="log" aria-label="Chat conversation">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message-container ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
        >
          <div className="message-bubble animate-fadeInUp" role="article">
            {/* Message Header */}
            <div className="message-header">
              <span className="message-avatar">{message.role === 'user' ? '🧑' : '💰'}</span>
              <strong className="message-sender">
                {message.role === 'user' ? 'You' : 'Ducati'}
                {message.isVoice && <span className="voice-badge">🎤</span>}
              </strong>
            </div>
            
            {/* Message Content - Allow HTML for navigation buttons */}
            <div 
              className="message-content"
              dangerouslySetInnerHTML={{ __html: message.content }}
            />
            
            {/* Message Timestamp */}
            <div className="message-timestamp" aria-label={`Sent at ${message.timestamp.toLocaleTimeString()}`}>
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      ))}
      {/* Auto-scroll target */}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;