import { useState, useEffect } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';

function UserList({ onUserSelect, refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await social_network_backend.get_all_users();
      setUsers(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
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
      <h2>All Users ({users.length})</h2>
      <div className="users-grid">
        {users.map((user) => (
          <div
            key={user.user_id.toString()}
            className="user-card"
            onClick={() => handleUserClick(user)}
          >
            <div className="user-avatar">
              {user.profile_pic?.[0] ? (
                <img src={user.profile_pic[0]} alt={user.username} />
              ) : (
                <div className="default-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="user-info">
              <h3>{user.username}</h3>
              {user.full_name?.[0] && (
                <p className="full-name">{user.full_name[0]}</p>
              )}
              {user.bio?.[0] && (
                <p className="bio">
                  {user.bio[0].length > 100 
                    ? user.bio[0].substring(0, 100) + '...' 
                    : user.bio[0]
                  }
                </p>
              )}
              {user.location?.[0] && (
                <p className="location">📍 {user.location[0]}</p>
              )}
            </div>
            
            <div className="user-meta">
              <small>ID: {user.user_id.toString().substring(0, 8)}...</small>
            </div>
          </div>
        ))}
      </div>
      
      <button onClick={fetchUsers} className="refresh-btn">
        Refresh Users
      </button>
    </div>
  );
}

export default UserList;
