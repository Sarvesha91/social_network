import { useState } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';

function UserRegistration({ onUserCreated, backendActor }) {
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
    console.log('REGISTRATION: Form submitted');
    console.log('REGISTRATION: Form data:', formData);

    if (!formData.username.trim()) {
      setMessage('Username is required');
      return;
    }

    setLoading(true);
    setMessage('Creating your profile...');

    try {
      console.log('REGISTRATION: Calling create_user with data:', {
        username: formData.username,
        full_name: formData.full_name ? [formData.full_name] : [],
        email: formData.email ? [formData.email] : [],
        bio: formData.bio ? [formData.bio] : [],
        profile_pic: formData.profile_pic ? [formData.profile_pic] : [],
        location: formData.location ? [formData.location] : [],
        website: formData.website ? [formData.website] : []
      });

      // Use the passed backend actor (authenticated) or fallback to default
      const actor = backendActor || social_network_backend;
      console.log('REGISTRATION: Using actor:', actor === social_network_backend ? 'default' : 'authenticated');

      // Convert empty strings to empty arrays for Candid Option types
      const result = await actor.create_user(
        formData.username,
        formData.full_name ? [formData.full_name] : [],
        formData.email ? [formData.email] : [],
        formData.bio ? [formData.bio] : [],
        formData.profile_pic ? [formData.profile_pic] : [],
        formData.location ? [formData.location] : [],
        formData.website ? [formData.website] : []
      );

      console.log('REGISTRATION: Backend response:', result);
      setMessage(result);

      // Reset form on success
      if (result.includes('successfully')) {
        console.log('REGISTRATION: User created successfully, calling onUserCreated');
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
          console.log('REGISTRATION: Calling onUserCreated callback');
          onUserCreated();
        } else {
          console.error('REGISTRATION: onUserCreated callback not provided');
        }
      } else {
        console.error('REGISTRATION: User creation failed:', result);
      }
    } catch (error) {
      console.error('REGISTRATION: Error creating user:', error);
      setMessage('Error creating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-registration">
      <div className="welcome-header">
        <h1>🎉 Welcome to Social Network!</h1>
        <p>You've successfully authenticated with Internet Identity!</p>
        <p>Now let's create your profile to complete your account setup.</p>
        <div className="progress-indicator">
          <span className="step active">1</span>
          <span className="step-label">Create Profile</span>
          <span className="step">2</span>
          <span className="step-label">Access Main App</span>
        </div>
      </div>

      <div className="registration-container">
        <h2>Create Your Profile</h2>
        <p className="registration-subtitle">
          Fill in your details below. After creating your profile, you'll be taken to the main app where you can:
        </p>
        <div className="post-registration-benefits">
          <div className="benefit">📝 Create and share posts</div>
          <div className="benefit">👥 View and interact with other users</div>
          <div className="benefit">❤️ Like and comment on posts</div>
          <div className="benefit">👤 Manage your profile</div>
        </div>
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
    </div>
  );
}

export default UserRegistration;
