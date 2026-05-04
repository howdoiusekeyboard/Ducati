/**
 * Test Purchase Scenarios for Ducati Recommendation Engine
 * Each purchase is designed to test specific decision matrix logic
 */

// Essential purchases (typically should be approved)
export const ESSENTIAL_PURCHASES = [
  {
    id: 'grocery-weekly',
    itemName: 'Grocery Shopping',
    cost: 150,
    purpose: 'Weekly food and household essentials',
    frequency: 'Weekly',
    category: 'ESSENTIAL_DAILY',
    expectedScores: {
      necessity: 9,
      frequencyOfUse: 8,
    },
  },
  {
    id: 'medicine',
    itemName: 'Prescription Medicine',
    cost: 45,
    purpose: 'Monthly medication for health condition',
    frequency: 'Monthly',
    category: 'ESSENTIAL_DAILY',
    expectedScores: {
      necessity: 9,
      frequencyOfUse: 6,
    },
  },
  {
    id: 'textbook',
    itemName: 'Used Textbook',
    cost: 80,
    purpose: 'Required textbook for education',
    frequency: 'Daily',
    category: 'DISCRETIONARY_SMALL',
    expectedScores: {
      necessity: 9,
      frequencyOfUse: 10,
      longevity: 6,
    },
  },
];

// Discretionary purchases (mixed recommendations based on profile)
export const DISCRETIONARY_PURCHASES = [
  {
    id: 'gaming-console',
    itemName: 'Gaming Console',
    cost: 500,
    purpose: 'Entertainment and relaxation',
    frequency: 'Daily',
    category: 'HIGH_VALUE',
    expectedScores: {
      necessity: 3,
      frequencyOfUse: 10,
      emotionalValue: 5,
    },
  },
  {
    id: 'nike-shoes',
    itemName: 'Nike Shoes',
    cost: 75,
    purpose: 'Want new running shoes for style',
    frequency: 'Daily',
    category: 'DISCRETIONARY_MEDIUM',
    expectedScores: {
      necessity: 6,
      frequencyOfUse: 10,
      socialFactors: 3,
    },
  },
  {
    id: 'designer-handbag',
    itemName: 'Designer Handbag',
    cost: 1200,
    purpose: 'Professional appearance and personal style',
    frequency: 'Weekly',
    category: 'HIGH_VALUE',
    expectedScores: {
      necessity: 3,
      frequencyOfUse: 8,
      emotionalValue: 5,
      socialFactors: 3,
    },
  },
  {
    id: 'gym-equipment',
    itemName: 'Home Gym Equipment',
    cost: 1500,
    purpose: 'Health and fitness investment',
    frequency: 'Daily',
    category: 'HIGH_VALUE',
    expectedScores: {
      necessity: 6,
      frequencyOfUse: 10,
      longevity: 9,
      emotionalValue: 8,
    },
  },
];

// Luxury/Want purchases (typically should be rejected for low-income)
export const LUXURY_PURCHASES = [
  {
    id: 'luxury-watch',
    itemName: 'Luxury Watch',
    cost: 3000,
    purpose: 'Status symbol and collection',
    frequency: 'Daily',
    category: 'HIGH_VALUE',
    expectedScores: {
      necessity: 3,
      emotionalValue: 5,
      socialFactors: 3,
      buyersRemorse: 2,
    },
  },
  {
    id: 'weekend-vacation',
    itemName: 'Weekend Vacation',
    cost: 2000,
    purpose: 'Relaxation and travel',
    frequency: 'One-time',
    category: 'HIGH_VALUE',
    expectedScores: {
      necessity: 3,
      frequencyOfUse: 2,
      longevity: 3,
      emotionalValue: 8,
    },
  },
  {
    id: 'art-piece',
    itemName: 'Impulse Art Purchase',
    cost: 800,
    purpose: 'Saw it and loved it, impulse buy',
    frequency: 'Rarely',
    category: 'HIGH_VALUE',
    expectedScores: {
      necessity: 3,
      frequencyOfUse: 3,
      emotionalValue: 2,
      buyersRemorse: 0,
    },
  },
];

// Investment-aligned purchases
export const INVESTMENT_PURCHASES = [
  {
    id: 'stock-platform',
    itemName: 'Stock Investment Platform Subscription',
    cost: 100,
    purpose: 'Investment platform for wealth building',
    frequency: 'Daily',
    category: 'DISCRETIONARY_MEDIUM',
    expectedScores: {
      necessity: 6,
      frequencyOfUse: 10,
      financialGoalAlignment: 9,
    },
  },
  {
    id: 'professional-course',
    itemName: 'Professional Development Course',
    cost: 299,
    purpose: 'Career advancement and skill development',
    frequency: 'Daily',
    category: 'DISCRETIONARY_MEDIUM',
    expectedScores: {
      necessity: 6,
      frequencyOfUse: 10,
      longevity: 9,
      financialGoalAlignment: 8,
    },
  },
];

// Special test cases with alternatives
export const PURCHASES_WITH_ALTERNATIVES = [
  {
    id: 'expensive-laptop',
    itemName: 'Premium Laptop',
    cost: 2500,
    purpose: 'Work and personal computing',
    frequency: 'Daily',
    category: 'HIGH_VALUE',
    alternative: {
      name: 'Budget Laptop',
      price: 800,
      description: 'Similar specs but less premium brand',
    },
    expectedScores: {
      valueForMoney: 2,
      alternativeAvailability: 3,
    },
  },
  {
    id: 'brand-clothes',
    itemName: 'Brand Name Clothing',
    cost: 200,
    purpose: 'New outfit for events',
    frequency: 'Weekly',
    category: 'DISCRETIONARY_MEDIUM',
    alternative: {
      name: 'Generic Brand Clothing',
      price: 60,
      description: 'Similar style without the brand',
    },
    expectedScores: {
      valueForMoney: 2,
      alternativeAvailability: 3,
    },
  },
];

// Edge case purchases for boundary testing
export const EDGE_CASE_PURCHASES = [
  {
    id: 'free-item',
    itemName: 'Free Sample',
    cost: 0,
    purpose: 'Free promotional item',
    frequency: 'One-time',
    category: 'ESSENTIAL_DAILY',
  },
  {
    id: 'extremely-expensive',
    itemName: 'Luxury Car',
    cost: 100000,
    purpose: 'Dream car purchase',
    frequency: 'Daily',
    category: 'HIGH_VALUE',
  },
  {
    id: 'undefined-frequency',
    itemName: 'Mystery Box',
    cost: 50,
    purpose: 'Surprise contents',
    frequency: undefined,
    category: 'DISCRETIONARY_SMALL',
  },
];

// Export all purchase collections
export const ALL_PURCHASES = [
  ...ESSENTIAL_PURCHASES,
  ...DISCRETIONARY_PURCHASES,
  ...LUXURY_PURCHASES,
  ...INVESTMENT_PURCHASES,
  ...PURCHASES_WITH_ALTERNATIVES,
  ...EDGE_CASE_PURCHASES,
];

// Helper function to get purchase by ID
export const getPurchaseById = (id) => {
  return ALL_PURCHASES.find((p) => p.id === id);
};

// Helper function to get purchases by category
export const getPurchasesByCategory = (category) => {
  return ALL_PURCHASES.filter((p) => p.category === category);
};
