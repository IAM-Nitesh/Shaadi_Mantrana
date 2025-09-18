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

// Debug flag: enable verbose auth logs in non-production or when AUTH_DEBUG=true
const AUTH_DEBUG = process.env.AUTH_DEBUG === 'true' || process.env.NODE_ENV !== 'production';

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
    if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: Creating session for user:', {
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

    if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: Creating payload:', payload);

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: Tokens generated successfully');

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

      const createdSession = await Session.create(sessionData);
      if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: Session stored in database:', payload.sessionId);
      if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: Created session details:', {
        _id: createdSession._id,
        sessionId: createdSession.sessionId,
        userId: createdSession.userId,
        email: createdSession.email,
        createdAt: createdSession.createdAt,
        lastAccessed: createdSession.lastAccessed
      });

      // Also store in memory for faster access
      // Use the created session data from database to ensure consistency
      const sessionForCache = {
        ...sessionData,
        _id: createdSession._id,
        createdAt: createdSession.createdAt,
        lastAccessed: createdSession.lastAccessed
      };
      activeSessions.set(payload.sessionId, sessionForCache);
      if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: Session cached in memory:', payload.sessionId);
      if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: Current active sessions count:', activeSessions.size);
      
      // Verify the session can be retrieved immediately after creation
      try {
        const verifySession = await this.getSession(payload.sessionId);
        if (verifySession) {
          if (AUTH_DEBUG) console.log('✅ JWTSessionManager: Session verification successful after creation');
        } else {
          if (AUTH_DEBUG) console.log('❌ JWTSessionManager: Session verification failed after creation');
        }
      } catch (verifyError) {
        if (AUTH_DEBUG) console.log('❌ JWTSessionManager: Session verification error after creation:', verifyError.message);
      }

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
      // Re-throw the original jwt error so callers can distinguish expiry vs invalid
      throw error;
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
    if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: validateSession called for:', sessionId);
    
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        if (AUTH_DEBUG) console.log('❌ JWTSessionManager: validateSession - session not found');
        return false;
      }

      if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: validateSession - session found:', {
        sessionId: session.sessionId,
        userId: session.userId,
        email: session.email,
        createdAt: session.createdAt,
        lastAccessed: session.lastAccessed
      });

      // Check if session is too old (7 days of inactivity)
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      const lastActivity = new Date(session.lastAccessed || session.createdAt).getTime();
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: validateSession - time check:', {
        lastActivity: new Date(lastActivity).toISOString(),
        timeSinceLastActivity: timeSinceLastActivity,
        maxAge: maxAge,
        isExpired: timeSinceLastActivity > maxAge
      });
      
      // Be more lenient for recently created sessions (within 1 minute)
      const isRecentlyCreated = timeSinceLastActivity < 60000; // 1 minute
      if (timeSinceLastActivity > maxAge && !isRecentlyCreated) {
        if (AUTH_DEBUG) console.log('❌ JWTSessionManager: validateSession - session expired, deleting');
        await this.deleteSession(sessionId);
        return false;
      }
      
      if (isRecentlyCreated) {
        if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: validateSession - session is recently created, allowing');
      }

      // Update lastAccessed time to keep session alive
      try {
        await this.updateSessionLastAccessed(sessionId);
        if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: validateSession - lastAccessed updated');
      } catch (updateError) {
        if (AUTH_DEBUG) console.log('⚠️ JWTSessionManager: validateSession - failed to update lastAccessed:', updateError.message);
        // Don't fail validation just because we couldn't update lastAccessed
      }

      if (AUTH_DEBUG) console.log('✅ JWTSessionManager: validateSession - session valid');
      return true;
    } catch (error) {
      if (AUTH_DEBUG) console.log('❌ JWTSessionManager: validateSession - error:', error.message);
      return false;
    }
  }

  // Revoke session (logout)
  static revokeSession(sessionId) {
    return activeSessions.delete(sessionId);
  }

  // Update session last accessed time
  static async updateSessionLastAccessed(sessionId) {
    try {
      await Session.updateOne(
        { sessionId },
        { lastAccessed: new Date() }
      );
      return true;
    } catch (error) {
      console.error('❌ JWTSessionManager: Error updating session lastAccessed:', error);
      return false;
    }
  }

  // Get session by ID
  static async getSession(sessionId) {
    if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: getSession called for:', sessionId);
    
    // First check in-memory cache
    let session = activeSessions.get(sessionId);
    
    if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: getSession - in-memory cache check:', {
      foundInCache: !!session,
      cacheSize: activeSessions.size,
      cacheKeys: Array.from(activeSessions.keys())
    });

    if (!session) {
      if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: getSession - not in cache, checking database');
      // If not in memory, check database
      try {
        session = await Session.findBySessionId(sessionId);
        if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: getSession - database check result:', !!session);
        
        if (session) {
          // Update last accessed time
          session.lastAccessed = new Date();
          await session.save();

          // Cache in memory for faster future access
          activeSessions.set(sessionId, session.toObject());
          if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: getSession - session cached in memory');
        }
      } catch (error) {
        console.error('❌ JWTSessionManager: Error retrieving session from database:', error);
        return null;
      }
    }

    if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: getSession - returning session:', !!session);
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
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days of inactivity
      const now = Date.now();

      if (AUTH_DEBUG) console.log('🧹 JWTSessionManager: Starting session cleanup...');

      // Clean in-memory sessions based on lastAccessed
      let cleanedFromMemory = 0;
      for (const [sessionId, session] of activeSessions.entries()) {
        const lastActivity = new Date(session.lastAccessed || session.createdAt).getTime();
        if (now - lastActivity > maxAge) {
          activeSessions.delete(sessionId);
          cleanedFromMemory++;
        }
      }

      if (AUTH_DEBUG) console.log(`🧹 JWTSessionManager: Cleaned ${cleanedFromMemory} sessions from memory`);

      // Clean database sessions (TTL will handle most, but this ensures consistency)
      // Be more conservative - only clean sessions that are definitely expired
      const expiredCount = await Session.deleteMany({
        lastAccessed: { $lt: new Date(now - maxAge) }
      });

      if (AUTH_DEBUG) console.log(`🧹 JWTSessionManager: Cleaned up ${expiredCount.deletedCount} expired sessions from database`);
    } catch (error) {
      console.error('❌ JWTSessionManager: Error cleaning expired sessions:', error);
    }
  }
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Fallback: try HttpOnly cookie 'accessToken' when Authorization header is missing
  const cookieToken = req.cookies?.accessToken;
  if (!token && cookieToken) {
    token = cookieToken;
  }

  // Verbose request-context logs (only in dev or when AUTH_DEBUG=true)
  if (AUTH_DEBUG) {
    console.log('🔍 AuthMiddleware: Starting token verification...', {
      method: req.method,
      url: req.originalUrl,
      authHeaderPresent: !!authHeader,
      cookieObjectPresent: !!req.cookies,
      cookieKeys: Object.keys(req.cookies || {}),
    });

    console.log('🔍 AuthMiddleware: Auth header present:', !!authHeader);
    console.log('🔍 AuthMiddleware: Cookie token present:', !!cookieToken);
    console.log('🔍 AuthMiddleware: Token source:', authHeader ? 'Authorization header' : (cookieToken ? 'cookie' : 'none'));
    console.log('🔍 AuthMiddleware: Token extracted:', !!token);
    console.log('🔍 AuthMiddleware: Token length:', token?.length || 0);
    // Mask token preview for safety
    if (token && token.length > 20) {
      console.log('🔍 AuthMiddleware: Token preview:', `${token.substring(0, 10)}...${token.substring(token.length - 10)}`);
    } else {
      console.log('🔍 AuthMiddleware: Token preview:', token || 'None');
    }
  }

  if (!token) {
    console.log('❌ AuthMiddleware: No token provided');
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  try {
  if (AUTH_DEBUG) console.log('🔍 AuthMiddleware: Verifying token...');
    let decoded;
    try {
      decoded = JWTSessionManager.verifyAccessToken(token);
    } catch (err) {
      // Distinguish token expired vs invalid
      if (err && err.name === 'TokenExpiredError') {
        if (AUTH_DEBUG) console.log('❌ AuthMiddleware: Token expired');
        return res.status(401).json({ success: false, error: 'Access token expired', code: 'TOKEN_EXPIRED' });
      }
      if (AUTH_DEBUG) console.log('❌ AuthMiddleware: Token invalid');
      return res.status(401).json({ success: false, error: 'Invalid access token', code: 'TOKEN_INVALID' });
    }
    if (AUTH_DEBUG) console.log('🔍 AuthMiddleware: Token verified, decoded:', {
      userId: decoded.userId,
      email: decoded.email,
      sessionId: decoded.sessionId,
      role: decoded.role
    });
    
    // Validate session exists
    if (AUTH_DEBUG) {
      console.log('🔍 AuthMiddleware: Validating session...');
      console.log('🔍 AuthMiddleware: Session ID:', decoded.sessionId);
      console.log('🔍 AuthMiddleware: Active sessions count:', activeSessions.size);
      console.log('🔍 AuthMiddleware: Active session IDs:', Array.from(activeSessions.keys()));
    }
    
    if (!(await JWTSessionManager.validateSession(decoded.sessionId))) {
      if (AUTH_DEBUG) console.log('❌ AuthMiddleware: Session not found or invalid');
      if (AUTH_DEBUG) console.log('❌ AuthMiddleware: Session validation failed');
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid',
        code: 'INVALID_SESSION'
      });
    }

  if (AUTH_DEBUG) console.log('✅ AuthMiddleware: Session validated successfully');

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
          if (AUTH_DEBUG) console.log('❌ AuthMiddleware: User account paused');
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
    
    if (AUTH_DEBUG) console.log('✅ AuthMiddleware: Authentication successful');
    next();
  } catch (error) {
    console.error('❌ AuthMiddleware: Unexpected error during authentication:', error);
    return res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  // optionalAuth: allow cookie fallback
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = JWTSessionManager.verifyAccessToken(token);
    
    if (await JWTSessionManager.validateSession(decoded.sessionId)) {
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
