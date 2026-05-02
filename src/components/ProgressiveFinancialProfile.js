// src/components/ProgressiveFinancialProfile.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useFirestore } from "../hooks/useFirestore";
import "../styles/ProgressiveFinancialProfile.css";

const ProgressiveFinancialProfile = ({ onProfileUpdate, onClose }) => {
  const { user } = useAuth();
  const { saveProfile, getProfile, isAuthenticated } = useFirestore();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    monthlyIncome: "",
    monthlyExpenses: "",
    currentSavings: "",
    riskTolerance: null,
    debtPayments: "",
    financialGoal: "",
  });
  const [includedDebtInExpenses, setIncludedDebtInExpenses] = useState(false);

  // Helper function for safe number conversion
  function toNumber(x) {
    const n = parseFloat(x);
    return Number.isFinite(n) ? n : 0;
  }

  useEffect(() => {
    const loadProfile = async () => {
      if (isAuthenticated) {
        // Load from Firestore if authenticated
        try {
          console.log('Loading financial profile from Firestore...');
          const firestoreProfile = await getProfile();
          if (firestoreProfile) {
            console.log('Firestore profile loaded successfully');
            // Map Firestore profile to quick profile format
            const quickProfile = {
              monthlyIncome: firestoreProfile.monthlyIncome || "",
              monthlyExpenses: calculateTotalExpenses(firestoreProfile),
              currentSavings: firestoreProfile.checkingSavingsBalance || "",
              riskTolerance: firestoreProfile.riskTolerance || null,
              debtPayments: calculateTotalDebtPayments(firestoreProfile),
              financialGoal: firestoreProfile.financialPriorities || "",
            };
            setProfile(quickProfile);
            if (quickProfile.monthlyIncome && quickProfile.monthlyExpenses) setStep(4);
          } else {
            console.log('No Firestore profile found, falling back to localStorage');
            loadFromLocalStorage();
          }
        } catch (error) {
          console.error('Error loading profile from Firestore:', error);
          console.log('Firestore error, falling back to localStorage');
          // Fall back to localStorage
          loadFromLocalStorage();
        }
      } else {
        // Load from localStorage if not authenticated
        console.log('User not authenticated, loading from localStorage');
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      const savedProfile = localStorage.getItem('quickFinancialProfile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setProfile({
          monthlyIncome: parsed.monthlyIncome || "",
          monthlyExpenses: parsed.monthlyExpenses || "",
          currentSavings: parsed.currentSavings || "",
          riskTolerance: parsed.riskTolerance || null,
          debtPayments: parsed.debtPayments || "",
          financialGoal: parsed.financialGoal || "",
        });
        if (parsed.monthlyIncome && parsed.monthlyExpenses) setStep(4);
      }
    };

    const calculateTotalExpenses = (firestoreProfile) => {
      const expenses = [
        firestoreProfile.housingCost,
        firestoreProfile.utilitiesCost,
        firestoreProfile.foodCost,
        firestoreProfile.transportationCost,
        firestoreProfile.insuranceCost,
        firestoreProfile.subscriptionsCost,
        firestoreProfile.otherExpenses
      ];

      const total = expenses.reduce((sum, expense) => {
        return sum + (parseFloat(expense) || 0);
      }, 0);

      return total > 0 ? total.toString() : "";
    };

    const calculateTotalDebtPayments = (firestoreProfile) => {
      const payments = [
        firestoreProfile.creditCardPayment,
        firestoreProfile.studentLoanPayment,
        firestoreProfile.carLoanPayment,
        firestoreProfile.otherDebtPayment
      ];

      const total = payments.reduce((sum, payment) => {
        return sum + (parseFloat(payment) || 0);
      }, 0);

      return total > 0 ? total.toString() : "";
    };

    loadProfile();
  }, [isAuthenticated, getProfile]);

  const questions = [
    {
      title: "What's your monthly income after taxes?",
      field: "monthlyIncome",
      type: "number",
      placeholder: "e.g., 5000",
      prefix: "$",
      help: "This helps us understand your purchasing power"
    },
    {
      title: "Essential monthly expenses (exclude loan/credit-card payments)",
      field: "monthlyExpenses",
      type: "number",
      placeholder: "e.g., 3500",
      prefix: "$",
      help: "Housing (rent or mortgage), utilities, groceries, insurance, subscriptions. Do not include credit-card or loan minimums—we ask next.",
      hasCheckbox: true
    },
    {
      title: "How much do you have in savings?",
      field: "currentSavings",
      type: "number",
      placeholder: "e.g., 10000",
      prefix: "$",
      help: "Your total in checking + savings accounts"
    },
    {
      title: "What's your risk tolerance?",
      field: "riskTolerance",
      type: "choice",
      choices: [
        { value: "low", label: "Low", emoji: "🛡️" },
        { value: "moderate", label: "Moderate", emoji: "⚖️" },
        { value: "high", label: "High", emoji: "🚀" }
      ],
      help: "How comfortable are you with financial risk?"
    },
    {
      title: "Total monthly minimum debt payments",
      field: "debtPayments",
      type: "number",
      placeholder: "e.g., 500",
      prefix: "$",
      help: "Credit cards, auto/student/personal loans (exclude mortgage). Minimums only.",
      optional: true
    },
    {
      title: "What's your main financial goal?",
      field: "financialGoal",
      type: "choice",
      choices: [
        { value: "save", label: "Build savings", emoji: "🏦" },
        { value: "debt", label: "Pay off debt", emoji: "💳" },
        { value: "invest", label: "Grow wealth", emoji: "📈" },
        { value: "balance", label: "Balanced approach", emoji: "⚖️" }
      ]
    }
  ];

  const currentQuestion = questions[step];

  const handleInputChange = value => {
    console.log('Input change:', currentQuestion.field, value);
    setProfile(prev => ({
      ...prev,
      [currentQuestion.field]: value
    }));
  };

  const handleNext = async (e) => {
    // Prevent any default form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('handleNext called, step:', step, 'field:', currentQuestion.field, 'value:', profile[currentQuestion.field]);

    // Validate current input if required
    if (!currentQuestion.optional && !profile[currentQuestion.field]) {
      console.log('Validation failed - field is empty');
      return;
    }

    const updatedProfile = { ...profile };

    // Save to localStorage for immediate access
    localStorage.setItem('quickFinancialProfile', JSON.stringify(updatedProfile));

    if (step < questions.length - 1) {
      setStep(step + 1);
      return;
    }

    // Calculate final metrics when completing using the new formulas
    const income = toNumber(profile.monthlyIncome);
    const expensesInput = toNumber(profile.monthlyExpenses); // should EXCLUDE non-mortgage debt
    const debt = toNumber(profile.debtPayments); // mortgage excluded by copy
    const savings = toNumber(profile.currentSavings);

    // Adjust expenses if user accidentally included debt
    const expenses = (includedDebtInExpenses ? Math.max(0, expensesInput - debt) : expensesInput);

    const monthlyNetIncome = income - expenses - debt;

    const debtToIncomeRatio = (income > 0 && debt > 0)
      ? (debt / income) * 100
      : 0;

    const runwayDenom = Math.max(0, expenses + debt); // total monthly burn (must-pay)
    const emergencyFundMonths = runwayDenom > 0 ? (savings / runwayDenom) : 0;

    // Keep back-compat alias
    const savingsMonths = emergencyFundMonths;
    
    // Derive hasEmergencyFund for internal use (not persisted)
    const hasEmergencyFund = emergencyFundMonths >= 3;

    const healthScore = calculateHealthScore(profile, emergencyFundMonths);

    const summary = {
      monthlyNetIncome,
      debtToIncomeRatio,
      emergencyFundMonths,
      savingsMonths, // backward compatibility
      healthScore,
      hasEmergencyFund: hasEmergencyFund,
      primaryGoal: profile.financialGoal
    };

    const completeProfile = {
      ...profile,
      summary,
      lastUpdated: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem('quickFinancialProfile', JSON.stringify(completeProfile));

    // Save to Firestore if authenticated
    if (isAuthenticated) {
      try {
        console.log('Saving profile to Firestore...');
        await saveProfile({
          monthlyIncome: profile.monthlyIncome,
          incomeFrequency: "monthly",
          otherIncomeSources: "",
          housingCost: "",
          utilitiesCost: "",
          foodCost: "",
          transportationCost: "",
          insuranceCost: "",
          subscriptionsCost: "",
          otherExpenses: profile.monthlyExpenses,
          creditCardDebt: "",
          creditCardPayment: profile.debtPayments,
          studentLoanDebt: "",
          studentLoanPayment: "",
          carLoanDebt: "",
          carLoanPayment: "",
          mortgageDebt: "",
          mortgagePayment: "",
          otherDebt: "",
          otherDebtPayment: "",
          creditScore: "",
          creditLimit: "",
          currentCreditBalance: "",
          checkingSavingsBalance: profile.currentSavings,
          emergencyFund: hasEmergencyFund ? profile.currentSavings : "0",
          retirementAccounts: "",
          stocksAndBonds: "",
          realEstateValue: "",
          otherInvestments: "",
          shortTermGoals: "",
          midTermGoals: "",
          longTermGoals: "",
          purchaseTimeframe: "",
          riskTolerance: profile.riskTolerance,
          financialPriorities: profile.financialGoal,
          summary
        });
        console.log('Profile saved to Firestore successfully');
      } catch (error) {
        console.error('Error saving profile to Firestore:', error);
        console.log('Firestore save failed, but localStorage backup is available');
        // Continue with local storage fallback - don't block the user
      }
    }

    onProfileUpdate(completeProfile);
    onClose();
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    if (currentQuestion.optional) {
      // Clear the field when skipping
      setProfile(prev => ({
        ...prev,
        [currentQuestion.field]: ""
      }));
      handleNext();
    }
  };

  const handleChoiceClick = (e, value) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Choice clicked:', value);
    handleInputChange(value);
  };

  function calculateHealthScore(profile, emergencyFundMonths) {
    let score = 50;
    const income = toNumber(profile.monthlyIncome);
    const expenses = toNumber(profile.monthlyExpenses);
    const savings = toNumber(profile.currentSavings);
    const debt = toNumber(profile.debtPayments);

    if (income > expenses * 1.3) score += 20;
    else if (income > expenses * 1.1) score += 10;
    else if (income < expenses) score -= 20;

    // Use calculated emergencyFundMonths instead of hasEmergencyFund field
    if (emergencyFundMonths >= 3) score += 20;
    else if (emergencyFundMonths >= 1) score += 10;
    else score -= 10;

    if (income > 0) {
      const debtRatio = debt / income;
      if (debtRatio === 0) score += 10;
      else if (debtRatio < 0.2) score += 5;
      else if (debtRatio > 0.4) score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  const progress = ((step + 1) / questions.length) * 100;

  return (
    <div className="pfp-overlay" onClick={(e) => {
      if (e.target.className === 'pfp-overlay') onClose();
    }}>
      <div className="pfp-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pfp-close" onClick={onClose} aria-label="Close" type="button">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="pfp-header">
          <h2 className="pfp-title">Quick Financial Check-in</h2>
          <p className="pfp-subtitle">
            Answer a few questions for personalized purchase advice
          </p>
        </div>

        <div className="pfp-progress">
          <div className="pfp-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="pfp-content">
          <div className="pfp-question">
            <h3>{currentQuestion.title}</h3>
            {currentQuestion.help && (
              <p className="pfp-help">{currentQuestion.help}</p>
            )}

            {currentQuestion.type === 'number' && (
              <div className="pfp-input-wrapper">
                <div className="pfp-input-group">
                  <span className="pfp-prefix">{currentQuestion.prefix}</span>
                  <input
                    type="number"
                    value={profile[currentQuestion.field] || ''}
                    onChange={e => handleInputChange(e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className="pfp-input"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNext();
                      }
                    }}
                  />
                </div>
                {currentQuestion.hasCheckbox && (
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginTop: '12px',
                    fontSize: '0.875rem',
                    color: '#f59e0b',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={includedDebtInExpenses}
                      onChange={(e) => setIncludedDebtInExpenses(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    I accidentally included loan/credit-card payments above
                  </label>
                )}
              </div>
            )}

            {currentQuestion.type === 'choice' && (
              <div className="pfp-choices">
                {currentQuestion.choices.map(choice => (
                  <button
                    key={choice.value}
                    className={`pfp-choice ${profile[currentQuestion.field] === choice.value ? 'selected' : ''}`}
                    onClick={(e) => handleChoiceClick(e, choice.value)}
                    type="button"
                  >
                    <span className="pfp-choice-emoji">{choice.emoji}</span>
                    <span className="pfp-choice-label">{choice.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pfp-actions">
          {step > 0 && (
            <button
              className="pfp-button pfp-back"
              onClick={handleBack}
              type="button"
            >
              Back
            </button>
          )}
          {currentQuestion.optional && (
            <button
              className="pfp-button pfp-skip"
              onClick={handleSkip}
              type="button"
            >
              Skip
            </button>
          )}
          <button
            className="pfp-button pfp-next"
            onClick={handleNext}
            disabled={!profile[currentQuestion.field] && !currentQuestion.optional}
            type="button"
            style={{ 
              pointerEvents: (!profile[currentQuestion.field] && !currentQuestion.optional) ? 'none' : 'auto',
              opacity: (!profile[currentQuestion.field] && !currentQuestion.optional) ? 0.5 : 1
            }}
          >
            {step === questions.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>

        <div className="pfp-footer">
          <p>
            {isAuthenticated
              ? "Your data is securely saved to your account"
              : "Your data is saved locally and never shared"
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default ProgressiveFinancialProfile;