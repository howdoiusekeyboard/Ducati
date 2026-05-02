/**
 * Integration Tests for Complete Recommendation Flow
 * Tests the end-to-end decision making process from profile to recommendation
 */

import { calculateDecisionScores } from '../../src/lib/structuredDecisionModel';
import * as personas from '../fixtures/personas';
import * as purchases from '../fixtures/test-purchases';

describe('Recommendation Flow Integration Tests', () => {
  
  describe('Persona A: Struggling Student Sarah', () => {
    const persona = personas.STRUGGLING_STUDENT;
    
    it('should APPROVE essential grocery shopping', () => {
      const purchase = purchases.getPurchaseById('grocery-weekly');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      expect(result.decision).toBe('Buy');
      expect(result.scores.necessity.score).toBeGreaterThanOrEqual(8);
      expect(result.scores.frequencyOfUse.score).toBe(8);
    });
    
    it('should REJECT gaming console (500% of monthly net)', () => {
      const purchase = purchases.getPurchaseById('gaming-console');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      expect(result.decision).toBe('Don\'t Buy');
      expect(result.scores.affordability.score).toBe(0); // Way over budget
      expect(result.scores.financialGoalAlignment.score).toBe(3); // Conflicts with save goal
      expect(result.finalScore).toBeLessThan(40);
    });
    
    it('should APPROVE educational textbook despite tight budget', () => {
      const purchase = purchases.getPurchaseById('textbook');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      expect(result.decision).toBe('Buy');
      expect(result.scores.necessity.score).toBe(9); // Education keyword
      expect(result.scores.frequencyOfUse.score).toBe(10); // Daily use
    });
    
    it('should REJECT luxury items', () => {
      const luxuryWatch = purchases.getPurchaseById('luxury-watch');
      
      const result = calculateDecisionScores(
        luxuryWatch.itemName,
        luxuryWatch.cost,
        luxuryWatch.purpose,
        luxuryWatch.frequency,
        persona,
        null
      );
      
      expect(result.decision).toBe('Don\'t Buy');
      expect(result.scores.affordability.score).toBe(0);
      expect(result.scores.opportunityCost.score).toBeLessThanOrEqual(4);
      expect(result.finalScore).toBeLessThan(30);
    });
  });
  
  describe('Persona B: High-Earner Henry', () => {
    const persona = personas.HIGH_EARNER;
    
    it('should REJECT luxury watch (lacks emergency fund)', () => {
      const purchase = purchases.getPurchaseById('luxury-watch');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      expect(result.decision).toBe('Don\'t Buy');
      expect(result.scores.opportunityCost.score).toBeLessThanOrEqual(4); // No emergency fund
      expect(result.scores.financialRisk.score).toBeLessThanOrEqual(5); // High debt, no emergency
    });
    
    it('should APPROVE home gym equipment (daily use, affordable)', () => {
      const purchase = purchases.getPurchaseById('gym-equipment');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      expect(result.decision).toBe('Buy');
      expect(result.scores.affordability.score).toBeGreaterThanOrEqual(6); // 12.5% of net income
      expect(result.scores.frequencyOfUse.score).toBe(10); // Daily use
      expect(result.scores.longevity.score).toBeGreaterThanOrEqual(7); // Durable equipment
    });
    
    it('should REJECT one-time vacation (poor opportunity cost)', () => {
      const purchase = purchases.getPurchaseById('weekend-vacation');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      expect(result.decision).toBe('Don\'t Buy');
      expect(result.scores.frequencyOfUse.score).toBe(2); // One-time use
      expect(result.scores.opportunityCost.score).toBeLessThanOrEqual(4); // No emergency fund
    });
    
    it('should handle HIGH risk tolerance weight adjustments', () => {
      const purchase = purchases.getPurchaseById('nike-shoes');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      // Verify risk weights are adjusted for high tolerance
      const riskCriteria = Object.values(result.scores).filter(s => s.category === 'risk');
      const totalRiskWeight = riskCriteria.reduce((sum, c) => sum + c.weight, 0);
      expect(totalRiskWeight).toBeCloseTo(0.07, 2);
    });
  });
  
  describe('Persona C: Balanced Barbara', () => {
    const persona = personas.BALANCED_BUDGETER;
    
    it('should APPROVE investment platform subscription', () => {
      const purchase = purchases.getPurchaseById('stock-platform');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      expect(result.decision).toBe('Buy');
      expect(result.scores.financialGoalAlignment.score).toBe(9); // Aligns with invest goal
      expect(result.scores.affordability.score).toBe(10); // Only 5% of net income
      expect(result.finalScore).toBeGreaterThanOrEqual(70);
    });
    
    it('should APPROVE designer handbag (has emergency fund)', () => {
      const purchase = purchases.getPurchaseById('designer-handbag');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      expect(result.decision).toBe('Buy');
      expect(result.scores.affordability.score).toBeGreaterThanOrEqual(2); // 60% of net but has savings
      expect(result.scores.financialRisk.score).toBeGreaterThanOrEqual(6); // Good emergency fund
    });
    
    it('should REJECT impulse art purchase', () => {
      const purchase = purchases.getPurchaseById('art-piece');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      expect(result.decision).toBe('Don\'t Buy');
      expect(result.scores.emotionalValue.score).toBe(2); // Impulse keyword penalty
      expect(result.scores.frequencyOfUse.score).toBe(3); // Rarely used
      expect(result.scores.buyersRemorse.score).toBeLessThanOrEqual(3);
    });
    
    it('should handle MODERATE risk tolerance correctly', () => {
      const purchase = purchases.getPurchaseById('professional-course');
      
      const result = calculateDecisionScores(
        purchase.itemName,
        purchase.cost,
        purchase.purpose,
        purchase.frequency,
        persona,
        null
      );
      
      // Verify default weights for moderate risk
      const riskCriteria = Object.values(result.scores).filter(s => s.category === 'risk');
      const totalRiskWeight = riskCriteria.reduce((sum, c) => sum + c.weight, 0);
      expect(totalRiskWeight).toBeCloseTo(0.10, 2);
    });
  });
  
  describe('Cross-Persona Validation', () => {
    
    it('should give consistent results for essential purchases across all personas', () => {
      const groceries = purchases.getPurchaseById('grocery-weekly');
      const testPersonas = [
        personas.STRUGGLING_STUDENT,
        personas.HIGH_EARNER,
        personas.BALANCED_BUDGETER
      ];
      
      testPersonas.forEach(persona => {
        const result = calculateDecisionScores(
          groceries.itemName,
          groceries.cost,
          groceries.purpose,
          groceries.frequency,
          persona,
          null
        );
        
        // Everyone should buy essential groceries
        expect(result.scores.necessity.score).toBeGreaterThanOrEqual(8);
        
        // But affordability varies by persona
        if (persona === personas.STRUGGLING_STUDENT) {
          // 150% of monthly net income
          expect(result.scores.affordability.score).toBe(0);
        } else {
          expect(result.scores.affordability.score).toBeGreaterThanOrEqual(8);
        }
      });
    });
    
    it('should reject luxury purchases for debt-focused personas', () => {
      const luxuryWatch = purchases.getPurchaseById('luxury-watch');
      const debtPersonas = [
        personas.STRUGGLING_STUDENT, // save goal
        personas.HIGH_DEBT // debt goal
      ];
      
      debtPersonas.forEach(persona => {
        const result = calculateDecisionScores(
          luxuryWatch.itemName,
          luxuryWatch.cost,
          luxuryWatch.purpose,
          luxuryWatch.frequency,
          persona,
          null
        );
        
        expect(result.decision).toBe('Don\'t Buy');
        expect(result.scores.financialGoalAlignment.score).toBe(3);
        expect(result.finalScore).toBeLessThan(40);
      });
    });
    
    it('should approve investment purchases for invest-goal personas', () => {
      const investmentPlatform = purchases.getPurchaseById('stock-platform');
      const investPersonas = [
        personas.BALANCED_BUDGETER,
        personas.WEALTHY
      ];
      
      investPersonas.forEach(persona => {
        const result = calculateDecisionScores(
          investmentPlatform.itemName,
          investmentPlatform.cost,
          investmentPlatform.purpose,
          investmentPlatform.frequency,
          persona,
          null
        );
        
        expect(result.decision).toBe('Buy');
        expect(result.scores.financialGoalAlignment.score).toBe(9);
        expect(result.finalScore).toBeGreaterThanOrEqual(65);
      });
    });
  });
  
  describe('Alternative Product Impact', () => {
    
    it('should reduce recommendation score when cheaper alternative exists', () => {
      const persona = personas.HIGH_EARNER;
      const laptop = purchases.getPurchaseById('expensive-laptop');
      
      const withAlternative = calculateDecisionScores(
        laptop.itemName,
        laptop.cost,
        laptop.purpose,
        laptop.frequency,
        persona,
        laptop.alternative
      );
      
      const withoutAlternative = calculateDecisionScores(
        laptop.itemName,
        laptop.cost,
        laptop.purpose,
        laptop.frequency,
        persona,
        null
      );
      
      // Score should be lower with alternative available
      expect(withAlternative.finalScore).toBeLessThan(withoutAlternative.finalScore);
      expect(withAlternative.scores.valueForMoney.score).toBe(2); // >50% savings penalty
      expect(withAlternative.scores.alternativeAvailability.score).toBe(3);
    });
    
    it('should impact decision for budget-conscious personas more', () => {
      const clothing = purchases.getPurchaseById('brand-clothes');
      const budgetPersona = personas.STRUGGLING_STUDENT;
      const wealthyPersona = personas.WEALTHY;
      
      const budgetResult = calculateDecisionScores(
        clothing.itemName,
        clothing.cost,
        clothing.purpose,
        clothing.frequency,
        budgetPersona,
        clothing.alternative
      );
      
      const wealthyResult = calculateDecisionScores(
        clothing.itemName,
        clothing.cost,
        clothing.purpose,
        clothing.frequency,
        wealthyPersona,
        clothing.alternative
      );
      
      // Budget-conscious should reject, wealthy might approve
      expect(budgetResult.decision).toBe('Don\'t Buy');
      expect(budgetResult.scores.valueForMoney.score).toBe(2); // 70% savings available
      
      // Wealthy person cares less about the alternative
      expect(wealthyResult.scores.affordability.score).toBe(10);
    });
  });
});