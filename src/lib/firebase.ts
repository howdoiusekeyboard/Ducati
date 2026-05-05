// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

/**
 * Firebase configuration status and error tracking
 */
interface FirebaseStatus {
  isConfigured: boolean;
  isInitialized: boolean;
  error: string | null;
  missingVars: string[];
}

// Global status tracking
const status: FirebaseStatus = {
  isConfigured: false,
  isInitialized: false,
  error: null,
  missingVars: [],
};

/**
 * Validates and sanitizes environment variables
 */
const sanitizeEnvVar = (value: string | undefined): string | undefined => {
  if (!value) return undefined;

  // Remove all whitespace characters and control characters
  return value
    .trim()
    .replace(/[\r\n\t]/g, '')
    .replace(/\\[nrt]/g, '')
    .replace(/\s+/g, (match) => {
      // Keep spaces only in URLs
      if (value.includes('.firebaseapp.com') || value.includes('.appspot.com')) {
        return match === ' ' ? match : '';
      }
      return '';
    })
    .replace(/[​-‍﻿]/g, ''); // Remove zero-width spaces
};

/**
 * Gets Firebase configuration from environment variables
 */
const getFirebaseConfig = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  const config = {
    apiKey: sanitizeEnvVar(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    authDomain: sanitizeEnvVar(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: sanitizeEnvVar(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: sanitizeEnvVar(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: sanitizeEnvVar(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    appId: sanitizeEnvVar(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  };

  // Validate required fields
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ] as const;

  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!config[field]) {
      missingFields.push(`NEXT_PUBLIC_FIREBASE_${field.replace(/([A-Z])/g, '_$1').toUpperCase()}`);
    }
  }

  if (missingFields.length > 0) {
    status.missingVars = missingFields;
    status.isConfigured = false;
    console.error('❌ Missing Firebase configuration variables:', missingFields);
    console.error('Please check your .env.local file and ensure all variables are set correctly.');
    return null;
  }

  // Additional validation for project ID format
  if (config.projectId && !/^[a-z0-9-]+$/.test(config.projectId)) {
    console.error('❌ Invalid Firebase project ID format:', config.projectId);
    console.error('Project ID can only contain lowercase letters, numbers, and hyphens.');
    status.error = 'Invalid project ID format';
    return null;
  }

  status.isConfigured = true;
  return config;
};

// Service instances
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// Track emulator connection status
let emulatorsConnected = false;

/**
 * Connects to Firebase emulators for local development
 */
const connectToEmulators = () => {
  if (emulatorsConnected || process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== 'true') {
    return;
  }

  if (auth && db) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      emulatorsConnected = true;
      console.log('✅ Connected to Firebase emulators');
    } catch (error) {
      // Emulators might already be connected
      if ((error as any)?.message?.includes('already been called')) {
        emulatorsConnected = true;
      } else {
        console.warn('⚠️ Failed to connect to Firebase emulators:', error);
      }
    }
  }
};

/**
 * Initializes Firebase app and services
 */
const initializeFirebase = (): boolean => {
  // Only initialize on client side
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if already initialized
  if (app && auth && db) {
    return true;
  }

  try {
    // Get configuration
    const config = getFirebaseConfig();
    if (!config) {
      status.error = 'Invalid or missing Firebase configuration';
      return false;
    }

    // Check for existing app instance (singleton pattern)
    if (getApps().length > 0) {
      console.log('ℹ️ Using existing Firebase app instance');
      app = getApp();
    } else {
      console.log('🚀 Initializing new Firebase app');
      app = initializeApp(config);
    }

    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);

    // Connect to emulators if in development
    if (process.env.NODE_ENV === 'development') {
      connectToEmulators();
    }

    status.isInitialized = true;
    status.error = null;

    console.log('✅ Firebase initialized successfully');
    console.log('📊 Services ready: Auth:', !!auth, '| Firestore:', !!db);

    // No reachability test — calling getDoc() on a /_test_ path inside the
    // init flow gives Firestore SDK a stray listener target that sometimes
    // races with the first real listener under StrictMode + fast-refresh,
    // surfacing as "Target ID already exists". Firestore retries on its own
    // when real reads/writes happen.

    return true;
  } catch (error) {
    status.error = error instanceof Error ? error.message : 'Unknown initialization error';
    status.isInitialized = false;

    console.error('❌ Firebase initialization failed:', status.error);
    console.error('Full error:', error);

    // Reset services on failure
    app = undefined;
    auth = undefined;
    db = undefined;

    return false;
  }
};

/**
 * Public function to check if Firebase is properly configured
 */
export const isFirebaseConfigured = (): boolean => {
  if (typeof window === 'undefined') return false;

  if (!status.isConfigured) {
    getFirebaseConfig(); // This will update status.isConfigured
  }

  return status.isConfigured;
};

/**
 * Public function to check if Firebase is initialized
 */
export const isFirebaseInitialized = (): boolean => {
  return status.isInitialized && !!app && !!auth && !!db;
};

/**
 * Public function to get Firebase status
 */
export const getFirebaseStatus = (): Readonly<FirebaseStatus> => {
  return { ...status };
};

/**
 * Initialize Firebase immediately when this module is imported (client-side only)
 */
if (typeof window !== 'undefined') {
  initializeFirebase();
}

// Export services (may be undefined if initialization fails)
export { app, auth, db };

// Export a function to manually retry initialization
export const retryFirebaseInit = (): boolean => {
  if (isFirebaseInitialized()) {
    console.log('ℹ️ Firebase already initialized');
    return true;
  }

  console.log('🔄 Retrying Firebase initialization...');
  return initializeFirebase();
};
