'use client';

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthComponent from './AuthComponent';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignInSuccess = (user: any) => {
    console.log('User signed in successfully:', user);
    // Redirect to home page after successful login
    navigate('/');
  };

  useEffect(() => {
    // If user is already signed in, redirect to home
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (user) {
    // Show loading while redirecting
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <div className="logo-section">
              <span className="logo-icon">💰</span>
              <h1>Welcome back!</h1>
            </div>
            <p className="login-subtitle">
              Redirecting you to Ducati...
            </p>
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
          <div className="logo-section">
            <span className="logo-icon">💰</span>
            <h1>Welcome to Ducati</h1>
          </div>
          <p className="login-subtitle">
            Get rational advice on your purchasing decisions
          </p>
        </div>
        
        <div className="auth-section">
          <h2>Sign in to continue</h2>
          <AuthComponent onSignInSuccess={handleSignInSuccess} />
        </div>
        
        <div className="login-footer">
          <p>
            By signing in, you agree to our{' '}
            <a href="/terms" className="link">Terms of Service</a>{' '}
            and{' '}
            <a href="/privacy" className="link">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;