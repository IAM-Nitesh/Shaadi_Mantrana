// MongoDB-integrated Matching Controller
const mongoose = require('mongoose');
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
        .select('profile.name profile.dateOfBirth profile.profession profile.images profile.about profile.gender profile.nativePlace profile.currentResidence profile.education profile.occupation profile.interests verification.isVerified profileCompleted')
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
      
      // Profile debugging removed for production security
      
      // Handle case when no profiles are found
      if (!profilesWithAge || profilesWithAge.length === 0) {
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
      
      // Like request logging removed for production security
      
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
        
        // Create connection for mutual match FIRST
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
        
        // Determine which user is userA and which is userB for toast tracking
        const isCurrentUserA = like.userId.toString() === userId;
        const toastSeen = {
          userA: isCurrentUserA ? false : false, // Current user hasn't seen it yet
          userB: isCurrentUserA ? false : false  // Other user hasn't seen it yet
        };
        
        // Update both likes to mark as mutual match and initialize toast tracking
        await Promise.all([
          DailyLike.updateOne(
            { _id: like._id }, 
            { 
              isMutualMatch: true,
              toastSeen: toastSeen,
              connectionId: connection._id
            }
          ),
          DailyLike.updateOne(
            { _id: mutualLike._id }, 
            { 
              isMutualMatch: true,
              toastSeen: toastSeen,
              connectionId: connection._id
            }
          )
        ]);
        
        // Check if current user should see the toast
        const shouldShowToast = isCurrentUserA ? !toastSeen.userA : !toastSeen.userB;
        
        res.status(200).json({
          success: true,
          like,
          isMutualMatch,
          connection,
          dailyLikeCount: dailyLikeCount + 1,
          remainingLikes: 4 - dailyLikeCount,
          shouldShowToast: shouldShowToast
        });
      } else {
        res.status(200).json({
          success: true,
          like,
          isMutualMatch,
          connection,
          dailyLikeCount: dailyLikeCount + 1,
          remainingLikes: 4 - dailyLikeCount
        });
      }
      
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
        
        // Construct location from available fields
        const location = likedUser.profile?.currentResidence || likedUser.profile?.nativePlace || null;
        
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
              location: location, // Use constructed location
              nativePlace: likedUser.profile?.nativePlace || null,
              currentResidence: likedUser.profile?.currentResidence || null
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

  // Mark match toast as seen when entering chat
  async markToastSeenOnChatEntry(req, res) {
    try {
      const userId = req.user.userId;
      const { connectionId } = req.body;
      
      console.log(`🎯 Marking toast as seen on chat entry - User: ${userId}, Connection: ${connectionId}`);
      
      if (!connectionId) {
        return res.status(400).json({ success: false, error: 'Connection ID is required' });
      }
      
      // First, verify the connection exists and user is part of it
      const connection = await Connection.findById(connectionId);
      if (!connection) {
        console.log(`❌ Connection not found: ${connectionId}`);
        return res.status(404).json({ success: false, error: 'Connection not found' });
      }
      
      console.log(`✅ Connection found: ${connection._id}`);
      console.log(`🔍 Connection users:`, connection.users.map(u => u.toString()));
      console.log(`🔍 Current user: ${userId}`);
      
      // Check if user is part of this connection
      const userInConnection = connection.users.some(user => user.toString() === userId);
      if (!userInConnection) {
        console.log(`❌ User ${userId} is not part of connection ${connectionId}`);
        return res.status(403).json({ success: false, error: 'User not part of this connection' });
      }
      
      console.log(`✅ User is part of connection`);
      
      // Find the mutual match for this connection
      let mutualMatch = await DailyLike.findOne({
        connectionId: connectionId,
        isMutualMatch: true
      });
      
      console.log(`🔍 Initial search result:`, mutualMatch ? 'Found' : 'Not found');
      
      // Debug: Check all DailyLike records for this connection
      const allDailyLikes = await DailyLike.find({ connectionId: connectionId });
      console.log(`🔍 All DailyLike records for connection ${connectionId}:`, allDailyLikes.length);
      allDailyLikes.forEach((like, index) => {
        console.log(`  ${index + 1}. User: ${like.userId}, Liked: ${like.likedProfileId}, Mutual: ${like.isMutualMatch}`);
      });
      
      // If not found, try with ObjectId conversion
      if (!mutualMatch) {
        console.log(`🔍 Trying with ObjectId conversion...`);
        try {
          const objectIdConnectionId = new mongoose.Types.ObjectId(connectionId);
          mutualMatch = await DailyLike.findOne({
            connectionId: objectIdConnectionId,
            isMutualMatch: true
          });
          console.log(`🔍 ObjectId search result:`, mutualMatch ? 'Found' : 'Not found');
        } catch (error) {
          console.log(`🔍 ObjectId conversion failed:`, error.message);
        }
      }
      
      // If not found by connectionId, try to find by user IDs
      if (!mutualMatch) {
        console.log(`🔍 No DailyLike found with connectionId ${connectionId}, searching by user IDs...`);
        const otherUserId = connection.users.find(id => id.toString() !== userId)?.toString();
        console.log(`🔍 Other user ID: ${otherUserId}`);
        
        // Search for mutual match using user IDs
        mutualMatch = await DailyLike.findOne({
          $or: [
            { userId: userId, likedProfileId: otherUserId, isMutualMatch: true },
            { userId: otherUserId, likedProfileId: userId, isMutualMatch: true }
          ]
        });
        
        console.log(`🔍 User ID search result:`, mutualMatch ? 'Found' : 'Not found');
        
        // If found, update it with the correct connectionId
        if (mutualMatch) {
          console.log(`🔧 Updating DailyLike ${mutualMatch._id} with connectionId ${connectionId}`);
          await DailyLike.updateOne(
            { _id: mutualMatch._id },
            { $set: { connectionId: connectionId } }
          );
        }
      }
      
      // If still not found, try a broader search
      if (!mutualMatch) {
        console.log(`🔍 Trying broader search for mutual match...`);
        const otherUserId = connection.users.find(id => id.toString() !== userId)?.toString();
        
        // Search for any mutual match between these users
        mutualMatch = await DailyLike.findOne({
          $and: [
            { isMutualMatch: true },
            {
              $or: [
                { userId: userId, likedProfileId: otherUserId },
                { userId: otherUserId, likedProfileId: userId }
              ]
            }
          ]
        });
        
        console.log(`🔍 Broader search result:`, mutualMatch ? 'Found' : 'Not found');
        
        // If found, update it with the correct connectionId
        if (mutualMatch) {
          console.log(`🔧 Updating DailyLike ${mutualMatch._id} with connectionId ${connectionId}`);
          await DailyLike.updateOne(
            { _id: mutualMatch._id },
            { $set: { connectionId: connectionId } }
          );
        }
      }
      
      if (!mutualMatch) {
        console.log(`❌ No mutual match found for connection ${connectionId}`);
        
        // Final fallback: Try to create the missing DailyLike record
        console.log(`🔧 Attempting to create missing DailyLike record...`);
        const otherUserId = connection.users.find(id => id.toString() !== userId)?.toString();
        
        if (otherUserId) {
          // Check if there are any likes between these users
          const existingLikes = await DailyLike.find({
            $or: [
              { userId: userId, likedProfileId: otherUserId },
              { userId: otherUserId, likedProfileId: userId }
            ]
          });
          
          console.log(`🔍 Found ${existingLikes.length} existing likes between users`);
          
          if (existingLikes.length >= 2) {
            // Both users have liked each other, create the mutual match record
            console.log(`🔧 Creating mutual match record...`);
            
            // Update both existing likes to mark as mutual match
            await Promise.all(existingLikes.map(like => 
              DailyLike.updateOne(
                { _id: like._id },
                { 
                  $set: { 
                    isMutualMatch: true,
                    connectionId: connectionId,
                    toastSeen: { userA: false, userB: false }
                  }
                }
              )
            ));
            
            // Now try to find the mutual match again
            mutualMatch = await DailyLike.findOne({
              connectionId: connectionId,
              isMutualMatch: true
            });
            
            console.log(`🔧 Mutual match created:`, mutualMatch ? 'Success' : 'Failed');
          }
        }
        
        if (!mutualMatch) {
          return res.status(404).json({ success: false, error: 'Mutual match not found for this connection' });
        }
      }
      
      // Determine which user is userA and which is userB
      const isUserA = mutualMatch.userId.toString() === userId;
      const updateField = isUserA ? 'toastSeen.userA' : 'toastSeen.userB';
      
      // Mark the toast as seen for the current user
      await DailyLike.updateOne(
        { _id: mutualMatch._id },
        { $set: { [updateField]: true } }
      );
      
      console.log(`✅ Match toast marked as seen for user: ${userId} on connection: ${connectionId}`);
      
      res.status(200).json({
        success: true,
        message: 'Match toast marked as seen'
      });
      
    } catch (error) {
      console.error('❌ Mark toast seen on chat entry error:', error);
      res.status(500).json({ success: false, error: 'Failed to mark match toast as seen' });
    }
  }

  // Mark match toast as seen
  async markMatchToastSeen(req, res) {
    try {
      const userId = req.user.userId;
      const { targetUserId } = req.body;
      
      console.log(`🎯 Marking match toast as seen - User: ${userId}, Target: ${targetUserId}`);
      
      if (!targetUserId) {
        return res.status(400).json({ success: false, error: 'Target user ID is required' });
      }
      
      // Find the mutual match between these users
      const mutualMatch = await DailyLike.findOne({
        userId: { $in: [userId, targetUserId] },
        likedProfileId: { $in: [userId, targetUserId] },
        isMutualMatch: true
      });
      
      if (!mutualMatch) {
        return res.status(404).json({ success: false, error: 'Mutual match not found' });
      }
      
      // Determine which user is userA and which is userB
      const isUserA = mutualMatch.userId.toString() === userId;
      const updateField = isUserA ? 'toastSeen.userA' : 'toastSeen.userB';
      
      // Mark the toast as seen for the current user
      await DailyLike.updateOne(
        { _id: mutualMatch._id },
        { $set: { [updateField]: true } }
      );
      
      console.log(`✅ Match toast marked as seen for user: ${userId}`);
      
      res.status(200).json({
        success: true,
        message: 'Match toast marked as seen'
      });
      
    } catch (error) {
      console.error('❌ Mark match toast seen error:', error);
      res.status(500).json({ success: false, error: 'Failed to mark match toast as seen' });
    }
  }

  // Get mutual matches (for Matches tab)
  async getMutualMatches(req, res) {
    try {
      const userId = req.user.userId;
      
      // Get connections that are mutual matches
      const connections = await Connection.findMutualMatches(userId);
      // Bulk fetch DailyLike entries for these connections to read toastSeen
      const connectionIds = connections.map(c => c._id);
      const dailyLikes = await DailyLike.find({ connectionId: { $in: connectionIds }, isMutualMatch: true });
      const dailyLikeMap = new Map();
      dailyLikes.forEach(dl => {
        if (dl.connectionId) {
          dailyLikeMap.set(dl.connectionId.toString(), dl);
        }
      });
      
  const matches = connections.map(connection => {
        const otherUser = connection.users.find(u => u._id.toString() !== userId);
        
        // Construct location from available fields
        const location = otherUser.profile?.currentResidence || otherUser.profile?.nativePlace || null;
        
        // Attach toastSeen info if available from DailyLike
        const dl = dailyLikeMap.get(connection._id.toString());

        let toastSeenMap = null;
        let shouldShowToast = false;
        if (dl) {
          // dl.userId and dl.likedProfileId represent the two participants for the DailyLike
          toastSeenMap = {};
          toastSeenMap[dl.userId.toString()] = dl.toastSeen?.userA || false;
          toastSeenMap[dl.likedProfileId.toString()] = dl.toastSeen?.userB || false;

          const isCurrentUserA = dl.userId.toString() === userId;
          shouldShowToast = isCurrentUserA ? !dl.toastSeen?.userA : !dl.toastSeen?.userB;
        }

        return {
          connectionId: connection._id,
          profile: {
            _id: otherUser._id,
            profile: {
              name: otherUser.profile?.name || 'Unknown',
              age: otherUser.profile?.age || null,
              profession: otherUser.profile?.profession || null,
              images: otherUser.profile?.images || [],
              about: otherUser.profile?.about || null,
              education: otherUser.profile?.education || null,
              interests: otherUser.profile?.interests || [],
              location: location, // Use constructed location
              nativePlace: otherUser.profile?.nativePlace || null,
              currentResidence: otherUser.profile?.currentResidence || null
            },
            verification: {
              isVerified: otherUser.verification?.isVerified || false
            },
            profileCompleted: otherUser.profileCompleted || false
          },
          matchDate: connection.timestamps.responded,
          lastActivity: connection.timestamps.lastActivity,
          toastSeen: toastSeenMap,
          shouldShowToast
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
      const { targetUserId, connectionId: bodyConnectionId } = req.body;

      console.log(`🚫 Unmatch request - User: ${userId}, Target: ${targetUserId || 'N/A'}, ConnectionId: ${bodyConnectionId || 'N/A'}`);

      if (!targetUserId && !bodyConnectionId) {
        return res.status(400).json({ success: false, error: 'Either targetUserId or connectionId is required' });
      }

      // Prevent self-unmatch when targetUserId provided
      if (targetUserId && userId === targetUserId) {
        return res.status(400).json({ success: false, error: 'Cannot unmatch from your own profile' });
      }

      // Load like records when we have a targetUserId (do not delete yet)
      let userLike = null;
      let targetLike = null;
      if (targetUserId) {
        [userLike, targetLike] = await Promise.all([
          DailyLike.findOne({ userId, likedProfileId: targetUserId }),
          DailyLike.findOne({ userId: targetUserId, likedProfileId: userId })
        ]);

        console.log(`� Loaded likes for unmatch - User like: ${userLike?._id}, Target like: ${targetLike?._id}`);
      }

      // Resolve and delete the accepted connection (be defensive if connection missing)
      let connection = null;
      let connectionMissing = false;
      if (bodyConnectionId) {
        // Try to load connection to validate ownership
        const existing = await Connection.findById(bodyConnectionId);
        if (!existing) {
          // Connection record already gone; continue with defensive cleanup using connectionId
          console.warn(`⚠️ Connection ${bodyConnectionId} not found; proceeding with cleanup using connectionId`);
          connectionMissing = true;
        } else {
          if (!existing.users.map(u => u.toString()).includes(userId.toString())) {
            return res.status(403).json({ success: false, error: 'Not authorized to unmatch this connection' });
          }

          connection = await Connection.findByIdAndDelete(bodyConnectionId);
        }
      } else {
        connection = await Connection.findOneAndDelete({
          users: { $all: [userId, targetUserId] },
          status: 'accepted'
        });
      }

      console.log(`🔗 Deleted connection: ${connection?._id}`);

      // Determine otherUserId (prefer explicit targetUserId if provided)
      let otherUserId = null;
      if (targetUserId) otherUserId = targetUserId;
      if (!otherUserId && connection && connection.users) {
        otherUserId = connection.users.find(id => id.toString() !== userId)?.toString();
      }

      // If connection wasn't found by strict query, try a broader lookup and delete it
      try {
        if (!connection && otherUserId) {
          const broader = await Connection.findOneAndDelete({ users: { $all: [userId, otherUserId] } });
          if (broader) {
            connection = broader;
            console.log('🔎 Found and deleted broader connection:', connection._id);
          }
        }
      } catch (e) {
        console.warn('Failed broader connection deletion attempt:', e.message);
      }

      // Always clear DailyLike mutual flags and connectionId for these users (defensive)
      try {
        // Collect DailyLike docs either by user-pair or by connectionId (if provided or deduced)
        let dlDocs = [];

        if (otherUserId) {
          dlDocs = await DailyLike.find({
            $or: [
              { userId, likedProfileId: otherUserId },
              { userId: otherUserId, likedProfileId: userId }
            ]
          });
        } else if (bodyConnectionId) {
          // Find DailyLike docs that reference this connectionId (string or ObjectId)
          dlDocs = await DailyLike.find({ connectionId: bodyConnectionId });

          // If we found docs, attempt to derive otherUserId
          if (dlDocs.length > 0) {
            const sample = dlDocs[0];
            if (String(sample.userId) === String(userId)) {
              otherUserId = String(sample.likedProfileId);
            } else if (String(sample.likedProfileId) === String(userId)) {
              otherUserId = String(sample.userId);
            }
          }
        }

        const dlIds = dlDocs.map(d => d._id.toString());
        const connIds = dlDocs.map(d => d.connectionId).filter(Boolean).map(String);

        if (dlIds.length > 0) {
          await DailyLike.updateMany(
            { _id: { $in: dlIds } },
            { $set: { isMutualMatch: false, connectionId: null, 'toastSeen.userA': false, 'toastSeen.userB': false } }
          );
          console.log('🔧 Cleared mutual match flags on DailyLike records for unmatch', dlIds);
        } else {
          console.log('🔍 No DailyLike records found to clear for unmatch between', userId, otherUserId, 'connectionId:', bodyConnectionId);
        }

        // Cascade-delete chat storage for any connectionIds found on DailyLike
        try {
          const ChatThread = require('../models/ChatThread');
          const MessageModel = require('../models/Message');

          let deletedChat = false;
          let deletedMessagesCount = 0;

          if (connIds.length > 0) {
            const ctRes = await ChatThread.deleteMany({ connectionId: { $in: connIds } });
            const msgRes = await MessageModel.deleteMany({ connectionId: { $in: connIds } });

            deletedChat = !!(ctRes && (ctRes.deletedCount >= 1 || ctRes.n >= 1));
            deletedMessagesCount = (msgRes && (msgRes.deletedCount || msgRes.n)) || 0;

            console.log(`🗑️ Deleted chat storage for connections ${connIds.join(', ')} - chatDeleted: ${deletedChat}, messagesDeleted: ${deletedMessagesCount}`);

            // Notify chat service to evict rooms
            try {
              const chatService = require('../services/chatService');
              if (chatService && chatService.io) {
                for (const cid of connIds) {
                  chatService.io.to(cid).emit('force_unmatched', { connectionId: cid });
                  if (chatService.chatRooms && typeof chatService.chatRooms.delete === 'function') {
                    chatService.chatRooms.delete(cid);
                  }
                  const room = chatService.io.sockets.adapter.rooms.get(cid);
                  if (room && room.size) {
                    for (const socketId of room) {
                      const s = chatService.io.sockets.sockets.get(socketId);
                      if (s) {
                        try { s.leave(cid); } catch (e) { /* ignore */ }
                      }
                    }
                  }
                }
              }
            } catch (e) {
              console.warn('Failed to notify chatService after unmatch cascade delete:', e.message);
            }
          } else {
            console.log('🔍 No connectionIds found on DailyLike records for chat cascade delete');
          }
        } catch (e) {
          console.warn('Failed to cascade-delete chat storage during unmatch defensive cleanup:', e.message);
        }
      } catch (e) {
        console.warn('Failed to clear DailyLike mutual match flags after unmatch:', e.message);
      }
      // Cascade-delete chat storage (ChatThread + legacy Message docs) if connection was removed
      let deletedChat = false;
      let deletedMessagesCount = 0;
  // Also attempt to delete any legacy `matches` documents that may exist in a separate collection
  let deletedLegacyMatchesCount = 0;
      try {
        const ChatThread = require('../models/ChatThread');
        const MessageModel = require('../models/Message');

        if (connection && connection._id) {
          const connIdStr = connection._id.toString();
          const ctRes = await ChatThread.deleteOne({ connectionId: connIdStr });
          const msgRes = await MessageModel.deleteMany({ connectionId: connIdStr });

          deletedChat = !!(ctRes && (ctRes.deletedCount === 1 || ctRes.n === 1));
          deletedMessagesCount = (msgRes && (msgRes.deletedCount || msgRes.n)) || 0;

          console.log(`🗑️ Deleted chat storage for connection ${connIdStr} - chatDeleted: ${deletedChat}, messagesDeleted: ${deletedMessagesCount}`);

          // Notify chat service (if running) to evict room / notify clients
          try {
            const chatService = require('../services/chatService');
            if (chatService && chatService.io) {
              // Emit an event so clients can react (close UI / redirect)
              chatService.io.to(connIdStr).emit('force_unmatched', { connectionId: connIdStr });

              // Remove in-memory chat history and make sockets leave the room
              if (chatService.chatRooms && typeof chatService.chatRooms.delete === 'function') {
                chatService.chatRooms.delete(connIdStr);
              }

              const room = chatService.io.sockets.adapter.rooms.get(connIdStr);
              if (room && room.size) {
                for (const socketId of room) {
                  const s = chatService.io.sockets.sockets.get(socketId);
                  if (s) {
                    try { s.leave(connIdStr); } catch (e) { /* ignore */ }
                  }
                }
              }
            }
          } catch (e) {
            console.warn('Failed to notify chatService after unmatch:', e.message);
          }
        }
      } catch (e) {
        console.warn('Failed to cascade-delete chat storage:', e.message);
      }

      // Legacy matches collection cleanup
      // Some deployments have an older `matches` collection that stores active matches
      // with a `users` array and/or `connectionId`. Attempt to remove matching docs
      // both via existing Mongoose `Match` model and by direct collection delete.
      try {
        const mongoose = require('mongoose');
        const MatchModel = require('../models/Match');

        // First try via the Mongoose model (handles newer match docs)
        try {
          const matchQuery = {};
          if (connection && connection._id) {
            matchQuery.$or = [ { connectionId: connection._id.toString() } ];
          } else if (otherUserId) {
            matchQuery.$or = [
              { users: { $all: [userId, otherUserId] } },
              { $and: [ { userId: userId }, { likedUserId: otherUserId } ] },
              { $and: [ { userId: otherUserId }, { likedUserId: userId } ] }
            ];
          }

          if (matchQuery.$or && matchQuery.$or.length > 0) {
            const resDel = await MatchModel.deleteMany(matchQuery);
            deletedLegacyMatchesCount += (resDel && (resDel.deletedCount || resDel.n)) || 0;
            console.log(`🗑️ Deleted ${deletedLegacyMatchesCount} legacy match document(s) (via Match model) for unmatch between ${userId} and ${otherUserId}`);
          }
        } catch (e) {
          console.warn('Legacy Match model deletion failed (continuing with collection delete):', e.message);
        }

  // Also attempt direct collection delete for docs stored in `matches` collection
  try {
          const coll = mongoose.connection.db.collection('matches');
          const collQuery = { $or: [] };

          if (connection && connection._id) {
            try {
              collQuery.$or.push({ connectionId: mongoose.Types.ObjectId(connection._id.toString()) });
            } catch (errCast) {
              // fallback to string match
              collQuery.$or.push({ connectionId: connection._id.toString() });
            }
          }

          if (otherUserId) {
            try {
              collQuery.$or.push({ users: { $all: [ mongoose.Types.ObjectId(userId), mongoose.Types.ObjectId(otherUserId) ] } });
            } catch (errCast) {
              collQuery.$or.push({ users: { $all: [ userId, otherUserId ] } });
            }
          }

          if (collQuery.$or.length > 0) {
            console.log('🔎 Attempting native collection delete with query on matches:', JSON.stringify(collQuery));
            const colRes = await coll.deleteMany(collQuery);
            const colDeleted = (colRes && (colRes.deletedCount || colRes.n)) || 0;
            deletedLegacyMatchesCount += colDeleted;
            console.log(`🗑️ Deleted ${colDeleted} legacy match document(s) from 'matches' collection for unmatch between ${userId} and ${otherUserId}`);
          } else {
            console.log('🔎 No native matches collection query constructed (nothing to delete)');
          }
        } catch (e) {
          console.warn('Failed to delete from native matches collection:', e.message);
        }
      } catch (e) {
        console.warn('Failed to delete legacy matches during unmatch cleanup (outer):', e.message);
      }

      // Defensive native collection deletes to ensure no orphaned documents remain
      try {
        const mongoose = require('mongoose');
        const db = mongoose.connection.db;

        const chatColl = db.collection('chatthreads');
        const msgColl = db.collection('messages');
        const connColl = db.collection('connections');

        let nativeDeleted = { chatthreads: 0, messages: 0, connections: 0 };

        // Delete by known connection id (from Connection model if available)
        if (connection && connection._id) {
          try {
            const cid = mongoose.Types.ObjectId(connection._id.toString());
            const ctRes = await chatColl.deleteMany({ connectionId: cid });
            const mRes = await msgColl.deleteMany({ connectionId: cid });
            nativeDeleted.chatthreads += (ctRes.deletedCount || ctRes.n || 0);
            nativeDeleted.messages += (mRes.deletedCount || mRes.n || 0);
          } catch (errCast) {
            const ctRes = await chatColl.deleteMany({ connectionId: connection._id.toString() });
            const mRes = await msgColl.deleteMany({ connectionId: connection._id.toString() });
            nativeDeleted.chatthreads += (ctRes.deletedCount || ctRes.n || 0);
            nativeDeleted.messages += (mRes.deletedCount || mRes.n || 0);
          }

          // Also attempt to delete any lingering connection documents by _id
          try {
            const conRes = await connColl.deleteMany({ _id: mongoose.Types.ObjectId(connection._id.toString()) });
            nativeDeleted.connections += (conRes.deletedCount || conRes.n || 0);
          } catch (e) {
            const conRes = await connColl.deleteMany({ _id: connection._id.toString() });
            nativeDeleted.connections += (conRes.deletedCount || conRes.n || 0);
          }
        }

        // If we have a bodyConnectionId (string) but Connection model was missing, try deleting by that too
        if (!connection && bodyConnectionId) {
          try {
            const cid2 = mongoose.Types.ObjectId(bodyConnectionId.toString());
            const ctRes = await chatColl.deleteMany({ connectionId: cid2 });
            const mRes = await msgColl.deleteMany({ connectionId: cid2 });
            nativeDeleted.chatthreads += (ctRes.deletedCount || ctRes.n || 0);
            nativeDeleted.messages += (mRes.deletedCount || mRes.n || 0);
            const conRes = await connColl.deleteMany({ _id: cid2 });
            nativeDeleted.connections += (conRes.deletedCount || conRes.n || 0);
          } catch (e) {
            const ctRes = await chatColl.deleteMany({ connectionId: bodyConnectionId.toString() });
            const mRes = await msgColl.deleteMany({ connectionId: bodyConnectionId.toString() });
            nativeDeleted.chatthreads += (ctRes.deletedCount || ctRes.n || 0);
            nativeDeleted.messages += (mRes.deletedCount || mRes.n || 0);
            const conRes = await connColl.deleteMany({ _id: bodyConnectionId.toString() });
            nativeDeleted.connections += (conRes.deletedCount || conRes.n || 0);
          }
        }

        // If we know the other user id, delete by users array match as well (covers legacy shapes)
        if (otherUserId) {
          try {
            const u1 = mongoose.Types.ObjectId(userId);
            const u2 = mongoose.Types.ObjectId(otherUserId);
            const conRes = await connColl.deleteMany({ users: { $all: [u1, u2] } });
            nativeDeleted.connections += (conRes.deletedCount || conRes.n || 0);

            // Find any connections that matched and delete their chat/messages
            const foundConns = await connColl.find({ users: { $all: [u1, u2] } }).project({ _id: 1 }).toArray();
            if (foundConns && foundConns.length) {
              const connIds = foundConns.map(c => c._id);
              const ctRes = await chatColl.deleteMany({ connectionId: { $in: connIds } });
              const mRes = await msgColl.deleteMany({ connectionId: { $in: connIds } });
              nativeDeleted.chatthreads += (ctRes.deletedCount || ctRes.n || 0);
              nativeDeleted.messages += (mRes.deletedCount || mRes.n || 0);
            }
          } catch (e) {
            // Fallback to string-based query
            const conRes = await connColl.deleteMany({ users: { $all: [userId, otherUserId] } });
            nativeDeleted.connections += (conRes.deletedCount || conRes.n || 0);
            const foundConns = await connColl.find({ users: { $all: [userId, otherUserId] } }).project({ _id: 1 }).toArray();
            if (foundConns && foundConns.length) {
              const connIds = foundConns.map(c => c._id);
              const ctRes = await chatColl.deleteMany({ connectionId: { $in: connIds } });
              const mRes = await msgColl.deleteMany({ connectionId: { $in: connIds } });
              nativeDeleted.chatthreads += (ctRes.deletedCount || ctRes.n || 0);
              nativeDeleted.messages += (mRes.deletedCount || mRes.n || 0);
            }
          }
        }

        console.log('🔧 Native cleanup counts:', nativeDeleted);
      } catch (e) {
        console.warn('Failed native collection cleanup during unmatch:', e.message || e);
      }

      res.status(200).json({
        success: true,
        message: 'Successfully unmatched',
        deletedLikes: [userLike?._id, targetLike?._id].filter(Boolean),
        deletedConnection: connection?._id,
        deletedChatThread: deletedChat,
        deletedMessagesCount,
        deletedLegacyMatchesCount
      });

      // Finally, remove the DailyLike records (do this after cascade cleanup so we could read connectionId)
      try {
        const dlDeleteIds = [userLike?._id, targetLike?._id].filter(Boolean);
        if (dlDeleteIds.length > 0) {
          const dlDelRes = await DailyLike.deleteMany({ _id: { $in: dlDeleteIds } });
          console.log(`🗑️ Removed DailyLike records after unmatch: ${dlDeleteIds.join(', ')} (deletedCount: ${dlDelRes.deletedCount || dlDelRes.n || 0})`);
        }
      } catch (e) {
        console.warn('Failed to delete DailyLike records after unmatch:', e.message);
      }

    } catch (error) {
      console.error('❌ Unmatch profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to unmatch profile' });
    }
  }
}

module.exports = new MatchingController(); 