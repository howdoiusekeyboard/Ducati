import React, { useState } from 'react';
import { BarChart3, DollarSign, Brain, AlertTriangle, Wrench, Check } from 'lucide-react';
import '../styles/DecisionMatrix.css';

const DecisionMatrix = ({ analysisDetails, decisionMatrix }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!analysisDetails || !decisionMatrix) {
    return null;
  }

  // Score colors aligned with verdict-pill palette (D2 has no semantic green token).
  const getScoreColor = (score) => {
    if (score >= 7) return '#059669';
    if (score >= 4) return '#b45309';
    return '#b91c1c';
  };

  const getScoreLabel = (score) => {
    if (score >= 7) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="decision-matrix-container">
      <div
        className="matrix-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex="0"
        aria-expanded={isExpanded}
      >
        <h3>
          <BarChart3 className="matrix-icon" aria-hidden="true" />
          Decision matrix
        </h3>
        <div className="overall-score">
          <span className="score-label">Overall Score:</span>
          <span
            className="score-value"
            style={{ color: getScoreColor(analysisDetails.finalScore / 10) }}
          >
            {analysisDetails.finalScore}/100
          </span>
          <button
            className="toggle-indicator"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
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
                <DollarSign className="section-emoji" aria-hidden="true" />
                Financial criteria
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
                            backgroundColor: getScoreColor(item.score),
                          }}
                        />
                      </div>
                      <span className="score-label" style={{ color: getScoreColor(item.score) }}>
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
                <Brain className="section-emoji" aria-hidden="true" />
                Psychological criteria
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
                            backgroundColor: getScoreColor(item.score),
                          }}
                        />
                      </div>
                      <span className="score-label" style={{ color: getScoreColor(item.score) }}>
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
                <AlertTriangle className="section-emoji" aria-hidden="true" />
                Risk assessment
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
                            backgroundColor: getScoreColor(item.score),
                          }}
                        />
                      </div>
                      <span className="score-label" style={{ color: getScoreColor(item.score) }}>
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
                <Wrench className="section-emoji" aria-hidden="true" />
                Utility criteria
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
                            backgroundColor: getScoreColor(item.score),
                          }}
                        />
                      </div>
                      <span className="score-label" style={{ color: getScoreColor(item.score) }}>
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
              <h5>
                <Check className="inline-icon" aria-hidden="true" />
                Strengths
              </h5>
              <ul>
                {analysisDetails.topFactors.positive.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
            <div className="negative-factors">
              <h5>
                <AlertTriangle className="inline-icon" aria-hidden="true" />
                Concerns
              </h5>
              <ul>
                {analysisDetails.topFactors.negative.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="decision-explanation">
            <p className="explanation-text">
              Weighted decision matrix based on consumer behavior and financial decision-making
              research. Each criterion is scored 0-10 and weighted by importance to calculate the
              overall recommendation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionMatrix;
