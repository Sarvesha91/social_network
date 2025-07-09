import { useState, useEffect } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';

function PostList({ currentUser, isAuthenticated, refreshTrigger, onPostSelect, backendActor }) {
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

  useEffect(() => {
    fetchPosts();
    fetchUsers();
    if (isAuthenticated && currentUser) {
      fetchUserLikes();
    }
  }, [refreshTrigger, isAuthenticated, currentUser, viewMode]);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      fetchPosts();
    }
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
      const actor = backendActor || social_network_backend;
      const likedPostIds = await actor.get_user_liked_posts();
      // Handle BigInt conversion properly
      const processedIds = likedPostIds.map(id => {
        if (typeof id === 'bigint') {
          return Number(id);
        } else if (typeof id === 'object' && id !== null) {
          // Handle case where id might be wrapped in an object
          return Number(id.toString());
        }
        return Number(id);
      });
      setUserLikedPosts(new Set(processedIds));
    } catch (err) {
      console.error('Error fetching user likes:', err);
    }
  };

  const handleLike = async (postId) => {
    if (!isAuthenticated) {
      alert('Please login to like posts');
      return;
    }

    const numPostId = Number(postId);

    // Immediate optimistic update
    setUserLikedPosts(prev => new Set([...prev, numPostId]));
    setPosts(prev => prev.map(post =>
      post.post_id === numPostId
        ? { ...post, likes: post.likes + 1 }
        : post
    ));

    try {
      const actor = backendActor || social_network_backend;
      const bigIntPostId = BigInt(postId);
      const result = await actor.like_post(bigIntPostId);

      if (!result.includes('successfully')) {
        // Revert on failure
        setUserLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(numPostId);
          return newSet;
        });
        setPosts(prev => prev.map(post =>
          post.post_id === numPostId
            ? { ...post, likes: Math.max(0, post.likes - 1) }
            : post
        ));
        alert(result);
      }
    } catch (err) {
      console.error('Error liking post:', err);
      // Revert on error
      setUserLikedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(numPostId);
        return newSet;
      });
      setPosts(prev => prev.map(post =>
        post.post_id === numPostId
          ? { ...post, likes: Math.max(0, post.likes - 1) }
          : post
      ));
      alert('Failed to like post');
    }
  };

  const handleUnlike = async (postId) => {
    if (!isAuthenticated) {
      alert('Please login to unlike posts');
      return;
    }

    const numPostId = Number(postId);

    // Immediate optimistic update
    setUserLikedPosts(prev => {
      const newSet = new Set(prev);
      newSet.delete(numPostId);
      return newSet;
    });
    setPosts(prev => prev.map(post =>
      post.post_id === numPostId
        ? { ...post, likes: Math.max(0, post.likes - 1) }
        : post
    ));

    try {
      const actor = backendActor || social_network_backend;
      const bigIntPostId = BigInt(postId);
      const result = await actor.unlike_post(bigIntPostId);

      if (!result.includes('successfully')) {
        // Revert on failure
        setUserLikedPosts(prev => new Set([...prev, numPostId]));
        setPosts(prev => prev.map(post =>
          post.post_id === numPostId
            ? { ...post, likes: post.likes + 1 }
            : post
        ));
        alert(result);
      }
    } catch (err) {
      console.error('Error unliking post:', err);
      // Revert on error
      setUserLikedPosts(prev => new Set([...prev, numPostId]));
      setPosts(prev => prev.map(post =>
        post.post_id === numPostId
          ? { ...post, likes: post.likes + 1 }
          : post
      ));
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
          <h2>📝 Posts</h2>
          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              🌍 All
            </button>
            {isAuthenticated && (
              <button
                className={`view-btn ${viewMode === 'following' ? 'active' : ''}`}
                onClick={() => setViewMode('following')}
              >
                👥 Following
              </button>
            )}
            <button
              className={`view-btn ${viewMode === 'trending' ? 'active' : ''}`}
              onClick={() => setViewMode('trending')}
            >
              🔥 Trending
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
              🔍
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
                        <strong>{author ? author.username : 'Unknown User'}</strong>
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
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(post.post_id)}
                        className="menu-btn delete-btn"
                        title="Delete post"
                      >
                        🗑️
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
                  {post.media_urls && post.media_urls.length > 0 && (
                    <div className="media-gallery">
                      {post.media_urls.map((url, index) => {
                        // Skip invalid or incomplete URLs
                        if (!url || url.length < 10 || url === "data:image/png;base64") {
                          return null;
                        }

                        // Check if it's a video
                        const isVideo = url.includes('video/') || url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');

                        return isVideo ? (
                          <video
                            key={index}
                            src={url}
                            className="post-media"
                            controls
                            preload="metadata"
                            onError={(e) => {
                              console.error('Video load error:', e);
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <img
                            key={index}
                            src={url}
                            alt="Post media"
                            className="post-media"
                            onError={(e) => {
                              console.error('Image load error:', e);
                              e.target.style.display = 'none';
                            }}
                          />
                        );
                      }).filter(Boolean)}
                    </div>
                  )}
                </div>

                <div className="post-actions">
                  <div className="action-buttons">{isAuthenticated && (
                    <>
                      {hasLiked ? (
                        <button
                          onClick={() => handleUnlike(post.post_id)}
                          className="action-btn like-btn liked"
                        >
                          <span className="btn-icon">❤️</span>
                          <span className="btn-text">Liked ({post.likes})</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLike(post.post_id)}
                          className="action-btn like-btn"
                        >
                          <span className="btn-icon">🤍</span>
                          <span className="btn-text">Like ({post.likes})</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleComments(post.post_id)}
                        className="action-btn"
                      >
                        <span className="btn-icon">💬</span>
                        <span className="btn-text">Comment ({post.comments_count || 0})</span>
                      </button>

                      <button
                        onClick={() => handleShare(post.post_id)}
                        className="action-btn"
                      >
                        <span className="btn-icon">🔄</span>
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
                            onClick={() => handleAddComment(post.post_id)}
                            disabled={!newComment[post.post_id]?.trim()}
                            className="comment-submit-btn"
                          >
                            Send
                          </button>
                        </div>
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
                                <strong className="comment-author">
                                  {commentAuthor ? commentAuthor.username : 'Unknown User'}
                                </strong>
                                <span className="comment-date">
                                  {formatTimestamp(comment.created_at)}
                                </span>
                              </div>
                              <p className="comment-text">{comment.content}</p>
                              <div className="comment-actions">
                                <span className="comment-likes">❤️ {comment.likes}</span>
                              </div>
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
    </div>
  );
}

export default PostList;
