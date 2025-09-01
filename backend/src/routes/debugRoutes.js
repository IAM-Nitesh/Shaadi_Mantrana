const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Message = require('../models/Message');
const ChatThread = require('../models/ChatThread');
const Conversation = require('../models/Conversation');

// Protect debug routes with auth to avoid accidental exposure
router.use(authenticateToken);

// Get debug stats for a connection
router.get('/chat/:connectionId/stats', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const messages = await Message.find({ connectionId }).sort({ createdAt: 1 }).lean();
    const thread = await ChatThread.findOne({ connectionId }).lean();
    const conv = await Conversation.findOne({ connectionId }).lean();

    res.status(200).json({
      success: true,
      connectionId,
      messagesCount: messages.length,
      messages: messages.map(m => ({
        _id: m._id,
        sender: m.sender,
        text: m.text,
        status: m.status,
        createdAt: m.createdAt
      })),
      chatThread: thread || null,
      conversation: conv || null
    });
  } catch (error) {
    console.error('Debug stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Migrate existing Message documents for a connection into a single ChatThread
router.post('/chat/:connectionId/migrate', async (req, res) => {
  try {
    const { connectionId } = req.params;

    const messages = await Message.find({ connectionId }).sort({ createdAt: 1 }).lean();
    if (!messages || messages.length === 0) {
      return res.status(200).json({ success: true, message: 'No messages to migrate' });
    }

    // Build subdocuments preserving createdAt
    const subdocs = messages.map(m => ({
      sender: m.sender,
      text: m.text,
      status: m.status || 'sent',
      createdAt: m.createdAt
    }));

    // Determine lastMessageAt as the latest message time
    const lastMessageAt = messages[messages.length - 1].createdAt || new Date();

    // If a thread exists, append; otherwise create new thread with preserved lastMessageAt
    let thread = await ChatThread.findOne({ connectionId });
    if (thread) {
      // Append messages and update lastMessageAt
      await ChatThread.updateOne({ connectionId }, { $push: { messages: { $each: subdocs } }, $set: { lastMessageAt } });
      thread = await ChatThread.findOne({ connectionId }).lean();
    } else {
      // Create new thread and set lastMessageAt to latest message time
      thread = await ChatThread.create({ connectionId, messages: subdocs, lastMessageAt });
    }

    // Remove old Message documents
    await Message.deleteMany({ connectionId });

    res.status(200).json({ success: true, migrated: subdocs.length, chatThread: thread });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// JWT Debug endpoint (no auth required to debug auth issues)
router.get('/jwt-status', (req, res) => {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
      isProduction: config.isProduction,
      
      // Configuration check (safe for production)
      jwtConfig: {
        hasSecret: !!config.JWT.SECRET,
        secretLength: config.JWT.SECRET ? config.JWT.SECRET.length : 0,
        issuer: config.JWT.ISSUER,
        audience: config.JWT.AUDIENCE,
        algorithm: config.JWT.ALGORITHM,
        expiresIn: config.JWT.EXPIRES_IN
      },
      
      // Request analysis
      request: {
        headers: {
          hasAuthorization: !!req.headers.authorization,
          authHeader: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : null,
          hasCookies: !!req.headers.cookie,
          cookieLength: req.headers.cookie ? req.headers.cookie.length : 0
        },
        cookies: {
          hasAccessToken: !!req.cookies?.accessToken,
          accessTokenLength: req.cookies?.accessToken ? req.cookies.accessToken.length : 0,
          hasRefreshToken: !!req.cookies?.refreshToken,
          hasSessionId: !!req.cookies?.sessionId,
          cookieNames: Object.keys(req.cookies || {})
        }
      }
    };

    // If there's an access token, try to analyze it (without revealing sensitive info)
    if (req.cookies?.accessToken) {
      const token = req.cookies.accessToken;
      
      try {
        // Try to decode without verification first to see the structure
        const decoded = jwt.decode(token, { complete: true });
        if (decoded) {
          debugInfo.tokenAnalysis = {
            header: decoded.header,
            payload: {
              iss: decoded.payload.iss,
              aud: decoded.payload.aud,
              exp: decoded.payload.exp,
              iat: decoded.payload.iat,
              hasUserId: !!decoded.payload.userId,
              hasEmail: !!decoded.payload.email,
              hasSessionId: !!decoded.payload.sessionId
            }
          };
        }
        
        // Try actual verification
        try {
          const verified = jwt.verify(token, config.JWT.SECRET, {
            issuer: config.JWT.ISSUER,
            audience: config.JWT.AUDIENCE
          });
          debugInfo.verification = {
            success: true,
            userId: verified.userId ? 'present' : 'missing',
            email: verified.email ? 'present' : 'missing'
          };
        } catch (verifyError) {
          debugInfo.verification = {
            success: false,
            error: verifyError.message,
            errorType: verifyError.name
          };
        }
        
      } catch (decodeError) {
        debugInfo.tokenAnalysis = {
          error: decodeError.message,
          tokenPreview: token.substring(0, 50) + '...'
        };
      }
    }

    res.json(debugInfo);
    
  } catch (error) {
    res.status(500).json({
      error: 'Debug endpoint error',
      message: error.message
    });
  }
});

// Test endpoint to generate and verify a token (no auth required for debugging)
router.post('/jwt-test', (req, res) => {
  try {
    const testPayload = {
      userId: 'test-user-id',
      userUuid: 'test-user-uuid',
      email: 'test@example.com',
      role: 'user',
      verified: true,
      sessionId: 'test-session-' + Date.now()
    };

    // Generate token with current config
    const token = jwt.sign(testPayload, config.JWT.SECRET, {
      expiresIn: config.JWT.EXPIRES_IN,
      issuer: config.JWT.ISSUER,
      audience: config.JWT.AUDIENCE
    });

    // Immediately try to verify it
    try {
      const verified = jwt.verify(token, config.JWT.SECRET, {
        issuer: config.JWT.ISSUER,
        audience: config.JWT.AUDIENCE
      });

      res.json({
        success: true,
        tokenLength: token.length,
        generated: {
          iss: config.JWT.ISSUER,
          aud: config.JWT.AUDIENCE
        },
        verified: {
          userId: verified.userId,
          email: verified.email,
          iss: verified.iss,
          aud: verified.aud
        }
      });
    } catch (verifyError) {
      res.json({
        success: false,
        tokenGenerated: true,
        tokenLength: token.length,
        verificationError: verifyError.message
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      tokenGenerated: false,
      error: error.message
    });
  }
});

// Debug endpoint to check user profile completeness calculation
router.get('/user-profile-debug/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const User = require('../models/User');
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profileCompleteness = user.profile?.profileCompleteness || user.profileCompleteness || 0;
    
    res.json({
      userId: user._id,
      email: user.email,
      profileData: {
        rootLevelProfileCompleteness: user.profileCompleteness,
        nestedProfileCompleteness: user.profile?.profileCompleteness,
        calculatedProfileCompleteness: profileCompleteness,
        isFirstLogin: user.isFirstLogin,
        profileCompleted: user.profileCompleted,
        hasSeenOnboardingMessage: user.hasSeenOnboardingMessage
      },
      authResponse: {
        userUuid: user._id.toString(),
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        isApprovedByAdmin: user.isApprovedByAdmin,
        profileCompleteness: profileCompleteness,
        hasSeenOnboardingMessage: user.hasSeenOnboardingMessage || false
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Debug endpoint error',
      message: error.message
    });
  }
});

module.exports = router;

