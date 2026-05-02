export const COLLECTIONS = {
    USERS: 'users',
    PURCHASE_HISTORY: 'purchaseHistory',
    FINANCIAL_PROFILES: 'financialProfiles',
    CHAT_HISTORY: 'chatHistory',
    PRO_MODE_ANALYSES: 'proModeAnalyses'
  } as const;
  
  export interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    createdAt: Date;
    lastUpdated: Date;
  }
  
  export interface PurchaseHistoryItem {
    userId: string;
    date: Date;
    itemName: string;
    itemCost: number;
    decision: string;
    savings: number;
    alternative: any | null;
    analysisDetails?: any;
    createdAt: Date;
  }
  
  export interface FinancialProfileData {
    userId: string;
    monthlyIncome: string;
    incomeFrequency: string;
    otherIncomeSources: string;
    housingCost: string;
    utilitiesCost: string;
    foodCost: string;
    transportationCost: string;
    insuranceCost: string;
    subscriptionsCost: string;
    otherExpenses: string;
    creditCardDebt: string;
    creditCardPayment: string;
    studentLoanDebt: string;
    studentLoanPayment: string;
    carLoanDebt: string;
    carLoanPayment: string;
    mortgageDebt: string;
    mortgagePayment: string;
    otherDebt: string;
    otherDebtPayment: string;
    creditScore: string;
    creditLimit: string;
    currentCreditBalance: string;
    checkingSavingsBalance: string;
    emergencyFund: string;
    retirementAccounts: string;
    stocksAndBonds: string;
    realEstateValue: string;
    otherInvestments: string;
    shortTermGoals: string;
    midTermGoals: string;
    longTermGoals: string;
    purchaseTimeframe: string;
    riskTolerance: string;
    financialPriorities: string;
    summary: any;
    lastUpdated: Date;
  }
  
  export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isVoice?: boolean;
  }
  
  export interface ChatHistoryData {
    userId: string;
    messages: ChatMessage[];
    lastUpdated: Date;
  }
  
  export interface ProModeAnalysis {
    userId: string;
    itemName: string;
    itemCost: number;
    questions: any[];
    answers: any;
    analysis: any;
    createdAt: Date;
  }