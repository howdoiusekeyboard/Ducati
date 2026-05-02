import React, { useState } from 'react';
import { useLocation } from '../hooks/useLocation';

const LocationPermission = ({ onLocationSet }) => {
  const [showBanner, setShowBanner] = useState(true);
  const { location, requestPermission, isLoading } = useLocation();

  if (!showBanner || location?.accuracy === 'high') return null;

  return (
    <div className="location-permission-banner">
      <div className="banner-content">
        <span className="banner-icon">📍</span>
        <div className="banner-text">
          <strong>Get better local deals!</strong>
          <p>Enable location to find nearby stores and accurate shipping costs</p>
        </div>
        <div className="banner-actions">
          <button 
            onClick={async () => {
              const loc = await requestPermission();
              if (loc) onLocationSet?.(loc);
              setShowBanner(false);
            }}
            disabled={isLoading}
            className="enable-btn"
          >
            Enable Location
          </button>
          <button 
            onClick={() => setShowBanner(false)}
            className="dismiss-btn"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPermission;