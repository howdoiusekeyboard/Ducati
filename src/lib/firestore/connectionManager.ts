// src/lib/firestore/connectionManager.ts
import { db } from '@/lib/firebase';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Anchor the singleton on globalThis so Next.js fast-refresh can't spawn a
// duplicate instance with its own intervals/listeners. Without this, every
// hot-reload leaks an orphaned manager whose enableNetwork() calls collide
// with the new instance's listeners ("Target ID already exists").
const GLOBAL_KEY = '__ducati_firestore_connection_manager__';
type GlobalWithManager = typeof globalThis & {
  [GLOBAL_KEY]?: FirestoreConnectionManager;
};

export class FirestoreConnectionManager {
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private listeners: Set<(connected: boolean) => void> = new Set();

  private constructor() {
    this.initializeConnection();
    this.setupNetworkListeners();
    // No 5s polling interval — Firestore SDK has its own connection retry
    // with backoff. Polling enableNetwork() on a sub-second cadence
    // corrupts Firestore's internal listener-target state under churn.
  }

  public static getInstance(): FirestoreConnectionManager {
    const g = globalThis as GlobalWithManager;
    if (!g[GLOBAL_KEY]) {
      g[GLOBAL_KEY] = new FirestoreConnectionManager();
    }
    return g[GLOBAL_KEY];
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

  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
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

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.isConnected));
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
