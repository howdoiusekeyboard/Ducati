// src/components/Dashboard/RecentActivityWidget.js

const RecentActivityWidget = ({ purchases, onViewAll }) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    const now = new Date();
    const purchaseDate = date instanceof Date ? date : date.toDate();
    const diffTime = Math.abs(now - purchaseDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return purchaseDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: purchaseDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Empty state
  if (!purchases || purchases.length === 0) {
    return (
      <div className="widget recent-activity-widget">
        <div className="widget-header">
          <h3>
            <span className="widget-icon">🕐</span>
            Recent Activity
          </h3>
        </div>
        <div className="widget-content empty-state">
          <p>No recent purchases to display. Start analyzing your purchases to see them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="widget recent-activity-widget">
      <div className="widget-header">
        <h3>
          <span className="widget-icon">🕐</span>
          Recent Activity
        </h3>
        <button onClick={onViewAll} className="view-all-btn">
          View All →
        </button>
      </div>

      <div className="widget-content">
        <div className="activity-list">
          {purchases.map((purchase, index) => (
            <div key={purchase.id || index} className="activity-item">
              <div className="activity-icon">
                {purchase.decision === 'Buy' ? '✅' : '❌'}
              </div>
              
              <div className="activity-details">
                <div className="activity-header">
                  <h4 className="item-name">{purchase.itemName}</h4>
                  <span className="item-date">{formatDate(purchase.date)}</span>
                </div>
                
                <div className="activity-info">
                  <span className="item-cost">{formatCurrency(purchase.itemCost)}</span>
                  <span className={`decision-badge ${purchase.decision === 'Buy' ? 'buy' : 'dont-buy'}`}>
                    {purchase.decision}
                  </span>
                  {((purchase.decision === "Don't Buy" && purchase.itemCost > 0) || 
                    (purchase.decision === "Buy" && purchase.savings > 0)) && (
                    <span className="savings-badge">
                      Saved {formatCurrency(
                        purchase.decision === "Don't Buy" ? purchase.itemCost : purchase.savings
                      )}
                    </span>
                  )}
                </div>

                {purchase.alternative && (
                  <div className="alternative-info">
                    <span className="alternative-icon">💡</span>
                    Alternative: {purchase.alternative.name} ({formatCurrency(purchase.alternative.price)})
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Activity Summary */}
        <div className="activity-summary">
          <div className="summary-stat">
            <span className="stat-icon">📊</span>
            <span className="stat-text">
              {purchases.length} recent decision{purchases.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="summary-stat">
            <span className="stat-icon">💰</span>
            <span className="stat-text">
              {formatCurrency(
                purchases.reduce((sum, p) => {
                  if (p.decision === "Don't Buy") {
                    return sum + (p.itemCost || 0);
                  } else if (p.decision === "Buy" && p.savings) {
                    return sum + (p.savings || 0);
                  }
                  return sum;
                }, 0)
              )} saved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentActivityWidget;