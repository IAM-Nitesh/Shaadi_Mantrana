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

// Get public profile by MongoDB _id (for viewing match/chat partner profile — auth required)
router.get('/public/:userId', authenticateToken, profileController.getPublicProfileById.bind(profileController));

// Hard-delete user account — purges all user data (Play Store compliance)
router.delete('/me', authenticateToken, profileController.deleteAccount);

// Update onboarding message flag (authenticated)
router.patch('/me/onboarding', authenticateToken, profileController.updateOnboardingMessage);

// Update onboarding message flag
router.put('/onboarding-flag', authenticateToken, profileController.updateOnboardingMessage.bind(profileController));

// Update first login flag
router.put('/first-login-flag', authenticateToken, profileController.updateFirstLoginFlag.bind(profileController));

module.exports = router;
