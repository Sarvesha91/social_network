import { useState, useEffect } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';

function UserList({ onUserSelect, refreshTrigger, currentUser, isAuthenticated, backendActor }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [followingUsers, setFollowingUsers] = useState(new Set());

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
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      fetchUsers();
    }
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const actor = backendActor || social_network_backend;
      const result = await actor.get_all_users();
      setUsers(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
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
          <h2>👥 Discover People</h2>
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
              🔍
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
              <div className="user-card-header">
                <div className="user-avatar" onClick={() => handleUserClick(user)}>
                  {user.profile_pic?.[0] ? (
                    <img src={user.profile_pic[0]} alt={user.username} />
                  ) : (
                    <div className="default-avatar">
                      {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>

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
              </div>

              <div className="user-info" onClick={() => handleUserClick(user)}>
                <h3>{user.username || 'Unknown User'}</h3>
                {user.full_name?.[0] && (
                  <p className="full-name">{user.full_name[0]}</p>
                )}
                {user.bio?.[0] && (
                  <p className="bio">
                    {user.bio[0].length > 120
                      ? user.bio[0].substring(0, 120) + '...'
                      : user.bio[0]
                    }
                  </p>
                )}
                {user.location?.[0] && (
                  <p className="location">📍 {user.location[0]}</p>
                )}
              </div>

              <div className="user-stats">
                <div className="stat">
                  <span className="stat-label">Joined</span>
                  <span className="stat-value">
                    {new Date(Number(user.created_at) / 1000000).toLocaleDateString()}
                  </span>
                </div>
                {isCurrentUser && (
                  <div className="current-user-badge">
                    You
                  </div>
                )}
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
