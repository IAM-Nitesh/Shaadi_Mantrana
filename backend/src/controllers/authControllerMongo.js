// MongoDB-integrated Auth Controller
// Simplified version using MongoDB User model

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validateEmail, sanitizeInput, hashPassword, verifyPassword, generateSessionToken } = require('../utils/security');
const config = require('../config');
const preApprovedEmailService = require('../services/preApprovedEmailService');
const emailService = require('../services/emailService');
const { JWTSessionManager } = require('../middleware/auth');
const { User } = require('../models');

// Session management
const sessions = new Map();

// OTP store with expiration (use Redis in production)
const otpStore = new Map();

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
    const expirationTime = Date.now() + (10 * 60 * 1000); // 10 minutes
    otpStore.set(email, {
      otp,
      expiresAt: expirationTime,
      attempts: 0,
      clientInfo,
      createdAt: Date.now()
    });
  },

  // Verify OTP
  verifyOTP: (email, otp) => {
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
      return { valid: false, reason: 'Invalid OTP' };
    }

    otpStore.delete(email);
    return { valid: true };
  }
};

class AuthController {
  // Send OTP for email verification (No storage - for external service integration)
  async sendOTP(req, res) {
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
        return res.status(429).json({
          success: false,
          error: 'Too many OTP requests',
          message: `Please wait ${Math.ceil(shortTermRateLimit.retryAfter / 60)} minutes before requesting another OTP.`,
          retryAfter: shortTermRateLimit.retryAfter
        });
      }

      // Check if email is pre-approved
      const emailStatus = preApprovedEmailService.getEmailStatus(sanitizedEmail);
      if (!emailStatus.approved) {
        return res.status(403).json({
          success: false,
          error: 'Email not approved for registration'
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
      
      if (!user) {
        // Create new user with UUID
        user = new User({
          email: sanitizedEmail,
          verification: {
            isVerified: true,
            verifiedAt: new Date(),
            approvalType: 'otp'
          },
          status: 'active'
        });
        await user.save();
        console.log(`✅ New user created: ${sanitizedEmail} (UUID: ${user.userUuid})`);
      } else {
        // Update existing user
        user.verification.isVerified = true;
        user.verification.verifiedAt = new Date();
        user.lastActive = new Date();
        
        // Add login history
        user.loginHistory.push({
          timestamp: new Date(),
          ipAddress: clientIP,
          userAgent: req.headers['user-agent']
        });
        
        // Keep only last 10 login records
        if (user.loginHistory.length > 10) {
          user.loginHistory = user.loginHistory.slice(-10);
        }
        
        await user.save();
        console.log(`✅ User login: ${sanitizedEmail} (UUID: ${user.userUuid})`);
      }

      // Create JWT session using the same system as the main auth controller
      const sessionData = {
        userId: user._id,
        userUuid: user.userUuid,
        email: user.email,
        verified: true,
        loginTime: new Date().toISOString(),
        clientIP,
        userAgent: req.headers['user-agent']
      };

      const session = JWTSessionManager.createSession(sessionData);

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        user: user.toPublicJSON(),
        session: {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresIn: session.expiresIn,
          sessionId: session.sessionId
        }
      });

    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify OTP'
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

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
}

module.exports = new AuthController();
