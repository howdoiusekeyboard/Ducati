'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const App = dynamic(() => import('@/components/App'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#6366f1'
    }}>
      Loading Purchase Advisor...
    </div>
  )
});

const CatchAllPage: React.FC = () => <App />;

export default CatchAllPage;