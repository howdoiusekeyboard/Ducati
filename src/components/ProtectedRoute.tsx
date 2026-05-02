'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import LoginPage from './LoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // If Firebase is not configured, show configuration error
  if (!isFirebaseConfigured()) {
    return (
      <div className="config-error-page">
        <div className="config-error-container">
          <h1>🔧 Setup Required</h1>
          <p>Firebase authentication is not configured yet.</p>
          <div className="setup-instructions">
            <h3>To get started:</h3>
            <ol>
              <li>Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
              <li>Enable Authentication with Google and Email/Password providers</li>
              <li>Copy your Firebase config to <code>.env.local</code></li>
              <li>Restart your development server</li>
            </ol>
            <p>See <code>FIREBASE_AUTH_SETUP.md</code> for detailed instructions.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;