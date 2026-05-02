// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, isFirebaseConfigured, isFirebaseInitialized, retryFirebaseInit } from '@/lib/firebase';
import { createUserDocument } from '@/lib/firestore/services';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isFirebaseReady: boolean;
  signOut: () => Promise<void>;
  retryInit: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  isFirebaseReady: false,
  signOut: async () => {},
  retryInit: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  // Initialize Firebase and set up auth listener
  const initializeAuth = useCallback(() => {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Please check your environment variables.');
      setLoading(false);
      setIsFirebaseReady(false);
      console.error('❌ AuthContext: Firebase not configured');
      return;
    }

    // Check if Firebase is initialized
    if (!isFirebaseInitialized()) {
      // Try to initialize Firebase
      const success = retryFirebaseInit();
      if (!success) {
        setError('Failed to initialize Firebase. Please check your configuration.');
        setLoading(false);
        setIsFirebaseReady(false);
        console.error('❌ AuthContext: Firebase initialization failed');
        return;
      }
    }

    // Check if auth service is available
    if (!auth) {
      setError('Firebase Auth service is not available.');
      setLoading(false);
      setIsFirebaseReady(false);
      console.error('❌ AuthContext: Auth service not available');
      return;
    }

    setIsFirebaseReady(true);
    setError(null);

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        console.log('🔐 Auth state changed:', user ? 'User logged in' : 'User logged out');
        setUser(user);
        setLoading(false);

        // Create/update user document in Firestore if user is logged in
        if (user) {
          try {
            await createUserDocument(user);
            console.log('✅ User document created/updated');
          } catch (error) {
            console.error('Failed to create user document:', error);
            // Don't block auth flow for Firestore errors
          }
        }
      },
      (error) => {
        console.error('❌ Auth state listener error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initializeAuth]);

  const handleSignOut = async () => {
    if (!auth) {
      console.error('Cannot sign out: Auth service not available');
      return;
    }

    try {
      await firebaseSignOut(auth);
      setUser(null);
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
      throw error;
    }
  };

  const retryInit = () => {
    console.log('🔄 Retrying Firebase initialization from AuthContext...');
    initializeAuth();
  };

  const value = {
    user,
    loading,
    error,
    isFirebaseReady,
    signOut: handleSignOut,
    retryInit,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
