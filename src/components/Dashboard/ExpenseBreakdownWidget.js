// src/components/Dashboard/ExpenseBreakdownWidget.js
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ExpenseBreakdownWidget = ({ profile }) => {
  const [viewMode, setViewMode] = useState('bar'); // 'bar' or 'pie'

  // Extract expense data from profile
  const expenses = {
    Housing: parseFloat(profile?.housingCost || '0'),
    Utilities: parseFloat(profile?.utilitiesCost || '0'),
    Food: parseFloat(profile?.foodCost || '0'),
    Transportation: parseFloat(profile?.transportationCost || '0'),
    Insurance: parseFloat(profile?.insuranceCost || '0'),
    Subscriptions: parseFloat(profile?.subscriptionsCost || '0'),
    'Other': parseFloat(profile?.otherExpenses || '0'),
  };

  // Add debt payments as a category
  const debtPayments = 
    parseFloat(profile?.creditCardPayment || '0') +
    parseFloat(profile?.studentLoanPayment || '0') +
    parseFloat(profile?.carLoanPayment || '0') +
    parseFloat(profile?.mortgagePayment || '0') +
    parseFloat(profile?.otherDebtPayment || '0');
  
  if (debtPayments > 0) {
    expenses['Debt Payments'] = debtPayments;
  }

  // Calculate total expenses
  const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);

  // Prepare data for charts
  const chartData = Object.entries(expenses)
    .filter(([_, value]) => value > 0)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Color palette for categories
  const colors = {
    Housing: '#3b82f6',
    Utilities: '#10b981',
    Food: '#f59e0b',
    Transportation: '#8b5cf6',
    Insurance: '#ef4444',
    Subscriptions: '#ec4899',
    'Debt Payments': '#6366f1',
    'Other': '#64748b'
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.category}</p>
          <p className="tooltip-value">
            {formatCurrency(data.amount)}
          </p>
          <p className="tooltip-percentage">
            {data.percentage.toFixed(1)}% of total
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

  // Calculate expense ratios
  const monthlyIncome = parseFloat(profile?.monthlyIncome || '0');
  const expenseRatio = monthlyIncome > 0 ? (totalExpenses / monthlyIncome) * 100 : 0;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - totalExpenses) / monthlyIncome) * 100 : 0;

  // Get largest expense category
  const largestExpense = chartData.length > 0 ? chartData[0] : null;

  // Empty state
  if (totalExpenses === 0) {
    return (
      <div className="widget expense-breakdown-widget">
        <div className="widget-header">
          <h3>
            <span className="widget-icon">💸</span>
            Monthly Expense Breakdown
          </h3>
        </div>
        <div className="widget-content empty-state">
          <p>No expense data available. Update your financial profile to see your expense breakdown.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="widget expense-breakdown-widget">
      <div className="widget-header">
        <h3>
          <span className="widget-icon">💸</span>
          Monthly Expense Breakdown
        </h3>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'bar' ? 'active' : ''}`}
            onClick={() => setViewMode('bar')}
            title="Bar chart view"
          >
            📊
          </button>
          <button
            className={`toggle-btn ${viewMode === 'pie' ? 'active' : ''}`}
            onClick={() => setViewMode('pie')}
            title="Pie chart view"
          >
            🥧
          </button>
        </div>
      </div>

      <div className="widget-content">
        {/* Total Expenses */}
        <div className="expense-summary">
          <div className="total-expenses">
            <span className="label">Total Monthly Expenses</span>
            <span className="amount">{formatCurrency(totalExpenses)}</span>
          </div>
          {monthlyIncome > 0 && (
            <div className="expense-ratios">
              <div className="ratio-item">
                <span className="ratio-label">Expense Ratio</span>
                <span className={`ratio-value ${expenseRatio > 80 ? 'warning' : ''}`}>
                  {expenseRatio.toFixed(0)}%
                </span>
              </div>
              <div className="ratio-item">
                <span className="ratio-label">Savings Rate</span>
                <span className={`ratio-value ${savingsRate < 20 ? 'warning' : 'positive'}`}>
                  {savingsRate.toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="chart-container">
          {viewMode === 'bar' ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="category" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[entry.category] || '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="amount"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[entry.category] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Legend */}
        <div className="expense-categories">
          {chartData.map((item) => (
            <div key={item.category} className="category-item">
              <div className="category-color" style={{ backgroundColor: colors[item.category] || '#94a3b8' }} />
              <div className="category-details">
                <span className="category-name">{item.category}</span>
                <span className="category-amount">{formatCurrency(item.amount)}</span>
                <span className="category-percentage">({item.percentage.toFixed(0)}%)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Insights */}
        <div className="expense-insights">
          <h4>💡 Quick Analysis</h4>
          {largestExpense && (
            <p>
              Your largest expense is <strong>{largestExpense.category}</strong> at{' '}
              <strong>{formatCurrency(largestExpense.amount)}</strong> ({largestExpense.percentage.toFixed(0)}% of total)
            </p>
          )}
          {expenseRatio > 90 && (
            <p className="warning-text">
              ⚠️ Your expenses are {expenseRatio.toFixed(0)}% of income. Consider reducing non-essential spending.
            </p>
          )}
          {savingsRate >= 20 && (
            <p className="success-text">
              ✅ Great job! You're saving {savingsRate.toFixed(0)}% of your income.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseBreakdownWidget;