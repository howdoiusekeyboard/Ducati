/**
 * Location Service Module
 * Handles location detection, caching, and privacy-aware geolocation
 */

const LOCATION_CACHE_KEY = 'userLocationData';
const LOCATION_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export const LocationService = {
  /**
   * Get user location with fallback strategies
   * Priority: 1) Cached, 2) Browser Geolocation, 3) IP-based, 4) Default
   */
  async getUserLocation() {
    // Check cache first
    const cached = this.getCachedLocation();
    if (cached && !this.isCacheExpired(cached)) {
      return cached.data;
    }

    // Try browser geolocation
    const browserLocation = await this.getBrowserLocation();
    if (browserLocation) {
      this.cacheLocation(browserLocation);
      return browserLocation;
    }

    // Fallback to IP-based detection
    const ipLocation = await this.getIPLocation();
    if (ipLocation) {
      this.cacheLocation(ipLocation);
      return ipLocation;
    }

    // Default fallback
    return this.getDefaultLocation();
  },

  async getBrowserLocation() {
    if (!navigator.geolocation) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationData = await this.reverseGeocode(latitude, longitude);
          resolve({
            latitude,
            longitude,
            ...locationData,
            source: 'browser',
            accuracy: 'high'
          });
        },
        () => resolve(null),
        { timeout: 5000, maximumAge: 0 }
      );
    });
  },

  async getIPLocation() {
    try {
      // Use a free IP geolocation service
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(3000)
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        city: data.city,
        state: data.region,
        country: data.country_name,
        countryCode: data.country_code,
        postalCode: data.postal,
        latitude: data.latitude,
        longitude: data.longitude,
        source: 'ip',
        accuracy: 'medium'
      };
    } catch {
      return null;
    }
  },

  async reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { signal: AbortSignal.timeout(3000) }
      );
      
      if (!response.ok) return {};
      
      const data = await response.json();
      return {
        city: data.address?.city || data.address?.town,
        state: data.address?.state,
        country: data.address?.country,
        countryCode: data.address?.country_code?.toUpperCase(),
        postalCode: data.address?.postcode
      };
    } catch {
      return {};
    }
  },

  getDefaultLocation() {
    return {
      city: 'United States',
      state: null,
      country: 'United States',
      countryCode: 'US',
      source: 'default',
      accuracy: 'low'
    };
  },

  getCachedLocation() {
    try {
      const cached = localStorage.getItem(LOCATION_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  },

  cacheLocation(locationData) {
    try {
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({
        data: locationData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to cache location:', error);
    }
  },

  isCacheExpired(cached) {
    return Date.now() - cached.timestamp > LOCATION_CACHE_DURATION;
  },

  clearCache() {
    localStorage.removeItem(LOCATION_CACHE_KEY);
  },

  /**
   * Format location for display
   */
  formatLocation(location) {
    if (!location) return 'Location unknown';
    
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.countryCode && location.countryCode !== 'US') {
      parts.push(location.countryCode);
    }
    
    return parts.join(', ') || 'Location unknown';
  }
};