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
      
      // Get current user to access their profile and preferences
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        console.log('❌ Current user not found');
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      console.log(`👤 Current user: ${currentUser.email}, Gender: ${currentUser.profile?.gender}`);
      
      // Get IDs of profiles the user has already liked
      const likedProfiles = await DailyLike.find({ userId }).select('likedProfileId');
      const likedProfileIds = likedProfiles.map(like => like.likedProfileId);
      console.log(`💕 User has liked ${likedProfileIds.length} profiles`);
      
      // Build query filters
      const queryFilters = {
        _id: { $ne: userId, $nin: likedProfileIds },
        status: 'active',
        'verification.isVerified': true,
        'profile.name': { $exists: true, $ne: '' }
      };
      
      // Filter by opposite gender
      if (currentUser.profile?.gender) {
        const oppositeGender = currentUser.profile.gender === 'Male' ? 'Female' : 'Male';
        queryFilters['profile.gender'] = oppositeGender;
        console.log(`🎯 Filtering by opposite gender: ${oppositeGender}`);
      }
      
      // Filter by age range if user has preferences
      if (currentUser.preferences?.ageRange) {
        const { min, max } = currentUser.preferences.ageRange;
        // Calculate date range for age filtering
        const today = new Date();
        const maxBirthDate = new Date(today.getFullYear() - min, today.getMonth(), today.getDate());
        const minBirthDate = new Date(today.getFullYear() - max, today.getMonth(), today.getDate());
        
        queryFilters['profile.dateOfBirth'] = { 
          $gte: minBirthDate.toISOString().split('T')[0], 
          $lte: maxBirthDate.toISOString().split('T')[0] 
        };
        console.log(`📅 Filtering by age range: ${min}-${max} (birth dates: ${minBirthDate.toISOString().split('T')[0]} to ${maxBirthDate.toISOString().split('T')[0]})`);
      }
      
      // Filter by location if user has preferences
      if (currentUser.preferences?.location && currentUser.preferences.location.length > 0) {
        // For now, let's be more lenient with location matching
        // Only filter if user has specific location preferences (not all states)
        if (currentUser.preferences.location.length < 10) {
          const locationRegex = currentUser.preferences.location.map(loc => new RegExp(loc, 'i'));
          queryFilters['$or'] = [
            { 'profile.nativePlace': { $in: locationRegex } },
            { 'profile.currentResidence': { $in: locationRegex } }
          ];
          console.log(`📍 Filtering by locations: ${currentUser.preferences.location.join(', ')}`);
        } else {
          console.log(`📍 User has broad location preferences (${currentUser.preferences.location.length} locations), skipping location filter`);
        }
      }
      
      console.log('🔍 Final query filters:', JSON.stringify(queryFilters, null, 2));
      
      // Debug: Check all available profiles first
      const allProfiles = await User.find({
        _id: { $ne: userId },
        status: 'active',
        'verification.isVerified': true
      }).select('profile.name profile.gender profile.dateOfBirth verification.isVerified').lean();
      
      console.log(`🔍 Total available profiles (before filters): ${allProfiles.length}`);
      allProfiles.forEach((profile, index) => {
        console.log(`👤 Available profile ${index + 1}: ${profile.profile?.name} (${profile.profile?.gender}, ${profile.profile?.dateOfBirth})`);
      });
      
      // Get profiles that match the criteria
      const profiles = await User.find(queryFilters)
        .select('profile.name profile.dateOfBirth profile.profession profile.images profile.about profile.gender profile.nativePlace profile.currentResidence profile.education profile.occupation verification.isVerified profileCompleted')
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();
      
      console.log(`📋 Found ${profiles.length} profiles for discovery`);
      
      // Calculate age for each profile and add to response
      const profilesWithAge = profiles.map(profile => {
        let age = null;
        if (profile.profile?.dateOfBirth) {
          const birthDate = new Date(profile.profile.dateOfBirth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        
        return {
          ...profile,
          profile: {
            ...profile.profile,
            age: age
          },
          profileCompleted: profile.profileCompleted || false
        };
      });
      
      // Log found profiles for debugging
      profilesWithAge.forEach((profile, index) => {
        console.log(`👤 Profile ${index + 1}: ${profile.profile?.name} (${profile.profile?.gender}, ${profile.profile?.age} years)`);
      });
      
      // Handle case when no profiles are found
      if (!profilesWithAge || profilesWithAge.length === 0) {
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
        profiles: profilesWithAge,
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
      
      console.log(`💕 Like request - User: ${userId}, Target: ${targetUserId}, Type: ${type}`);
      
      if (!targetUserId) {
        return res.status(400).json({ success: false, error: 'Target user ID is required' });
      }
      
      if (userId === targetUserId) {
        return res.status(400).json({ success: false, error: 'Cannot like your own profile' });
      }
      
      // Check daily like limit
      const dailyLikeCount = await DailyLike.getDailyLikeCount(userId);
      console.log(`📊 Daily like count: ${dailyLikeCount}`);
      
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
        console.log('⚠️ Profile already liked');
        return res.status(409).json({ success: false, error: 'Profile already liked' });
      }
      
      // Validate target user exists
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        console.log('❌ Target user not found');
        return res.status(404).json({ success: false, error: 'Target user not found' });
      }
      
      console.log(`✅ Target user found: ${targetUser.profile?.name}`);
      
      // Create the like
      const like = new DailyLike({
        userId,
        likedProfileId: targetUserId,
        type,
        likeDate: new Date()
      });
      await like.save();
      
      console.log(`💾 Like saved successfully: ${like._id}`);
      
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
      
      console.log(`🔍 Fetching liked profiles for user: ${userId}`);
      
      const likes = await DailyLike.getLikedProfiles(userId);
      console.log(`📋 Found ${likes.length} likes for user`);
      
      const likedProfiles = await Promise.all(likes.map(async (like) => {
        const likedUser = like.likedProfileId;
        console.log(`💕 Like: ${like._id}, Target: ${likedUser?._id}, Name: ${likedUser?.profile?.name}`);
        
        // If it's a mutual match, find the connection
        let connectionId = null;
        if (like.isMutualMatch) {
          const connection = await Connection.findOne({
            users: { $all: [userId, likedUser._id] },
            status: 'accepted'
          });
          connectionId = connection?._id;
        }
        
        return {
          likeId: like._id,
          profile: {
            _id: likedUser._id,
            profile: {
              name: likedUser.profile?.name || 'Unknown',
              age: likedUser.profile?.age || null,
              profession: likedUser.profile?.profession || null,
              images: likedUser.profile?.images || [],
              about: likedUser.profile?.about || null,
              education: likedUser.profile?.education || null,
              interests: likedUser.profile?.interests || [],
              location: likedUser.profile?.location || null
            },
            verification: {
              isVerified: likedUser.verification?.isVerified || false
            },
            profileCompleted: likedUser.profileCompleted || false
          },
          likeDate: like.likeDate,
          type: like.type,
          isMutualMatch: like.isMutualMatch,
          connectionId: connectionId
        };
      }));
      
      console.log(`✅ Returning ${likedProfiles.length} liked profiles`);
      
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

  // Unmatch from a profile
  async unmatchProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { targetUserId } = req.body;
      
      console.log(`🚫 Unmatch request - User: ${userId}, Target: ${targetUserId}`);
      
      if (!targetUserId) {
        return res.status(400).json({ success: false, error: 'Target user ID is required' });
      }
      
      if (userId === targetUserId) {
        return res.status(400).json({ success: false, error: 'Cannot unmatch from your own profile' });
      }
      
      // Find and delete the like records for both users
      const [userLike, targetLike] = await Promise.all([
        DailyLike.findOneAndDelete({ userId, likedProfileId: targetUserId }),
        DailyLike.findOneAndDelete({ userId: targetUserId, likedProfileId: userId })
      ]);
      
      console.log(`🗑️ Deleted likes - User like: ${userLike?._id}, Target like: ${targetLike?._id}`);
      
      // Find and delete the connection if it exists
      const connection = await Connection.findOneAndDelete({
        users: { $all: [userId, targetUserId] },
        status: 'accepted'
      });
      
      console.log(`🔗 Deleted connection: ${connection?._id}`);
      
      res.status(200).json({
        success: true,
        message: 'Successfully unmatched',
        deletedLikes: [userLike?._id, targetLike?._id].filter(Boolean),
        deletedConnection: connection?._id
      });
      
    } catch (error) {
      console.error('❌ Unmatch profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to unmatch profile' });
    }
  }
}

module.exports = new MatchingController(); 