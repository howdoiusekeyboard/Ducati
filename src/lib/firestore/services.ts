// src/lib/firestore/services.ts
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';
import { operationManager } from './operationManager';
import {
  COLLECTIONS,
  UserData,
  PurchaseHistoryItem,
  FinancialProfileData,
  ChatHistoryData,
  ProModeAnalysis
} from './collections';

// User Services
export const createUserDocument = async (user: User): Promise<void> => {
  if (!db || !user) {
    throw new Error('Database not initialized or user missing');
  }

  const operation = async () => {
    if (!db) throw new Error('Database not initialized');
    
    const userRef = doc(db, COLLECTIONS.USERS, user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const userData: UserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
    }
  };

  return operationManager.executeOperation(
    `user-create-${user.uid}`,
    operation,
    { maxRetries: 2 }
  );
};

// Purchase History Services
export const savePurchaseHistory = async (
  userId: string,
  purchaseData: Omit<PurchaseHistoryItem, 'userId' | 'createdAt'>
): Promise<void> => {
  if (!db || !userId) {
    throw new Error('Database not initialized or userId missing');
  }

  const operation = async () => {
    if (!db) throw new Error('Database not initialized');
    
    let dateToSave: Date;
    try {
      dateToSave = purchaseData.date instanceof Date ? purchaseData.date : new Date(purchaseData.date);
      if (isNaN(dateToSave.getTime())) {
        dateToSave = new Date();
      }
    } catch {
      dateToSave = new Date();
    }

    const documentData = {
      ...purchaseData,
      userId: userId.trim(),
      date: Timestamp.fromDate(dateToSave),
      createdAt: serverTimestamp()
    };

    const purchaseHistoryRef = collection(db, COLLECTIONS.PURCHASE_HISTORY);
    await addDoc(purchaseHistoryRef, documentData);
  };

  return operationManager.executeOperation(
    `purchase-save-${userId}-${Date.now()}`,
    operation
  );
};

export const getUserPurchaseHistory = async (
  userId: string,
  limitCount: number = 50
): Promise<PurchaseHistoryItem[]> => {
  if (!db || !userId) {
    throw new Error('Database not initialized or userId missing');
  }

  const operation = async () => {
    if (!db) throw new Error('Database not initialized');
    
    const purchaseHistoryRef = collection(db, COLLECTIONS.PURCHASE_HISTORY);
    const q = query(
      purchaseHistoryRef,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
      } as PurchaseHistoryItem;
    });
  };

  return operationManager.executeOperation(
    `purchase-history-${userId}-${limitCount}`,
    operation,
    {},
    300000 // Cache for 5 minutes
  );
};

// Financial Profile Services
export const saveFinancialProfile = async (
  userId: string,
  profileData: Omit<FinancialProfileData, 'userId' | 'lastUpdated'>
): Promise<void> => {
  if (!db || !userId) {
    throw new Error('Database not initialized or userId missing');
  }

  const operation = async () => {
    if (!db) throw new Error('Database not initialized');
    
    const profileRef = doc(db, COLLECTIONS.FINANCIAL_PROFILES, userId);
    const documentData = {
      ...profileData,
      userId,
      lastUpdated: serverTimestamp()
    };
    await setDoc(profileRef, documentData);
  };

  // Clear cache when saving new profile
  operationManager.clearCache(`profile-${userId}`);

  return operationManager.executeOperation(
    `profile-save-${userId}`,
    operation
  );
};

export const getFinancialProfile = async (
  userId: string
): Promise<FinancialProfileData | null> => {
  if (!db || !userId) {
    throw new Error('Database not initialized or userId missing');
  }

  const operation = async () => {
    if (!db) throw new Error('Database not initialized');
    
    const profileRef = doc(db, COLLECTIONS.FINANCIAL_PROFILES, userId);
    const profileDoc = await getDoc(profileRef);

    if (!profileDoc.exists()) {
      return null;
    }

    const data = profileDoc.data();
    return {
      ...data,
      lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : new Date(data.lastUpdated)
    } as FinancialProfileData;
  };

  return operationManager.executeOperation(
    `profile-get-${userId}`,
    operation,
    {},
    600000 // Cache for 10 minutes
  );
};

// Chat History Services
export const saveChatHistory = async (
  userId: string,
  messages: ChatHistoryData['messages']
): Promise<void> => {
  if (!db || !userId) {
    throw new Error('Database not initialized or userId missing');
  }

  const operation = async () => {
    if (!db) throw new Error('Database not initialized');
    
    const chatRef = doc(db, COLLECTIONS.CHAT_HISTORY, userId);
    await setDoc(chatRef, {
      userId,
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp instanceof Date ? Timestamp.fromDate(msg.timestamp) : Timestamp.fromDate(new Date(msg.timestamp))
      })),
      lastUpdated: serverTimestamp()
    });
  };

  operationManager.clearCache(`chat-${userId}`);

  return operationManager.executeOperation(
    `chat-save-${userId}`,
    operation
  );
};

export const getChatHistory = async (
  userId: string
): Promise<ChatHistoryData | null> => {
  if (!db || !userId) {
    throw new Error('Database not initialized or userId missing');
  }

  const operation = async () => {
    if (!db) throw new Error('Database not initialized');
    
    const chatRef = doc(db, COLLECTIONS.CHAT_HISTORY, userId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) return null;

    const data = chatDoc.data();
    return {
      ...data,
      messages: data.messages?.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp)
      })) || [],
      lastUpdated: data.lastUpdated?.toDate ? data.lastUpdated.toDate() : new Date(data.lastUpdated)
    } as ChatHistoryData;
  };

  return operationManager.executeOperation(
    `chat-get-${userId}`,
    operation,
    {},
    60000 // Cache for 1 minute
  );
};

// Pro Mode Analysis Services
export const saveProModeAnalysis = async (
  userId: string,
  analysisData: Omit<ProModeAnalysis, 'userId' | 'createdAt'>
): Promise<void> => {
  if (!db || !userId) {
    throw new Error('Database not initialized or userId missing');
  }

  const operation = async () => {
    if (!db) throw new Error('Database not initialized');
    
    const proModeRef = collection(db, COLLECTIONS.PRO_MODE_ANALYSES);
    await addDoc(proModeRef, {
      ...analysisData,
      userId,
      createdAt: serverTimestamp()
    });
  };

  return operationManager.executeOperation(
    `promode-save-${userId}-${Date.now()}`,
    operation
  );
};

export const getUserProModeAnalyses = async (
  userId: string,
  limitCount: number = 10
): Promise<ProModeAnalysis[]> => {
  if (!db || !userId) {
    throw new Error('Database not initialized or userId missing');
  }

  const operation = async () => {
    if (!db) throw new Error('Database not initialized');
    
    const proModeRef = collection(db, COLLECTIONS.PRO_MODE_ANALYSES);
    const q = query(
      proModeRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
      } as ProModeAnalysis;
    });
  };

  return operationManager.executeOperation(
    `promode-analyses-${userId}-${limitCount}`,
    operation,
    {},
    300000 // Cache for 5 minutes
  );
};