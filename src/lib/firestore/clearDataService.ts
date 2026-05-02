import {
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    doc
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  import { COLLECTIONS } from './collections';
  
  export interface ClearDataResult {
    success: boolean;
    clearedItems: {
      purchases: number;
      profile: boolean;
      chat: boolean;
      proMode: number;
      savingsGoal: boolean;
      localStorage: boolean;
    };
    errors: string[];
  }
  
  export const clearAllUserData = async (userId: string): Promise<ClearDataResult> => {
    const result: ClearDataResult = {
      success: false,
      clearedItems: {
        purchases: 0,
        profile: false,
        chat: false,
        proMode: 0,
        savingsGoal: false,
        localStorage: false
      },
      errors: []
    };
  
    try {
      // 1. Clear Purchase History
      try {
        const purchaseRef = collection(db!, COLLECTIONS.PURCHASE_HISTORY);
        const purchaseQuery = query(purchaseRef, where('userId', '==', userId));
        const purchaseSnapshot = await getDocs(purchaseQuery);
        
        for (const purchaseDoc of purchaseSnapshot.docs) {
          await deleteDoc(doc(db!, COLLECTIONS.PURCHASE_HISTORY, purchaseDoc.id));
          result.clearedItems.purchases++;
        }
      } catch (error) {
        result.errors.push(`Failed to clear purchase history: ${error instanceof Error ? error.message : String(error)}`);
      }
  
      // 2. Clear Financial Profile
      try {
        await deleteDoc(doc(db!, COLLECTIONS.FINANCIAL_PROFILES, userId));
        result.clearedItems.profile = true;
      } catch (error) {
        result.errors.push(`Failed to clear financial profile: ${error instanceof Error ? error.message : String(error)}`);
      }
  
      // 3. Clear Chat History
      try {
        await deleteDoc(doc(db!, COLLECTIONS.CHAT_HISTORY, userId));
        result.clearedItems.chat = true;
      } catch (error) {
        result.errors.push(`Failed to clear chat history: ${error instanceof Error ? error.message : String(error)}`);
      }
  
      // 4. Clear Pro Mode Analyses
      try {
        const proModeRef = collection(db!, COLLECTIONS.PRO_MODE_ANALYSES);
        const proModeQuery = query(proModeRef, where('userId', '==', userId));
        const proModeSnapshot = await getDocs(proModeQuery);
        
        for (const proModeDoc of proModeSnapshot.docs) {
          await deleteDoc(doc(db!, COLLECTIONS.PRO_MODE_ANALYSES, proModeDoc.id));
          result.clearedItems.proMode++;
        }
      } catch (error) {
        result.errors.push(`Failed to clear pro mode analyses: ${error instanceof Error ? error.message : String(error)}`);
      }
  
      // 5. Clear Savings Goal
      try {
        await deleteDoc(doc(db!, 'savingsGoals', userId));
        result.clearedItems.savingsGoal = true;
      } catch (error) {
        // Savings goal might not exist, which is okay
        result.clearedItems.savingsGoal = false;
      }
  
      // 6. Clear LocalStorage
      try {
        clearLocalStorageData();
        result.clearedItems.localStorage = true;
      } catch (error) {
        result.errors.push(`Failed to clear local storage: ${error instanceof Error ? error.message : String(error)}`);
      }
  
      result.success = result.errors.length === 0;
      return result;
  
    } catch (error) {
      result.errors.push(`General error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  };
  
  export const clearLocalStorageData = () => {
    // Clear all app-related localStorage keys
    const keysToRemove = [
      'quickFinancialProfile',
      'financialProfile',
      'purchaseHistory',
      'chatHistory',
      'proModeAnalyses',
      'savingsGoals',
      'userLocationData'
    ];
  
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  
    // Clear any cached data
    sessionStorage.clear();
  };