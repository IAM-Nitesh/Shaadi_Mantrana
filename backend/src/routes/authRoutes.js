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

// Email service health check endpoint
router.get('/email/health', async (req, res) => {
  try {
    const emailService = require('../services/emailService');
    const emailHealth = await emailService.testService();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'email-service',
      email: emailHealth,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'email-service',
      error: error.message,
      version: '1.0.0'
    });
  }
});

// OTP endpoints
router.post('/send-otp', (req, res) => authController.sendOTP(req, res));
router.post('/verify-otp', (req, res) => authController.verifyOTP(req, res));

// Profile endpoints
router.get('/profile', authenticateToken, (req, res) => authController.getProfile(req, res));

// Session management
router.post('/refresh', (req, res) => authController.refreshSession(req, res));
router.post('/refresh-token', (req, res) => authController.refreshSession(req, res)); // Alias for compatibility
router.post('/logout', authenticateToken, (req, res) => authController.logout(req, res));

// Auth status endpoint
router.get('/status', (req, res) => authController.getAuthStatus(req, res));

// Token endpoint for frontend
router.get('/token', (req, res) => authController.getToken(req, res));

// Check if an email is preapproved
router.get('/preapproved/check', (req, res, next) => {
  // Disable caching for this endpoint
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const email = req.query.email?.toLowerCase().trim();
  if (!email) return res.status(400).json({ preapproved: false });

  console.log(`🔍 Checking preapproved status for email: ${email}`);

  const { User } = require('../models');
  User.findOne({ email })
    .then(user => {
      console.log(`📊 User found:`, user ? { email: user.email, role: user.role, isApprovedByAdmin: user.isApprovedByAdmin } : 'NOT FOUND');

      if (user) {
        // Check if user is admin or approved by admin
        const isAdmin = user.role === 'admin';
        const isApproved = user.isApprovedByAdmin;

        console.log(`✅ User status - Admin: ${isAdmin}, Approved: ${isApproved}`);

        if (isAdmin || isApproved) {
          return res.json({ preapproved: true });
        }
      }

      console.log(`❌ User not preapproved`);
      return res.json({ preapproved: false });
    })
    .catch(err => {
      console.error('❌ Database error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

// Also handle OPTIONS preflight for this route specifically
router.options('/preapproved/check', (req, res) => {
  res.sendStatus(204); // No content needed for OPTIONS response
});

module.exports = router;
