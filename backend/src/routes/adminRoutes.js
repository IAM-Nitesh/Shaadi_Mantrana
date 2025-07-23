// Admin Routes
// Handles administrative functions like email approval management

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const preApprovedEmailService = require('../services/preApprovedEmailService');
const emailService = require('../services/emailService');
const crypto = require('crypto');

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
  const adminEmails = ['admin@shaadimantra.com', 'nitesh@shaadimantra.com', 'niteshkumar9591@gmail.com'];
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }

  next();
};

// Encryption utilities for sensitive data
const EncryptionUtils = {
  // Encrypt email for logging/storage
  encryptEmail: (email) => {
    if (!email) return null;
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.JWT_SECRET || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(email, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  },

  // Hash email for comparison (one-way)
  hashEmail: (email) => {
    if (!email) return null;
    return crypto.createHash('sha256')
      .update(email.toLowerCase().trim())
      .digest('hex');
  },

  // Sanitize email for logs (show only first 3 chars and domain)
  sanitizeEmailForLog: (email) => {
    if (!email) return 'unknown';
    const parts = email.split('@');
    if (parts.length !== 2) return 'invalid';
    const username = parts[0];
    const domain = parts[1];
    return `${username.slice(0, 3)}***@${domain}`;
  },

  // Validate email input
  validateEmailInput: (email) => {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required and must be a string' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    
    if (email.length > 254) {
      return { valid: false, error: 'Email too long' };
    }
    
    return { valid: true, email: email.toLowerCase().trim() };
  }
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

// Get approved emails info (for testing) - NO AUTH REQUIRED FOR TESTING
router.get('/approved-emails', async (req, res) => {
  try {
    const emailsInfo = preApprovedEmailService.getAllApprovedEmails();
    res.json({
      success: true,
      data: emailsInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check specific email info - NO AUTH REQUIRED FOR TESTING
router.get('/email-info/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const emailInfo = preApprovedEmailService.getEmailInfo(email);
    const emailStatus = preApprovedEmailService.getEmailStatus(email);
    
    res.json({
      success: true,
      email: email,
      info: emailInfo,
      status: emailStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test email service - NO AUTH REQUIRED FOR TESTING
router.post('/test-email', async (req, res) => {
  try {
    const { email, testType = 'connection' } = req.body;
    
    if (testType === 'connection') {
      const result = await emailService.testConnection();
      res.json({
        success: true,
        test: 'connection',
        result: result
      });
    } else if (testType === 'otp' && email) {
      const testOTP = '999888';
      const result = await emailService.sendOTP(email, testOTP, {
        userName: 'Test User'
      });
      res.json({
        success: true,
        test: 'otp',
        email: email,
        result: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid test type or missing email'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Secure Admin Endpoints for Email Management
// POST /api/admin/email-info - Check specific email info (payload-based)
router.post('/email-info', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email input
    const validation = EncryptionUtils.validateEmailInput(email);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        code: 'INVALID_EMAIL_INPUT'
      });
    }

    const sanitizedEmail = validation.email;
    const emailInfo = preApprovedEmailService.getEmailInfo(sanitizedEmail);
    const emailStatus = preApprovedEmailService.getEmailStatus(sanitizedEmail);
    
    // Log admin action with sanitized email
    console.log(`🔍 Admin email lookup: ${EncryptionUtils.sanitizeEmailForLog(sanitizedEmail)}`);
    
    // Return info without exposing sensitive data in logs
    res.json({
      success: true,
      emailHash: EncryptionUtils.hashEmail(sanitizedEmail), // For verification
      info: emailInfo ? {
        ...emailInfo,
        email: EncryptionUtils.sanitizeEmailForLog(emailInfo.email) // Sanitized in response
      } : null,
      status: emailStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Admin email info lookup failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get email info',
      code: 'EMAIL_INFO_ERROR'
    });
  }
});

// POST /api/admin/test-email - Test email service (payload-based)
router.post('/test-email', async (req, res) => {
  try {
    const { email, testType = 'connection' } = req.body;
    
    if (testType === 'connection') {
      const result = await emailService.testConnection();
      res.json({
        success: true,
        test: 'connection',
        result: result,
        timestamp: new Date().toISOString()
      });
    } else if (testType === 'otp' && email) {
      // Validate email input
      const validation = EncryptionUtils.validateEmailInput(email);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
          code: 'INVALID_EMAIL_INPUT'
        });
      }

      const sanitizedEmail = validation.email;
      const testOTP = '999888';
      
      // Log admin action with sanitized email
      console.log(`📧 Admin test email to: ${EncryptionUtils.sanitizeEmailForLog(sanitizedEmail)}`);
      
      const result = await emailService.sendOTP(sanitizedEmail, testOTP, {
        userName: 'Test User'
      });
      
      res.json({
        success: true,
        test: 'otp',
        emailHash: EncryptionUtils.hashEmail(sanitizedEmail),
        result: {
          success: result.success,
          messageId: result.messageId
          // Don't expose the actual email in response
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid test type or missing email',
        code: 'INVALID_TEST_REQUEST'
      });
    }
  } catch (error) {
    console.error('❌ Admin email test failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Email test failed',
      code: 'EMAIL_TEST_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Email service error'
    });
  }
});

// GET /api/admin/approved-emails - Get approved emails info (no sensitive data in URL)
router.get('/approved-emails', async (req, res) => {
  try {
    const emailsInfo = preApprovedEmailService.getAllApprovedEmails();
    
    // Sanitize emails in response
    const sanitizedResponse = {
      ...emailsInfo,
      emails: emailsInfo.emails.map(email => EncryptionUtils.sanitizeEmailForLog(email)),
      emailsWithUuid: emailsInfo.emailsWithUuid.map(item => ({
        ...item,
        email: EncryptionUtils.sanitizeEmailForLog(item.email),
        emailHash: EncryptionUtils.hashEmail(item.email)
      }))
    };
    
    console.log('🔍 Admin approved emails lookup');
    
    res.json({
      success: true,
      data: sanitizedResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Admin approved emails lookup failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get approved emails',
      code: 'APPROVED_EMAILS_ERROR'
    });
  }
});

// POST /api/admin/verify-my-access - Verify admin access and get user info
router.post('/verify-my-access', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const emailInfo = preApprovedEmailService.getEmailInfo(userEmail);
    
    console.log(`🔐 Admin access verification: ${EncryptionUtils.sanitizeEmailForLog(userEmail)}`);
    
    res.json({
      success: true,
      user: {
        emailHash: EncryptionUtils.hashEmail(userEmail),
        uuid: emailInfo?.userUuid || null,
        role: emailInfo?.role || 'user',
        sanitizedEmail: EncryptionUtils.sanitizeEmailForLog(userEmail)
      },
      permissions: ['admin', 'email_management', 'user_management'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Admin access verification failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Access verification failed',
      code: 'ACCESS_VERIFICATION_ERROR'
    });
  }
});

// Secure admin endpoints with payload-based email handling
// Check email status (POST with email in payload)
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required in request body'
      });
    }

    const emailInfo = preApprovedEmailService.getEmailInfo(email);
    const emailStatus = preApprovedEmailService.getEmailStatus(email);
    
    res.json({
      success: true,
      email: email.replace(/(.{3}).*(@.*)/, '$1***$2'), // Sanitized email for response
      info: emailInfo ? {
        ...emailInfo,
        email: emailInfo.email.replace(/(.{3}).*(@.*)/, '$1***$2') // Sanitize in response
      } : null,
      status: emailStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test email service configuration
router.post('/test-email', async (req, res) => {
  try {
    const { email, testType = 'connection' } = req.body;
    
    if (testType === 'connection') {
      const result = await emailService.testConnection();
      res.json({
        success: true,
        test: 'connection',
        result: result
      });
    } else if (testType === 'otp' && email) {
      const testOTP = '999888';
      const result = await emailService.sendOTP(email, testOTP, {
        userName: 'Test User'
      });
      res.json({
        success: true,
        test: 'otp',
        email: email.replace(/(.{3}).*(@.*)/, '$1***$2'), // Sanitized email
        result: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid test type or missing email'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
