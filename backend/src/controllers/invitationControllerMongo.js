// MongoDB-integrated Invitation Controller
const { Invitation, User } = require('../models');
const { SecurityUtils } = require('../utils/security');
const InviteEmailService = require('../services/inviteEmailService');

class InvitationController {
  // Send invitation email
  async sendInvitation(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const sanitizedEmail = SecurityUtils.sanitizeInput(email);
      const userUuid = SecurityUtils.generateUUID();
      const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check if email is already in User collection
      const existingUser = await User.findOne({ email: sanitizedEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }

      // Create new user in User collection
      const newUser = new User({
        email: sanitizedEmail,
        userUuid: userUuid,
        role: 'user',
        status: 'invited',
        isApprovedByAdmin: true, // Admin-created users are approved
        isFirstLogin: true,
        hasSeenOnboardingMessage: false, // New users haven't seen onboarding
        profileCompleted: false,
        addedAt: new Date(),
        addedBy: req.user?.userId,
        verification: {
          isVerified: false,
          approvalType: 'admin'
        },
        profile: {
          profileCompleteness: 0,
          location: "India",
          // Initialize all profile fields as empty
          name: '',
          gender: undefined,
          nativePlace: '',
          currentResidence: '',
          maritalStatus: undefined,
          manglik: undefined,
          dateOfBirth: '',
          timeOfBirth: '',
          placeOfBirth: '',
          height: '',
          weight: '',
          complexion: undefined,
          education: '',
          occupation: '',
          annualIncome: '',
          eatingHabit: undefined,
          smokingHabit: undefined,
          drinkingHabit: undefined,
          father: '',
          mother: '',
          brothers: '',
          sisters: '',
          fatherGotra: '',
          motherGotra: '',
          grandfatherGotra: '',
          grandmotherGotra: '',
          specificRequirements: '',
          settleAbroad: undefined,
          about: '',
          interests: [],
          images: []
        },
        preferences: {
          location: [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
            "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
            "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
            "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
            "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
            "Uttar Pradesh", "Uttarakhand", "West Bengal",
            "Andaman and Nicobar Islands", "Chandigarh",
            "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
            "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
          ],
          ageRange: {
            min: 18,
            max: 50
          },
          profession: [],
          education: []
        }
      });

      await newUser.save();

      // Create invitation record
      const invitation = new Invitation({
        email: sanitizedEmail,
        uuid: userUuid,
        invitationId,
        status: 'sent',
        sentDate: new Date(),
        count: 1,
        sentBy: req.user?.userId
      });

      await invitation.save();

      // Send invitation email
      const emailResult = await InviteEmailService.sendInviteEmail(sanitizedEmail, userUuid);

      console.log(`✅ Invitation sent successfully to ${sanitizedEmail}`);

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        email: sanitizedEmail,
        userUuid: userUuid,
        invitationId: invitationId,
        emailSent: emailResult.success,
        inviteLink: emailResult.inviteLink,
        messageId: emailResult.messageId
      });

    } catch (error) {
      console.error('❌ Send invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send invitation'
      });
    }
  }

  // Get all invitations
  async getInvitations(req, res) {
    try {
      const invitations = await Invitation.find({}).sort({ sentDate: -1 });

      res.status(200).json({
        success: true,
        invitations: invitations
      });

    } catch (error) {
      console.error('❌ Get invitations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get invitations'
      });
    }
  }

  // Remove invitation (when user registers)
  async removeInvitation(req, res) {
    try {
      const { email } = req.params;

      const invitation = await Invitation.findOneAndDelete({ email: invitation.email });

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: 'Invitation not found'
        });
      }

      console.log(`✅ Invitation removed for ${email}`);

      res.status(200).json({
        success: true,
        message: 'Invitation removed successfully'
      });

    } catch (error) {
      console.error('❌ Remove invitation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove invitation'
      });
    }
  }
}

module.exports = new InvitationController();
