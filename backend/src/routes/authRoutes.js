const express = require('express');
const router = express.Router();
const { authController } = require('../config/controllers');
const { authenticateToken } = require('../middleware/auth');
const { PreapprovedEmail } = require('../models');

// Public authentication routes
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/refresh-token', authController.refreshSession || authController.refreshToken);

// Protected routes (require JWT authentication)
router.post('/logout', authenticateToken, authController.logout);
router.get('/profile', authenticateToken, authController.getProfile);

// Check if an email is preapproved
router.get('/preapproved/check', async (req, res) => {
  const email = req.query.email?.toLowerCase().trim();
  if (!email) return res.status(400).json({ preapproved: false });

  const { User, PreapprovedEmail } = require('../models');
  const user = await User.findOne({ email });
  const isAdmin = user && user.role === 'admin';

  if (isAdmin) {
    // Admins are always allowed
    return res.json({ preapproved: true });
  }

  // For non-admins, check preapprovedemails
  const preapproved = await PreapprovedEmail.findOne({ email });
  if (preapproved && preapproved.approvedByAdmin) {
    return res.json({ preapproved: true });
  }
  return res.json({ preapproved: false });
});

module.exports = router;
