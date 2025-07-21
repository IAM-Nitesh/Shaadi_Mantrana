// MongoDB-integrated Profile Controller
const { User } = require('../models');
const { sanitizeInput } = require('../utils/security');

class ProfileController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        profile: user.toPublicJSON()
      });

    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const updates = req.body;

      // Validate and sanitize inputs
      const allowedFields = ['name', 'age', 'profession', 'location', 'education', 'about', 'interests'];
      const sanitizedUpdates = {};

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          if (field === 'age') {
            const age = parseInt(updates[field]);
            if (age >= 18 && age <= 80) {
              sanitizedUpdates[`profile.${field}`] = age;
            }
          } else if (field === 'interests') {
            if (Array.isArray(updates[field])) {
              sanitizedUpdates[`profile.${field}`] = updates[field]
                .slice(0, 10) // Max 10 interests
                .map(interest => sanitizeInput(interest))
                .filter(interest => interest.length > 0);
            }
          } else {
            const sanitized = sanitizeInput(updates[field]);
            if (sanitized) {
              sanitizedUpdates[`profile.${field}`] = sanitized;
            }
          }
        }
      }

      if (Object.keys(sanitizedUpdates).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      // Update user profile
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          $set: sanitizedUpdates,
          lastActive: new Date()
        },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      console.log(`✅ Profile updated for user: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: user.toPublicJSON()
      });

    } catch (error) {
      console.error('❌ Update profile error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: Object.values(error.errors).map(err => err.message)
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  // Get profiles for matching (discovery)
  async getProfiles(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10, ...filters } = req.query;

      // Convert page and limit to numbers
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 profiles per page
      const skip = (pageNum - 1) * limitNum;

      // Get current user to exclude from results
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Build query filters
      const queryFilters = {
        _id: { $ne: userId }, // Exclude current user
        status: 'active',
        'verification.isVerified': true
      };

      // Apply user preferences if no specific filters provided
      if (Object.keys(filters).length === 0 && currentUser.preferences) {
        const prefs = currentUser.preferences;
        
        if (prefs.ageRange) {
          queryFilters['profile.age'] = {
            $gte: prefs.ageRange.min || 18,
            $lte: prefs.ageRange.max || 80
          };
        }

        if (prefs.location && prefs.location.length > 0) {
          queryFilters['profile.location'] = {
            $in: prefs.location.map(loc => new RegExp(loc, 'i'))
          };
        }
      } else {
        // Apply manual filters
        if (filters.ageMin || filters.ageMax) {
          queryFilters['profile.age'] = {};
          if (filters.ageMin) queryFilters['profile.age'].$gte = parseInt(filters.ageMin);
          if (filters.ageMax) queryFilters['profile.age'].$lte = parseInt(filters.ageMax);
        }

        if (filters.location) {
          queryFilters['profile.location'] = new RegExp(filters.location, 'i');
        }

        if (filters.profession) {
          queryFilters['profile.profession'] = new RegExp(filters.profession, 'i');
        }

        if (filters.verified !== undefined) {
          queryFilters['verification.isVerified'] = filters.verified === 'true';
        }
      }

      // Find profiles
      const profiles = await User.find(queryFilters)
        .select('profile verification status premium lastActive createdAt')
        .sort({ lastActive: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      // Get total count for pagination
      const totalCount = await User.countDocuments(queryFilters);
      const totalPages = Math.ceil(totalCount / limitNum);

      // Transform profiles for public viewing
      const publicProfiles = profiles.map(profile => ({
        id: profile._id,
        profile: profile.profile,
        verification: {
          isVerified: profile.verification.isVerified
        },
        status: profile.status,
        premium: profile.premium,
        lastActive: profile.lastActive,
        createdAt: profile.createdAt
      }));

      res.status(200).json({
        success: true,
        profiles: publicProfiles,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        filters: queryFilters
      });

    } catch (error) {
      console.error('❌ Get profiles error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profiles'
      });
    }
  }
}

module.exports = new ProfileController();
