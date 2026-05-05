'use client';

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthComponent from './AuthComponent';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignInSuccess = (signedInUser: unknown) => {
    void signedInUser;
    navigate('/');
  };

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (user) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>Signing you in</h1>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Sign in to Ducati</h1>
          <p className="login-subtitle">Ask before you buy.</p>
        </div>

        <div className="auth-section">
          <AuthComponent onSignInSuccess={handleSignInSuccess} />
        </div>

        <div className="login-footer">
          <p>
            By signing in, you agree to our{' '}
            <a href="/terms" className="link">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="link">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
