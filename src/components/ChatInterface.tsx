// src/components/ChatInterface.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Mic, Trash2, ShoppingCart, User } from 'lucide-react';
import { Message } from '@/types/chat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

import VoiceWelcomeScreen from './VoiceWelcomeScreen';
import { useChatApi } from '../hooks/useChatApi';
import { useVoice } from '../contexts/VoiceContext';
import { useFirestore } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';

const ChatInterface: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const { sendMessage, isLoading } = useChatApi();
  const firestore = useFirestore();
  const { user } = useAuth();

  // Add state for financial profile and voice welcome
  const [financialProfile, setFinancialProfile] = useState<any>(null);
  const [hasSeenVoiceWelcome, setHasSeenVoiceWelcome] = useState(() => {
    return localStorage.getItem('hasSeenVoiceWelcome') === 'true';
  });
  const [isManualClear, setIsManualClear] = useState(false);

  const { isSessionActive, isConnecting, startVoiceSession, stopVoiceSession, events } = useVoice();

  // Add useEffect to load financial profile
  useEffect(() => {
    const loadFinancialProfile = async () => {
      try {
        // First try to get the full profile
        if (firestore.isAuthenticated) {
          const profile = await firestore.getProfile();
          if (profile) {
            setFinancialProfile(profile);
            return;
          }
        }

        // Fallback to progressive profile
        const progressiveProfile = localStorage.getItem('quickFinancialProfile');
        if (progressiveProfile) {
          setFinancialProfile(JSON.parse(progressiveProfile));
        }
      } catch (error) {
        console.error('Error loading financial profile:', error);
      }
    };

    loadFinancialProfile();
  }, [firestore.isAuthenticated]);

  // Cleanup voice session when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      if (isSessionActive) {
        console.log('🚪 ChatInterface unmounting, stopping active voice session');
        stopVoiceSession();
      }
    };
  }, [isSessionActive, stopVoiceSession]);

  // Load chat history on component mount and auto-start voice for new users
  useEffect(() => {
    const loadChatHistory = async () => {
      // Don't run if this is a manual clear
      if (isManualClear) return;

      let isNewUser = false;

      if (firestore.isAuthenticated) {
        const firestoreChat = await firestore.getChat();
        if (firestoreChat && firestoreChat.messages) {
          setMessages(firestoreChat.messages);
          return;
        }
      }

      // Fallback to localStorage
      const savedMessages = localStorage.getItem('chatHistory');
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(parsedMessages);
        } catch (error) {
          console.error('Error loading chat history:', error);
        }
      } else {
        isNewUser = true;
      }

      // If no chat history exists, auto-start voice session for verbal welcome
      if (
        isNewUser &&
        (!firestore.isAuthenticated || !(await firestore.getChat())?.messages?.length)
      ) {
        // Show a brief text message while starting voice session
        const preparingMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            '🎤 Starting voice introduction... Please allow microphone access when prompted!',
          timestamp: new Date(),
          isVoice: false,
        };
        setMessages([preparingMessage]);

        // Auto-start voice session - the hook will handle the verbal welcome
        setTimeout(async () => {
          try {
            await startVoiceSession();
          } catch (error) {
            console.error('Failed to start voice session for welcome:', error);
            // Fallback to text welcome if voice fails
            const fallbackMessage: Message = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `Hey. I'm Ducati. I help you not blow money on things you'll regret.

Tell me what you're thinking of buying — or just ask. The voice button works too if you'd rather talk than type.`,
              timestamp: new Date(),
              isVoice: false,
            };
            setMessages([fallbackMessage]);
          }
        }, 500);
      }
    };

    loadChatHistory();
  }, [firestore.isAuthenticated, startVoiceSession, isManualClear]);

  // Save messages whenever they change
  useEffect(() => {
    const saveMessages = async () => {
      if (messages.length > 0) {
        if (firestore.isAuthenticated) {
          await firestore.saveChat(messages);
        } else {
          localStorage.setItem('chatHistory', JSON.stringify(messages));
        }
      }
    };

    saveMessages();
  }, [messages, firestore.isAuthenticated]);

  // Process voice session events and add them to chat history
  useEffect(() => {
    if (events.length > 0) {
      setIsManualClear(false);
      const latestEvent = events[0];

      // Handle different types of voice events
      if (latestEvent.type === 'conversation.item.input_audio_transcription.completed') {
        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: 'user',
          content: latestEvent.transcript,
          timestamp: new Date(),
          isVoice: true,
        };
        setMessages((prev) => [...prev, userMessage]);
      } else if (latestEvent.type === 'response.audio_transcript.done') {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: latestEvent.transcript,
          timestamp: new Date(),
          isVoice: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else if (latestEvent.type === 'ui.show_navigation_prompt') {
        // Show navigation prompt as a special message
        const navigationMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: latestEvent.data.message,
          timestamp: new Date(),
          isVoice: true,
        };
        setMessages((prev) => [...prev, navigationMessage]);

        // Add navigation button (rendered as <a>; DOMPurify default policy strips event handlers)
        setTimeout(() => {
          const buttonMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `<a href="/" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; margin: 8px 0; display: inline-block; text-decoration: none;">Go to Purchase Analyzer →</a>`,
            timestamp: new Date(),
            isVoice: true,
          };
          setMessages((prev) => [...prev, buttonMessage]);
        }, 500);
      }
    }
  }, [events, navigate]);

  const handleSendMessage = async (messageContent: string) => {
    setIsManualClear(false);
    if (isSessionActive) {
      const event = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text: messageContent }],
        },
      };
      // Voice events now handled by global voice context
    } else {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageContent,
        timestamp: new Date(),
        isVoice: false,
      };
      setMessages((prev) => [...prev, userMessage]);

      const response = await sendMessage(
        messageContent,
        [...messages, userMessage],
        financialProfile
      );

      if (response) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          isVoice: false,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    }
  };

  const clearChatHistory = async () => {
    setIsManualClear(true);
    setMessages([]);
    if (firestore.isAuthenticated) {
      await firestore.saveChat([]);
    } else {
      localStorage.removeItem('chatHistory');
    }
  };

  // Update the handleStartSession function to include financial context
  const handleStartSessionWithContext = async () => {
    await startVoiceSession();

    // Send financial context to the voice session
    if (isSessionActive && financialProfile) {
      const contextMessage = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: `User's Financial Context: Monthly income: $${financialProfile.monthlyIncome || 'not provided'}. Monthly expenses: $${financialProfile.monthlyExpenses || 'not provided'}. Savings: $${financialProfile.currentSavings || 'not provided'}. Emergency fund: ${financialProfile.hasEmergencyFund ? 'Yes' : 'No'}. Primary goal: ${financialProfile.financialGoal || 'not specified'}. Use this context to provide personalized financial advice.`,
            },
          ],
        },
      };
      // Context now handled by global voice provider
    }

    // Add welcome message with personalized greeting
    const welcomeMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `🎤 Voice session started! ${financialProfile ? `I have your financial profile loaded and ready to give you personalized advice.` : "I'm listening..."} Feel free to ask me about any purchase you're considering!`,
      timestamp: new Date(),
      isVoice: true,
    };
    setMessages((prev) => [...prev, welcomeMessage]);
  };

  // Enhanced start session with greeting (keep for backward compatibility)
  const handleStartSession = async () => {
    await startVoiceSession();
  };

  const VoiceControlButton = () => {
    if (isConnecting) {
      return (
        <button disabled className="btn btn-secondary btn-sm">
          <span className="loading-spinner"></span>
          Connecting...
        </button>
      );
    }
    if (isSessionActive) {
      return (
        <button
          onClick={stopVoiceSession}
          className="btn btn-danger btn-sm"
          title="Click to stop microphone and end voice session"
        >
          🔴 Stop Microphone
        </button>
      );
    }
    return (
      <button
        onClick={handleStartSession}
        className="btn btn-primary btn-sm"
        title="Click to start voice session with microphone"
      >
        🎤 Start Voice Session
      </button>
    );
  };

  return (
    <div className="chat-page-container">
      <div className={`chat-interface-centered ${isSessionActive ? 'voice-active' : ''}`}>
        {/* Show welcome screen for new users */}
        {messages.length === 0 && !hasSeenVoiceWelcome && !isManualClear && (
          <VoiceWelcomeScreen
            onDismiss={() => {
              setHasSeenVoiceWelcome(true);
              localStorage.setItem('hasSeenVoiceWelcome', 'true');
            }}
            onStartVoice={() => {
              setHasSeenVoiceWelcome(true);
              localStorage.setItem('hasSeenVoiceWelcome', 'true');
              startVoiceSession();
            }}
          />
        )}

        {/* Existing chat header - simplified */}
        <div className="chat-header">
          <div className="chat-header-content">
            <h2 className="chat-title">
              <MessageCircle className="chat-icon" aria-hidden="true" />
              <span className="chat-title-text">
                Advisor
                {isSessionActive && (
                  <span className="voice-indicator">
                    <Mic className="inline size-3" aria-hidden="true" /> Live
                  </span>
                )}
              </span>
            </h2>
            <div className="chat-controls">
              {messages.length > 0 && (
                <button
                  onClick={clearChatHistory}
                  className="btn btn-secondary btn-sm clear-history-btn"
                >
                  <Trash2 className="btn-icon-only" aria-hidden="true" />
                  <span className="btn-text-desktop">Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <MessageList messages={messages} />

        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading || isSessionActive}
          placeholder={
            isSessionActive
              ? 'Voice session active — speak to Ducati.'
              : 'Ask about a purchase.'
          }
        />

        {/* Quick Actions */}
        <div className="quick-actions">
          <button onClick={() => navigate('/')} className="quick-action-btn">
            <ShoppingCart className="quick-action-icon" aria-hidden="true" />
            <span className="quick-action-text">Analyze purchase</span>
          </button>
          <button onClick={() => navigate('/profile')} className="quick-action-btn">
            <User className="quick-action-icon" aria-hidden="true" />
            <span className="quick-action-text">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
