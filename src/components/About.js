import { Link } from "react-router-dom";
import "../styles/App.css";

const About = () => {
  return (
    <div className="App">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">About Ducati</h1>
        <p className="hero-subtitle">
          Your personal guide to financial freedom and your path to that first million
        </p>
      </div>

      {/* About Content */}
      <div className="about-container">
        <div className="about-content">
          <div className="about-section">
            <div className="about-icon">🎯</div>
            <h2>Our Mission</h2>
            <p>
              Every major financial milestone begins with small, daily choices. Yet, these everyday 
              financial decisions often feel insignificant, overlooked, or overwhelming. Ducati 
              transforms those moments into powerful stepping stones, aligning each purchase with 
              your ultimate goal: financial independence.
            </p>
          </div>

          <div className="about-section">
            <div className="about-icon">🤖</div>
            <h2>AI-Driven Intelligence</h2>
            <p>
              Our groundbreaking AI-driven platform doesn&apos;t just set goals—it actively guides and 
              advises you every step of the way, turning ordinary choices into extraordinary growth. 
              By seamlessly integrating your financial dreams with daily spending habits, Ducati 
              accelerates your journey toward becoming a millionaire, empowering you to harness the 
              incredible potential of compound growth.
            </p>
          </div>

          <div className="about-section">
            <div className="about-icon">📈</div>
            <h2>The Power of Compound Growth</h2>
            <p>
              Imagine each small decision, each dollar spent or saved, compounding into wealth that 
              frees you to live life on your terms. With Ducati, the dream of financial freedom 
              isn&apos;t distant—it&apos;s within your grasp, growing closer every day.
            </p>
          </div>

          <div className="about-section highlight">
            <div className="about-icon">💎</div>
            <h2>Your Path to the First Million</h2>
            <p>
              Your first million is more attainable than you ever imagined. Let Ducati be your 
              personal AI advisor, your daily financial compass, and your partner in achieving the 
              extraordinary.
            </p>
            <p className="cta-text">
              <strong>Start today, and experience how small decisions can compound into monumental success.</strong>
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="about-cta">
          <h3>Ready to Begin Your Journey?</h3>
          <div className="cta-buttons">
            <Link to="/" className="cta-button primary">
              <span className="btn-icon">🛒</span>
              Start Analyzing Purchases
            </Link>
            <Link to="/profile" className="cta-button secondary">
              <span className="btn-icon">👤</span>
              Set Up Your Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;