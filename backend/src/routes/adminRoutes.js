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
    const users = await User.find({ role: { $ne: 'admin' } }, {
      _id: 1,
      email: 1,
      'profile.name': 1,
      'profile.firstName': 1,
      'profile.lastName': 1,
      'profile.profileCompleteness': 1,
      'profile.images': 1,
      role: 1,
      status: 1,
      createdAt: 1,
      isFirstLogin: 1,
      lastActive: 1,
      userUuid: 1,
      profileCompleted: 1
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

      // Debug: Log the profile completeness for each user
      console.log(`🔍 User ${user.email}: profileCompleteness = ${user.profile?.profileCompleteness}, raw profile =`, user.profile);

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
        userUuid: user.userUuid,
        profileCompleted: user.profileCompleted || false,
        profile: {
          name: user.profile?.name,
          profileCompleteness: user.profile?.profileCompleteness || 0,
          images: user.profile?.images
        }
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
      isPending: true,
      profileCompleted: false
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

    // Enhanced storage statistics
    const storageStats = await calculateStorageStats();

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
      },
      storageStats
    });

  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Helper function to calculate storage statistics
async function calculateStorageStats() {
  try {
    // Get all users with profiles
    const users = await User.find({ role: { $ne: 'admin' } });
    
    let totalProfiles = 0;
    let totalImages = 0;
    let profilesWithImages = 0;
    let profilesWithoutImages = 0;
    let totalProfileCompleteness = 0;
    let validProfiles = 0;

    // Calculate profile statistics
    users.forEach(user => {
      if (user.profile) {
        totalProfiles++;
        
        // Count images
        const imageCount = user.profile.images ? user.profile.images.length : 0;
        totalImages += imageCount;
        
        if (imageCount > 0) {
          profilesWithImages++;
        } else {
          profilesWithoutImages++;
        }
        
        // Calculate profile completeness
        if (user.profile.profileCompleteness !== undefined) {
          totalProfileCompleteness += user.profile.profileCompleteness;
          validProfiles++;
        }
      }
    });

    // Calculate average profile completeness
    const averageProfileCompleteness = validProfiles > 0 
      ? Math.round(totalProfileCompleteness / validProfiles) 
      : 0;

    // Get recent activity statistics
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentActivity = {
      last24Hours: await User.countDocuments({
        createdAt: { $gte: last24Hours },
        role: { $ne: 'admin' }
      }),
      last7Days: await User.countDocuments({
        createdAt: { $gte: last7Days },
        role: { $ne: 'admin' }
      }),
      last30Days: await User.countDocuments({
        createdAt: { $gte: last30Days },
        role: { $ne: 'admin' }
      })
    };

    // Get real B2 storage stats
    let b2Stats = {
      totalFiles: 0,
      totalSizeBytes: 0,
      totalSizeMB: 0,
      averageSizeBytes: 0,
      averageSizeKB: 0,
      orphanedFiles: 0,
      orphanedSizeBytes: 0
    };

    try {
      const B2StorageService = require('../services/b2StorageService');
      const b2Service = new B2StorageService();
      b2Stats = await b2Service.getStorageStats();
      
      // Check for orphaned files (files without corresponding users)
      const { data: files } = await b2Service.b2.listFileNames({
        bucketId: b2Service.bucketId,
        prefix: 'profile_pictures/'
      });
      
      let orphanedFiles = 0;
      let orphanedSizeBytes = 0;
      
      for (const file of files.files) {
        const userId = file.fileName.replace('profile_pictures/', '').replace('.jpg', '');
        const userExists = users.find(u => u._id.toString() === userId);
        
        if (!userExists) {
          orphanedFiles++;
          orphanedSizeBytes += file.contentLength;
        }
      }
      
      b2Stats.orphanedFiles = orphanedFiles;
      b2Stats.orphanedSizeBytes = orphanedSizeBytes;
      
      console.log('✅ B2 storage stats retrieved:', b2Stats);
    } catch (b2Error) {
      console.error('❌ B2 storage stats failed:', b2Error.message);
      // Continue with default values if B2 fails
    }

    // Estimate MongoDB database size (rough calculation)
    const mongoSizeBytes = estimateDatabaseSize(users);
    const mongoSizeFormatted = formatBytes(mongoSizeBytes);

    // Get real user statistics
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    const pausedUsers = users.filter(user => user.status === 'paused').length;
    const invitedUsers = users.filter(user => user.role === 'pending').length;

    console.log('📊 Real-time stats:', {
      totalUsers,
      activeUsers,
      pausedUsers,
      invitedUsers,
      b2Files: b2Stats.totalFiles,
      b2Size: formatBytes(b2Stats.totalSizeBytes),
      mongoSize: mongoSizeFormatted
    });

    return {
      totalUsers: users.length,
      totalProfiles,
      totalImages,
      totalStorageSize: mongoSizeFormatted,
      averageProfileCompleteness,
      profilesWithImages,
      profilesWithoutImages,
      recentActivity,
      // B2 Cloud Storage stats
      b2Usage: formatBytes(b2Stats.totalSizeBytes),
      b2Total: '10 GB', // Default B2 bucket size
      b2Files: b2Stats.totalFiles,
      b2AverageSize: formatBytes(b2Stats.averageSizeBytes),
      b2OrphanedFiles: b2Stats.orphanedFiles,
      b2OrphanedSize: formatBytes(b2Stats.orphanedSizeBytes),
      // MongoDB stats
      mongoUsage: mongoSizeFormatted,
      mongoTotal: '512 MB', // Updated to match actual MongoDB size limit
      mongoProfiles: totalProfiles
    };

  } catch (error) {
    console.error('Error calculating storage stats:', error);
    return {
      totalUsers: 0,
      totalProfiles: 0,
      totalImages: 0,
      totalStorageSize: '0 Bytes',
      averageProfileCompleteness: 0,
      profilesWithImages: 0,
      profilesWithoutImages: 0,
      recentActivity: {
        last24Hours: 0,
        last7Days: 0,
        last30Days: 0
      },
      // Default B2 stats
      b2Usage: '0 Bytes',
      b2Total: '10 GB',
      b2Files: 0,
      b2AverageSize: '0 Bytes',
      b2OrphanedFiles: 0,
      b2OrphanedSize: '0 Bytes',
      // Default MongoDB stats
      mongoUsage: '0 Bytes',
      mongoTotal: '512 MB',
      mongoProfiles: 0
    };
  }
}

// Helper function to estimate database size
function estimateDatabaseSize(users) {
  let totalSize = 0;
  
  users.forEach(user => {
    // Estimate size based on all user data fields
    const userData = {
      _id: user._id,
      email: user.email,
      userUuid: user.userUuid,
      role: user.role,
      status: user.status,
      isFirstLogin: user.isFirstLogin,
      profile: user.profile,
      preferences: user.preferences,
      verification: user.verification,
      premium: user.premium,
      profileCompleted: user.profileCompleted,
      createdAt: user.createdAt,
      lastActive: user.lastActive,
      updatedAt: user.updatedAt,
      loginHistory: user.loginHistory
    };
    
    // Calculate size of user document
    const userSize = JSON.stringify(userData).length;
    totalSize += userSize;
  });
  
  return totalSize;
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

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

// Resume user (admin only)
router.patch('/users/:userId/resume', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isApprovedByAdmin } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is admin
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot modify admin users'
      });
    }

    // Update user status and approval
    user.status = 'active';
    user.isApprovedByAdmin = isApprovedByAdmin !== undefined ? isApprovedByAdmin : true;
    user.lastActive = new Date();
    await user.save();

    console.log(`✅ User ${user.email} resumed successfully`);

    res.status(200).json({
      success: true,
      message: 'User resumed successfully',
      user: {
        _id: user._id,
        email: user.email,
        status: user.status,
        isApprovedByAdmin: user.isApprovedByAdmin
      }
    });

  } catch (error) {
    console.error('❌ Resume user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume user'
    });
  }
});

// Pause user (admin only)
router.patch('/users/:userId/pause', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isApprovedByAdmin } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is admin
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot modify admin users'
      });
    }

    // Update user status and approval
    user.status = 'paused';
    user.isApprovedByAdmin = isApprovedByAdmin !== undefined ? isApprovedByAdmin : false;
    user.lastActive = new Date();
    await user.save();

    console.log(`✅ User ${user.email} paused successfully`);

    res.status(200).json({
      success: true,
      message: 'User paused successfully',
      user: {
        _id: user._id,
        email: user.email,
        status: user.status,
        isApprovedByAdmin: user.isApprovedByAdmin
      }
    });

  } catch (error) {
    console.error('❌ Pause user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause user'
    });
  }
});

// Resend invitation (admin only)
router.post('/users/:userId/resend-invite', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is admin
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot resend invitation to admin users'
      });
    }

    // Generate new invitation ID
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update or create invitation record
    let invitation = await Invitation.findOne({ email: user.email });
    if (invitation) {
      // Update existing invitation
      invitation.count += 1;
      invitation.sentDate = new Date();
      invitation.status = 'sent';
      invitation.invitationId = invitationId;
      invitation.sentBy = req.user.userId;
    } else {
      // Create new invitation
      invitation = new Invitation({
        email: user.email,
        uuid: user.userUuid,
        invitationId,
        status: 'sent',
        sentDate: new Date(),
        count: 1,
        sentBy: req.user.userId
      });
    }

    await invitation.save();

    // Send invitation email using the invitation service
    try {
      const emailResult = await InviteEmailService.sendInviteEmail(user.email, user.userUuid);
      
      if (emailResult.success) {
        console.log(`✅ Invitation email resent successfully to ${user.email}`);
      } else {
        console.log(`⚠️ Email service issue for ${user.email}:`, emailResult.emailError);
      }
    } catch (emailError) {
      console.error('❌ Failed to resend invitation email:', emailError);
      invitation.status = 'failed';
      await invitation.save();
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send invitation email'
      });
    }

    console.log(`✅ Invitation resent to ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully',
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        invitationId: invitation.invitationId,
        status: invitation.status,
        sentAt: invitation.sentDate,
        count: invitation.count
      }
    });

  } catch (error) {
    console.error('❌ Resend invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend invitation'
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

// Get all invitations (admin only)
router.get('/invitations', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const invitations = await Invitation.find({}).sort({ sentDate: -1 });
    
    const transformedInvitations = invitations.map(invitation => ({
      _id: invitation._id,
      email: invitation.email,
      firstName: invitation.firstName || '',
      lastName: invitation.lastName || '',
      status: invitation.status,
      createdAt: invitation.createdAt,
      sentAt: invitation.sentDate,
      count: invitation.count || 1
    }));

    res.status(200).json({
      success: true,
      invitations: transformedInvitations
    });

  } catch (error) {
    console.error('❌ Get invitations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitations'
    });
  }
});

// Create new invitation (admin only)
router.post('/invitations', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Check if invitation already exists
    const existingInvitation = await Invitation.findOne({ email });
    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        error: 'Invitation already sent to this email'
      });
    }

    // Generate UUID for the new user
    const userUuid = uuidv4();
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new user in database with isApprovedByAdmin as true
    const newUser = new User({
      email,
      userUuid,
      role: 'user',
      status: 'active',
      isFirstLogin: true,
      isApprovedByAdmin: true,
      profile: {
        name: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        profileCompleteness: 0
      },
      preferences: {
        ageRange: { min: 18, max: 50 },
        education: [],
        location: [],
        profession: []
      },
      verification: {
        approvalType: 'admin',
        isVerified: true,
        verifiedAt: new Date()
      },
      profileCompleted: false,
      loginHistory: []
    });

    await newUser.save();
    console.log(`✅ New user created for ${email} with UUID: ${userUuid}`);

    // Create invitation record
    const invitation = new Invitation({
      email,
      uuid: userUuid,
      invitationId,
      status: 'sent',
      sentDate: new Date(),
      count: 1,
      sentBy: req.user.userId // Use the admin user's ObjectId
    });

    await invitation.save();
    console.log(`✅ Invitation record created for ${email}`);

    // Create preapproved email entry
    const preapprovedEmail = new PreapprovedEmail({
      email,
      uuid: userUuid,
      approvedByAdmin: true,
      addedBy: req.user.userId, // Use the admin user's ObjectId
      addedAt: new Date()
    });

    await preapprovedEmail.save();
    console.log(`✅ Preapproved email entry created for ${email}`);

    // Send invitation email using the invitation service
    try {
      const emailResult = await InviteEmailService.sendInviteEmail(email, userUuid);
      
      if (emailResult.success) {
        console.log(`✅ Invitation email sent successfully to ${email}`);
      } else {
        console.log(`⚠️ Email service issue for ${email}:`, emailResult.emailError);
      }
    } catch (emailError) {
      console.error('❌ Failed to send invitation email:', emailError);
      // Don't fail the request, just log the error
    }

    console.log(`✅ Complete invitation process completed for ${email}`);

    res.status(201).json({
      success: true,
      message: 'User invited successfully',
      user: {
        _id: newUser._id,
        email: newUser.email,
        userUuid: newUser.userUuid,
        role: newUser.role,
        status: newUser.status,
        isApprovedByAdmin: newUser.isApprovedByAdmin,
        profile: newUser.profile
      },
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        invitationId: invitation.invitationId,
        status: invitation.status,
        sentAt: invitation.sentDate
      }
    });

  } catch (error) {
    console.error('❌ Create invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invitation'
    });
  }
});

// Resend invitation (admin only)
router.post('/invitations/:invitationId/resend', authenticateToken, adminMiddleware, async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: invitation.email });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User not found for this invitation'
      });
    }

    // Update invitation count and date
    invitation.count += 1;
    invitation.sentDate = new Date();
    invitation.status = 'sent';
    await invitation.save();

    // Send invitation email using the invitation service
    try {
      const emailResult = await InviteEmailService.sendInviteEmail(invitation.email, existingUser.userUuid);
      
      if (emailResult.success) {
        console.log(`✅ Invitation email resent successfully to ${invitation.email}`);
      } else {
        console.log(`⚠️ Email service issue for ${invitation.email}:`, emailResult.emailError);
      }
    } catch (emailError) {
      console.error('❌ Failed to resend invitation email:', emailError);
      invitation.status = 'failed';
      await invitation.save();
      
      return res.status(500).json({
        success: false,
        error: 'Failed to resend invitation email'
      });
    }

    console.log(`✅ Invitation resent to ${invitation.email}`);

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully',
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        invitationId: invitation.invitationId,
        status: invitation.status,
        sentAt: invitation.sentDate,
        count: invitation.count
      }
    });

  } catch (error) {
    console.error('❌ Resend invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend invitation'
    });
  }
});

module.exports = router;
