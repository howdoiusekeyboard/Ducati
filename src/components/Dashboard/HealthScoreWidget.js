// src/components/Dashboard/HealthScoreWidget.js
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { safeToFixed, safeNumber } from '../../utils/formatters';

const HealthScoreWidget = ({ profile }) => {
  // Safely extract values with proper defaults
  const healthScore = safeNumber(profile?.summary?.healthScore, 50);
  const monthlyNetIncome = safeNumber(profile?.summary?.monthlyNetIncome, 0);
  const emergencyFundMonths = safeNumber(profile?.summary?.emergencyFundMonths, 0);
  const debtToIncomeRatio = safeNumber(profile?.summary?.debtToIncomeRatio, 0);

  // Calculate current savings safely
  const currentSavings = safeNumber(profile?.checkingSavingsBalance, 0) +
    safeNumber(profile?.emergencyFund, 0) +
    safeNumber(profile?.retirementAccounts, 0) +
    safeNumber(profile?.stocksAndBonds, 0);

  // Determine health score color
  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981'; // Green
    if (score >= 40) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  // Data for the gauge chart
  const gaugeData = [
    { name: 'Score', value: healthScore, fill: getScoreColor(healthScore) },
    { name: 'Remaining', value: 100 - healthScore, fill: '#e5e7eb' }
  ];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="widget health-score-widget">
      <div className="widget-header">
        <h3>
          <span className="widget-icon">💪</span>
          Financial Health Score
        </h3>
      </div>

      <div className="widget-content">
        {/* Gauge Chart */}
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
          </div>
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Monthly Net</div>
            <div className={`metric-value ${monthlyNetIncome >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(Math.abs(monthlyNetIncome))}
            </div>
            <div className="metric-sublabel">
              {monthlyNetIncome >= 0 ? 'Income after expenses' : 'Monthly deficit'}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Total Savings</div>
            <div className="metric-value">
              {formatCurrency(currentSavings)}
            </div>
            <div className="metric-sublabel">
              Across all accounts
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Emergency Fund</div>
            <div className={`metric-value ${emergencyFundMonths >= 3 ? 'positive' : emergencyFundMonths >= 1 ? 'warning' : 'negative'}`}>
              {safeToFixed(emergencyFundMonths, 1)} mo
            </div>
            <div className="metric-sublabel">
              {emergencyFundMonths >= 6 ? 'Excellent coverage' : 
               emergencyFundMonths >= 3 ? 'Good coverage' :
               emergencyFundMonths >= 1 ? 'Build it up' : 'Start saving'}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Debt Ratio</div>
            <div className={`metric-value ${debtToIncomeRatio <= 20 ? 'positive' : debtToIncomeRatio <= 40 ? 'warning' : 'negative'}`}>
              {safeToFixed(debtToIncomeRatio, 0)}%
            </div>
            <div className="metric-sublabel">
              {debtToIncomeRatio <= 20 ? 'Healthy' : 
               debtToIncomeRatio <= 40 ? 'Manageable' : 'High'}
            </div>
          </div>
        </div>

        {/* Health Tips */}
        <div className="health-tips">
          <h4>💡 Quick Tips</h4>
          {healthScore < 40 && (
            <p className="tip urgent">
              Focus on building an emergency fund and reducing high-interest debt to improve your score.
            </p>
          )}
          {healthScore >= 40 && healthScore < 70 && (
            <p className="tip moderate">
              You're on the right track! Keep building savings and managing expenses wisely.
            </p>
          )}
          {healthScore >= 70 && (
            <p className="tip good">
              Excellent financial health! Consider investing excess savings for long-term growth.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthScoreWidget;