const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingControllerMongo');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get discovery profiles (with daily limit)
router.get('/discovery', matchingController.getDiscoveryProfiles.bind(matchingController));

// Like a profile (swipe right)
router.post('/like', matchingController.likeProfile.bind(matchingController));

// Pass on a profile (swipe left)
router.post('/pass', matchingController.passProfile.bind(matchingController));

// Get liked profiles (for Request tab)
router.get('/liked', matchingController.getLikedProfiles.bind(matchingController));

// Get mutual matches (for Matches tab)
router.get('/matches', matchingController.getMutualMatches.bind(matchingController));

// Get daily like statistics
router.get('/stats', matchingController.getDailyLikeStats.bind(matchingController));

module.exports = router; 