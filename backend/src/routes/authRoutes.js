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
router.get('/preapproved/check', (req, res, next) => {
  // IMPROVED explicit CORS headers for this route
  res.header('Access-Control-Allow-Origin', 'https://shaadi-mantrana-app-frontend.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  const email = req.query.email?.toLowerCase().trim();
  if (!email) return res.status(400).json({ preapproved: false });

  const { User } = require('../models');
  User.findOne({ email })
    .then(user => {
      if (user) {
        // Check if user is admin or approved by admin
        const isAdmin = user.role === 'admin';
        const isApproved = user.isApprovedByAdmin;
        
        if (isAdmin || isApproved) {
          return res.json({ preapproved: true });
        }
      }
      
      return res.json({ preapproved: false });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// Also handle OPTIONS preflight for this route specifically
router.options('/preapproved/check', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://shaadi-mantrana-app-frontend.vercel.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(204); // No content needed for OPTIONS response
});

module.exports = router;
