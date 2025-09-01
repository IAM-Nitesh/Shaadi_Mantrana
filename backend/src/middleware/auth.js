// JWT Authentication Middleware
// Handles JWT token verification and session management

const jwt = require('jsonwebtoken');
const config = require('../config');
const { Session } = require('../models');

// JWT Configuration
// Do not use hard-coded secrets in source. Expect JWT_SECRET to be provided
// via environment variables. In production this must be set. For local
// development you may set JWT_SECRET in `.env.development`.
const JWT_SECRET = process.env.JWT_SECRET || config.JWT.SECRET || '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || config.JWT.EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || config.JWT.REFRESH_EXPIRES_IN || '7d';

// Active sessions store (in production, use Redis)
// For now, we'll use database persistence
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
  static async createSession(user) {
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

    // Store session in database
    try {
      const sessionData = {
        sessionId: payload.sessionId,
        userId: payload.userId,
        userUuid: payload.userUuid,
        email: payload.email,
        role: payload.role,
        verified: payload.verified,
        refreshToken,
        accessToken,
        createdAt: new Date(),
        lastAccessed: new Date()
      };

      await Session.create(sessionData);
      console.log('🔍 JWTSessionManager: Session stored in database');

      // Also store in memory for faster access
      activeSessions.set(payload.sessionId, sessionData);

    } catch (error) {
      console.error('❌ JWTSessionManager: Failed to store session in database:', error);
      throw error;
    }

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
  static async refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      const session = await this.getSession(decoded.sessionId);

      if (!session || session.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token session');
      }

      // Update last accessed time
      session.lastAccessed = new Date();
      await Session.updateOne({ sessionId: decoded.sessionId }, { lastAccessed: new Date() });

      // Generate new access token
      const newPayload = {
        userId: decoded.userId,
        userUuid: decoded.userUuid,
        email: decoded.email,
        role: decoded.role,
        verified: decoded.verified,
        sessionId: decoded.sessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        aud: 'shaadi-mantra-app',
        iss: 'shaadi-mantra-api'
      };

      return this.generateAccessToken(newPayload);
    } catch (error) {
      throw new Error('Failed to refresh token: ' + error.message);
    }
  }

  // Validate session
  static async validateSession(sessionId) {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    // Check if session is too old (optional cleanup)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (Date.now() - new Date(session.createdAt).getTime() > maxAge) {
      await this.deleteSession(sessionId);
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

  // Get session by ID
  static async getSession(sessionId) {
    // First check in-memory cache
    let session = activeSessions.get(sessionId);

    if (!session) {
      // If not in memory, check database
      try {
        session = await Session.findBySessionId(sessionId);
        if (session) {
          // Update last accessed time
          session.lastAccessed = new Date();
          await session.save();

          // Cache in memory for faster future access
          activeSessions.set(sessionId, session.toObject());
        }
      } catch (error) {
        console.error('❌ JWTSessionManager: Error retrieving session from database:', error);
        return null;
      }
    }

    return session;
  }

  // Delete session
  static async deleteSession(sessionId) {
    try {
      activeSessions.delete(sessionId);
      await Session.deleteBySessionId(sessionId);
      return true;
    } catch (error) {
      console.error('❌ JWTSessionManager: Error deleting session:', error);
      return false;
    }
  }

  // Clean expired sessions
  static async cleanExpiredSessions() {
    try {
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      const now = Date.now();

      // Clean in-memory sessions
      for (const [sessionId, session] of activeSessions.entries()) {
        if (now - new Date(session.createdAt).getTime() > maxAge) {
          activeSessions.delete(sessionId);
        }
      }

      // Clean database sessions
      await Session.cleanupExpired();
    } catch (error) {
      console.error('❌ JWTSessionManager: Error cleaning expired sessions:', error);
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
