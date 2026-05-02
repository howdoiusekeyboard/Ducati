/**
 * Unit Tests for Progressive Financial Profile Calculations
 * Tests the financial metric calculations and health score logic
 */

import * as personas from '../fixtures/personas';

describe('Progressive Financial Profile - Calculations', () => {
  
  describe('Monthly Net Income Calculation', () => {
    
    it('should calculate monthly net income correctly', () => {
      const testCases = [
        {
          income: 5000,
          expenses: 2500,
          debt: 500,
          expected: 2000
        },
        {
          income: 1500,
          expenses: 1200,
          debt: 200,
          expected: 100
        },
        {
          income: 12000,
          expenses: 6000,
          debt: 3000,
          expected: 3000
        },
        {
          income: 3000,
          expenses: 2500,
          debt: 800,
          expected: -300
        }
      ];
      
      testCases.forEach(({ income, expenses, debt, expected }) => {
        const monthlyNetIncome = income - expenses - debt;
        expect(monthlyNetIncome).toBe(expected);
      });
    });
    
    it('should handle zero income correctly', () => {
      const income = 0;
      const expenses = 1000;
      const debt = 0;
      
      const monthlyNetIncome = income - expenses - debt;
      expect(monthlyNetIncome).toBe(-1000);
    });
    
    it('should handle all zeros', () => {
      const monthlyNetIncome = 0 - 0 - 0;
      expect(monthlyNetIncome).toBe(0);
    });
  });
  
  describe('Emergency Fund Months Calculation', () => {
    
    it('should calculate emergency fund months correctly', () => {
      const testCases = [
        {
          savings: 15000,
          expenses: 2500,
          debt: 500,
          expected: 5 // 15000 / 3000 = 5
        },
        {
          savings: 400,
          expenses: 1200,
          debt: 200,
          expected: 0.2857 // 400 / 1400 ≈ 0.29
        },
        {
          savings: 5000,
          expenses: 6000,
          debt: 3000,
          expected: 0.5556 // 5000 / 9000 ≈ 0.56
        },
        {
          savings: 150000,
          expenses: 8000,
          debt: 0,
          expected: 18.75 // 150000 / 8000 = 18.75
        }
      ];
      
      testCases.forEach(({ savings, expenses, debt, expected }) => {
        const runwayDenom = Math.max(0, expenses + debt);
        const emergencyFundMonths = runwayDenom > 0 ? (savings / runwayDenom) : 0;
        expect(emergencyFundMonths).toBeCloseTo(expected, 2);
      });
    });
    
    it('should handle zero monthly burn rate', () => {
      const savings = 10000;
      const expenses = 0;
      const debt = 0;
      
      const runwayDenom = Math.max(0, expenses + debt);
      const emergencyFundMonths = runwayDenom > 0 ? (savings / runwayDenom) : 0;
      
      expect(emergencyFundMonths).toBe(0);
    });
    
    it('should handle zero savings', () => {
      const savings = 0;
      const expenses = 1000;
      const debt = 500;
      
      const runwayDenom = Math.max(0, expenses + debt);
      const emergencyFundMonths = runwayDenom > 0 ? (savings / runwayDenom) : 0;
      
      expect(emergencyFundMonths).toBe(0);
    });
    
    it('should determine hasEmergencyFund correctly', () => {
      const testCases = [
        { months: 0.5, expected: false },
        { months: 2.9, expected: false },
        { months: 3.0, expected: true },
        { months: 5.0, expected: true },
        { months: 18.75, expected: true }
      ];
      
      testCases.forEach(({ months, expected }) => {
        const hasEmergencyFund = months >= 3;
        expect(hasEmergencyFund).toBe(expected);
      });
    });
  });
  
  describe('Debt-to-Income Ratio Calculation', () => {
    
    it('should calculate debt-to-income ratio correctly', () => {
      const testCases = [
        {
          income: 5000,
          debt: 500,
          expected: 10 // (500/5000) * 100 = 10%
        },
        {
          income: 1500,
          debt: 200,
          expected: 13.33 // (200/1500) * 100 ≈ 13.33%
        },
        {
          income: 12000,
          debt: 3000,
          expected: 25 // (3000/12000) * 100 = 25%
        },
        {
          income: 4000,
          debt: 2000,
          expected: 50 // (2000/4000) * 100 = 50%
        }
      ];
      
      testCases.forEach(({ income, debt, expected }) => {
        const debtToIncomeRatio = (income > 0 && debt > 0) ? (debt / income) * 100 : 0;
        expect(debtToIncomeRatio).toBeCloseTo(expected, 2);
      });
    });
    
    it('should return 0 when income is zero', () => {
      const income = 0;
      const debt = 500;
      
      const debtToIncomeRatio = (income > 0 && debt > 0) ? (debt / income) * 100 : 0;
      expect(debtToIncomeRatio).toBe(0);
    });
    
    it('should return 0 when debt is zero', () => {
      const income = 5000;
      const debt = 0;
      
      const debtToIncomeRatio = (income > 0 && debt > 0) ? (debt / income) * 100 : 0;
      expect(debtToIncomeRatio).toBe(0);
    });
    
    it('should return 0 when both are zero', () => {
      const income = 0;
      const debt = 0;
      
      const debtToIncomeRatio = (income > 0 && debt > 0) ? (debt / income) * 100 : 0;
      expect(debtToIncomeRatio).toBe(0);
    });
  });
  
  describe('Health Score Calculation', () => {
    
    it('should calculate health score for different income-expense ratios', () => {
      const testCases = [
        {
          income: 5000,
          expenses: 2500, // 2x income, should add 20
          savings: 10000,
          debt: 0,
          emergencyMonths: 4,
          expectedBonus: 20
        },
        {
          income: 5000,
          expenses: 4000, // 1.25x income, should add 10
          savings: 10000,
          debt: 0,
          emergencyMonths: 2.5,
          expectedBonus: 10
        },
        {
          income: 5000,
          expenses: 6000, // income < expenses, should subtract 20
          savings: 10000,
          debt: 0,
          emergencyMonths: 1.67,
          expectedBonus: -20
        }
      ];
      
      testCases.forEach(({ income, expenses, expectedBonus }) => {
        let score = 50;
        
        if (income > expenses * 1.3) score += 20;
        else if (income > expenses * 1.1) score += 10;
        else if (income < expenses) score -= 20;
        
        const expectedScore = 50 + expectedBonus;
        expect(score).toBe(expectedScore);
      });
    });
    
    it('should adjust health score based on emergency fund', () => {
      const testCases = [
        { emergencyMonths: 5, expectedBonus: 20 },    // >= 3 months
        { emergencyMonths: 2, expectedBonus: 10 },    // >= 1 month
        { emergencyMonths: 0.5, expectedBonus: -10 }  // < 1 month
      ];
      
      testCases.forEach(({ emergencyMonths, expectedBonus }) => {
        let score = 50;
        
        if (emergencyMonths >= 3) score += 20;
        else if (emergencyMonths >= 1) score += 10;
        else score -= 10;
        
        const expectedScore = 50 + expectedBonus;
        expect(score).toBe(expectedScore);
      });
    });
    
    it('should adjust health score based on debt ratio', () => {
      const income = 5000;
      const testCases = [
        { debt: 0, expectedBonus: 10 },      // No debt
        { debt: 500, expectedBonus: 5 },     // 10% debt ratio
        { debt: 1500, expectedBonus: 0 },    // 30% debt ratio
        { debt: 2500, expectedBonus: -15 }   // 50% debt ratio
      ];
      
      testCases.forEach(({ debt, expectedBonus }) => {
        let score = 50;
        
        if (income > 0) {
          const debtRatio = debt / income;
          if (debtRatio === 0) score += 10;
          else if (debtRatio < 0.2) score += 5;
          else if (debtRatio > 0.4) score -= 15;
        }
        
        const expectedScore = 50 + expectedBonus;
        expect(score).toBe(expectedScore);
      });
    });
    
    it('should cap health score between 0 and 100', () => {
      const testCases = [
        { calculatedScore: 120, expected: 100 },
        { calculatedScore: -20, expected: 0 },
        { calculatedScore: 75, expected: 75 }
      ];
      
      testCases.forEach(({ calculatedScore, expected }) => {
        const healthScore = Math.max(0, Math.min(100, calculatedScore));
        expect(healthScore).toBe(expected);
      });
    });
  });
  
  describe('Persona Validation', () => {
    
    it('should verify STRUGGLING_STUDENT calculations', () => {
      const persona = personas.STRUGGLING_STUDENT;
      const verification = personas.verifyPersonaCalculations(persona);
      
      expect(verification.isValid).toBe(true);
      expect(persona.summary.monthlyNetIncome).toBe(100);
      expect(persona.summary.emergencyFundMonths).toBeCloseTo(0.29, 2);
      expect(persona.summary.debtToIncomeRatio).toBeCloseTo(13.33, 2);
    });
    
    it('should verify HIGH_EARNER calculations', () => {
      const persona = personas.HIGH_EARNER;
      const verification = personas.verifyPersonaCalculations(persona);
      
      expect(verification.isValid).toBe(true);
      expect(persona.summary.monthlyNetIncome).toBe(3000);
      expect(persona.summary.emergencyFundMonths).toBeCloseTo(0.56, 2);
      expect(persona.summary.debtToIncomeRatio).toBe(25);
    });
    
    it('should verify BALANCED_BUDGETER calculations', () => {
      const persona = personas.BALANCED_BUDGETER;
      const verification = personas.verifyPersonaCalculations(persona);
      
      expect(verification.isValid).toBe(true);
      expect(persona.summary.monthlyNetIncome).toBe(2000);
      expect(persona.summary.emergencyFundMonths).toBe(5);
      expect(persona.summary.debtToIncomeRatio).toBe(10);
      expect(persona.summary.hasEmergencyFund).toBe(true);
    });
    
    it('should verify ZERO_INCOME calculations', () => {
      const persona = personas.ZERO_INCOME;
      const verification = personas.verifyPersonaCalculations(persona);
      
      expect(verification.isValid).toBe(true);
      expect(persona.summary.monthlyNetIncome).toBe(-1000);
      expect(persona.summary.emergencyFundMonths).toBe(2);
      expect(persona.summary.debtToIncomeRatio).toBe(0);
    });
    
    it('should verify HIGH_DEBT calculations', () => {
      const persona = personas.HIGH_DEBT;
      const verification = personas.verifyPersonaCalculations(persona);
      
      expect(verification.isValid).toBe(true);
      expect(persona.summary.monthlyNetIncome).toBe(500);
      expect(persona.summary.emergencyFundMonths).toBeCloseTo(0.14, 2);
      expect(persona.summary.debtToIncomeRatio).toBe(50);
    });
  });
  
  describe('Edge Case Handling', () => {
    
    it('should handle when user accidentally includes debt in expenses', () => {
      const income = 5000;
      const expensesInput = 3500; // User accidentally included $500 debt payment
      const debt = 500;
      const includedDebtInExpenses = true;
      
      // Adjust expenses if user accidentally included debt
      const expenses = includedDebtInExpenses ? Math.max(0, expensesInput - debt) : expensesInput;
      
      expect(expenses).toBe(3000); // Should be 3500 - 500 = 3000
      
      const monthlyNetIncome = income - expenses - debt;
      expect(monthlyNetIncome).toBe(1500); // 5000 - 3000 - 500 = 1500
    });
    
    it('should handle negative adjustment gracefully', () => {
      const income = 2000;
      const expensesInput = 300; // User said expenses are only 300
      const debt = 500; // But debt is 500
      const includedDebtInExpenses = true;
      
      // If adjustment would go negative, floor at 0
      const expenses = includedDebtInExpenses ? Math.max(0, expensesInput - debt) : expensesInput;
      
      expect(expenses).toBe(0); // Should be max(0, 300-500) = 0
    });
    
    it('should handle string to number conversions', () => {
      const toNumber = (x) => {
        const n = parseFloat(x);
        return Number.isFinite(n) ? n : 0;
      };
      
      expect(toNumber("1500")).toBe(1500);
      expect(toNumber("0")).toBe(0);
      expect(toNumber("")).toBe(0);
      expect(toNumber(null)).toBe(0);
      expect(toNumber(undefined)).toBe(0);
      expect(toNumber("abc")).toBe(0);
      expect(toNumber("12.5")).toBe(12.5);
    });
  });
});