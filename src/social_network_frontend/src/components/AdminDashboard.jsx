import { useState, useEffect } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';

function AdminDashboard({ currentUser, backendActor }) {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch admin statistics
      const actor = backendActor || social_network_backend;
      const statsResult = await actor.admin_get_stats();
      if ('Ok' in statsResult) {
        setStats(statsResult.Ok);
      } else {
        setError('Failed to fetch statistics: ' + statsResult.Err);
        return;
      }

      // Fetch recent users
      const recentUsersResult = await actor.admin_get_recent_users(10);
      if ('Ok' in recentUsersResult) {
        setRecentUsers(recentUsersResult.Ok);
      } else {
        setError('Failed to fetch recent users: ' + recentUsersResult.Err);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Error loading admin dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(Number(timestamp) / 1_000_000); // Convert nanoseconds to milliseconds
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchAdminData} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>🛡️ Admin Dashboard</h2>
        <p>Welcome, Administrator! Here's an overview of your social network.</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats?.total_users || 0}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-content">
            <h3>{stats?.total_admins || 0}</h3>
            <p>Total Admins</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🆕</div>
          <div className="stat-content">
            <h3>{stats?.recent_registrations || 0}</h3>
            <p>New Users (24h)</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats ? Math.round((stats.total_admins / stats.total_users) * 100) : 0}%</h3>
            <p>Admin Ratio</p>
          </div>
        </div>
      </div>

      {/* Recent Users Section */}
      <div className="recent-users-section">
        <div className="section-header">
          <h3>Recent User Registrations</h3>
          <button onClick={fetchAdminData} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>

        {recentUsers.length === 0 ? (
          <div className="no-data">
            <p>No recent user registrations</p>
          </div>
        ) : (
          <div className="recent-users-list">
            {recentUsers.map((user) => (
              <div key={user.user_id.toString()} className="recent-user-item">
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
                  <div className="user-name">
                    <strong>{user.username}</strong>
                    {user.is_admin && <span className="admin-badge">Admin</span>}
                  </div>
                  {user.full_name?.[0] && (
                    <div className="user-full-name">{user.full_name[0]}</div>
                  )}
                  <div className="user-meta">
                    <span>Joined: {formatTimestamp(user.created_at)}</span>
                    <span>Last active: {formatTimestamp(user.last_active)}</span>
                  </div>
                </div>

                <div className="user-id">
                  <small>{user.user_id.toString().substring(0, 12)}...</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn primary">
            👥 Manage Users
          </button>
          <button className="action-btn secondary">
            🔍 Search Users
          </button>
          <button className="action-btn secondary">
            📊 View Reports
          </button>
          <button className="action-btn secondary">
            ⚙️ Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
