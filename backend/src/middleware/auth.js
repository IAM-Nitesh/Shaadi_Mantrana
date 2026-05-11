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
// Balanced token expiry - long enough for admin sessions, short enough for security
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || config.JWT.EXPIRES_IN || '1h'; // 1 hour for better admin session stability
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || config.JWT.REFRESH_EXPIRES_IN || '7d';

// Debug flag: enable verbose auth logs in non-production or when AUTH_DEBUG=true
const AUTH_DEBUG = process.env.AUTH_DEBUG === 'true' || process.env.NODE_ENV !== 'production';

// Active sessions store (in production, use Redis)
// For now, we'll use database persistence
// In-memory caches for optimized session management
const activeSessions = new Map(); // Primary session cache
const sessionValidationCache = new Map(); // Cache validation results
const sessionSuccessHistory = new Map(); // Track successful validations
const warmupInProgress = new Set(); // Track ongoing warmup operations
const SESSION_CACHE_SIZE = 1000; // Limit cache size
const VALIDATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes validation cache TTL - increased for stability
const AUTH_TRANSIENT_GRACE_MS = 5 * 60 * 1000; // 5 minutes grace period for transient errors

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
  static verifyAccessToken(token, ignoreExpiration = false) {
    try {
      if (!JWT_SECRET) throw new Error('JWT secret not configured');
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'shaadi-mantra-api',
        audience: 'shaadi-mantra-app',
        ignoreExpiration: ignoreExpiration // Option to ignore expiration
      });
    } catch (error) {
      // If ignoring expiration and error is specifically about expiration
      if (ignoreExpiration && error.name === 'TokenExpiredError') {
        // Decode without verification to get the payload
        const decoded = jwt.decode(token);
        if (decoded) {
          return {
            ...decoded,
            isExpired: true
          };
        }
      }
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
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour - consistent with JWT_EXPIRES_IN
        aud: 'shaadi-mantra-app',
        iss: 'shaadi-mantra-api'
      };

      return this.generateAccessToken(newPayload);
    } catch (error) {
      throw new Error('Failed to refresh token: ' + error.message);
    }
  }

  // Enhanced session validation with better error handling, persistence, and admin fixes
  static async validateSession(sessionId) {
    if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: validateSession called for:', sessionId);
    
    // If no sessionId, fail fast
    if (!sessionId) {
      if (AUTH_DEBUG) console.log('❌ JWTSessionManager: validateSession - no sessionId provided');
      return false;
    }

    // Track validation attempts for metrics
    this.validationAttempts = (this.validationAttempts || 0) + 1;
    
    try {
      // First check in-memory cache for quick response
      const cachedResult = this.getSessionValidationCache(sessionId);
      if (cachedResult !== undefined) {
        // Short circuit if we have a recent validation result
        if (AUTH_DEBUG) console.log(`✅ JWTSessionManager: validateSession - using cached result: ${cachedResult}`);
        
        // Update lastAccessed asynchronously only if more than 5 minutes have passed
        if (cachedResult && cachedResult.session) {
          const now = Date.now();
          const lastAccessed = cachedResult.session.lastAccessed || 0;
          const fiveMinutesMs = 5 * 60 * 1000; // Increased back to 5 minutes for stability
          
          if (now - lastAccessed > fiveMinutesMs) {
            this.updateSessionLastAccessed(sessionId).catch(err => {
              // Just log and continue - we already know session is valid
              if (AUTH_DEBUG) console.log('⚠️ JWTSessionManager: Background lastAccessed update failed:', err.message);
            });
          }
        }
        
        return cachedResult;
      }

      // Perform full validation if not in cache - CRITICAL FIX for admin sessions
      const session = await this.getSession(sessionId);
      if (!session) {
        if (AUTH_DEBUG) console.log('❌ JWTSessionManager: validateSession - session not found in database');
        if (AUTH_DEBUG) console.log('❌ JWTSessionManager: Available sessions in memory:', Array.from(activeSessions.keys()));
        
        // CRITICAL: Check if session exists in memory but not database (data inconsistency)
        const memorySession = activeSessions.get(sessionId);
        if (memorySession) {
          console.warn('⚠️ JWTSessionManager: Session found in memory but not database, recreating in DB');
          try {
            // Recreate the session in database from memory
            await Session.create({
              sessionId: memorySession.sessionId,
              userId: memorySession.userId,
              userUuid: memorySession.userUuid,
              email: memorySession.email,
              role: memorySession.role,
              verified: memorySession.verified,
              refreshToken: memorySession.refreshToken,
              accessToken: memorySession.accessToken,
              createdAt: memorySession.createdAt || new Date(),
              lastAccessed: new Date()
            });
            if (AUTH_DEBUG) console.log('✅ JWTSessionManager: Session recreated in database from memory');
            
            // Cache the validation result
            this.setSessionValidationCache(sessionId, true);
            return true;
          } catch (recreateError) {
            console.error('❌ JWTSessionManager: Failed to recreate session in database:', recreateError);
            this.setSessionValidationCache(sessionId, false);
            return false;
          }
        }
        
        this.setSessionValidationCache(sessionId, false);
        return false;
      }

      if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: validateSession - session found:', {
        sessionId: session.sessionId,
        userId: session.userId,
        email: session.email,
        role: session.role,
        createdAt: session.createdAt,
        lastAccessed: session.lastAccessed
      });

      // Simplified and more reliable session expiry logic
      // Use a consistent 7-day expiry for all sessions to prevent admin logout issues
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days - consistent for all sessions
      const lastActivity = new Date(session.lastAccessed || session.createdAt).getTime();
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: validateSession - time check:', {
        lastActivity: new Date(lastActivity).toISOString(),
        timeSinceLastActivity: timeSinceLastActivity,
        timeSinceActivityMinutes: Math.round(timeSinceLastActivity / (1000 * 60)),
        maxAge: maxAge,
        maxAgeDays: maxAge / (24 * 60 * 60 * 1000),
        isExpired: timeSinceLastActivity > maxAge,
        sessionRole: session.role
      });
      
      // Only expire sessions that haven't been used for 7 days
      if (timeSinceLastActivity > maxAge) {
        if (AUTH_DEBUG) console.log('❌ JWTSessionManager: validateSession - session expired, deleting');
        if (AUTH_DEBUG) console.log('❌ JWTSessionManager: Session expired details:', {
          timeSinceLastActivity: timeSinceLastActivity,
          maxAge: maxAge,
          sessionRole: session.role
        });
        
        // Delete asynchronously to not block request
        this.deleteSession(sessionId).catch(err => {
          console.error('❌ JWTSessionManager: Error deleting expired session:', err);
        });
        this.setSessionValidationCache(sessionId, false);
        return false;
      }

      // Update lastAccessed time with throttling and batch processing
      // Only update if more than 5 minutes since last update to reduce DB load
      if (!session.lastAccessed || timeSinceLastActivity > 5 * 60 * 1000) {
        try {
          // Try to queue this update for bulk processing
          const sessionCacheWarmer = require('../services/sessionCacheWarmerService');
          if (sessionCacheWarmer && typeof sessionCacheWarmer.queueSessionUpdate === 'function') {
            // Add to bulk update queue
            sessionCacheWarmer.queueSessionUpdate(sessionId);
            if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: validateSession - lastAccessed update queued for bulk processing');
          } else {
            // Fall back to direct update if bulk processing is not available
            this.updateSessionLastAccessed(sessionId).catch(updateError => {
              if (AUTH_DEBUG) console.log('⚠️ JWTSessionManager: validateSession - failed to update lastAccessed:', updateError.message);
            });
            if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: validateSession - lastAccessed direct update scheduled');
          }
        } catch (updateError) {
          if (AUTH_DEBUG) console.log('⚠️ JWTSessionManager: validateSession - failed to schedule lastAccessed update:', updateError.message);
          // Don't fail validation just because we couldn't update lastAccessed
        }
      } else if (AUTH_DEBUG) {
        console.log('🔍 JWTSessionManager: validateSession - lastAccessed update skipped (throttled)');
      }

      // Cache validation result with session data for faster future access
      this.setSessionValidationCache(sessionId, true, { 
        session: {
          sessionId: session.sessionId,
          lastAccessed: session.lastAccessed,
          role: session.role,
          email: session.email
        }
      });
      
      if (AUTH_DEBUG) console.log('✅ JWTSessionManager: validateSession - session valid, cached result');
      
      // Record successful validation
      this.recordSessionSuccess(sessionId);
      
      // CRITICAL FIX: For admin sessions, ensure immediate cache warming
      if (session.role === 'admin') {
        // Warm the cache with multiple validation attempts to prevent immediate invalidation
        this.warmAdminSessionCache(sessionId, session);
      }
      
      return true;
    } catch (error) {
      // Better error handling for transient issues
      console.error('❌ JWTSessionManager: validateSession - error:', error);
      
      // Check if this is likely a transient error (connection, timeout, etc)
      const isTransientError = 
        error.name === 'MongoNetworkError' ||
        error.name === 'MongooseServerSelectionError' ||
        error.message.includes('timeout') ||
        error.message.includes('network') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT');
      
      if (isTransientError) {
        // For transient errors, enforce grace period for previous success
        const lastSuccessTimestamp = this.getLastSuccessfulSessionTimestamp(sessionId);
        if (lastSuccessTimestamp) {
          const timeSinceLastSuccess = Date.now() - lastSuccessTimestamp;
          if (timeSinceLastSuccess <= AUTH_TRANSIENT_GRACE_MS) {
            if (AUTH_DEBUG) console.log('⚠️ JWTSessionManager: Transient error but session within grace period, allowing access');
            return true;
          } else {
            console.warn(`⚠️ JWTSessionManager: Transient error but grace period expired (${Math.round(timeSinceLastSuccess / 1000)}s ago), denying access`);
          }
        }
        
        // Also check if session exists in memory cache during transient errors, but enforce grace period
        const memorySession = activeSessions.get(sessionId);
        if (memorySession && memorySession.lastValidatedAt) {
          const timeSinceLastValidation = Date.now() - memorySession.lastValidatedAt;
          if (timeSinceLastValidation <= AUTH_TRANSIENT_GRACE_MS) {
            if (AUTH_DEBUG) console.log('⚠️ JWTSessionManager: Transient error but memory session within grace period, allowing access');
            return true;
          } else {
            console.warn(`⚠️ JWTSessionManager: Transient error but memory session grace period expired (${Math.round(timeSinceLastValidation / 1000)}s ago), denying access`);
          }
        }
      }
      
      if (AUTH_DEBUG) console.log('❌ JWTSessionManager: validateSession - returning false due to error');
      return false;
    }
  }

  // Revoke session (logout)
  static revokeSession(sessionId) {
    // Also clear from validation cache and history
    sessionValidationCache.delete(sessionId);
    sessionSuccessHistory.delete(sessionId);
    return activeSessions.delete(sessionId);
  }
  
  // Session validation cache methods
  static getSessionValidationCache(sessionId) {
    const cached = sessionValidationCache.get(sessionId);
    if (!cached) return undefined;
    
    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp < VALIDATION_CACHE_TTL) {
      return cached.valid;
    }
    
    // Expired cache entry
    sessionValidationCache.delete(sessionId);
    return undefined;
  }
  
  static setSessionValidationCache(sessionId, isValid, metadata = null) {
    // Limit cache size with LRU-like behavior
    if (sessionValidationCache.size >= SESSION_CACHE_SIZE) {
      // Remove random old entry (approximate LRU without full implementation complexity)
      const oldestKey = sessionValidationCache.keys().next().value;
      if (oldestKey) {
        sessionValidationCache.delete(oldestKey);
      }
    }
    
    sessionValidationCache.set(sessionId, {
      valid: isValid,
      timestamp: Date.now(),
      ...metadata
    });
    
    // If valid, record in success history
    if (isValid) {
      this.recordSessionSuccess(sessionId);
    }
  }
  
  // Track successful session validations for resilience during transient errors
  static recordSessionSuccess(sessionId) {
    sessionSuccessHistory.set(sessionId, Date.now());
  }
  
  static checkPreviousSessionSuccess(sessionId) {
    const lastSuccess = sessionSuccessHistory.get(sessionId);
    if (!lastSuccess) return false;
    
    // Consider successful if validated in the last 24 hours
    const MAX_SUCCESS_AGE = 24 * 60 * 60 * 1000; // 24 hours
    return (Date.now() - lastSuccess) < MAX_SUCCESS_AGE;
  }

  static getLastSuccessfulSessionTimestamp(sessionId) {
    return sessionSuccessHistory.get(sessionId) || null;
  }
  
  // Check session health without updating lastAccessed (read-only)
  static async checkSessionHealth(sessionId) {
    if (!sessionId) {
      return { exists: false, valid: false };
    }

    try {
      // First check in memory for performance
      let session = activeSessions.get(sessionId);
      let foundInCache = !!session;
      
      // If not in memory, check database without updating lastAccessed
      if (!session) {
        // Use findOne directly to avoid updateLastAccessed in getSession
        session = await Session.findOne({ sessionId });
      }
      
      if (!session) {
        return { 
          exists: false, 
          valid: false,
          message: 'Session not found'
        };
      }

      // Calculate session metrics
      const now = Date.now();
      const createdAt = new Date(session.createdAt).getTime();
      const lastAccessed = new Date(session.lastAccessed || session.createdAt).getTime();
      const age = now - createdAt;
      const timeSinceLastActivity = now - lastAccessed;
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      const isExpired = timeSinceLastActivity > maxAge;
      
      return {
        exists: true,
        valid: !isExpired,
        foundInCache,
        metrics: {
          createdAt: new Date(createdAt).toISOString(),
          lastAccessed: new Date(lastAccessed).toISOString(),
          ageMs: age,
          ageHours: Math.round(age / 36000) / 100,
          ageDays: Math.round(age / (24 * 36000)) / 100,
          timeSinceActivityMs: timeSinceLastActivity,
          timeSinceActivityHours: Math.round(timeSinceLastActivity / 36000) / 100,
          timeSinceActivityDays: Math.round(timeSinceLastActivity / (24 * 36000)) / 100,
          isExpired,
          timeToExpiryMs: isExpired ? 0 : (maxAge - timeSinceLastActivity),
          timeToExpiryDays: isExpired ? 0 : Math.round((maxAge - timeSinceLastActivity) / (24 * 36000)) / 100
        },
        session: {
          sessionId: session.sessionId,
          userId: session.userId,
          email: session.email,
          role: session.role,
          verified: session.verified
        }
      };
    } catch (error) {
      console.error('Session health check error:', error);
      return { 
        exists: false, 
        valid: false,
        error: error.message
      };
    }
  }

  // Enhanced update session last accessed time with throttling and batching
  static async updateSessionLastAccessed(sessionId) {
    try {
      // Performance optimization: Update both DB and memory cache
      const result = await Session.updateOne(
        { sessionId },
        { $set: { lastAccessed: new Date() } },
        { upsert: false } // Don't create new session if it doesn't exist
      );
      
      // Also update in-memory cache if available
      const cachedSession = activeSessions.get(sessionId);
      if (cachedSession) {
        cachedSession.lastAccessed = new Date();
        activeSessions.set(sessionId, cachedSession);
      }
      
      if (result.matchedCount === 0) {
        if (AUTH_DEBUG) console.log('⚠️ JWTSessionManager: Session not found for lastAccessed update:', sessionId);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ JWTSessionManager: Error updating session lastAccessed:', error);
      return false;
    }
  }
  
  // Bulk update for session last accessed times
  // This can be used by the background service to update many sessions at once
  static async bulkUpdateLastAccessed(sessionIds) {
    if (!sessionIds || !sessionIds.length) return { matched: 0, modified: 0 };
    
    try {
      const now = new Date();
      const operations = sessionIds.map(sessionId => ({
        updateOne: {
          filter: { sessionId },
          update: { $set: { lastAccessed: now } }
        }
      }));
      
      const result = await Session.bulkWrite(operations);
      
      // Also update in-memory cache
      sessionIds.forEach(sessionId => {
        const cachedSession = activeSessions.get(sessionId);
        if (cachedSession) {
          cachedSession.lastAccessed = now;
          activeSessions.set(sessionId, cachedSession);
        }
      });
      
      return {
        matched: result.matchedCount,
        modified: result.modifiedCount
      };
    } catch (error) {
      console.error('❌ JWTSessionManager: Error in bulk update of lastAccessed:', error);
      return { matched: 0, modified: 0, error: error.message };
    }
  }
  // Warm the session cache with an existing session document
  static warmSessionCache(sessionDoc) {
    if (!sessionDoc || !sessionDoc.sessionId) return false;
    
    // Skip if already in cache
    if (activeSessions.has(sessionDoc.sessionId)) return true;
    
    // Skip if warmup already in progress for this session
    if (warmupInProgress.has(sessionDoc.sessionId)) return true;
    
    // Mark warmup as in progress
    warmupInProgress.add(sessionDoc.sessionId);
    
    try {
      // Ensure the session cache doesn't grow too large
      if (activeSessions.size >= SESSION_CACHE_SIZE) {
        // Remove a random entry to make room
        const oldestKey = activeSessions.keys().next().value;
        if (oldestKey) {
          activeSessions.delete(oldestKey);
        }
      }
      
      // Add to cache - use toObject() if it's a mongoose document
      const sessionData = typeof sessionDoc.toObject === 'function' 
        ? sessionDoc.toObject() 
        : sessionDoc;
        
      // Add validation timestamp to cached session
      const sessionWithValidation = {
        ...sessionData,
        lastValidatedAt: Date.now()
      };
      
      activeSessions.set(sessionDoc.sessionId, sessionWithValidation);
      
      if (AUTH_DEBUG) console.log('🔥 JWTSessionManager: Warmed session cache for:', sessionDoc.sessionId);
      return true;
    } catch (error) {
      console.error('❌ JWTSessionManager: Error warming session cache:', error);
      return false;
    } finally {
      // Always clean up warmup flag
      warmupInProgress.delete(sessionDoc.sessionId);
    }
  }

  // Get session by ID with enhanced caching
  static async getSession(sessionId) {
    if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: getSession called for:', sessionId);
    
    // First check in-memory cache
    let session = activeSessions.get(sessionId);
    
    if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: getSession - in-memory cache check:', {
      foundInCache: !!session,
      cacheSize: activeSessions.size,
      cacheKeys: Array.from(activeSessions.keys()).slice(0, 5) // Only log a few keys to avoid flooding
    });

    if (!session) {
      if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: getSession - not in cache, checking database');
      // If not in memory, check database
      try {
        session = await Session.findBySessionId(sessionId);
        if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: getSession - database check result:', !!session);
        
        if (session) {
          // Don't update lastAccessed here to reduce write operations
          // Just cache in memory for faster future access
          this.warmSessionCache(session);
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

  // Enhanced clean expired sessions with better logic and cache cleanup
  static async cleanExpiredSessions() {
    try {
      // Extend session lifetime to 30 days to prevent premature logouts
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days instead of 7
      const now = Date.now();

      if (AUTH_DEBUG) console.log('🧹 JWTSessionManager: Starting session cleanup...');

      // Clean in-memory sessions based on lastAccessed
      let cleanedFromMemory = 0;
      for (const [sessionId, session] of activeSessions.entries()) {
        const lastActivity = new Date(session.lastAccessed || session.createdAt).getTime();
        if (now - lastActivity > maxAge) {
          activeSessions.delete(sessionId);
          // Also clean from validation cache and history
          sessionValidationCache.delete(sessionId);
          sessionSuccessHistory.delete(sessionId);
          cleanedFromMemory++;
        }
      }

      // Clean expired entries from validation cache (older than TTL)
      let cleanedValidationCache = 0;
      for (const [sessionId, entry] of sessionValidationCache.entries()) {
        if (now - entry.timestamp > VALIDATION_CACHE_TTL) {
          sessionValidationCache.delete(sessionId);
          cleanedValidationCache++;
        }
      }

      // Clean expired entries from success history (older than 24 hours)
      let cleanedSuccessHistory = 0;
      for (const [sessionId, timestamp] of sessionSuccessHistory.entries()) {
        if (now - timestamp > 24 * 60 * 60 * 1000) {
          sessionSuccessHistory.delete(sessionId);
          cleanedSuccessHistory++;
        }
      }

      if (AUTH_DEBUG) {
        console.log(`🧹 JWTSessionManager: Cleaned ${cleanedFromMemory} sessions from memory`);
        console.log(`🧹 JWTSessionManager: Cleaned ${cleanedValidationCache} entries from validation cache`);
        console.log(`🧹 JWTSessionManager: Cleaned ${cleanedSuccessHistory} entries from success history`);
      }

      // Clean database sessions - use 30 days instead of 7
      const expiredCount = await Session.deleteMany({
        lastAccessed: { $lt: new Date(now - maxAge) }
      });

      if (AUTH_DEBUG) console.log(`🧹 JWTSessionManager: Cleaned up ${expiredCount.deletedCount} expired sessions from database`);
    } catch (error) {
      console.error('❌ JWTSessionManager: Error cleaning expired sessions:', error);
    }
  }

  // CRITICAL FIX: Warm admin session cache to prevent immediate logout
  static warmAdminSessionCache(sessionId, session) {
    if (AUTH_DEBUG) console.log('🔍 JWTSessionManager: Warming admin session cache for:', sessionId);
    
    try {
      // Pre-populate validation cache with extended TTL for admin sessions
      this.setSessionValidationCache(sessionId, true, { 
        session,
        isAdminSession: true,
        warmedAt: Date.now()
      });
      
      // Record multiple successful validations to build resilience
      this.recordSessionSuccess(sessionId);
      
      // Ensure session is in memory cache with validation timestamp
      const sessionWithValidation = {
        ...session,
        lastValidatedAt: Date.now()
      };
      activeSessions.set(sessionId, sessionWithValidation);
      
      if (AUTH_DEBUG) console.log('✅ JWTSessionManager: Admin session cache warmed successfully');
    } catch (error) {
      console.error('❌ JWTSessionManager: Failed to warm admin session cache:', error);
    }
  }
}

// Enhanced authentication middleware with admin session fixes
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Fallback: try HttpOnly cookie 'accessToken' when Authorization header is missing
  const cookieToken = req.cookies?.accessToken;
  if (!token && cookieToken) {
    token = cookieToken;
  }

  // Enhanced logging for admin route debugging
  const isAdminRoute = req.originalUrl.includes('/admin/');
  const isAuthRoute = req.originalUrl.includes('/auth/');
  
  if (AUTH_DEBUG || isAdminRoute) {
    console.log('🔍 AuthMiddleware: Starting token verification...', {
      method: req.method,
      url: req.originalUrl,
      isAdminRoute,
      isAuthRoute,
      authHeaderPresent: !!authHeader,
      cookieObjectPresent: !!req.cookies,
      cookieKeys: Object.keys(req.cookies || {}),
      hasAdminRequestHeader: req.headers['x-admin-request'] === 'true'
    });

    console.log('🔍 AuthMiddleware: Auth header present:', !!authHeader);
    console.log('🔍 AuthMiddleware: Cookie token present:', !!cookieToken);
    console.log('🔍 AuthMiddleware: Token source:', authHeader ? 'Authorization header' : (cookieToken ? 'cookie' : 'none'));
    console.log('🔍 AuthMiddleware: Token extracted:', !!token);
    console.log('🔍 AuthMiddleware: Token length:', token?.length || 0);
    // Mask token preview for safety
    if (token && token.length > 20) {
      console.log('🔍 AuthMiddleware: Token preview:', `${token.substring(0, 10)}...${token.substring(token.length - 10)}`);
    }
  }

  if (!token) {
    console.log('❌ AuthMiddleware: No token provided for', req.originalUrl);
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

    
    // Update session access time before proceeding (non-blocking)
    if (decoded.sessionId) {
      // Don't await this to avoid blocking the request
      JWTSessionManager.updateSessionLastAccessed(decoded.sessionId).catch(err => {
        if (AUTH_DEBUG) console.log('⚠️ AuthMiddleware: Failed to update session lastAccessed (non-blocking):', err.message);
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
