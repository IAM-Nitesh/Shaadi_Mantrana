// Admin Routes
// Handles administrative functions like email approval management

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const preApprovedEmailService = require('../services/preApprovedEmailService');

// Admin middleware (basic implementation - in production use proper role-based auth)
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'NO_AUTH'
    });
  }

  // Simple admin check - in production, implement proper role-based authorization
  const adminEmails = ['admin@shaadimantra.com', 'nitesh@shaadimantra.com'];
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }

  next();
};

// Get all approved emails and stats
router.get('/approved-emails', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const emailData = preApprovedEmailService.getAllApprovedEmails();
    res.status(200).json({
      success: true,
      data: emailData
    });
  } catch (error) {
    console.error('❌ Error getting approved emails:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get approved emails',
      message: error.message
    });
  }
});

// Get pending email approvals
router.get('/pending-approvals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingApprovals = preApprovedEmailService.getPendingApprovals();
    res.status(200).json({
      success: true,
      pendingApprovals,
      count: pendingApprovals.length
    });
  } catch (error) {
    console.error('❌ Error getting pending approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending approvals',
      message: error.message
    });
  }
});

// Approve an email
router.post('/approve-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await preApprovedEmailService.approveEmail(email);
    
    console.log(`✅ Admin ${req.user.email} approved email: ${email}`);
    
    res.status(200).json({
      success: true,
      message: result.message,
      approvedEmail: result.email
    });
  } catch (error) {
    console.error('❌ Error approving email:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Remove email from approved list
router.post('/remove-email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const result = await preApprovedEmailService.removeEmail(email);
    
    console.log(`🗑️ Admin ${req.user.email} removed email: ${email}`);
    
    res.status(200).json({
      success: result.success,
      message: result.message,
      removedEmail: result.email
    });
  } catch (error) {
    console.error('❌ Error removing email:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Add approved domain
router.post('/approve-domain', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'Domain is required'
      });
    }

    const result = await preApprovedEmailService.addApprovedDomain(domain);
    
    console.log(`✅ Admin ${req.user.email} approved domain: ${domain}`);
    
    res.status(200).json({
      success: true,
      message: result.message,
      approvedDomain: result.domain
    });
  } catch (error) {
    console.error('❌ Error approving domain:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get email approval statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = preApprovedEmailService.getStats();
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

module.exports = router;
