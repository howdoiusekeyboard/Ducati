'use client';

import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

interface AuthComponentProps {
  onSignInSuccess?: (user: User) => void;
}

// Identity Toolkit returns the same code for "email doesn't exist" and "wrong
// password" when email-enumeration protection is enabled in the Firebase project.
// We can't tell the two apart from the sign-in error alone — the create-account
// fallback below disambiguates by triggering 'auth/email-already-in-use' when
// the email IS registered.
const SIGNIN_AMBIGUOUS_CODES = new Set([
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/user-not-found',
  'auth/wrong-password',
]);

const friendlyAuthError = (code: string | undefined): string => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Check your password and try again.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in window was closed before completing.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and retry.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
};

const errorCodeOf = (e: unknown): string | undefined =>
  typeof e === 'object' && e !== null && 'code' in e
    ? String((e as { code?: unknown }).code)
    : undefined;

const AuthComponent: React.FC<AuthComponentProps> = ({ onSignInSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isFirebaseConfigured() || !auth) {
    return (
      <div className="auth-error">
        <h3>Authentication unavailable</h3>
        <p>Firebase configuration is missing or initialization failed.</p>
      </div>
    );
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      try {
        const result = await signInWithEmailAndPassword(auth!, email.trim(), password);
        onSignInSuccess?.(result.user);
        return;
      } catch (signInErr) {
        const code = errorCodeOf(signInErr);
        if (!SIGNIN_AMBIGUOUS_CODES.has(code ?? '')) {
          setError(friendlyAuthError(code));
          return;
        }
        // Sign-in failed with the ambiguous "wrong creds OR new email" code.
        // Try creating the account; if Firebase responds 'email-already-in-use'
        // we know the original failure was actually wrong-password and surface
        // that, otherwise the create succeeds and the user is signed in.
        try {
          const created = await createUserWithEmailAndPassword(auth!, email.trim(), password);
          const displayName = name.trim() || email.trim().split('@')[0];
          if (displayName) {
            await updateProfile(created.user, { displayName });
          }
          onSignInSuccess?.(created.user);
        } catch (createErr) {
          setError(friendlyAuthError(errorCodeOf(createErr)));
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth!, provider);
      onSignInSuccess?.(result.user);
    } catch (err) {
      setError(friendlyAuthError(errorCodeOf(err)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={submitting}
        className="auth-google-btn"
      >
        Continue with Google
      </button>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <form className="auth-email-form" onSubmit={handleEmailSubmit} noValidate>
        <label className="auth-field">
          <span className="auth-field-label">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
            autoComplete="email"
          />
        </label>
        <label className="auth-field">
          <span className="auth-field-label">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={submitting}
            autoComplete="current-password"
          />
        </label>
        <label className="auth-field">
          <span className="auth-field-label">Name (used if creating a new account)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            autoComplete="name"
            placeholder="Optional"
          />
        </label>
        {error && (
          <p className="auth-error-msg" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={submitting} className="auth-submit-btn">
          {submitting ? 'Working…' : 'Sign in / Sign up'}
        </button>
        <p className="auth-helper-note">
          New here? Submit your email and a password — we&apos;ll create your account. Already
          registered? Submit your existing password and you&apos;ll be signed in.
        </p>
      </form>
    </div>
  );
};

export default AuthComponent;
