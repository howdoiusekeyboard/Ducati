import React, { Component, ReactNode } from 'react';
import '../styles/FirestoreErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class FirestoreErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Firestore Error Boundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="firestore-error-boundary">
          <div className="error-container">
            <h3>Something went wrong with data synchronization</h3>
            <p>
              We&apos;re having trouble connecting to our servers. Your data is still safe locally.
            </p>
            <details className="error-details">
              <summary>Error Details</summary>
              <pre>{this.state.error?.message}</pre>
            </details>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling Firestore errors in functional components
export const useFirestoreErrorHandler = () => {
  const handleError = (error: any, context: string = 'Firestore operation') => {
    console.error(`${context} failed:`, error);
    
    // You can add more sophisticated error handling here
    // For example, showing toast notifications, logging to external services, etc.
    
    if (error?.code === 'permission-denied') {
      console.warn('Permission denied - user may need to re-authenticate');
    } else if (error?.code === 'unavailable') {
      console.warn('Firestore unavailable - operating in offline mode');
    }
  };

  return { handleError };
};