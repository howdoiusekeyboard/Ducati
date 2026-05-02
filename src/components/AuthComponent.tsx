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

        // Initialize FirebaseUI only once
        if (!uiRef.current && auth) {
            try {
                uiRef.current = new firebaseui.auth.AuthUI(auth);
            } catch (error) {
                console.error('Failed to initialize FirebaseUI:', error);
                return;
            }
        }

        const uiConfig = {
            callbacks: {
                signInSuccessWithAuthResult: function (authResult: any, redirectUrl?: string) {
                    console.log("FirebaseUI sign-in successful:", authResult.user.displayName);
                    
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
                }
            },
            signInOptions: [
                GoogleAuthProvider.PROVIDER_ID,
                EmailAuthProvider.PROVIDER_ID,
            ],
            signInFlow: 'popup',
            tosUrl: '/terms',
            privacyPolicyUrl: '/privacy'
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

    // Show configuration error if Firebase is not configured
    if (!isConfigured) {
        return (
            <div className="auth-error">
                <h3>Configuration Error</h3>
                <p>Firebase is not properly configured. Please check your environment variables.</p>
                <details>
                    <summary>Error Details</summary>
                    <p>Make sure all Firebase environment variables are set in your .env.local file.</p>
                </details>
            </div>
        );
    }

    // Show loading state if auth is not available yet
    if (!isAuthAvailable) {
        return (
            <div className="auth-error">
                <h3>Authentication Unavailable</h3>
                <p>Firebase authentication could not be initialized.</p>
                <details>
                    <summary>Troubleshooting</summary>
                    <p>This usually happens when:</p>
                    <ul>
                        <li>Firebase configuration is invalid</li>
                        <li>Network connectivity issues</li>
                        <li>Firebase project settings are incorrect</li>
                    </ul>
                    <p>Please check your Firebase console and environment variables.</p>
                </details>
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