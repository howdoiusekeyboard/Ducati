// src/lib/firestore/connectionManager.ts
import { db } from '@/lib/firebase';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

export class FirestoreConnectionManager {
  private static instance: FirestoreConnectionManager;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private listeners: Set<(connected: boolean) => void> = new Set();
  private connectionCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeConnection();
    this.setupNetworkListeners();
    this.startConnectionMonitoring();
  }

  public static getInstance(): FirestoreConnectionManager {
    if (!FirestoreConnectionManager.instance) {
      FirestoreConnectionManager.instance = new FirestoreConnectionManager();
    }
    return FirestoreConnectionManager.instance;
  }

  private async initializeConnection(): Promise<void> {
    if (!db) {
      console.error('Firestore database not initialized');
      return;
    }

    try {
      await enableNetwork(db);
      this.isConnected = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to establish Firestore connection:', error);
      this.isConnected = false;
      this.notifyListeners();
    }
  }

  private startConnectionMonitoring(): void {
    this.connectionCheckInterval = setInterval(async () => {
      if (!this.isConnected && navigator.onLine && db) {
        await this.initializeConnection();
      }
    }, 5000);
  }

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    window.addEventListener('beforeunload', this.cleanup.bind(this));
  }

  private async handleOnline(): Promise<void> {
    if (db && !this.isConnected) {
      await this.initializeConnection();
    }
  }

  private async handleOffline(): Promise<void> {
    if (db) {
      try {
        await disableNetwork(db);
        this.isConnected = false;
        this.notifyListeners();
      } catch (error) {
        console.error('Failed to disable Firestore network:', error);
      }
    }
  }

  private cleanup(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isConnected));
  }

  public addConnectionListener(callback: (connected: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.isConnected);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  public async ensureConnection(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    if (this.connectionPromise) {
      await this.connectionPromise;
      return this.isConnected;
    }

    this.connectionPromise = this.initializeConnection();
    await this.connectionPromise;
    this.connectionPromise = null;
    
    return this.isConnected;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const connectionManager = FirestoreConnectionManager.getInstance();