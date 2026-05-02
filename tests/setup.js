/**
 * Jest Test Setup File
 * Configure test environment and global mocks
 */

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Firebase if needed
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  apps: [],
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app-id';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Global test utilities
global.createMockProfile = (overrides = {}) => ({
  monthlyIncome: "5000",
  monthlyExpenses: "3000",
  currentSavings: "10000",
  riskTolerance: "moderate",
  debtPayments: "500",
  financialGoal: "balance",
  summary: {
    monthlyNetIncome: 1500,
    debtToIncomeRatio: 10,
    emergencyFundMonths: 2.86,
    savingsMonths: 2.86,
    healthScore: 65,
    hasEmergencyFund: false,
    primaryGoal: "balance"
  },
  ...overrides
});

global.createMockPurchase = (overrides = {}) => ({
  itemName: "Test Item",
  cost: 100,
  purpose: "Test purpose",
  frequency: "Daily",
  category: "DISCRETIONARY_SMALL",
  ...overrides
});

// Setup test timeout
jest.setTimeout(10000);

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});