// Enhanced Invitation Controller with Comprehensive Edge Case Handling
// Handles invitation-related operations with validation and security

const { SecurityUtils } = require('../utils/security');

// In-memory invitation storage for demo (in production, use database)
let invitations = [];
let invitationCounter = 1;

// Enhanced validation utilities for invitations
const InvitationValidationUtils = {
  // Validate email for invitation
  validateEmail: (email) => {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required and must be a string' };
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    if (trimmedEmail.length === 0) {
      return { valid: false, error: 'Email cannot be empty' };
    }

    if (trimmedEmail.length > 254) {
      return { valid: false, error: 'Email too long (max 254 characters)' };
    }

    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      return { valid: false, error: 'Invalid email format' };
    }

    // Check for common email issues
    if (trimmedEmail.includes('..')) {
      return { valid: false, error: 'Email cannot contain consecutive dots' };
    }

    if (trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) {
      return { valid: false, error: 'Email cannot start or end with a dot' };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /noreply/i,
      /donotreply/i,
      /admin@localhost/i,
      /test@test/i,
      /example@example/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(trimmedEmail));
    
    return {
      valid: true,
      email: trimmedEmail,
      warnings: isSuspicious ? ['Email appears to be a test or system address'] : []
    };
  },

  // Validate invitation message
  validateMessage: (message) => {
    if (!message) {
      return { valid: true, message: '' }; // Message is optional
    }

    if (typeof message !== 'string') {
      return { valid: false, error: 'Message must be a string' };
    }

    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length > 500) {
      return { valid: false, error: 'Message too long (max 500 characters)' };
    }

    // Check for spam patterns
    const spamPatterns = [
      /click here/i,
      /urgent/i,
      /congratulations/i,
      /winner/i,
      /lottery/i,
      /million dollars/i,
      /viagra/i,
      /casino/i
    ];

    const hasSpam = spamPatterns.some(pattern => pattern.test(trimmedMessage));
    
    if (hasSpam) {
      return { valid: false, error: 'Message contains suspicious content' };
    }

    return {
      valid: true,
      message: trimmedMessage,
      wordCount: trimmedMessage.split(/\s+/).length
    };
  },

  // Validate invitation ID
  validateInvitationId: (id) => {
    if (!id) {
      return { valid: false, error: 'Invitation ID is required' };
    }

    const numId = parseInt(id);
    if (isNaN(numId) || numId <= 0) {
      return { valid: false, error: 'Invalid invitation ID format' };
    }

    if (numId > 1000000) {
      return { valid: false, error: 'Invitation ID too large' };
    }

    return { valid: true, id: numId };
  },

  // Validate pagination for invitations
  validatePagination: (page, limit) => {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    const errors = [];
    
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (pageNum > 1000) errors.push('Page number too large (max 1000)');
    if (limitNum < 1) errors.push('Limit must be greater than 0');
    if (limitNum > 100) errors.push('Limit too large (max 100 invitations per page)');
    
    return {
      valid: errors.length === 0,
      errors,
      page: Math.max(1, Math.min(1000, pageNum)),
      limit: Math.max(1, Math.min(100, limitNum))
    };
  },

  // Validate status filter
  validateStatusFilter: (status) => {
    if (!status) return { valid: true, status: null };
    
    const validStatuses = ['pending', 'accepted', 'declined', 'expired'];
    const lowerStatus = status.toLowerCase();
    
    if (!validStatuses.includes(lowerStatus)) {
      return {
        valid: false,
        error: `Invalid status. Allowed: ${validStatuses.join(', ')}`
      };
    }
    
    return { valid: true, status: lowerStatus };
  }
};

// Rate limiting for invitations
const invitationRateLimit = new Map();

const checkInvitationRateLimit = (email, clientIP) => {
  const now = Date.now();
  const emailKey = `email:${email}`;
  const ipKey = `ip:${clientIP}`;
  
  // Check email-based rate limiting (max 10 invitations per hour per email)
  const emailLimits = invitationRateLimit.get(emailKey) || [];
  const recentEmailInvitations = emailLimits.filter(time => now - time < 60 * 60 * 1000);
  
  if (recentEmailInvitations.length >= 10) {
    return {
      allowed: false,
      error: 'Too many invitations sent from this email. Please wait before sending more.',
      retryAfter: Math.ceil((recentEmailInvitations[0] + 60 * 60 * 1000 - now) / 1000)
    };
  }
  
  // Check IP-based rate limiting (max 50 invitations per hour per IP)
  const ipLimits = invitationRateLimit.get(ipKey) || [];
  const recentIPInvitations = ipLimits.filter(time => now - time < 60 * 60 * 1000);
  
  if (recentIPInvitations.length >= 50) {
    return {
      allowed: false,
      error: 'Too many invitations sent from this IP address. Please wait before sending more.',
      retryAfter: Math.ceil((recentIPInvitations[0] + 60 * 60 * 1000 - now) / 1000)
    };
  }
  
  // Update rate limits
  recentEmailInvitations.push(now);
  recentIPInvitations.push(now);
  invitationRateLimit.set(emailKey, recentEmailInvitations);
  invitationRateLimit.set(ipKey, recentIPInvitations);
  
  return { allowed: true };
};

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  
  for (const [key, times] of invitationRateLimit.entries()) {
    const recentTimes = times.filter(time => time > hourAgo);
    if (recentTimes.length === 0) {
      invitationRateLimit.delete(key);
    } else {
      invitationRateLimit.set(key, recentTimes);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Enhanced Invitation Controller
const invitationController = {
  // Send invitation with comprehensive validation
  async sendInvitation(req, res) {
    const startTime = Date.now();
    
    try {
      // Authentication is required (handled by middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      // Get client IP for rate limiting
      const clientIP = SecurityUtils.getClientIP(req);

      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        });
      }

      const { email, message, profileId } = req.body;

      // Validate email
      const emailValidation = InvitationValidationUtils.validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({
          success: false,
          error: emailValidation.error,
          code: 'INVALID_EMAIL'
        });
      }

      // Check if inviting themselves
      if (emailValidation.email === req.user.email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          error: 'Cannot send invitation to yourself',
          code: 'SELF_INVITATION'
        });
      }

      // Validate message
      const messageValidation = InvitationValidationUtils.validateMessage(message);
      if (!messageValidation.valid) {
        return res.status(400).json({
          success: false,
          error: messageValidation.error,
          code: 'INVALID_MESSAGE'
        });
      }

      // Validate profile ID if provided
      let validatedProfileId = null;
      if (profileId) {
        const profileValidation = InvitationValidationUtils.validateInvitationId(profileId);
        if (!profileValidation.valid) {
          return res.status(400).json({
            success: false,
            error: profileValidation.error,
            code: 'INVALID_PROFILE_ID'
          });
        }
        validatedProfileId = profileValidation.id;
      }

      // Check rate limiting
      const rateLimitCheck = checkInvitationRateLimit(req.user.email, clientIP);
      if (!rateLimitCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: rateLimitCheck.error,
          code: 'RATE_LIMITED',
          retryAfter: rateLimitCheck.retryAfter
        });
      }

      // Check for duplicate pending invitations
      const existingInvitation = invitations.find(inv => 
        inv.senderEmail === req.user.email && 
        inv.recipientEmail === emailValidation.email && 
        inv.status === 'pending'
      );

      if (existingInvitation) {
        return res.status(409).json({
          success: false,
          error: 'Pending invitation already exists for this email',
          code: 'DUPLICATE_INVITATION',
          existingInvitation: {
            id: existingInvitation.id,
            sentAt: existingInvitation.sentAt,
            expiresAt: existingInvitation.expiresAt
          }
        });
      }

      // Create invitation
      const invitation = {
        id: invitationCounter++,
        senderEmail: req.user.email,
        senderName: req.user.name || req.user.email.split('@')[0],
        recipientEmail: emailValidation.email,
        message: messageValidation.message,
        profileId: validatedProfileId,
        status: 'pending',
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        clientIP: clientIP,
        metadata: {
          userAgent: req.headers['user-agent']?.substring(0, 200) || 'Unknown',
          messageWordCount: messageValidation.wordCount || 0,
          warnings: emailValidation.warnings || []
        }
      };

      // Add to invitations array
      invitations.push(invitation);

      const processingTime = Date.now() - startTime;

      console.log(`✅ Invitation sent from ${req.user.email} to ${emailValidation.email}`);

      // Simulate email sending (in production, integrate with email service)
      console.log(`📧 Sending invitation email to ${emailValidation.email}`);

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation.id,
          recipientEmail: invitation.recipientEmail,
          message: invitation.message,
          status: invitation.status,
          sentAt: invitation.sentAt,
          expiresAt: invitation.expiresAt
        },
        metadata: {
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString(),
          warnings: emailValidation.warnings
        }
      });

    } catch (error) {
      console.error('❌ Error sending invitation:', error);
      const processingTime = Date.now() - startTime;
      
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        code: 'SEND_INVITATION_ERROR',
        processingTime: `${processingTime}ms`
      });
    }
  },

  // Get invitations with filtering and pagination
  async getInvitations(req, res) {
    const startTime = Date.now();
    
    try {
      // Authentication is required (handled by middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const {
        page = 1,
        limit = 20,
        status = '',
        type = 'all', // 'sent', 'received', 'all'
        sortBy = 'sentAt',
        sortOrder = 'desc'
      } = req.query;

      // Validate pagination
      const paginationValidation = InvitationValidationUtils.validatePagination(page, limit);
      if (!paginationValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters',
          details: paginationValidation.errors,
          code: 'INVALID_PAGINATION'
        });
      }

      // Validate status filter
      const statusValidation = InvitationValidationUtils.validateStatusFilter(status);
      if (!statusValidation.valid) {
        return res.status(400).json({
          success: false,
          error: statusValidation.error,
          code: 'INVALID_STATUS_FILTER'
        });
      }

      // Validate type filter
      const validTypes = ['sent', 'received', 'all'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: `Invalid type filter. Allowed: ${validTypes.join(', ')}`,
          code: 'INVALID_TYPE_FILTER'
        });
      }

      // Validate sorting
      const allowedSortFields = ['sentAt', 'status', 'recipientEmail', 'senderEmail'];
      const allowedSortOrders = ['asc', 'desc'];
      
      if (!allowedSortFields.includes(sortBy)) {
        return res.status(400).json({
          success: false,
          error: `Invalid sort field. Allowed: ${allowedSortFields.join(', ')}`,
          code: 'INVALID_SORT_FIELD'
        });
      }
      
      if (!allowedSortOrders.includes(sortOrder.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: `Invalid sort order. Allowed: ${allowedSortOrders.join(', ')}`,
          code: 'INVALID_SORT_ORDER'
        });
      }

      // Filter invitations based on user and type
      let filteredInvitations = invitations.filter(invitation => {
        try {
          let matches = false;
          
          switch (type) {
            case 'sent':
              matches = invitation.senderEmail === req.user.email;
              break;
            case 'received':
              matches = invitation.recipientEmail === req.user.email;
              break;
            case 'all':
            default:
              matches = invitation.senderEmail === req.user.email || 
                       invitation.recipientEmail === req.user.email;
              break;
          }
          
          // Apply status filter
          if (matches && statusValidation.status) {
            matches = invitation.status === statusValidation.status;
          }
          
          return matches;
        } catch (error) {
          console.error('❌ Error filtering invitation:', error);
          return false;
        }
      });

      // Apply sorting
      try {
        filteredInvitations.sort((a, b) => {
          let comparison = 0;
          
          switch (sortBy) {
            case 'sentAt':
              comparison = new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
              break;
            case 'status':
              comparison = a.status.localeCompare(b.status);
              break;
            case 'recipientEmail':
              comparison = a.recipientEmail.localeCompare(b.recipientEmail);
              break;
            case 'senderEmail':
              comparison = a.senderEmail.localeCompare(b.senderEmail);
              break;
          }
          
          return sortOrder.toLowerCase() === 'desc' ? -comparison : comparison;
        });
      } catch (error) {
        console.error('❌ Error sorting invitations:', error);
        // Continue without sorting if there's an error
      }

      // Apply pagination
      const startIndex = (paginationValidation.page - 1) * paginationValidation.limit;
      const endIndex = startIndex + paginationValidation.limit;
      const paginatedInvitations = filteredInvitations.slice(startIndex, endIndex);

      // Remove sensitive information
      const publicInvitations = paginatedInvitations.map(invitation => ({
        id: invitation.id,
        senderEmail: invitation.senderEmail === req.user.email ? invitation.senderEmail : invitation.senderEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
        senderName: invitation.senderName,
        recipientEmail: invitation.recipientEmail === req.user.email ? invitation.recipientEmail : invitation.recipientEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
        message: invitation.message,
        profileId: invitation.profileId,
        status: invitation.status,
        sentAt: invitation.sentAt,
        expiresAt: invitation.expiresAt,
        isExpired: new Date() > new Date(invitation.expiresAt),
        direction: invitation.senderEmail === req.user.email ? 'sent' : 'received'
      }));

      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        invitations: publicInvitations,
        pagination: {
          currentPage: paginationValidation.page,
          totalPages: Math.ceil(filteredInvitations.length / paginationValidation.limit),
          totalInvitations: filteredInvitations.length,
          hasNextPage: endIndex < filteredInvitations.length,
          hasPrevPage: paginationValidation.page > 1,
          pageSize: paginationValidation.limit
        },
        filters: {
          status: statusValidation.status,
          type,
          sortBy,
          sortOrder
        },
        statistics: {
          totalSent: invitations.filter(inv => inv.senderEmail === req.user.email).length,
          totalReceived: invitations.filter(inv => inv.recipientEmail === req.user.email).length,
          pending: filteredInvitations.filter(inv => inv.status === 'pending').length,
          accepted: filteredInvitations.filter(inv => inv.status === 'accepted').length,
          declined: filteredInvitations.filter(inv => inv.status === 'declined').length,
          expired: filteredInvitations.filter(inv => inv.status === 'expired' || new Date() > new Date(inv.expiresAt)).length
        },
        metadata: {
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error fetching invitations:', error);
      const processingTime = Date.now() - startTime;
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch invitations',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        code: 'FETCH_INVITATIONS_ERROR',
        processingTime: `${processingTime}ms`
      });
    }
  },

  // Respond to invitation (accept/decline)
  async respondToInvitation(req, res) {
    const startTime = Date.now();
    
    try {
      // Authentication is required (handled by middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { id } = req.params;
      const { response } = req.body;

      // Validate invitation ID
      const idValidation = InvitationValidationUtils.validateInvitationId(id);
      if (!idValidation.valid) {
        return res.status(400).json({
          success: false,
          error: idValidation.error,
          code: 'INVALID_INVITATION_ID'
        });
      }

      // Validate response
      if (!response || typeof response !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Response is required and must be a string',
          code: 'INVALID_RESPONSE'
        });
      }

      const validResponses = ['accept', 'decline'];
      const lowerResponse = response.toLowerCase();
      
      if (!validResponses.includes(lowerResponse)) {
        return res.status(400).json({
          success: false,
          error: `Invalid response. Allowed: ${validResponses.join(', ')}`,
          code: 'INVALID_RESPONSE_VALUE'
        });
      }

      // Find invitation
      const invitationIndex = invitations.findIndex(inv => inv.id === idValidation.id);
      
      if (invitationIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Invitation not found',
          code: 'INVITATION_NOT_FOUND',
          requestedId: idValidation.id
        });
      }

      const invitation = invitations[invitationIndex];

      // Check if user is the recipient
      if (invitation.recipientEmail !== req.user.email) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to respond to this invitation',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Check if invitation is still pending
      if (invitation.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: `Invitation already ${invitation.status}`,
          code: 'INVITATION_ALREADY_RESPONDED',
          currentStatus: invitation.status
        });
      }

      // Check if invitation is expired
      if (new Date() > new Date(invitation.expiresAt)) {
        // Update status to expired
        invitation.status = 'expired';
        invitation.respondedAt = new Date().toISOString();
        
        return res.status(400).json({
          success: false,
          error: 'Invitation has expired',
          code: 'INVITATION_EXPIRED',
          expiresAt: invitation.expiresAt
        });
      }

      // Update invitation status
      const newStatus = lowerResponse === 'accept' ? 'accepted' : 'declined';
      invitation.status = newStatus;
      invitation.respondedAt = new Date().toISOString();
      invitation.respondedBy = req.user.email;

      const processingTime = Date.now() - startTime;

      console.log(`✅ Invitation ${idValidation.id} ${newStatus} by ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: `Invitation ${newStatus} successfully`,
        invitation: {
          id: invitation.id,
          senderEmail: invitation.senderEmail,
          senderName: invitation.senderName,
          status: invitation.status,
          sentAt: invitation.sentAt,
          respondedAt: invitation.respondedAt,
          expiresAt: invitation.expiresAt
        },
        metadata: {
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error responding to invitation:', error);
      const processingTime = Date.now() - startTime;
      
      res.status(500).json({
        success: false,
        message: 'Failed to respond to invitation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        code: 'RESPOND_INVITATION_ERROR',
        processingTime: `${processingTime}ms`
      });
    }
  }
};

module.exports = invitationController;
