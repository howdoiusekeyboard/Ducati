/**
 * Unit Tests for Post-Purchase Projection Helper
 * Phase 9 product-logic — additive consequence-projection on top of decision model.
 */

import {
  computeProjection,
  VALID_PAYMENT_METHODS,
} from '../../src/lib/postPurchaseProjection';

const FE_SHAPE_PROFILE = {
  monthlyIncome: '5000',
  monthlyExpenses: '3000',
  currentSavings: '10000',
  debtPayments: '500',
  summary: {
    monthlyNetIncome: 1500,
    emergencyFundMonths: 10000 / 3000, // 3.333
    debtToIncomeRatio: (500 / 5000) * 100, // 10
    healthScore: 70,
  },
};

const FIRESTORE_SHAPE_PROFILE = {
  monthlyIncome: '5000',
  housingCost: '1500',
  utilitiesCost: '300',
  foodCost: '600',
  transportationCost: '400',
  insuranceCost: '100',
  subscriptionsCost: '50',
  otherExpenses: '50',
  creditCardPayment: '300',
  studentLoanPayment: '200',
  carLoanPayment: '0',
  mortgagePayment: '0',
  otherDebtPayment: '0',
  checkingSavingsBalance: '4000',
  emergencyFund: '5000',
  retirementAccounts: '1000',
  stocksAndBonds: '0',
  summary: {
    monthlyNetIncome: 5000 - 3000 - 500,
    emergencyFundMonths: 10000 / 3000,
    debtToIncomeRatio: 10,
    healthScore: 72,
  },
};

describe('computeProjection — cash branch', () => {
  it('reduces projectedSavings by cost', () => {
    const projection = computeProjection(FE_SHAPE_PROFILE, 1500, 'cash');
    expect(projection.projectedSavings).toBeCloseTo(8500, 5);
    expect(projection.delta.savings).toBeCloseTo(-1500, 5);
  });

  it('reduces projectedEmergencyFundMonths proportionally', () => {
    const projection = computeProjection(FE_SHAPE_PROFILE, 1500, 'cash');
    // monthlyBurn = 10000 / 3.333 = 3000
    // newSavings = 8500; newEmergencyFundMonths = 8500 / 3000 = 2.833
    expect(projection.projectedEmergencyFundMonths).toBeCloseTo(8500 / 3000, 4);
    expect(projection.delta.emergencyFundMonths).toBeCloseTo(8500 / 3000 - 10000 / 3000, 4);
  });

  it('leaves projectedDtiRatio unchanged on cash', () => {
    const projection = computeProjection(FE_SHAPE_PROFILE, 1500, 'cash');
    expect(projection.projectedDtiRatio).toBeCloseTo(10, 5);
    expect(projection.delta.dtiRatio).toBe(0);
  });

  it('echoes paymentMethod', () => {
    const projection = computeProjection(FE_SHAPE_PROFILE, 1500, 'cash');
    expect(projection.paymentMethod).toBe('cash');
  });

  it('drops projectedHealthScore when emergency fund crosses 3-month threshold', () => {
    // currentEmergencyFundMonths = 3.333 → projected = 8500/3000 = 2.833 (crosses below 3)
    const projection = computeProjection(FE_SHAPE_PROFILE, 1500, 'cash');
    expect(projection.delta.healthScore).toBeLessThan(0);
  });

  it('uses Firestore-shape totals when no FE-shape currentSavings', () => {
    const projection = computeProjection(FIRESTORE_SHAPE_PROFILE, 1500, 'cash');
    // currentSavings (Firestore) = 4000+5000+1000+0 = 10000
    // newSavings = 10000 - 1500 = 8500
    expect(projection.projectedSavings).toBeCloseTo(8500, 5);
  });
});
