import { useState, useEffect, useCallback } from 'react';
import { LocationService } from '@/lib/locationService';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLocation = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      if (forceRefresh) {
        LocationService.clearCache();
      }

      const locationData = await LocationService.getUserLocation();
      setLocation(locationData);
      return locationData;
    } catch (err) {
      setError(err.message);
      console.error('Location fetch error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auto-fetch on mount
    fetchLocation();
  }, []);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      // Clear cache to force browser request
      LocationService.clearCache();
      
      // Request browser location explicitly
      const browserLocation = await LocationService.getBrowserLocation();
      if (browserLocation) {
        setLocation(browserLocation);
        return browserLocation;
      } else {
        // Fallback to IP if permission denied
        return fetchLocation();
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchLocation]);

  return {
    location,
    isLoading,
    error,
    fetchLocation,
    requestPermission,
    formatLocation: LocationService.formatLocation
  };
};