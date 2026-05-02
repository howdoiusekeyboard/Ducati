import React from 'react';
import { useOfflineStatus } from '../lib/firestore/offline';

const OfflineIndicator: React.FC = () => {
  const isOffline = useOfflineStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <div className="offline-indicator">
      <div className="offline-banner">
        <span className="offline-icon">📡</span>
        <span className="offline-text">
          You&apos;re offline. Changes will sync when you&apos;re back online.
        </span>
      </div>
    </div>
  );
};

export default OfflineIndicator;