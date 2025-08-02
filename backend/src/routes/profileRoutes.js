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

// Get user profile by UUID (public)
router.get('/uuid/:uuid', profileController.getProfileByUuid);

// Soft delete user profile (authenticated)
router.delete('/me', authenticateToken, profileController.deleteProfile);

// Update onboarding message flag (authenticated)
router.patch('/me/onboarding', authenticateToken, profileController.updateOnboardingMessage);

module.exports = router;
