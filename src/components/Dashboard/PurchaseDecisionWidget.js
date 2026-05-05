// src/components/Dashboard/PurchaseDecisionWidget.js
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BarChart3, Check, X } from 'lucide-react';

const PurchaseDecisionWidget = ({ breakdown }) => {
  const { buyTotal, dontBuyTotal, buyCount, dontBuyCount } = breakdown;

  // Calculate total and percentages
  const totalAmount = buyTotal + dontBuyTotal;
  const buyPercentage = totalAmount > 0 ? (buyTotal / totalAmount) * 100 : 0;
  const dontBuyPercentage = totalAmount > 0 ? (dontBuyTotal / totalAmount) * 100 : 0;

  // Data for pie chart
  const chartData = [
    {
      name: 'Approved Purchases',
      value: buyTotal,
      count: buyCount,
      color: '#10b981',
    },
    {
      name: 'Avoided Purchases',
      value: dontBuyTotal,
      count: dontBuyCount,
      color: '#ef4444',
    },
  ];

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show label for very small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="pie-label"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p className="tooltip-value">
            {formatCurrency(data.value)} ({data.count} items)
          </p>
        </div>
      );
    }
    return null;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate impact score
  const impactScore =
    dontBuyTotal > 0
      ? Math.min(100, Math.round((dontBuyTotal / (dontBuyTotal + buyTotal)) * 200))
      : 0;

  const getImpactMessage = () => {
    if (impactScore >= 80) return 'Strong financial discipline.';
    if (impactScore >= 60) return 'Avoiding impulse buys well.';
    if (impactScore >= 40) return 'Decisions are well-balanced.';
    if (impactScore >= 20) return 'Be more selective.';
    return 'Tighten the spending pattern.';
  };

  if (totalAmount === 0) {
    return (
      <div className="widget purchase-decision-widget">
        <div className="widget-header">
          <h3>
            <BarChart3 className="widget-icon" aria-hidden="true" />
            Decisions
          </h3>
        </div>
        <div className="widget-content empty-state">
          <p>No decisions yet. Analyze a purchase to see the pattern.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="widget purchase-decision-widget">
      <div className="widget-header">
        <h3>
          <BarChart3 className="widget-icon" aria-hidden="true" />
          Decisions
        </h3>
      </div>

      <div className="widget-content">
        {/* Pie Chart */}
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Decision Stats */}
        <div className="decision-stats">
          <div className="stat-card buy">
            <div className="stat-header">
              <Check className="stat-icon" aria-hidden="true" />
              <span className="stat-label">Approved</span>
            </div>
            <div className="stat-value">{formatCurrency(buyTotal)}</div>
            <div className="stat-detail">
              {buyCount} purchase{buyCount !== 1 ? 's' : ''} • {buyPercentage.toFixed(0)}%
            </div>
          </div>

          <div className="stat-card dont-buy">
            <div className="stat-header">
              <X className="stat-icon" aria-hidden="true" />
              <span className="stat-label">Avoided</span>
            </div>
            <div className="stat-value">{formatCurrency(dontBuyTotal)}</div>
            <div className="stat-detail">
              {dontBuyCount} purchase{dontBuyCount !== 1 ? 's' : ''} •{' '}
              {dontBuyPercentage.toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="impact-section">
          <h4>Impact score</h4>
          <div className="impact-score-container">
            <div className="impact-score-bar">
              <div
                className="impact-score-fill"
                style={{
                  width: `${impactScore}%`,
                  backgroundColor:
                    impactScore >= 60 ? '#059669' : impactScore >= 30 ? '#b45309' : '#b91c1c',
                }}
              />
            </div>
            <div className="impact-score-label">{impactScore}/100</div>
          </div>
          <p className="impact-message">{getImpactMessage()}</p>
        </div>

        <div className="insights">
          <h4>Insights</h4>
          <ul>
            <li>
              You've evaluated <strong>{buyCount + dontBuyCount}</strong> purchase decisions
            </li>
            <li>
              Average purchase value:{' '}
              <strong>{formatCurrency(totalAmount / (buyCount + dontBuyCount))}</strong>
            </li>
            {dontBuyTotal > 0 && (
              <li>
                Total avoided spending:{' '}
                <strong className="highlight">{formatCurrency(dontBuyTotal)}</strong>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDecisionWidget;
