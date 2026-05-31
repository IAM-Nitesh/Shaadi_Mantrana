// MongoDB-integrated Profile Controller
const { User } = require('../models');
const { SecurityUtils } = require('../utils/security');
const { logger } = require('../utils/pino-logger');

const isDev = process.env.NODE_ENV !== 'production';

class ProfileController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const userUuid = req.user.userUuid;
      
      const user = await User.findById(userId);
      if (!user) {
        logger.warn({ userUuid }, 'Profile not found');
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      // Additional validation: must have userUuid, and either email or phone number
      if (!user.userUuid || (!user.email && !user.phoneNumber)) {
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

  // Get isFirstLogin from user's own field (default to true only when undefined/null)
  const isFirstLogin = user.isFirstLogin ?? true;
      
      // Debug: Check what profileCompleteness value is being returned
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔍 Profile completeness debug for user:`, {
          userProfileCompleteness: user.profile.profileCompleteness,
          userProfileKeys: Object.keys(user.profile || {}),
          hasProfileCompleteness: 'profileCompleteness' in (user.profile || {}),
          finalValue: user.profile.profileCompleteness || 0
        });
        
        // Debug: Check the actual database document
        console.log(`🔍 Database document debug for user:`, {
          userId: user._id,
          profileCompleteness: user.profile?.profileCompleteness,
          profileKeys: Object.keys(user.profile || {}),
          fullProfile: user.profile
        });
        
        console.log(`✅ Profile retrieved for user: ${userUuid}`);
      }
      res.status(200).json({
        success: true,
        user: {
          ...user.toPublicJSON(),
          isFirstLogin: isFirstLogin,
          profileCompleteness: user.profile.profileCompleteness || 0,
          hasSeenOnboardingMessage: user.hasSeenOnboardingMessage || false
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

      if (isDev) {
        logger.debug({ userId, fieldCount: Object.keys(updates || {}).length }, 'Profile update request received');
      }

      // Validate and sanitize inputs - expanded to handle all profile fields
      const allowedFields = [
        'name', 'gender', 'nativePlace', 'currentResidence', 'maritalStatus', 'manglik',
        'dateOfBirth', 'timeOfBirth', 'placeOfBirth', 'height', 'weight', 'complexion',
        'education', 'occupation', 'annualIncome', 'eatingHabit', 'smokingHabit', 'drinkingHabit',
        'father', 'mother', 'brothers', 'sisters', 'fatherGotra', 'motherGotra', 'grandfatherGotra', 'grandmotherGotra',
        'specificRequirements', 'settleAbroad', 'about', 'interests', 'images'
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
          } else if (field === 'dateOfBirth') {
            // Enhanced date of birth validation with gender-specific age requirements
            const birthDate = new Date(updates[field]);
            const today = new Date();
            
            if (!isNaN(birthDate.getTime()) && birthDate < today) {
              // Calculate age
              let age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
              
              // Get user's gender for age validation
              const user = await User.findById(userId);
              const gender = user?.profile?.gender;
              
              // Gender-specific age validation
              let isValidAge = false;
              if (gender === 'Male') {
                isValidAge = age >= 21 && age <= 80;
              } else if (gender === 'Female') {
                isValidAge = age >= 18 && age <= 80;
              } else {
                // Default validation if gender not specified
                isValidAge = age >= 18 && age <= 80;
              }
              
              if (isValidAge) {
                sanitizedUpdates[`profile.${field}`] = updates[field];
              } else {
                if (isDev) logger.debug({ age, gender }, 'Age validation failed');
              }
            }
          } else if (field === 'height') {
            // Enhanced height validation for feet and inches format
            const heightValue = updates[field];
            // Updated regex to handle potential extra quotes and be more flexible
            const heightMatch = heightValue.match(/^(\d+)'(\d+)"*$/);
            
            if (heightMatch) {
              const feet = parseInt(heightMatch[1]);
              const inches = parseInt(heightMatch[2]);
              const totalInches = (feet * 12) + inches;
              
              // Min 4 feet (48 inches), Max 8 feet (96 inches)
              if (totalInches >= 48 && totalInches <= 96) {
                // Normalize the height format to ensure consistent storage
                const normalizedHeight = `${feet}'${inches}"`;
                sanitizedUpdates[`profile.${field}`] = normalizedHeight;
                if (isDev) logger.debug({ height: normalizedHeight }, 'Height validated');
              } else if (isDev) {
                logger.debug({ totalInches }, 'Height validation failed');
              }
            } else if (isDev) {
              logger.debug('Height format validation failed');
            }
          } else if (field === 'interests') {
            if (Array.isArray(updates[field])) {
              sanitizedUpdates[`profile.${field}`] = updates[field]
                .slice(0, 10) // Max 10 interests
                .map(interest => SecurityUtils.sanitizeInput(interest))
                .filter(interest => interest.length > 0);
            }
          } else if (field === 'images') {
            if (Array.isArray(updates[field]) || typeof updates[field] === 'string') {
              const imagesArray = Array.isArray(updates[field]) ? updates[field] : [updates[field]];
              sanitizedUpdates[`profile.${field}`] = imagesArray;
              // Auto-approve photos for testing phase so they appear in Discover
              sanitizedUpdates['profile.photoStatus'] = 'approved';
            }
          } else if (enumFields.includes(field)) {
            // For enum fields, only set if value is not empty and is a valid string
            const value = updates[field];
            if (value && typeof value === 'string' && value.trim() !== '') {
              sanitizedUpdates[`profile.${field}`] = value.trim();
              if (isDev) logger.debug({ field }, 'Enum field saved');
            } else if (isDev) {
              logger.debug({ field }, 'Enum field skipped');
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

      // Handle isFirstLogin and hasCompletedWizard flags separately - update in User collection
      let updatedUserFlags = false;
      if (updates.isFirstLogin !== undefined || updates.hasCompletedWizard !== undefined) {
        const userUpdates = {};
        if (updates.isFirstLogin !== undefined) userUpdates.isFirstLogin = Boolean(updates.isFirstLogin);
        if (updates.hasCompletedWizard !== undefined) userUpdates.hasCompletedWizard = Boolean(updates.hasCompletedWizard);
        
        await User.findByIdAndUpdate(
          userId,
          { $set: userUpdates }
        );
        updatedUserFlags = true;
        // Remove from sanitizedUpdates since we handle it separately
        delete updates.isFirstLogin;
        delete updates.hasCompletedWizard;
      }

      if (Object.keys(sanitizedUpdates).length === 0 && !updatedUserFlags) {
        if (isDev) logger.debug('No valid fields to update');
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      // If only flags were updated, fetch the user and return success immediately
      if (Object.keys(sanitizedUpdates).length === 0 && updatedUserFlags) {
        const user = await User.findById(userId);
        return res.status(200).json({
          success: true,
          message: 'Profile flags updated successfully',
          user: {
            ...user.toPublicJSON(),
            isFirstLogin: user.isFirstLogin,
            hasCompletedWizard: user.hasCompletedWizard,
            profileCompleteness: user.profile?.profileCompleteness || 0,
            hasSeenOnboardingMessage: user.hasSeenOnboardingMessage || false
          }
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
        logger.warn({ userUuid: req.user.userUuid }, 'User not found for profile update');
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
      
      // Calculate profile completion percentage using CANONICAL 12 mandatory fields + 1 photo.
      // This matches frontend/src/constants/profileCompleteness.ts exactly.
      const calculateProfileCompletion = (profile) => {
        if (!profile) return 0;

        const mandatoryFields = [
          'name', 'gender', 'dateOfBirth', 'maritalStatus',
          'education', 'occupation', 'nativePlace', 'height',
          'complexion', 'manglik', 'eatingHabit', 'about'
        ];

        // 12 text fields + 1 image = 13 total fields
        const total = mandatoryFields.length + 1;
        const increment = 100 / total;
        let completedFields = 0;
        const missingFields = [];

        mandatoryFields.forEach(field => {
          const val = profile[field];
          if (val && typeof val === 'string' && val.trim() !== '') {
            completedFields++;
          } else if (typeof val === 'number' && val > 0) {
            completedFields++;
          } else {
            missingFields.push(field);
          }
        });

        // Images field
        const imagesVal = profile['images'];
        if (
          (Array.isArray(imagesVal) && imagesVal.length > 0) ||
          (typeof imagesVal === 'string' && imagesVal.trim() !== '')
        ) {
          completedFields++;
        } else {
          missingFields.push('images');
        }

        if (isDev) logger.debug({ missingFields, completedFields, total }, 'Profile completion check');

        const percentage = Math.min(100, Math.round((completedFields / total) * 100));

        return percentage;
      };

      // Calculate completion using UPDATED profile data
      const completion = calculateProfileCompletion(profile);
      
      // Update the profileCompleteness in the database with the correct value
      
      try {
        // Use findByIdAndUpdate with the correct nested field path
        const updateResult = await User.findByIdAndUpdate(
          userId,
          { 
            $set: { 'profile.profileCompleteness': completion },
            lastActive: new Date()
          },
          { new: true, runValidators: true }
        );
        
        if (!updateResult) {
          console.error(`❌ Failed to update profileCompleteness for user ${userId}`);
          throw new Error('Failed to update profile completeness');
        }
        
        const updatedUser = await User.findById(userId);
        
        if (updatedUser.profile?.profileCompleteness !== completion) {
          logger.error({ expected: completion, got: updatedUser.profile?.profileCompleteness }, 'Profile completeness update verification failed');
          throw new Error('Database update verification failed');
        }
        
        if (isDev) logger.debug({ completion }, 'Profile completeness updated');
        
      } catch (error) {
        console.error(`❌ Error updating profileCompleteness:`, error);
        throw error;
      }
      
      // Check if user should be marked as not first login (100% threshold)
      if (completion >= 100) {
        try {
          // Build update object: always clear isFirstLogin and mark profileCompleted=true
          const updateFields = {
            isFirstLogin: false,
            profileCompleted: true,
            lastActive: new Date()
          };

          // If user is still in 'invited' state, promote to 'active'
          if (user.status === 'invited') {
            updateFields.status = 'active';
          }

          const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true }
          );

          if (isDev) logger.debug({ status: updatedUser?.status }, 'Profile completion flags updated');
        } catch (err) {
          logger.error({ err: err.message }, 'Error updating user flags for completed profile');
          throw err;
        }
      }

      if (isDev) {
        logger.debug({ userUuid: req.user.userUuid, fieldCount: Object.keys(sanitizedUpdates).length, completion }, 'Profile updated');
      }

      // Reload the user AFTER all DB writes so the response reflects the final state
      // (profileCompleteness, isFirstLogin, profileCompleted flags all up-to-date)
      const freshUser = await User.findById(userId);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: freshUser ? freshUser.toPublicJSON() : user.toPublicJSON(),
        profileCompleteness: completion,
        isFirstLogin: freshUser ? freshUser.isFirstLogin : user.isFirstLogin,
        profileCompleted: freshUser ? freshUser.profileCompleted : (completion >= 100)
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

  // Update first login flag
  async updateFirstLoginFlag(req, res) {
    try {
      const userId = req.user.userId;
      const { isFirstLogin } = req.body;

      if (isDev) logger.debug({ userId, isFirstLogin }, 'Update first login flag');

      // Validate input
      if (typeof isFirstLogin !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isFirstLogin must be a boolean'
        });
      }

      // Update the flag in User collection
      const user = await User.findByIdAndUpdate(
        userId,
        {
          isFirstLogin: isFirstLogin,
          lastActive: new Date()
        },
        { new: true }
      );

      if (!user) {
        logger.warn({ userUuid: req.user.userUuid }, 'User not found for first login flag update');
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (isDev) logger.debug({ userUuid: user.userUuid, isFirstLogin }, 'First login flag updated');

      res.status(200).json({
        success: true,
        message: 'First login flag updated successfully',
        isFirstLogin: user.isFirstLogin,
        hasCompletedWizard: user.hasCompletedWizard
      });

    } catch (error) {
      console.error('❌ Update first login flag error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update first login flag'
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
        'verification.isVerified': true,
        'profile.photoStatus': 'approved' // Play Store Compliance: Only show moderated photos
      };

      // Filter by opposite gender
      if (currentUser.profile?.gender) {
        const userGender = currentUser.profile.gender.toLowerCase();
        const oppositeGender = userGender === 'male' ? 'Female' : 'Male';
        queryFilters['profile.gender'] = { $regex: new RegExp(`^${oppositeGender}$`, 'i') };
      }

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
            $in: prefs.location.map(loc => new RegExp(SecurityUtils.escapeRegExp(loc), 'i'))
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
          queryFilters['profile.location'] = new RegExp(SecurityUtils.escapeRegExp(filters.location), 'i');
        }

        if (filters.profession) {
          queryFilters['profile.profession'] = new RegExp(SecurityUtils.escapeRegExp(filters.profession), 'i');
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
        userUuid: profile.userUuid,
        profile: profile.profile,
        verification: {
          isVerified: profile.verification?.isVerified ?? false,
        },
        lastActive: profile.lastActive,
        profileCompleteness: profile.profile?.profileCompleteness || 0,
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
      res.status(200).json({ success: true, profile: user.toDiscoveryJSON() });
    } catch (error) {
      console.error('❌ Get profile by UUID error:', error);
      res.status(500).json({ success: false, error: 'Failed to get profile' });
    }
  }

  // Hard-delete user account and all associated data (Google Play Store requirement)
  // Replaces the former soft-delete deleteProfile().
  async deleteAccount(req, res) {
    const userId = req.user.userId;
    const userUuid = req.user.userUuid;

    try {
      // 1. Delete profile photos from B2 storage
      try {
        const { b2Storage } = require('../services/b2StorageService');
        await b2Storage.deleteProfilePicture(userId);
      } catch (storageErr) {
        // Non-fatal — log and continue with DB purge
        if (process.env.NODE_ENV !== 'production') {
          console.warn('B2 photo deletion error during account deletion:', storageErr.message);
        }
      }

      // 2. Purge all active sessions for this user
      const { Session } = require('../models');
      if (Session) {
        await Session.deleteMany({ userId });
      }

      // 3. Remove user from any pending connections
      const { Connection } = require('../models');
      if (Connection) {
        await Connection.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
      }

      // 4. Remove messages (or anonymise — regulatory preference)
      const { Message } = require('../models');
      if (Message) {
        await Message.deleteMany({ sender: userId });
      }

      // 5. Hard-delete the user document
      const { User } = require('../models');
      const deleted = await User.findByIdAndDelete(userId);

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(`Account deleted: ${userUuid}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Your account and all associated data have been permanently deleted.',
      });

    } catch (error) {
      console.error('Account deletion error:', error.message);
      return res.status(500).json({ success: false, error: 'Failed to delete account' });
    }
  }

  // Update onboarding message flag
  async updateOnboardingMessage(req, res) {
    try {
      const userId = req.user.userId;
      const { hasSeenOnboardingMessage } = req.body;

      if (typeof hasSeenOnboardingMessage !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'hasSeenOnboardingMessage must be a boolean'
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            hasSeenOnboardingMessage: hasSeenOnboardingMessage,
            lastActive: new Date()
          }
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (isDev) logger.debug({ userUuid: user.userUuid, hasSeenOnboardingMessage }, 'Onboarding message flag updated');

      res.status(200).json({
        success: true,
        message: 'Onboarding message flag updated successfully',
        hasSeenOnboardingMessage: user.hasSeenOnboardingMessage
      });

    } catch (error) {
      console.error('❌ Update onboarding message error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update onboarding message flag'
      });
    }
  }
}

module.exports = new ProfileController();