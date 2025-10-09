// API endpoint to get token information for the client
const { authenticateToken, JWTSessionManager } = require('../../middleware/auth');
const logger = require('../../utils/logger');

/**
 * Handler for GET /api/auth/token
 * Returns information about the current user's access token
 */
module.exports = async (req, res) => {
  try {
    // Get token from authorization header or cookie
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    
    // Fall back to cookie if no authorization header
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }
    
    try {
      // Verify the token without failing on expiration
      const decoded = JWTSessionManager.verifyAccessToken(token, true);
      
      // Return only metadata, not the token (which is already set as an HttpOnly cookie)
      return res.status(200).json({
        success: true,
        expiresAt: decoded.exp * 1000 // Convert to milliseconds for client
      });
    } catch (tokenError) {
      logger.debug('Token info check failed:', tokenError.message);
      
      // Return information about the invalid token
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        errorDetail: tokenError.message
      });
    }
  } catch (error) {
    logger.error('Error in token info endpoint:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Server error while getting token info' 
    });
  }
};