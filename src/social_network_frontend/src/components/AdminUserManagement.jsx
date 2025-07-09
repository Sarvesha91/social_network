import { useState, useEffect } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';
import { Principal } from '@dfinity/principal';

function AdminUserManagement({ currentUser, onUserAction }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'admins', 'users'
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filterType]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await social_network_backend.admin_get_all_users_detailed();
      if ('Ok' in result) {
        setUsers(result.Ok);
      } else {
        setError('Failed to fetch users: ' + result.Err);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(query) ||
        (user.full_name?.[0] && user.full_name[0].toLowerCase().includes(query)) ||
        (user.email?.[0] && user.email[0].toLowerCase().includes(query)) ||
        user.user_id.toString().includes(query)
      );
    }

    // Apply type filter
    if (filterType === 'admins') {
      filtered = filtered.filter(user => user.is_admin);
    } else if (filterType === 'users') {
      filtered = filtered.filter(user => !user.is_admin);
    }

    setFilteredUsers(filtered);
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u.user_id.toString() === userId.toString());
    if (!userToDelete) return;

    const confirmMessage = `Are you sure you want to delete user "${userToDelete.username}"? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading(prev => ({ ...prev, [userId.toString()]: 'deleting' }));

      const result = await social_network_backend.admin_delete_user(userId);
      
      if (result.includes('successfully')) {
        // Remove user from local state
        setUsers(prev => prev.filter(u => u.user_id.toString() !== userId.toString()));
        if (onUserAction) onUserAction('delete', userToDelete);
      } else {
        setError('Failed to delete user: ' + result);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error deleting user: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId.toString()]: null }));
    }
  };

  const handlePromoteUser = async (userId) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId.toString()]: 'promoting' }));

      const result = await social_network_backend.admin_promote_user(userId);
      
      if (result.includes('successfully')) {
        // Update user in local state
        setUsers(prev => prev.map(u => 
          u.user_id.toString() === userId.toString() 
            ? { ...u, is_admin: true }
            : u
        ));
        if (onUserAction) onUserAction('promote', users.find(u => u.user_id.toString() === userId.toString()));
      } else {
        setError('Failed to promote user: ' + result);
      }
    } catch (error) {
      console.error('Error promoting user:', error);
      setError('Error promoting user: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId.toString()]: null }));
    }
  };

  const handleDemoteUser = async (userId) => {
    const userToDemote = users.find(u => u.user_id.toString() === userId.toString());
    if (!userToDemote) return;

    const confirmMessage = `Are you sure you want to remove admin privileges from "${userToDemote.username}"?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading(prev => ({ ...prev, [userId.toString()]: 'demoting' }));

      const result = await social_network_backend.admin_demote_user(userId);
      
      if (result.includes('successfully')) {
        // Update user in local state
        setUsers(prev => prev.map(u => 
          u.user_id.toString() === userId.toString() 
            ? { ...u, is_admin: false }
            : u
        ));
        if (onUserAction) onUserAction('demote', userToDemote);
      } else {
        setError('Failed to demote user: ' + result);
      }
    } catch (error) {
      console.error('Error demoting user:', error);
      setError('Error demoting user: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId.toString()]: null }));
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString();
  };

  const isCurrentUser = (userId) => {
    return currentUser && userId.toString() === currentUser.toString();
  };

  if (loading) {
    return <div className="loading">Loading user management...</div>;
  }

  return (
    <div className="admin-user-management">
      <div className="management-header">
        <h2>👥 User Management</h2>
        <p>Manage all users in your social network</p>
      </div>

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Users ({users.length})</option>
            <option value="admins">Admins Only ({users.filter(u => u.is_admin).length})</option>
            <option value="users">Regular Users ({users.filter(u => !u.is_admin).length})</option>
          </select>

          <button onClick={fetchUsers} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        {filteredUsers.length === 0 ? (
          <div className="no-users">
            <p>No users found matching your criteria</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.user_id.toString()} className={isCurrentUser(user.user_id) ? 'current-user' : ''}>
                  <td className="user-cell">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.profile_pic?.[0] ? (
                          <img src={user.profile_pic[0]} alt={user.username} />
                        ) : (
                          <div className="default-avatar">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="user-details">
                        <div className="username">
                          {user.username}
                          {isCurrentUser(user.user_id) && <span className="you-badge">You</span>}
                        </div>
                        {user.full_name?.[0] && (
                          <div className="full-name">{user.full_name[0]}</div>
                        )}
                        <div className="user-id">{user.user_id.toString().substring(0, 12)}...</div>
                      </div>
                    </div>
                  </td>

                  <td className="contact-cell">
                    {user.email?.[0] && (
                      <div className="email">{user.email[0]}</div>
                    )}
                    {user.location?.[0] && (
                      <div className="location">📍 {user.location[0]}</div>
                    )}
                  </td>

                  <td className="status-cell">
                    {user.is_admin ? (
                      <span className="admin-badge">🛡️ Admin</span>
                    ) : (
                      <span className="user-badge">👤 User</span>
                    )}
                  </td>

                  <td className="date-cell">
                    {formatDate(user.created_at)}
                  </td>

                  <td className="actions-cell">
                    <div className="action-buttons">
                      {!isCurrentUser(user.user_id) && (
                        <>
                          {!user.is_admin ? (
                            <button
                              onClick={() => handlePromoteUser(user.user_id)}
                              disabled={actionLoading[user.user_id.toString()]}
                              className="action-btn promote"
                              title="Promote to Admin"
                            >
                              {actionLoading[user.user_id.toString()] === 'promoting' ? '⏳' : '⬆️'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDemoteUser(user.user_id)}
                              disabled={actionLoading[user.user_id.toString()]}
                              className="action-btn demote"
                              title="Remove Admin"
                            >
                              {actionLoading[user.user_id.toString()] === 'demoting' ? '⏳' : '⬇️'}
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteUser(user.user_id)}
                            disabled={actionLoading[user.user_id.toString()]}
                            className="action-btn delete"
                            title="Delete User"
                          >
                            {actionLoading[user.user_id.toString()] === 'deleting' ? '⏳' : '🗑️'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminUserManagement;
