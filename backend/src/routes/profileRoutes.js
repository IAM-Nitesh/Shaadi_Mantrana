const express = require('express');
const router = express.Router();
const { profileController } = require('../config/controllers');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Get profiles with filtering and pagination (optional auth for personalization)
router.get('/', authenticateToken, profileController.getProfiles);

// Get current user profile (requires authentication)  
router.get('/me', authenticateToken, profileController.getProfile);

// Update user profile (requires authentication)
router.put('/me', authenticateToken, profileController.updateProfile);

module.exports = router;
