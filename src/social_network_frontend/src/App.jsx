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
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'register', 'feed', 'create-post', 'users', 'profile', 'user-view', 'admin-dashboard'
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [previousView, setPreviousView] = useState('feed'); // Track previous view for back navigation

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

  // Handler for viewing other users (separate from main profile)
  const handleUserSelect = (user) => {
    console.log('👤 USER_SELECT: Viewing user:', user.username);
    setPreviousView(currentView);
    setSelectedUser(user);
    setCurrentView('user-view');
  };

  // Handler for going back from user view
  const handleBackToFeed = () => {
    console.log('🔙 BACK: Returning to previous view:', previousView);
    setCurrentView(previousView);
    setSelectedUser(userProfile); // Reset to current user's profile
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
              <div className="logo">
                <div className="logo-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span className="logo-text">Social Net</span>
              </div>
            </div>
            <div className="nav-links">
              <button
                onClick={() => setCurrentView('feed')}
                className={currentView === 'feed' ? 'active' : ''}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.5rem' }}>
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" />
                  <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2" />
                </svg>
                Home
              </button>
              <button
                onClick={() => setCurrentView('users')}
                className={currentView === 'users' ? 'active' : ''}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.5rem' }}>
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" />
                </svg>
                Discover
              </button>
              <button
                onClick={() => setCurrentView('create-post')}
                className={currentView === 'create-post' ? 'active' : ''}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.5rem' }}>
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" />
                  <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" />
                </svg>
                Create
              </button>
              <button
                onClick={() => setCurrentView('profile')}
                className={currentView === 'profile' ? 'active' : ''}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.5rem' }}>
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                </svg>
                Profile
              </button>
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin-dashboard')}
                  className={currentView === 'admin-dashboard' ? 'active' : ''}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.5rem' }}>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2569 9.77251 19.9859C9.5799 19.7148 9.31074 19.5063 9 19.38C8.69838 19.2469 8.36381 19.2072 8.03941 19.266C7.71502 19.3248 7.41568 19.4795 7.18 19.71L7.12 19.77C6.93425 19.956 6.71368 20.1035 6.47088 20.2041C6.22808 20.3048 5.96783 20.3566 5.705 20.3566C5.44217 20.3566 5.18192 20.3048 4.93912 20.2041C4.69632 20.1035 4.47575 19.956 4.29 19.77C4.10405 19.5843 3.95653 19.3637 3.85588 19.1209C3.75523 18.8781 3.70343 18.6178 3.70343 18.355C3.70343 18.0922 3.75523 17.8319 3.85588 17.5891C3.95653 17.3463 4.10405 17.1257 4.29 16.94L4.35 16.88C4.58054 16.6443 4.73519 16.345 4.794 16.0206C4.85282 15.6962 4.81312 15.3616 4.68 15.06C4.55324 14.7642 4.34276 14.512 4.07447 14.3343C3.80618 14.1566 3.49179 14.0613 3.17 14.06H3C2.46957 14.06 1.96086 13.8493 1.58579 13.4742C1.21071 13.0991 1 12.5904 1 12.06C1 11.5296 1.21071 11.0209 1.58579 10.6458C1.96086 10.2707 2.46957 10.06 3 10.06H3.09C3.42099 10.0523 3.742 9.94512 4.01309 9.75251C4.28417 9.5599 4.49268 9.29074 4.62 8.98C4.75312 8.67838 4.79282 8.34381 4.734 8.01941C4.67519 7.69502 4.52054 7.39568 4.29 7.16L4.23 7.1C4.04405 6.91425 3.89653 6.69368 3.79588 6.45088C3.69523 6.20808 3.64343 5.94783 3.64343 5.685C3.64343 5.42217 3.69523 5.16192 3.79588 4.91912C3.89653 4.67632 4.04405 4.45575 4.23 4.27C4.41575 4.08405 4.63632 3.93653 4.87912 3.83588C5.12192 3.73523 5.38217 3.68343 5.645 3.68343C5.90783 3.68343 6.16808 3.73523 6.41088 3.83588C6.65368 3.93653 6.87425 4.08405 7.06 4.27L7.12 4.33C7.35568 4.56054 7.65502 4.71519 7.97941 4.774C8.30381 4.83282 8.63838 4.79312 8.94 4.66H9C9.29577 4.53324 9.54802 4.32276 9.72569 4.05447C9.90337 3.78618 9.99872 3.47179 10 3.15V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Admin
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
                    onUserSelect={handleUserSelect}
                  />
                )}

                {currentView === 'users' && (
                  <UserList
                    currentUser={currentUser}
                    backendActor={getBackendActor()}
                    onUserSelect={handleUserSelect}
                    refreshTrigger={refreshTrigger}
                    isAuthenticated={isAuthenticated}
                  />
                )}

                {currentView === 'user-view' && selectedUser && (
                  <div className="user-view-container">
                    <div className="user-view-header">
                      <button onClick={handleBackToFeed} className="back-btn">
                        ← Back to {previousView === 'feed' ? 'Feed' : previousView === 'users' ? 'Discover' : 'Previous'}
                      </button>
                      <h2>👤 User Profile</h2>
                    </div>
                    <UserProfile
                      userId={selectedUser.user_id}
                      userData={selectedUser}
                      isCurrentUser={false}
                      currentUser={currentUser}
                      backendActor={getBackendActor()}
                      onUserUpdated={() => {
                        // Refresh the user data when viewing someone else's profile
                        setRefreshTrigger(prev => prev + 1);
                      }}
                    />
                  </div>
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
