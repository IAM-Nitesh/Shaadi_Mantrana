import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  getIdToken,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface User {
  userId: string;
  userUuid?: string;
  email: string;
  role: string;
  verified: boolean;
  profileCompleteness?: number;
  isFirstLogin?: boolean;
  isApprovedByAdmin?: boolean;
  hasSeenOnboardingMessage?: boolean;
  phoneNumber?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  redirectTo: string | null;
  authState: 'unknown' | 'authenticated' | 'unauthenticated' | 'checking' | 'error';
  isExpired: boolean;
  login: (email: string, otp: string) => Promise<boolean>;
  sendOtp: (email: string) => Promise<boolean>;
  signInWithPhone: (phoneNumber: string) => Promise<ConfirmationResult | null>;
  confirmPhoneCode: (confirmationResult: ConfirmationResult, code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ 
  children, 
  initialUser = null 
}: { 
  children: React.ReactNode; 
  initialUser?: User | null; 
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthContextType['authState']>('unknown');
  const [isExpired, setIsExpired] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setAuthState('checking');
      logger.debug('🔍 AuthContext: Checking authentication status...');
      
      // Use HttpOnly cookies for authentication (no client-side token storage)
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
        credentials: 'include',
        cache: 'no-store',
        headers
      });
      
      logger.debug('🔍 AuthContext: Auth status response:', {
        status: response.status,
        ok: response.ok
      });
      
      if (!response.ok) {
        logger.warn('❌ AuthContext: Auth status check failed:', response.status);
        setUser(null);
        setRedirectTo('/login');
        setIsExpired(response.status === 401);
        setAuthState('unauthenticated');
        return;
      }
      
      const data = await response.json();
      logger.debug('🔍 AuthContext: Auth status data:', data);
      
      if (data.authenticated && data.user) {
        const userData = {
          userId: data.user.userId || data.user._id || '',
          userUuid: data.user.userUuid || data.user.uuid || data.user.userId || data.user._id || '',
          email: data.user.email || '',
          role: data.user.role || 'user',
          verified: true,
          profileCompleteness: data.user.profileCompleteness || 0,
          isFirstLogin: data.user.isFirstLogin || false,
          isApprovedByAdmin: data.user.isApprovedByAdmin || false,
          hasSeenOnboardingMessage: data.user.hasSeenOnboardingMessage || false,
        };
        
        logger.info('✅ AuthContext: User authenticated:', userData);
        setUser(userData);
        
        // Set redirect based on business logic
        if (userData.role === 'admin') {
          // Admin users always go to admin dashboard
          setRedirectTo('/admin/dashboard');
        } else if (userData.profileCompleteness < 100 || userData.isFirstLogin) {
          // Users with incomplete profile or first login must complete it first
          setRedirectTo('/profile');
        } else {
          // Users with 100% profile completion can access dashboard
          setRedirectTo('/dashboard');
        }
        setIsExpired(false);
        setAuthState('authenticated');
      } else {
        logger.debug('❌ AuthContext: User not authenticated');
        setUser(null);
        setRedirectTo('/login');
        setIsExpired(false);
        setAuthState('unauthenticated');
      }
    } catch (err) {
      logger.error('❌ AuthContext: Auth check error:', err);
      setUser(null);
      setRedirectTo('/login');
      setAuthState('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forceRefresh = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!initialUser) {
      checkAuth();
    } else {
      setIsLoading(false);
      // Set redirect based on business logic
      if (initialUser.role === 'admin') {
        // Admin users always go to admin dashboard
        setRedirectTo('/admin/dashboard');
      } else if ((initialUser.profileCompleteness || 0) < 100) {
        // Users with incomplete profile must complete it first
        setRedirectTo('/profile');
      } else {
        // Users with 100% profile completion can access dashboard
        setRedirectTo('/dashboard');
      }
    }
  }, [initialUser, checkAuth]);

  const sendOtp = async (email: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to send OTP');
        return false;
      }
      return true;
    } catch (err) {
      setError('Failed to send OTP');
      return false;
    }
  };

  const login = async (email: string, otp: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      logger.debug('🔍 AuthContext: Starting OTP verification for:', email);

      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      logger.debug('🔍 AuthContext: OTP verification response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (!response.ok) {
        logger.error('❌ AuthContext: OTP verification failed:', data);
        setError(data.error || data.message || 'Invalid OTP');
        return false;
      }

      if (!data.success) {
        logger.error('❌ AuthContext: Backend returned success: false:', data);
        setError(data.error || data.message || 'Authentication failed');
        return false;
      }

      logger.info('✅ AuthContext: OTP verification successful, storing token and checking auth status...');
      logger.debug('🔍 AuthContext: Response data keys:', Object.keys(data));
      logger.debug('🔍 AuthContext: accessToken present:', !!data.accessToken);
      logger.debug('🔍 AuthContext: session object:', data.session);

      // Token should be handled by HttpOnly cookies from backend
      if (!data.accessToken) {
        logger.warn('❌ AuthContext: No accessToken found in response');
      }

      // After successful OTP verification, check auth status to get user data
      await checkAuth();
      return true;
    } catch (err) {
      logger.error('❌ AuthContext: Login error:', err);
      setError('Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber: string): Promise<ConfirmationResult | null> => {
    try {
      setError(null);
      
      // Initialize reCAPTCHA - ensure we have a container in the DOM
      // For mobile apps, invisible reCAPTCHA is best
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      logger.info('✅ Firebase: OTP sent to', phoneNumber);
      return confirmationResult;
    } catch (err: any) {
      logger.error('❌ Firebase Phone Auth Error:', err);
      setError(err.message || 'Failed to send OTP');
      return null;
    }
  };

  const confirmPhoneCode = async (confirmationResult: ConfirmationResult, code: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await confirmationResult.confirm(code);
      const fbUser = result.user;
      const idToken = await getIdToken(fbUser);

      logger.info('✅ Firebase: Code confirmed, syncing with backend...');

      // Send ID Token to our backend
      const response = await fetch(`${API_BASE_URL}/api/auth/firebase-login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        logger.error('❌ AuthContext: Firebase sync failed:', data);
        setError(data.error || 'Failed to sync with server');
        return false;
      }

      logger.info('✅ AuthContext: Firebase login successful');
      await checkAuth();
      return true;
    } catch (err: any) {
      logger.error('❌ Firebase Code Confirmation Error:', err);
      setError(err.message || 'Invalid verification code');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Sign out from our backend
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      logger.error('Logout error:', err);
    } finally {
      // Clear user state (token handled by HttpOnly cookies)
      setUser(null);
      setRedirectTo('/login');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    redirectTo,
    authState,
    isExpired,
    login,
    sendOtp,
    signInWithPhone,
    confirmPhoneCode,
    logout,
    checkAuth,
    forceRefresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
