import { useState, useEffect } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';
import { Principal } from '@dfinity/principal';

function UserProfile({ userId, isCurrentUser = false, onUserUpdated }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    bio: '',
    profile_pic: '',
    location: '',
    website: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const principal = typeof userId === 'string' ? Principal.fromText(userId) : userId;
      const result = await social_network_backend.get_user(principal);
      
      if (result && result.length > 0) {
        const userData = result[0];
        setUser(userData);
        
        // Initialize form data for editing
        setFormData({
          full_name: userData.full_name?.[0] || '',
          email: userData.email?.[0] || '',
          bio: userData.bio?.[0] || '',
          profile_pic: userData.profile_pic?.[0] || '',
          location: userData.location?.[0] || '',
          website: userData.website?.[0] || ''
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setMessage('Error loading user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await social_network_backend.update_user(
        formData.full_name ? [formData.full_name] : [],
        formData.email ? [formData.email] : [],
        formData.bio ? [formData.bio] : [],
        formData.profile_pic ? [formData.profile_pic] : [],
        formData.location ? [formData.location] : [],
        formData.website ? [formData.website] : []
      );
      
      setMessage(result);
      
      if (result.includes('successfully')) {
        setEditing(false);
        await fetchUser(); // Refresh user data
        
        if (onUserUpdated) {
          onUserUpdated();
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await social_network_backend.delete_user();
      setMessage(result);
      
      if (result.includes('successfully')) {
        setUser(null);
        if (onUserUpdated) {
          onUserUpdated();
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('Error deleting profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!user) {
    return <div className="no-user">User not found</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-image">
          {user.profile_pic?.[0] ? (
            <img src={user.profile_pic[0]} alt={user.username} />
          ) : (
            <div className="default-avatar">{user.username.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <div className="profile-info">
          <h2>{user.username}</h2>
          {user.full_name?.[0] && <h3>{user.full_name[0]}</h3>}
          <p className="user-id">ID: {user.user_id.toString()}</p>
        </div>
        {isCurrentUser && (
          <div className="profile-actions">
            <button onClick={() => setEditing(!editing)} className="edit-btn">
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button onClick={handleDelete} className="delete-btn">
              Delete Profile
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleUpdate} className="edit-form">
          <div className="form-group">
            <label htmlFor="full_name">Full Name</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile_pic">Profile Picture URL</label>
            <input
              type="url"
              id="profile_pic"
              name="profile_pic"
              value={formData.profile_pic}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={loading} className="save-btn">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : (
        <div className="profile-details">
          {user.bio?.[0] && (
            <div className="detail-item">
              <strong>Bio:</strong>
              <p>{user.bio[0]}</p>
            </div>
          )}
          
          {user.email?.[0] && (
            <div className="detail-item">
              <strong>Email:</strong>
              <p>{user.email[0]}</p>
            </div>
          )}
          
          {user.location?.[0] && (
            <div className="detail-item">
              <strong>Location:</strong>
              <p>{user.location[0]}</p>
            </div>
          )}
          
          {user.website?.[0] && (
            <div className="detail-item">
              <strong>Website:</strong>
              <p>
                <a href={user.website[0]} target="_blank" rel="noopener noreferrer">
                  {user.website[0]}
                </a>
              </p>
            </div>
          )}
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default UserProfile;
