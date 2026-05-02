import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface DataLoaderState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  hasLocalFallback: boolean;
}

export const useRobustDataLoader = <T>(
  dataKey: string,
  firestoreLoader: () => Promise<T | null>,
  localStorageKey?: string,
  fallbackTransformer?: (localData: any) => T
) => {
  const { user } = useAuth();
  const [state, setState] = useState<DataLoaderState<T>>({
    data: null,
    loading: true,
    error: null,
    hasLocalFallback: false
  });

  // Use refs to store stable references
  const firestoreLoaderRef = useRef(firestoreLoader);
  const fallbackTransformerRef = useRef(fallbackTransformer);
  const hasInitialized = useRef(false);

  // Update refs when functions change
  useEffect(() => {
    firestoreLoaderRef.current = firestoreLoader;
  }, [firestoreLoader]);

  useEffect(() => {
    fallbackTransformerRef.current = fallbackTransformer;
  }, [fallbackTransformer]);

  const loadFromLocalStorage = useCallback((): T | null => {
    if (!localStorageKey) return null;
    
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return fallbackTransformerRef.current ? fallbackTransformerRef.current(parsed) : parsed;
      }
    } catch (error) {
      console.error(`Error loading ${dataKey} from localStorage:`, error);
    }
    return null;
  }, [dataKey, localStorageKey]);

  const loadData = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false, data: null }));
      return;
    }

    // Only show loading on initial load or manual retry
    if (!hasInitialized.current) {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }
    
    try {
      // Try to load from Firestore
      const firestoreData = await firestoreLoaderRef.current();
      
      if (firestoreData) {
        setState({
          data: firestoreData,
          loading: false,
          error: null,
          hasLocalFallback: false
        });
        hasInitialized.current = true;
        return;
      }

      // If no Firestore data, try localStorage
      const localData = loadFromLocalStorage();
      if (localData) {
        setState({
          data: localData,
          loading: false,
          error: null,
          hasLocalFallback: true
        });
        hasInitialized.current = true;
        return;
      }

      // No data found anywhere
      setState({
        data: null,
        loading: false,
        error: null,
        hasLocalFallback: false
      });
      hasInitialized.current = true;

    } catch (error: any) {
      console.error(`Error loading ${dataKey}:`, error);
      
      // Try localStorage as fallback on error
      const localData = loadFromLocalStorage();
      if (localData) {
        setState({
          data: localData,
          loading: false,
          error: `Connection issue - using offline data`,
          hasLocalFallback: true
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: error.message || `Failed to load ${dataKey}`,
          hasLocalFallback: false
        });
      }
      hasInitialized.current = true;
    }
  }, [user, dataKey, loadFromLocalStorage]);

  const retry = useCallback(() => {
    hasInitialized.current = false; // Reset to show loading state
    loadData();
  }, [loadData]);

  // Only load data when user changes or on initial mount
  useEffect(() => {
    if (!hasInitialized.current) {
      loadData();
    }
  }, [user?.uid]); // Only depend on user ID, not the entire user object

  return {
    ...state,
    retry
  };
};