import { useState } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';

function UserRegistration({ onUserCreated }) {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    bio: '',
    profile_pic: '',
    location: '',
    website: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      setMessage('Username is required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Convert empty strings to null for optional fields
      const result = await social_network_backend.create_user(
        formData.username,
        formData.full_name ? [formData.full_name] : [],
        formData.email ? [formData.email] : [],
        formData.bio ? [formData.bio] : [],
        formData.profile_pic ? [formData.profile_pic] : [],
        formData.location ? [formData.location] : [],
        formData.website ? [formData.website] : []
      );
      
      setMessage(result);
      
      // Reset form on success
      if (result.includes('successfully')) {
        setFormData({
          username: '',
          full_name: '',
          email: '',
          bio: '',
          profile_pic: '',
          location: '',
          website: ''
        });
        
        // Notify parent component
        if (onUserCreated) {
          onUserCreated();
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage('Error creating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-registration">
      <h2>Create User Profile</h2>
      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-group">
          <label htmlFor="username">Username *</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Enter your username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="full_name">Full Name</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Enter your full name"
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
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself"
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
            placeholder="Enter profile picture URL"
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
            placeholder="Enter your location"
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
            placeholder="Enter your website URL"
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Creating...' : 'Create Profile'}
        </button>
      </form>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default UserRegistration;
