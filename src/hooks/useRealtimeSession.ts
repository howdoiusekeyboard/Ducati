// src/hooks/useRealtimeSession.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SessionEvent {
  type: string;
  timestamp?: string;
  [key: string]: any;
}

export const useRealtimeSession = () => {
  const router = useRouter();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [sessionConfig, setSessionConfig] = useState<any>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  // Handle function calls from the model
  const handleFunctionCall = useCallback((event: SessionEvent) => {
    const { name, call_id, arguments: args } = event;

    if (name === 'navigate_to_purchase_analyzer') {
      const parsedArgs = JSON.parse(args);
      // Send function result back
      const resultEvent = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: call_id,
          output: JSON.stringify({
            success: true,
            message: "Ready to analyze the purchase"
          })
        }
      };
      // We'll need to handle sendClientEvent differently since it's not defined yet
      if (dataChannel.current?.readyState === 'open') {
        const eventWithId = { ...resultEvent, event_id: crypto.randomUUID() };
        dataChannel.current.send(JSON.stringify(eventWithId));
      }

      // Trigger response generation
      if (dataChannel.current?.readyState === 'open') {
        const responseEvent = { type: "response.create", event_id: crypto.randomUUID() };
        dataChannel.current.send(JSON.stringify(responseEvent));
      }
    } else if (name === 'get_financial_tip') {
      const parsedArgs = JSON.parse(args);
      const tips: { [key: string]: string } = {
        saving: "A great way to save is the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.",
        investing: "Start investing early to take advantage of compound interest. Even small amounts can grow significantly over time.",
        budgeting: "Track every expense for a month to understand where your money goes. You'll be surprised by what you find!",
        debt: "Focus on paying off high-interest debt first while making minimum payments on everything else.",
        emergency_fund: "Aim to save 3-6 months of expenses in an emergency fund before making major purchases.",
        purchase_decisions: "Wait 24-48 hours before making non-essential purchases. This cooling-off period often prevents impulse buys."
      };

      const resultEvent = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: call_id,
          output: JSON.stringify({
            tip: tips[parsedArgs.topic] || tips.purchase_decisions
          })
        }
      };

      if (dataChannel.current?.readyState === 'open') {
        const eventWithId = { ...resultEvent, event_id: crypto.randomUUID() };
        dataChannel.current.send(JSON.stringify(eventWithId));
      }

      // Trigger response generation
      if (dataChannel.current?.readyState === 'open') {
        const responseEvent = { type: "response.create", event_id: crypto.randomUUID() };
        dataChannel.current.send(JSON.stringify(responseEvent));
      }
    }
  }, []);

  // Show a prompt to navigate to purchase analyzer
  const showPurchaseAnalyzerPrompt = useCallback((itemName: string, estimatedCost?: number) => {
    // Create a visual prompt in the UI
    const promptEvent: SessionEvent = {
      type: 'ui.show_navigation_prompt',
      timestamp: new Date().toLocaleTimeString(),
      data: {
        itemName,
        estimatedCost,
        message: `Ready to analyze your ${itemName} purchase? Click here to use the Purchase Analyzer!`
      }
    };
    setEvents(prev => [promptEvent, ...prev]);
  }, []);

  const startSession = useCallback(async () => {
    console.log('🎤 Starting voice session...');
    setIsConnecting(true);

    try {
      // 1. Get Session Token
      console.log('📡 Fetching session token...');
      const tokenResponse = await fetch('/api/realtime/token', { method: 'POST' });
      const sessionData = await tokenResponse.json();
      console.log('🔑 Session data received:', sessionData);

      if (!sessionData.client_secret?.value) {
        throw new Error('No client secret received from token API');
      }

      const ephemeralKey = sessionData.client_secret.value;

      // 2. Create Peer Connection and Audio Element
      const pc = new RTCPeerConnection();
      peerConnection.current = pc;

      audioElement.current = new Audio();
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => {
        if (audioElement.current) {
          audioElement.current.srcObject = e.streams[0] ?? null;
        }
      };

      // 3. Setup Microphone and Data Channel
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const dc = pc.createDataChannel("oai-events");
      dataChannel.current = dc;

      // Add event listeners for the data channel
      dc.onopen = () => {
        setIsSessionActive(true);
        setIsConnecting(false);
        setEvents([]); // Clear previous events

        // Send initial greeting and trigger response
        const greetingEvent = {
          type: "conversation.item.create",
          event_id: crypto.randomUUID(),
          item: {
            type: "message",
            role: "assistant",
            content: [{
              type: "input_text",
              text: "Hey there! I'm your Ducati Advisor, and I'm genuinely excited to help you make smarter money decisions. You know that feeling when you're about to buy something and you're not quite sure if it's the right move? That's exactly where I come in. I'm here to be your financial wingman - whether you're debating a big purchase, trying to figure out your budget, or just want to chat about money stuff. We can talk just like this with voice, or you can type to me anytime. I'm not here to judge your spending - we've all been there with impulse buys! I'm here to help you think through decisions so you feel confident about your choices. So... what's on your mind? Got a purchase you're considering? Want to talk budgets? Or maybe you just want to see what I'm all about? I'm all ears!"
            }]
          }
        };
        dc.send(JSON.stringify(greetingEvent));

        // Trigger the AI to actually speak the greeting
        const responseEvent = {
          type: "response.create",
          event_id: crypto.randomUUID()
        };
        dc.send(JSON.stringify(responseEvent));
      };

      dc.onmessage = (e) => {
        const event = JSON.parse(e.data);
        event.timestamp = new Date().toLocaleTimeString();
        setEvents(prev => [event, ...prev]);

        // Handle session events
        if (event.type === 'session.created' || event.type === 'session.updated') {
          setSessionConfig(event.session);
        }

        // Handle function calls
        if (event.type === 'response.function_call_arguments.done') {
          handleFunctionCall(event);
        }

        // Handle completed responses for navigation hints
        if (event.type === 'response.done') {
          const response = event.response;
          if (response && response.output) {
            response.output.forEach((output: any) => {
              if (output.type === 'function_call' && output.name === 'navigate_to_purchase_analyzer') {
                // Parse the arguments
                try {
                  const args = JSON.parse(output.arguments);
                  showPurchaseAnalyzerPrompt(args.item_name, args.estimated_cost);
                } catch (e) {
                  console.error('Error parsing function arguments:', e);
                }
              }
            });
          }
        }
      };

      dc.onclose = () => {
        // Call stopSession when data channel closes
        if (peerConnection.current) {
          peerConnection.current.getSenders().forEach((sender) => {
            if (sender.track) {
              sender.track.stop();
            }
          });
          peerConnection.current.close();
          peerConnection.current = null;
        }

        if (audioElement.current) {
          audioElement.current.pause();
          audioElement.current.srcObject = null;
          audioElement.current = null;
        }

        setIsSessionActive(false);
        setIsConnecting(false);
        setEvents([]);
      };

      // 4. SDP Offer/Answer Handshake
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-realtime`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      });

      const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

    } catch (error) {
      console.error("Failed to start session:", error);
      setIsConnecting(false);
    }
  }, [handleFunctionCall, showPurchaseAnalyzerPrompt]);

  const stopSession = useCallback(() => {
    console.log('🛑 Stopping voice session');

    // Close data channel
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }

    // Stop all media tracks (microphone) and close peer connection
    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) {
          console.log('🎤 Stopping microphone track via stopSession');
          sender.track.stop();
        }
      });
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Clean up audio element
    if (audioElement.current) {
      audioElement.current.pause();
      audioElement.current.srcObject = null;
      audioElement.current = null;
    }

    setIsSessionActive(false);
    setIsConnecting(false);
    setEvents([]);

    console.log('✅ Voice session stopped successfully');
  }, []);

  // Function to send events (like text messages) over the data channel
  const sendClientEvent = useCallback((message: object) => {
    if (dataChannel.current?.readyState === 'open') {
      const eventWithId = { ...message, event_id: crypto.randomUUID() };
      dataChannel.current.send(JSON.stringify(eventWithId));

      // Also add it to our local event log for display
      const displayEvent: SessionEvent = {
        ...eventWithId,
        type: (eventWithId as any).type || 'client_event',
        timestamp: new Date().toLocaleTimeString()
      };
      setEvents(prev => [displayEvent, ...prev]);
    }
  }, []);



  // Update session configuration
  const updateSession = useCallback((updates: any) => {
    if (dataChannel.current?.readyState === 'open') {
      const updateEvent = {
        type: "session.update",
        session: updates
      };
      sendClientEvent(updateEvent);
    }
  }, [sendClientEvent]);

  // Cleanup effect to stop session when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      // Cleanup function runs when component unmounts
      console.log('🧹 Cleaning up voice session on component unmount');

      // Clean up resources directly in the cleanup function
      if (dataChannel.current) {
        dataChannel.current.close();
        dataChannel.current = null;
      }

      if (peerConnection.current) {
        peerConnection.current.getSenders().forEach((sender) => {
          if (sender.track) {
            console.log('🎤 Stopping microphone track');
            sender.track.stop();
          }
        });
        peerConnection.current.close();
        peerConnection.current = null;
      }

      if (audioElement.current) {
        audioElement.current.pause();
        audioElement.current.srcObject = null;
        audioElement.current = null;
      }

      console.log('✅ Voice session cleanup completed');
    };
  }, []); // Empty dependency array ensures this only runs on unmount

  // Handle page visibility changes (when user switches tabs or minimizes browser)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isSessionActive) {
        // Optionally stop session when page becomes hidden
        // Uncomment the line below if you want to stop on tab switch
        // stopSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSessionActive, stopSession]);

  // Handle browser tab close or navigation away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isSessionActive || isConnecting) {
        stopSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSessionActive, isConnecting, stopSession]);

  return {
    isSessionActive,
    isConnecting,
    events,
    sessionConfig,
    startSession,
    stopSession,
    sendClientEvent,
    updateSession
  };
};