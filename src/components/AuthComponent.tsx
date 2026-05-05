'use client';

import React, { useEffect, useRef } from 'react';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { GoogleAuthProvider, EmailAuthProvider, Auth } from 'firebase/auth';
import { createUserDocument } from '@/lib/firestore/services';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

interface AuthComponentProps {
  onSignInSuccess?: (user: any) => void;
}

const AuthComponent: React.FC<AuthComponentProps> = ({ onSignInSuccess }) => {
  const uiRef = useRef<firebaseui.auth.AuthUI | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check Firebase configuration and auth availability
  const isConfigured = isFirebaseConfigured();
  const isAuthAvailable = auth !== undefined && auth !== null;

  useEffect(() => {
    if (!isConfigured || !isAuthAvailable) {
      return;
    }

    // Initialize FirebaseUI. firebaseui maintains a global registry keyed by
    // the Auth instance; calling `new AuthUI(auth)` twice for the same key
    // throws "AuthUI instance already exists for the key '[DEFAULT]'".
    // React StrictMode + Next.js fast-refresh both re-run this effect, so
    // we must reuse the existing instance via getInstance() when available.
    if (!uiRef.current && auth) {
      try {
        uiRef.current =
          firebaseui.auth.AuthUI.getInstance() ?? new firebaseui.auth.AuthUI(auth);
      } catch (error) {
        console.error('Failed to initialize FirebaseUI:', error);
        return;
      }
    }

    const uiConfig = {
      callbacks: {
        signInSuccessWithAuthResult: function (authResult: any, redirectUrl?: string) {
          console.log('FirebaseUI sign-in successful:', authResult.user.displayName);

          // Create user document in Firestore
          createUserDocument(authResult.user).catch(console.error);

          if (onSignInSuccess) {
            onSignInSuccess(authResult.user);
          }
          return false; // Don't redirect automatically
        },
        uiShown: function () {
          // Hide the loader when UI is shown
          const loader = document.getElementById('auth-loader');
          if (loader) {
            loader.style.display = 'none';
          }
        },
      },
      signInOptions: [GoogleAuthProvider.PROVIDER_ID, EmailAuthProvider.PROVIDER_ID],
      signInFlow: 'popup',
      tosUrl: '/terms',
      privacyPolicyUrl: '/privacy',
    };

    // Start the FirebaseUI widget
    if (containerRef.current && uiRef.current) {
      try {
        uiRef.current.start(containerRef.current, uiConfig);
      } catch (error) {
        console.error('Failed to start FirebaseUI:', error);
      }
    }

    // Cleanup function
    return () => {
      if (uiRef.current) {
        try {
          uiRef.current.reset();
        } catch (error) {
          console.error('Failed to reset FirebaseUI:', error);
        }
      }
    };
  }, [onSignInSuccess, isConfigured, isAuthAvailable]);

  if (!isConfigured) {
    return (
      <div className="auth-error">
        <h3>Configuration error</h3>
        <p>Firebase environment variables are missing. Check the project&apos;s .env.local.</p>
      </div>
    );
  }

  if (!isAuthAvailable) {
    return (
      <div className="auth-error">
        <h3>Authentication unavailable</h3>
        <p>Could not initialize Firebase authentication. Verify the Firebase config in your environment.</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div id="auth-loader" className="auth-loader">
        <div className="loader-spinner"></div>
        <p>Loading authentication...</p>
      </div>
      <div ref={containerRef} className="firebaseui-auth-container"></div>
    </div>
  );
};

export default AuthComponent;
