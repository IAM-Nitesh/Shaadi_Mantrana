// JWT Authentication Middleware
// Handles JWT token verification and session management

const jwt = require('jsonwebtoken');
const config = require('../config');

// JWT Configuration
// Do not use hard-coded secrets in source. Expect JWT_SECRET to be provided
// via environment variables. In production this must be set. For local
// development you may set JWT_SECRET in `.env.development`.
const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Active sessions store (in production, use Redis)
const activeSessions = new Map();

class JWTSessionManager {
  // Generate JWT access token
  static generateAccessToken(payload) {
  if (!JWT_SECRET) throw new Error('JWT secret not configured');
  return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'shaadi-mantra-api',
      audience: 'shaadi-mantra-app'
    });
  }

  // Generate JWT refresh token
  static generateRefreshToken(payload) {
  if (!JWT_SECRET) throw new Error('JWT secret not configured');
  return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'shaadi-mantra-api',
      audience: 'shaadi-mantra-app'
    });
  }

  // Create session with both tokens
  static createSession(user) {
    console.log('🔍 JWTSessionManager: Creating session for user:', {
      userId: user._id,
      userUuid: user.userUuid,
      email: user.email,
      role: user.role
    });
    
    const payload = {
      userId: user._id.toString(), // Convert ObjectId to string
      userUuid: user.userUuid, // Include UUID for monitoring
      email: user.email,
      role: user.role || 'user',
      verified: user.verified || true,
      sessionId: Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    };

    console.log('🔍 JWTSessionManager: Creating payload:', payload);

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    console.log('🔍 JWTSessionManager: Tokens generated successfully');

    // Store session
    activeSessions.set(payload.sessionId, {
      userId: payload.userId,
      email: payload.email,
      createdAt: new Date(),
      lastAccessed: new Date(),
      refreshToken
    });

    console.log('🔍 JWTSessionManager: Session stored, active sessions:', activeSessions.size);

    return {
      accessToken,
      refreshToken,
      sessionId: payload.sessionId,
      expiresIn: JWT_EXPIRES_IN
    };
  }

  // Verify access token
  static verifyAccessToken(token) {
    try {
  if (!JWT_SECRET) throw new Error('JWT secret not configured');
  return jwt.verify(token, JWT_SECRET, {
        issuer: 'shaadi-mantra-api',
        audience: 'shaadi-mantra-app'
      });
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token) {
    try {
  if (!JWT_SECRET) throw new Error('JWT secret not configured');
  return jwt.verify(token, JWT_SECRET, {
        issuer: 'shaadi-mantra-api',
        audience: 'shaadi-mantra-app'
      });
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Refresh access token
  static refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      const session = activeSessions.get(decoded.sessionId);

      if (!session || session.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token session');
      }

      // Update last accessed time
      session.lastAccessed = new Date();

      // Generate new access token
      const newPayload = {
        userId: decoded.userId,
        email: decoded.email,
        verified: decoded.verified,
        sessionId: decoded.sessionId
      };

      return this.generateAccessToken(newPayload);
    } catch (error) {
      throw new Error('Failed to refresh token: ' + error.message);
    }
  }

  // Validate session
  static validateSession(sessionId) {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Check if session is too old (optional cleanup)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (Date.now() - session.createdAt.getTime() > maxAge) {
      activeSessions.delete(sessionId);
      return false;
    }

    return true;
  }

  // Revoke session (logout)
  static revokeSession(sessionId) {
    return activeSessions.delete(sessionId);
  }

  // Get active sessions count
  static getActiveSessionsCount() {
    return activeSessions.size;
  }

  // Clean expired sessions
  static cleanExpiredSessions() {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();

    for (const [sessionId, session] of activeSessions.entries()) {
      if (now - session.createdAt.getTime() > maxAge) {
        activeSessions.delete(sessionId);
      }
    }
  }
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔍 AuthMiddleware: Starting token verification...');
  console.log('🔍 AuthMiddleware: Auth header present:', !!authHeader);
  console.log('🔍 AuthMiddleware: Auth header value:', authHeader ? `${authHeader.substring(0, 30)}...` : 'None');
  console.log('🔍 AuthMiddleware: Token extracted:', !!token);
  console.log('🔍 AuthMiddleware: Token length:', token?.length || 0);
  console.log('🔍 AuthMiddleware: Token preview:', token ? `${token.substring(0, 20)}...` : 'None');

  if (!token) {
    console.log('❌ AuthMiddleware: No token provided');
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  try {
    console.log('🔍 AuthMiddleware: Verifying token...');
    const decoded = JWTSessionManager.verifyAccessToken(token);
    console.log('🔍 AuthMiddleware: Token verified, decoded:', {
      userId: decoded.userId,
      email: decoded.email,
      sessionId: decoded.sessionId,
      role: decoded.role
    });
    
    // Validate session exists
    console.log('🔍 AuthMiddleware: Validating session...');
    console.log('🔍 AuthMiddleware: Session ID:', decoded.sessionId);
    console.log('🔍 AuthMiddleware: Active sessions count:', activeSessions.size);
    console.log('🔍 AuthMiddleware: Active session IDs:', Array.from(activeSessions.keys()));
    
    if (!JWTSessionManager.validateSession(decoded.sessionId)) {
      console.log('❌ AuthMiddleware: Session not found or invalid');
      console.log('❌ AuthMiddleware: Session validation failed');
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid',
        code: 'INVALID_SESSION'
      });
    }

    console.log('✅ AuthMiddleware: Session validated successfully');

    // Add user info to request with UUID for monitoring
    req.user = {
      userId: decoded.userId,
      userUuid: decoded.userUuid, // Include UUID for monitoring
      email: decoded.email,
      role: decoded.role,
      verified: decoded.verified,
      sessionId: decoded.sessionId
    };

    // Add UUID to response headers for better tracking
    res.set('X-User-UUID', decoded.userUuid);
    
    // Check if user is paused (for non-admin users) - only if needed
    if (decoded.role !== 'admin') {
      try {
        const { User } = require('../models');
        const mongoose = require('mongoose');
        
        // Convert string userId back to ObjectId for database lookup
        const userId = mongoose.Types.ObjectId.isValid(decoded.userId) 
          ? new mongoose.Types.ObjectId(decoded.userId) 
          : decoded.userId;
          
        const user = await User.findById(userId);
        
        if (user && (user.status === 'paused' || user.isApprovedByAdmin === false)) {
          console.log('❌ AuthMiddleware: User account paused');
          return res.status(403).json({
            success: false,
            error: 'Your account has been paused by admin. Please contact support to resume your account.',
            code: 'ACCOUNT_PAUSED'
          });
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        // Don't fail the request if we can't check user status
        // Just log the error and continue
      }
    }
    
    console.log('✅ AuthMiddleware: Authentication successful');
    next();
  } catch (error) {
    console.error('❌ AuthMiddleware: Token verification error:', error);
    console.error('❌ AuthMiddleware: Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(401).json({
      success: false,
      error: error.message,
      code: 'TOKEN_INVALID'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = JWTSessionManager.verifyAccessToken(token);
    
    if (JWTSessionManager.validateSession(decoded.sessionId)) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        verified: decoded.verified,
        sessionId: decoded.sessionId
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  JWTSessionManager,
  authenticateToken,
  optionalAuth
};
