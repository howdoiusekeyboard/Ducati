import React from 'react';
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export class OfflineManager {
  private static instance: OfflineManager;
  private isOffline: boolean = false;
  private listeners: Set<(isOffline: boolean) => void> = new Set();

  private constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      
      // Initialize with current state
      this.isOffline = !navigator.onLine;
    }
  }

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private async handleOnline() {
    if (this.isOffline && db) {
      try {
        await enableNetwork(db);
        this.isOffline = false;
        this.notifyListeners();
        console.log('Firestore network enabled - back online');
      } catch (error) {
        console.error('Failed to enable Firestore network:', error);
      }
    }
  }

  private async handleOffline() {
    if (!this.isOffline && db) {
      try {
        await disableNetwork(db);
        this.isOffline = true;
        this.notifyListeners();
        console.log('Firestore network disabled - offline mode');
      } catch (error) {
        console.error('Failed to disable Firestore network:', error);
      }
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOffline));
  }

  public addListener(callback: (isOffline: boolean) => void): () => void {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  public getOfflineStatus(): boolean {
    return this.isOffline;
  }

  public async forceOffline(): Promise<void> {
    if (db) {
      await disableNetwork(db);
      this.isOffline = true;
      this.notifyListeners();
    }
  }

  public async forceOnline(): Promise<void> {
    if (db) {
      await enableNetwork(db);
      this.isOffline = false;
      this.notifyListeners();
    }
  }
}

// Hook to use offline status in components
export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    const offlineManager = OfflineManager.getInstance();
    setIsOffline(offlineManager.getOfflineStatus());

    const unsubscribe = offlineManager.addListener(setIsOffline);
    return unsubscribe;
  }, []);

  return isOffline;
};

// Initialize offline persistence
export const initializeOfflinePersistence = async (): Promise<void> => {
  if (!db) return;

  try {
    // Firestore automatically handles offline persistence in web
    // Just initialize the offline manager
    OfflineManager.getInstance();
    console.log('Offline persistence initialized');
  } catch (error) {
    console.error('Failed to initialize offline persistence:', error);
  }
};