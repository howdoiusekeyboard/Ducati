import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRealtimeSession } from '../hooks/useRealtimeSession';
import { useAuth } from './AuthContext';
import { useFirestore } from '../hooks/useFirestore';

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const firestore = useFirestore();
  
  const {
    isSessionActive,
    isConnecting,
    startSession,
    stopSession,
    sendClientEvent,
    events
  } = useRealtimeSession();

  const [financialProfile, setFinancialProfile] = useState(null);

  // Load financial profile for context
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (firestore.isAuthenticated) {
          const profile = await firestore.getProfile();
          if (profile) {
            setFinancialProfile(profile);
            return;
          }
        }
        
        // Fallback to localStorage
        const quickProfile = localStorage.getItem('quickFinancialProfile');
        if (quickProfile) {
          setFinancialProfile(JSON.parse(quickProfile));
        } else {
          const fullProfile = localStorage.getItem('financialProfile');
          if (fullProfile) {
            setFinancialProfile(JSON.parse(fullProfile));
          }
        }
      } catch (error) {
        console.error('Error loading financial profile for voice:', error);
      }
    };

    loadProfile();
  }, [firestore.isAuthenticated]);

  const getPageContext = useCallback(() => {
    const pathname = location.pathname;
    
    if (pathname === '/') {
      return {
        type: 'landing_page',
        context: `You are Ducati's AI Financial Advisor on the main Purchase Advisor page. The user can interact with these features:

APP FEATURES OVERVIEW:
1. **Purchase Analyzer** (Current Page): The main feature where users can:
   - Enter item name and cost
   - Add optional purpose and frequency of use
   - Upload or capture images of items (the app will identify and analyze them)
   - Get AI-powered buy/don't buy recommendations
   - Find cheaper alternatives online
   - See a decision matrix with financial impact

2. **Financial Profile** (/profile): Users can set up their complete financial information:
   - Monthly income and expenses
   - Debt and savings
   - Financial goals
   - This helps you give personalized advice

3. **Quick Financial Profile**: A simplified 6-question version that takes 2 minutes

4. **Ducati Advisor Chat** (/chat): Text or voice conversations with you for financial advice

5. **Financial Dashboard** (/dashboard): Visual overview of financial health

6. **Finance Feed** (/finance-feed): Educational content and tips

7. **Pro Mode** (/pro-mode): Advanced analysis with detailed projections

NAVIGATION HELP:
- If user asks "How do I analyze a purchase?" - Guide them through the form on this page
- If user asks "How do I set up my profile?" - Suggest clicking "Quick Setup" or going to Financial Profile
- If user wants to chat more - Suggest going to Ducati Advisor (/chat)
- If user wants detailed analysis - Mention Pro Mode

USER'S FINANCIAL CONTEXT:
${financialProfile ? `
- Monthly Income: $${financialProfile.monthlyIncome || 'not set'}
- Monthly Expenses: $${financialProfile.monthlyExpenses || 'not set'}
- Savings: $${financialProfile.currentSavings || 'not set'}
- Financial Goal: ${financialProfile.financialGoal || 'not set'}
` : 'No financial profile set up yet - encourage them to do the Quick Setup for personalized advice!'}

Be enthusiastic and helpful! Guide them through using the app effectively.`
      };
    } else if (pathname === '/chat') {
      return {
        type: 'chat_page',
        context: `You're in the Ducati Advisor chat interface. Provide financial advice and help with purchase decisions. ${financialProfile ? `User's monthly net income: $${financialProfile.monthlyIncome - financialProfile.monthlyExpenses}` : ''}`
      };
    } else if (pathname === '/profile') {
      return {
        type: 'profile_page',
        context: 'User is on their Financial Profile page. Help them understand their metrics and how to improve their financial health.'
      };
    } else if (pathname === '/dashboard') {
      return {
        type: 'dashboard_page',
        context: 'User is viewing their Financial Dashboard. Explain the visualizations and metrics shown.'
      };
    } else if (pathname === '/pro-mode') {
      return {
        type: 'pro_mode',
        context: 'User is in Pro Mode for advanced purchase analysis. This provides detailed financial projections and decision matrices.'
      };
    }
    
    return {
      type: 'general',
      context: 'Help the user navigate Ducati and make smart financial decisions. Main features: Purchase Analyzer, Financial Profile, Chat, Dashboard.'
    };
  }, [location.pathname, financialProfile]);

  const startVoiceSession = useCallback(async () => {
    await startSession();
    // Play a subtle start sound (optional)
    const startSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzla0fPTgjMGHm7A7+OZURE');
    startSound.volume = 0.3;
    startSound.play().catch(() => {}); // Ignore errors if audio fails
    
    const pageContext = getPageContext();
    
    // Send system context
    const contextMessage = {
      type: "conversation.item.create",
      event_id: crypto.randomUUID(),
      item: {
        type: "message",
        role: "system",
        content: [{
          type: "input_text",
          text: pageContext.context
        }]
      }
    };
    sendClientEvent(contextMessage);
    
    // Send appropriate greeting
    const greetingText = pageContext.type === 'landing_page' 
      ? `Hey there! I'm your Ducati AI Financial Advisor! I can see you're on the Purchase Analyzer page.
         I can help you decide if you should buy something, guide you through setting up your financial profile,
         or answer any questions about how Ducati works. You can ask me things like "Should I buy this laptop?"
         or "How do I set up my profile?" or "What's Pro Mode?" What would you like help with?`
     : pageContext.type === 'chat_page'
     ? `Welcome back! I'm ready to help with any financial questions or purchase decisions. What's on your mind?`
     : `Hi! I'm here to help you with Ducati. What can I assist you with?`;
    
    const greetingMessage = {
      type: "conversation.item.create",
      event_id: crypto.randomUUID(),
      item: {
        type: "message",
        role: "assistant",
        content: [{
          type: "input_text",
          text: greetingText
        }]
      }
    };
    sendClientEvent(greetingMessage);
    
    // Trigger response
    sendClientEvent({ 
      type: "response.create",
      event_id: crypto.randomUUID()
    });
   
  }, [startSession, sendClientEvent, getPageContext]);

  // Handle navigation commands from voice
  useEffect(() => {
    events.forEach(event => {
      if (event.type === 'response.function_call_arguments.done') {
        if (event.name === 'navigate_to_page') {
          try {
            const args = JSON.parse(event.arguments);
            navigate(args.path);
          } catch (e) {
            console.error('Navigation error:', e);
          }
        }
      }
    });
  }, [events, navigate]);

  const stopVoiceSession = useCallback(() => {
    // Play a subtle stop sound (optional)
    const stopSound = new Audio('data:audio/wav;base64,UklGRl4GAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YToGAAB0XV1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzla0fPTgjMGHm7A7+OZURE');
    stopSound.volume = 0.3;
    stopSound.play().catch(() => {});
    stopSession();
  }, [stopSession]);

  return (
    <VoiceContext.Provider value={{
      isSessionActive,
      isConnecting,
      startVoiceSession,
      stopVoiceSession,
      sendMessage: sendClientEvent,
      events,
      currentPage: location.pathname
    }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within VoiceProvider');
  }
  return context;
};