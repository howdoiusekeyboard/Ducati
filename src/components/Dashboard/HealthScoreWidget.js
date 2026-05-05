// src/components/Dashboard/HealthScoreWidget.js
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Heart } from 'lucide-react';
import { safeToFixed, safeNumber } from '../../utils/formatters';

const HealthScoreWidget = ({ profile, projection = null }) => {
  const healthScore = safeNumber(profile?.summary?.healthScore, 50);
  const monthlyNetIncome = safeNumber(profile?.summary?.monthlyNetIncome, 0);
  const emergencyFundMonths = safeNumber(profile?.summary?.emergencyFundMonths, 0);
  const debtToIncomeRatio = safeNumber(profile?.summary?.debtToIncomeRatio, 0);

  const currentSavings =
    safeNumber(profile?.checkingSavingsBalance, 0) +
    safeNumber(profile?.emergencyFund, 0) +
    safeNumber(profile?.retirementAccounts, 0) +
    safeNumber(profile?.stocksAndBonds, 0);

  // Score colors aligned with verdict-pill palette (D2 has no semantic green token).
  const getScoreColor = (score) => {
    if (score >= 70) return '#059669';
    if (score >= 40) return '#b45309';
    return '#b91c1c';
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const gaugeData = [
    { name: 'Score', value: healthScore, fill: getScoreColor(healthScore) },
    { name: 'Remaining', value: 100 - healthScore, fill: '#e5e7eb' },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Projection preview hint color: muted by default; danger if projection drops health by ≥5;
  // accent if it lifts by ≥5. No green token in D2 — use accent.
  const projectionDelta =
    typeof projection?.projectedHealthScore === 'number'
      ? projection.projectedHealthScore - healthScore
      : null;
  const projectionHintClass =
    projectionDelta === null
      ? 'projection-hint'
      : projectionDelta <= -5
        ? 'projection-hint projection-down'
        : projectionDelta >= 5
          ? 'projection-hint projection-up'
          : 'projection-hint';

  return (
    <div className="widget health-score-widget">
      <div className="widget-header">
        <h3>
          <Heart className="widget-icon" aria-hidden="true" />
          Health score
        </h3>
      </div>

      <div className="widget-content">
        <div className="gauge-container">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="70%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="gauge-label">
            <div className="gauge-score">{healthScore}</div>
            <div className="gauge-status" style={{ color: getScoreColor(healthScore) }}>
              {getScoreLabel(healthScore)}
            </div>
            {/* Width-stable line — reserves height even when projection is absent so layout doesn't shift. */}
            <p className={projectionHintClass}>
              {projection?.projectedHealthScore !== undefined ? (
                <>
                  After purchase:{' '}
                  <span className="font-mono">{projection.projectedHealthScore}</span>
                </>
              ) : (
                ' '
              )}
            </p>
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Monthly net</div>
            <div className={`metric-value ${monthlyNetIncome >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(Math.abs(monthlyNetIncome))}
            </div>
            <div className="metric-sublabel">
              {monthlyNetIncome >= 0 ? 'Income after expenses' : 'Monthly deficit'}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Total savings</div>
            <div className="metric-value">{formatCurrency(currentSavings)}</div>
            <div className="metric-sublabel">Across all accounts</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Emergency fund</div>
            <div
              className={`metric-value ${emergencyFundMonths >= 3 ? 'positive' : emergencyFundMonths >= 1 ? 'warning' : 'negative'}`}
            >
              {safeToFixed(emergencyFundMonths, 1)} mo
            </div>
            <div className="metric-sublabel">
              {emergencyFundMonths >= 6
                ? 'Excellent'
                : emergencyFundMonths >= 3
                  ? 'Good'
                  : emergencyFundMonths >= 1
                    ? 'Building up'
                    : 'Start saving'}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Debt ratio</div>
            <div
              className={`metric-value ${debtToIncomeRatio <= 20 ? 'positive' : debtToIncomeRatio <= 40 ? 'warning' : 'negative'}`}
            >
              {safeToFixed(debtToIncomeRatio, 0)}%
            </div>
            <div className="metric-sublabel">
              {debtToIncomeRatio <= 20
                ? 'Healthy'
                : debtToIncomeRatio <= 40
                  ? 'Manageable'
                  : 'High'}
            </div>
          </div>
        </div>

        <div className="health-tips">
          <h4>Tips</h4>
          {healthScore < 40 && (
            <p className="tip urgent">
              Build an emergency fund and reduce high-interest debt to lift the score.
            </p>
          )}
          {healthScore >= 40 && healthScore < 70 && (
            <p className="tip moderate">
              On track. Keep building savings and managing expenses.
            </p>
          )}
          {healthScore >= 70 && (
            <p className="tip good">Strong score. Consider investing excess savings.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthScoreWidget;
