// JWT Authentication Middleware
// Handles JWT token verification and session management

const jwt = require('jsonwebtoken');
const config = require('../config');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'shaadi-mantra-super-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Active sessions store (in production, use Redis)
const activeSessions = new Map();

class JWTSessionManager {
  // Generate JWT access token
  static generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'shaadi-mantra-api',
      audience: 'shaadi-mantra-app'
    });
  }

  // Generate JWT refresh token
  static generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'shaadi-mantra-api',
      audience: 'shaadi-mantra-app'
    });
  }

  // Create session with both tokens
  static createSession(user) {
    const payload = {
      userId: user.id || user.email,
      email: user.email,
      verified: user.verified || true,
      sessionId: Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store session
    activeSessions.set(payload.sessionId, {
      userId: payload.userId,
      email: payload.email,
      createdAt: new Date(),
      lastAccessed: new Date(),
      refreshToken
    });

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
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = JWTSessionManager.verifyAccessToken(token);
    
    // Validate session exists
    if (!JWTSessionManager.validateSession(decoded.sessionId)) {
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid',
        code: 'INVALID_SESSION'
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      verified: decoded.verified,
      sessionId: decoded.sessionId
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
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
