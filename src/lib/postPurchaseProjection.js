/**
 * Post-Purchase Projection Helper (Phase 9 product-logic)
 *
 * Computes the post-purchase delta across cash / credit / EMI branches.
 * Pure-math; returns null when profile data is insufficient. The structured
 * decision model surfaces this as `projection` alongside its existing fields.
 *
 * Math model:
 *   - cash: cost out of total savings; emergency-fund runway shrinks; DTI unchanged
 *   - credit: cost stays in savings (revolving balance); DTI rises by 5% min-payment service
 *   - emi-N: cost stays in savings; DTI rises by (cost / N) / monthlyIncome (0% interest, UAE retailer norm)
 */

export const VALID_PAYMENT_METHODS = Object.freeze([
  'cash',
  'credit',
  'emi-3',
  'emi-6',
  'emi-12',
  'emi-24',
  'emi-36',
]);

const CREDIT_MIN_PAYMENT_RATE = 0.05; // UAE standard 5% credit-card minimum monthly payment
const PAYMENT_METHODS_SET = new Set(VALID_PAYMENT_METHODS);

const toNum = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

/**
 * Total savings — prefers Firestore breakdown sum; falls back to FE-shape currentSavings string.
 */
function computeCurrentSavings(profile) {
  const checking = toNum(profile?.checkingSavingsBalance);
  const emergency = toNum(profile?.emergencyFund);
  const retirement = toNum(profile?.retirementAccounts);
  const stocks = toNum(profile?.stocksAndBonds);

  // If any Firestore-breakdown field is populated, use the breakdown sum.
  if (checking !== null || emergency !== null || retirement !== null || stocks !== null) {
    return (checking ?? 0) + (emergency ?? 0) + (retirement ?? 0) + (stocks ?? 0);
  }

  // Fall back to FE-shape currentSavings (single field).
  const feSavings = toNum(profile?.currentSavings);
  return feSavings;
}

/**
 * Approximate health score from summary-style fields. Same threshold structure as
 * ProgressiveFinancialProfile.js#calculateHealthScore but operates on monthlyNetIncome
 * (since raw monthlyExpenses/debtPayments are profile-shape-dependent).
 *
 * Used for both current and projected so delta.healthScore is internally consistent.
 */
function projectHealthScoreApprox({ monthlyNetIncome, emergencyFundMonths, debtToIncomeRatio }) {
  let score = 50;

  // Monthly net income surplus/deficit (proxy for income vs expenses ratio)
  if (monthlyNetIncome > 0) score += 20;
  else if (monthlyNetIncome === 0) score += 0;
  else score -= 20;

  // Emergency fund runway
  if (emergencyFundMonths >= 3) score += 20;
  else if (emergencyFundMonths >= 1) score += 10;
  else score -= 10;

  // Debt-to-income ratio
  if (debtToIncomeRatio === 0) score += 10;
  else if (debtToIncomeRatio < 20) score += 5;
  else if (debtToIncomeRatio > 40) score -= 15;

  return Math.max(0, Math.min(100, score));
}

/**
 * Compute post-purchase projection. Returns null on insufficient data.
 *
 * @param {object} profile - Financial profile (FE-quick or Firestore shape)
 * @param {number} cost - Purchase cost
 * @param {string} paymentMethod - One of VALID_PAYMENT_METHODS
 * @returns {object | null}
 */
export function computeProjection(profile, cost, paymentMethod) {
  if (!PAYMENT_METHODS_SET.has(paymentMethod)) {
    throw new Error(
      `Invalid paymentMethod: ${paymentMethod}. Expected one of ${VALID_PAYMENT_METHODS.join(', ')}.`
    );
  }

  if (!profile?.summary || !Number.isFinite(cost) || cost < 0) return null;

  const monthlyNetIncome = toNum(profile.summary.monthlyNetIncome);
  const emergencyFundMonths = toNum(profile.summary.emergencyFundMonths);
  const debtToIncomeRatio = toNum(profile.summary.debtToIncomeRatio);
  const monthlyIncome = toNum(profile.monthlyIncome);

  if (monthlyNetIncome === null || monthlyNetIncome <= 0) return null;
  if (emergencyFundMonths === null || emergencyFundMonths <= 0) return null;
  if (monthlyIncome === null || monthlyIncome <= 0) return null;

  const currentSavings = computeCurrentSavings(profile);
  if (currentSavings === null || currentSavings <= 0) return null;

  const monthlyBurn = currentSavings / emergencyFundMonths;
  if (!Number.isFinite(monthlyBurn) || monthlyBurn <= 0) return null;

  const currentDti = debtToIncomeRatio ?? 0;

  let projectedSavings = currentSavings;
  let projectedDti = currentDti;

  if (paymentMethod === 'cash') {
    projectedSavings = currentSavings - cost;
  } else if (paymentMethod === 'credit') {
    const addedMonthlyService = cost * CREDIT_MIN_PAYMENT_RATE;
    projectedDti = currentDti + (addedMonthlyService / monthlyIncome) * 100;
  } else {
    // emi-N
    const months = parseInt(paymentMethod.slice(4), 10);
    const monthlyEmi = cost / months;
    projectedDti = currentDti + (monthlyEmi / monthlyIncome) * 100;
  }

  const projectedEmergencyFundMonths = projectedSavings / monthlyBurn;

  const currentHealthScoreApprox = projectHealthScoreApprox({
    monthlyNetIncome,
    emergencyFundMonths,
    debtToIncomeRatio: currentDti,
  });

  const projectedHealthScore = projectHealthScoreApprox({
    monthlyNetIncome,
    emergencyFundMonths: projectedEmergencyFundMonths,
    debtToIncomeRatio: projectedDti,
  });

  return {
    paymentMethod,
    projectedSavings,
    projectedEmergencyFundMonths,
    projectedHealthScore,
    projectedDtiRatio: projectedDti,
    delta: {
      savings: projectedSavings - currentSavings,
      emergencyFundMonths: projectedEmergencyFundMonths - emergencyFundMonths,
      healthScore: projectedHealthScore - currentHealthScoreApprox,
      dtiRatio: projectedDti - currentDti,
    },
  };
}
