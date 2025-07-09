import { useState, useEffect } from 'react';

function NewsFeed({ userInterests = [] }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('trending');

  // Mock news data based on user interests
  const mockNews = {
    trending: [
      {
        id: 1,
        title: "Decentralized Social Networks Gain Momentum",
        summary: "Web3 social platforms see 300% growth in user adoption",
        category: "Technology",
        time: "2 hours ago",
        image: "https://via.placeholder.com/150x100/667eea/ffffff?text=Tech+News"
      },
      {
        id: 2,
        title: "Internet Identity Reaches 1M Users",
        summary: "ICP's authentication system hits major milestone",
        category: "Blockchain",
        time: "4 hours ago",
        image: "https://via.placeholder.com/150x100/764ba2/ffffff?text=Blockchain"
      },
      {
        id: 3,
        title: "Social Media Privacy Revolution",
        summary: "Users demand more control over their data",
        category: "Privacy",
        time: "6 hours ago",
        image: "https://via.placeholder.com/150x100/f093fb/ffffff?text=Privacy"
      }
    ],
    technology: [
      {
        id: 4,
        title: "AI Integration in Social Platforms",
        summary: "Machine learning transforms user experience",
        category: "AI",
        time: "1 hour ago",
        image: "https://via.placeholder.com/150x100/667eea/ffffff?text=AI+News"
      },
      {
        id: 5,
        title: "Web3 Development Tools Update",
        summary: "New frameworks make dApp development easier",
        category: "Development",
        time: "3 hours ago",
        image: "https://via.placeholder.com/150x100/764ba2/ffffff?text=Dev+Tools"
      }
    ],
    blockchain: [
      {
        id: 6,
        title: "ICP Network Upgrade Complete",
        summary: "Enhanced performance and new features",
        category: "ICP",
        time: "30 minutes ago",
        image: "https://via.placeholder.com/150x100/667eea/ffffff?text=ICP+Update"
      },
      {
        id: 7,
        title: "DeFi Integration with Social Media",
        summary: "New possibilities for creator monetization",
        category: "DeFi",
        time: "2 hours ago",
        image: "https://via.placeholder.com/150x100/f093fb/ffffff?text=DeFi"
      }
    ]
  };

  const categories = [
    { id: 'trending', name: '🔥 Trending', icon: '📈' },
    { id: 'technology', name: '💻 Technology', icon: '⚡' },
    { id: 'blockchain', name: '⛓️ Blockchain', icon: '🚀' },
    { id: 'social', name: '👥 Social', icon: '💬' }
  ];

  useEffect(() => {
    // Simulate loading news with real-time updates
    setLoading(true);

    // Add timestamps to make articles feel fresh
    const updateNewsWithTimestamps = (newsArray) => {
      return newsArray.map(article => ({
        ...article,
        time: getRandomRecentTime(),
        url: getArticleUrl(article.category, article.title)
      }));
    };

    setTimeout(() => {
      const updatedNews = updateNewsWithTimestamps(mockNews[selectedCategory] || mockNews.trending);
      setNews(updatedNews);
      setLoading(false);
    }, 500);

    // Auto-refresh news every 5 minutes
    const interval = setInterval(() => {
      const updatedNews = updateNewsWithTimestamps(mockNews[selectedCategory] || mockNews.trending);
      setNews(updatedNews);
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [selectedCategory]);

  const getRandomRecentTime = () => {
    const times = [
      'Just now', '2 minutes ago', '15 minutes ago', '1 hour ago',
      '2 hours ago', '3 hours ago', '5 hours ago', '1 day ago'
    ];
    return times[Math.floor(Math.random() * times.length)];
  };

  const getArticleUrl = (category, title) => {
    // Generate realistic URLs based on category
    const baseUrls = {
      'Technology': 'https://techcrunch.com',
      'Blockchain': 'https://coindesk.com',
      'AI': 'https://venturebeat.com',
      'ICP': 'https://internetcomputer.org/news',
      'DeFi': 'https://defipulse.com',
      'Privacy': 'https://www.eff.org',
      'Development': 'https://dev.to'
    };

    const baseUrl = baseUrls[category] || 'https://news.ycombinator.com';
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${baseUrl}/${slug}`;
  };

  const getPersonalizedNews = () => {
    // Simple personalization based on user interests (hashtags)
    if (userInterests.length === 0) return mockNews.trending;

    let personalizedNews = [];
    userInterests.forEach(interest => {
      const category = interest.toLowerCase();
      if (mockNews[category]) {
        personalizedNews = [...personalizedNews, ...mockNews[category]];
      }
    });

    return personalizedNews.length > 0 ? personalizedNews : mockNews.trending;
  };

  const handleArticleClick = (article) => {
    // Open article in new tab
    if (article.url && article.url !== '#') {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback to a search for the article title
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(article.title)}`;
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="news-feed">
      <div className="news-header">
        <h3>📰 Latest News</h3>
        <p className="news-subtitle">Stay updated with trending topics</p>
      </div>

      <div className="news-categories">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </button>
        ))}
      </div>

      <div className="news-content">
        {loading ? (
          <div className="news-loading">
            <div className="loading-spinner"></div>
            <p>Loading news...</p>
          </div>
        ) : (
          <div className="news-list">
            {news.map(article => (
              <div key={article.id} className="news-item" onClick={() => handleArticleClick(article)}>
                <div className="news-image">
                  <img src={article.image} alt={article.title} />
                  <div className="news-category">{article.category}</div>
                </div>
                <div className="news-content-area">
                  <h4 className="news-title">{article.title}</h4>
                  <p className="news-summary">{article.summary}</p>
                  <div className="news-meta">
                    <span className="news-time">🕒 {article.time}</span>
                    <button
                      className="read-more-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArticleClick(article);
                      }}
                    >
                      📖 Read More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="news-footer">
        <button className="view-all-btn">
          📖 View All News
        </button>
      </div>
    </div>
  );
}

export default NewsFeed;
