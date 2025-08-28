const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllerMongo');
const { authenticateToken } = require('../middleware/auth');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: '1.0.0'
  });
});

// OTP endpoints
router.post('/send-otp', (req, res) => authController.sendOTP(req, res));
router.post('/verify-otp', (req, res) => authController.verifyOTP(req, res));

// Profile endpoints
router.get('/profile', authenticateToken, (req, res) => authController.getProfile(req, res));

// Session management
router.post('/refresh', (req, res) => authController.refreshSession(req, res));
router.post('/logout', authenticateToken, (req, res) => authController.logout(req, res));

// Check if an email is preapproved
router.get('/preapproved/check', async (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://shaadi-mantrana-app-frontend.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const email = req.query.email?.toLowerCase().trim();
  if (!email) return res.status(400).json({ preapproved: false });

  const { User } = require('../models');
  const user = await User.findOne({ email });
  
  if (user) {
    // Check if user is admin or approved by admin
    const isAdmin = user.role === 'admin';
    const isApproved = user.isApprovedByAdmin;
    
    if (isAdmin || isApproved) {
      return res.json({ preapproved: true });
    }
  }
  
  return res.json({ preapproved: false });
});

module.exports = router;
