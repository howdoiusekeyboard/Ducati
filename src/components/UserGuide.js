import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/UserGuide.css';

const UserGuide = () => {
  const [expandedSection, setExpandedSection] = useState('purchase-advisor');

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="App">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">User Guide</h1>
        <p className="hero-subtitle">
          Everything you need to know to master Ducati and make smarter financial decisions
        </p>
      </div>

      {/* Guide Content */}
      <div className="guide-container">
        <div className="guide-intro">
          <div className="intro-card">
            <h2>Welcome to Ducati!</h2>
            <p>
              Ducati is your personal AI-powered financial advisor that helps you make smarter
              purchasing decisions. Whether you're considering a small daily purchase or a major
              investment, Ducati analyzes your financial situation and provides personalized
              recommendations to help you reach your first million.
            </p>
          </div>
        </div>

        <div className="guide-sections">
          {/* Purchase Analyzer Section */}
          <div className="guide-section">
            <div
              className="section-header"
              onClick={() => toggleSection('purchase-advisor')}
              role="button"
              tabIndex="0"
              aria-expanded={expandedSection === 'purchase-advisor'}
            >
              <h3>
                <span className="section-number">1</span>
                <span className="section-icon">🛒</span>
                Purchase Analyzer Tool
              </h3>
              <span className="toggle-indicator">
                {expandedSection === 'purchase-advisor' ? '−' : '+'}
              </span>
            </div>

            {expandedSection === 'purchase-advisor' && (
              <div className="section-content">
                <p className="section-intro">
                  The Purchase Analyzer provides in-depth analysis with a detailed decision matrix
                  and financial impact assessment. Perfect for important purchases that need careful
                  consideration.
                </p>
                <div className="step-by-step">
                  <div className="step">
                    <div className="step-number">Step 1</div>
                    <h4>Enter Item Details</h4>
                    <p>
                      Start by entering the name of the item you're considering and its cost. You
                      can also add optional details like:
                    </p>
                    <ul>
                      <li>
                        <strong>Purpose:</strong> What you'll use it for
                      </li>
                      <li>
                        <strong>Frequency:</strong> How often you'll use it (Daily, Weekly, Monthly,
                        etc.)
                      </li>
                    </ul>
                  </div>

                  <div className="step">
                    <div className="step-number">Step 2</div>
                    <h4>Add a Photo (Optional)</h4>
                    <p>Click "Add Item Photo" to:</p>
                    <ul>
                      <li>📷 Take a photo with your camera</li>
                      <li>📤 Upload an existing image</li>
                      <li>📁 Drag and drop a file</li>
                    </ul>
                    <p className="tip">
                      <strong>💡 Pro Tip:</strong> Adding a photo helps our AI better identify the
                      item and provide more accurate pricing comparisons!
                    </p>
                  </div>

                  <div className="step">
                    <div className="step-number">Step 3</div>
                    <h4>Choose Analysis Options</h4>
                    <p>Select whether you want Ducati to:</p>
                    <ul>
                      <li>✅ Find cheaper alternatives online (recommended)</li>
                    </ul>
                  </div>

                  <div className="step">
                    <div className="step-number">Step 4</div>
                    <h4>Get Your Recommendation</h4>
                    <p>
                      Click "Should I Buy It?" to receive your personalized analysis. The AI will
                      consider your financial profile and provide a clear Buy or Don't Buy
                      recommendation with detailed reasoning.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ducati Advisor Section - NEW */}
          <div className="guide-section">
            <div
              className="section-header"
              onClick={() => toggleSection('denarii-advisor')}
              role="button"
              tabIndex="0"
              aria-expanded={expandedSection === 'denarii-advisor'}
            >
              <h3>
                <span className="section-number">2</span>
                <span className="section-icon">💬</span>
                Ducati Advisor Chat
              </h3>
              <span className="toggle-indicator">
                {expandedSection === 'denarii-advisor' ? '−' : '+'}
              </span>
            </div>

            {expandedSection === 'denarii-advisor' && (
              <div className="section-content">
                <div className="advisor-intro">
                  <p>
                    Ducati Advisor is your personal AI financial assistant available 24/7. Have a
                    conversation about any financial topic, get quick purchase advice, or explore
                    financial concepts in depth.
                  </p>
                </div>

                <div className="advisor-features">
                  <h4>Key Features</h4>
                  <div className="feature-grid">
                    <div className="feature-card">
                      <span className="feature-icon">🎙️</span>
                      <h5>Voice Conversations</h5>
                      <p>
                        Talk naturally with Ducati using voice chat for hands-free financial advice.
                      </p>
                    </div>
                    <div className="feature-card">
                      <span className="feature-icon">💡</span>
                      <h5>Instant Advice</h5>
                      <p>Get quick recommendations on purchases without filling out forms.</p>
                    </div>
                    <div className="feature-card">
                      <span className="feature-icon">📚</span>
                      <h5>Financial Education</h5>
                      <p>
                        Learn about investing, budgeting, and building wealth through conversation.
                      </p>
                    </div>
                    <div className="feature-card">
                      <span className="feature-icon">🔄</span>
                      <h5>Context Awareness</h5>
                      <p>
                        Ducati remembers your conversation history for more personalized advice.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="advisor-usage">
                  <h4>How to Use Ducati Advisor</h4>
                  <div className="step-by-step">
                    <div className="step">
                      <div className="step-number">Step 1</div>
                      <h4>Access the Advisor</h4>
                      <p>
                        Click on "Ducati Advisor" in the menu or navigation drawer to start
                        chatting.
                      </p>
                    </div>

                    <div className="step">
                      <div className="step-number">Step 2</div>
                      <h4>Choose Your Input Method</h4>
                      <p>
                        Type your questions or click the microphone button to start a voice
                        conversation.
                      </p>
                    </div>

                    <div className="step">
                      <div className="step-number">Step 3</div>
                      <h4>Ask Anything Financial</h4>
                      <p>Examples of what you can ask:</p>
                      <ul>
                        <li>"Should I buy a new laptop for $1,200?"</li>
                        <li>"How can I save more money each month?"</li>
                        <li>"What's the 50/30/20 budgeting rule?"</li>
                        <li>"Is it better to pay off debt or invest?"</li>
                      </ul>
                    </div>

                    <div className="step">
                      <div className="step-number">Step 4</div>
                      <h4>Get Personalized Guidance</h4>
                      <p>
                        Ducati will provide advice based on your financial profile and goals. For
                        detailed purchase analysis, it may suggest using the Purchase Analyzer tool.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="advisor-tips">
                  <h4>Pro Tips for Better Conversations</h4>
                  <ul>
                    <li>
                      <strong>Be specific:</strong> Include details like price, purpose, and
                      timeframe for better advice
                    </li>
                    <li>
                      <strong>Ask follow-ups:</strong> Dive deeper into topics that interest you
                    </li>
                    <li>
                      <strong>Use voice mode:</strong> Great for brainstorming or when you're on the
                      go
                    </li>
                    <li>
                      <strong>Review history:</strong> Your chat history is saved locally for
                      reference
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Understanding Results Section */}
          <div className="guide-section">
            <div
              className="section-header"
              onClick={() => toggleSection('understanding-results')}
              role="button"
              tabIndex="0"
              aria-expanded={expandedSection === 'understanding-results'}
            >
              <h3>
                <span className="section-number">3</span>
                <span className="section-icon">📊</span>
                Understanding Your Analysis Results
              </h3>
              <span className="toggle-indicator">
                {expandedSection === 'understanding-results' ? '−' : '+'}
              </span>
            </div>

            {expandedSection === 'understanding-results' && (
              <div className="section-content">
                <p>
                  After analyzing your purchase, Ducati provides comprehensive results including:
                </p>

                <div className="result-component">
                  <h4>1. Clear Decision</h4>
                  <div className="decision-examples">
                    <div className="decision-example buy">
                      <span className="decision-icon">✅</span>
                      <strong>Buy</strong> - This purchase aligns with your financial goals
                    </div>
                    <div className="decision-example dont-buy">
                      <span className="decision-icon">❌</span>
                      <strong>Don't Buy</strong> - Consider alternatives or wait
                    </div>
                  </div>
                </div>

                <div className="result-component">
                  <h4>2. Personalized Summary</h4>
                  <p>
                    A concise explanation of why you should or shouldn't make this purchase,
                    tailored to your specific financial situation.
                  </p>
                </div>

                <div className="result-component">
                  <h4>3. Decision Analysis Matrix</h4>
                  <p>
                    Click to expand a detailed breakdown showing scores across multiple criteria:
                  </p>
                  <ul>
                    <li>
                      <strong>💰 Financial Criteria:</strong> Affordability, value for money,
                      opportunity cost
                    </li>
                    <li>
                      <strong>🧠 Psychological Criteria:</strong> Emotional value, social factors,
                      buyer's remorse risk
                    </li>
                    <li>
                      <strong>⚠️ Risk Assessment:</strong> Financial risk, alternative availability
                    </li>
                    <li>
                      <strong>🔧 Utility Criteria:</strong> Necessity, frequency of use, longevity
                    </li>
                  </ul>
                </div>

                <div className="result-component">
                  <h4>4. Cheaper Alternatives</h4>
                  <p>
                    If available, Ducati will show you similar products at better prices, including
                    where to find them.
                  </p>
                </div>

                <div className="result-component">
                  <h4>5. Financial Wisdom Quote</h4>
                  <p>
                    Each analysis includes an inspiring quote to help reinforce good financial
                    habits.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Financial Profile Section */}
          <div className="guide-section">
            <div
              className="section-header"
              onClick={() => toggleSection('financial-profile')}
              role="button"
              tabIndex="0"
              aria-expanded={expandedSection === 'financial-profile'}
            >
              <h3>
                <span className="section-number">4</span>
                <span className="section-icon">👤</span>
                Your Financial Profile
              </h3>
              <span className="toggle-indicator">
                {expandedSection === 'financial-profile' ? '−' : '+'}
              </span>
            </div>

            {expandedSection === 'financial-profile' && (
              <div className="section-content">
                <div className="profile-importance">
                  <h4>Why Your Financial Profile Matters</h4>
                  <p>
                    Your financial profile is the foundation for personalized recommendations. By
                    understanding your income, expenses, savings, and goals, Ducati can:
                  </p>
                  <ul>
                    <li>📈 Assess how purchases impact your budget</li>
                    <li>🎯 Align recommendations with your financial goals</li>
                    <li>⚖️ Balance immediate needs with long-term wealth building</li>
                    <li>🛡️ Protect your emergency fund and financial stability</li>
                  </ul>
                </div>

                <div className="profile-setup">
                  <h4>Quick Setup Process</h4>
                  <p>Setting up your profile takes just 2 minutes:</p>
                  <ol>
                    <li>
                      <strong>Monthly Income:</strong> Your take-home pay after taxes
                    </li>
                    <li>
                      <strong>Monthly Expenses:</strong> Total regular spending
                    </li>
                    <li>
                      <strong>Savings:</strong> Current amount in savings accounts
                    </li>
                    <li>
                      <strong>Emergency Fund:</strong> Whether you have 3+ months of expenses saved
                    </li>
                    <li>
                      <strong>Debt Payments:</strong> Monthly obligations (optional)
                    </li>
                    <li>
                      <strong>Financial Goal:</strong> What you're working towards
                    </li>
                  </ol>

                  <Link to="/profile" className="profile-setup-btn">
                    Set Up Your Profile Now
                  </Link>
                </div>

                <div className="profile-privacy">
                  <h4>🔒 Your Privacy</h4>
                  <p>
                    All financial data is stored locally on your device and never shared. You can
                    update or reset your information at any time.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Pro Mode Section */}
          <div className="guide-section">
            <div
              className="section-header"
              onClick={() => toggleSection('pro-mode')}
              role="button"
              tabIndex="0"
              aria-expanded={expandedSection === 'pro-mode'}
            >
              <h3>
                <span className="section-number">5</span>
                <span className="section-icon">💎</span>
                Pro Mode for High-Value Purchases
              </h3>
              <span className="toggle-indicator">{expandedSection === 'pro-mode' ? '−' : '+'}</span>
            </div>

            {expandedSection === 'pro-mode' && (
              <div className="section-content">
                <div className="pro-mode-info">
                  <h4>What is Pro Mode?</h4>
                  <p>
                    Pro Mode is an advanced analysis feature that automatically becomes available
                    for high-value purchases (typically $300+). It provides:
                  </p>
                  <ul>
                    <li>🔍 Deep-dive market analysis with web search</li>
                    <li>📊 Current pricing trends and market conditions</li>
                    <li>💡 Personalized questions to understand your specific needs</li>
                    <li>🎯 Confidence scoring for your purchase decision</li>
                    <li>📈 Expert recommendations based on real-time data</li>
                  </ul>
                </div>

                <div className="pro-mode-when">
                  <h4>When to Use Pro Mode</h4>
                  <p>Pro Mode is perfect for:</p>
                  <ul>
                    <li>Major electronics or appliances</li>
                    <li>Furniture and home improvements</li>
                    <li>Professional equipment or tools</li>
                    <li>Any purchase representing a significant portion of your income</li>
                  </ul>
                </div>

                <div className="pro-mode-process">
                  <h4>How It Works</h4>
                  <ol>
                    <li>Complete the standard purchase analysis</li>
                    <li>If eligible, you'll see a "Pro Mode" button in the results</li>
                    <li>Answer 3 tailored questions about your specific needs</li>
                    <li>Receive comprehensive analysis with market insights</li>
                    <li>Get actionable recommendations with confidence scoring</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Tips Section */}
          <div className="guide-section">
            <div
              className="section-header"
              onClick={() => toggleSection('tips')}
              role="button"
              tabIndex="0"
              aria-expanded={expandedSection === 'tips'}
            >
              <h3>
                <span className="section-number">6</span>
                <span className="section-icon">💡</span>
                Tips for Best Results
              </h3>
              <span className="toggle-indicator">{expandedSection === 'tips' ? '−' : '+'}</span>
            </div>

            {expandedSection === 'tips' && (
              <div className="section-content">
                <div className="tips-grid">
                  <div className="tip-card">
                    <span className="tip-icon">🎯</span>
                    <h4>Be Specific</h4>
                    <p>
                      Include brand names and model numbers when possible for more accurate
                      alternatives.
                    </p>
                  </div>

                  <div className="tip-card">
                    <span className="tip-icon">📸</span>
                    <h4>Use Photos</h4>
                    <p>
                      Upload clear product images to help AI identify items and find better matches.
                    </p>
                  </div>

                  <div className="tip-card">
                    <span className="tip-icon">🔄</span>
                    <h4>Keep Profile Updated</h4>
                    <p>
                      Update your financial profile monthly for the most accurate recommendations.
                    </p>
                  </div>

                  <div className="tip-card">
                    <span className="tip-icon">📊</span>
                    <h4>Review the Matrix</h4>
                    <p>
                      Always expand the Decision Matrix to understand the full reasoning behind
                      recommendations.
                    </p>
                  </div>

                  <div className="tip-card">
                    <span className="tip-icon">🎁</span>
                    <h4>Consider Timing</h4>
                    <p>
                      For non-urgent purchases, check if there are upcoming sales or new models
                      releasing soon.
                    </p>
                  </div>

                  <div className="tip-card">
                    <span className="tip-icon">💰</span>
                    <h4>Track Your Savings</h4>
                    <p>
                      Click "million" in the tagline to see your savings tracker and path to
                      financial freedom.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Start CTA */}
        <div className="guide-cta">
          <h3>Ready to Make Smarter Financial Decisions?</h3>
          <p>Start with a quick chat or analyze your next purchase with confidence.</p>
          <div className="cta-buttons">
            <Link to="/chat" className="cta-button primary">
              <span className="btn-icon">💬</span>
              Chat with Ducati
            </Link>
            <Link to="/" className="cta-button secondary">
              <span className="btn-icon">🛒</span>
              Analyze a Purchase
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
