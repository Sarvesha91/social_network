import { useState, useEffect } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';
import { AuthClient } from '@dfinity/auth-client';
import { AnonymousIdentity } from '@dfinity/agent';
import UserRegistration from './components/UserRegistration';
import UserProfile from './components/UserProfile';
import UserList from './components/UserList';

function App() {
  const [currentView, setCurrentView] = useState('users'); // 'users', 'register', 'profile'
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      console.log('Initializing auth client...');
      const client = await AuthClient.create();
      setAuthClient(client);
      console.log('Auth client created successfully');

      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);
      console.log('Authentication status:', isAuthenticated);

      if (isAuthenticated) {
        const identity = client.getIdentity();
        const principal = identity.getPrincipal();
        setCurrentUser(principal);
        console.log('Current user principal:', principal.toString());

        // Try to fetch current user's profile
        try {
          const userResult = await social_network_backend.get_user(principal);
          if (userResult && userResult.length > 0) {
            // User exists, show their profile
            setSelectedUser(userResult[0]);
            setCurrentView('profile');
            console.log('User profile found, showing profile view');
          } else {
            // User doesn't exist, show registration
            setCurrentView('register');
            console.log('No user profile found, showing registration');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        console.log('User not authenticated, showing users list');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  };

  const handleLogin = async () => {
    if (!authClient) return;

    try {
      console.log('Starting Internet Identity login process...');
      setAuthError(''); // Clear any previous errors

      // Use the current Internet Identity canister ID from environment
      // In Vite, environment variables need to be prefixed with VITE_ or accessed via import.meta.env
      const iiCanisterId = import.meta.env.CANISTER_ID_INTERNET_IDENTITY || 'bw4dl-smaaa-aaaaa-qaacq-cai';

      console.log('Using II Canister ID:', iiCanisterId);

      await authClient.login({
        // Use the localhost format which often works better for local development
        identityProvider: `http://${iiCanisterId}.localhost:4943/`,
        // Set a longer timeout for the authentication process
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days in nanoseconds
        windowOpenerFeatures: 'toolbar=0,location=0,menubar=0,width=500,height=500,left=100,top=100',
        onSuccess: async () => {
          console.log('Internet Identity login successful!');
          setIsAuthenticated(true);
          const identity = authClient.getIdentity();
          const principal = identity.getPrincipal();
          setCurrentUser(principal);
          console.log('Authenticated user principal:', principal.toString());

          // Check if user profile exists in our backend
          try {
            const userResult = await social_network_backend.get_user(principal);
            if (userResult && userResult.length > 0) {
              setSelectedUser(userResult[0]);
              setCurrentView('profile');
              console.log('Existing user profile found, showing profile');
            } else {
              setCurrentView('register');
              console.log('New user, showing registration form');
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setCurrentView('register');
          }
        },
        onError: (error) => {
          console.error('Internet Identity login failed:', error);
          setAuthError('Authentication failed. Please try again.');
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Failed to start authentication process.');
    }
  };

  const handleLogout = async () => {
    if (!authClient) return;

    await authClient.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedUser(null);
    setCurrentView('users');
    setAuthError('');
  };



  const handleUserCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentView('users');
  };

  const handleUserUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setCurrentView('profile');
  };

  const isCurrentUserProfile = selectedUser && currentUser &&
    selectedUser.user_id.toString() === currentUser.toString();

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🌐 Social Network</h1>
          <nav className="nav-menu">
            <button
              onClick={() => setCurrentView('users')}
              className={currentView === 'users' ? 'active' : ''}
            >
              All Users
            </button>

            {isAuthenticated && (
              <>
                <button
                  onClick={() => setCurrentView('register')}
                  className={currentView === 'register' ? 'active' : ''}
                >
                  Create Profile
                </button>
                <button
                  onClick={() => {
                    if (currentUser) {
                      setSelectedUser({ user_id: currentUser });
                      setCurrentView('profile');
                    }
                  }}
                  className={currentView === 'profile' && isCurrentUserProfile ? 'active' : ''}
                >
                  My Profile
                </button>
              </>
            )}
          </nav>

          <div className="auth-section">
            {isAuthenticated ? (
              <div className="user-info">
                <span>Welcome! {currentUser?.toString().substring(0, 8)}...</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-controls">
                <button onClick={handleLogin} className="login-btn">
                  Login with Internet Identity
                </button>
                {authError && (
                  <div className="auth-error">
                    {authError}
                    <button onClick={() => setAuthError('')} className="close-error">×</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'users' && (
          <UserList
            onUserSelect={handleUserSelect}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'register' && isAuthenticated && (
          <UserRegistration onUserCreated={handleUserCreated} />
        )}

        {currentView === 'profile' && selectedUser && (
          <UserProfile
            userId={selectedUser.user_id}
            isCurrentUser={isCurrentUserProfile}
            onUserUpdated={handleUserUpdated}
          />
        )}

        {currentView === 'register' && !isAuthenticated && (
          <div className="auth-required">
            <h2>Authentication Required</h2>
            <p>Please login with Internet Identity to create a profile.</p>
            <button onClick={handleLogin} className="login-btn">
              Login with Internet Identity
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
