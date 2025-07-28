// MongoDB-integrated Matching Controller
const { User, Connection, DailyLike } = require('../models');

class MatchingController {
  // Get profiles for discovery (with daily limit)
  async getDiscoveryProfiles(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;
      
      console.log(`🔍 Discovery request - User: ${userId}, Page: ${page}, Limit: ${limit}`);
      
      // Check daily like limit
      const dailyLikeCount = await DailyLike.getDailyLikeCount(userId);
      const canLikeToday = dailyLikeCount < 5;
      
      console.log(`📊 Daily like count: ${dailyLikeCount}, Can like today: ${canLikeToday}`);
      
      if (!canLikeToday) {
        console.log('🚫 Daily limit reached, returning empty profiles');
        return res.status(200).json({
          success: true,
          profiles: [],
          dailyLimitReached: true,
          message: "Try again tomorrow for more matches.",
          dailyLikeCount
        });
      }
      
      // Get profiles excluding current user and already liked profiles
      const skip = (page - 1) * limit;
      
      // Get IDs of profiles the user has already liked
      const likedProfiles = await DailyLike.find({ userId }).select('likedProfileId');
      const likedProfileIds = likedProfiles.map(like => like.likedProfileId);
      console.log(`💕 User has liked ${likedProfileIds.length} profiles`);
      
      // Get profiles that haven't been liked by the user
      const profiles = await User.find({
        _id: { $ne: userId, $nin: likedProfileIds },
        status: 'active',
        'profile.name': { $exists: true, $ne: '' }
      })
      .select('profile.name profile.age profile.profession profile.images profile.about verification.isVerified')
      .limit(limit)
      .skip(skip)
      .lean();
      
      console.log(`📋 Found ${profiles.length} profiles for discovery`);
      
      // Handle case when no profiles are found
      if (!profiles || profiles.length === 0) {
        console.log('📭 No profiles available for discovery');
        return res.status(200).json({
          success: true,
          profiles: [],
          dailyLimitReached: false,
          message: "No profiles available at the moment. Please check back later!",
          dailyLikeCount,
          remainingLikes: 5 - dailyLikeCount
        });
      }
      
      res.status(200).json({
        success: true,
        profiles,
        dailyLimitReached: false,
        dailyLikeCount,
        remainingLikes: 5 - dailyLikeCount
      });
      
    } catch (error) {
      console.error('❌ Get discovery profiles error:', error);
      
      // Handle specific database errors
      if (error.name === 'CastError') {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid user ID format' 
        });
      }
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid query parameters' 
        });
      }
      
      // Generic error response
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch discovery profiles',
        message: 'Please try again later'
      });
    }
  }

  // Like a profile (swipe right)
  async likeProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { targetUserId, type = 'like' } = req.body;
      
      if (!targetUserId) {
        return res.status(400).json({ success: false, error: 'Target user ID is required' });
      }
      
      if (userId === targetUserId) {
        return res.status(400).json({ success: false, error: 'Cannot like your own profile' });
      }
      
      // Check daily like limit
      const dailyLikeCount = await DailyLike.getDailyLikeCount(userId);
      if (dailyLikeCount >= 5) {
        return res.status(429).json({ 
          success: false, 
          error: 'Daily like limit reached. Try again tomorrow.',
          dailyLikeCount 
        });
      }
      
      // Check if already liked
      const existingLike = await DailyLike.findOne({ userId, likedProfileId: targetUserId });
      if (existingLike) {
        return res.status(409).json({ success: false, error: 'Profile already liked' });
      }
      
      // Validate target user exists
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'Target user not found' });
      }
      
      // Create the like
      const like = new DailyLike({
        userId,
        likedProfileId: targetUserId,
        type,
        likeDate: new Date()
      });
      await like.save();
      
      // Check for mutual match
      const mutualLike = await DailyLike.findOne({
        userId: targetUserId,
        likedProfileId: userId
      });
      
      let isMutualMatch = false;
      let connection = null;
      
      if (mutualLike) {
        // Create mutual match
        isMutualMatch = true;
        
        // Update both likes to mark as mutual match
        await Promise.all([
          DailyLike.updateOne({ _id: like._id }, { isMutualMatch: true }),
          DailyLike.updateOne({ _id: mutualLike._id }, { isMutualMatch: true })
        ]);
        
        // Create connection for mutual match
        connection = new Connection({
          users: [userId, targetUserId],
          status: 'accepted',
          type: 'like',
          initiatedBy: userId,
          timestamps: { 
            initiated: new Date(),
            responded: new Date(),
            lastActivity: new Date()
          }
        });
        await connection.save();
      }
      
      res.status(200).json({
        success: true,
        like,
        isMutualMatch,
        connection,
        dailyLikeCount: dailyLikeCount + 1,
        remainingLikes: 4 - dailyLikeCount
      });
      
    } catch (error) {
      console.error('❌ Like profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to like profile' });
    }
  }

  // Get liked profiles (for Request tab)
  async getLikedProfiles(req, res) {
    try {
      const userId = req.user.userId;
      
      const likes = await DailyLike.getLikedProfiles(userId);
      
      const likedProfiles = likes.map(like => ({
        likeId: like._id,
        profile: like.likedProfileId,
        likeDate: like.likeDate,
        type: like.type,
        isMutualMatch: like.isMutualMatch
      }));
      
      res.status(200).json({
        success: true,
        likedProfiles,
        totalLikes: likedProfiles.length,
        mutualMatches: likedProfiles.filter(p => p.isMutualMatch).length
      });
      
    } catch (error) {
      console.error('❌ Get liked profiles error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch liked profiles' });
    }
  }

  // Get mutual matches (for Matches tab)
  async getMutualMatches(req, res) {
    try {
      const userId = req.user.userId;
      
      // Get connections that are mutual matches
      const connections = await Connection.findMutualMatches(userId);
      
      const matches = connections.map(connection => {
        const otherUser = connection.users.find(u => u._id.toString() !== userId);
        return {
          connectionId: connection._id,
          profile: otherUser,
          matchDate: connection.timestamps.responded,
          lastActivity: connection.timestamps.lastActivity
        };
      });
      
      res.status(200).json({
        success: true,
        matches,
        totalMatches: matches.length
      });
      
    } catch (error) {
      console.error('❌ Get mutual matches error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch mutual matches' });
    }
  }

  // Get daily like statistics
  async getDailyLikeStats(req, res) {
    try {
      const userId = req.user.userId;
      const date = req.query.date ? new Date(req.query.date) : new Date();
      
      const dailyLikeCount = await DailyLike.getDailyLikeCount(userId, date);
      const canLikeToday = dailyLikeCount < 5;
      
      res.status(200).json({
        success: true,
        dailyLikeCount,
        canLikeToday,
        remainingLikes: Math.max(0, 5 - dailyLikeCount),
        dailyLimit: 5
      });
      
    } catch (error) {
      console.error('❌ Get daily like stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch daily like statistics' });
    }
  }

  // Pass on a profile (swipe left)
  async passProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { targetUserId } = req.body;
      
      if (!targetUserId) {
        return res.status(400).json({ success: false, error: 'Target user ID is required' });
      }
      
      if (userId === targetUserId) {
        return res.status(400).json({ success: false, error: 'Cannot pass on your own profile' });
      }
      
      // For now, we just return success (no need to store passes)
      // In the future, we could store passes to avoid showing the same profile again
      
      res.status(200).json({
        success: true,
        message: 'Profile passed'
      });
      
    } catch (error) {
      console.error('❌ Pass profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to pass profile' });
    }
  }
}

module.exports = new MatchingController(); 