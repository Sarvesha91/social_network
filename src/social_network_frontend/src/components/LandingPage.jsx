import { useEffect } from 'react';

function LandingPage({ onLogin, onSignup, authError }) {

  useEffect(() => {
    const cards = document.querySelectorAll('.feature-flash-card');
    const indicators = document.querySelectorAll('.indicator');
    let currentIndex = 0;

    const rotateCards = () => {
      // Remove active class from all cards and indicators
      cards.forEach(card => card.classList.remove('active'));
      indicators.forEach(indicator => indicator.classList.remove('active'));

      // Add active class to current card and indicator
      if (cards[currentIndex]) {
        cards[currentIndex].classList.add('active');
      }
      if (indicators[currentIndex]) {
        indicators[currentIndex].classList.add('active');
      }

      // Move to next card
      currentIndex = (currentIndex + 1) % cards.length;
    };

    // Start the rotation
    const interval = setInterval(rotateCards, 4000); // Change every 4 seconds

    // Add click handlers for indicators
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        currentIndex = index;
        rotateCards();
        // Reset the interval
        clearInterval(interval);
        const newInterval = setInterval(rotateCards, 4000);
        return () => clearInterval(newInterval);
      });
    });

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <span className="logo-text">Social Net</span>
          </div>
          <div className="nav-actions">
            <button className="nav-btn secondary" onClick={onLogin}>
              Sign In
            </button>
            <button className="nav-btn primary" onClick={onSignup}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>✨ Decentralized Social Network</span>
            </div>
            <h1 className="hero-title">
              Connect, Share, and
              <span className="gradient-text"> Discover</span>
            </h1>
            <p className="hero-subtitle">
              Experience the future of social media with complete privacy,
              true ownership of your data, and meaningful connections.
            </p>
            <div className="hero-cta">
              <button className="cta-btn primary" onClick={onSignup}>
                <span>Join Social Net</span>
                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </button>
              <button className="cta-btn secondary" onClick={onLogin}>
                <span>Sign In</span>
              </button>
            </div>

          </div>
          <div className="hero-visual">
            <div className="subtle-particles">
              <div className="particle particle-1"></div>
              <div className="particle particle-2"></div>
              <div className="particle particle-3"></div>
              <div className="particle particle-4"></div>
              <div className="particle particle-5"></div>
            </div>
            <div className="floating-cards">
              <div className="card card-1">
                <div className="card-avatar"></div>
                <div className="card-content">
                  <div className="card-line"></div>
                  <div className="card-line short"></div>
                </div>
              </div>
              <div className="card card-2">
                <div className="card-avatar"></div>
                <div className="card-content">
                  <div className="card-line"></div>
                  <div className="card-line short"></div>
                </div>
              </div>
              <div className="card card-3">
                <div className="card-avatar"></div>
                <div className="card-content">
                  <div className="card-line"></div>
                  <div className="card-line short"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-background">
          <div className="bg-orb orb-1"></div>
          <div className="bg-orb orb-2"></div>
          <div className="bg-orb orb-3"></div>
        </div>
        <div className="features-container">
          <div className="section-header">
            <h2>Why Choose Social Net?</h2>
            <p>Experience social media the way it should be</p>
          </div>
          <div className="rotating-feature-showcase">
            <div className="feature-flash-card active" data-feature="0">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C14.8,12.6 13.9,13.5 12.8,13.5H11.2C10.1,13.5 9.2,12.6 9.2,11.5V10C9.2,8.6 10.6,7 12,7Z" />
                </svg>
              </div>
              <h3>Complete Privacy</h3>
              <p>Your data belongs to you. No tracking, no ads, no surveillance. Built on blockchain for ultimate security.</p>
            </div>
            <div className="feature-flash-card" data-feature="1">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                </svg>
              </div>
              <h3>True Ownership</h3>
              <p>Own your content, your connections, your digital identity. No platform can take it away from you.</p>
            </div>
            <div className="feature-flash-card" data-feature="2">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6H16Z" />
                </svg>
              </div>
              <h3>Lightning Fast</h3>
              <p>Built on Internet Computer for instant interactions. No waiting, no lag, just seamless social experiences.</p>
            </div>
            <div className="feature-flash-card" data-feature="3">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" />
                </svg>
              </div>
              <h3>Community Driven</h3>
              <p>Built by the community, for the community. Your voice matters in shaping the future of social media.</p>
            </div>
            <div className="feature-indicators">
              <div className="indicator active" data-index="0"></div>
              <div className="indicator" data-index="1"></div>
              <div className="indicator" data-index="2"></div>
              <div className="indicator" data-index="3"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2>Ready to Join the Revolution?</h2>
            <p>Be part of the next generation of social media. Connect, share, and discover in a truly decentralized world.</p>
            <div className="cta-buttons">
              <button className="cta-btn primary large" onClick={onSignup}>
                <span>Get Started Now</span>
                <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </button>
              <button className="cta-btn secondary large" onClick={onLogin}>
                <span>Sign In</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Error Display */}
      {authError && (
        <div className="error-overlay">
          <div className="error-card">
            <div className="error-icon">⚠️</div>
            <h3>Authentication Error</h3>
            <p>{authError}</p>
            <button
              className="error-btn"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <span>Social Net</span>
            </div>
            <p>The future of social media is decentralized</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
