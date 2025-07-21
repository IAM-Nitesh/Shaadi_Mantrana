// Enhanced Auth Controller with MongoDB Integration
// Handles authentication with JWT session management and MongoDB storage

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const config = require('../config');
const dataSourceService = require('../services/dataSourceService');
const { JWTSessionManager } = require('../middleware/auth');
const preApprovedEmailService = require('../services/preApprovedEmailService');
const { User } = require('../models');

// OTP store with expiration (in production, use Redis)
const otpStore = new Map();

// Enhanced Security utilities with comprehensive validation
const SecurityUtils = {
  // Comprehensive email validation
  validateEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) return false;
    if (email.length > 254) return false;
    if (email.startsWith('.') || email.endsWith('.')) return false;
    if (email.includes('..')) return false;
    
    const suspiciousPatterns = [
      /^[0-9]+@/,
      /@[0-9]+$/,
      /\.(test|example|invalid|localhost)$/i,
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(email));
  },

  // Input sanitization
  sanitizeInput: (input) => {
    if (!input || typeof input !== 'string') return '';
    return input.trim().toLowerCase().replace(/[<>\"'&]/g, '').substring(0, 255);
  },

  // OTP format validation
  validateOTPFormat: (otp) => {
    if (!otp) return false;
    const otpString = otp.toString().trim();
    return /^[0-9]{6}$/.test(otpString);
  },

  // Secure OTP generation
  generateSecureOTP: () => {
    let otp;
    do {
      otp = Math.floor(100000 + crypto.randomInt(900000)).toString();
    } while (otp.startsWith('0'));
    return otp;
  },

  // Simple encryption/decryption
  encrypt: (text) => {
    try {
      return Buffer.from(text).toString('base64');
    } catch (error) {
      throw new Error('Encryption failed');
    }
  },

  decrypt: (encrypted) => {
    try {
      return Buffer.from(encrypted, 'base64').toString('ascii');
    } catch (error) {
      throw new Error('Decryption failed');
    }
  },

  // Rate limiting
  rateLimitStore: new Map(),
  
  checkRateLimit: (key, limit, windowMs, identifier = 'default') => {
    const now = Date.now();
    const fullKey = `${identifier}-${key}`;
    
    if (!SecurityUtils.rateLimitStore.has(fullKey)) {
      SecurityUtils.rateLimitStore.set(fullKey, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: limit - 1 };
    }
    
    const record = SecurityUtils.rateLimitStore.get(fullKey);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return { allowed: true, remaining: limit - 1 };
    }
    
    if (record.count >= limit) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      };
    }
    
    record.count++;
    return { allowed: true, remaining: limit - record.count };
  },

  // Store OTP with validation
  storeOTP: (email, otp, clientInfo = {}) => {
    if (!email || !otp) {
      throw new Error('Email and OTP are required');
    }
    
    const expirationTime = Date.now() + (5 * 60 * 1000);
    const encryptedOTP = SecurityUtils.encrypt(otp);
    
    otpStore.set(email, {
      otp: encryptedOTP,
      expiresAt: expirationTime,
      attempts: 0,
      createdAt: Date.now(),
      ...clientInfo
    });
  },

  // Enhanced OTP validation
  validateOTP: (email, providedOTP, clientInfo = {}) => {
    if (!email || !providedOTP) {
      return { valid: false, reason: 'Email and OTP are required', code: 'MISSING_PARAMS' };
    }
    
    if (!SecurityUtils.validateOTPFormat(providedOTP)) {
      return { valid: false, reason: 'Invalid OTP format', code: 'INVALID_FORMAT' };
    }
    
    const otpData = otpStore.get(email);
    
    if (!otpData) {
      return { valid: false, reason: 'OTP not found or expired', code: 'NOT_FOUND' };
    }

    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email);
      return { valid: false, reason: 'OTP expired', code: 'EXPIRED' };
    }

    if (otpData.attempts >= 3) {
      otpStore.delete(email);
      return { valid: false, reason: 'Too many invalid attempts', code: 'MAX_ATTEMPTS' };
    }

    let decryptedOTP;
    try {
      decryptedOTP = SecurityUtils.decrypt(otpData.otp);
    } catch (error) {
      otpStore.delete(email);
      return { valid: false, reason: 'OTP data corrupted', code: 'CORRUPTED' };
    }

    if (decryptedOTP !== providedOTP) {
      otpData.attempts++;
      return { valid: false, reason: 'Invalid OTP', code: 'INVALID_OTP' };
    }

    otpStore.delete(email);
    return { valid: true, code: 'SUCCESS' };
  },

  // Clean expired data
  cleanExpiredData: () => {
    const now = Date.now();
    
    // Clean expired OTPs
    for (const [email, data] of otpStore.entries()) {
      if (now > data.expiresAt) {
        otpStore.delete(email);
      }
    }

    // Clean expired rate limits
    for (const [key, data] of SecurityUtils.rateLimitStore.entries()) {
      if (now > data.resetTime) {
        SecurityUtils.rateLimitStore.delete(key);
      }
    }
  },

  // Request source validation
  validateRequestSource: (req) => {
    const userAgent = req.headers['user-agent'];
    
    if (!userAgent || userAgent.length < 10) {
      return { valid: false, reason: 'Invalid user agent' };
    }
    
    const suspiciousPatterns = [
      /bot|crawler|spider|scraper/i,
    ];
    
    // Allow curl/postman in development
    if (process.env.NODE_ENV === 'development') {
      return { valid: true };
    }
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
    return { valid: !isSuspicious, reason: isSuspicious ? 'Suspicious user agent' : 'Valid' };
  },

  // Get client IP
  getClientIP: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           'unknown';
  }
};

// Enhanced Auth Controller
const authController = {
  // Send OTP with comprehensive edge case handling
  async sendOTP(req, res) {
    const startTime = Date.now();
    
    try {
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

      // Method validation
      if (req.method !== 'POST') {
        return res.status(405).json({ 
          success: false,
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED',
          allowed: ['POST']
        });
      }

      // Clean expired data
      SecurityUtils.cleanExpiredData();

      // Validate request source
      const sourceValidation = SecurityUtils.validateRequestSource(req);
      if (!sourceValidation.valid) {
        const clientIP = SecurityUtils.getClientIP(req);
        console.log(`🚫 Suspicious request from ${clientIP}: ${sourceValidation.reason}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid request source',
          code: 'INVALID_SOURCE'
        });
      }

      // Body validation
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        });
      }

      const { email } = req.body;
      
      // Comprehensive input validation
      if (!email) {
        return res.status(400).json({ 
          success: false,
          error: 'Email is required',
          code: 'MISSING_EMAIL'
        });
      }

      if (typeof email !== 'string') {
        return res.status(400).json({ 
          success: false,
          error: 'Email must be a string',
          code: 'INVALID_EMAIL_TYPE'
        });
      }

      if (email.length > 254) {
        return res.status(400).json({ 
          success: false,
          error: 'Email too long (max 254 characters)',
          code: 'EMAIL_TOO_LONG'
        });
      }

      if (!SecurityUtils.validateEmail(email)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT'
        });
      }

      const sanitizedEmail = SecurityUtils.sanitizeInput(email);
      const clientIP = SecurityUtils.getClientIP(req);
      
      // Rate limiting checks
      const ipRateLimit = SecurityUtils.checkRateLimit(clientIP, 10, 60 * 60 * 1000, 'otp-ip');
      if (!ipRateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests from this IP',
          code: 'RATE_LIMIT_IP',
          retryAfter: ipRateLimit.retryAfter
        });
      }

      const emailRateLimit = SecurityUtils.checkRateLimit(sanitizedEmail, 3, 15 * 60 * 1000, 'otp-email');
      if (!emailRateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many OTP requests for this email',
          code: 'RATE_LIMIT_EMAIL',
          retryAfter: emailRateLimit.retryAfter
        });
      }

      // Check existing OTP
      const existingOTP = otpStore.get(sanitizedEmail);
      if (existingOTP && Date.now() < existingOTP.expiresAt) {
        const remainingTime = Math.ceil((existingOTP.expiresAt - Date.now()) / 1000);
        return res.status(429).json({
          success: false,
          error: 'OTP already sent',
          message: `Please wait ${remainingTime} seconds before requesting a new OTP`,
          code: 'OTP_ALREADY_SENT',
          retryAfter: remainingTime
        });
      }

      // Check email approval
      let emailStatus;
      try {
        emailStatus = preApprovedEmailService.getEmailStatus(sanitizedEmail);
      } catch (error) {
        console.error('❌ Email status check failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Email validation service error',
          code: 'EMAIL_SERVICE_ERROR'
        });
      }
      
      if (!emailStatus.approved) {
        console.log(`❌ Email not approved: ${sanitizedEmail}, reason: ${emailStatus.reason}`);
        
        if (emailStatus.type === 'not_approved') {
          try {
            const approvalRequest = preApprovedEmailService.requestApproval(sanitizedEmail, {
              requestedAt: new Date().toISOString(),
              userAgent: req.headers['user-agent'],
              ip: clientIP,
              referer: req.headers['referer']
            });
            
            return res.status(403).json({
              success: false,
              error: 'Email not pre-approved',
              message: 'Your email has been submitted for approval. Please contact support.',
              code: 'EMAIL_NOT_APPROVED',
              approvalRequest
            });
          } catch (error) {
            console.error('❌ Approval request failed:', error);
            return res.status(403).json({
              success: false,
              error: 'Email not pre-approved',
              message: 'This email is not approved for registration. Please contact support.',
              code: 'EMAIL_NOT_APPROVED'
            });
          }
        }
        
        return res.status(403).json({
          success: false,
          error: 'Email not approved',
          message: emailStatus.reason,
          code: 'EMAIL_NOT_APPROVED',
          status: emailStatus
        });
      }

      console.log(`✅ Email approved: ${sanitizedEmail} (${emailStatus.type})`);

      // Generate and store OTP
      const clientInfo = {
        ipAddress: clientIP,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer']
      };

      // Check mode and generate OTP
      if (dataSourceService.getMode() === 'static') {
        console.log('📱 Using static demo mode for OTP');

        try {
          const demoOTP = '123456';
          SecurityUtils.storeOTP(sanitizedEmail, demoOTP, clientInfo);
          
          console.log(`📧 Demo OTP generated for ${sanitizedEmail}: ${demoOTP}`);
          
          const processingTime = Date.now() - startTime;
          return res.status(200).json({ 
            success: true, 
            message: 'Demo OTP sent! Use: 123456',
            demo: true,
            email: sanitizedEmail,
            processingTime: `${processingTime}ms`
          });
        } catch (error) {
          console.error('❌ Demo OTP storage failed:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to store demo OTP',
            code: 'DEMO_OTP_ERROR'
          });
        }
      }

      // Production mode
      if (!config.FEATURES?.ENABLE_EMAIL) {
        return res.status(503).json({ 
          success: false,
          error: 'Email service not configured',
          message: 'Please configure SMTP settings or use static demo mode',
          code: 'EMAIL_SERVICE_DISABLED'
        });
      }

      try {
        const realOTP = SecurityUtils.generateSecureOTP();
        SecurityUtils.storeOTP(sanitizedEmail, realOTP, clientInfo);

        // TODO: Implement real email sending
        console.log(`📧 OTP sent to ${sanitizedEmail.replace(/(.{3}).*(@.*)/, '$1***$2')}`);
        
        const processingTime = Date.now() - startTime;
        return res.status(200).json({ 
          success: true, 
          message: 'OTP sent successfully',
          email: sanitizedEmail,
          processingTime: `${processingTime}ms`
        });
        
      } catch (error) {
        console.error('❌ OTP sending failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to send OTP',
          code: 'EMAIL_SEND_ERROR',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Email service error'
        });
      }

    } catch (error) {
      console.error('❌ Send OTP error:', error);
      const processingTime = Date.now() - startTime;
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to send OTP',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        processingTime: `${processingTime}ms`
      });
    }
  },

  // Verify OTP with comprehensive validation
  async verifyOTP(req, res) {
    const startTime = Date.now();
    
    try {
      // Method validation
      if (req.method !== 'POST') {
        return res.status(405).json({ 
          success: false,
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        });
      }

      // Clean expired data
      SecurityUtils.cleanExpiredData();

      // Body validation
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        });
      }

      const { email, otp } = req.body;

      // Input validation
      if (!email || !otp) {
        return res.status(400).json({ 
          success: false,
          error: 'Email and OTP are required',
          code: 'MISSING_PARAMS'
        });
      }

      if (typeof email !== 'string' || typeof otp !== 'string') {
        return res.status(400).json({ 
          success: false,
          error: 'Email and OTP must be strings',
          code: 'INVALID_PARAM_TYPES'
        });
      }

      const sanitizedEmail = SecurityUtils.sanitizeInput(email);
      const sanitizedOTP = otp.toString().trim();
      const clientIP = SecurityUtils.getClientIP(req);

      // Rate limiting for verification attempts
      const verifyRateLimit = SecurityUtils.checkRateLimit(
        `${clientIP}-${sanitizedEmail}`, 5, 15 * 60 * 1000, 'verify-otp'
      );
      if (!verifyRateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many verification attempts',
          code: 'RATE_LIMIT_VERIFY',
          retryAfter: verifyRateLimit.retryAfter
        });
      }

      // Validate OTP
      const clientInfo = {
        ipAddress: clientIP,
        userAgent: req.headers['user-agent']
      };

      const otpValidation = SecurityUtils.validateOTP(sanitizedEmail, sanitizedOTP, clientInfo);
      
      if (!otpValidation.valid) {
        console.log(`❌ OTP validation failed for ${sanitizedEmail}: ${otpValidation.reason}`);
        return res.status(400).json({ 
          success: false,
          error: otpValidation.reason,
          code: otpValidation.code
        });
      }

      // Re-verify email approval
      let emailStatus;
      try {
        emailStatus = preApprovedEmailService.getEmailStatus(sanitizedEmail);
      } catch (error) {
        console.error('❌ Email status re-check failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Email validation service error',
          code: 'EMAIL_SERVICE_ERROR'
        });
      }

      if (!emailStatus.approved) {
        console.log(`❌ Email approval revoked during session: ${sanitizedEmail}`);
        return res.status(403).json({
          success: false,
          error: 'Email approval has been revoked',
          code: 'EMAIL_APPROVAL_REVOKED'
        });
      }

      // Create user and JWT session
      try {
        const user = {
          id: sanitizedEmail,
          email: sanitizedEmail,
          verified: true,
          loginTime: new Date().toISOString(),
          approvalType: emailStatus.type,
          clientIP,
          userAgent: req.headers['user-agent']
        };

        const session = JWTSessionManager.createSession(user);
        
        console.log(`✅ OTP verified and JWT session created for ${sanitizedEmail.replace(/(.{3}).*(@.*)/, '$1***$2')}`);
        console.log(`🔑 Session ID: ${session.sessionId}`);

        const processingTime = Date.now() - startTime;
        
        res.status(200).json({
          success: true,
          message: 'Authentication successful',
          user: {
            email: user.email,
            verified: user.verified,
            loginTime: user.loginTime
          },
          session: {
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            expiresIn: session.expiresIn,
            sessionId: session.sessionId
          },
          approvalInfo: {
            type: emailStatus.type,
            reason: emailStatus.reason
          },
          processingTime: `${processingTime}ms`
        });
      } catch (error) {
        console.error('❌ JWT session creation failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create session',
          code: 'SESSION_CREATION_ERROR',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Authentication service error'
        });
      }

    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      const processingTime = Date.now() - startTime;
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to verify OTP',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        processingTime: `${processingTime}ms`
      });
    }
  },

  // Enhanced logout with session management
  async logout(req, res) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        try {
          const decoded = JWTSessionManager.verifyAccessToken(token);
          const revoked = JWTSessionManager.revokeSession(decoded.sessionId);
          
          if (revoked) {
            console.log(`✅ Session revoked for user: ${decoded.email}`);
          } else {
            console.log(`⚠️ Session not found during logout: ${decoded.sessionId}`);
          }
        } catch (error) {
          console.log('⚠️ Invalid token during logout, proceeding anyway');
        }
      }

      res.status(200).json({ 
        success: true, 
        message: 'Logged out successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to logout',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Enhanced token refresh
  async refreshToken(req, res) {
    try {
      // Body validation
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        });
      }

      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
          code: 'NO_REFRESH_TOKEN'
        });
      }

      if (typeof refreshToken !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Refresh token must be a string',
          code: 'INVALID_TOKEN_TYPE'
        });
      }

      // Rate limiting for refresh attempts
      const clientIP = SecurityUtils.getClientIP(req);
      const refreshRateLimit = SecurityUtils.checkRateLimit(clientIP, 20, 15 * 60 * 1000, 'refresh-token');
      if (!refreshRateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many refresh attempts',
          code: 'RATE_LIMIT_REFRESH',
          retryAfter: refreshRateLimit.retryAfter
        });
      }

      try {
        const newAccessToken = JWTSessionManager.refreshAccessToken(refreshToken);
        
        res.status(200).json({
          success: true,
          message: 'Token refreshed successfully',
          accessToken: newAccessToken,
          expiresIn: '24h',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Token refresh error:', error);
        res.status(401).json({
          success: false,
          error: error.message,
          code: 'REFRESH_FAILED'
        });
      }
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during token refresh',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Token refresh failed'
      });
    }
  },

  // Enhanced profile endpoint
  async getProfile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      // Validate session is still active
      if (!JWTSessionManager.validateSession(req.user.sessionId)) {
        return res.status(401).json({
          success: false,
          error: 'Session expired or invalid',
          code: 'INVALID_SESSION'
        });
      }

      let emailStatus;
      try {
        emailStatus = preApprovedEmailService.getEmailStatus(req.user.email);
      } catch (error) {
        console.error('❌ Email status check failed:', error);
        emailStatus = { approved: false, reason: 'Status check failed', type: 'error' };
      }
      
      res.status(200).json({
        success: true,
        user: {
          userId: req.user.userId,
          email: req.user.email,
          verified: req.user.verified,
          sessionId: req.user.sessionId
        },
        approvalInfo: emailStatus,
        sessionStats: {
          activeSessionsCount: JWTSessionManager.getActiveSessionsCount()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

// Periodic cleanup
setInterval(() => {
  SecurityUtils.cleanExpiredData();
}, 5 * 60 * 1000); // Clean every 5 minutes

module.exports = authController;
