/**
 * Pro Mode API functions for high-value purchase analysis
 * Includes web search capabilities for market analysis
 */

import { LocationService } from './locationService';

/**
 * Type definition for backward-compatible Pro Mode questions
 * @typedef {Object} ProQuestion
 * @property {'q1' | 'q2' | 'q3'} id
 * @property {string} text
 * @property {string} placeholder
 * @property {'specs' | 'constraints' | 'timing'} [dimension] - Optional for backward compatibility
 * @property {'short_text' | 'number' | 'choice'} [answer_type] - Optional
 * @property {string} [search_hint] - Optional
 */

/**
 * Clean placeholder text to remove prefixes and make it ready for direct use
 * Enhanced to ensure search-ready format with concrete entities
 */
const cleanPlaceholderText = (text) => {
  if (!text) return '';
  
  // Remove common prefixes that users don't want to copy
  let cleaned = text
    .replace(/^e\.g\.,?\s*/i, '')           
    .replace(/^for example,?\s*/i, '')      
    .replace(/^such as,?\s*/i, '')          
    .replace(/^like,?\s*/i, '')             
    .replace(/^example:?\s*/i, '')          
    .replace(/^sample:?\s*/i, '')           
    .replace(/^\w+\s*example:?\s*/i, '')    
    .replace(/^try:?\s*/i, '')              
    .replace(/^consider:?\s*/i, '')         
    .replace(/^you might say:?\s*/i, '')    
    .replace(/^answer:?\s*/i, '')           
    .replace(/^response:?\s*/i, '')         
    .replace(/^hint:?\s*/i, '')
    .replace(/^"([^"]*)"$/g, '$1')          // Remove surrounding quotes
    .trim();
  
  // Ensure the cleaned text starts with a capital letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  // Truncate to 120 chars if needed
  if (cleaned.length > 120) {
    cleaned = cleaned.substring(0, 117) + '...';
  }
  
  return cleaned;
};

/**
 * Validate and enforce diversity constraints on questions
 */
const validateQuestions = (questions) => {
  if (!Array.isArray(questions) || questions.length !== 3) {
    return null;
  }

  // Check for required ids
  const ids = questions.map(q => q.id);
  if (!ids.includes('q1') || !ids.includes('q2') || !ids.includes('q3')) {
    return null;
  }

  // Check for dimension diversity if dimensions are present
  const dimensions = questions.map(q => q.dimension).filter(Boolean);
  if (dimensions.length === 3) {
    const hasSpecs = dimensions.includes('specs');
    const hasConstraints = dimensions.includes('constraints');
    const hasTiming = dimensions.includes('timing');
    
    if (!hasSpecs || !hasConstraints || !hasTiming) {
      // Fix dimension assignment if not diverse
      const fixedQuestions = [...questions];
      fixedQuestions[0].dimension = 'specs';
      fixedQuestions[1].dimension = 'constraints';
      fixedQuestions[2].dimension = 'timing';
      return fixedQuestions;
    }
  }

  return questions;
};

/**
 * Generate fallback placeholder based on dimension
 */
const getFallbackPlaceholder = (dimension, itemName, itemCost) => {
  const placeholders = {
    specs: `I need ${itemName || 'it'} for gaming, 16GB RAM minimum`,
    constraints: `Budget under $${Math.round(itemCost * 1.2)}, must have warranty`,
    timing: `Need by Dec 15; can wait 30 days for sales`
  };
  
  return placeholders[dimension] || 'Please provide specific details';
};

/**
 * Generate tailored questions based on purchase context
 */
export const generateProModeQuestions = async (purchaseData) => {
  try {
    const { itemName, itemCost, analysisDetails } = purchaseData;
    const topNegativeFactors = analysisDetails?.topFactors?.negative || [];
    const concerns = topNegativeFactors.length > 0 
      ? topNegativeFactors.join(', ')
      : '';

    const prompt = `You are a financial advisor generating exactly 3 probing questions to improve web search and market analysis for a potential purchase.

Item: "${itemName}"
Price: $${itemCost}
Initial concerns (if any): ${concerns}

**Output format (JSON only):**
{
  "questions": [
    {"id":"q1","dimension":"specs","answer_type":"short_text","text":"...","placeholder":"...","search_hint":"..."},
    {"id":"q2","dimension":"constraints","answer_type":"short_text","text":"...","placeholder":"...","search_hint":"..."},
    {"id":"q3","dimension":"timing","answer_type":"short_text","text":"...","placeholder":"...","search_hint":"..."}
  ]
}

**Hard requirements:**
- Produce **exactly 3** questions, one per **dimension**: (1) \`specs\` (use-case or must-have features), (2) \`constraints\` (budget/TCO/warranty/retailer/region), (3) \`timing\` (need-by date, willingness to wait for sales/upcoming releases).
- Each object must include: \`id\` (\`q1|q2|q3\`), \`dimension\`, \`answer_type\`, \`text\`, \`placeholder\`, \`search_hint\`.
- \`placeholder\` must be **first-person**, **≤120 chars**, and include **1–2 concrete, searchable entities** (e.g., brand/model, spec numbers, warranty months, retailer/ZIP, or a date window). Do **not** use quotes or prefixes like "e.g." or "Example:".
- Make each \`text\` non-overlapping in scope (no near-duplicates).
- Keep \`answer_type\` = \`short_text\` unless a number or multiple-choice is clearly better.
- \`search_hint\` = one short line that explains how the answer will translate into search terms later.
- Return **valid JSON only** (no markdown fences, no prose outside the JSON).`;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate questions');
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`API Error: ${data.error}`);
    }

    let questions;
    
    // Handle direct array response from server
    if (Array.isArray(data)) {
      questions = data;
    } else if (data.response) {
      // Parse from response string
      const cleanedResponse = data.response
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .trim();
      
      try {
        const parsed = JSON.parse(cleanedResponse);
        questions = parsed.questions || parsed;
      } catch (parseError) {
        console.error('Failed to parse questions JSON:', parseError);
        throw parseError;
      }
    }

    // Validate and fix questions
    questions = validateQuestions(questions);
    
    if (!questions) {
      throw new Error('Invalid question structure received');
    }

    // Clean and enhance placeholders
    return questions.map((question, index) => {
      const cleaned = cleanPlaceholderText(question.placeholder);
      
      // Ensure placeholder has searchable content if too generic
      let finalPlaceholder = cleaned;
      if (!cleaned || cleaned.length < 10 || !cleaned.match(/[0-9a-zA-Z]{3,}/)) {
        finalPlaceholder = getFallbackPlaceholder(
          question.dimension || ['specs', 'constraints', 'timing'][index],
          itemName,
          itemCost
        );
      }

      return {
        ...question,
        placeholder: finalPlaceholder,
        // Ensure backward compatibility - keep all fields but they're optional
        dimension: question.dimension || ['specs', 'constraints', 'timing'][index],
        answer_type: question.answer_type || 'short_text',
        search_hint: question.search_hint || 'Will be used to refine search terms'
      };
    });

  } catch (error) {
    console.error('Error generating questions:', error);
    
    // Enhanced fallback questions with all new fields
    return [
      {
        id: 'q1',
        text: 'What specific features or capabilities are most important to you in this purchase?',
        placeholder: `I need ${purchaseData?.itemName || 'it'} for work, 16GB RAM, fast SSD`,
        dimension: 'specs',
        answer_type: 'short_text',
        search_hint: 'Will search for models with these specific features'
      },
      {
        id: 'q2',
        text: 'What are your budget constraints and requirements (warranty, retailer preference)?',
        placeholder: `Max $${Math.round((purchaseData?.itemCost || 1000) * 1.2)}, 2-year warranty, Amazon preferred`,
        dimension: 'constraints',
        answer_type: 'short_text',
        search_hint: 'Will filter results by price and vendor requirements'
      },
      {
        id: 'q3',
        text: 'When do you need this item, and can you wait for sales or new releases?',
        placeholder: 'Need by January 15, can wait for Black Friday deals',
        dimension: 'timing',
        answer_type: 'short_text',
        search_hint: 'Will check for upcoming sales and release dates'
      }
    ];
  }
};

/**
 * Get comprehensive Pro Mode analysis with web search
 */
export const getProModeAnalysis = async (purchaseData, questions, answers) => {
  try {
    // Get user location
    const location = await LocationService.getUserLocation();
    
    const locationContext = location ? `
    User Location: ${LocationService.formatLocation(location)}
    Location Accuracy: ${location.accuracy}
    ` : '';

    // Build context from Q&A, including dimension info if available
    const qaContext = questions.map((q) => {
      const dimension = q.dimension ? ` [${q.dimension}]` : '';
      return `Q${dimension}: ${q.text}\nA: ${answers[q.id]}`;
    }).join('\n\n');

    const prompt = `You are a premium financial advisor with access to web search. 
    ${locationContext}
    
    IMPORTANT: Use web search to find:
    1. Local market prices and availability in ${location?.city || 'the user\'s area'}
    2. Regional pricing trends and local deals
    3. Shipping costs and delivery times to ${location?.postalCode || 'this location'}
    4. Local alternatives and nearby store inventory
    5. Regional sales tax implications (${location?.state || 'state'} tax rates)
    6. Current market prices and trends for "${purchaseData.itemName}"
    7. Recent reviews and expert opinions
    8. Upcoming models or alternatives
    9. Historical pricing data and best times to buy
    
    Provide a comprehensive analysis for this high-value purchase.
  
  Purchase Details:
  - Item: ${purchaseData.itemName}
  - Cost: $${purchaseData.itemCost}
  - Initial Decision: ${purchaseData.decision}
  - Initial Analysis: ${purchaseData.summary}
  
  User Context from Q&A:
  ${qaContext}
  
  
  Based on your web search findings, location context, and the user's specific needs, provide:
  1. A detailed paragraph analyzing whether this is the right purchase at the right time, including local market factors
  2. Current market conditions and pricing trends you found (both global and regional)
  3. 3-5 specific, actionable recommendations that consider local availability and pricing
  
  Format your response as JSON:
  {
    "fullAnalysis": "Detailed paragraph with web search findings and location considerations integrated...",
    "marketInsights": "What you found about current market conditions, local pricing, and regional factors...",
    "recommendations": ["Specific location-aware recommendation 1", "Specific recommendation 2", ...],
    "decisionConfidence": 85 (0-100 score based on all factors including local market conditions)
  }
  
  Remember to cite specific findings from your web search and mention local factors when relevant.`;

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        useWebSearch: true
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get analysis');
    }

    const data = await response.json();
    
    const jsonMatch = data.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON object found in the API response.");
    }
    const jsonString = jsonMatch[0];

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error getting pro analysis:', error);
    throw error;
  }
};