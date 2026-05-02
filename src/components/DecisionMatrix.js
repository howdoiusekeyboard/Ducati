import React, { useState } from 'react';
import '../styles/DecisionMatrix.css';

/**
 * Component to display the structured decision matrix results
 */
const DecisionMatrix = ({ analysisDetails, decisionMatrix }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!analysisDetails || !decisionMatrix) {
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 7) return '#10b981'; // Green
    if (score >= 4) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score) => {
    if (score >= 7) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="decision-matrix-container">
      <div className="matrix-header" onClick={() => setIsExpanded(!isExpanded)} role="button" tabIndex="0" aria-expanded={isExpanded}>
        <h3>
          <span className="matrix-icon">📊</span>
          Decision Analysis Matrix
        </h3>
        <div className="overall-score">
          <span className="score-label">Overall Score:</span>
          <span className="score-value" style={{ color: getScoreColor(analysisDetails.finalScore / 10) }}>
            {analysisDetails.finalScore}/100
          </span>
          <button className="toggle-indicator" aria-label={isExpanded ? 'Collapse details' : 'Expand details'}>
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="matrix-details">
          <div className="matrix-sections">
            {/* Financial Criteria */}
            <div className="matrix-section">
              <h4 className="section-title">
                <span className="section-emoji">💰</span>
                Financial Criteria
              </h4>
              <div className="criteria-list">
                {decisionMatrix.financial.map((item, index) => (
                  <div key={index} className="criterion-item">
                    <div className="criterion-header">
                      <span className="criterion-name">{item.criterion}</span>
                      <span className="criterion-weight">{item.weight}</span>
                    </div>
                    <div className="criterion-score">
                      <div className="score-bar-container">
                        <div
                          className="score-bar"
                          style={{
                            width: `${item.score * 10}%`,
                            backgroundColor: getScoreColor(item.score)
                          }}
                        />
                      </div>
                      <span
                        className="score-label"
                        style={{ color: getScoreColor(item.score) }}
                      >
                        {getScoreLabel(item.score)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Psychological Criteria */}
            <div className="matrix-section">
              <h4 className="section-title">
                <span className="section-emoji">🧠</span>
                Psychological Criteria
              </h4>
              <div className="criteria-list">
                {decisionMatrix.psychological.map((item, index) => (
                  <div key={index} className="criterion-item">
                    <div className="criterion-header">
                      <span className="criterion-name">{item.criterion}</span>
                      <span className="criterion-weight">{item.weight}</span>
                    </div>
                    <div className="criterion-score">
                      <div className="score-bar-container">
                        <div
                          className="score-bar"
                          style={{
                            width: `${item.score * 10}%`,
                            backgroundColor: getScoreColor(item.score)
                          }}
                        />
                      </div>
                      <span
                        className="score-label"
                        style={{ color: getScoreColor(item.score) }}
                      >
                        {getScoreLabel(item.score)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Criteria */}
            <div className="matrix-section">
              <h4 className="section-title">
                <span className="section-emoji">⚠️</span>
                Risk Assessment
              </h4>
              <div className="criteria-list">
                {decisionMatrix.risk.map((item, index) => (
                  <div key={index} className="criterion-item">
                    <div className="criterion-header">
                      <span className="criterion-name">{item.criterion}</span>
                      <span className="criterion-weight">{item.weight}</span>
                    </div>
                    <div className="criterion-score">
                      <div className="score-bar-container">
                        <div
                          className="score-bar"
                          style={{
                            width: `${item.score * 10}%`,
                            backgroundColor: getScoreColor(item.score)
                          }}
                        />
                      </div>
                      <span
                        className="score-label"
                        style={{ color: getScoreColor(item.score) }}
                      >
                        {getScoreLabel(item.score)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Utility Criteria */}
            <div className="matrix-section">
              <h4 className="section-title">
                <span className="section-emoji">🔧</span>
                Utility Criteria
              </h4>
              <div className="criteria-list">
                {decisionMatrix.utility.map((item, index) => (
                  <div key={index} className="criterion-item">
                    <div className="criterion-header">
                      <span className="criterion-name">{item.criterion}</span>
                      <span className="criterion-weight">{item.weight}</span>
                    </div>
                    <div className="criterion-score">
                      <div className="score-bar-container">
                        <div
                          className="score-bar"
                          style={{
                            width: `${item.score * 10}%`,
                            backgroundColor: getScoreColor(item.score)
                          }}
                        />
                      </div>
                      <span
                        className="score-label"
                        style={{ color: getScoreColor(item.score) }}
                      >
                        {getScoreLabel(item.score)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Factors Summary */}
          <div className="factors-summary">
            <div className="positive-factors">
              <h5>✅ Strengths</h5>
              <ul>
                {analysisDetails.topFactors.positive.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
            <div className="negative-factors">
              <h5>⚠️ Concerns</h5>
              <ul>
                {analysisDetails.topFactors.negative.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Decision Explanation */}
          <div className="decision-explanation">
            <p className="explanation-text">
              This analysis uses a <strong>Weighted Decision Matrix</strong> based on academic research in consumer behavior
              and financial decision-making. Each criterion is scored from 0-10 and weighted by importance to calculate
              an overall recommendation score.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionMatrix;
