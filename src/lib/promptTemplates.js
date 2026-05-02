/**
 * Category-specific prompt templates for purchase recommendations
 * Provides tailored AI prompts based on purchase classification
 */

/**
 * Get category-specific prompt for AI recommendation refinement
 * @param {string} category - Purchase category: 'ESSENTIAL_DAILY', 'DISCRETIONARY_SMALL', 'DISCRETIONARY_MEDIUM', or 'HIGH_VALUE'
 * @param {string} initialSummary - Initial summary from structured decision model
 * @param {string} finalDecision - Final decision (Buy/Don't Buy)
 * @param {Object} locationContext - User location context (optional)
 * @returns {string} Formatted prompt for AI API
 */
export const getPromptForCategory = (category, initialSummary, finalDecision, locationContext = null) => {
  // Build location context string
  let locationInfo = '';
  if (locationContext) {
    const location = locationContext.city ? 
      `${locationContext.city}, ${locationContext.state || locationContext.country}` : 
      locationContext.country || 'Unknown location';
    locationInfo = `\n\nUser Location: ${location} (${locationContext.accuracy} accuracy)
Consider local market conditions, availability, and regional pricing in your advice.`;
  }

  const baseContext = `The final decision is: **${finalDecision}**.
    
The initial summary is: "${initialSummary}".${locationInfo}`;

  switch (category) {
    case 'ESSENTIAL_DAILY':
      return `You are a practical advisor for everyday essentials. Your goal is to provide quick, actionable advice.
    
${baseContext}
    
Please refine this summary to be conversational and practical, ensuring it clearly supports the final **${finalDecision}** decision. Keep it strictly to two sentences maximum - be concise and direct. Focus on practical considerations rather than complex financial analysis.
    
Provide your response as a JSON object with a single key: "refinedSummary".`;

    case 'DISCRETIONARY_SMALL':
      return `You are a behavioral finance advisor focused on smart spending habits. Your goal is to provide cost-benefit analysis with gentle behavioral nudges.
    
${baseContext}
    
Please refine this summary to include a brief cost-benefit perspective and a subtle behavioral insight that supports the final **${finalDecision}** decision. Keep it conversational and include a gentle nudge about spending habits. Limit to 3-4 sentences.
    
Provide your response as a JSON object with a single key: "refinedSummary".`;

    case 'DISCRETIONARY_MEDIUM':
      return `You are a balanced financial advisor helping with mid-range purchases. Your goal is to provide thoughtful analysis without overwhelming detail.
    
${baseContext}
    
Please refine this summary to provide a balanced perspective that clearly supports the final **${finalDecision}** decision. Include consideration of value, alternatives, and financial impact. Keep it conversational and practical. Limit to 3-4 sentences that help the user feel confident about their decision.
    
Provide your response as a JSON object with a single key: "refinedSummary".`;

    case 'HIGH_VALUE':
      return `You are a financial advisor for significant purchases. Your goal is to provide concise guidance while encouraging deeper analysis.
    
${baseContext}
    
Please refine this summary into exactly 2 sentences that support the final **${finalDecision}** decision. The first sentence should provide the key financial insight. The second sentence should gently suggest trying "Pro Mode" for comprehensive market analysis and personalized recommendations on this high-value purchase.
    
Provide your response as a JSON object with a single key: "refinedSummary".`;

    default:
      // Fallback to DISCRETIONARY_SMALL template for unknown categories
      return getPromptForCategory('DISCRETIONARY_SMALL', initialSummary, finalDecision, locationContext);
  }
};