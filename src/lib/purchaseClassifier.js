/**
 * Purchase Classification Module
 * Classifies purchases into categories for contextually appropriate AI recommendations
 */

// Classification categories
export const CLASSIFICATION_CATEGORIES = {
  ESSENTIAL_DAILY: 'ESSENTIAL_DAILY',
  DISCRETIONARY_SMALL: 'DISCRETIONARY_SMALL',
  DISCRETIONARY_MEDIUM: 'DISCRETIONARY_MEDIUM', 
  HIGH_VALUE: 'HIGH_VALUE'
};

// In-memory cache for classification results (session-based)
const classificationCache = new Map();
const CACHE_MAX_SIZE = 100;
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Generate cache key from item name and cost
 */
const getCacheKey = (itemName, cost) => {
  return `${itemName.toLowerCase().trim()}-${cost}`;
};

/**
 * Clean expired entries from cache
 */
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, entry] of classificationCache.entries()) {
    if (now > entry.expiresAt) {
      classificationCache.delete(key);
    }
  }
};

/**
 * Implement LRU eviction when cache is full
 */
const evictLRUIfNeeded = () => {
  if (classificationCache.size >= CACHE_MAX_SIZE) {
    // Remove oldest entry (first in Map)
    const firstKey = classificationCache.keys().next().value;
    classificationCache.delete(firstKey);
  }
};

/**
 * Add entry to cache
 */
const setCacheEntry = (key, category) => {
  cleanExpiredCache();
  evictLRUIfNeeded();
  
  classificationCache.set(key, {
    category,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_EXPIRY_MS
  });
};

/**
 * Get entry from cache
 */
const getCacheEntry = (key) => {
  cleanExpiredCache();
  const entry = classificationCache.get(key);
  
  if (entry) {
    // Move to end for LRU (delete and re-add)
    classificationCache.delete(key);
    classificationCache.set(key, entry);
    return entry;
  }
  
  return null;
};

/**
 * Apply strict price-based rules
 * Following the requirement: price ranges must be enforced accurately
 */
const applyPriceRules = (cost) => {
  // Strictly enforce price ranges
  if (cost >= 300) {
    return CLASSIFICATION_CATEGORIES.HIGH_VALUE;
  } else if (cost >= 51 && cost <= 299) {
    return CLASSIFICATION_CATEGORIES.DISCRETIONARY_MEDIUM;
  }
  // For items under $50, we'll use AI to distinguish between essential and discretionary
  return null;
};

/**
 * Call OpenAI API for purchase classification (only for items under $50)
 */
const callClassificationAPI = async (itemName, cost) => {
  const classificationPrompt = `You are a purchase classification system. Classify this purchase under $50 into exactly one category:

ESSENTIAL_DAILY: Basic necessities (sanitizer, paper towels, toothpaste, basic food items, hygiene products)
DISCRETIONARY_SMALL: Non-essential items (coffee makers, phone cases, gadgets, entertainment, decorative items)

Item: "${itemName}"
Cost: $${cost}

Respond with ONLY the category name: ESSENTIAL_DAILY or DISCRETIONARY_SMALL`;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: classificationPrompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const classification = data.response?.trim().toUpperCase();

    // Validate the response is one of our expected categories
    if (classification === 'ESSENTIAL_DAILY' || classification === 'DISCRETIONARY_SMALL') {
      return classification;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Classification API error:', error);
    return null;
  }
};

/**
 * Classify a purchase into appropriate category
 * @param {string} itemName - Name of the item to classify
 * @param {number} cost - Cost of the item
 * @returns {Promise<{category: string, cached: boolean}>} Classification result
 */
export const classifyPurchase = async (itemName, cost) => {
  try {
    // Input validation
    if (!itemName || typeof itemName !== 'string' || itemName.trim().length === 0) {
      throw new Error('Item name is required and must be a non-empty string');
    }
    
    if (typeof cost !== 'number' || cost < 0) {
      throw new Error('Cost must be a non-negative number');
    }

    const cacheKey = getCacheKey(itemName, cost);
    
    // Check cache first
    const cachedResult = getCacheEntry(cacheKey);
    if (cachedResult) {
      return {
        category: cachedResult.category,
        cached: true
      };
    }

    // Apply strict price-based rules first
    const priceBasedCategory = applyPriceRules(cost);
    if (priceBasedCategory) {
      setCacheEntry(cacheKey, priceBasedCategory);
      return {
        category: priceBasedCategory,
        cached: false
      };
    }

    // For items under $50, use AI to classify between essential and discretionary
    const aiClassification = await callClassificationAPI(itemName, cost);
    
    let finalCategory;
    if (aiClassification) {
      finalCategory = aiClassification;
    } else {
      // Fallback to DISCRETIONARY_SMALL for items under $50 on any error
      finalCategory = CLASSIFICATION_CATEGORIES.DISCRETIONARY_SMALL;
    }

    // Cache the result
    setCacheEntry(cacheKey, finalCategory);

    return {
      category: finalCategory,
      cached: false
    };

  } catch (error) {
    console.error('Error in classifyPurchase:', error);
    
    // Fallback based on price
    if (cost >= 300) {
      return {
        category: CLASSIFICATION_CATEGORIES.HIGH_VALUE,
        cached: false
      };
    } else if (cost >= 51) {
      return {
        category: CLASSIFICATION_CATEGORIES.DISCRETIONARY_MEDIUM,
        cached: false
      };
    } else {
      return {
        category: CLASSIFICATION_CATEGORIES.DISCRETIONARY_SMALL,
        cached: false
      };
    }
  }
};

/**
 * Clear the classification cache (useful for testing)
 */
export const clearClassificationCache = () => {
  classificationCache.clear();
};

/**
 * Get cache statistics (useful for monitoring)
 */
export const getCacheStats = () => {
  cleanExpiredCache();
  return {
    size: classificationCache.size,
    maxSize: CACHE_MAX_SIZE,
    entries: Array.from(classificationCache.entries()).map(([key, entry]) => ({
      key,
      category: entry.category,
      timestamp: entry.timestamp,
      expiresAt: entry.expiresAt
    }))
  };
};