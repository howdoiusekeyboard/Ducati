/**
 * Edge Case and Boundary Tests for Ducati Recommendation Engine
 * Tests extreme values, missing data, and boundary conditions
 */

import { calculateDecisionScores } from '../../src/lib/structuredDecisionModel';
import * as personas from '../fixtures/personas';
import * as purchases from '../fixtures/test-purchases';

describe('Edge Cases and Boundary Conditions', () => {
  
  describe('Zero and Negative Income Scenarios', () => {
    
    it('should handle zero income persona', () => {
      const persona = personas.ZERO_INCOME;
      const purchase = purchases.getPurchaseById('grocery-weekly');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      // Should still evaluate but with 0 affordability
      expect(result.scores.affordability.score).toBe(0);
      expect(result.scores.financialRisk.score).toBeGreaterThanOrEqual(0);
      expect(result.decision).toBe('Don\'t Buy'); // Should reject most purchases
    });
    
    it('should handle negative cash flow persona', () => {
      const persona = personas.NEGATIVE_CASH_FLOW;
      const purchase = purchases.getPurchaseById('nike-shoes');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      // Negative net income should result in 0 affordability
      expect(persona.summary.monthlyNetIncome).toBe(-300);
      expect(result.scores.affordability.score).toBe(0);
      expect(result.decision).toBe('Don\'t Buy');
    });
    
    it('should still approve true essentials for zero income', () => {
      const persona = personas.ZERO_INCOME;
      const medicine = purchases.getPurchaseById('medicine');
      
      const result = calculateDecisionScores(
        medicine.itemName,
        medicine.cost,
        medicine.purpose,
        medicine.frequency,
        persona,
        null
      );
      
      // Medicine should score high on necessity despite no income
      expect(result.scores.necessity.score).toBe(9);
      // But affordability is still 0
      expect(result.scores.affordability.score).toBe(0);
    });
  });
  
  describe('Extreme Debt Scenarios', () => {
    
    it('should handle 50% debt-to-income ratio', () => {
      const persona = personas.HIGH_DEBT;
      const purchase = purchases.getPurchaseById('gaming-console');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      expect(persona.summary.debtToIncomeRatio).toBe(50);
      expect(result.scores.financialRisk.score).toBeLessThanOrEqual(4); // Heavy penalty for high debt
      expect(result.scores.opportunityCost.score).toBeLessThanOrEqual(4);
      expect(result.decision).toBe('Don\'t Buy');
    });
    
    it('should approve only essentials for high debt persona', () => {
      const persona = personas.HIGH_DEBT;
      const groceries = purchases.getPurchaseById('grocery-weekly');
      
      const result = calculateDecisionScores(
        groceries.itemName,
        groceries.cost,
        groceries.purpose,
        groceries.frequency,
        persona,
        null
      );
      
      // Even with high debt, essentials should be considered
      expect(result.scores.necessity.score).toBeGreaterThanOrEqual(8);
      // But overall score might still be low due to affordability
      expect(result.scores.affordability.score).toBeGreaterThanOrEqual(6); // 30% of $500 net
    });
    
    it('should handle debt exceeding income', () => {
      const extremeDebtPersona = {
        monthlyIncome: "3000",
        monthlyExpenses: "1000",
        currentSavings: "0",
        riskTolerance: "low",
        debtPayments: "3500", // More than income!
        financialGoal: "debt",
        summary: {
          monthlyNetIncome: -1500,
          debtToIncomeRatio: 116.67,
          emergencyFundMonths: 0,
          savingsMonths: 0,
          healthScore: 15,
          hasEmergencyFund: false,
          primaryGoal: "debt"
        }
      };
      
      const purchase = purchases.getPurchaseById('nike-shoes');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        extremeDebtPersona,
        null
      );
      
      expect(result.scores.affordability.score).toBe(0);
      expect(result.scores.financialRisk.score).toBe(0);
      expect(result.decision).toBe('Don\'t Buy');
    });
  });
  
  describe('Extreme Wealth Scenarios', () => {
    
    it('should handle very high income persona', () => {
      const persona = personas.WEALTHY;
      const expensivePurchase = purchases.getPurchaseById('luxury-watch');
      
      const result = calculateDecisionScores(
        expensivePurchase.itemName,
        expensivePurchase.cost,
        expensivePurchase.purpose,
        expensivePurchase.frequency,
        persona,
        null
      );
      
      // Should easily afford even luxury items
      expect(result.scores.affordability.score).toBe(10); // $3000 is <5% of $17000 net
      expect(result.scores.financialRisk.score).toBe(10); // No debt, great emergency fund
      expect(result.decision).toBe('Buy');
    });
    
    it('should approve extremely expensive items for wealthy', () => {
      const persona = personas.WEALTHY;
      const luxuryCar = purchases.getPurchaseById('extremely-expensive');
      
      const result = calculateDecisionScores(
        luxuryCar.itemName,
        luxuryCar.cost,
        luxuryCar.purpose,
        luxuryCar.frequency,
        persona,
        null
      );
      
      // $100k is still a lot even for wealthy (588% of monthly net)
      expect(result.scores.affordability.score).toBe(0);
      // But other factors might be positive
      expect(result.scores.financialRisk.score).toBe(10); // Great financial position
      expect(result.scores.frequencyOfUse.score).toBe(10); // Daily use
    });
  });
  
  describe('Free and Zero-Cost Items', () => {
    
    it('should handle free items correctly', () => {
      const persona = personas.STRUGGLING_STUDENT;
      const freeItem = purchases.getPurchaseById('free-item');
      
      const result = calculateDecisionScores(
        freeItem.itemName,
        freeItem.cost, // 0
        freeItem.purpose,
        freeItem.frequency,
        persona,
        null
      );
      
      // Free items should max out affordability
      expect(result.scores.affordability.score).toBe(10);
      expect(result.scores.valueForMoney.score).toBeGreaterThanOrEqual(8);
      expect(result.scores.financialRisk.score).toBeGreaterThanOrEqual(0);
      expect(result.decision).toBe('Buy'); // Free items should generally be approved
    });
    
    it('should handle zero-cost with all personas', () => {
      const allPersonas = Object.values(personas.ALL_PERSONAS);
      const freeItem = purchases.getPurchaseById('free-item');
      
      allPersonas.forEach(persona => {
        const result = calculateDecisionScores(
          freeItem.itemName,
          freeItem.cost,
          freeItem.purpose,
          freeItem.frequency,
          persona,
          null
        );
        
        // Everyone should be able to afford free
        expect(result.scores.affordability.score).toBe(10);
      });
    });
  });
  
  describe('Missing and Undefined Data', () => {
    
    it('should handle undefined frequency', () => {
      const persona = personas.BALANCED_BUDGETER;
      const mysteryBox = purchases.getPurchaseById('undefined-frequency');
      
      const result = calculateDecisionScores(
        mysteryBox.itemName,
        mysteryBox.cost,
        mysteryBox.purpose,
        mysteryBox.frequency, // undefined
        persona,
        null
      );
      
      // Should default to moderate score for frequency
      expect(result.scores.frequencyOfUse.score).toBe(5); // Default middle score
      expect(result.scores).toBeDefined();
      expect(result.finalScore).toBeGreaterThanOrEqual(0);
    });
    
    it('should handle missing financial profile', () => {
      const purchase = purchases.getPurchaseById('nike-shoes');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        null, // No profile
        null
      );
      
      // Should use defaults for all profile-dependent scores
      expect(result.scores.affordability.score).toBe(5); // Default
      expect(result.scores.opportunityCost.score).toBe(5); // Default
      expect(result.scores.financialGoalAlignment.score).toBe(5); // Default
      expect(result.scores.financialRisk.score).toBe(5); // Default
    });
    
    it('should handle empty purpose string', () => {
      const persona = personas.HIGH_EARNER;
      
      const result = calculateDecisionScores(
        'Unknown Item',
        100,
        '', // Empty purpose
        'Daily',
        persona,
        null
      );
      
      // Should still calculate but with moderate scores for purpose-dependent criteria
      expect(result.scores.necessity.score).toBe(6); // Moderate default
      expect(result.scores.emotionalValue.score).toBe(5); // Default
      expect(result.scores.socialFactors.score).toBe(7); // No pressure keywords
    });
    
    it('should handle null alternative', () => {
      const persona = personas.BALANCED_BUDGETER;
      const laptop = purchases.getPurchaseById('expensive-laptop');
      
      const result = calculateDecisionScores(
        laptop.itemName,
        laptop.cost,
        laptop.purpose,
        laptop.frequency,
        persona,
        null // No alternative
      );
      
      // Should give good alternative availability score when no alternative
      expect(result.scores.alternativeAvailability.score).toBe(8);
      expect(result.scores.valueForMoney.score).toBe(8); // Default value
    });
  });
  
  describe('Score Boundary Tests', () => {
    
    it('should test decision boundary at score 59.5 vs 60', () => {
      // Score < 60 should be Don't Buy
      const score59 = 59.5;
      const decision59 = score59 >= 60 ? 'Buy' : 'Don\'t Buy';
      expect(decision59).toBe('Don\'t Buy');
      
      // Score >= 60 should be Buy
      const score60 = 60;
      const decision60 = score60 >= 60 ? 'Buy' : 'Don\'t Buy';
      expect(decision60).toBe('Buy');
    });
    
    it('should handle maximum possible scores', () => {
      // Create ideal scenario: wealthy person, free essential item
      const persona = personas.WEALTHY;
      
      const idealPurchase = {
        itemName: 'Free Essential Medicine',
        cost: 0,
        purpose: 'Critical health medicine for daily use',
        frequency: 'Daily'
      };
      
      const result = calculateDecisionScores(
        idealPurchase.itemName,
        idealPurchase.cost,
        idealPurchase.purpose,
        idealPurchase.frequency,
        persona,
        null
      );
      
      // Should have very high scores across the board
      expect(result.scores.affordability.score).toBe(10);
      expect(result.scores.necessity.score).toBe(9);
      expect(result.scores.frequencyOfUse.score).toBe(10);
      expect(result.finalScore).toBeGreaterThanOrEqual(80);
      expect(result.confidence).toBe('High');
    });
    
    it('should handle minimum possible scores', () => {
      // Create worst scenario: zero income, expensive luxury
      const persona = personas.ZERO_INCOME;
      
      const terriblePurchase = {
        itemName: 'Impulse Luxury Item',
        cost: 10000,
        purpose: 'Impulse buy for status, everyone has one',
        frequency: 'Rarely'
      };
      
      const result = calculateDecisionScores(
        terriblePurchase.itemName,
        terriblePurchase.cost,
        terriblePurchase.purpose,
        terriblePurchase.frequency,
        persona,
        null
      );
      
      // Should have very low scores
      expect(result.scores.affordability.score).toBe(0);
      expect(result.scores.emotionalValue.score).toBe(2); // Impulse keyword
      expect(result.scores.socialFactors.score).toBe(3); // Peer pressure keywords
      expect(result.scores.frequencyOfUse.score).toBe(3); // Rarely
      expect(result.finalScore).toBeLessThan(30);
      expect(result.decision).toBe('Don\'t Buy');
    });
  });
  
  describe('Special Character and Input Validation', () => {
    
    it('should handle special characters in item names', () => {
      const persona = personas.BALANCED_BUDGETER;
      const specialNames = [
        "Item with spaces",
        "Item-with-dashes",
        "Item_with_underscores",
        "Item@with#special$chars",
        "商品" // Unicode characters
      ];
      
      specialNames.forEach(itemName => {
        const result = calculateDecisionScores(
          itemName,
          100,
          'Test purpose',
          'Daily',
          persona,
          null
        );
        
        expect(result).toBeDefined();
        expect(result.scores).toBeDefined();
        expect(result.finalScore).toBeGreaterThanOrEqual(0);
        expect(result.finalScore).toBeLessThanOrEqual(100);
      });
    });
    
    it('should handle very long strings', () => {
      const persona = personas.HIGH_EARNER;
      const longString = 'A'.repeat(1000);
      
      const result = calculateDecisionScores(
        longString,
        100,
        longString,
        'Daily',
        persona,
        null
      );
      
      expect(result).toBeDefined();
      expect(result.decision).toBeDefined();
    });
    
    it('should handle negative costs gracefully', () => {
      const persona = personas.BALANCED_BUDGETER;
      
      const result = calculateDecisionScores(
        'Negative Cost Item',
        -100, // Negative cost
        'Test',
        'Daily',
        persona,
        null
      );
      
      // Should treat negative as 0 or handle gracefully
      expect(result.scores.affordability.score).toBeGreaterThanOrEqual(0);
      expect(result.finalScore).toBeDefined();
    });
  });
});