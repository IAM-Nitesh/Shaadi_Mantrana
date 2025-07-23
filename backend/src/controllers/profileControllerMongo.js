// MongoDB-integrated Profile Controller with Comprehensive CRUD Operations
const { User } = require('../models');
const { sanitizeInput } = require('../utils/security');
const mongoose = require('mongoose');

class ProfileController {
  // Get user's own profile (detailed view)
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
        profile: user.toDetailedJSON()
      });

    } catch (error) {
      console.error('❌ Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  // Get other user's profile (public view)
  async getUserProfile(req, res) {
    try {
      const { userUuid } = req.params;
      const currentUserId = req.user.userId;
      
      const user = await User.findOne({ userUuid, status: 'active' });
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if current user has permission to view this profile
      const currentUser = await User.findById(currentUserId);
      const canView = this.canViewProfile(currentUser, user);

      if (!canView) {
        return res.status(403).json({
          success: false,
          error: 'Profile not accessible'
        });
      }

      res.status(200).json({
        success: true,
        profile: user.toPublicJSON()
      });

    } catch (error) {
      console.error('❌ Get user profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile'
      });
    }
  }

  // Update user profile with comprehensive validation
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const updates = req.body;

      // Validate and sanitize updates
      const sanitizedUpdates = {};
      
      for (const [field, value] of Object.entries(updates)) {
        if (this.isValidField(field) && value !== undefined && value !== null) {
          // Handle nested objects
          if (typeof value === 'object' && !Array.isArray(value)) {
            // For nested objects like location, education
            if (field === 'location') {
              sanitizedUpdates[`profile.${field}`] = {
                city: sanitizeInput(value.city),
                state: sanitizeInput(value.state),
                country: sanitizeInput(value.country)
              };
            } else if (field === 'education') {
              sanitizedUpdates[`profile.${field}`] = {
                degree: sanitizeInput(value.degree),
                institution: sanitizeInput(value.institution),
                year: value.year ? parseInt(value.year) : undefined
              };
            }
          }
          // Handle arrays (like interests, photos)
          else if (Array.isArray(value)) {
            if (field === 'interests') {
              sanitizedUpdates[`profile.${field}`] = value
                .slice(0, 10) // Max 10 interests
                .map(interest => sanitizeInput(interest))
                .filter(interest => interest.length > 0);
            } else if (field === 'images') {
              sanitizedUpdates[`profile.${field}`] = value
                .slice(0, 6) // Max 6 photos
                .filter(photo => photo && photo.url);
            }
          }
          // Handle simple fields
          else {
            const sanitized = sanitizeInput(value.toString());
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

  // Helper method to check if user can view profile
  canViewProfile(currentUser, targetUser) {
    // Basic visibility rules
    if (!targetUser || targetUser.status !== 'active') {
      return false;
    }

    // Check privacy settings
    if (targetUser.privacy?.profileVisibility === 'private') {
      return false;
    }

    if (targetUser.privacy?.profileVisibility === 'verified' && 
        !currentUser.verification?.isVerified) {
      return false;
    }

    return true;
  }

  // Helper method to validate updateable fields
  isValidField(field) {
    const allowedFields = [
      'name', 'age', 'location', 'profession', 'company', 'education',
      'about', 'interests', 'images', 'height', 'religion', 'caste',
      'motherTongue', 'gender', 'maritalStatus', 'hobbies'
    ];
    return allowedFields.includes(field);
  }
}

module.exports = new ProfileController();
