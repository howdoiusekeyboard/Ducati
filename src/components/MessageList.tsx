'use client';

import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { MessageCircle, Mic, User, Bot } from 'lucide-react';
import { Message } from '@/types/chat';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="chat-empty-state">
        <div className="empty-state-content">
          <MessageCircle className="empty-state-icon" aria-hidden="true" />
          <h3 className="empty-state-title">Ask before you buy</h3>
          <p className="empty-state-subtitle">
            Describe what you&apos;re thinking of buying. Ducati weighs it against your financial
            profile and returns a verdict.
          </p>
          <div className="empty-state-tips">
            <p className="empty-state-tip">Try: &quot;Should I buy a new iPhone?&quot;</p>
            <p className="empty-state-tip">
              Or: &quot;Help me decide between a laptop and tablet&quot;
            </p>
            <p className="empty-state-tip">Or use voice input.</p>
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
            <div className="message-header">
              <span className="message-avatar" aria-hidden="true">
                {message.role === 'user' ? (
                  <User className="size-4" />
                ) : (
                  <Bot className="size-4" />
                )}
              </span>
              <strong className="message-sender">
                {message.role === 'user' ? 'You' : 'Ducati'}
                {message.isVoice && (
                  <span className="voice-badge" aria-label="voice message">
                    <Mic className="size-3" aria-hidden="true" />
                  </span>
                )}
              </strong>
            </div>

            <div
              className="message-content"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }}
            />

            <div
              className="message-timestamp"
              aria-label={`Sent at ${message.timestamp.toLocaleTimeString()}`}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
