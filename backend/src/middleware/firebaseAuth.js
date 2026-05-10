const { verifyIdToken } = require('../services/firebaseService');
const logger = require('../utils/logger');
const { User } = require('../models');

/**
 * Middleware to verify Firebase ID Token
 * This replaces or augments the standard JWT auth for Firebase-enabled routes
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await verifyIdToken(idToken);
      
      // Add firebase info to request
      req.firebaseUser = decodedToken;
      
      // Look for the user in our MongoDB by firebaseUid or phoneNumber
      let user = await User.findOne({ 
        $or: [
          { firebaseUid: decodedToken.uid },
          { phoneNumber: decodedToken.phone_number }
        ]
      });

      // If user exists, attach to request
      if (user) {
        req.user = {
          userId: user._id,
          userUuid: user.userUuid,
          email: user.email,
          role: user.role
        };
      }

      next();
    } catch (error) {
      logger.error('Firebase token verification failed:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired Firebase token'
      });
    }
  } catch (error) {
    logger.error('Firebase Auth Middleware Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication'
    });
  }
};

module.exports = {
  verifyFirebaseToken
};
