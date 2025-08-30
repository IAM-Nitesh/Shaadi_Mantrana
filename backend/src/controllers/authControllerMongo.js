// MongoDB-integrated Auth Controller
// Simplified version using MongoDB User model

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validateEmail, sanitizeInput, hashPassword, verifyPassword, generateSessionToken } = require('../utils/security');
const config = require('../config');

const emailService = require('../services/emailService');
const { JWTSessionManager } = require('../middleware/auth');
const { User } = require('../models');

// Session management
const sessions = new Map();

// OTP store with expiration (use Redis in production)
const otpStore = require('../utils/otpStorage');

// Ensure otpStore is properly initialized
if (!otpStore || typeof otpStore.size !== 'function') {
  console.error('❌ OTP Storage not properly initialized!');
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
    console.log(`Storing OTP: ${otp} for ${email} (expires in ${expirationMinutes} minutes)`);
    console.log(`Current store size: ${otpStore.size()}`);
  },

  // Verify OTP
  verifyOTP: (email, otp) => {
    console.log(`Verifying OTP for ${email}, Current store size: ${otpStore.size()}`);
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
  // Send OTP for email verification (No storage - for external service integration)
  async sendOTP(req, res) {
    console.log('sendOTP received email:', req.body.email);
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const sanitizedEmail = SecurityUtils.sanitizeInput(email);
      
      if (!SecurityUtils.validateEmail(sanitizedEmail)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Rate limiting with increased daily limits
      const clientIP = SecurityUtils.getClientIP(req);
      
      // Daily rate limit (24 hours) - more generous for legitimate use
      const dailyLimit = config.API.RATE_LIMIT.OTP_DAILY_LIMIT;
      const dailyWindow = 24 * 60 * 60 * 1000; // 24 hours
      const dailyRateLimit = SecurityUtils.checkRateLimit(`${clientIP}-daily-otp`, dailyLimit, dailyWindow);
      
      if (!dailyRateLimit.allowed) {
        console.log('Returning 429: daily limit');
        return res.status(429).json({
          success: false,
          error: 'Daily OTP limit exceeded',
          message: `You have exceeded the daily limit of ${dailyLimit} OTP requests. Please try again tomorrow.`,
          retryAfter: dailyRateLimit.retryAfter
        });
      }
      
      // Short-term rate limit to prevent spam (15 minutes) - increased from 5 to 10+
      const shortTermLimit = config.API.RATE_LIMIT.OTP_SHORT_TERM_LIMIT;
      const shortTermWindow = 15 * 60 * 1000; // 15 minutes
      const shortTermRateLimit = SecurityUtils.checkRateLimit(`${clientIP}-otp`, shortTermLimit, shortTermWindow);
      
      if (!shortTermRateLimit.allowed) {
        console.log('Returning 429: short-term limit');
        return res.status(429).json({
          success: false,
          error: 'Too many OTP requests',
          message: `Please wait ${Math.ceil(shortTermRateLimit.retryAfter / 60)} minutes before requesting another OTP.`,
          retryAfter: shortTermRateLimit.retryAfter
        });
      }



          // Check if email is approved by admin
      const existingUser = await User.findOne({ email: sanitizedEmail });
      const isAdmin = existingUser && existingUser.role === 'admin';
      
      if (!isAdmin && !existingUser) {
        return res.status(403).json({
          success: false,
          error: 'Email not approved for registration',
          message: 'This email is not approved by admin. Please contact support.'
        });
      }
      
      // Admin users don't need to be in preapproved emails collection
      if (isAdmin) {
        console.log(`👑 Admin user ${sanitizedEmail} login attempt (bypassing preapproved check)`);
      }
      
      // Check if user is paused (only for non-admin users)
      if (existingUser && !isAdmin && existingUser.status === 'paused') {
        return res.status(403).json({
          success: false,
          error: 'Account is paused',
          message: 'Your account has been paused by admin. Please contact support.'
        });
      }

      // Generate OTP and store it
      const otp = SecurityUtils.generateSecureOTP();
      
      // Store OTP for verification
      SecurityUtils.storeOTP(sanitizedEmail, otp, {
        clientIP,
        userAgent: req.headers['user-agent']
      });

      // Send OTP via email service
      try {
        const emailResult = await emailService.sendOTP(sanitizedEmail, otp, {
          userName: sanitizedEmail.split('@')[0]
        });
        
        console.log(`✅ OTP sent to ${sanitizedEmail}: ${emailResult.messageId || 'console'}`);
        
        res.status(200).json({
          success: true,
          message: 'OTP sent successfully to your email',
          email: sanitizedEmail,
          method: emailResult.method,
          // Note: In production, don't include OTP in response
          ...(config.NODE_ENV === 'development' && { otp })
        });
        
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError.message);
        
        // Fallback for development
        if (config.NODE_ENV === 'development') {
          console.log(`📧 Development fallback - OTP for ${sanitizedEmail}: ${otp}`);
          return res.status(200).json({
            success: true,
            message: `Email service failed. Development OTP: ${otp}`,
            email: sanitizedEmail,
            otp: otp,
            emailError: emailError.message
          });
        }
        
        throw emailError;
      }

    } catch (error) {
      console.error('❌ Send OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send OTP'
      });
    }
  }

  // Verify OTP and create/login user (OTP verified externally)
  async verifyOTP(req, res) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Email and OTP are required'
        });
      }

      const sanitizedEmail = SecurityUtils.sanitizeInput(email);
      const sanitizedOTP = otp.toString().trim();

      // Rate limiting for verification - increased limits
      const clientIP = SecurityUtils.getClientIP(req);
      
      // More generous verification limits since users might make typos
      const verifyLimit = config.API.RATE_LIMIT.OTP_VERIFY_LIMIT;
      const verifyWindow = 15 * 60 * 1000; // 15 minutes
      const rateLimit = SecurityUtils.checkRateLimit(`${clientIP}-verify`, verifyLimit, verifyWindow);
      
      if (!rateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many verification attempts',
          retryAfter: rateLimit.retryAfter
        });
      }

      // Verify OTP
      const otpResult = SecurityUtils.verifyOTP(sanitizedEmail, sanitizedOTP);
      if (!otpResult.valid) {
        return res.status(400).json({
          success: false,
          error: otpResult.reason
        });
      }

      // Find or create user in MongoDB
      let user = await User.findOne({ email: sanitizedEmail });
      const isAdmin = user && user.role === 'admin';
      
      // Check if user is paused (for non-admin users)
      if (user && !isAdmin && user.status === 'paused') {
        return res.status(403).json({
          success: false,
          error: 'Your account has been paused. Please contact the admin for re-approval.'
        });
      }

      // Check if user is approved by admin (for non-admin users)
      if (user && !isAdmin && user.isApprovedByAdmin === false) {
        return res.status(403).json({
          success: false,
          error: 'Your account has been paused. Please contact the admin for re-approval.'
        });
      }
      
      if (!user) {
        // Create new user
        const { v4: uuidv4 } = require('uuid');
        user = new User({
          email: sanitizedEmail,
          userUuid: uuidv4(),
          isApprovedByAdmin: true, // Default to approved for new users
          role: 'user',
          status: 'invited',
          isFirstLogin: true,
          hasSeenOnboardingMessage: false, // New users haven't seen onboarding
          profileCompleted: false,
          addedAt: new Date(),
          addedBy: null, // Direct OTP registration, not admin-invited
          profile: {
            location: "India",
            profileCompleteness: 0,  // Start with 0 for new users
            // Initialize all dropdown fields as undefined (empty)
            gender: undefined,
            maritalStatus: undefined,
            manglik: undefined,
            complexion: undefined,
            eatingHabit: undefined,
            smokingHabit: undefined,
            drinkingHabit: undefined,
            settleAbroad: undefined,
            // Initialize other profile fields as empty
            name: '',
            nativePlace: '',
            currentResidence: '',
            dateOfBirth: '',
            timeOfBirth: '',
            placeOfBirth: '',
            height: '',
            weight: '',
            education: '',
            occupation: '',
            annualIncome: '',
            father: '',
            mother: '',
            brothers: '',
            sisters: '',
            fatherGotra: '',
            motherGotra: '',
            grandfatherGotra: '',
            grandmotherGotra: '',
            specificRequirements: '',
            about: '',
            interests: [],
            images: null // Set to null instead of empty array
          },
          preferences: {
            location: [
              "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
              "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
              "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
              "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
              "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
              "Uttar Pradesh", "Uttarakhand", "West Bengal",
              "Andaman and Nicobar Islands", "Chandigarh",
              "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
              "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
            ],
            ageRange: {
              min: 18,
              max: 50
            },
            profession: [],
            education: []
          },
          loginHistory: []
        });
        await user.save();
        console.log(`✅ New user created: ${sanitizedEmail} (UUID: ${user.userUuid})`);
      } else {
        // Update existing user
        user.verification.isVerified = true;
        user.verification.verifiedAt = new Date();
        user.lastActive = new Date();
        // Fix legacy type issues
        user.profile = user.profile || {};
        user.profile.location = "India";
        
        // Clean up any empty string enum values to prevent validation errors
        const enumFields = ['gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad'];
        enumFields.forEach(field => {
          if (user.profile[field] === '') {
            delete user.profile[field]; // Remove empty strings to use undefined instead
          }
        });
        user.preferences = user.preferences || {};
        user.preferences.location = [
          "Andhra Pradesh",
          "Arunachal Pradesh",
          "Assam",
          "Bihar",
          "Chhattisgarh",
          "Goa",
          "Gujarat",
          "Haryana",
          "Himachal Pradesh",
          "Jharkhand",
          "Karnataka",
          "Kerala",
          "Madhya Pradesh",
          "Maharashtra",
          "Manipur",
          "Meghalaya",
          "Mizoram",
          "Nagaland",
          "Odisha",
          "Punjab",
          "Rajasthan",
          "Sikkim",
          "Tamil Nadu",
          "Telangana",
          "Tripura",
          "Uttar Pradesh",
          "Uttarakhand",
          "West Bengal",
          "Andaman and Nicobar Islands",
          "Chandigarh",
          "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
          "Jammu and Kashmir",
          "Ladakh",
          "Lakshadweep",
          "Puducherry"
        ];
        // OPTIMIZED: Update lastLogin instead of loginHistory array
        user.lastLogin = {
          timestamp: new Date(),
          ipAddress: clientIP,
          userAgent: req.headers['user-agent'],
          deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 
                     req.headers['user-agent']?.includes('Tablet') ? 'tablet' : 'desktop'
        };
        
        await user.save();
        console.log(`✅ User login: ${sanitizedEmail} (UUID: ${user.userUuid})`);
      }

      // Create JWT session using the same system as the main auth controller
      const session = JWTSessionManager.createSession(user);

      // Prepare response with user data for frontend redirection logic
      const userData = user.toPublicJSON();
      
      // Add additional fields needed for frontend redirection logic
      const responseData = {
        success: true,
        message: 'Authentication successful',
        user: {
          ...userData,
          isFirstLogin: user.isFirstLogin,
          isApprovedByAdmin: user.isApprovedByAdmin,
          profileCompleteness: user.profile?.profileCompleteness || 0,
          hasSeenOnboardingMessage: user.hasSeenOnboardingMessage || false
        },
        session: {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresIn: session.expiresIn,
          sessionId: session.sessionId
        }
      };

      res.status(200).json(responseData);

    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to verify OTP';
      let statusCode = 500;
      
      if (error.name === 'ValidationError') {
        statusCode = 400;
        // Check for enum validation errors
        const enumErrors = Object.keys(error.errors).filter(key => 
          error.errors[key].kind === 'enum'
        );
        
        if (enumErrors.length > 0) {
          console.error('❌ Enum validation errors:', enumErrors);
          errorMessage = 'Invalid profile data format. Please check your selections and try again.';
        } else if (error.errors && error.errors['profile.maritalStatus']) {
          errorMessage = 'Profile data validation error. Please contact support.';
        } else {
          errorMessage = 'Invalid data format. Please try again.';
        }
      } else if (error.name === 'MongoError' && error.code === 11000) {
        statusCode = 409;
        errorMessage = 'This email is already registered. Please try logging in.';
      } else if (error.message && error.message.includes('not preapproved')) {
        statusCode = 403;
        errorMessage = 'This email is not authorized. Please contact support.';
      }
      
      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
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
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwtSecret);
      const sessionData = sessions.get(decoded.sessionId);

      if (!sessionData) {
        return res.status(401).json({
          success: false,
          error: 'Invalid session'
        });
      }

      // Update session
      sessionData.lastAccess = Date.now();

      // Generate new access token
      const payload = {
        userId: sessionData.userId,
        email: sessionData.email,
        sessionId: decoded.sessionId
      };

      const newAccessToken = jwt.sign(payload, config.jwtSecret, { 
        expiresIn: '24h',
        issuer: 'shaadi-mantra-api',
        audience: 'shaadi-mantra-app'
      });

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
        sessions.delete(sessionId);
        console.log(`✅ Session logged out: ${sessionId}`);
      }

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
      // Get user from session token if available
      const authHeader = req.headers.authorization;
      let user = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, config.jwtSecret);
          const sessionData = sessions.get(decoded.sessionId);
          
          if (sessionData) {
            // Get full user data from database
            const dbUser = await User.findById(decoded.userId).select('-password');
            if (dbUser) {
              user = {
                userUuid: dbUser._id.toString(),
                email: dbUser.email,
                role: dbUser.role,
                isFirstLogin: dbUser.isFirstLogin,
                isApprovedByAdmin: dbUser.isApprovedByAdmin,
                profileCompleteness: dbUser.profileCompleteness || 0,
                hasSeenOnboardingMessage: dbUser.hasSeenOnboardingMessage || false
              };
            }
          }
        } catch (tokenError) {
          console.log('Token verification failed:', tokenError.message);
        }
      }

      if (user) {
        return res.status(200).json({
          authenticated: true,
          user: user,
          redirectTo: '/dashboard'
        });
      }

      // Not authenticated
      return res.status(200).json({
        authenticated: false,
        redirectTo: '/',
        message: 'Not authenticated'
      });
    } catch (err) {
      console.error('❌ Auth status error:', err);
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
          const decoded = jwt.verify(token, config.jwtSecret);
          const sessionData = sessions.get(decoded.sessionId);
          
          if (sessionData) {
            return res.status(200).json({
              success: true,
              token: token
            });
          }
        } catch (tokenError) {
          console.log('Token verification failed:', tokenError.message);
        }
      }

      // Try to get from cookies
      const sessionToken = req.cookies?.sessionToken;
      if (sessionToken) {
        try {
          const decoded = jwt.verify(sessionToken, config.jwtSecret);
          const sessionData = sessions.get(decoded.sessionId);
          
          if (sessionData) {
            // Generate a new access token
            const payload = {
              userId: sessionData.userId,
              email: sessionData.email,
              sessionId: decoded.sessionId
            };

            const accessToken = jwt.sign(payload, config.jwtSecret, { 
              expiresIn: '24h',
              issuer: 'shaadi-mantra-api',
              audience: 'shaadi-mantra-app'
            });

            return res.status(200).json({
              success: true,
              token: accessToken
            });
          }
        } catch (tokenError) {
          console.log('Session token verification failed:', tokenError.message);
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
