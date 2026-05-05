import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { VoiceProvider } from '../contexts/VoiceContext';
import { FirestoreErrorBoundary } from './FirestoreErrorBoundary';
import OfflineIndicator from './OfflineIndicator';
import FloatingVoiceButton from './FloatingVoiceButton';
import ScrollToTop from './ScrollToTop';
import { initializeOfflinePersistence } from '../lib/firestore/offline';
import UserProfile from './UserProfile';
import LoginPage from './LoginPage';
import TermsPage from './TermsPage';
import PrivacyPage from './PrivacyPage';
import PurchaseAdvisor from './PurchaseAdvisor';
import FinancialProfile from './FinancialProfile';
import About from './About';
import ProMode from './ProMode';
import UserGuide from './UserGuide';
import FinanceFeed from './FinanceFeed';
import ChatInterface from './ChatInterface';
import { Dashboard } from './Dashboard';
import '../styles/App.css';
import '../styles/OfflineIndicator.css';

// Header Component with Hamburger Menu
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="top-header">
        <div className="header-content">
          <Link to="/" className="logo" onClick={closeMenu}>
            <span className="logo-icon">💰</span>
            Ducati
          </Link>
          <div className="header-right">
            {user && <UserProfile />}
            <button
              className={`hamburger-menu ${isMenuOpen ? 'active' : ''}`}
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Drawer */}
      <div className={`nav-drawer ${isMenuOpen ? 'open' : ''}`}>
        <nav className="nav-drawer-content">
          <Link
            to="/chat"
            className={`nav-drawer-link ${location.pathname === '/chat' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <span className="nav-drawer-icon">💬</span>
            Ducati Advisor
          </Link>
          <Link
            to="/dashboard"
            className={`nav-drawer-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <span className="nav-drawer-icon">📊</span>
            Financial Dashboard
          </Link>
          <Link
            to="/finance-feed"
            className={`nav-drawer-link ${location.pathname === '/finance-feed' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <span className="nav-drawer-icon">📺</span>
            Finance Feed
          </Link>
          {!user && (
            <Link
              to="/login"
              className={`nav-drawer-link ${location.pathname === '/login' ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <span className="nav-drawer-icon">🔐</span>
              Sign In
            </Link>
          )}
          <Link
            to="/user-guide"
            className={`nav-drawer-link ${location.pathname === '/user-guide' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <span className="nav-drawer-icon">📖</span>
            User Guide
          </Link>
          <Link
            to="/about"
            className={`nav-drawer-link ${location.pathname === '/about' ? 'active' : ''}`}
            onClick={closeMenu}
          >
            <span className="nav-drawer-icon">ℹ️</span>
            About
          </Link>
        </nav>
      </div>

      {/* Overlay */}
      {isMenuOpen && <div className="nav-overlay" onClick={closeMenu} aria-hidden="true" />}
    </>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="app-footer">
      <p>Based on proven investment principles and decision-making framework</p>
    </footer>
  );
};

// Navigation Component
const Navigation = () => {
  const location = useLocation();

  // Don't show navigation on Pro Mode page
  if (location.pathname === '/pro-mode') {
    return null;
  }

  return (
    <div className="nav-container">
      {location.pathname === '/' ? (
        <Link to="/profile" className="nav-button">
          <span className="nav-icon">👤</span>
          My Financial Profile
        </Link>
      ) : (
        <Link to="/" className="nav-button">
          <span className="nav-icon">🛒</span>
          Purchase Advisor
        </Link>
      )}
    </div>
  );
};

// Component to handle initialization
const AppInitializer = () => {
  useEffect(() => {
    // Initialize offline persistence
    initializeOfflinePersistence().catch(console.error);
  }, []);

  return null; // This component doesn't render anything
};

// Phase 8a: gate FloatingVoiceButton on auth so anon /chat visits don't fire
// /api/realtime/token (still on the OpenAI Realtime path until Phase 8b's
// Gemini Live rewrite). Returning null keeps the realtime route inert end-to-end.
const AuthedFloatingVoiceButton = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <FloatingVoiceButton />;
};

const App = () => {
  return (
    <AuthProvider>
      <FirestoreErrorBoundary>
        <Router>
          <ScrollToTop />
          <VoiceProvider>
            <div className="app-layout">
              <AppInitializer />
              <OfflineIndicator />
              <Header />
              {/* Add Voice Components */}
              <AuthedFloatingVoiceButton />

              <main className="main-content">
                <Routes>
                  <Route path="/" element={<PurchaseAdvisor />} />
                  <Route path="/profile" element={<FinancialProfile />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/pro-mode" element={<ProMode />} />
                  <Route path="/user-guide" element={<UserGuide />} />
                  <Route path="/finance-feed" element={<FinanceFeed />} />
                  <Route path="/chat" element={<ChatInterface />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                </Routes>
              </main>

              <Footer />
              <Navigation />
            </div>
          </VoiceProvider>
        </Router>
      </FirestoreErrorBoundary>
    </AuthProvider>
  );
};

export default App;
