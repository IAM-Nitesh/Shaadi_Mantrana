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
      
      // Log found profiles for debugging
      profilesWithAge.forEach((profile, index) => {
        console.log(`👤 Profile ${index + 1}: ${profile.profile?.name} (${profile.profile?.gender}, ${profile.profile?.age} years)`);
        console.log(`🎯 Profile ${index + 1} interests:`, profile.profile?.interests);
        console.log(`🎯 Profile ${index + 1} profession:`, profile.profile?.profession);
        console.log(`🎯 Profile ${index + 1} occupation:`, profile.profile?.occupation);
        console.log(`🎯 Profile ${index + 1} currentResidence:`, profile.profile?.currentResidence);
        console.log(`🎯 Profile ${index + 1} nativePlace:`, profile.profile?.nativePlace);
        
        // Special debug for the specific user
        if (profile._id.toString() === '688bb32be0ec0285ce006276') {
          console.log('🎯 SPECIAL DEBUG - User nitesh:', {
            id: profile._id,
            name: profile.profile?.name,
            interests: profile.profile?.interests,
            interestsType: typeof profile.profile?.interests,
            interestsLength: profile.profile?.interests?.length,
            isArray: Array.isArray(profile.profile?.interests),
            fullProfile: JSON.stringify(profile.profile, null, 2)
          });
        }
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

      // Delete like records when we have a targetUserId
      let userLike = null;
      let targetLike = null;
      if (targetUserId) {
        [userLike, targetLike] = await Promise.all([
          DailyLike.findOneAndDelete({ userId, likedProfileId: targetUserId }),
          DailyLike.findOneAndDelete({ userId: targetUserId, likedProfileId: userId })
        ]);

        console.log(`🗑️ Deleted likes - User like: ${userLike?._id}, Target like: ${targetLike?._id}`);
      }

      // Resolve and delete the accepted connection
      let connection = null;
      if (bodyConnectionId) {
        // Ensure connection exists and user is part of it
        const existing = await Connection.findById(bodyConnectionId);
        if (!existing) {
          return res.status(404).json({ success: false, error: 'Connection not found' });
        }
        if (!existing.users.map(u => u.toString()).includes(userId.toString())) {
          return res.status(403).json({ success: false, error: 'Not authorized to unmatch this connection' });
        }

        connection = await Connection.findByIdAndDelete(bodyConnectionId);
      } else {
        connection = await Connection.findOneAndDelete({
          users: { $all: [userId, targetUserId] },
          status: 'accepted'
        });
      }

      console.log(`🔗 Deleted connection: ${connection?._id}`);

      // Cascade-delete chat storage (ChatThread + legacy Message docs) if connection was removed
      let deletedChat = false;
      let deletedMessagesCount = 0;
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

      res.status(200).json({
        success: true,
        message: 'Successfully unmatched',
        deletedLikes: [userLike?._id, targetLike?._id].filter(Boolean),
        deletedConnection: connection?._id,
        deletedChatThread: deletedChat,
        deletedMessagesCount
      });

    } catch (error) {
      console.error('❌ Unmatch profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to unmatch profile' });
    }
  }
}

module.exports = new MatchingController(); 