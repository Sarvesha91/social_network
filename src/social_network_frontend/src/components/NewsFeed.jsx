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
        image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop&crop=center"
      },
      {
        id: 2,
        title: "Internet Identity Reaches 1M Users",
        summary: "ICP's authentication system hits major milestone",
        category: "Blockchain",
        time: "4 hours ago",
        image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=300&h=200&fit=crop&crop=center"
      },
      {
        id: 3,
        title: "Social Media Privacy Revolution",
        summary: "Users demand more control over their data",
        category: "Privacy",
        time: "6 hours ago",
        image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=300&h=200&fit=crop&crop=center"
      }
    ],
    technology: [
      {
        id: 4,
        title: "AI Integration in Social Platforms",
        summary: "Machine learning transforms user experience",
        category: "AI",
        time: "1 hour ago",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=200&fit=crop&crop=center"
      },
      {
        id: 5,
        title: "Web3 Development Tools Update",
        summary: "New frameworks make dApp development easier",
        category: "Development",
        time: "3 hours ago",
        image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=200&fit=crop&crop=center"
      }
    ],
    blockchain: [
      {
        id: 6,
        title: "ICP Network Upgrade Complete",
        summary: "Enhanced performance and new features",
        category: "ICP",
        time: "30 minutes ago",
        image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=300&h=200&fit=crop&crop=center"
      },
      {
        id: 7,
        title: "DeFi Integration with Social Media",
        summary: "New possibilities for creator monetization",
        category: "DeFi",
        time: "2 hours ago",
        image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=300&h=200&fit=crop&crop=center"
      }
    ]
  };

  const categories = [
    {
      id: 'trending',
      name: 'Trending',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M13.5 2c-5.621 0-10.211 4.443-10.475 10H0l3.5 4 3.5-4H4.525c.238-4.358 3.892-7.818 8.475-7.818 4.687 0 8.5 3.813 8.5 8.5 0 4.687-3.813 8.5-8.5 8.5-2.975 0-5.628-1.534-7.158-4.086l-1.558 1.558C6.482 20.888 9.69 22.5 13.5 22.5c5.799 0 10.5-4.701 10.5-10.5S19.299 2 13.5 2z" />
        </svg>
      )
    },
    {
      id: 'technology',
      name: 'Technology',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z" />
        </svg>
      )
    },
    {
      id: 'blockchain',
      name: 'Blockchain',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M6 2l3 3-3 3-3-3 3-3zm6 6l3 3-3 3-3-3 3-3zm6-6l3 3-3 3-3-3 3-3zM6 14l3 3-3 3-3-3 3-3zm12 0l3 3-3 3-3-3 3-3z" />
        </svg>
      )
    },
    {
      id: 'social',
      name: 'Social',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-.83.67-1.5 1.5-1.5S12 9.67 12 10.5V18h2v-4h3v4h2V10.5c0-1.93-1.57-3.5-3.5-3.5S12 8.57 12 10.5V18H4z" />
        </svg>
      )
    }
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
                  <img
                    src={article.image}
                    alt={article.title}
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to a gradient background if image fails
                      e.target.style.display = 'none';
                      e.target.parentNode.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                      e.target.parentNode.style.display = 'flex';
                      e.target.parentNode.style.alignItems = 'center';
                      e.target.parentNode.style.justifyContent = 'center';
                      e.target.parentNode.style.color = 'white';
                      e.target.parentNode.style.fontSize = '2rem';
                      if (!e.target.parentNode.querySelector('.fallback-icon')) {
                        const icon = document.createElement('div');
                        icon.className = 'fallback-icon';
                        icon.textContent = '📰';
                        e.target.parentNode.appendChild(icon);
                      }
                    }}
                  />
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
