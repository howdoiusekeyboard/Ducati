'use client';

import React, { useState, FormEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isLoading,
  placeholder = "Type your message here..."
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Input validation to prevent empty messages
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    onSendMessage(trimmedMessage);
    setMessage(''); // Clear input after sending
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter key (but allow Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmedMessage = message.trim();
      if (trimmedMessage && !isLoading) {
        onSendMessage(trimmedMessage);
        setMessage('');
      }
    }
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-wrapper">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Type your message"
            disabled={isLoading}
            rows={1}
            className="chat-textarea"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className={`chat-send-btn ${isLoading || !message.trim() ? 'disabled' : ''}`}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              <span className="btn-text">Sending...</span>
            </>
          ) : (
            <>
              <span className="btn-text">Send</span>
              <span className="send-icon">📤</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default MessageInput;