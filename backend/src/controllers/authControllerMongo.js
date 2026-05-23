// MongoDB-integrated Auth Controller
// Simplified version using MongoDB User model

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validateEmail, sanitizeInput, hashPassword, verifyPassword, generateSessionToken } = require('../utils/security');
const config = require('../config');

const emailService = require('../services/emailService');
const { JWTSessionManager } = require('../middleware/auth');
const { User } = require('../models');
const { verifyIdToken } = require('../services/firebaseService');

const { logger } = require('../utils/pino-logger');
const AUTH_DEBUG = process.env.AUTH_DEBUG === 'true' || process.env.NODE_ENV !== 'production';

function getCookieOptions(req, options = {}) {
  // Use direct process.env.NODE_ENV evaluation so CodeQL static analysis 
  // explicitly recognizes the development exception heuristic.
  const isProdEnv = process.env.NODE_ENV === 'production';
  
  // IMPORTANT: SameSite Cookie Configuration
  // - Frontend: Vercel (shaadimantrana.app)
  // - Backend: Render (different domain)
  // - Production uses 'none' because frontend and backend are on DIFFERENT domains
  // - Development uses 'lax' (same-origin: localhost:3000 and localhost:5500)
  // - 'none' requires secure:true (HTTPS only)
  
  return {
    httpOnly: true,           // Prevents XSS attacks
    secure: isProdEnv,        // HTTPS-only in production, CodeQL friendly check
    sameSite: isProdEnv ? 'none' : 'lax',  // 'none' for cross-site (Vercel->Render)
    path: '/',
    ...options
  };
}

// Session management - use JWTSessionManager's activeSessions
// const sessions = new Map(); // Removed - using JWTSessionManager.activeSessions instead

// OTP store with expiration (use Redis in production)
const otpStore = require('../utils/otpStorage');

// Ensure otpStore is properly initialized
if (!otpStore || typeof otpStore.size !== 'function') {
  logger.error('❌ OTP Storage not properly initialized!');
  throw new Error('OTP Storage initialization failed');
}

// Simple rate limiting (use Redis in production)
const rateLimitStore = new Map();

// Security Utils
const SecurityUtils = {
  validateEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  sanitizeInput: (input) => {
    if (!input || typeof input !== 'string') return '';
    return input.trim().toLowerCase().replace(/[<>\"'&]/g, '').substring(0, 255);
  },

  generateSecureOTP: () => {
    return Math.floor(100000 + crypto.randomInt(900000)).toString();
  },

  getClientIP: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           '127.0.0.1';
  },

  checkRateLimit: (key, limit, windowMs, action = 'request') => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }
    
    const attempts = rateLimitStore.get(key);
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);
    
    if (recentAttempts.length >= limit) {
      const oldestAttempt = Math.min(...recentAttempts);
      const retryAfter = Math.ceil((oldestAttempt + windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }
    
    recentAttempts.push(now);
    rateLimitStore.set(key, recentAttempts);
    return { allowed: true, remaining: limit - recentAttempts.length };
  },

  // Store OTP with expiration
  storeOTP: (email, otp, clientInfo = {}) => {
    // Consistent 10-minute expiration for all environments
    const expirationMinutes = 10;
    const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
    
    otpStore.set(email, {
      otp,
      expiresAt: expirationTime,
      attempts: 0,
      clientInfo,
      createdAt: Date.now()
    });
    if (AUTH_DEBUG) logger.debug({ event: 'store_otp', email, expiresInMinutes: expirationMinutes, otp }, 'Storing OTP');
    if (AUTH_DEBUG) logger.debug({ storeSize: otpStore.size() }, 'Current OTP store size');
  },

  // Verify OTP
  verifyOTP: (email, otp) => {
  if (AUTH_DEBUG) logger.debug({ event: 'verify_otp_start', email, storeSize: otpStore.size() }, 'Verifying OTP');
    const stored = otpStore.get(email);
    if (!stored) {
      return { valid: false, reason: 'OTP not found or expired' };
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email);
      return { valid: false, reason: 'OTP expired' };
    }

    if (stored.attempts >= 3) {
      otpStore.delete(email);
      return { valid: false, reason: 'Too many attempts' };
    }

    if (stored.otp !== otp) {
      stored.attempts++;
      otpStore.set(email, stored); // Update attempts count
      return { valid: false, reason: 'Invalid OTP' };
    }

    otpStore.delete(email);
    return { valid: true };
  }
};

class AuthController {
  // Login with Firebase ID Token
  // Login with Firebase ID Token (Phone Auth)
  // This is the primary anchor for Play Store compliance
  async firebaseLogin(req, res) {
    try {
      const { idToken, fcmToken } = req.body;
      const { verifyIdToken } = require('../services/firebaseService');
      const { JWTSessionManager } = require('../middleware/auth');

      if (!idToken) {
        return res.status(400).json({
          success: false,
          error: 'Firebase ID Token is required'
        });
      }

      // 1. Verify token with Firebase
      let decodedToken;
      try {
        decodedToken = await verifyIdToken(idToken);
      } catch (error) {
        logger.error({ event: 'firebase_token_failed', err: error.message }, 'Firebase token verification failed');
        return res.status(401).json({
          success: false,
          error: 'Invalid Firebase token'
        });
      }

      const { uid, email, phone_number, name, picture } = decodedToken;
      const clientIP = SecurityUtils.getClientIP(req);

      if (!uid || (!phone_number && !email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Firebase token: Missing UID, Phone Number, or Email'
        });
      }

      // 2. Find or Create User
      // Priority: firebaseUid > phoneNumber > email
      let user = await User.findOne({ 
        $or: [
          { firebaseUid: uid },
          ...(phone_number ? [{ phoneNumber: phone_number }] : []),
          ...(email ? [{ email: email.toLowerCase() }] : [])
        ]
      });

      if (!user) {
        // Create new user for first-time login
        const { v4: uuidv4 } = require('uuid');
        user = new User({
          userUuid: uuidv4(),
          firebaseUid: uid,
          phoneNumber: phone_number,
          email: email ? email.toLowerCase() : undefined, // Optional email metadata, no artificial fallback
          status: 'active',
          role: 'user',
          isFirstLogin: true,
          verification: {
            isVerified: true, // Verified via Firebase
            verifiedAt: new Date()
          },
          profile: {
            name: name || '',
            images: picture ? [picture] : [],
            profileCompleteness: 0
          },
          photoStatus: 'pending' // Play Store compliance: Force moderation
        });
        await user.save();
        logger.info({ event: 'firebase_user_created', uid, phone: phone_number, email }, 'New Firebase user created');
      } else {
        // Update existing user with Firebase info if missing
        let updated = false;
        if (!user.firebaseUid) { user.firebaseUid = uid; updated = true; }
        if (phone_number && !user.phoneNumber) { user.phoneNumber = phone_number; updated = true; }
        if (email && !user.email) { user.email = email.toLowerCase(); updated = true; }
        if (user.status === 'invited') { user.status = 'active'; updated = true; }
        
        if (updated) {
          await user.save();
          logger.info({ event: 'account_linked', email: user.email, uid }, 'Updated existing account with Firebase info');
        }
      }

      // Update FCM token if provided
      if (fcmToken) {
        user.fcmToken = fcmToken;
        await user.save();
      }

      // Update last login info
      user.lastActive = new Date();
      user.lastLogin = {
        timestamp: new Date(),
        ipAddress: clientIP,
        userAgent: req.headers['user-agent'],
        deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 
                   req.headers['user-agent']?.includes('Tablet') ? 'tablet' : 'desktop'
      };
      await user.save();

      // 3. Create JWT Session
      const session = await JWTSessionManager.createSession(user);
      
      const userData = user.toPublicJSON();
      const isAdminUser = user.role === 'admin';
      const completeness = user.profile?.profileCompleteness || 0;
      
      const redirectTo = isAdminUser
        ? '/admin/dashboard'
        : (user.isFirstLogin && !user.hasCompletedWizard)
          ? '/profile'
          : '/dashboard';


      const responseData = {
        success: true,
        message: 'Firebase login successful',
        accessToken: session.accessToken,
        user: {
          ...userData,
          profileCompleteness: completeness,
          isFirstLogin: user.isFirstLogin
        },
        redirectTo,
        session: {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresIn: session.expiresIn,
          sessionId: session.sessionId
        }
      };

      // 4. Set Cookies
      const cookieMaxAge = isAdminUser ? 90 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      const cookieOptions = getCookieOptions(req, { maxAge: cookieMaxAge });
      
      res.cookie('accessToken', session.accessToken, cookieOptions);
      res.cookie('refreshToken', session.refreshToken, getCookieOptions(req, { 
        maxAge: isAdminUser ? 180 * 24 * 60 * 60 * 1000 : 90 * 24 * 60 * 60 * 1000 
      }));
      res.cookie('sessionId', session.sessionId, cookieOptions);

      res.status(200).json(responseData);

    } catch (error) {
      logger.error({ event: 'firebase_login_error', err: error.message }, 'Firebase login error');
      res.status(500).json({
        success: false,
        error: 'Failed to process Firebase login: ' + (error.message || 'Internal error')
      });
    }
  }

  // Deprecated legacy email OTP endpoint - replaced by Firebase Phone Auth
  async sendOTP(req, res) {
    logger.warn({ event: 'deprecated_email_otp_attempt', email: req.body && req.body.email }, 'Attempted legacy email OTP login');
    return res.status(410).json({
      success: false,
      error: 'Legacy email OTP authentication is deprecated. Please use Firebase Phone OTP to sign in.'
    });
  }

  // Deprecated legacy email verification endpoint - replaced by Firebase Phone Auth
  async verifyOTP(req, res) {
    logger.warn({ event: 'deprecated_email_verify_attempt', email: req.body && req.body.email }, 'Attempted legacy email OTP verification');
    return res.status(410).json({
      success: false,
      error: 'Legacy email OTP authentication is deprecated. Please use Firebase Phone OTP to sign in.'
    });
  }


  // Get current user profile
  async getProfile(req, res) {
    try {
      console.log('🔍 GetProfile: Starting profile request...');
      console.log('🔍 GetProfile: req.user:', req.user);
      
      const userId = req.user.userId;
      console.log('🔍 GetProfile: userId:', userId);
      
      const user = await User.findById(userId);
      console.log('🔍 GetProfile: User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        console.log('❌ GetProfile: User not found');
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      console.log('✅ GetProfile: User found, returning profile');
      res.status(200).json({
        success: true,
        user: user.toPublicJSON()
      });

    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  // Refresh session token
  async refreshSession(req, res) {
    try {
      let refreshToken = req.body.refreshToken;

      // If no refresh token in body, try cookies
      if (!refreshToken && req.cookies?.refreshToken) {
        refreshToken = req.cookies.refreshToken;
      }

      // If still no refresh token, try Authorization header (for frontend compatibility)
      if (!refreshToken && req.headers.authorization?.startsWith('Bearer ')) {
        // For refresh requests, the Authorization header might contain the access token
        // But we need the refresh token. Let's try to get it from the session
        try {
          const accessToken = req.headers.authorization.substring(7);
          const decoded = jwt.verify(accessToken, config.JWT.SECRET);
          const sessionData = JWTSessionManager.getSession(decoded.sessionId);
          if (sessionData?.refreshToken) {
            refreshToken = sessionData.refreshToken;
          }
        } catch (error) {
          console.log('Could not extract refresh token from access token');
        }
      }

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.JWT.SECRET);
      const sessionData = await JWTSessionManager.getSession(decoded.sessionId);

      if (!sessionData) {
        return res.status(401).json({
          success: false,
          error: 'Invalid session'
        });
      }

      // Update session lastAccessed time
      sessionData.lastAccessed = new Date();
      await JWTSessionManager.updateSessionLastAccessed(decoded.sessionId);

      // Generate new access token
      const payload = {
        userId: sessionData.userId,
        email: sessionData.email,
        sessionId: decoded.sessionId
      };

      const newAccessToken = jwt.sign(payload, config.JWT.SECRET, { 
        expiresIn: '24h',
        issuer: 'shaadi-mantra-api',
        audience: 'shaadi-mantra-app'
      });

      // Set new access token cookie with extended expiry
      const cookieOptions = getCookieOptions(req, { 
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days instead of 24 hours
      });

      res.cookie('accessToken', newAccessToken, cookieOptions);

      res.status(200).json({
        success: true,
        accessToken: newAccessToken,
        expiresIn: 86400
      });

    } catch (error) {
      console.error('❌ Refresh session error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      const sessionId = req.user?.sessionId;

      if (sessionId) {
        JWTSessionManager.revokeSession(sessionId);
        console.log(`✅ Session logged out: ${sessionId}`);
      }

      // Clear authentication cookies
      const cookieOptions = getCookieOptions(req);

      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);
      res.clearCookie('sessionId', cookieOptions);

      console.log('🍪 Cookies cleared for logout');

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to logout'
      });
    }
  }

  // Get auth status (returns profile when authenticated, otherwise authenticated:false)
  async getAuthStatus(req, res) {
    try {
      console.log('🔍 getAuthStatus: Starting auth status check...');
      console.log('🔍 getAuthStatus: Environment:', process.env.NODE_ENV);
      console.log('🔍 getAuthStatus: Request secure:', req.secure);
      console.log('🔍 getAuthStatus: X-Forwarded-Proto:', req.headers['x-forwarded-proto']);
      console.log('🔍 getAuthStatus: Cookies present:', !!req.cookies);
      console.log('🔍 getAuthStatus: Cookie keys:', req.cookies ? Object.keys(req.cookies) : 'None');
      console.log('🔍 getAuthStatus: Authorization header:', req.headers.authorization ? 'Present' : 'None');
      
      // Set comprehensive cache control headers to prevent any caching
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('ETag', `"${Date.now()}-${Math.random()}"`); // Unique ETag to prevent 304
      res.set('Last-Modified', new Date().toUTCString());

      // Get user from session token if available
      const authHeader = req.headers.authorization;
      let user = null;
      let token = null;

      // First try Authorization header
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('🔍 getAuthStatus: Using Authorization header token');
      }
      // Then try cookies
      else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
        console.log('🔍 getAuthStatus: Using cookie token');
      } else {
        console.log('🔍 getAuthStatus: No token found in headers or cookies');
      }

      if (token) {
        try {
          console.log('🔍 getAuthStatus: Verifying token...');
          const decoded = jwt.verify(token, config.JWT.SECRET, {
            issuer: config.JWT.ISSUER,
            audience: config.JWT.AUDIENCE
          });
          console.log('🔍 getAuthStatus: Token decoded successfully:', {
            userId: decoded.userId,
            sessionId: decoded.sessionId,
            email: decoded.email
          });
          
          const sessionData = await JWTSessionManager.getSession(decoded.sessionId);
          console.log('🔍 getAuthStatus: Session data found:', !!sessionData);

          if (sessionData) {
            // Update session lastAccessed time for TTL management
            await JWTSessionManager.updateSessionLastAccessed(decoded.sessionId);
            
            // Get full user data from database
            const dbUser = await User.findById(decoded.userId).select('-password');
            if (dbUser) {
              // Get profileCompleteness from the correct location
              const profileCompleteness = dbUser.profile?.profileCompleteness || dbUser.profileCompleteness || 0;
              
              user = {
                userUuid: dbUser._id.toString(),
                email: dbUser.email,
                role: dbUser.role,
                isFirstLogin: dbUser.isFirstLogin,
                isApprovedByAdmin: dbUser.isApprovedByAdmin,
                profileCompleteness: profileCompleteness,
                hasSeenOnboardingMessage: dbUser.hasSeenOnboardingMessage || false
              };
              console.log('✅ getAuthStatus: User authenticated successfully:', {
                email: user.email,
                role: user.role,
                isFirstLogin: user.isFirstLogin,
                isApprovedByAdmin: user.isApprovedByAdmin,
                profileCompleteness: profileCompleteness
              });
            } else {
              console.log('❌ getAuthStatus: User not found in database');
            }
          } else {
            console.log('❌ getAuthStatus: Session not found or invalid');
          }
        } catch (tokenError) {
          console.log('❌ getAuthStatus: Token verification failed:', tokenError.message);
        }
      }

      if (user) {
        // Determine redirect path based on business rules
        const isAdminUser = user.role === 'admin';
        const completeness = user.profileCompleteness || 0;
        const redirectTo = isAdminUser
          ? '/admin/dashboard'
          : (user.isFirstLogin || completeness < 100)
            ? '/profile'
            : '/dashboard';

        console.log('📤 getAuthStatus: Sending authentication response:', {
          authenticated: true,
          userRole: user.role,
          userEmail: user.email,
          redirectTo: redirectTo
        });
        return res.status(200).json({
          authenticated: true,
          user: user,
          redirectTo: redirectTo,
          timestamp: Date.now() // Add timestamp to ensure uniqueness
        });
      }

      // Not authenticated
      console.log('🔍 getAuthStatus: User not authenticated, returning anonymous status');
      return res.status(200).json({
        authenticated: false,
        redirectTo: '/',
        message: 'Not authenticated',
        timestamp: Date.now() // Add timestamp to ensure uniqueness
      });
    } catch (err) {
      console.error('❌ getAuthStatus: Error:', err);
      return res.status(500).json({ 
        authenticated: false, 
        redirectTo: '/',
        message: 'Internal server error' 
      });
    }
  }

  // Get token for frontend (extract from HTTP-only cookies)
  async getToken(req, res) {
    try {
      // Get user from session token if available
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, config.JWT.SECRET, {
            issuer: config.JWT.ISSUER,
            audience: config.JWT.AUDIENCE
          });
          const sessionData = await JWTSessionManager.getSession(decoded.sessionId);
          
          if (sessionData) {
            return res.status(200).json({
              success: true,
              token: token,
              expiresAt: decoded.exp * 1000 // Convert to milliseconds
            });
          }
        } catch (tokenError) {
          console.log('Token verification failed:', tokenError.message);
        }
      }

      // Try to get from accessToken cookie (primary method)
      const accessToken = req.cookies?.accessToken;
      if (accessToken) {
        try {
          const decoded = jwt.verify(accessToken, config.JWT.SECRET, {
            issuer: config.JWT.ISSUER,
            audience: config.JWT.AUDIENCE
          });
          const sessionData = await JWTSessionManager.getSession(decoded.sessionId);
          
          if (sessionData) {
            return res.status(200).json({
              success: true,
              token: accessToken,
              expiresAt: decoded.exp * 1000 // Convert to milliseconds
            });
          }
        } catch (tokenError) {
          console.log('Access token verification failed:', tokenError.message);
        }
      }

      // Try to get from sessionId cookie (fallback method)
      const sessionId = req.cookies?.sessionId;
      if (sessionId) {
        try {
          const sessionData = await JWTSessionManager.getSession(sessionId);
          
          if (sessionData) {
            // Generate a new access token from session data
            const payload = {
              userId: sessionData.userId,
              userUuid: sessionData.userUuid,
              email: sessionData.email,
              role: sessionData.role,
              verified: sessionData.verified,
              sessionId: sessionId,
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
              aud: 'shaadi-mantra-app',
              iss: 'shaadi-mantra-api'
            };

            const newAccessToken = jwt.sign(payload, config.JWT.SECRET, {
              issuer: config.JWT.ISSUER,
              audience: config.JWT.AUDIENCE
            });

            return res.status(200).json({
              success: true,
              token: newAccessToken,
              expiresAt: payload.exp * 1000 // Convert to milliseconds
            });
          }
        } catch (tokenError) {
          console.log('Session ID verification failed:', tokenError.message);
        }
      }

      return res.status(401).json({
        success: false,
        message: 'No valid session found'
      });
    } catch (err) {
      console.error('❌ Get token error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  // Legacy status method for backward compatibility
  async status(req, res) {
    return this.getAuthStatus(req, res);
  }
}

module.exports = new AuthController();

// Development-only helper to expose last OTP for an email (used by tests)
if (process.env.NODE_ENV === 'development') {
  module.exports.devGetLastOTP = async (req, res) => {
    try {
      const email = (req.query.email || (req.body && req.body.email) || '').toLowerCase().trim();
      if (!email) return res.status(400).json({ success: false, error: 'email query param required' });

      const otpData = otpStore.get(email);
      if (!otpData) return res.status(404).json({ success: false, error: 'OTP not found' });

      return res.status(200).json({ success: true, email, otp: otpData.otp, expiresAt: otpData.expiresAt });
    } catch (err) {
      console.error('devGetLastOTP error', err);
      return res.status(500).json({ success: false, error: 'internal error' });
    }
  };
}
