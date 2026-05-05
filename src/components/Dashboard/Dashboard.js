// src/components/Dashboard/Dashboard.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, AlertTriangle, HardDrive, ShoppingCart, User, Wrench } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useFirestore } from '../../hooks/useFirestore';
import HealthScoreWidget from './HealthScoreWidget';
import SavingsTrackerWidget from './SavingsTrackerWidget';
import PurchaseDecisionWidget from './PurchaseDecisionWidget';
import ExpenseBreakdownWidget from './ExpenseBreakdownWidget';
import RecentActivityWidget from './RecentActivityWidget';
import DashboardSkeleton from './DashboardSkeleton';
import '../../styles/Dashboard.css';
import EnvironmentChecker from '../EnvironmentChecker';
import ClearDataButton from '../ClearDataButton';

// Error types for better error handling
const ERROR_TYPES = {
  FIREBASE_CONFIG: 'FIREBASE_CONFIG',
  NETWORK: 'NETWORK',
  PERMISSION: 'PERMISSION',
  UNKNOWN: 'UNKNOWN',
};

const getErrorType = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;

  const errorMessage = error.message || '';
  const errorCode = error.code || '';

  if (errorMessage.includes('project') || errorMessage.includes('configuration')) {
    return ERROR_TYPES.FIREBASE_CONFIG;
  }
  if (errorCode === 'permission-denied') {
    return ERROR_TYPES.PERMISSION;
  }
  if (errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
    return ERROR_TYPES.NETWORK;
  }

  return ERROR_TYPES.UNKNOWN;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    getProfile,
    getPurchaseHistory,
    subscribeToProfile,
    subscribeToPurchaseHistory,
    isLoading: firestoreLoading,
    error: firestoreError,
  } = useFirestore();

  const [financialProfile, setFinancialProfile] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [hasLocalFallback, setHasLocalFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Calculate derived values with memoization
  const totalSavings = useMemo(() => {
    if (!purchaseHistory || !Array.isArray(purchaseHistory)) return 0;
    return purchaseHistory.reduce((total, purchase) => {
      // Count avoided purchases as savings
      if (purchase.decision === "Don't Buy") {
        return total + (purchase.itemCost || 0);
      }
      // For "Buy" decisions, only count explicit savings (e.g., from alternatives)
      else if (purchase.decision === 'Buy' && purchase.savings) {
        return total + (purchase.savings || 0);
      }
      return total;
    }, 0);
  }, [purchaseHistory]);

  const purchaseBreakdown = useMemo(() => {
    const breakdown = {
      buyTotal: 0,
      dontBuyTotal: 0,
      buyCount: 0,
      dontBuyCount: 0,
    };

    if (!purchaseHistory || !Array.isArray(purchaseHistory)) return breakdown;

    purchaseHistory.forEach((purchase) => {
      if (purchase.decision === 'Buy') {
        breakdown.buyTotal += purchase.itemCost;
        breakdown.buyCount++;
      } else if (purchase.decision === "Don't Buy") {
        breakdown.dontBuyTotal += purchase.itemCost;
        breakdown.dontBuyCount++;
      }
    });

    return breakdown;
  }, [purchaseHistory]);

  const recentPurchases = useMemo(() => {
    if (!purchaseHistory || !Array.isArray(purchaseHistory)) return [];
    return purchaseHistory.sort((a, b) => b.date - a.date).slice(0, 5);
  }, [purchaseHistory]);

  // Helper functions
  const calculateTotalExpenses = (firestoreProfile) => {
    const expenses = [
      firestoreProfile.housingCost,
      firestoreProfile.utilitiesCost,
      firestoreProfile.foodCost,
      firestoreProfile.transportationCost,
      firestoreProfile.insuranceCost,
      firestoreProfile.subscriptionsCost,
      firestoreProfile.otherExpenses,
    ];

    return expenses
      .reduce((sum, expense) => {
        return sum + (parseFloat(expense) || 0);
      }, 0)
      .toString();
  };

  const calculateTotalDebtPayments = (firestoreProfile) => {
    const payments = [
      firestoreProfile.creditCardPayment,
      firestoreProfile.studentLoanPayment,
      firestoreProfile.carLoanPayment,
      firestoreProfile.otherDebtPayment,
    ];

    return payments
      .reduce((sum, payment) => {
        return sum + (parseFloat(payment) || 0);
      }, 0)
      .toString();
  };

  const loadFromLocalStorage = useCallback(() => {
    console.log('Attempting to load from localStorage...');

    // Load profile from localStorage
    const savedProfile = localStorage.getItem('quickFinancialProfile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        console.log('Found localStorage profile');
        setFinancialProfile({
          ...parsed,
          userId: user?.uid,
          lastUpdated: new Date(parsed.lastUpdated || Date.now()),
        });
        setHasLocalFallback(true);
      } catch (parseErr) {
        console.error('Error parsing localStorage profile:', parseErr);
      }
    }

    // Load purchase history from localStorage
    const savedHistory = localStorage.getItem('purchaseHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        const history = parsed.map((item) => ({
          ...item,
          date: new Date(item.date),
        }));
        console.log('Found localStorage purchase history:', history.length, 'items');
        setPurchaseHistory(history);
      } catch (parseErr) {
        console.error('Error parsing localStorage history:', parseErr);
      }
    }
  }, [user?.uid]);

  const loadDashboardData = useCallback(async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setError(null);
    setErrorType(null);
    console.log('Loading dashboard data for user:', user.uid);

    // Try loading from Firestore
    try {
      setProfileLoading(true);
      const profile = await getProfile();

      if (profile) {
        console.log('Firestore profile loaded successfully');
        setFinancialProfile(profile);
        setHasLocalFallback(false);
      } else {
        console.log('No Firestore profile found, using localStorage');
        loadFromLocalStorage();
      }
    } catch (profileErr) {
      console.error('Error loading profile from Firestore:', profileErr);
      const errType = getErrorType(profileErr);
      setErrorType(errType);

      if (errType === ERROR_TYPES.FIREBASE_CONFIG) {
        setError('Firebase configuration error detected. Please check your environment setup.');
      } else {
        setError('Unable to connect to database. Using offline mode.');
      }

      loadFromLocalStorage();
    } finally {
      setProfileLoading(false);
    }

    // Try loading purchase history
    try {
      setHistoryLoading(true);
      const history = await getPurchaseHistory();
      console.log('Purchase history loaded:', history.length, 'items');
      setPurchaseHistory(history);
    } catch (historyErr) {
      console.error('Error loading purchase history:', historyErr);
      // Try localStorage for history
      const savedHistory = localStorage.getItem('purchaseHistory');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          setPurchaseHistory(
            parsed.map((item) => ({
              ...item,
              date: new Date(item.date),
            }))
          );
        } catch (e) {
          setPurchaseHistory([]);
        }
      }
    } finally {
      setHistoryLoading(false);
    }
  }, [user, getProfile, getPurchaseHistory, navigate, loadFromLocalStorage]);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [user?.uid]);

  // Subscribe to real-time updates (only if not using fallback and no config errors)
  useEffect(() => {
    if (!user || hasLocalFallback || errorType === ERROR_TYPES.FIREBASE_CONFIG) return;

    const subscriptions = [];

    // Only subscribe if we don't have configuration errors
    if (!error || errorType !== ERROR_TYPES.FIREBASE_CONFIG) {
      console.log('Setting up real-time subscriptions');

      const unsubscribeProfile = subscribeToProfile((profile) => {
        if (profile) {
          console.log('Real-time profile update received');
          setFinancialProfile(profile);
          setHasLocalFallback(false);
          setError(null);
        }
      });

      if (unsubscribeProfile) subscriptions.push(unsubscribeProfile);

      const unsubscribePurchases = subscribeToPurchaseHistory((purchases) => {
        console.log('Real-time purchase history update received:', purchases.length, 'items');
        setPurchaseHistory(purchases);
        setError(null);
      }, 100);

      if (unsubscribePurchases) subscriptions.push(unsubscribePurchases);
    }

    return () => {
      subscriptions.forEach((unsub) => unsub && unsub());
    };
  }, [
    user?.uid,
    hasLocalFallback,
    errorType,
    error,
    subscribeToProfile,
    subscribeToPurchaseHistory,
  ]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    loadDashboardData();
  }, [loadDashboardData]);

  // Loading state
  if ((profileLoading || historyLoading) && !financialProfile && purchaseHistory.length === 0) {
    return <DashboardSkeleton />;
  }

  // Configuration error state
  if (errorType === ERROR_TYPES.FIREBASE_CONFIG) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error config-error">
          <Wrench className="error-icon" aria-hidden="true" />
          <h2>Configuration Issue Detected</h2>
          <p>
            There's an issue with the database configuration that's preventing data from loading.
          </p>

          <EnvironmentChecker />

          <div className="error-actions">
            <button onClick={handleRetry} className="btn btn-primary">
              Try Again
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              Continue with Local Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  // General error state (only show if no data available)
  if (error && !financialProfile && (!purchaseHistory || purchaseHistory.length === 0)) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <h2>Connection Issue</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={handleRetry} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state for new users
  if (!financialProfile && (!purchaseHistory || purchaseHistory.length === 0)) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-empty">
          <BarChart3 className="empty-icon" aria-hidden="true" />
          <h2>Set up your financial profile</h2>
          <p>Add your profile and analyze a purchase to see insights here.</p>
          <div className="empty-actions">
            <button onClick={() => navigate('/profile')} className="btn btn-primary">
              Set up profile
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              Analyze a purchase
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>
          <BarChart3 className="dashboard-icon" aria-hidden="true" />
          Dashboard
        </h1>
        <p className="dashboard-subtitle">Track your progress.</p>
        {(hasLocalFallback || error) && (
          <div className="dashboard-status">
            {hasLocalFallback && (
              <span className="status-badge offline">
                <HardDrive className="status-icon" aria-hidden="true" />
                Using local data
              </span>
            )}
            {error && errorType !== ERROR_TYPES.FIREBASE_CONFIG && (
              <span className="status-badge warning">
                <AlertTriangle className="status-icon" aria-hidden="true" />
                Limited connectivity
              </span>
            )}
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        {/* Financial Health Score */}
        <div className="widget-container widget-health">
          <HealthScoreWidget profile={financialProfile} />
        </div>

        {/* Savings Tracker */}
        <div className="widget-container widget-savings">
          <SavingsTrackerWidget totalSavings={totalSavings} userId={user.uid} />
        </div>

        {/* Purchase Decisions */}
        <div className="widget-container widget-decisions">
          <PurchaseDecisionWidget breakdown={purchaseBreakdown} />
        </div>

        {/* Monthly Expenses */}
        <div className="widget-container widget-expenses">
          <ExpenseBreakdownWidget profile={financialProfile} />
        </div>

        {/* Recent Activity */}
        <div className="widget-container widget-recent">
          <RecentActivityWidget
            purchases={recentPurchases}
            onViewAll={() => navigate('/history')}
          />
        </div>
      </div>

      {/* Dashboard Actions */}
      <div className="dashboard-actions">
        <button onClick={() => navigate('/')} className="action-btn primary">
          <ShoppingCart className="action-icon" aria-hidden="true" />
          Analyze a purchase
        </button>
        <button onClick={() => navigate('/profile')} className="action-btn secondary">
          <User className="action-icon" aria-hidden="true" />
          Update profile
        </button>
      </div>

      {/* Danger Zone */}
      <div className="dashboard-danger-zone">
        <ClearDataButton />
      </div>
    </div>
  );
};

export default Dashboard;
