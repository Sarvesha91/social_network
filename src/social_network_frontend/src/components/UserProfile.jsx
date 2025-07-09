import { useState, useEffect } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';
import { Principal } from '@dfinity/principal';

function UserProfile({ userId, userData, isCurrentUser = false, onUserUpdated, backendActor, currentUser }) {
  const [user, setUser] = useState(userData || null);
  const [loading, setLoading] = useState(!userData);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    bio: '',
    profile_pic: '',
    location: '',
    website: ''
  });

  // Follow system state
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersDetails, setFollowersDetails] = useState([]);
  const [followingDetails, setFollowingDetails] = useState([]);
  const [message, setMessage] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);

  useEffect(() => {
    if (userData) {
      // If userData is provided, use it directly
      setUser(userData);
      setLoading(false);
      setFormData({
        full_name: userData.full_name?.[0] || '',
        email: userData.email?.[0] || '',
        bio: userData.bio?.[0] || '',
        profile_pic: userData.profile_pic?.[0] || '',
        location: userData.location?.[0] || '',
        website: userData.website?.[0] || ''
      });
    } else if (userId) {
      // If no userData provided, fetch from backend
      fetchUser();
    }
  }, [userId, userData]);

  useEffect(() => {
    if (user) {
      fetchFollowData();
      if (currentUser && !isCurrentUser) {
        checkIfFollowing();
      }
    }
  }, [user, currentUser]);

  const fetchFollowData = async () => {
    if (!user) return;

    try {
      const actor = backendActor || social_network_backend;
      const userPrincipal = typeof user.user_id === 'string' ? Principal.fromText(user.user_id) : user.user_id;

      // Get followers and following lists
      const [followersResult, followingResult] = await Promise.all([
        actor.get_followers(userPrincipal),
        actor.get_following(userPrincipal)
      ]);

      setFollowers(followersResult);
      setFollowing(followingResult);

      // Get detailed user info for followers and following
      const [followersDetailsResult, followingDetailsResult] = await Promise.all([
        Promise.all(followersResult.map(id => actor.get_user(id))),
        Promise.all(followingResult.map(id => actor.get_user(id)))
      ]);

      setFollowersDetails(followersDetailsResult.filter(Boolean));
      setFollowingDetails(followingDetailsResult.filter(Boolean));
    } catch (error) {
      console.error('Error fetching follow data:', error);
    }
  };

  const checkIfFollowing = async () => {
    if (!user || !currentUser) return;

    try {
      const actor = backendActor || social_network_backend;
      const userPrincipal = typeof user.user_id === 'string' ? Principal.fromText(user.user_id) : user.user_id;
      const result = await actor.is_following(userPrincipal);
      setIsFollowing(result);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !currentUser) return;

    try {
      const actor = backendActor || social_network_backend;
      const userPrincipal = typeof user.user_id === 'string' ? Principal.fromText(user.user_id) : user.user_id;

      const result = isFollowing
        ? await actor.unfollow_user(userPrincipal)
        : await actor.follow_user(userPrincipal);

      if (result.includes('successfully')) {
        setIsFollowing(!isFollowing);
        // Refresh follow data
        fetchFollowData();
      } else {
        setMessage(result);
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      setMessage('Error updating follow status');
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const principal = typeof userId === 'string' ? Principal.fromText(userId) : userId;
      const actor = backendActor || social_network_backend;
      const result = await actor.get_user(principal);

      if (result) {
        const userData = result;
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

  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage('Image size must be less than 5MB');
        return;
      }

      setProfilePicFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          profile_pic: e.target.result
        }));
      };
      reader.readAsDataURL(file);
      setMessage('');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const actor = backendActor || social_network_backend;
      const result = await actor.update_user(
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

        // Update local user state with the new form data
        const updatedUser = {
          ...user,
          full_name: formData.full_name ? [formData.full_name] : [],
          email: formData.email ? [formData.email] : [],
          bio: formData.bio ? [formData.bio] : [],
          profile_pic: formData.profile_pic ? [formData.profile_pic] : [],
          location: formData.location ? [formData.location] : [],
          website: formData.website ? [formData.website] : []
        };

        setUser(updatedUser);

        if (onUserUpdated) {
          onUserUpdated(updatedUser);
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
      const actor = backendActor || social_network_backend;
      const result = await actor.delete_user();
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

  if (!user.username) {
    return (
      <div className="no-user">
        <h3>User data incomplete</h3>
        <p>Debug: User object structure:</p>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
    );
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

          {/* Follow Stats */}
          <div className="follow-stats">
            <button
              className="stat-button"
              onClick={() => setShowFollowers(!showFollowers)}
            >
              <span className="stat-number">{followers.length}</span>
              <span className="stat-label">Followers</span>
            </button>
            <button
              className="stat-button"
              onClick={() => setShowFollowing(!showFollowing)}
            >
              <span className="stat-number">{following.length}</span>
              <span className="stat-label">Following</span>
            </button>
          </div>
        </div>

        <div className="profile-actions">
          {isCurrentUser ? (
            <>
              <button onClick={() => setEditing(!editing)} className="edit-btn">
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
              <button onClick={handleDelete} className="delete-btn">
                Delete Profile
              </button>
            </>
          ) : currentUser && (
            <button
              onClick={handleFollow}
              className={`follow-btn ${isFollowing ? 'following' : ''}`}
            >
              {isFollowing ? '✓ Following' : '+ Follow'}
            </button>
          )}
        </div>
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
            <label htmlFor="profile_pic">Profile Picture</label>
            <div className="profile-pic-upload">
              <input
                type="url"
                id="profile_pic"
                name="profile_pic"
                value={formData.profile_pic}
                onChange={handleChange}
                placeholder="Enter image URL or upload file below"
              />
              <div className="file-upload-section">
                <input
                  type="file"
                  id="profile-pic-file"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                  className="file-input"
                />
                <label htmlFor="profile-pic-file" className="file-upload-btn">
                  📷 Upload Image
                </label>
              </div>
              {formData.profile_pic && (
                <div className="profile-pic-preview">
                  <img src={formData.profile_pic} alt="Profile preview" />
                </div>
              )}
            </div>
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

      {/* Followers List */}
      {showFollowers && (
        <div className="follow-list-modal">
          <div className="follow-list-content">
            <div className="follow-list-header">
              <h3>Followers ({followers.length})</h3>
              <button onClick={() => setShowFollowers(false)} className="close-btn">×</button>
            </div>
            <div className="follow-list">
              {followersDetails.length > 0 ? (
                followersDetails.map(follower => (
                  <div key={follower.user_id.toString()} className="follow-item">
                    <div className="follow-avatar">
                      {follower.profile_pic?.[0] ? (
                        <img src={follower.profile_pic[0]} alt={follower.username} />
                      ) : (
                        <div className="default-avatar">
                          {follower.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="follow-info">
                      <h4>{follower.username}</h4>
                      {follower.full_name?.[0] && <p>{follower.full_name[0]}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-follows">No followers yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following List */}
      {showFollowing && (
        <div className="follow-list-modal">
          <div className="follow-list-content">
            <div className="follow-list-header">
              <h3>Following ({following.length})</h3>
              <button onClick={() => setShowFollowing(false)} className="close-btn">×</button>
            </div>
            <div className="follow-list">
              {followingDetails.length > 0 ? (
                followingDetails.map(followedUser => (
                  <div key={followedUser.user_id.toString()} className="follow-item">
                    <div className="follow-avatar">
                      {followedUser.profile_pic?.[0] ? (
                        <img src={followedUser.profile_pic[0]} alt={followedUser.username} />
                      ) : (
                        <div className="default-avatar">
                          {followedUser.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="follow-info">
                      <h4>{followedUser.username}</h4>
                      {followedUser.full_name?.[0] && <p>{followedUser.full_name[0]}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-follows">Not following anyone yet</p>
              )}
            </div>
          </div>
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
