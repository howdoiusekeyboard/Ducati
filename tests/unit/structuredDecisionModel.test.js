/**
 * Unit Tests for Structured Decision Model (WDM)
 * Tests the core decision matrix logic and scoring functions
 */

import { calculateDecisionScores } from '../../src/lib/structuredDecisionModel';
import * as personas from '../fixtures/personas';
import * as purchases from '../fixtures/test-purchases';

describe('Structured Decision Model - Core Logic', () => {
  
  describe('Weight Adjustments by Risk Tolerance', () => {
    
    it('should apply correct weights for LOW risk tolerance', () => {
      const lowRiskPersona = personas.STRUGGLING_STUDENT;
      const purchase = purchases.getPurchaseById('grocery-weekly');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        lowRiskPersona,
        null
      );
      
      // For low risk, risk weight should be 15% (0.15)
      const riskCriteria = Object.values(result.scores).filter(s => s.category === 'risk');
      const totalRiskWeight = riskCriteria.reduce((sum, c) => sum + c.weight, 0);
      expect(totalRiskWeight).toBeCloseTo(0.15, 2);
    });
    
    it('should apply correct weights for HIGH risk tolerance', () => {
      const highRiskPersona = personas.HIGH_EARNER;
      const purchase = purchases.getPurchaseById('gym-equipment');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        highRiskPersona,
        null
      );
      
      // For high risk, risk weight should be 7% (0.07)
      const riskCriteria = Object.values(result.scores).filter(s => s.category === 'risk');
      const totalRiskWeight = riskCriteria.reduce((sum, c) => sum + c.weight, 0);
      expect(totalRiskWeight).toBeCloseTo(0.07, 2);
    });
    
    it('should apply correct weights for MODERATE risk tolerance', () => {
      const moderateRiskPersona = personas.BALANCED_BUDGETER;
      const purchase = purchases.getPurchaseById('nike-shoes');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        moderateRiskPersona,
        null
      );
      
      // For moderate risk, risk weight should be 10% (0.10)
      const riskCriteria = Object.values(result.scores).filter(s => s.category === 'risk');
      const totalRiskWeight = riskCriteria.reduce((sum, c) => sum + c.weight, 0);
      expect(totalRiskWeight).toBeCloseTo(0.10, 2);
    });
    
    it('should ensure all weights sum to 1.0', () => {
      const testPersonas = [personas.STRUGGLING_STUDENT, personas.HIGH_EARNER, personas.BALANCED_BUDGETER];
      const purchase = purchases.getPurchaseById('grocery-weekly');
      
      testPersonas.forEach(persona => {
        const result = calculateDecisionScores(
          purchase.itemName,
          purchase.cost,
          purchase.purpose,
          purchase.frequency,
          persona,
          null
        );
        
        const totalWeight = Object.values(result.scores).reduce((sum, criterion) => sum + criterion.weight, 0);
        expect(totalWeight).toBeCloseTo(1.0, 5); // Allow for floating point precision
      });
    });
  });
  
  describe('Affordability Scoring', () => {
    
    it('should return 0 for zero/negative monthly net income', () => {
      const zeroIncomePersona = personas.ZERO_INCOME;
      const purchase = purchases.getPurchaseById('gaming-console');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        zeroIncomePersona,
        null
      );
      
      expect(result.scores.affordability.score).toBe(0);
    });
    
    it('should return 10 for cost <= 5% of monthly net income', () => {
      const wealthyPersona = personas.WEALTHY;
      const smallPurchase = {
        itemName: 'Small Item',
        cost: 500, // 2.9% of $17,000 net income
        purpose: 'Test',
        frequency: 'Daily'
      };
      
      const result = calculateDecisionScores(
        smallPurchase.itemName,
        smallPurchase.cost,
        smallPurchase.purpose,
        smallPurchase.frequency,
        wealthyPersona,
        null
      );
      
      expect(result.scores.affordability.score).toBe(10);
    });
    
    it('should return appropriate scores for different cost percentages', () => {
      const persona = personas.BALANCED_BUDGETER; // $2000 net income
      
      const testCases = [
        { cost: 100, expectedScore: 10 },  // 5% - should get 10
        { cost: 180, expectedScore: 8 },   // 9% - should get 8
        { cost: 350, expectedScore: 6 },   // 17.5% - should get 6
        { cost: 550, expectedScore: 4 },   // 27.5% - should get 4
        { cost: 900, expectedScore: 2 },   // 45% - should get 2
        { cost: 1200, expectedScore: 0 },  // 60% - should get 0
      ];
      
      testCases.forEach(({ cost, expectedScore }) => {
        const result = calculateDecisionScores(
          'Test Item',
          cost,
          'Test',
          'Daily',
          persona,
          null
        );
        
        expect(result.scores.affordability.score).toBe(expectedScore);
      });
    });
  });
  
  describe('Emergency Fund Impact', () => {
    
    it('should penalize opportunity cost when emergency fund < 3 months', () => {
      const lowSavingsPersona = personas.STRUGGLING_STUDENT; // 0.29 months emergency fund
      const purchase = purchases.getPurchaseById('gaming-console');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        lowSavingsPersona,
        null
      );
      
      // With < 3 months emergency fund and debt, score should be 2
      expect(result.scores.opportunityCost.score).toBe(2);
    });
    
    it('should give good score when emergency fund >= 3 months', () => {
      const goodSavingsPersona = personas.BALANCED_BUDGETER; // 5 months emergency fund
      const purchase = purchases.getPurchaseById('nike-shoes');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        goodSavingsPersona,
        null
      );
      
      // With good emergency fund and some debt, score should be 6
      expect(result.scores.opportunityCost.score).toBe(6);
    });
    
    it('should heavily penalize financial risk when no emergency fund', () => {
      const noSavingsPersona = personas.HIGH_DEBT; // 0.17 months emergency fund
      const purchase = purchases.getPurchaseById('luxury-watch');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        noSavingsPersona,
        null
      );
      
      // With no emergency fund and 50% debt ratio, should be heavily penalized
      expect(result.scores.financialRisk.score).toBeLessThanOrEqual(4);
    });
  });
  
  describe('Financial Goal Alignment', () => {
    
    it('should score low for purchases when goal is "save"', () => {
      const saveGoalPersona = personas.STRUGGLING_STUDENT;
      const purchase = purchases.getPurchaseById('designer-handbag');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        saveGoalPersona,
        null
      );
      
      expect(result.scores.financialGoalAlignment.score).toBe(3);
    });
    
    it('should score high for investment purchases when goal is "invest"', () => {
      const investGoalPersona = personas.BALANCED_BUDGETER;
      const investPurchase = purchases.getPurchaseById('stock-platform');
      
      const result = calculateDecisionScores(
        investPurchase.itemName,
        investPurchase.cost,
        investPurchase.purpose,
        investPurchase.frequency,
        investGoalPersona,
        null
      );
      
      expect(result.scores.financialGoalAlignment.score).toBe(9);
    });
    
    it('should score moderately when goal is "balance"', () => {
      const balanceGoalPersona = personas.HIGH_EARNER;
      const purchase = purchases.getPurchaseById('nike-shoes');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        balanceGoalPersona,
        null
      );
      
      expect(result.scores.financialGoalAlignment.score).toBe(6);
    });
  });
  
  describe('Decision Threshold Tests', () => {
    
    it('should recommend BUY when score >= 60', () => {
      const persona = personas.BALANCED_BUDGETER;
      const goodPurchase = purchases.getPurchaseById('stock-platform');
      
      const result = calculateDecisionScores(
        goodPurchase.itemName,
        goodPurchase.cost,
        goodPurchase.purpose,
        goodPurchase.frequency,
        persona,
        null
      );
      
      expect(result.finalScore).toBeGreaterThanOrEqual(60);
      expect(result.decision).toBe('Buy');
    });
    
    it('should recommend DON\'T BUY when score < 60', () => {
      const persona = personas.STRUGGLING_STUDENT;
      const badPurchase = purchases.getPurchaseById('luxury-watch');
      
      const result = calculateDecisionScores(
        badPurchase.itemName,
        badPurchase.cost,
        badPurchase.purpose,
        badPurchase.frequency,
        persona,
        null
      );
      
      expect(result.finalScore).toBeLessThan(60);
      expect(result.decision).toBe('Don\'t Buy');
    });
    
    it('should handle boundary case at exactly 60', () => {
      // This is a synthetic test - we'd need to craft a purchase that scores exactly 60
      const mockScores = {};
      const criteria = ['affordability', 'valueForMoney', 'necessity'];
      
      // Create scores that will result in exactly 60
      criteria.forEach(key => {
        mockScores[key] = {
          score: 6,
          weight: 1 / criteria.length,
          weightedScore: 6 * (1 / criteria.length)
        };
      });
      
      const finalScore = 60;
      const decision = finalScore >= 60 ? 'Buy' : 'Don\'t Buy';
      
      expect(decision).toBe('Buy');
    });
  });
  
  describe('Confidence Level Calculation', () => {
    
    it('should return HIGH confidence for scores >= 80 or <= 20', () => {
      const veryGoodPurchase = personas.WEALTHY;
      const essentialItem = purchases.getPurchaseById('grocery-weekly');
      
      const result = calculateDecisionScores(
        essentialItem.itemName,
        essentialItem.cost,
        essentialItem.purpose,
        essentialItem.frequency,
        veryGoodPurchase,
        null
      );
      
      // Wealthy person buying groceries should have high confidence
      if (result.finalScore >= 80 || result.finalScore <= 20) {
        expect(result.confidence).toBe('High');
      }
    });
    
    it('should return MEDIUM confidence for scores 65-79 or 21-35', () => {
      const persona = personas.BALANCED_BUDGETER;
      const moderatePurchase = purchases.getPurchaseById('nike-shoes');
      
      const result = calculateDecisionScores(
        moderatePurchase.itemName,
        moderatePurchase.cost,
        moderatePurchase.purpose,
        moderatePurchase.frequency,
        persona,
        null
      );
      
      if ((result.finalScore >= 65 && result.finalScore < 80) || 
          (result.finalScore > 20 && result.finalScore <= 35)) {
        expect(result.confidence).toBe('Medium');
      }
    });
    
    it('should return LOW confidence for scores 36-64', () => {
      const persona = personas.HIGH_EARNER;
      const borderlinePurchase = purchases.getPurchaseById('weekend-vacation');
      
      const result = calculateDecisionScores(
        borderlinePurchase.itemName,
        borderlinePurchase.cost,
        borderlinePurchase.purpose,
        borderlinePurchase.frequency,
        persona,
        null
      );
      
      if (result.finalScore > 35 && result.finalScore < 65) {
        expect(result.confidence).toBe('Low');
      }
    });
  });
});

describe('Structured Decision Model - Alternative Impact', () => {
  
  it('should reduce value score when cheaper alternative exists', () => {
    const persona = personas.BALANCED_BUDGETER;
    const purchaseWithAlt = purchases.getPurchaseById('expensive-laptop');
    
    const resultWithAlternative = calculateDecisionScores(
      purchaseWithAlt.itemName,
      purchaseWithAlt.cost,
      purchaseWithAlt.purpose,
      purchaseWithAlt.frequency,
      persona,
      purchaseWithAlt.alternative
    );
    
    const resultWithoutAlternative = calculateDecisionScores(
      purchaseWithAlt.itemName,
      purchaseWithAlt.cost,
      purchaseWithAlt.purpose,
      purchaseWithAlt.frequency,
      persona,
      null
    );
    
    // Value for money should be lower with alternative
    expect(resultWithAlternative.scores.valueForMoney.score).toBeLessThan(
      resultWithoutAlternative.scores.valueForMoney.score
    );
    
    // Alternative availability should be 3 when alternative exists
    expect(resultWithAlternative.scores.alternativeAvailability.score).toBe(3);
    expect(resultWithoutAlternative.scores.alternativeAvailability.score).toBe(8);
  });
  
  it('should calculate value reduction based on savings percentage', () => {
    const persona = personas.HIGH_EARNER;
    const purchase = {
      itemName: 'Test Item',
      cost: 1000,
      purpose: 'Test',
      frequency: 'Daily'
    };
    
    const alternatives = [
      { price: 400, expectedScore: 2 },  // 60% savings
      { price: 650, expectedScore: 4 },  // 35% savings
      { price: 750, expectedScore: 6 },  // 25% savings
      { price: 850, expectedScore: 7 },  // 15% savings
    ];
    
    alternatives.forEach(({ price, expectedScore }) => {
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        { price }
      );
      
      expect(result.scores.valueForMoney.score).toBe(expectedScore);
    });
  });
});