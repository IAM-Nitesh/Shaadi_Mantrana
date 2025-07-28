// Admin Routes
// Handles administrative functions like email approval management

const express = require('express');
const router = express.Router();
const { User, PreapprovedEmail, Invitation } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const InviteEmailService = require('../services/inviteEmailService');

// Middleware to check if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get all users (admin only)
router.get('/users', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, {
      _id: 1,
      email: 1,
      'profile.name': 1,
      'profile.firstName': 1,
      'profile.lastName': 1,
      role: 1,
      status: 1,
      createdAt: 1,
      isFirstLogin: 1,
      lastActive: 1,
      userUuid: 1
    }).sort({ createdAt: -1 });

    // Get preapproved data for all users
    const userEmails = users.map(user => user.email);
    const preapprovedUsers = await PreapprovedEmail.find({ email: { $in: userEmails } });
    
    // Create a map for quick lookup
    const preapprovedMap = {};
    preapprovedUsers.forEach(preapproved => {
      preapprovedMap[preapproved.email] = preapproved;
    });

    // Transform the data to include first and last name and preapproved status
    const transformedUsers = users.map(user => {
      const fullName = user.profile?.name || '';
      const nameParts = fullName.split(' ');
      const firstName = user.profile?.firstName || nameParts[0] || '';
      const lastName = user.profile?.lastName || nameParts.slice(1).join(' ') || '';
      
      const preapproved = preapprovedMap[user.email];

      return {
        _id: user._id,
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastActive: user.lastActive,
        approvedByAdmin: preapproved ? preapproved.approvedByAdmin : false,
        userUuid: user.userUuid
      };
    });

    // Get preapproved emails that haven't been converted to users yet
    const allPreapprovedEmails = await PreapprovedEmail.find({});
    const userEmailSet = new Set(userEmails);
    const pendingPreapproved = allPreapprovedEmails.filter(preapproved => 
      !userEmailSet.has(preapproved.email)
    );

    // Add pending preapproved emails as "virtual users"
    const pendingUsers = pendingPreapproved.map(preapproved => ({
      _id: `pending_${preapproved._id}`,
      email: preapproved.email,
      firstName: '',
      lastName: '',
      fullName: '',
      role: 'pending',
      status: 'pending',
      createdAt: preapproved.addedAt || preapproved.createdAt,
      lastActive: null,
      approvedByAdmin: preapproved.approvedByAdmin,
      userUuid: preapproved.uuid,
      isPending: true
    }));

    // Combine actual users with pending preapproved emails
    const allUsers = [...transformedUsers, ...pendingUsers];

    res.status(200).json({
      success: true,
      users: allUsers
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Add new user (admin only)
router.post('/users', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userUuid = uuidv4();
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Check if email already exists in preapproved collection
    let existingPreapproved = await PreapprovedEmail.findOne({ email: normalizedEmail });
    
    if (existingPreapproved) {
      return res.status(409).json({
        success: false,
        error: 'Email already approved by admin'
      });
    }

    // Create entry in preapproved collection
    const newPreapproved = new PreapprovedEmail({
      email: normalizedEmail,
      uuid: userUuid,
      isFirstLogin: true,
      approvedByAdmin: true,
      addedBy: req.user.userId
    });

    await newPreapproved.save();

    // Create entry in invitations collection (optional - don't fail if this fails)
    let invitationCreated = false;
    try {
      // Check if invitation already exists for this UUID
      const existingInvitation = await Invitation.findOne({ uuid: userUuid });
      if (!existingInvitation) {
        const newInvitation = new Invitation({
          uuid: userUuid,
          email: normalizedEmail,
          invitationId: invitationId,
          sentBy: req.user.userId
        });

        await newInvitation.save();
        invitationCreated = true;
        console.log(`✅ Invitation record created for ${normalizedEmail}`);
      } else {
        console.log(`ℹ️  Invitation already exists for UUID: ${userUuid}`);
      }
    } catch (invitationError) {
      console.error('❌ Failed to create invitation record:', invitationError);
      // Don't fail the user creation if invitation creation fails
      // The invitation is optional for user creation
    }

    // Create new user with the same UUID
    const newUser = new User({
      email: normalizedEmail,
      userUuid: userUuid,
      profile: {
        location: "India",
        profileCompleteness: 17,  // Set correct value for new users
        // Initialize all dropdown fields as undefined (empty)
        gender: undefined,
        maritalStatus: undefined,
        manglik: undefined,
        complexion: undefined,
        eatingHabit: undefined,
        smokingHabit: undefined,
        drinkingHabit: undefined,
        settleAbroad: undefined,
        // Initialize other profile fields as empty
        name: '',
        nativePlace: '',
        currentResidence: '',
        dateOfBirth: '',
        timeOfBirth: '',
        placeOfBirth: '',
        height: '',
        weight: '',
        education: '',
        occupation: '',
        annualIncome: '',
        father: '',
        mother: '',
        brothers: '',
        sisters: '',
        fatherGotra: '',
        motherGotra: '',
        grandfatherGotra: '',
        grandmotherGotra: '',
        specificRequirements: '',
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
      },
      isFirstLogin: true,
      role: 'user', // Default role
      status: 'active'
    });

    await newUser.save();

    // Send invitation email to the new user
    let emailResult = null;
    try {
      emailResult = await InviteEmailService.sendInviteEmail(normalizedEmail, userUuid);
      console.log(`✅ Invitation email sent to ${normalizedEmail}`);
    } catch (emailError) {
      console.error(`❌ Failed to send invitation email to ${normalizedEmail}:`, emailError);
      // Don't fail the user creation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'User added successfully with empty profile. Invitation email sent.',
      email: normalizedEmail,
      userId: newUser._id,
      uuid: userUuid,
      invitationId: invitationId,
      invitationCreated: invitationCreated,
      emailSent: !!emailResult?.success,
      inviteLink: emailResult?.inviteLink || null
    });

  } catch (error) {
    console.error('❌ Add user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add user'
    });
  }
});



// Remove user (admin only)
router.delete('/users/:userId', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from removing themselves
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove your own account'
      });
    }

    // Prevent removing other admins
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove admin accounts'
      });
    }

    // Remove user from database
    await User.findByIdAndDelete(userId);



    res.status(200).json({
      success: true,
      message: 'User removed successfully'
    });

  } catch (error) {
    console.error('❌ Remove user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove user'
    });
  }
});

// Get admin dashboard stats
router.get('/stats', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    // Count users excluding admins
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const activeUsers = await User.countDocuments({ status: 'active', role: { $ne: 'admin' } });
    const newUsers = await User.countDocuments({ isFirstLogin: true, role: { $ne: 'admin' } });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    // Get preapproved stats (excluding admin emails)
    // First, get all admin emails to exclude them from preapproved stats
    const adminEmails = await User.find({ role: 'admin' }, { email: 1 });
    const adminEmailList = adminEmails.map(user => user.email);
    
    const totalPreapproved = await PreapprovedEmail.countDocuments({ 
      email: { $nin: adminEmailList } 
    });
    const approvedUsers = await PreapprovedEmail.countDocuments({ 
      approvedByAdmin: true,
      email: { $nin: adminEmailList }
    });
    const pausedUsers = await PreapprovedEmail.countDocuments({ 
      approvedByAdmin: false,
      email: { $nin: adminEmailList }
    });

    // Get invitation stats
    const totalInvitations = await Invitation.countDocuments();
    const totalInvitationCount = await Invitation.aggregate([
      { $group: { _id: null, totalCount: { $sum: '$count' } } }
    ]);

    // Get recent registrations (last 7 days, excluding admins)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      role: { $ne: 'admin' }
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        newUsers,
        adminUsers,
        recentRegistrations,
        totalPreapproved,
        approvedUsers,
        pausedUsers,
        totalInvitations,
        totalInvitationCount: totalInvitationCount[0]?.totalCount || 0
      }
    });

  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Helper function to send invitation email
const sendInvitationEmail = async (userId, adminUserId) => {
  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Update user status to invited
  user.status = 'invited';
  await user.save();

  // Check if invitation already exists
  let invitation = await Invitation.findOne({ email: user.email });
  
  if (!invitation) {
    // Create new invitation record
    invitation = new Invitation({
      uuid: user.userUuid,
      email: user.email,
      invitationId: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sentBy: adminUserId
    });
  } else {
    // Update existing invitation record
    const newInvitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to history
    invitation.history.push({
      sentDate: invitation.sentDate,
      invitationId: invitation.invitationId,
      status: invitation.status,
      sentBy: invitation.sentBy
    });
    
    // Update current invitation
    invitation.invitationId = newInvitationId;
    invitation.sentDate = new Date();
    invitation.count += 1;
    invitation.sentBy = adminUserId;
  }
  
  await invitation.save();

  // Create or update entry in preapproved collection
  let preapprovedEntry = await PreapprovedEmail.findOne({ email: user.email });
  if (!preapprovedEntry) {
    // Create new preapproved entry
    preapprovedEntry = new PreapprovedEmail({
      email: user.email,
      uuid: user.userUuid,
      approvedByAdmin: true,
      addedBy: adminUserId,
      addedAt: new Date()
    });
    await preapprovedEntry.save();
    console.log(`✅ Preapproved entry created for ${user.email}`);
  } else {
    // Update existing preapproved entry to ensure it's approved
    preapprovedEntry.approvedByAdmin = true;
    await preapprovedEntry.save();
    console.log(`✅ Preapproved entry updated for ${user.email}`);
  }

  // Send invitation email using user's UUID
  const emailResult = await InviteEmailService.sendInviteEmail(user.email, user.userUuid);

  return {
    success: true,
    message: 'Invitation email sent successfully',
    email: user.email,
    emailSent: emailResult.success,
    inviteLink: emailResult.inviteLink,
    messageId: emailResult.messageId
  };
};

// Send invitation email to existing user (admin only)
router.post('/users/:userId/send-invite', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const result = await sendInvitationEmail(req.params.userId, req.user.userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Send invite email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invitation email'
    });
  }
});

// Alternative endpoint for frontend compatibility
router.post('/users/:userId/invite', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const result = await sendInvitationEmail(req.params.userId, req.user.userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Send invite email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invitation email'
    });
  }
});

// Pause user account (admin only)
router.post('/users/:userId/pause', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from pausing themselves
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot pause your own account'
      });
    }

    // Prevent pausing other admins
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot pause admin accounts'
      });
    }

    // Update user status to paused
    user.status = 'paused';
    await user.save();

    // Update preapproved entry to set approvedByAdmin to false
    await PreapprovedEmail.findOneAndUpdate(
      { email: user.email },
      { approvedByAdmin: false },
      { new: true }
    );

    console.log(`✅ User ${user.email} paused by admin`);

    res.status(200).json({
      success: true,
      message: 'User account paused successfully',
      email: user.email,
      status: user.status
    });

  } catch (error) {
    console.error('❌ Pause user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause user account'
    });
  }
});

// Resume user account (admin only)
router.post('/users/:userId/resume', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent resuming admin accounts (they should always be active)
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify admin account status'
      });
    }

    // Update user status to active
    user.status = 'active';
    await user.save();

    // Update preapproved entry to set approvedByAdmin to true
    await PreapprovedEmail.findOneAndUpdate(
      { email: user.email },
      { approvedByAdmin: true },
      { new: true }
    );

    console.log(`✅ User ${user.email} resumed by admin`);

    res.status(200).json({
      success: true,
      message: 'User account resumed successfully',
      email: user.email,
      status: user.status
    });

  } catch (error) {
    console.error('❌ Resume user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume user account'
    });
  }
});

// Send bulk invitation emails (admin only)
router.post('/users/send-bulk-invites', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        error: 'User IDs array is required'
      });
    }

    // Get users
    const users = await User.find({ _id: { $in: userIds } });

    // Prepare users with UUIDs and update invitations
    const usersWithUuid = [];
    
    for (const user of users) {
      // Check if invitation already exists
      let invitation = await Invitation.findOne({ email: user.email });
      
      if (!invitation) {
        // Create new invitation record
        invitation = new Invitation({
          uuid: user.userUuid,
          email: user.email,
          invitationId: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sentBy: req.user.userId
        });
      } else {
        // Update existing invitation record
        const newInvitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Add to history
        invitation.history.push({
          sentDate: invitation.sentDate,
          invitationId: invitation.invitationId,
          status: invitation.status,
          sentBy: invitation.sentBy
        });
        
        // Update current invitation
        invitation.invitationId = newInvitationId;
        invitation.sentDate = new Date();
        invitation.count += 1;
        invitation.sentBy = req.user.userId;
      }
      
      await invitation.save();
      
      // Create or update entry in preapproved collection
      let preapprovedEntry = await PreapprovedEmail.findOne({ email: user.email });
      if (!preapprovedEntry) {
        // Create new preapproved entry
        preapprovedEntry = new PreapprovedEmail({
          email: user.email,
          uuid: user.userUuid,
          approvedByAdmin: true,
          addedBy: req.user.userId,
          addedAt: new Date()
        });
        await preapprovedEntry.save();
        console.log(`✅ Preapproved entry created for ${user.email}`);
      } else {
        // Update existing preapproved entry to ensure it's approved
        preapprovedEntry.approvedByAdmin = true;
        await preapprovedEntry.save();
        console.log(`✅ Preapproved entry updated for ${user.email}`);
      }
      
      usersWithUuid.push({
        email: user.email,
        userUuid: user.userUuid
      });
    }

    // Send bulk invitation emails
    const results = await InviteEmailService.sendBulkInviteEmails(usersWithUuid);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.status(200).json({
      success: true,
      message: `Bulk invitation emails sent. ${successCount} successful, ${failureCount} failed.`,
      results: results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('❌ Send bulk invite emails error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk invitation emails'
    });
  }
});

// Get invitation history for a user (admin only)
router.get('/users/:userId/invitations', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find invitation history
    const invitation = await Invitation.findOne({ email: user.email });
    
    if (!invitation) {
      return res.status(200).json({
        success: true,
        invitation: null,
        message: 'No invitation history found'
      });
    }

    res.status(200).json({
      success: true,
      invitation: {
        uuid: invitation.uuid,
        email: invitation.email,
        currentInvitationId: invitation.invitationId,
        sentDate: invitation.sentDate,
        count: invitation.count,
        status: invitation.status,
        history: invitation.history
      }
    });

  } catch (error) {
    console.error('❌ Get invitation history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitation history'
    });
  }
});

module.exports = router;
