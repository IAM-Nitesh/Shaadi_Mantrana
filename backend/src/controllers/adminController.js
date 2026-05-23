const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Admin Controller
 * Handles administrative tasks like user management and content moderation
 */

// Get all users with pending photos
const getPendingPhotos = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      'profile.photoStatus': 'pending',
      'profile.images': { $exists: true, $ne: null }
    })
    .select('userUuid email phoneNumber profile.name profile.images profile.photoStatus createdAt')
    .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      users: pendingUsers.map(u => ({
        userId: u._id,
        userUuid: u.userUuid,
        email: u.email,
        phoneNumber: u.phoneNumber,
        name: u.profile?.name || 'Unknown',
        images: Array.isArray(u.profile?.images) ? u.profile.images : (u.profile?.images ? [u.profile.images] : []),
        status: u.profile?.photoStatus,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    logger.error('Error fetching pending photos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending photos'
    });
  }
};

// Moderate a user's photo
const moderatePhoto = async (req, res) => {
  try {
    const { userId, status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be approved or rejected.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.profile.photoStatus = status;
    // If we had a rejection reason field, we'd save it here
    await user.save();

    logger.info(`Photo ${status} for user ${userId} by admin ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: `Photo ${status} successfully`,
      user: {
        userId: user._id,
        photoStatus: user.profile.photoStatus
      }
    });
  } catch (error) {
    logger.error('Error moderating photo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to moderate photo'
    });
  }
};

// Get general dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const pendingPhotos = await User.countDocuments({ 'profile.photoStatus': 'pending' });
    const activeUsers = await User.countDocuments({ status: 'active' });
    const recentUsers = await User.find()
      .select('email profile.name createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        pendingPhotos,
        activeUsers
      },
      recentUsers
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
};

module.exports = {
  getPendingPhotos,
  moderatePhoto,
  getDashboardStats
};
