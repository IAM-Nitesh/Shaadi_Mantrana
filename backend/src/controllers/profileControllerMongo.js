// MongoDB-integrated Profile Controller
const { User, PreapprovedEmail } = require('../models');
const { SecurityUtils } = require('../utils/security');

class ProfileController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const userUuid = req.user.userUuid;
      
      const user = await User.findById(userId);
      if (!user) {
        console.warn(`❌ Profile not found for user: ${userUuid} (${req.user.email})`);
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      // Additional validation: must have email, userUuid, and be approved
      if (!user.email || !user.userUuid) {
        return res.status(403).json({
          success: false,
          error: 'User record incomplete. Please contact support.'
        });
      }
      if (!user.verification?.isVerified) {
        return res.status(403).json({
          success: false,
          error: 'User is not approved by admin.'
        });
      }

      // Get isFirstLogin from PreapprovedEmail collection
      const preapproved = await PreapprovedEmail.findOne({ email: user.email });
      const isFirstLogin = preapproved ? preapproved.isFirstLogin : true;
      
      console.log(`✅ Profile retrieved for user: ${userUuid} (${user.email})`);
      res.status(200).json({
        success: true,
        profile: {
          ...user.toPublicJSON(),
          isFirstLogin: isFirstLogin
        }
      });

    } catch (error) {
      console.error(`❌ Get profile error for user: ${req.user?.userUuid}:`, error);
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

      // Debug: Log the incoming request data
      console.log('🔍 Received profile update request:');
      console.log('👤 User ID:', userId);
      console.log('📋 Raw updates:', updates);
      console.log('🎯 Enum fields in request:', {
        gender: updates.gender,
        maritalStatus: updates.maritalStatus,
        manglik: updates.manglik,
        complexion: updates.complexion,
        eatingHabit: updates.eatingHabit,
        smokingHabit: updates.smokingHabit,
        drinkingHabit: updates.drinkingHabit,
        settleAbroad: updates.settleAbroad
      });

      // Validate and sanitize inputs - expanded to handle all profile fields (excluding images)
      const allowedFields = [
        'name', 'gender', 'nativePlace', 'currentResidence', 'maritalStatus', 'manglik',
        'dateOfBirth', 'timeOfBirth', 'placeOfBirth', 'height', 'weight', 'complexion',
        'education', 'occupation', 'annualIncome', 'eatingHabit', 'smokingHabit', 'drinkingHabit',
        'father', 'mother', 'brothers', 'sisters', 'fatherGotra', 'motherGotra', 'grandfatherGotra', 'grandmotherGotra',
        'specificRequirements', 'settleAbroad', 'about', 'interests'
      ];
      
      const sanitizedUpdates = {};

      // Define enum fields that should not be sanitized
      const enumFields = ['gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad'];
      
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
                .map(interest => SecurityUtils.sanitizeInput(interest))
                .filter(interest => interest.length > 0);
            }
          } else if (enumFields.includes(field)) {
            // For enum fields, only set if value is not empty and is a valid string
            const value = updates[field];
            console.log(`🔍 Processing enum field "${field}":`, {
              value: value,
              type: typeof value,
              trimmed: value ? value.trim() : 'N/A',
              willSave: value && typeof value === 'string' && value.trim() !== ''
            });
            if (value && typeof value === 'string' && value.trim() !== '') {
              sanitizedUpdates[`profile.${field}`] = value.trim();
              console.log(`✅ Will save "${field}" as "${value.trim()}"`);
            } else {
              console.log(`❌ Skipping "${field}" - value is empty, undefined, or invalid`);
            }
            // If value is empty, undefined, or null, don't set it (leave it undefined)
          } else {
            const sanitized = SecurityUtils.sanitizeInput(updates[field]);
            if (sanitized !== undefined && sanitized !== '') {
              sanitizedUpdates[`profile.${field}`] = sanitized;
            }
          }
        }
      }

      // Handle isFirstLogin flag separately - update in PreapprovedEmail collection
      if (updates.isFirstLogin !== undefined) {
        // Update isFirstLogin in PreapprovedEmail collection instead of User
        await PreapprovedEmail.findOneAndUpdate(
          { email: req.user.email },
          { isFirstLogin: Boolean(updates.isFirstLogin) }
        );
        // Remove from sanitizedUpdates since we handle it separately
        delete updates.isFirstLogin;
      }

      console.log('🧹 Final sanitized updates:', sanitizedUpdates);
      
      if (Object.keys(sanitizedUpdates).length === 0) {
        console.log('❌ No valid fields to update');
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
        console.warn(`❌ User not found for profile update: ${req.user.userUuid} (${req.user.email})`);
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if all required fields are present and set isFirstLogin to false if so
      const requiredFields = [
        'name', 'gender', 'nativePlace', 'currentResidence', 'maritalStatus', 'manglik',
        'dateOfBirth', 'timeOfBirth', 'placeOfBirth', 'height', 'weight', 'complexion',
        'education', 'occupation', 'annualIncome', 'eatingHabit', 'smokingHabit', 'drinkingHabit',
        'father', 'mother', 'brothers', 'sisters', 'fatherGotra', 'motherGotra', 'grandfatherGotra', 'grandmotherGotra',
        'specificRequirements', 'settleAbroad', 'about', 'interests'
      ];
      const profile = user.profile || {};
      
      console.log('🔍 Checking profile completion for user:', req.user.email);
      console.log('📋 Current profile data:', profile);
      
      // Calculate profile completion percentage
      const calculateProfileCompletion = (profile) => {
        if (!profile) return 0;

        const requiredFields = [
          'name', 'gender', 'dateOfBirth', 'height', 'weight', 'complexion',
          'education', 'occupation', 'annualIncome', 'nativePlace', 'currentResidence',
          'maritalStatus', 'father', 'mother', 'about'
        ];

        const optionalFields = [
          'timeOfBirth', 'placeOfBirth', 'manglik', 'eatingHabit', 'smokingHabit', 
          'drinkingHabit', 'brothers', 'sisters', 'fatherGotra', 'motherGotra',
          'grandfatherGotra', 'grandmotherGotra', 'specificRequirements', 'settleAbroad',
          'interests'
        ];

        let completedFields = 0;

        // Check required fields (weight: 2x)
        requiredFields.forEach(field => {
          if (profile[field] && profile[field].toString().trim() !== '') {
            completedFields += 2;
          }
        });

        // Check optional fields (weight: 1x)
        optionalFields.forEach(field => {
          if (profile[field] && profile[field].toString().trim() !== '') {
            completedFields += 1;
          }
        });

        // Calculate percentage (max 100%)
        const percentage = Math.min(100, Math.round((completedFields / (requiredFields.length * 2 + optionalFields.length)) * 100));
        return percentage;
      };

      const completion = calculateProfileCompletion(profile);
      console.log(`📊 Profile completion: ${completion}%`);
      
      // Check if user should be marked as not first login (75% threshold)
      if (completion >= 75) {
        console.log('🎉 Profile is 75%+ complete! Updating user status...');
        
        // Update isFirstLogin in PreapprovedEmail collection
        const preapprovedUpdate = await PreapprovedEmail.findOneAndUpdate(
          { email: req.user.email },
          { isFirstLogin: false },
          { new: true }
        );
        console.log('✅ PreapprovedEmail updated:', preapprovedUpdate ? 'success' : 'not found');
        
        // Update user status to active if profile is completed
        if (user.status === 'invited') {
          user.status = 'active';
          user.profileCompleted = true;
          await user.save();
          console.log(`✅ User ${user.email} status updated to active (profile 75%+ complete)`);
        } else {
          console.log(`ℹ️ User ${user.email} status is already ${user.status}, no change needed`);
        }
      } else {
        console.log('⚠️ Profile is less than 75% complete, keeping user status as is');
      }

      console.log(`✅ Profile updated for user: ${req.user.userUuid} (${user.email})`, {
        updatedFields: Object.keys(sanitizedUpdates)
      });

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
        createdAt: profile.createdAt,

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

  // Get user profile by UUID (public or for monitoring)
  async getProfileByUuid(req, res) {
    try {
      const { uuid } = req.params;
      const user = await User.findOne({ userUuid: uuid });
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.status(200).json({ success: true, profile: user.toPublicJSON() });
    } catch (error) {
      console.error('❌ Get profile by UUID error:', error);
      res.status(500).json({ success: false, error: 'Failed to get profile' });
    }
  }

  // Soft delete user profile (set status to 'inactive')
  async deleteProfile(req, res) {
    try {
      const userId = req.user.userId;
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { status: 'inactive', lastActive: new Date() } },
        { new: true }
      );
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      res.status(200).json({ success: true, message: 'Account deactivated', profile: user.toPublicJSON() });
    } catch (error) {
      console.error('❌ Delete profile error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete profile' });
    }
  }
}

module.exports = new ProfileController();
