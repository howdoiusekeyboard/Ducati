// src/components/EnvironmentChecker.tsx
import React, { useState, useEffect } from 'react';
import '../styles/EnvironmentChecker.css';

interface ConfigIssue {
  variable: string;
  issue: string;
  value?: string;
  suggestion?: string;
}

interface CheckResult {
  isValid: boolean;
  issues: ConfigIssue[];
}

const EnvironmentChecker: React.FC = () => {
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = () => {
    setIsChecking(true);
    const issues: ConfigIssue[] = [];

    const envVars = {
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Check each variable
    Object.entries(envVars).forEach(([key, value]) => {
      if (!value) {
        issues.push({
          variable: key,
          issue: 'Missing',
          suggestion: 'Add this variable to your .env.local file'
        });
        return;
      }

      // Check for whitespace issues
      if (value !== value.trim()) {
        issues.push({
          variable: key,
          issue: 'Contains leading/trailing whitespace',
          value: JSON.stringify(value),
          suggestion: 'Remove spaces at the beginning or end'
        });
      }

      // Check for newlines
      if (/[\r\n]/.test(value)) {
        issues.push({
          variable: key,
          issue: 'Contains newline characters',
          value: JSON.stringify(value),
          suggestion: 'Remove any line breaks - the value should be on a single line'
        });
      }

      // Check for escaped characters
      if (/\\[nrt]/.test(value)) {
        issues.push({
          variable: key,
          issue: 'Contains escaped characters (\\n, \\r, \\t)',
          value: JSON.stringify(value),
          suggestion: 'Remove any \\n, \\r, or \\t sequences'
        });
      }

      // Special check for project ID
      if (key === 'NEXT_PUBLIC_FIREBASE_PROJECT_ID' && value) {
        if (!/^[a-z0-9-]+$/.test(value.trim())) {
          issues.push({
            variable: key,
            issue: 'Invalid format - contains invalid characters',
            value: JSON.stringify(value),
            suggestion: 'Project ID should only contain lowercase letters, numbers, and hyphens'
          });
        }
      }
    });

    setCheckResult({
      isValid: issues.length === 0,
      issues
    });
    setIsChecking(false);
  };

  if (isChecking) {
    return (
      <div className="env-checker">
        <div className="checking">
          <div className="spinner"></div>
          <p>Checking environment configuration...</p>
        </div>
      </div>
    );
  }

  if (!checkResult) return null;

  return (
    <div className="env-checker">
      <h2>Environment Configuration Check</h2>
      
      {checkResult.isValid ? (
        <div className="check-success">
          <div className="success-icon">✅</div>
          <h3>Configuration Valid</h3>
          <p>All Firebase environment variables are properly configured.</p>
        </div>
      ) : (
        <div className="check-error">
          <div className="error-icon">⚠️</div>
          <h3>Configuration Issues Found</h3>
          <p>The following issues were detected in your environment variables:</p>
          
          <div className="issues-list">
            {checkResult.issues.map((issue, index) => (
              <div key={index} className="issue-item">
                <h4>{issue.variable}</h4>
                <p className="issue-description">{issue.issue}</p>
                {issue.value && (
                  <div className="issue-value">
                    <strong>Current value:</strong>
                    <code>{issue.value}</code>
                  </div>
                )}
                {issue.suggestion && (
                  <div className="issue-suggestion">
                    <strong>Fix:</strong> {issue.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="fix-instructions">
            <h3>How to Fix:</h3>
            <ol>
              <li>Open your <code>.env.local</code> file in your project root</li>
              <li>Check each variable listed above</li>
              <li>Make sure each value is on a single line with no extra spaces or line breaks</li>
              <li>Save the file and restart your development server</li>
            </ol>
            
            <div className="example">
              <h4>Example of correct format:</h4>
              <pre>{`NEXT_PUBLIC_FIREBASE_PROJECT_ID=denarii-mvp-f5aea
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=denarii-mvp-f5aea.firebaseapp.com`}</pre>
            </div>
          </div>
        </div>
      )}

      <button onClick={checkEnvironment} className="recheck-btn">
        Check Again
      </button>
    </div>
  );
};

export default EnvironmentChecker;