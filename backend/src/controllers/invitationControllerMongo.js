// MongoDB-integrated Invitation Controller
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { Invitation, Preapproved } = require('../models');
const { validateEmail, sanitizeInput } = require('../utils/security');


class InvitationController {
  // Create new invitation
  async createInvitation(req, res) {
    try {
      // Only admin can send invitations
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only admin can send invitations.'
        });
      }
      const { email, type = 'email' } = req.body;
      const userId = req.user?.userId;
      const userEmail = req.user?.email;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const sanitizedEmail = sanitizeInput(email);
      if (!validateEmail(sanitizedEmail)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      // Check if email is already in preapproved collection
      const existingPreapproved = await Preapproved.findOne({ email: sanitizedEmail });
      if (existingPreapproved) {
        return res.status(400).json({
          success: false,
          error: 'Email is already approved for registration'
        });
      }

      // Check if invitation already exists
      const existingInvitation = await Invitation.findOne({
        email: sanitizedEmail,
        status: { $in: ['pending', 'sent', 'delivered'] },
        expiresAt: { $gt: new Date() }
      });

      if (existingInvitation) {
        return res.status(400).json({
          success: false,
          error: 'Active invitation already exists for this email',
          invitation: {
            id: existingInvitation._id,
            status: existingInvitation.status,
            expiresAt: existingInvitation.expiresAt
          }
        });
      }

      // Generate unique invitation ID
      const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userUuid = uuidv4();

      // Create invitation
      const invitation = new Invitation({
        uuid: userUuid,
        email: sanitizedEmail,
        invitationId: invitationId,
        sentBy: userId
      });

      await invitation.save();

      // Add email to pre-approved list
      const preapprovedEntry = new Preapproved({
        email: sanitizedEmail,
        uuid: userUuid,
        isFirstLogin: true,
        approvedByAdmin: true,
        addedBy: userId
      });
      await preapprovedEntry.save();

      console.log(`✅ Invitation created: ${sanitizedEmail} - ID: ${invitationId}`);

      res.status(201).json({
        success: true,
        message: 'Invitation created successfully',
        invitation: {
          id: invitation._id,
          email: invitation.email,
          invitationId: invitation.invitationId,
          status: invitation.status,
          createdAt: invitation.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Create invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create invitation'
      });
    }
  }

  // Get invitation details by code
  async getInvitation(req, res) {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Invitation code is required'
        });
      }

      const invitation = await Invitation.findOne({
        invitationId: code
      }).populate('sentBy', 'profile.name email');

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: 'Invitation not found'
        });
      }

      // Check if invitation is expired
      if (invitation.isExpired) {
        await Invitation.findByIdAndUpdate(invitation._id, {
          status: 'expired'
        });

        return res.status(400).json({
          success: false,
          error: 'Invitation has expired',
          invitation: {
            id: invitation._id,
            status: 'expired',
            expiresAt: invitation.expiresAt
          }
        });
      }

      // Mark as opened if not already
      if (invitation.status === 'sent' || invitation.status === 'delivered') {
        await invitation.markAsOpened({
          ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                    req.connection?.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }

      res.status(200).json({
        success: true,
        invitation: {
          id: invitation._id,
          email: invitation.email,
          invitationCode: invitation.invitationCode,
          status: invitation.status,
          type: invitation.type,
          expiresAt: invitation.expiresAt,
          daysUntilExpiry: invitation.daysUntilExpiry,
          sentBy: invitation.sentBy,
          createdAt: invitation.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Get invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get invitation'
      });
    }
  }

  // Get all invitations (admin/user view)
  async getInvitations(req, res) {
    try {
      const { page = 1, limit = 20, status, type } = req.query;
      const userId = req.user?.userId;

      // Convert page and limit to numbers
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query = {};
      
      // If regular user, only show their invitations
      if (userId) {
        query.sentBy = userId;
      }

      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      // Find invitations
      const invitations = await Invitation.find(query)
        .populate('sentBy', 'profile.name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Get total count
      const totalCount = await Invitation.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limitNum);

      // Get statistics
      const stats = await Invitation.getStats();

      res.status(200).json({
        success: true,
        invitations: invitations.map(inv => ({
          id: inv._id,
          email: inv.email,
          invitationId: inv.invitationId,
          status: inv.status,
          sentBy: inv.sentBy,
          sentDate: inv.sentDate,
          count: inv.count,
          createdAt: inv.createdAt
        })),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        statistics: stats[0] || { totalInvitations: 0, statuses: [] }
      });

    } catch (error) {
      console.error('❌ Get invitations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get invitations'
      });
    }
  }

  // Resend invitation
  async resendInvitation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const invitation = await Invitation.findById(id);
      
      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: 'Invitation not found'
        });
      }

      // Check ownership (if not admin)
      if (userId && invitation.sentBy.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Check if invitation can be resent
      if (invitation.status === 'accepted') {
        return res.status(400).json({
          success: false,
          error: 'Invitation has already been accepted'
        });
      }

      if (invitation.attempts >= 5) {
        return res.status(400).json({
          success: false,
          error: 'Maximum resend attempts reached'
        });
      }

      if (invitation.isExpired) {
        return res.status(400).json({
          success: false,
          error: 'Invitation has expired'
        });
      }

      // Update invitation for resending
      invitation.status = 'pending';
      invitation.attempts += 1;
      invitation.lastAttemptAt = new Date();

      await invitation.save();

      // Here you would trigger the actual email sending
      console.log(`📧 Resending invitation to ${invitation.email}: ${invitation.invitationCode}`);

      res.status(200).json({
        success: true,
        message: 'Invitation resent successfully',
        invitation: {
          id: invitation._id,
          email: invitation.email,
          status: invitation.status,
          attempts: invitation.attempts,
          lastAttemptAt: invitation.lastAttemptAt
        }
      });

    } catch (error) {
      console.error('❌ Resend invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resend invitation'
      });
    }
  }

  // Cancel invitation
  async cancelInvitation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const invitation = await Invitation.findById(id);
      
      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: 'Invitation not found'
        });
      }

      // Check ownership (if not admin)
      if (userId && invitation.sentBy.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      // Check if invitation can be cancelled
      if (invitation.status === 'accepted') {
        return res.status(400).json({
          success: false,
          error: 'Cannot cancel accepted invitation'
        });
      }

      if (invitation.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          error: 'Invitation is already cancelled'
        });
      }

      // Cancel invitation
      invitation.status = 'cancelled';
      await invitation.save();

      // Remove from pre-approved emails if it was added via invitation
      await Preapproved.findOneAndDelete({ email: invitation.email });

      console.log(`❌ Invitation cancelled: ${invitation.email}`);

      res.status(200).json({
        success: true,
        message: 'Invitation cancelled successfully',
        invitation: {
          id: invitation._id,
          email: invitation.email,
          status: invitation.status
        }
      });

    } catch (error) {
      console.error('❌ Cancel invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel invitation'
      });
    }
  }
}

module.exports = new InvitationController();
