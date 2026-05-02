// src/hooks/useFirestore.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { clearAllUserData, clearLocalStorageData } from '@/lib/firestore/clearDataService';
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  Unsubscribe
} from 'firebase/firestore';
import { db, isFirebaseInitialized } from '@/lib/firebase';
import {
  savePurchaseHistory as saveToFirestore,
  getUserPurchaseHistory as getFromFirestore,
  saveFinancialProfile as saveProfileToFirestore,
  getFinancialProfile as getProfileFromFirestore,
  saveChatHistory as saveChatToFirestore,
  getChatHistory as getChatFromFirestore,
  saveProModeAnalysis as saveProModeToFirestore,
  getUserProModeAnalyses as getProModesFromFirestore,
  createUserDocument
} from '@/lib/firestore/services';
import {
  COLLECTIONS,
  PurchaseHistoryItem,
  FinancialProfileData,
  ChatHistoryData,
  ProModeAnalysis
} from '@/lib/firestore/collections';
import { operationManager } from '@/lib/firestore/operationManager';

interface UseFirestoreReturn {
  isLoading: boolean;
  error: string | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  isFirestoreReady: boolean;
  user: any;
  // Purchase History
  savePurchase: (purchaseData: Omit<PurchaseHistoryItem, 'userId' | 'createdAt'>) => Promise<void>;
  getPurchaseHistory: (limitCount?: number) => Promise<PurchaseHistoryItem[]>;
  getAllPurchaseHistory: () => Promise<PurchaseHistoryItem[]>;
  // Financial Profile
  saveProfile: (profileData: Omit<FinancialProfileData, 'userId' | 'lastUpdated'>) => Promise<void>;
  getProfile: () => Promise<FinancialProfileData | null>;
  // Chat History
  saveChat: (messages: ChatHistoryData['messages']) => Promise<void>;
  getChat: () => Promise<ChatHistoryData | null>;
  // Pro Mode Analysis
  saveProAnalysis: (analysisData: Omit<ProModeAnalysis, 'userId' | 'createdAt'>) => Promise<void>;
  getProAnalyses: () => Promise<ProModeAnalysis[]>;
  // Real-time listeners
  subscribeToProfile: (callback: (profile: FinancialProfileData | null) => void) => Unsubscribe | null;
  subscribeToPurchaseHistory: (callback: (purchases: PurchaseHistoryItem[]) => void, limitCount?: number) => Unsubscribe | null;
  subscribeToChatHistory: (callback: (chat: ChatHistoryData | null) => void) => Unsubscribe | null;
  // Data management
  clearAllData: () => Promise<{ success: boolean; clearedItems: any }>;
}

export const useFirestore = (): UseFirestoreReturn => {
  const { user, loading: authLoading, isFirebaseReady } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirestoreReady, setIsFirestoreReady] = useState(false);

  // Check Firestore availability
  useEffect(() => {
    setIsFirestoreReady(isFirebaseInitialized() && !!db);
  }, [isFirebaseReady]);

  // Create user document on auth
  useEffect(() => {
    if (user && isFirestoreReady) {
      createUserDocument(user).catch((err) => {
        console.error('Failed to create user document:', err);
      });
    }
  }, [user, isFirestoreReady]);

  // Clear user-specific cache on logout
  useEffect(() => {
    if (!user) {
      operationManager.clearCache();
    }
  }, [user]);

  // Helper function to check if Firestore operations can proceed
  const canUseFirestore = useCallback((): boolean => {
    if (!isFirebaseInitialized() || !db) {
      setError('Firestore is not initialized. Please check your Firebase configuration.');
      console.error('❌ Firestore not available');
      return false;
    }
    if (!user) {
      setError('User not authenticated');
      return false;
    }
    return true;
  }, [user]);

  // Purchase History
  const savePurchase = useCallback(async (purchaseData: Omit<PurchaseHistoryItem, 'userId' | 'createdAt'>) => {
    if (!canUseFirestore()) {
      throw new Error('Cannot save purchase: Firestore not ready or user not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      await saveToFirestore(user!.uid, purchaseData);
      operationManager.clearCache(`purchase-history-${user!.uid}`);
    } catch (err: any) {
      const errorMsg = 'Failed to save purchase history';
      setError(errorMsg);
      console.error(errorMsg, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, canUseFirestore]);

  const getPurchaseHistory = useCallback(async (limitCount?: number): Promise<PurchaseHistoryItem[]> => {
    if (!canUseFirestore()) return [];

    setIsLoading(true);
    setError(null);

    try {
      return await getFromFirestore(user!.uid, limitCount);
    } catch (err) {
      const errorMsg = 'Failed to load purchase history';
      setError(errorMsg);
      console.error(errorMsg, err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, canUseFirestore]);

  const getAllPurchaseHistory = useCallback(async (): Promise<PurchaseHistoryItem[]> => {
    if (!canUseFirestore()) return [];

    setIsLoading(true);
    setError(null);

    try {
      const purchaseHistoryRef = collection(db!, COLLECTIONS.PURCHASE_HISTORY);
      const q = query(
        purchaseHistoryRef,
        where('userId', '==', user!.uid),
        orderBy('date', 'desc')
      );

      const operation = async () => {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          date: doc.data().date.toDate()
        } as unknown as PurchaseHistoryItem));
      };

      return await operationManager.executeOperation(
        `all-purchase-history-${user!.uid}`,
        operation,
        {},
        300000 // Cache for 5 minutes
      );
    } catch (err) {
      const errorMsg = 'Failed to load all purchase history';
      setError(errorMsg);
      console.error(errorMsg, err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, canUseFirestore]);

  // Financial Profile
  const saveProfile = useCallback(async (profileData: Omit<FinancialProfileData, 'userId' | 'lastUpdated'>) => {
    if (!canUseFirestore()) {
      console.warn('Cannot save profile: Firestore not ready');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await saveProfileToFirestore(user!.uid, profileData);
    } catch (err) {
      const errorMsg = 'Failed to save financial profile';
      setError(errorMsg);
      console.error(errorMsg, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, canUseFirestore]);

  const getProfile = useCallback(async (): Promise<FinancialProfileData | null> => {
    if (!canUseFirestore()) return null;

    setIsLoading(true);
    setError(null);

    try {
      return await getProfileFromFirestore(user!.uid);
    } catch (err) {
      const errorMsg = 'Failed to load financial profile';
      setError(errorMsg);
      console.error(errorMsg, err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, canUseFirestore]);

  // Chat History
  const saveChat = useCallback(async (messages: ChatHistoryData['messages']) => {
    if (!canUseFirestore()) {
      console.warn('Cannot save chat: Firestore not ready');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await saveChatToFirestore(user!.uid, messages);
    } catch (err) {
      const errorMsg = 'Failed to save chat history';
      setError(errorMsg);
      console.error(errorMsg, err);
    } finally {
      setIsLoading(false);
    }
  }, [user, canUseFirestore]);

  const getChat = useCallback(async (): Promise<ChatHistoryData | null> => {
    if (!canUseFirestore()) return null;

    setIsLoading(true);
    setError(null);

    try {
      return await getChatFromFirestore(user!.uid);
    } catch (err) {
      const errorMsg = 'Failed to load chat history';
      setError(errorMsg);
      console.error(errorMsg, err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, canUseFirestore]);

  // Pro Mode Analysis
  const saveProAnalysis = useCallback(async (analysisData: Omit<ProModeAnalysis, 'userId' | 'createdAt'>) => {
    if (!canUseFirestore()) {
      console.warn('Cannot save pro analysis: Firestore not ready');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await saveProModeToFirestore(user!.uid, analysisData);
    } catch (err) {
      const errorMsg = 'Failed to save pro mode analysis';
      setError(errorMsg);
      console.error(errorMsg, err);
    } finally {
      setIsLoading(false);
    }
  }, [user, canUseFirestore]);

  const getProAnalyses = useCallback(async (): Promise<ProModeAnalysis[]> => {
    if (!canUseFirestore()) return [];

    setIsLoading(true);
    setError(null);

    try {
      return await getProModesFromFirestore(user!.uid);
    } catch (err) {
      const errorMsg = 'Failed to load pro mode analyses';
      setError(errorMsg);
      console.error(errorMsg, err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, canUseFirestore]);

  // Real-time listeners
  const subscribeToProfile = useCallback((callback: (profile: FinancialProfileData | null) => void): Unsubscribe | null => {
    if (!canUseFirestore()) return null;

    const profileRef = doc(db!, COLLECTIONS.FINANCIAL_PROFILES, user!.uid);
    return onSnapshot(profileRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback({
            ...data,
            lastUpdated: data.lastUpdated?.toDate()
          } as FinancialProfileData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to profile changes:', error);
        setError('Failed to sync profile data');
      }
    );
  }, [user, canUseFirestore]);

  const subscribeToPurchaseHistory = useCallback((
    callback: (purchases: PurchaseHistoryItem[]) => void,
    limitCount: number = 50
  ): Unsubscribe | null => {
    if (!canUseFirestore()) return null;

    const purchaseHistoryRef = collection(db!, COLLECTIONS.PURCHASE_HISTORY);
    const q = query(
      purchaseHistoryRef,
      where('userId', '==', user!.uid),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(q,
      (snapshot) => {
        const purchases = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          date: doc.data().date.toDate()
        } as unknown as PurchaseHistoryItem));
        callback(purchases);
        operationManager.clearCache(`purchase-history-${user!.uid}`);
      },
      (error) => {
        console.error('Error listening to purchase history changes:', error);
        setError('Failed to sync purchase history');
      }
    );
  }, [user, canUseFirestore]);

  const subscribeToChatHistory = useCallback((callback: (chat: ChatHistoryData | null) => void): Unsubscribe | null => {
    if (!canUseFirestore()) return null;

    const chatRef = doc(db!, COLLECTIONS.CHAT_HISTORY, user!.uid);
    return onSnapshot(chatRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback({
            ...data,
            messages: data.messages.map((msg: any) => ({
              ...msg,
              timestamp: msg.timestamp.toDate()
            })),
            lastUpdated: data.lastUpdated?.toDate()
          } as ChatHistoryData);
          operationManager.clearCache(`chat-${user!.uid}`);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to chat history changes:', error);
        setError('Failed to sync chat history');
      }
    );
  }, [user, canUseFirestore]);

  return {
    isLoading,
    error,
    authLoading,
    isAuthenticated: !!user && !!user.uid && !authLoading,
    isFirestoreReady,
    user,
    savePurchase,
    getPurchaseHistory,
    getAllPurchaseHistory,
    saveProfile,
    getProfile,
    saveChat,
    getChat,
    saveProAnalysis,
    getProAnalyses,
    subscribeToProfile,
    subscribeToPurchaseHistory,
    subscribeToChatHistory,
    clearAllData: async () => {
      if (!user) {
        // Just clear localStorage for non-authenticated users
        clearLocalStorageData();
        return { success: true, clearedItems: { localStorage: true } };
      }
      return await clearAllUserData(user.uid);
    }
  };
};
