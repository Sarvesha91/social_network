import { useState, useEffect } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';

function UserList({ onUserSelect, refreshTrigger, currentUser, isAuthenticated, backendActor }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [userStats, setUserStats] = useState({});

  useEffect(() => {
    fetchUsers();
    if (isAuthenticated && currentUser) {
      fetchFollowing();
    }
  }, [refreshTrigger, isAuthenticated, currentUser]);

  // Force refresh users when refreshTrigger changes (e.g., after profile updates)
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 UserList: Refreshing users due to trigger change');
      fetchUsers();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        fetchUsers();
      }
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const actor = backendActor || social_network_backend;
      const result = await actor.get_all_users();
      setUsers(result);

      // Fetch stats for each user
      await fetchUserStats(result, actor);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (userList, actor) => {
    try {
      const statsPromises = userList.map(async (user) => {
        const userId = user.user_id;

        const [posts, followers, following] = await Promise.all([
          actor.get_user_posts(userId),
          actor.get_followers(userId),
          actor.get_following(userId)
        ]);

        return {
          userId: userId.toString(),
          postsCount: posts.length,
          followersCount: followers.length,
          followingCount: following.length
        };
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap = {};

      statsResults.forEach(stat => {
        statsMap[stat.userId] = {
          posts: stat.postsCount,
          followers: stat.followersCount,
          following: stat.followingCount
        };
      });

      setUserStats(statsMap);
    } catch (err) {
      console.error('❌ UserList: Error fetching user stats:', err);
    }
  };

  const fetchFollowing = async () => {
    try {
      // currentUser is a Principal, not a User object
      const actor = backendActor || social_network_backend;
      const result = await actor.get_following(currentUser);
      setFollowingUsers(new Set(result.map(id => id.toString())));
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const actor = backendActor || social_network_backend;
      const result = await actor.search_users(searchQuery);
      setUsers(result);
      setError('');
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    if (!isAuthenticated) {
      alert('Please login to follow users');
      return;
    }

    try {
      const actor = backendActor || social_network_backend;
      const result = await actor.follow_user(userId);
      if (result.includes('successfully')) {
        setFollowingUsers(prev => new Set([...prev, userId.toString()]));
      } else {
        alert(result);
      }
    } catch (err) {
      console.error('Error following user:', err);
      alert('Failed to follow user');
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const actor = backendActor || social_network_backend;
      const result = await actor.unfollow_user(userId);
      if (result.includes('successfully')) {
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId.toString());
          return newSet;
        });
      } else {
        alert(result);
      }
    } catch (err) {
      console.error('Error unfollowing user:', err);
      alert('Failed to unfollow user');
    }
  };

  const handleUserClick = (user) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(Number(timestamp) / 1_000_000); // Convert nanoseconds to milliseconds
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchUsers} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="no-users">
        <p>No users found. Be the first to create a profile!</p>
      </div>
    );
  }

  return (
    <div className="user-list">
      <div className="user-list-header">
        <div className="header-content">
          <h2 className="discover-header">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.75rem', color: '#667eea' }}>
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" />
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" />
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="discover-text">Discover People</span>
          </h2>
          <p>Connect with amazing people in our community</p>
        </div>

        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users by name, username, or bio..."
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
          <p className="users-count">{users.length} users found</p>
        </div>
      </div>

      <div className="users-grid">
        {users.map((user) => {
          // Safety checks for user object
          if (!user || !user.user_id || !user.username) {
            return null; // Skip invalid user objects
          }

          const isCurrentUser = currentUser && user.user_id.toString() === currentUser.toString();
          const isFollowing = followingUsers.has(user.user_id.toString());

          return (
            <div
              key={user.user_id.toString()}
              className="user-card"
            >
              <div className="user-card-cover">
                {!isCurrentUser && isAuthenticated && (
                  <div className="follow-btn-container">
                    {isFollowing ? (
                      <button
                        onClick={() => handleUnfollow(user.user_id)}
                        className="follow-btn following"
                      >
                        ✓ Following
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFollow(user.user_id)}
                        className="follow-btn"
                      >
                        + Follow
                      </button>
                    )}
                  </div>
                )}
                {isCurrentUser && (
                  <div className="current-user-indicator">
                    You
                  </div>
                )}
              </div>

              <div className="user-card-body">
                <div className="user-avatar-section">
                  <div className="user-card-avatar" onClick={() => handleUserClick(user)}>
                    {user.profile_pic?.[0] ? (
                      <img src={user.profile_pic[0]} alt={user.username} />
                    ) : (
                      <div className="default-avatar">
                        {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                  </div>

                  <div className="user-basic-info" onClick={() => handleUserClick(user)}>
                    <h3>{user.username || 'Unknown User'}</h3>
                    {user.full_name?.[0] && (
                      <div className="user-name-location">
                        <p className="full-name">{user.full_name[0]}</p>
                        {user.location?.[0] && (
                          <div className="user-location">
                            <span className="location-icon">📍</span>
                            <span>{user.location[0]}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="user-details">
                  {user.bio?.[0] && (
                    <p className="bio">
                      {user.bio[0].length > 100
                        ? user.bio[0].substring(0, 100) + '...'
                        : user.bio[0]
                      }
                    </p>
                  )}
                </div>

                <div className="user-stats">
                  <div className="stats-row">
                    <div className="stat">
                      <span className="stat-label">Posts</span>
                      <span className="stat-value">
                        {userStats[user.user_id.toString()]?.posts || 0}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Followers</span>
                      <span className="stat-value">
                        {userStats[user.user_id.toString()]?.followers || 0}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Following</span>
                      <span className="stat-value">
                        {userStats[user.user_id.toString()]?.following || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="list-actions">
        <button onClick={fetchUsers} className="refresh-btn">
          🔄 Refresh Users
        </button>
      </div>
    </div>
  );
}

export default UserList;
