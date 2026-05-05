import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Gem, Shield } from 'lucide-react';
import DecisionMatrix from './DecisionMatrix';

// Resolves AED currency formatter once per render-tree.
const aedFormatter = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  maximumFractionDigits: 0,
});

const formatAED = (n) => (typeof n === 'number' ? aedFormatter.format(n) : '—');

// Render-only projection block. Data shape comes from C's branch (feat/phase-9-product-logic);
// this component is fully optional — never throws when projection is undefined.
const ProjectionPanel = ({ projection }) => {
  if (!projection) return null;
  return (
    <div className="projection-panel">
      <h4 className="projection-title">Projected impact</h4>
      <dl className="projection-grid">
        {projection.paymentMethod && (
          <div className="projection-row">
            <dt>Payment method</dt>
            <dd>{projection.paymentMethod}</dd>
          </div>
        )}
        {typeof projection.projectedSavings === 'number' && (
          <div className="projection-row">
            <dt>Savings after</dt>
            <dd className="num">{formatAED(projection.projectedSavings)}</dd>
          </div>
        )}
        {typeof projection.projectedEmergencyFundMonths === 'number' && (
          <div className="projection-row">
            <dt>Emergency fund</dt>
            <dd className="num">{projection.projectedEmergencyFundMonths.toFixed(1)} mo</dd>
          </div>
        )}
        {typeof projection.projectedHealthScore === 'number' && (
          <div className="projection-row">
            <dt>Health score after</dt>
            <dd className="num">{projection.projectedHealthScore}</dd>
          </div>
        )}
        {typeof projection.projectedDtiRatio === 'number' && (
          <div className="projection-row">
            <dt>DTI after</dt>
            <dd className="num">{projection.projectedDtiRatio.toFixed(1)}%</dd>
          </div>
        )}
      </dl>
      {projection.delta && (
        <p className="projection-delta">
          {projection.delta.savings !== 0 && (
            <span>
              Savings change: {formatAED(projection.delta.savings)}.{' '}
            </span>
          )}
          {Math.abs(projection.delta.dtiRatio) > 0.01 && (
            <span>
              DTI change: {projection.delta.dtiRatio > 0 ? '+' : ''}
              {projection.delta.dtiRatio.toFixed(1)}%.{' '}
            </span>
          )}
          {Math.abs(projection.delta.healthScore) >= 1 && (
            <span>
              Health score change: {projection.delta.healthScore > 0 ? '+' : ''}
              {Math.round(projection.delta.healthScore)}.
            </span>
          )}
        </p>
      )}
    </div>
  );
};

const DecisionRationaleNote = ({ rationale }) => {
  if (rationale !== 'necessity-floor') return null;
  return (
    <div className="rationale-note" role="note">
      <Shield className="rationale-icon" aria-hidden="true" />
      <span>Essential purchase — necessity floor applied.</span>
    </div>
  );
};

const decisionIcon = (decision) => {
  if (decision === 'Buy') return <CheckCircle className="decision-icon-svg" aria-hidden="true" />;
  if (decision === "Don't Buy") return <XCircle className="decision-icon-svg" aria-hidden="true" />;
  return <AlertTriangle className="decision-icon-svg" aria-hidden="true" />;
};

const ResultBubble = ({ messages = [], onClose, createGoogleSearchLink }) => {
  const navigate = useNavigate();

  const purchaseData = messages.find((m) => m.sender === 'Munger' && m.formatted)?.formatted;

  const isHighValue = useMemo(() => {
    if (!purchaseData?.analysisDetails) return false;
    const { purchaseCategory, itemCost } = purchaseData.analysisDetails;
    return purchaseCategory === 'HIGH_VALUE' || (itemCost && Number(itemCost) >= 300);
  }, [purchaseData]);

  const handleProMode = () => {
    if (!purchaseData) return;
    sessionStorage.setItem(
      'proModePurchase',
      JSON.stringify({
        itemName: purchaseData.analysisDetails.itemName,
        itemCost: purchaseData.analysisDetails.itemCost,
        decision: purchaseData.decision,
        summary: purchaseData.summary,
        decisionMatrix: purchaseData.decisionMatrix,
        analysisDetails: purchaseData.analysisDetails,
      })
    );
    navigate('/pro-mode');
  };

  return (
    <div className="result-bubble-overlay">
      <div className="result-bubble-container">
        <button onClick={onClose} className="close-bubble-btn" aria-label="Close result">
          ×
        </button>

        <div className="analysis-container">
          {messages.map((msg, i) =>
            msg.sender === 'Munger' && msg.formatted ? (
              <div key={i} className="decision-card">
                <DecisionRationaleNote rationale={msg.formatted.decisionRationale} />

                <div
                  className={`decision-header ${
                    msg.formatted.decision === 'Buy' ? 'buy' : 'dont-buy'
                  }`}
                >
                  <div className="decision-icon">{decisionIcon(msg.formatted.decision)}</div>
                  <h3 className="decision-title">{msg.formatted.decision}</h3>
                </div>

                <div className="decision-body">
                  <p className="recommendation-summary">{msg.formatted.summary}</p>

                  {isHighValue && (
                    <div className="pro-mode-section">
                      <div className="pro-mode-alert">
                        <Gem className="pro-mode-icon" aria-hidden="true" />
                        <span className="pro-mode-text">High-value purchase</span>
                      </div>
                      <button className="pro-mode-button" onClick={handleProMode}>
                        Run Pro Mode
                      </button>
                    </div>
                  )}

                  {msg.alternative && (
                    <div className="alternative-product">
                      <h4>Cheaper alternative</h4>
                      <p>
                        <strong>{msg.alternative.name}</strong> — ${msg.alternative.price} at{' '}
                        {msg.alternative.retailer}
                      </p>
                      <p>
                        <a
                          href={createGoogleSearchLink(msg.alternative.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-alternative-btn"
                        >
                          View
                        </a>
                      </p>
                    </div>
                  )}

                  {msg.formatted.quote && (
                    <div className="munger-quote">
                      <blockquote className="quote-text">
                        &ldquo;{msg.formatted.quote}&rdquo;
                      </blockquote>
                      <div className="quote-attribution">— Financial wisdom</div>
                    </div>
                  )}

                  <ProjectionPanel projection={msg.formatted.projection} />
                </div>

                {msg.formatted.analysisDetails && msg.formatted.decisionMatrix && (
                  <div className="decision-matrix-wrapper">
                    <DecisionMatrix
                      analysisDetails={msg.formatted.analysisDetails}
                      decisionMatrix={msg.formatted.decisionMatrix}
                    />
                  </div>
                )}
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultBubble;
