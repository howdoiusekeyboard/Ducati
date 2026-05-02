// src/components/PurchaseAdvisor.js
import React, { useState, useReducer, useCallback, useEffect } from "react";
import { analyzeImageWithOpenAI, findCheaperAlternative } from "../lib/openaiAPI";
import { getEnhancedPurchaseRecommendation } from "../lib/enhancedOpenAIIntegration";
import DecisionMatrix from "./DecisionMatrix";
import ProgressiveFinancialProfile from "./ProgressiveFinancialProfile";
import SavingsTracker from "./SavingsTracker";
import ImageUploadSection from "./ImageUploadSection";
import ResultBubble from "./ResultBubble";
import { useFirestore } from "../hooks/useFirestore";
import { useLocation } from '../hooks/useLocation';
import { LocationService } from '../lib/locationService';
import "../styles/App.css";

// Constants
const INITIAL_FORM_STATE = {
  itemName: "",
  itemCost: "",
  purpose: "",
  frequency: "",
  searchForAlternative: true
};

const INITIAL_UI_STATE = {
  loading: false,
  findingAlternatives: false,
  showFinancialProfile: false,
  showSavingsTracker: false,
  showResultBubble: false,
  showImageOptions: false
};

// Reducer for form state management
const formReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET_FORM':
      return INITIAL_FORM_STATE;
    case 'SET_ITEM_FROM_IMAGE':
      return { ...state, itemName: action.name, itemCost: action.cost || state.itemCost };
    default:
      return state;
  }
};

// Reducer for UI state management
const uiReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_FINDING_ALTERNATIVES':
      return { ...state, findingAlternatives: action.value };
    case 'TOGGLE_MODAL':
      return { ...state, [action.modal]: action.value };
    case 'SHOW_RESULTS':
      return { ...state, showResultBubble: true, loading: false };
    case 'HIDE_RESULTS':
      return { ...state, showResultBubble: false };
    default:
      return state;
  }
};

// Helper functions
const createGoogleSearchLink = (itemName) => {
  return `https://www.google.com/search?q=${encodeURIComponent(itemName)}`;
};

const saveToHistory = async (analysisResult, itemName, itemCost, firestore) => {
  const decision = analysisResult.formatted.decision;
  let savings = 0;
  
  // Set savings based on decision
  if (decision === "Don't Buy") {
    savings = parseFloat(itemCost);
  } else if (decision === "Buy" && analysisResult.alternative) {
    const alternativeSavings = parseFloat(itemCost) - analysisResult.alternative.price;
    savings = alternativeSavings > 0 ? alternativeSavings : 0;
  }

  const historyEntry = {
    date: new Date(),
    itemName: analysisResult.formatted.analysisDetails.itemName || itemName,
    itemCost: parseFloat(itemCost),
    decision: decision,
    savings: savings,
    alternative: analysisResult.alternative,
    analysisDetails: analysisResult.formatted.analysisDetails
  };


  console.log('User:', firestore.user);
  console.log('User UID:', firestore.user?.uid);
  console.log('History entry:', historyEntry);
  console.log('============================');

  // Helper function to save to localStorage
  const saveToLocalStorage = (reason) => {
    console.log(`Saving to localStorage: ${reason}`);
    try {
      const history = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
      history.unshift({
        ...historyEntry,
        date: historyEntry.date.toISOString()
      });
      localStorage.setItem('purchaseHistory', JSON.stringify(history));
      console.log('Purchase history saved to localStorage successfully');
    } catch (localError) {
      console.error('Failed to save to localStorage:', localError);
    }
  };

  // Wait for auth to finish loading if it's still loading
  if (firestore.authLoading) {
    console.log('Auth still loading, waiting...');
    // Wait longer for auth to complete with timeout
    const authTimeout = 5000; // 5 seconds
    const startTime = Date.now();
    
    while (firestore.authLoading && (Date.now() - startTime) < authTimeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (firestore.authLoading) {
      console.log('Auth loading timeout, falling back to localStorage');
      saveToLocalStorage('auth loading timeout');
      return;
    }
  }

  // Save to Firestore if authenticated
  if (firestore.isAuthenticated && firestore.user && firestore.user.uid && !firestore.authLoading) {
    try {
      console.log('Attempting to save purchase history for user:', firestore.user.uid);
      
      // Add a timeout to the save operation
      const savePromise = firestore.savePurchase(historyEntry);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Save operation timed out')), 15000); // 15 second timeout
      });
      
      await Promise.race([savePromise, timeoutPromise]);
      console.log('Purchase history saved to Firestore successfully');
    } catch (error) {
      console.error('Failed to save purchase history to Firestore:', error);
      console.error('Error details:', error.message, error.code);
      
      // Always fallback to localStorage on any Firestore error
      saveToLocalStorage(`Firestore error: ${error.message || 'Unknown error'}`);
    }
  } else {
    // Fallback to localStorage
    saveToLocalStorage(`User not authenticated. Auth state: authenticated=${firestore.isAuthenticated}, hasUser=${!!firestore.user}, hasUid=${!!(firestore.user && firestore.user.uid)}, authLoading=${firestore.authLoading}`);
  }
};

const loadFinancialProfile = async (firestore) => {
  // Try to load from Firestore first if authenticated
  if (firestore.isAuthenticated) {
    const firestoreProfile = await firestore.getProfile();
    if (firestoreProfile) {
      // Convert Firestore profile to the expected format
      return {
        ...firestoreProfile,
        summary: firestoreProfile.summary || {
          monthlyNetIncome: ((parseFloat(firestoreProfile.monthlyIncome) || 0) -
            (parseFloat(firestoreProfile.housingCost) || 0) -
            (parseFloat(firestoreProfile.utilitiesCost) || 0) -
            (parseFloat(firestoreProfile.foodCost) || 0) -
            (parseFloat(firestoreProfile.transportationCost) || 0) -
            (parseFloat(firestoreProfile.insuranceCost) || 0) -
            (parseFloat(firestoreProfile.subscriptionsCost) || 0) -
            (parseFloat(firestoreProfile.otherExpenses) || 0) -
            (parseFloat(firestoreProfile.creditCardPayment) || 0) -
            (parseFloat(firestoreProfile.studentLoanPayment) || 0) -
            (parseFloat(firestoreProfile.carLoanPayment) || 0) -
            (parseFloat(firestoreProfile.mortgagePayment) || 0) -
            (parseFloat(firestoreProfile.otherDebtPayment) || 0)),
          debtToIncomeRatio: 0,
          emergencyFundMonths: 0,
          healthScore: 50
        }
      };
    }
  }

  // Fallback to localStorage
  const quickProfile = localStorage.getItem('quickFinancialProfile');
  if (quickProfile) {
    const parsed = JSON.parse(quickProfile);
    return {
      monthlyIncome: parsed.monthlyIncome,
      monthlyExpenses: parsed.monthlyExpenses,
      currentSavings: parsed.currentSavings,
      debtPayments: parsed.debtPayments || "0",
      summary: {
        monthlyNetIncome: parsed.summary?.monthlyNetIncome ||
          ((parseFloat(parsed.monthlyIncome) || 0) -
            (parseFloat(parsed.monthlyExpenses) || 0) -
            (parseFloat(parsed.debtPayments) || 0)),
        debtToIncomeRatio: parsed.debtPayments && parseFloat(parsed.monthlyIncome) > 0 ?
          ((parseFloat(parsed.debtPayments) / parseFloat(parsed.monthlyIncome)) * 100) : 0,
        emergencyFundMonths: parsed.summary?.savingsMonths ||
          (parsed.currentSavings && parsed.monthlyExpenses && parseFloat(parsed.monthlyExpenses) > 0 ?
            (parseFloat(parsed.currentSavings) / parseFloat(parsed.monthlyExpenses)) : 0),
        healthScore: parsed.summary?.healthScore || 50
      },
      riskTolerance: parsed.riskTolerance || "moderate",
      financialGoal: parsed.financialGoal || "balance"
    };
  }

  const savedProfile = localStorage.getItem('financialProfile');
  return savedProfile ? JSON.parse(savedProfile) : null;
};

// Main Component
const PurchaseAdvisor = () => {
  // State management
  const [formState, dispatchForm] = useReducer(formReducer, INITIAL_FORM_STATE);
  const [uiState, dispatchUI] = useReducer(uiReducer, INITIAL_UI_STATE);
  const [messages, setMessages] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [financialProfile, setFinancialProfile] = useState(null);
  const [hasSeenProfilePrompt, setHasSeenProfilePrompt] = useState(false);

  // Firestore hook
  const firestore = useFirestore();
  
  // Location hook
  const { location, isLoading: locationLoading, requestPermission } = useLocation();

  // Load financial profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await loadFinancialProfile(firestore);
      setFinancialProfile(profile);
    };

    loadProfile();
    setHasSeenProfilePrompt(!!localStorage.getItem('hasSeenProfilePrompt'));

    const handleStorageChange = (e) => {
      if (e.key === 'quickFinancialProfile' || e.key === 'financialProfile') {
        loadProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [firestore.isAuthenticated]);

  // Callbacks
  const handleFinancialProfileUpdate = useCallback(async (profile) => {
    const updatedProfile = {
      ...profile,
      summary: {
        ...profile.summary,
        emergencyFundMonths: profile.summary?.savingsMonths || profile.summary?.emergencyFundMonths || 0
      }
    };

    // Save to Firestore if authenticated
    if (firestore.isAuthenticated) {
      await firestore.saveProfile(updatedProfile);
    }

    setFinancialProfile(updatedProfile);
    dispatchUI({ type: 'TOGGLE_MODAL', modal: 'showFinancialProfile', value: false });
  }, [firestore]);

  const handleImageProcessed = useCallback(async (file, preview) => {
    setImageFile(file);
    setImagePreview(preview);

    if (file) {
      try {
        const base64Image = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          };
          reader.readAsDataURL(file);
        });

        const itemDetails = await analyzeImageWithOpenAI(base64Image);
        if (itemDetails && itemDetails.name && itemDetails.name !== "Error") {
          dispatchForm({
            type: 'SET_ITEM_FROM_IMAGE',
            name: itemDetails.name,
            cost: itemDetails.cost?.toString()
          });
        }
      } catch (error) {
        console.error('Error analyzing image:', error);
      }
    }
  }, []);

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    dispatchForm({ type: 'UPDATE_FIELD', field: 'itemName', value: '' });
  }, []);

  const analyzePurchase = useCallback(async () => {
    // Validation
    if (!formState.itemCost.trim()) {
      alert("Please enter the cost of the item");
      return;
    }

    if (!imageFile && !formState.itemName.trim()) {
      alert("Please either capture an image or enter the item name");
      return;
    }

    // Check for financial profile
    if (!financialProfile && !hasSeenProfilePrompt) {
      const shouldSetupProfile = window.confirm(
        "🎯 Get personalized advice!\n\n" +
        "Add your financial info for recommendations tailored to your situation. " +
        "It only takes 2 minutes and helps us give you better advice.\n\n" +
        "Would you like to set it up now?"
      );

      localStorage.setItem('hasSeenProfilePrompt', 'true');
      setHasSeenProfilePrompt(true);

      if (shouldSetupProfile) {
        dispatchUI({ type: 'TOGGLE_MODAL', modal: 'showFinancialProfile', value: true });
        return;
      }
    }

    // Start analysis
    setMessages([]);
    dispatchUI({ type: 'SET_LOADING', value: true });
    dispatchUI({ type: 'HIDE_RESULTS' });

    try {
      console.log('=== Starting Purchase Analysis ===');
      console.log('Auth status:', { 
        isAuthenticated: firestore.isAuthenticated, 
        authLoading: firestore.authLoading,
        hasUser: !!firestore.user 
      });
      
      const recognizedItemName = formState.itemName;
      const costValue = parseFloat(formState.itemCost);
      let alternative = null;

      // Get current location if not already loaded
      const currentLocation = location || await LocationService.getUserLocation();
      
      // Find alternatives if requested
      if (formState.searchForAlternative) {
        console.log('Finding alternatives...');
        dispatchUI({ type: 'SET_FINDING_ALTERNATIVES', value: true });
        alternative = await findCheaperAlternative(
          recognizedItemName, 
          costValue,
          currentLocation // Pass location
        );
        dispatchUI({ type: 'SET_FINDING_ALTERNATIVES', value: false });
        console.log('Alternatives found:', alternative);
      }

      // Get recommendation
      console.log('Getting recommendation...');
      const recommendation = await getEnhancedPurchaseRecommendation(
        recognizedItemName,
        costValue,
        formState.purpose,
        formState.frequency,
        financialProfile,
        alternative,
        currentLocation // Pass location
      );
      console.log('Recommendation received:', recommendation);

      const mungerMessage = {
        sender: "Munger",
        text: recommendation.summary,
        formatted: {
          decision: recommendation.decision,
          summary: recommendation.summary,
          reasoning: recommendation.reasoning,
          quote: recommendation.quote,
          analysisDetails: { ...recommendation.analysisDetails, itemName: recognizedItemName },
          decisionMatrix: recommendation.decisionMatrix
        },
        alternative: alternative
      };

      setMessages([mungerMessage]);
      
      console.log('Saving to history...');
      await saveToHistory(mungerMessage, formState.itemName, formState.itemCost, firestore);
      console.log('History saved successfully');

      // Reset form
      dispatchForm({ type: 'RESET_FORM' });
      clearImage();

      dispatchUI({ type: 'SHOW_RESULTS' });
      console.log('=== Purchase Analysis Complete ===');
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        sender: "Munger",
        text: "Sorry, I couldn't analyze this purchase right now.",
        formatted: {
          decision: "Error",
          summary: "Sorry, I couldn't analyze this purchase right now. A technical error occurred.",
          reasoning: "Technical error occurred: " + error.message,
          quote: "The big money is not in the buying and selling, but in the waiting."
        }
      };
      setMessages([errorMessage]);
      dispatchUI({ type: 'SHOW_RESULTS' });
    } finally {
      dispatchUI({ type: 'SET_LOADING', value: false });
    }
  }, [formState, imageFile, financialProfile, hasSeenProfilePrompt, clearImage, firestore, location]);

  // Render helpers
  const getHealthScoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getHealthScoreLabel = (score) => {
    if (score >= 70) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className="App">
      
      <div className="hero-section">
        <h1 className="hero-title">To Buy or not to Buy?</h1>
        <p className="hero-subtitle">
          That is the{" "}
          <span
            className="million-link"
            onClick={() => dispatchUI({ type: 'TOGGLE_MODAL', modal: 'showSavingsTracker', value: true })}
          >
            million
          </span>{" "}
          dollar question
        </p>
      </div>

      {/* Financial Profile Section */}
      {financialProfile && financialProfile.summary ? (
        <div className="mini-profile enhanced">
          <div className="mini-profile-header">
            <h3>
              <span className="profile-icon">👤</span>
              Your Financial Snapshot
            </h3>
            <button
              className="update-profile-btn"
              onClick={() => dispatchUI({ type: 'TOGGLE_MODAL', modal: 'showFinancialProfile', value: true })}
              title="Update financial info"
            >
              Update
            </button>
          </div>
          <div className="mini-profile-stats">
            <div className="mini-stat">
              <span className="stat-label">Monthly Net:</span>
              <span className={`stat-value ${financialProfile.summary.monthlyNetIncome >= 0 ? 'positive' : 'negative'}`}>
                ${Math.abs(financialProfile.summary.monthlyNetIncome).toFixed(0)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">Health Score:</span>
              <span
                className="stat-value"
                style={{ color: getHealthScoreColor(financialProfile.summary.healthScore || 50) }}
              >
                {getHealthScoreLabel(financialProfile.summary.healthScore || 50)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">Emergency:</span>
              <span className={`stat-value ${(financialProfile.summary.emergencyFundMonths || 0) >= 3 ? 'positive' : (financialProfile.summary.emergencyFundMonths || 0) >= 1 ? 'warning' : 'negative'}`}>
                {(financialProfile.summary.emergencyFundMonths || 0).toFixed(1)}mo
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="profile-prompt">
          <div className="prompt-content">
            <span className="prompt-icon">🎯</span>
            <p>Get personalized advice based on your financial situation</p>
            <button
              className="setup-profile-btn"
              onClick={() => dispatchUI({ type: 'TOGGLE_MODAL', modal: 'showFinancialProfile', value: true })}
            >
              Quick Setup (2 min)
            </button>
          </div>
        </div>
      )}

      {/* Main Purchase Analysis Card */}
      <div className="purchase-analysis-card">
        <div className="card-header">
          <h2 className="card-title">
            <span className="card-icon">🛒</span>
            Analyze Your Purchase
          </h2>
          <p className="card-subtitle">Tell us about the item you&apos;re considering</p>
        </div>

        <div className="card-body">
          {/* Item Info Form */}
          <div className="item-info-section">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="itemName">Item Name:</label>
                <input
                  id="itemName"
                  type="text"
                  value={formState.itemName}
                  onChange={(e) => dispatchForm({ type: 'UPDATE_FIELD', field: 'itemName', value: e.target.value })}
                  placeholder={imageFile ? "Identifying..." : "What are you considering buying?"}
                  disabled={uiState.loading}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label htmlFor="itemCost">Cost ($):</label>
                <input
                  id="itemCost"
                  type="number"
                  value={formState.itemCost}
                  onChange={(e) => dispatchForm({ type: 'UPDATE_FIELD', field: 'itemCost', value: e.target.value })}
                  placeholder="How much does it cost?"
                  disabled={uiState.loading}
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="purpose">Purpose (optional):</label>
                <input
                  id="purpose"
                  type="text"
                  value={formState.purpose}
                  onChange={(e) => dispatchForm({ type: 'UPDATE_FIELD', field: 'purpose', value: e.target.value })}
                  placeholder="What will you use it for?"
                  disabled={uiState.loading}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label htmlFor="frequency">Frequency of Use (optional):</label>
                <select
                  id="frequency"
                  value={formState.frequency}
                  onChange={(e) => dispatchForm({ type: 'UPDATE_FIELD', field: 'frequency', value: e.target.value })}
                  disabled={uiState.loading}
                  className="select-field"
                >
                  <option value="">Select frequency...</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Rarely">Rarely</option>
                  <option value="One-time">One-time use</option>
                </select>
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <ImageUploadSection
            imageFile={imageFile}
            imagePreview={imagePreview}
            onImageProcessed={handleImageProcessed}
            onClearImage={clearImage}
            showImageOptions={uiState.showImageOptions}
            onToggleImageOptions={(show) => dispatchUI({ type: 'TOGGLE_MODAL', modal: 'showImageOptions', value: show })}
            loading={uiState.loading}
          />

          {/* Options Section */}
          <div className="options-section">
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={formState.searchForAlternative}
                onChange={(e) => dispatchForm({ type: 'UPDATE_FIELD', field: 'searchForAlternative', value: e.target.checked })}
                disabled={uiState.loading}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-label">Find cheaper alternatives online</span>
            </label>
          </div>
        </div>

        <div className="card-footer">
          <button
            onClick={analyzePurchase}
            disabled={uiState.loading || uiState.findingAlternatives}
            className="analyze-btn"
          >
            {uiState.loading ? (
              <span className="btn-content">
                <span className="loading-spinner"></span>
                Analyzing...
              </span>
            ) : uiState.findingAlternatives ? (
              <span className="btn-content">
                <span className="loading-spinner"></span>
                Finding Alternatives...
              </span>
            ) : (
              <span className="btn-content">
                <span className="btn-icon">🤔</span>
                Should I Buy It?
              </span>
            )}
          </button>


        </div>
      </div>

      {/* Result Bubble */}
      {uiState.showResultBubble && messages.length > 0 && (
        <ResultBubble
          messages={messages}
          onClose={() => dispatchUI({ type: 'HIDE_RESULTS' })}
          createGoogleSearchLink={createGoogleSearchLink}
        />
      )}

      {/* Modals */}
      {uiState.showSavingsTracker && (
        <SavingsTracker onClose={() => dispatchUI({ type: 'TOGGLE_MODAL', modal: 'showSavingsTracker', value: false })} />
      )}

      {uiState.showFinancialProfile && (
        <ProgressiveFinancialProfile
          onProfileUpdate={handleFinancialProfileUpdate}
          onClose={() => dispatchUI({ type: 'TOGGLE_MODAL', modal: 'showFinancialProfile', value: false })}
        />
      )}
    </div>
  );
};

export default PurchaseAdvisor;