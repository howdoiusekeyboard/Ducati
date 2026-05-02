import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateProModeQuestions, getProModeAnalysis } from '../lib/ProModeAPI';
import { useFirestore } from '../hooks/useFirestore';
import '../styles/ProMode.css';

const parseAndRenderLinks = (text) => {
  if (!text) return null;
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const [fullMatch, linkText, url] = match;
    parts.push(
      <a href={url} target="_blank" rel="noopener noreferrer" className="analysis-link" key={url + lastIndex}>
        {linkText}
      </a>
    );
    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};

const ProMode = () => {
  const navigate = useNavigate();
  const firestore = useFirestore();
  const [purchaseData, setPurchaseData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [visibleHints, setVisibleHints] = useState({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Scroll to top when component mounts
    // Use setTimeout to ensure DOM is rendered first
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
    
    const loadPurchaseData = async () => {
      try {
        const storedData = sessionStorage.getItem('proModePurchase');
        if (!storedData) {
          navigate('/');
          return;
        }

        const data = JSON.parse(storedData);
        setPurchaseData(data);

        // Generate tailored questions
        console.log('Generating questions for:', data);
        const generatedQuestions = await generateProModeQuestions(data);
        console.log('Generated questions:', generatedQuestions);
        
        // Ensure backward compatibility - questions work with or without new fields
        const processedQuestions = generatedQuestions.map((q, index) => ({
          id: q.id || `q${index + 1}`,
          text: q.text || 'Please provide additional information',
          placeholder: q.placeholder || 'Enter your answer here',
          // New optional fields - keep them if present
          dimension: q.dimension,
          answer_type: q.answer_type,
          search_hint: q.search_hint
        }));
        
        setQuestions(processedQuestions);
        setLoading(false);
      } catch (error) {
        console.error('Error loading Pro Mode:', error);
        setError('Failed to load Pro Mode. Please try again.');
        setLoading(false);
      }
    };

    loadPurchaseData();
  }, [navigate]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleHint = (questionId) => {
    setVisibleHints(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Optional: Show a brief success message
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all questions are answered
    if (Object.keys(answers).length !== questions.length) {
      alert('Please answer all questions before proceeding.');
      return;
    }

    setAnalyzing(true);
    try {
      const proAnalysis = await getProModeAnalysis(
        purchaseData,
        questions,
        answers
      );
      setAnalysis(proAnalysis);
      
      // Scroll to top to show results
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
      
      // Save to Firestore if authenticated - include enhanced question data
      if (firestore.isAuthenticated) {
        await firestore.saveProAnalysis({
          itemName: purchaseData.itemName,
          itemCost: purchaseData.itemCost,
          questions,
          answers,
          analysis: proAnalysis
        });
      }
    } catch (error) {
      console.error('Error getting pro analysis:', error);
      setError('Failed to generate analysis. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Helper to get dimension label if available
  const getDimensionLabel = (dimension) => {
  const labels = {
    specs: '📋 Specifications',
    constraints: '💰 Constraints',
    timing: '🕐 Timing'  // Changed from ⏰ to 🕐 for better display
  };
  return labels[dimension] || '';
};

  if (loading) {
    return (
      <div className="pro-mode-container">
        <div className="pro-mode-loading">
          <div className="loading-spinner"></div>
          <p>Preparing Pro Mode analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pro-mode-container">
        <div className="pro-mode-error">
          <p>{error}</p>
          <button onClick={handleBack} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pro-mode-container">
      <div className="pro-mode-header">
        <h1>
          <span className="pro-icon">💎</span>
          Pro Mode Analysis
        </h1>
        <p className="pro-subtitle">
          Deep-dive analysis for {purchaseData?.itemName} (${purchaseData?.itemCost})
        </p>
      </div>

      {!analysis ? (
        <div className="pro-mode-content">
          <div className="questions-section">
            <h2>Answer these tailored questions for deeper insights:</h2>
            <form onSubmit={handleSubmit} className="questions-form">
              {questions.map((question, index) => (
                <div key={question.id} className="question-item">
                  <div className="question-header">
                    <label htmlFor={`question-${question.id}`}>
                      <span className="question-number">{index + 1}.</span>
                      {question.text}
                    </label>
                    <button
                      type="button"
                      className="hint-toggle"
                      onClick={() => toggleHint(question.id)}
                      aria-label={`${visibleHints[question.id] ? 'Hide' : 'Show'} hint for question ${index + 1}`}
                      title={`${visibleHints[question.id] ? 'Hide' : 'Show'} hint`}
                    >
                      💡
                    </button>
                  </div>

                  {visibleHints[question.id] && (
                    <div className="hint-section">
                      <div className="hint-content">
                        <span className="hint-label">Hint:</span>
                        <p className="hint-text">{question.placeholder}</p>
                        <div className="hint-actions">
                          <button
                            type="button"
                            className="use-hint-button"
                            onClick={() => handleAnswerChange(question.id, question.placeholder)}
                          >
                            Use Hint
                          </button>
                          <button
                            type="button"
                            className="copy-hint-button"
                            onClick={() => copyToClipboard(question.placeholder)}
                            title="Copy hint to clipboard"
                          >
                            📋 Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <textarea
                    id={`question-${question.id}`}
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Enter your answer here..."
                    required
                    rows={3}
                    className="question-input"
                  />
                </div>
              ))}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleBack}
                  className="cancel-button"
                  disabled={analyzing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="analyze-button"
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <span className="loading-spinner"></span>
                      Analyzing with Web Search...
                    </>
                  ) : (
                    'Get Pro Analysis'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="pro-mode-results">
          <div className="analysis-card">
            <h2>
              <span className="analysis-icon">🔍</span>
              Comprehensive Analysis
            </h2>
            <div className="analysis-content">
              <p className="analysis-text">{parseAndRenderLinks(analysis.fullAnalysis)}</p>

              {analysis.marketInsights && (
                <div className="market-insights">
                  <h3>
                    <span className="insights-icon">📊</span>
                    Current Market Conditions
                  </h3>
                  <p>{parseAndRenderLinks(analysis.marketInsights)}</p>
                </div>
              )}

              {analysis.recommendations && (
                <div className="recommendations-section">
                  <h3>
                    <span className="recommendations-icon">💡</span>
                    Key Recommendations
                  </h3>
                  <ul className="recommendations-list">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index}>{parseAndRenderLinks(rec)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.decisionConfidence && (
                <div className="confidence-meter">
                  <h3>Decision Confidence</h3>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${analysis.decisionConfidence}%` }}
                    />
                  </div>
                  <span className="confidence-label">
                    {analysis.decisionConfidence}% Confidence
                  </span>
                </div>
              )}
            </div>

            <div className="results-actions">
              <button onClick={handleBack} className="back-to-home-button">
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProMode;