import { useState, useEffect } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';
import EmojiPicker from './EmojiPicker';

function PostList({ currentUser, isAuthenticated, refreshTrigger, onPostSelect, onUserSelect, backendActor }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState({});
  const [userLikedPosts, setUserLikedPosts] = useState(new Set());
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all', 'following', 'trending'
  const [imageModal, setImageModal] = useState({ isOpen: false, images: [], currentIndex: 0 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPostId, setEmojiPickerPostId] = useState(null);

  useEffect(() => {
    fetchPosts();
    fetchUsers();
    if (isAuthenticated && currentUser) {
      fetchUserLikes();
    }
  }, [refreshTrigger, isAuthenticated, currentUser, viewMode]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        fetchPosts();
      }
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let result;
      const actor = backendActor || social_network_backend;

      switch (viewMode) {
        case 'following':
          result = await actor.get_user_feed();
          break;
        case 'trending':
          result = await actor.get_trending_posts();
          break;
        default:
          result = await actor.get_all_posts();
      }

      // Convert BigInt values to regular numbers for display
      const processedPosts = result.map(post => ({
        ...post,
        post_id: Number(post.post_id),
        likes: Number(post.likes),
        comments_count: Number(post.comments_count),
        shares_count: Number(post.shares_count),
        created_at: Number(post.created_at),
        updated_at: post.updated_at ? Number(post.updated_at) : null
      }));

      setPosts(processedPosts);
      setError('');
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const actor = backendActor || social_network_backend;
      const result = await actor.search_posts(searchQuery);

      // Convert BigInt values to regular numbers for display
      const processedPosts = result.map(post => ({
        ...post,
        post_id: Number(post.post_id),
        likes: Number(post.likes),
        comments_count: Number(post.comments_count),
        shares_count: Number(post.shares_count),
        created_at: Number(post.created_at),
        updated_at: post.updated_at ? Number(post.updated_at) : null
      }));

      setPosts(processedPosts);
      setError('');
    } catch (err) {
      console.error('Error searching posts:', err);
      setError('Failed to search posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const actor = backendActor || social_network_backend;
      const result = await actor.get_all_users();
      const userMap = {};
      result.forEach(user => {
        userMap[user.user_id.toString()] = user;
      });
      setUsers(userMap);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchUserLikes = async () => {
    try {
      console.log('🔄 LIKES: Fetching user likes...');
      const actor = backendActor || social_network_backend;
      const likedPostIds = await actor.get_user_liked_posts();
      console.log('🔄 LIKES: Raw liked post IDs:', likedPostIds);

      // Handle BigInt conversion properly
      const processedIds = [];

      // Check if likedPostIds is a typed array (BigUint64Array)
      if (likedPostIds && typeof likedPostIds === 'object' && likedPostIds.constructor && likedPostIds.constructor.name === 'BigUint64Array') {
        // Convert BigUint64Array to regular array
        for (let i = 0; i < likedPostIds.length; i++) {
          processedIds.push(Number(likedPostIds[i]));
        }
      } else if (Array.isArray(likedPostIds)) {
        // Handle regular array
        likedPostIds.forEach(id => {
          if (typeof id === 'bigint') {
            processedIds.push(Number(id));
          } else if (typeof id === 'object' && id !== null) {
            // Handle case where id might be wrapped in an object
            processedIds.push(Number(id.toString()));
          } else {
            processedIds.push(Number(id));
          }
        });
      } else if (likedPostIds) {
        // Handle single value
        if (typeof likedPostIds === 'bigint') {
          processedIds.push(Number(likedPostIds));
        } else {
          processedIds.push(Number(likedPostIds));
        }
      }

      console.log('🔄 LIKES: Processed liked post IDs:', processedIds);
      setUserLikedPosts(new Set(processedIds));

      // Store in localStorage for persistence
      localStorage.setItem('userLikedPosts', JSON.stringify(processedIds));
    } catch (err) {
      console.error('Error fetching user likes:', err);

      // Fallback to localStorage if backend fails
      try {
        const stored = localStorage.getItem('userLikedPosts');
        if (stored) {
          const storedIds = JSON.parse(stored);
          console.log('🔄 LIKES: Using stored likes:', storedIds);
          setUserLikedPosts(new Set(storedIds));
        }
      } catch (storageErr) {
        console.error('Error loading stored likes:', storageErr);
      }
    }
  };

  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      alert('Please login to like posts');
      return;
    }

    const numPostId = Number(postId);
    console.log('❤️ LIKE: Attempting to like post:', numPostId);

    // Immediate optimistic update
    const newLikedPosts = new Set([...userLikedPosts, numPostId]);
    setUserLikedPosts(newLikedPosts);
    setPosts(prev => prev.map(post =>
      post.post_id === numPostId
        ? { ...post, likes: post.likes + 1 }
        : post
    ));

    // Update localStorage immediately
    localStorage.setItem('userLikedPosts', JSON.stringify([...newLikedPosts]));

    try {
      const actor = backendActor || social_network_backend;
      const bigIntPostId = BigInt(postId);
      const result = await actor.like_post(bigIntPostId);
      console.log('❤️ LIKE: Backend result:', result);

      if (!result.includes('successfully')) {
        // Revert on failure
        const revertedLikedPosts = new Set(userLikedPosts);
        revertedLikedPosts.delete(numPostId);
        setUserLikedPosts(revertedLikedPosts);
        setPosts(prev => prev.map(post =>
          post.post_id === numPostId
            ? { ...post, likes: Math.max(0, post.likes - 1) }
            : post
        ));
        localStorage.setItem('userLikedPosts', JSON.stringify([...revertedLikedPosts]));
        alert(result);
      } else {
        console.log('❤️ LIKE: Successfully liked post:', numPostId);
        // Refresh user likes to ensure sync
        setTimeout(() => fetchUserLikes(), 1000);
      }
    } catch (err) {
      console.error('❤️ LIKE: Error liking post:', err);
      // Revert on error
      const revertedLikedPosts = new Set(userLikedPosts);
      revertedLikedPosts.delete(numPostId);
      setUserLikedPosts(revertedLikedPosts);
      setPosts(prev => prev.map(post =>
        post.post_id === numPostId
          ? { ...post, likes: Math.max(0, post.likes - 1) }
          : post
      ));
      localStorage.setItem('userLikedPosts', JSON.stringify([...revertedLikedPosts]));
      alert('Failed to like post');
    }
  };

  const handleUnlike = async (postId) => {
    if (!isAuthenticated) {
      alert('Please login to unlike posts');
      return;
    }

    const numPostId = Number(postId);
    console.log('💔 UNLIKE: Attempting to unlike post:', numPostId);

    // Immediate optimistic update
    const newLikedPosts = new Set(userLikedPosts);
    newLikedPosts.delete(numPostId);
    setUserLikedPosts(newLikedPosts);
    setPosts(prev => prev.map(post =>
      post.post_id === numPostId
        ? { ...post, likes: Math.max(0, post.likes - 1) }
        : post
    ));

    // Update localStorage immediately
    localStorage.setItem('userLikedPosts', JSON.stringify([...newLikedPosts]));

    try {
      const actor = backendActor || social_network_backend;
      const bigIntPostId = BigInt(postId);
      const result = await actor.unlike_post(bigIntPostId);
      console.log('💔 UNLIKE: Backend result:', result);

      if (!result.includes('successfully')) {
        // Revert on failure
        const revertedLikedPosts = new Set([...userLikedPosts, numPostId]);
        setUserLikedPosts(revertedLikedPosts);
        setPosts(prev => prev.map(post =>
          post.post_id === numPostId
            ? { ...post, likes: post.likes + 1 }
            : post
        ));
        localStorage.setItem('userLikedPosts', JSON.stringify([...revertedLikedPosts]));
        alert(result);
      } else {
        console.log('💔 UNLIKE: Successfully unliked post:', numPostId);
        // Refresh user likes to ensure sync
        setTimeout(() => fetchUserLikes(), 1000);
      }
    } catch (err) {
      console.error('💔 UNLIKE: Error unliking post:', err);
      // Revert on error
      const revertedLikedPosts = new Set([...userLikedPosts, numPostId]);
      setUserLikedPosts(revertedLikedPosts);
      setPosts(prev => prev.map(post =>
        post.post_id === numPostId
          ? { ...post, likes: post.likes + 1 }
          : post
      ));
      localStorage.setItem('userLikedPosts', JSON.stringify([...revertedLikedPosts]));
      alert('Failed to unlike post');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const actor = backendActor || social_network_backend;
      const result = await actor.delete_post(postId);
      if (result.includes('successfully')) {
        fetchPosts(); // Refresh posts
      } else {
        alert(result);
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post');
    }
  };

  const handleShare = async (postId) => {
    if (!isAuthenticated) {
      alert('Please login to share posts');
      return;
    }

    try {
      const actor = backendActor || social_network_backend;
      // Convert postId to BigInt for backend call
      const bigIntPostId = BigInt(postId);
      const result = await actor.share_post(bigIntPostId);
      if (result.includes('successfully')) {
        fetchPosts(); // Refresh posts to show updated share count
        alert('Post shared successfully! Share count updated.');
      } else {
        alert(result);
      }
    } catch (err) {
      console.error('Error sharing post:', err);
      alert('Failed to share post');
    }
  };

  const toggleComments = async (postId) => {
    if (!showComments[postId]) {
      // Load comments for this post
      try {
        const actor = backendActor || social_network_backend;
        const bigIntPostId = BigInt(postId);
        const result = await actor.get_post_comments(bigIntPostId);
        setComments(prev => ({ ...prev, [postId]: result }));
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    }
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleAddComment = async (postId) => {
    const content = newComment[postId];
    if (!content || !content.trim()) return;

    try {
      const actor = backendActor || social_network_backend;
      const bigIntPostId = BigInt(postId);
      const result = await actor.create_comment(bigIntPostId, content.trim());
      if ('Ok' in result) {
        setNewComment(prev => ({ ...prev, [postId]: '' }));
        // Refresh comments for this post
        const updatedComments = await actor.get_post_comments(bigIntPostId);
        setComments(prev => ({ ...prev, [postId]: updatedComments }));
        fetchPosts(); // Refresh to update comment count
      } else {
        alert(result.Err);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    }
  };

  const handleEmojiSelect = (emoji) => {
    if (emojiPickerPostId) {
      const currentValue = newComment[emojiPickerPostId] || '';
      setNewComment(prev => ({
        ...prev,
        [emojiPickerPostId]: currentValue + emoji
      }));
    }
  };

  // Image modal functions
  const openImageModal = (images, startIndex = 0) => {
    setImageModal({
      isOpen: true,
      images: images,
      currentIndex: startIndex
    });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, images: [], currentIndex: 0 });
  };

  const nextImage = () => {
    setImageModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  };

  const prevImage = () => {
    setImageModal(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1
    }));
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(Number(timestamp) / 1_000_000); // Convert nanoseconds to milliseconds
    return date.toLocaleString();
  };

  const canEditPost = (post) => {
    const canEdit = isAuthenticated && currentUser &&
      post.author_id.toString() === currentUser.toString();

    // Debug logging
    console.log('Can edit post check:', {
      postId: post.post_id,
      postAuthor: post.author_id.toString(),
      currentUser: currentUser?.toString(),
      isAuthenticated,
      canEdit
    });

    return canEdit;
  };

  const handleUserClick = (user) => {
    if (onUserSelect && user) {
      console.log('👤 POST_LIST: User clicked:', user.username);
      onUserSelect(user);
    }
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="post-list">
      <div className="post-list-header">
        <div className="header-top">
          <h2>
            <svg className="posts-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H21V21H3V3Z" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M7 7H17M7 11H17M7 15H13" stroke="currentColor" strokeWidth="2" />
            </svg>
            Posts
          </h2>
          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M2 12H22M12 2C14.5 4.5 16 8.5 16 12S14.5 19.5 12 22C9.5 19.5 8 15.5 8 12S9.5 4.5 12 2Z" stroke="currentColor" strokeWidth="2" />
              </svg>
              All
            </button>
            {isAuthenticated && (
              <button
                className={`view-btn ${viewMode === 'following' ? 'active' : ''}`}
                onClick={() => setViewMode('following')}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" />
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 8V14M23 11H17" stroke="currentColor" strokeWidth="2" />
                </svg>
                Following
              </button>
            )}
            <button
              className={`view-btn ${viewMode === 'trending' ? 'active' : ''}`}
              onClick={() => setViewMode('trending')}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" />
                <path d="M14 7H21V14" stroke="currentColor" strokeWidth="2" />
              </svg>
              Trending
            </button>
          </div>
        </div>

        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search posts, hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button onClick={handleSearch} className="search-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
          <p className="posts-count">{posts.length} posts found</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="no-posts">
          <p>No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <div className="posts">
          {posts.map(post => {
            const author = users[post.author_id.toString()];
            const isOwnPost = canEditPost(post);
            const hasLiked = userLikedPosts.has(Number(post.post_id));

            return (
              <div key={post.post_id} className="post-card">
                <div className="post-header">
                  <div className="author-info">
                    <div className="author-avatar">
                      {author?.profile_pic?.[0] ? (
                        <img src={author.profile_pic[0]} alt={author.username} />
                      ) : (
                        <div className="default-avatar">
                          {author ? author.username.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                    <div className="author-details">
                      <div className="author-name">
                        <strong
                          className="clickable-username"
                          onClick={() => author && handleUserClick(author)}
                          style={{ cursor: author ? 'pointer' : 'default', color: author ? '#667eea' : 'inherit' }}
                        >
                          {author ? author.username : 'Unknown User'}
                        </strong>
                        {author && author.full_name?.[0] && (
                          <span className="full-name">{author.full_name[0]}</span>
                        )}
                      </div>
                      <div className="post-meta">
                        <span className="post-date">{formatTimestamp(post.created_at)}</span>
                        {post.updated_at && post.updated_at.length > 0 && (
                          <span className="post-edited">• edited {formatTimestamp(post.updated_at[0])}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOwnPost && (
                    <div className="post-menu">
                      <button
                        onClick={() => onPostSelect && onPostSelect(post)}
                        className="menu-btn edit-btn"
                        title="Edit post"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" />
                          <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(post.post_id)}
                        className="menu-btn delete-btn"
                        title="Delete post"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" />
                          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <div className="post-content">
                  <p>{post.content}</p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="hashtags">
                      {post.hashtags.map((tag, index) => (
                        <span key={index} className="hashtag">#{tag}</span>
                      ))}
                    </div>
                  )}
                  {post.media_urls && post.media_urls.length > 0 && (() => {
                    // Filter and validate URLs first
                    const validUrls = post.media_urls.filter(url => {
                      if (!url || url.length < 10 || url === "data:image/png;base64" || url.trim() === "") {
                        return false;
                      }

                      // Validate URL format
                      try {
                        new URL(url);
                        return true;
                      } catch {
                        console.warn('Invalid URL detected:', url);
                        return false;
                      }
                    });

                    // Only render media gallery if there are valid URLs
                    if (validUrls.length === 0) {
                      return null;
                    }

                    // LinkedIn-style grid layout
                    const maxDisplayImages = 4;
                    const displayUrls = validUrls.slice(0, maxDisplayImages);
                    const remainingCount = validUrls.length - maxDisplayImages;

                    return (
                      <div className={`media-gallery media-count-${Math.min(validUrls.length, maxDisplayImages)}`}>
                        {displayUrls.map((url, index) => {
                          // Allow data URLs to be longer since they contain the actual image data
                          if (url.length > 100000 && !url.startsWith('data:')) {
                            console.warn('URL too long, skipping:', url.substring(0, 100) + '...');
                            return null;
                          }

                          // Check if it's a video
                          const isVideo = url.includes('video/') || url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
                          const isLastImage = index === maxDisplayImages - 1 && remainingCount > 0;

                          return (
                            <div key={index} className={`media-item ${isLastImage ? 'has-overlay' : ''}`}>
                              {isVideo ? (
                                <video
                                  src={url}
                                  className="post-media"
                                  controls
                                  preload="metadata"
                                  onError={(e) => {
                                    console.error('Video load error:', e);
                                    e.target.style.display = 'none';
                                    // Check if fallback already exists
                                    if (!e.target.parentNode.querySelector('.media-error')) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'media-error';
                                      fallback.textContent = '📹 Video unavailable';
                                      e.target.parentNode.appendChild(fallback);
                                    }
                                  }}
                                />
                              ) : (
                                <img
                                  src={url}
                                  alt="Post media"
                                  className="post-media"
                                  loading="lazy"
                                  onClick={() => openImageModal(validUrls, index)}
                                  onError={(e) => {
                                    console.error('Image load error:', e);
                                    e.target.style.display = 'none';
                                    // Check if fallback already exists
                                    if (!e.target.parentNode.querySelector('.media-error')) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'media-error';
                                      fallback.textContent = '🖼️ Image unavailable';
                                      e.target.parentNode.appendChild(fallback);
                                    }
                                  }}
                                  onLoad={(e) => {
                                    // Check if image is too large and compress if needed
                                    const img = e.target;
                                    if (img.naturalWidth > 1920 || img.naturalHeight > 1080) {
                                      img.style.maxWidth = '100%';
                                      img.style.height = 'auto';
                                    }
                                  }}
                                />
                              )}
                              {isLastImage && (
                                <div
                                  className="media-overlay"
                                  onClick={() => openImageModal(validUrls, index)}
                                >
                                  <span className="remaining-count">+{remainingCount}</span>
                                </div>
                              )}
                            </div>
                          );
                        }).filter(Boolean)}
                      </div>
                    );
                  })()}
                </div>

                <div className="post-actions">
                  <div className="action-buttons">{isAuthenticated && (
                    <>
                      {hasLiked ? (
                        <button
                          onClick={() => handleUnlike(post.post_id)}
                          className="action-btn like-btn liked"
                        >
                          <span className="btn-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20.84 4.61C19.32 3.04 17.13 3.04 15.61 4.61L12 8.22L8.39 4.61C6.87 3.04 4.68 3.04 3.16 4.61C1.64 6.18 1.64 8.82 3.16 10.39L12 19.23L20.84 10.39C22.36 8.82 22.36 6.18 20.84 4.61Z" />
                            </svg>
                          </span>
                          <span className="btn-text">Liked ({post.likes})</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLike(post.post_id)}
                          className="action-btn like-btn"
                        >
                          <span className="btn-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20.84 4.61C19.32 3.04 17.13 3.04 15.61 4.61L12 8.22L8.39 4.61C6.87 3.04 4.68 3.04 3.16 4.61C1.64 6.18 1.64 8.82 3.16 10.39L12 19.23L20.84 10.39C22.36 8.82 22.36 6.18 20.84 4.61Z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </span>
                          <span className="btn-text">Like ({post.likes})</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleComments(post.post_id)}
                        className="action-btn"
                      >
                        <span className="btn-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </span>
                        <span className="btn-text">Comment ({post.comments_count || 0})</span>
                      </button>

                      <button
                        onClick={() => handleShare(post.post_id)}
                        className="action-btn"
                      >
                        <span className="btn-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
                            <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
                            <path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </span>
                        <span className="btn-text">Share ({post.shares_count || 0})</span>
                      </button>
                    </>
                  )}</div>

                </div>

                {/* Comments Section */}
                {showComments[post.post_id] && (
                  <div className="comments-section">
                    <div className="comments-header">
                      <h4>💬 Comments ({post.comments_count || 0})</h4>
                    </div>

                    {isAuthenticated && (
                      <div className="add-comment">
                        <div className="comment-input-wrapper">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={newComment[post.post_id] || ''}
                            onChange={(e) => setNewComment(prev => ({
                              ...prev,
                              [post.post_id]: e.target.value
                            }))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddComment(post.post_id);
                              }
                            }}
                            className="comment-input"
                          />
                          <button
                            type="button"
                            className="comment-emoji-btn"
                            onClick={() => {
                              setEmojiPickerPostId(post.post_id);
                              setShowEmojiPicker(true);
                            }}
                          >
                            😊
                          </button>
                        </div>
                        <button
                          onClick={() => handleAddComment(post.post_id)}
                          disabled={!newComment[post.post_id]?.trim()}
                          className="comment-submit-btn"
                        >
                          Send
                        </button>
                      </div>
                    )}

                    <div className="comments-list">
                      {comments[post.post_id]?.map(comment => {
                        const commentAuthor = users[comment.author_id.toString()];
                        return (
                          <div key={comment.comment_id} className="comment">
                            <div className="comment-avatar">
                              {commentAuthor?.profile_pic?.[0] ? (
                                <img src={commentAuthor.profile_pic[0]} alt={commentAuthor.username} />
                              ) : (
                                <div className="default-avatar">
                                  {commentAuthor ? commentAuthor.username.charAt(0).toUpperCase() : '?'}
                                </div>
                              )}
                            </div>
                            <div className="comment-content">
                              <div className="comment-header">
                                <strong
                                  className="comment-author clickable-username"
                                  onClick={() => commentAuthor && handleUserClick(commentAuthor)}
                                  style={{ cursor: commentAuthor ? 'pointer' : 'default', color: commentAuthor ? '#667eea' : 'inherit' }}
                                >
                                  {commentAuthor ? commentAuthor.username : 'Unknown User'}
                                </strong>
                                <span className="comment-date">
                                  {formatTimestamp(comment.created_at)}
                                </span>
                              </div>
                              <p className="comment-text">{comment.content}</p>

                            </div>
                          </div>
                        );
                      })}

                      {comments[post.post_id]?.length === 0 && (
                        <div className="no-comments">
                          <p>No comments yet. Be the first to comment!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeImageModal}>×</button>

            {imageModal.images.length > 1 && (
              <>
                <button className="modal-nav modal-prev" onClick={prevImage}>‹</button>
                <button className="modal-nav modal-next" onClick={nextImage}>›</button>
              </>
            )}

            <div className="modal-image-container">
              <img
                src={imageModal.images[imageModal.currentIndex]}
                alt={`Image ${imageModal.currentIndex + 1} of ${imageModal.images.length}`}
                className="modal-image"
              />
            </div>

            {imageModal.images.length > 1 && (
              <div className="modal-counter">
                {imageModal.currentIndex + 1} / {imageModal.images.length}
              </div>
            )}
          </div>
        </div>
      )}

      <EmojiPicker
        isOpen={showEmojiPicker}
        onEmojiSelect={handleEmojiSelect}
        onClose={() => {
          setShowEmojiPicker(false);
          setEmojiPickerPostId(null);
        }}
      />
    </div>
  );
}

export default PostList;
