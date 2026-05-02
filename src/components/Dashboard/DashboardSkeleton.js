import '../../styles/Dashboard.css';

const DashboardSkeleton = () => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-subtitle"></div>
      </div>

      <div className="dashboard-grid">
        {/* Health Score Widget Skeleton */}
        <div className="widget-container widget-health">
          <div className="widget-skeleton">
            <div className="skeleton skeleton-widget-title"></div>
            <div className="skeleton skeleton-score"></div>
            <div className="skeleton skeleton-text"></div>
          </div>
        </div>

        {/* Savings Tracker Widget Skeleton */}
        <div className="widget-container widget-savings">
          <div className="widget-skeleton">
            <div className="skeleton skeleton-widget-title"></div>
            <div className="skeleton skeleton-amount"></div>
            <div className="skeleton skeleton-text"></div>
          </div>
        </div>

        {/* Purchase Decisions Widget Skeleton */}
        <div className="widget-container widget-decisions">
          <div className="widget-skeleton">
            <div className="skeleton skeleton-widget-title"></div>
            <div className="skeleton skeleton-chart"></div>
          </div>
        </div>

        {/* Expenses Widget Skeleton */}
        <div className="widget-container widget-expenses">
          <div className="widget-skeleton">
            <div className="skeleton skeleton-widget-title"></div>
            <div className="skeleton skeleton-list"></div>
          </div>
        </div>

        {/* Recent Activity Widget Skeleton */}
        <div className="widget-container widget-recent">
          <div className="widget-skeleton">
            <div className="skeleton skeleton-widget-title"></div>
            <div className="skeleton skeleton-list"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;