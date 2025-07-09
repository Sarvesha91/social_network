import { useState, useEffect } from "react";
import { AuthClient } from '@dfinity/auth-client';
import { social_network_backend, createActor } from 'declarations/social_network_backend';
import { canisterId } from 'declarations/social_network_backend';
import LandingPage from './components/LandingPage';
import UserRegistration from './components/UserRegistration';
import PostList from './components/PostList';
import PostForm from './components/PostForm';
import UserList from './components/UserList';
import UserProfile from './components/UserProfile';
import AdminDashboard from './components/AdminDashboard';
import NewsFeed from './components/NewsFeed';

function App() {
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false); // Track if user clicked signup
  const [authenticatedActor, setAuthenticatedActor] = useState(null); // Authenticated backend actor

  // App state
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'register', 'feed', 'create-post', 'users', 'profile', 'admin-dashboard'
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    initAuth();
  }, []);

  // Helper function to get the correct backend actor (authenticated or anonymous)
  const getBackendActor = () => {
    return authenticatedActor || social_network_backend;
  };



  // Create authenticated actor when user logs in
  const createAuthenticatedActor = async (identity) => {
    try {
      console.log('🔧 Creating authenticated actor with identity:', identity.getPrincipal().toString());
      const actor = createActor(canisterId, {
        agentOptions: {
          identity,
          host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://localhost:4943",
        },
      });
      setAuthenticatedActor(actor);
      console.log('🔧 Authenticated actor created successfully');
      return actor;
    } catch (error) {
      console.error('🔧 Error creating authenticated actor:', error);
      return null;
    }
  };

  // Check user profile when authentication state changes
  useEffect(() => {
    const checkUserProfile = async () => {
      console.log('👤 PROFILE_CHECK: useEffect triggered');
      console.log('👤 PROFILE_CHECK: isAuthenticated:', isAuthenticated);
      console.log('👤 PROFILE_CHECK: currentUser:', currentUser?.toString());
      console.log('👤 PROFILE_CHECK: userProfile:', userProfile);
      console.log('👤 PROFILE_CHECK: isSigningUp:', isSigningUp);
      console.log('👤 PROFILE_CHECK: authenticatedActor:', authenticatedActor ? 'exists' : 'null');

      if (isAuthenticated && currentUser && !userProfile) {
        console.log('👤 PROFILE_CHECK: Conditions met, checking profile for user:', currentUser.toString());

        // Wait a bit for authenticated actor to be ready
        if (!authenticatedActor) {
          console.log('👤 PROFILE_CHECK: Waiting for authenticated actor...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
          const backendActor = getBackendActor();
          console.log('👤 PROFILE_CHECK: Using actor:', backendActor === authenticatedActor ? 'authenticated' : 'anonymous');

          const profile = await backendActor.get_user(currentUser);
          console.log('👤 PROFILE_CHECK: Profile result:', profile);
          console.log('👤 PROFILE_CHECK: Type of profile:', typeof profile);
          console.log('👤 PROFILE_CHECK: Is array?', Array.isArray(profile));

          // Handle Candid Option<T> response - can be [user_object] or [] or null
          let userProfile = null;
          let hasProfile = false;

          if (Array.isArray(profile) && profile.length > 0) {
            userProfile = profile[0];
            hasProfile = userProfile && userProfile.user_id;
            console.log('👤 PROFILE_CHECK: Found profile in array:', userProfile);
          } else if (profile && typeof profile === 'object' && profile.user_id) {
            userProfile = profile;
            hasProfile = true;
            console.log('👤 PROFILE_CHECK: Found profile as object:', userProfile);
          }

          console.log('👤 PROFILE_CHECK: hasProfile:', hasProfile);

          if (hasProfile) {
            console.log('👤 PROFILE_CHECK: Profile found, setting up main app');

            console.log('👤 PROFILE_CHECK: Profile found, setting up main app');
            setUserProfile(userProfile);
            setSelectedUser(userProfile);

            if (currentView === 'landing' || currentView === 'register') {
              setCurrentView('feed');
            }
            setAuthError(''); // Clear any previous errors

            if (isSigningUp) {
              setAuthError('Welcome back! You already have an account.');
              setTimeout(() => setAuthError(''), 3000);
            }
          } else {
            // No profile found for this principal
            console.log('PROFILE_CHECK: No profile found for this principal');
            if (isSigningUp) {
              console.log('PROFILE_CHECK: User is signing up, showing registration');
              setCurrentView('register');
              setAuthError('');
            } else {
              console.log('PROFILE_CHECK: User is logging in but has no profile');
              setAuthError('No account found for this identity. Please sign up first.');
              await handleLogout();
            }
          }

        } catch (error) {
          console.error('PROFILE_CHECK: Error checking profile:', error);
          console.error('👤 PROFILE_CHECK: Error details:', error.message);
          console.error('👤 PROFILE_CHECK: Error stack:', error.stack);

          if (isSigningUp) {
            console.log('👤 PROFILE_CHECK: Error during signup, showing registration form');
            setCurrentView('register'); // Default to registration for signup
            setAuthError('');
          } else {
            console.log('👤 PROFILE_CHECK: Error during login, showing error');
            setAuthError('Error checking account. Please try again.');
            setCurrentView('landing');
          }
        }
      }
    };

    checkUserProfile();
  }, [isAuthenticated, currentUser, userProfile, isSigningUp, authenticatedActor]);

  // Check admin status when user profile is available
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isAuthenticated && currentUser && userProfile) {
        try {
          const adminResult = await social_network_backend.is_caller_admin();
          setIsAdmin(adminResult);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
    };
    checkAdminStatus();
  }, [isAuthenticated, currentUser, userProfile]);

  const initAuth = async () => {
    try {
      console.log('🔐 INIT_AUTH: Starting authentication initialization...');
      const client = await AuthClient.create();
      setAuthClient(client);
      console.log('🔐 INIT_AUTH: AuthClient created successfully');

      const authenticated = await client.isAuthenticated();
      setIsAuthenticated(authenticated);
      console.log('🔐 INIT_AUTH: Authentication status:', authenticated);

      if (authenticated) {
        const identity = client.getIdentity();
        const principal = identity.getPrincipal();
        console.log('🔐 INIT_AUTH: User already authenticated with principal:', principal.toString());

        // Create authenticated actor first
        console.log('🔐 INIT_AUTH: Creating authenticated actor...');
        await createAuthenticatedActor(identity);

        // Then set the state
        setCurrentUser(principal);
        console.log('🔐 INIT_AUTH: This should trigger profile check useEffect');
      } else {
        console.log('🔐 INIT_AUTH: User not authenticated, showing landing page');
      }
    } catch (error) {
      console.error('🔐 INIT_AUTH: Authentication initialization error:', error);
      setAuthError('Failed to initialize authentication.');
    } finally {
      setIsLoading(false);
      console.log('🔐 INIT_AUTH: Initialization complete, isLoading set to false');
    }
  };

  const handleLogin = async () => {
    if (!authClient) {
      setAuthError('Please wait for the app to load completely.');
      return;
    }

    try {
      setAuthError('');
      setIsSigningUp(false); // This is a LOGIN
      console.log('Starting LOGIN...');

      const iiCanisterId = import.meta.env.CANISTER_ID_INTERNET_IDENTITY || 'bkyz2-fmaaa-aaaaa-qaaaq-cai';

      await authClient.login({
        identityProvider: `http://${iiCanisterId}.localhost:4943/`,
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
        windowOpenerFeatures: 'toolbar=0,location=0,menubar=0,width=500,height=500,left=100,top=100',
        onSuccess: async () => {
          try {
            console.log('🔑 LOGIN: Authentication successful');

            const identity = authClient.getIdentity();
            const principal = identity.getPrincipal();
            console.log('🔑 LOGIN: Got principal:', principal.toString());

            // Create authenticated actor first
            console.log('🔑 LOGIN: Creating authenticated actor...');
            const actor = await createAuthenticatedActor(identity);

            if (!actor) {
              throw new Error('Failed to create authenticated actor');
            }

            // Then set the state
            setIsAuthenticated(true);
            setIsSigningUp(false); // This was a login attempt
            setCurrentUser(principal);

            console.log('🔑 LOGIN: State set, this should trigger profile check useEffect');

            // Profile checking will be handled by useEffect
          } catch (error) {
            console.error('🔑 LOGIN: Error in onSuccess:', error);
            setAuthError('Login failed. Please try again.');
          }
        },
        onError: (error) => {
          console.error('Login failed:', error);
          setAuthError('Login failed. Please try again.');
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Failed to start login process.');
    }
  };

  const handleSignup = async () => {
    if (!authClient) {
      setAuthError('Please wait for the app to load completely.');
      return;
    }

    try {
      setAuthError('');
      setIsSigningUp(true); // This is a SIGNUP
      console.log('Starting SIGNUP...');

      const iiCanisterId = import.meta.env.CANISTER_ID_INTERNET_IDENTITY || 'bkyz2-fmaaa-aaaaa-qaaaq-cai';

      await authClient.login({
        identityProvider: `http://${iiCanisterId}.localhost:4943/`,
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000),
        windowOpenerFeatures: 'toolbar=0,location=0,menubar=0,width=500,height=500,left=100,top=100',
        onSuccess: async () => {
          try {
            console.log('📝 SIGNUP: Authentication successful');

            const identity = authClient.getIdentity();
            const principal = identity.getPrincipal();
            console.log('📝 SIGNUP: Got principal:', principal.toString());

            // Create authenticated actor first
            console.log('📝 SIGNUP: Creating authenticated actor...');
            const actor = await createAuthenticatedActor(identity);

            if (!actor) {
              throw new Error('Failed to create authenticated actor');
            }

            // Then set the state
            setIsAuthenticated(true);
            setIsSigningUp(true); // This was a signup attempt
            setCurrentUser(principal);

            console.log('📝 SIGNUP: State set, this should trigger profile check useEffect');

            // Profile checking will be handled by useEffect
          } catch (error) {
            console.error('📝 SIGNUP: Error in onSuccess:', error);
            setAuthError('Signup failed. Please try again.');
          }
        },
        onError: (error) => {
          console.error('Signup failed:', error);
          setAuthError('Signup failed. Please try again.');
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError('Failed to start signup process.');
    }
  };

  const handleLogout = async () => {
    if (!authClient) return;
    await authClient.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserProfile(null);
    setSelectedUser(null);
    setSelectedPost(null);
    setCurrentView('landing');
    setAuthError('');
    setIsAdmin(false);
    setIsSigningUp(false);
    setAuthenticatedActor(null); // Clear authenticated actor
    console.log('🚪 LOGOUT: Cleared all state including authenticated actor');
  };

  const handleUserCreated = async () => {
    console.log('USER_CREATED: Starting handleUserCreated');
    setRefreshTrigger(prev => prev + 1);

    if (currentUser) {
      try {
        // Add a small delay to ensure backend has processed the user creation
        await new Promise(resolve => setTimeout(resolve, 500));

        const backendActor = getBackendActor();
        console.log('USER_CREATED: Using actor:', backendActor === authenticatedActor ? 'authenticated' : 'anonymous');
        const userResult = await backendActor.get_user(currentUser);
        console.log('USER_CREATED: Fetched user profile:', userResult);
        console.log('USER_CREATED: Type of userResult:', typeof userResult);
        console.log('USER_CREATED: Is array?', Array.isArray(userResult));

        // Handle Candid Option<T> response - can be [user_object] or [] or null
        let userProfile = null;

        if (Array.isArray(userResult) && userResult.length > 0) {
          userProfile = userResult[0];
          console.log('USER_CREATED: Found profile in array:', userProfile);
        } else if (userResult && typeof userResult === 'object' && userResult.user_id) {
          userProfile = userResult;
          console.log('USER_CREATED: Found profile as object:', userProfile);
        }

        if (userProfile && userProfile.user_id) {
          console.log('USER_CREATED: Valid profile found');
          setUserProfile(userProfile);
          setSelectedUser(userProfile);
          setCurrentView('feed'); // Go to main app after profile creation
          setAuthError(''); // Clear any previous errors
          console.log('USER_CREATED: Profile set, navigating to feed');
        } else {
          console.error('USER_CREATED: No valid profile found after creation');
          console.error('USER_CREATED: userResult:', userResult);
          setAuthError('Error: Profile was not created properly. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching user after creation:', error);
        setAuthError('Error loading your profile. Please try logging in again.');
      }
    } else {
      console.error('USER_CREATED: No currentUser available');
      setAuthError('Authentication error. Please try logging in again.');
    }
  };

  // Show loading during initialization
  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>🌐 Social Network</h2>
        <p>Loading...</p>
      </div>
    );
  }

  // Main app rendering based on currentView
  if (isAuthenticated && currentUser) {
    console.log('RENDER: isAuthenticated=true, currentUser=', currentUser.toString());
    console.log('RENDER: currentView=', currentView);
    console.log('RENDER: userProfile=', userProfile);

    // Profile creation view for new users
    if (currentView === 'register') {
      console.log('RENDER: Showing UserRegistration component');
      return (
        <div className="app">
          <UserRegistration
            onUserCreated={handleUserCreated}
            backendActor={getBackendActor()}
          />
        </div>
      );
    }

    // Main app views (only accessible with a profile)
    if (userProfile) {
      console.log('RENDER: User has profile, showing main app with currentView:', currentView);

      return (
        <div className="app">
          {/* Navigation Header */}
          <nav className="main-nav">
            <div className="nav-brand">
              <h1>🌐 Social Net</h1>
            </div>
            <div className="nav-links">
              <button
                onClick={() => setCurrentView('feed')}
                className={currentView === 'feed' ? 'active' : ''}
              >
                🏠 Home
              </button>
              <button
                onClick={() => setCurrentView('users')}
                className={currentView === 'users' ? 'active' : ''}
              >
                👥 Discover
              </button>
              <button
                onClick={() => setCurrentView('create-post')}
                className={currentView === 'create-post' ? 'active' : ''}
              >
                ✏️ Create
              </button>
              <button
                onClick={() => setCurrentView('profile')}
                className={currentView === 'profile' ? 'active' : ''}
              >
                👤 Profile
              </button>
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin-dashboard')}
                  className={currentView === 'admin-dashboard' ? 'active' : ''}
                >
                  ⚙️ Admin
                </button>
              )}
              <button onClick={handleLogout} className="logout-btn">
                🚪 Logout
              </button>
            </div>
          </nav>

          {/* Main Content */}
          <main className="main-content">
            <div className="content-layout">
              <div className="main-section">
                {currentView === 'feed' && (
                  <PostList
                    currentUser={currentUser}
                    isAuthenticated={isAuthenticated}
                    refreshTrigger={refreshTrigger}
                    backendActor={getBackendActor()}
                    onPostSelect={(post) => {
                      setSelectedPost(post);
                      setCurrentView('create-post');
                    }}
                  />
                )}

                {currentView === 'users' && (
                  <UserList
                    currentUser={currentUser}
                    backendActor={getBackendActor()}
                    onUserSelect={(user) => {
                      setSelectedUser(user);
                      setCurrentView('profile');
                    }}
                  />
                )}

                {currentView === 'create-post' && (
                  <PostForm
                    currentUser={currentUser}
                    selectedPost={selectedPost}
                    backendActor={getBackendActor()}
                    onPostCreated={() => {
                      setRefreshTrigger(prev => prev + 1);
                      setSelectedPost(null);
                      setCurrentView('feed');
                    }}
                    onCancel={() => {
                      setSelectedPost(null);
                      setCurrentView('feed');
                    }}
                  />
                )}

                {currentView === 'profile' && (
                  <UserProfile
                    userId={currentUser}
                    userData={userProfile}
                    isCurrentUser={true}
                    backendActor={getBackendActor()}
                    onUserUpdated={async (updatedUserData) => {
                      // Update the local userProfile state with the new data
                      if (updatedUserData) {
                        setUserProfile(updatedUserData);
                        setSelectedUser(updatedUserData);
                      } else {
                        // Fallback: get the updated user data from backend using authenticated actor
                        try {
                          const backendActor = getBackendActor();
                          const userResult = await backendActor.get_user(currentUser);
                          if (userResult && typeof userResult === 'object' && userResult.user_id) {
                            setUserProfile(userResult);
                            setSelectedUser(userResult);
                          }
                        } catch (error) {
                          console.error('Error refreshing profile after update:', error);
                        }
                      }
                      setRefreshTrigger(prev => prev + 1);
                    }}
                  />
                )}

                {currentView === 'admin-dashboard' && isAdmin && (
                  <AdminDashboard
                    currentUser={currentUser}
                    backendActor={getBackendActor()}
                    onUserSelect={(user) => {
                      setSelectedUser(user);
                      setCurrentView('profile');
                    }}
                  />
                )}
              </div>

              {/* Sidebar with News Feed */}
              <div className="sidebar-section">
                <NewsFeed userInterests={userProfile?.hashtags || []} />
              </div>
            </div>
          </main>
        </div>
      );
    }

    // User is authenticated but has no profile - this shouldn't happen with proper flow
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>⚠️ Profile Required</h2>
        <p>You are authenticated but don't have a profile.</p>
        <p>This shouldn't happen with the normal flow.</p>
        <button onClick={handleLogout}>
          Logout and Try Again
        </button>
      </div>
    );
  }

  // Show landing page if not authenticated
  return (
    <div className="app">
      <LandingPage
        onLogin={handleLogin}
        onSignup={handleSignup}
        authError={authError}
      />
    </div>
  );
}

export default App;
