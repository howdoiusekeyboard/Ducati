import React, { useState } from 'react';
import '../styles/FinanceFeed.css';

const FinanceFeed = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Updated with working YouTube video IDs for personal finance content
  const financeVideos = [
    {
      id: 'UcAY6qRHlw0',
      title: 'Basics of Personal Finance',
      channel: 'Finance Tips',
    },
    {
      id: 'HQzoZfc3GwQ',
      title: 'Budget Basics',
      channel: 'Money Smart',
    },
    {
      id: '4j2emMn7UaI',
      title: 'Investing 101',
      channel: 'Invest Smart',
    },
    {
      id: '0uYnj1i1EQw',
      title: 'How to Save Money',
      channel: 'Savings Guide',
    },
    {
      id: 'Q5jlY8_WmEE',
      title: 'Tackling Debt',
      channel: 'Credit Help',
    },
  ];

  const handleNextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % financeVideos.length);
  };

  const handlePrevVideo = () => {
    setCurrentVideoIndex((prev) => (prev === 0 ? financeVideos.length - 1 : prev - 1));
  };

  const handleVideoSelect = (index) => {
    setCurrentVideoIndex(index);
  };

  return (
    <div className="App">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">Finance Feed</h1>
        <p className="hero-subtitle">Quick financial tips and insights to boost your money IQ</p>
      </div>

      <div className="finance-feed-container">
        {/* Main Content Area */}
        <div className="feed-content">
          {/* Video Player Section */}
          <div className="video-section-wrapper">
            <div className="video-player-container">
              <div className="video-player-section">
                <div className="video-wrapper">
                  <iframe
                    src={`https://www.youtube.com/embed/${financeVideos[currentVideoIndex].id}?rel=0&modestbranding=1&autoplay=0`}
                    title={financeVideos[currentVideoIndex].title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="youtube-player"
                  />
                </div>

                <div className="video-controls">
                  <button
                    onClick={handlePrevVideo}
                    className="control-button prev"
                    aria-label="Previous video"
                  >
                    <span className="control-icon">◀</span>
                    <span className="control-text">Previous</span>
                  </button>

                  <div className="video-info">
                    <h3>{financeVideos[currentVideoIndex].title}</h3>
                    <p className="video-channel">{financeVideos[currentVideoIndex].channel}</p>
                    <p className="video-counter">
                      {currentVideoIndex + 1} of {financeVideos.length}
                    </p>
                  </div>

                  <button
                    onClick={handleNextVideo}
                    className="control-button next"
                    aria-label="Next video"
                  >
                    <span className="control-text">Next</span>
                    <span className="control-icon">▶</span>
                  </button>
                </div>
              </div>

              {/* Playlist Sidebar for Desktop */}
              <div className="playlist-sidebar">
                <h3>Up Next</h3>
                <div className="sidebar-playlist">
                  {financeVideos.map((video, index) => (
                    <div
                      key={video.id}
                      className={`sidebar-item ${index === currentVideoIndex ? 'active' : ''}`}
                      onClick={() => handleVideoSelect(index)}
                      role="button"
                      tabIndex="0"
                    >
                      <div className="sidebar-thumbnail">
                        <img
                          src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                          alt={video.title}
                          onError={(e) => {
                            e.target.src = `https://img.youtube.com/vi/${video.id}/default.jpg`;
                          }}
                        />
                        {index === currentVideoIndex && (
                          <div className="now-playing">
                            <span>▶ Now Playing</span>
                          </div>
                        )}
                      </div>
                      <div className="sidebar-info">
                        <h4>{video.title}</h4>
                        <p>{video.channel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Video Playlist Grid - Mobile Only */}
          <div className="playlist-section mobile-only">
            <h2>Quick Finance Tips</h2>
            <div className="playlist-grid">
              {financeVideos.map((video, index) => (
                <div
                  key={video.id}
                  className={`playlist-item ${index === currentVideoIndex ? 'active' : ''}`}
                  onClick={() => handleVideoSelect(index)}
                  role="button"
                  tabIndex="0"
                >
                  <div className="playlist-thumbnail">
                    <img
                      src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                      alt={video.title}
                      onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${video.id}/default.jpg`;
                      }}
                    />
                    {index === currentVideoIndex ? (
                      <div className="play-overlay active">
                        <span className="play-icon">▶</span>
                        <span className="play-text">Now Playing</span>
                      </div>
                    ) : (
                      <div className="play-overlay">
                        <span className="play-icon">▶</span>
                      </div>
                    )}
                  </div>
                  <div className="playlist-info">
                    <h4>{video.title}</h4>
                    <p className="video-channel-small">{video.channel}</p>
                    <p className="video-type">Short</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Educational Content */}
          <div className="educational-section">
            <h2>Why Financial Education Matters</h2>
            <div className="education-grid">
              <div className="education-card">
                <span className="education-icon">🎓</span>
                <h3>Build Knowledge</h3>
                <p>Learn key financial concepts in bite-sized, easy-to-understand videos.</p>
              </div>

              <div className="education-card">
                <span className="education-icon">💡</span>
                <h3>Make Better Decisions</h3>
                <p>Apply what you learn directly to your daily financial choices.</p>
              </div>

              <div className="education-card">
                <span className="education-icon">🚀</span>
                <h3>Accelerate Growth</h3>
                <p>Small improvements compound into significant wealth over time.</p>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="tips-section">
            <h2>Quick Finance Tips</h2>
            <div className="tips-list">
              <div className="tip-item">
                <span className="tip-number">1</span>
                <div className="tip-content">
                  <h4>Pay Yourself First</h4>
                  <p>Save at least 10% of your income before any other expenses.</p>
                </div>
              </div>

              <div className="tip-item">
                <span className="tip-number">2</span>
                <div className="tip-content">
                  <h4>Track Your Spending</h4>
                  <p>You can't manage what you don't measure. Use Ducati to analyze purchases!</p>
                </div>
              </div>

              <div className="tip-item">
                <span className="tip-number">3</span>
                <div className="tip-content">
                  <h4>Avoid Impulse Buys</h4>
                  <p>Wait 24 hours before making non-essential purchases.</p>
                </div>
              </div>

              <div className="tip-item">
                <span className="tip-number">4</span>
                <div className="tip-content">
                  <h4>Invest Early</h4>
                  <p>Time in the market beats timing the market. Start investing today.</p>
                </div>
              </div>

              <div className="tip-item">
                <span className="tip-number">5</span>
                <div className="tip-content">
                  <h4>Build Emergency Fund</h4>
                  <p>Aim for 3-6 months of expenses saved for unexpected situations.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="feed-cta">
            <h3>Ready to Put Knowledge into Action?</h3>
            <p>Use Ducati's Purchase Advisor to make smarter financial decisions today.</p>
            <a href="/" className="cta-button">
              <span className="btn-icon">🛒</span>
              Analyze a Purchase
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceFeed;
