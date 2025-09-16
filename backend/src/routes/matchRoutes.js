// Match Routes - Handle swipe actions and match retrieval
const express = require('express');
const router = express.Router();
const { User, Match } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { ensureProfileComplete } = require('../middleware/profileAccess');

// Middleware to check if user is authenticated
const userMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(403).json({
        success: false,
        error: 'User not found'
      });
    }
    req.userProfile = user;
    next();
  } catch (error) {
    console.error('User middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Swipe right (like) on a user
router.post('/swipe', authenticateToken, userMiddleware, ensureProfileComplete, async (req, res) => {
  try {
    const { likedUserId, action = 'like' } = req.body;
    const userId = req.user.userId;

    if (!likedUserId) {
      return res.status(400).json({
        success: false,
        error: 'Liked user ID is required'
      });
    }

    // Validate action
    if (!['like', 'super_like', 'pass'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be like, super_like, or pass'
      });
    }

    // Check if liked user exists
    const likedUser = await User.findById(likedUserId);
    if (!likedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent self-swiping
    if (userId === likedUserId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot swipe on yourself'
      });
    }

    // Check if swipe already exists
    const existingSwipe = await Match.findOne({
      userId: userId,
      likedUserId: likedUserId
    });

    if (existingSwipe) {
      return res.status(409).json({
        success: false,
        error: 'You have already swiped on this user'
      });
    }

    // Create new swipe record
    const newSwipe = new Match({
      userId: userId,
      likedUserId: likedUserId,
      action: action,
      metadata: {
        source: req.body.source || 'discovery',
        platform: req.body.platform || 'web',
        location: req.userProfile.profile?.location
      }
    });

    await newSwipe.save();

    // Check if this creates a match
    let isMatch = false;
    if (action === 'like' || action === 'super_like') {
      const mutualSwipe = await Match.findOne({
        userId: likedUserId,
        likedUserId: userId,
        action: { $in: ['like', 'super_like'] }
      });

      if (mutualSwipe) {
        isMatch = true;
        // Update both records as matches
        newSwipe.isMatch = true;
        newSwipe.matchedAt = new Date();
        await newSwipe.save();

        mutualSwipe.isMatch = true;
        mutualSwipe.matchedAt = new Date();
        await mutualSwipe.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Swipe ${action} recorded successfully`,
      isMatch: isMatch,
      swipeId: newSwipe._id
    });

  } catch (error) {
    console.error('❌ Swipe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record swipe'
    });
  }
});

// Get all matches for the current user
router.get('/matches', authenticateToken, userMiddleware, ensureProfileComplete, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const matches = await Match.find({
      userId: userId,
      isMatch: true
    })
    .populate('likedUserId', 'profile.name profile.firstName profile.lastName profile.photos profile.location profile.age')
    .sort({ matchedAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalMatches = await Match.countDocuments({
      userId: userId,
      isMatch: true
    });

    res.status(200).json({
      success: true,
      matches: matches,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMatches / limit),
        totalMatches: totalMatches,
        hasNext: skip + limit < totalMatches,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Get matches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch matches'
    });
  }
});

// Get all likes for the current user (users they've swiped right on)
router.get('/likes', authenticateToken, userMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const likes = await Match.find({
      userId: userId,
      action: { $in: ['like', 'super_like'] }
    })
    .populate('likedUserId', 'profile.name profile.firstName profile.lastName profile.photos profile.location profile.age')
    .sort({ swipedAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalLikes = await Match.countDocuments({
      userId: userId,
      action: { $in: ['like', 'super_like'] }
    });

    res.status(200).json({
      success: true,
      likes: likes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLikes / limit),
        totalLikes: totalLikes,
        hasNext: skip + limit < totalLikes,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Get likes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch likes'
    });
  }
});

// Get users who liked the current user
router.get('/liked-by', authenticateToken, userMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const likedBy = await Match.find({
      likedUserId: userId,
      action: { $in: ['like', 'super_like'] }
    })
    .populate('userId', 'profile.name profile.firstName profile.lastName profile.photos profile.location profile.age')
    .sort({ swipedAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalLikedBy = await Match.countDocuments({
      likedUserId: userId,
      action: { $in: ['like', 'super_like'] }
    });

    res.status(200).json({
      success: true,
      likedBy: likedBy,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLikedBy / limit),
        totalLikedBy: totalLikedBy,
        hasNext: skip + limit < totalLikedBy,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Get liked by error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users who liked you'
    });
  }
});

// Get match statistics for the current user
router.get('/stats', authenticateToken, userMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [totalMatches, totalLikes, totalLikedBy, recentMatches] = await Promise.all([
      Match.countDocuments({ userId: userId, isMatch: true }),
      Match.countDocuments({ userId: userId, action: { $in: ['like', 'super_like'] } }),
      Match.countDocuments({ likedUserId: userId, action: { $in: ['like', 'super_like'] } }),
      Match.countDocuments({ 
        userId: userId, 
        isMatch: true, 
        matchedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalMatches,
        totalLikes,
        totalLikedBy,
        recentMatches,
        matchRate: totalLikes > 0 ? Math.round((totalMatches / totalLikes) * 100) : 0
      }
    });

  } catch (error) {
    console.error('❌ Get match stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch match statistics'
    });
  }
});

module.exports = router; 