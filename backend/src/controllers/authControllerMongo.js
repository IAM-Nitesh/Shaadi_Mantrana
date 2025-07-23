// MongoDB-integrated Auth Controller
// Simplified version using MongoDB User model

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validateEmail, sanitizeInput, hashPassword, verifyPassword, generateSessionToken } = require('../utils/security');
const config = require('../config');
const preApprovedEmailService = require('../services/preApprovedEmailService');
const { User } = require('../models');

// OTP store with expiration (use Redis in production)
const otpStore = new Map();

// Session management
const sessions = new Map();

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
  }
};

class AuthController {
  // Send OTP for email verification
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

      // Rate limiting
      const clientIP = SecurityUtils.getClientIP(req);
      const rateLimit = SecurityUtils.checkRateLimit(`${clientIP}-otp`, 5, 15 * 60 * 1000);
      
      if (!rateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many OTP requests',
          retryAfter: rateLimit.retryAfter
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

      // Generate and store OTP
      const otp = SecurityUtils.generateSecureOTP();
      const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

      otpStore.set(sanitizedEmail, {
        otp,
        expiresAt,
        attempts: 0,
        createdAt: Date.now(),
        clientIP
      });

      // Send OTP via email service
      try {
        const emailService = require('../services/emailService');
        await emailService.sendOTP(sanitizedEmail, otp);
        console.log(`✅ OTP sent to ${sanitizedEmail}: ${otp}`);
      } catch (emailError) {
        console.error('❌ Email service error:', emailError);
        console.log(`📧 OTP for ${sanitizedEmail}: ${otp} (email fallback)`);
      }

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 600 // 10 minutes in seconds
      });

    } catch (error) {
      console.error('❌ Send OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send OTP'
      });
    }
  }

  // Verify OTP and create/login user
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

      // Rate limiting for verification
      const clientIP = SecurityUtils.getClientIP(req);
      const rateLimit = SecurityUtils.checkRateLimit(`${clientIP}-verify`, 5, 15 * 60 * 1000);
      
      if (!rateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many verification attempts',
          retryAfter: rateLimit.retryAfter
        });
      }

      // Check OTP
      const otpData = otpStore.get(sanitizedEmail);
      if (!otpData) {
        return res.status(400).json({
          success: false,
          error: 'OTP not found or expired'
        });
      }

      if (Date.now() > otpData.expiresAt) {
        otpStore.delete(sanitizedEmail);
        return res.status(400).json({
          success: false,
          error: 'OTP has expired'
        });
      }

      if (otpData.otp !== sanitizedOTP) {
        otpData.attempts += 1;
        if (otpData.attempts >= 3) {
          otpStore.delete(sanitizedEmail);
          return res.status(400).json({
            success: false,
            error: 'Too many invalid attempts'
          });
        }
        return res.status(400).json({
          success: false,
          error: 'Invalid OTP'
        });
      }

      // OTP is valid, remove it
      otpStore.delete(sanitizedEmail);

      // Find or create user in MongoDB
      let user = await User.findOne({ email: sanitizedEmail });
      
      if (!user) {
        // Create new user with explicit field structure
        user = new User({
          email: sanitizedEmail,
          verification: {
            isVerified: true,
            verifiedAt: new Date(),
            approvalType: 'direct'
          },
          status: 'active',
          // Explicitly define education as empty object to avoid conflicts
          education: {},
          // Initialize other potentially conflicting fields
          preferences: {
            educationPreferences: {
              minimumDegree: '',
              preferredInstitutions: []
            }
          }
        });
        
        try {
          await user.save();
          console.log(`✅ New user created: ${sanitizedEmail}`);
        } catch (saveError) {
          console.error('❌ User creation error:', saveError);
          // Try to create user with minimal fields
          user = new User({
            email: sanitizedEmail,
            verification: {
              isVerified: true,
              verifiedAt: new Date(),
              approvalType: 'direct'
            },
            status: 'active'
          });
          await user.save();
          console.log(`✅ New user created with minimal fields: ${sanitizedEmail}`);
        }
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
        
        try {
          await user.save();
          console.log(`✅ User login: ${sanitizedEmail}`);
        } catch (updateError) {
          console.error('❌ User update error:', updateError);
          // If update fails, just update verification fields
          await User.updateOne(
            { email: sanitizedEmail },
            { 
              'verification.isVerified': true,
              'verification.verifiedAt': new Date(),
              lastActive: new Date()
            }
          );
          console.log(`✅ User verification updated: ${sanitizedEmail}`);
        }
      }

      // Generate JWT session
      const sessionId = crypto.randomUUID();
      const payload = {
        userId: user._id,
        email: user.email,
        sessionId
      };

      const accessToken = jwt.sign(payload, config.JWT.SECRET, { expiresIn: '24h' });
      const refreshToken = jwt.sign({ sessionId }, config.JWT.SECRET, { expiresIn: '7d' });

      // Store session
      sessions.set(sessionId, {
        userId: user._id,
        email: user.email,
        createdAt: Date.now(),
        lastAccess: Date.now(),
        clientIP,
        userAgent: req.headers['user-agent']
      });

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        user: user.toPublicJSON(),
        session: {
          accessToken,
          refreshToken,
          expiresIn: 86400, // 24 hours
          sessionId
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

      const newAccessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

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
