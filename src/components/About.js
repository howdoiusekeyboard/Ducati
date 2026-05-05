import { Link } from 'react-router-dom';
import { Target, Bot, TrendingUp, Gem, ShoppingCart, User } from 'lucide-react';
import '../styles/App.css';

const About = () => {
  return (
    <div className="App">
      <div className="hero-section">
        <h1 className="hero-title">About Ducati</h1>
        <p className="hero-subtitle">A purchase advisor for everyday financial decisions.</p>
      </div>

      <div className="about-container">
        <div className="about-content">
          <div className="about-section">
            <Target className="about-icon" aria-hidden="true" />
            <h2>What Ducati does</h2>
            <p>
              Every purchase shapes your financial trajectory. Ducati helps you decide which ones
              are worth it. Describe what you want to buy and Ducati gives you a buy / wait / skip
              verdict based on your financial profile.
            </p>
          </div>

          <div className="about-section">
            <Bot className="about-icon" aria-hidden="true" />
            <h2>How it works</h2>
            <p>
              Ducati looks at your income, savings goals, and recent decisions, then weighs the
              proposed purchase against them. The output is a recommendation, not advice — you
              decide.
            </p>
          </div>

          <div className="about-section">
            <TrendingUp className="about-icon" aria-hidden="true" />
            <h2>Compound growth</h2>
            <p>
              Small decisions add up. Skipping the wrong purchase today funds the right one
              tomorrow. Ducati keeps the math in front of you so the trade-off is visible.
            </p>
          </div>

          <div className="about-section highlight">
            <Gem className="about-icon" aria-hidden="true" />
            <h2>The first million</h2>
            <p>
              Most paths to the first million are made of mundane choices. Ducati helps you make
              them deliberately.
            </p>
          </div>
        </div>

        <div className="about-cta">
          <h3>Get started</h3>
          <div className="cta-buttons">
            <Link to="/" className="cta-button primary">
              <ShoppingCart className="btn-icon" aria-hidden="true" />
              Analyze a purchase
            </Link>
            <Link to="/profile" className="cta-button secondary">
              <User className="btn-icon" aria-hidden="true" />
              Set up profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
