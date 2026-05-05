/**
 * Enhanced OpenAI API integration with structured decision model
 * Combines AI insights with academic decision framework and purchase classification
 */

import {
  calculateDecisionScores,
  generateStructuredRecommendation,
} from './structuredDecisionModel';
import { classifyPurchase } from './purchaseClassifier';
import { getPromptForCategory } from './promptTemplates';

const PURCHASE_AUTH_ERROR = 'Authentication required for purchase recommendation';

/**
 * Get enhanced purchase recommendation combining structured model with AI insights.
 * Phase 8a (review fix): /api/chat is auth-gated since Phase 1.5; caller must thread
 * an ID token. Without one, the call would silently 401 and the catch below would
 * fall through to the structured-only fallback — handing the user math-without-AI
 * results without any indication that authentication failed.
 */
export const getEnhancedPurchaseRecommendation = async (
  itemName,
  cost,
  purpose,
  frequency,
  financialProfile,
  alternative,
  location = null,
  idToken = null,
  paymentMethod = 'cash'
) => {
  try {
    if (!idToken) {
      throw new Error(PURCHASE_AUTH_ERROR);
    }
    // First, classify the purchase to determine appropriate prompt strategy
    const classificationResult = await classifyPurchase(itemName, cost);
    const purchaseCategory = classificationResult.category;

    // Calculate using the structured decision model
    const decisionAnalysis = calculateDecisionScores(
      itemName,
      cost,
      purpose,
      frequency,
      financialProfile,
      alternative,
      location,
      paymentMethod
    );

    const structuredRec = generateStructuredRecommendation(
      decisionAnalysis,
      itemName,
      cost,
      alternative
    );

    // Use the generated summary for the AI prompt
    const initialSummary = structuredRec.summary;
    const finalDecision = structuredRec.decision;

    // Include location in AI prompt context
    const locationContext = location
      ? {
          city: location.city,
          state: location.state,
          country: location.country,
          accuracy: location.accuracy,
        }
      : null;

    // Get category-specific AI prompt instead of generic one
    const aiPrompt = getPromptForCategory(
      purchaseCategory,
      initialSummary,
      finalDecision,
      locationContext
    );

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ message: aiPrompt }),
    });

    if (response.status === 401) {
      throw new Error(PURCHASE_AUTH_ERROR);
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let finalSummary = initialSummary;

    try {
      const cleanedResponse = data.response
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .trim();
      const aiEnhancement = JSON.parse(cleanedResponse);
      if (aiEnhancement.refinedSummary) {
        finalSummary = aiEnhancement.refinedSummary;
      }
    } catch (parseError) {
      console.error('Error parsing AI summary response:', parseError);
    }

    const quote = selectQuote(structuredRec.decision, decisionAnalysis.finalScore);

    return {
      decision: structuredRec.decision,
      summary: finalSummary,
      reasoning: structuredRec.reasoning,
      quote,
      analysisDetails: {
        ...structuredRec.analysisDetails,
        purchaseCategory: purchaseCategory,
        itemName: itemName,
        itemCost: cost,
      },
      alternative,
      decisionMatrix: formatDecisionMatrix(decisionAnalysis.scores),
      // Phase 9: surface projection + rationale to UI consumers.
      decisionRationale: decisionAnalysis.decisionRationale,
      projection: decisionAnalysis.projection,
    };
  } catch (error) {
    console.error('Error in enhanced purchase recommendation:', error);

    if (error.message === PURCHASE_AUTH_ERROR) {
      throw error;
    }

    // Fall back to pure structured analysis if AI fails (non-auth failure)
    const decisionAnalysis = calculateDecisionScores(
      itemName,
      cost,
      purpose,
      frequency,
      financialProfile,
      alternative,
      location,
      paymentMethod
    );

    const structuredRec = generateStructuredRecommendation(
      decisionAnalysis,
      itemName,
      cost,
      alternative
    );

    return {
      decision: structuredRec.decision,
      summary: structuredRec.summary,
      reasoning: structuredRec.reasoning,
      quote: 'Price is what you pay. Value is what you get.',
      analysisDetails: {
        ...structuredRec.analysisDetails,
        purchaseCategory: 'HIGH_VALUE',
        itemName: itemName,
        itemCost: cost,
      },
      alternative,
      decisionMatrix: formatDecisionMatrix(decisionAnalysis.scores),
      decisionRationale: decisionAnalysis.decisionRationale,
      projection: decisionAnalysis.projection,
    };
  }
};

/**
 * Format decision matrix for display
 */
const formatDecisionMatrix = (scores) => {
  const categories = {
    financial: [],
    utility: [],
    psychological: [],
    risk: [],
  };

  Object.entries(scores).forEach(([key, data]) => {
    if (categories[data.category]) {
      categories[data.category].push({
        criterion: data.name,
        score: data.score,
        weight: (data.weight * 100).toFixed(0) + '%',
        impact: data.score >= 7 ? 'Positive' : data.score <= 4 ? 'Negative' : 'Neutral',
      });
    }
  });

  return categories;
};

/**
 * Select appropriate quote based on decision and context
 */
const selectQuote = (decision, score) => {
  const quotes = {
    strongBuy: [
      'Price is what you pay. Value is what you get.',
      'The best investment you can make is in yourself.',
      'Opportunities come infrequently. When it rains gold, put out the bucket, not the thimble.',
    ],
    buy: [
      "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price.",
      'The big money is not in the buying and selling, but in the owning.',
      'Time is the friend of the wonderful company, the enemy of the mediocre.',
    ],
    dontBuy: [
      'The big money is not in the buying and selling, but in the waiting.',
      "You don't have to swing at everything — you can wait for your pitch.",
      'The first rule of compounding: Never interrupt it unnecessarily.',
    ],
    strongDontBuy: [
      "It's better to be roughly right than precisely wrong.",
      'The iron rule of nature is: you get what you reward for.',
      'Simplicity has a way of improving performance by enabling us to better understand what we are doing.',
    ],
  };

  let category;
  if (decision === 'Buy' && score >= 80) category = 'strongBuy';
  else if (decision === 'Buy') category = 'buy';
  else if (score <= 30) category = 'strongDontBuy';
  else category = 'dontBuy';

  const categoryQuotes = quotes[category];
  return categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];
};
