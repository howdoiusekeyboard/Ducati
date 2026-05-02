/**
 * Test Personas for Ducati Purchase Recommendation Engine
 * Each persona represents a distinct financial situation to test the WDM logic
 */

// Helper function to calculate summary metrics
const calculateSummary = (persona) => {
  const income = parseFloat(persona.monthlyIncome) || 0;
  const expenses = parseFloat(persona.monthlyExpenses) || 0;
  const debt = parseFloat(persona.debtPayments) || 0;
  const savings = parseFloat(persona.currentSavings) || 0;
  
  const monthlyNetIncome = income - expenses - debt;
  const debtToIncomeRatio = income > 0 && debt > 0 ? (debt / income) * 100 : 0;
  
  // Total monthly burn (expenses + debt)
  const runwayDenom = Math.max(0, expenses + debt);
  const emergencyFundMonths = runwayDenom > 0 ? (savings / runwayDenom) : 0;
  
  // Calculate health score (matching ProgressiveFinancialProfile logic)
  let healthScore = 50;
  
  // Income vs expenses scoring
  if (income > expenses * 1.3) healthScore += 20;
  else if (income > expenses * 1.1) healthScore += 10;
  else if (income < expenses) healthScore -= 20;
  
  // Emergency fund scoring
  if (emergencyFundMonths >= 3) healthScore += 20;
  else if (emergencyFundMonths >= 1) healthScore += 10;
  else healthScore -= 10;
  
  // Debt ratio scoring
  if (income > 0) {
    const debtRatio = debt / income;
    if (debtRatio === 0) healthScore += 10;
    else if (debtRatio < 0.2) healthScore += 5;
    else if (debtRatio > 0.4) healthScore -= 15;
  }
  
  healthScore = Math.max(0, Math.min(100, healthScore));
  
  return {
    monthlyNetIncome,
    debtToIncomeRatio,
    emergencyFundMonths,
    savingsMonths: emergencyFundMonths, // backward compatibility
    healthScore,
    hasEmergencyFund: emergencyFundMonths >= 3,
    primaryGoal: persona.financialGoal
  };
};

// Persona A: Struggling Student Sarah
export const STRUGGLING_STUDENT = {
  monthlyIncome: "1500",
  monthlyExpenses: "1200",
  currentSavings: "400",
  riskTolerance: "low",
  debtPayments: "200",
  financialGoal: "save",
  summary: null // Will be calculated
};
STRUGGLING_STUDENT.summary = calculateSummary(STRUGGLING_STUDENT);

// Persona B: High-Earner Henry
export const HIGH_EARNER = {
  monthlyIncome: "12000",
  monthlyExpenses: "6000",
  currentSavings: "5000",
  riskTolerance: "high",
  debtPayments: "3000",
  financialGoal: "balance",
  summary: null // Will be calculated
};
HIGH_EARNER.summary = calculateSummary(HIGH_EARNER);

// Persona C: Balanced Barbara
export const BALANCED_BUDGETER = {
  monthlyIncome: "5000",
  monthlyExpenses: "2500",
  currentSavings: "15000",
  riskTolerance: "moderate",
  debtPayments: "500",
  financialGoal: "invest",
  summary: null // Will be calculated
};
BALANCED_BUDGETER.summary = calculateSummary(BALANCED_BUDGETER);

// Additional edge case personas for comprehensive testing

// Edge Case 1: Zero Income Ian
export const ZERO_INCOME = {
  monthlyIncome: "0",
  monthlyExpenses: "1000",
  currentSavings: "2000",
  riskTolerance: "low",
  debtPayments: "0",
  financialGoal: "save",
  summary: null
};
ZERO_INCOME.summary = calculateSummary(ZERO_INCOME);

// Edge Case 2: High Debt Hannah
export const HIGH_DEBT = {
  monthlyIncome: "4000",
  monthlyExpenses: "1500",
  currentSavings: "500",
  riskTolerance: "low",
  debtPayments: "2000",
  financialGoal: "debt",
  summary: null
};
HIGH_DEBT.summary = calculateSummary(HIGH_DEBT);

// Edge Case 3: Wealthy Wendy
export const WEALTHY = {
  monthlyIncome: "25000",
  monthlyExpenses: "8000",
  currentSavings: "150000",
  riskTolerance: "high",
  debtPayments: "0",
  financialGoal: "invest",
  summary: null
};
WEALTHY.summary = calculateSummary(WEALTHY);

// Edge Case 4: Negative Cash Flow Nick
export const NEGATIVE_CASH_FLOW = {
  monthlyIncome: "3000",
  monthlyExpenses: "2500",
  currentSavings: "1000",
  riskTolerance: "moderate",
  debtPayments: "800",
  financialGoal: "balance",
  summary: null
};
NEGATIVE_CASH_FLOW.summary = calculateSummary(NEGATIVE_CASH_FLOW);

// Export all personas as a collection
export const ALL_PERSONAS = {
  STRUGGLING_STUDENT,
  HIGH_EARNER,
  BALANCED_BUDGETER,
  ZERO_INCOME,
  HIGH_DEBT,
  WEALTHY,
  NEGATIVE_CASH_FLOW
};

// Verification function for testing
export const verifyPersonaCalculations = (persona) => {
  const expected = calculateSummary(persona);
  const actual = persona.summary;
  
  return {
    isValid: JSON.stringify(expected) === JSON.stringify(actual),
    expected,
    actual
  };
};