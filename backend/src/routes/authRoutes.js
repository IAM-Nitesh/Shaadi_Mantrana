const express = require('express');
const router = express.Router();
const { authController } = require('../config/controllers');
const { authenticateToken } = require('../middleware/auth');

// Public authentication routes
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/refresh-token', authController.refreshSession || authController.refreshToken);

// Protected routes (require JWT authentication)
router.post('/logout', authenticateToken, authController.logout);
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;
