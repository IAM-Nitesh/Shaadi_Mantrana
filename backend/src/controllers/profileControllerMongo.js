// MongoDB-integrated Profile Controller
const { User } = require('../models');
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

  // Get isFirstLogin from user's own field (default to true only when undefined/null)
  const isFirstLogin = user.isFirstLogin ?? true;
      
      // Debug: Check what profileCompleteness value is being returned
      console.log(`🔍 Profile completeness debug for ${user.email}:`, {
        userProfileCompleteness: user.profile.profileCompleteness,
        userProfileKeys: Object.keys(user.profile || {}),
        hasProfileCompleteness: 'profileCompleteness' in (user.profile || {}),
        finalValue: user.profile.profileCompleteness || 0
      });
      
      // Debug: Check the actual database document
      console.log(`🔍 Database document debug for ${user.email}:`, {
        userId: user._id,
        profileCompleteness: user.profile?.profileCompleteness,
        profileKeys: Object.keys(user.profile || {}),
        fullProfile: user.profile
      });
      
      console.log(`✅ Profile retrieved for user: ${userUuid} (${user.email})`);
      res.status(200).json({
        success: true,
        profile: {
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
                console.log(`❌ Age validation failed: ${age} years old, gender: ${gender}`);
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
                console.log(`✅ Height validated and normalized: ${heightValue} -> ${normalizedHeight}`);
              } else {
                console.log(`❌ Height validation failed: ${heightValue} (${totalInches} inches)`);
              }
            } else {
              console.log(`❌ Height format validation failed: ${heightValue}`);
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

      // Handle isFirstLogin flag separately - update in User collection
      if (updates.isFirstLogin !== undefined) {
        // Update isFirstLogin in User collection
        await User.findByIdAndUpdate(
          userId,
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
      
      // Calculate profile completion percentage using UPDATED profile data
      const calculateProfileCompletion = (profile) => {
        if (!profile) return 0;

        const requiredFields = [
          'name', 'gender', 'dateOfBirth', 'height', 'weight', 'complexion',
          'education', 'occupation', 'annualIncome', 'nativePlace', 'currentResidence',
          'maritalStatus', 'father', 'mother', 'about', 'images',
          'timeOfBirth', 'placeOfBirth', 'manglik', 'eatingHabit', 'smokingHabit', 
          'drinkingHabit', 'brothers', 'sisters', 'fatherGotra', 'motherGotra',
          'grandfatherGotra', 'grandmotherGotra', 'specificRequirements', 'settleAbroad',
          'interests'
        ];

        const optionalFields = [];

        let completedFields = 0;
        let totalWeight = 0;

        // Check all required fields (equal weight: 1x each)
        const missingRequiredFields = [];
        requiredFields.forEach(field => {
          totalWeight += 1;
          if (profile[field]) {
            if (field === 'images') {
              // Images field should have at least one image
              if (Array.isArray(profile[field]) && profile[field].length > 0) {
                completedFields += 1;
              } else if (typeof profile[field] === 'string' && profile[field].trim() !== '') {
                completedFields += 1;
              } else {
                missingRequiredFields.push(field);
              }
            } else if (field === 'interests') {
              // Interests field should be an array with at least one item
              if (Array.isArray(profile[field]) && profile[field].length > 0) {
                completedFields += 1;
              } else {
                missingRequiredFields.push(field);
              }
            } else if (typeof profile[field] === 'string' && profile[field].trim() !== '') {
              completedFields += 1;
            } else if (typeof profile[field] === 'number' && profile[field] > 0) {
              completedFields += 1;
            } else {
              missingRequiredFields.push(field);
            }
          } else {
            missingRequiredFields.push(field);
          }
        });
        
        console.log(`🔍 Missing required fields:`, missingRequiredFields);

        // Calculate percentage (max 100%)
        // Each field contributes equally to 100% completion
        const percentage = Math.min(100, Math.round((completedFields / totalWeight) * 100));
        
        // Debug logging for profile completion calculation
        console.log(`📊 Profile completion calculation debug:`, {
          completedFields,
          totalWeight,
          percentage,
          totalRequiredFields: requiredFields.length,
          requiredFields: requiredFields.length,
          optionalFields: optionalFields.length,
          requiredFieldsList: requiredFields,
          completedRequiredFieldsList: requiredFields.filter(field => {
            if (!profile[field]) return false;
            if (field === 'images') {
              return (Array.isArray(profile[field]) && profile[field].length > 0) || 
                     (typeof profile[field] === 'string' && profile[field].trim() !== '');
            }
            if (field === 'interests') {
              return Array.isArray(profile[field]) && profile[field].length > 0;
            }
            return typeof profile[field] === 'string' && profile[field].trim() !== '' || 
                   (typeof profile[field] === 'number' && profile[field] > 0);
          }),
          profileValues: requiredFields.reduce((acc, field) => {
            acc[field] = profile[field];
            return acc;
          }, {})
        });
        
        return percentage;
      };

      // Calculate completion using UPDATED profile data
      const completion = calculateProfileCompletion(profile);
      console.log(`📊 Calculated profile completion: ${completion}%`);
      
      // Update the profileCompleteness in the database with the correct value
      console.log(`🔄 Attempting to update profileCompleteness to ${completion}% for user ${userId}`);
      
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
        
        console.log(`✅ Database update result:`, {
          userId: updateResult._id,
          profileCompleteness: updateResult.profile?.profileCompleteness,
          expectedValue: completion,
          success: updateResult.profile?.profileCompleteness === completion
        });
        
        // Verify the update worked by fetching the user again
        const updatedUser = await User.findById(userId);
        console.log(`🔍 Verification - Updated user profileCompleteness:`, {
          userId: updatedUser._id,
          profileCompleteness: updatedUser.profile?.profileCompleteness,
          expectedValue: completion,
          match: updatedUser.profile?.profileCompleteness === completion
        });
        
        if (updatedUser.profile?.profileCompleteness !== completion) {
          console.error(`❌ Database update verification failed: expected ${completion}, got ${updatedUser.profile?.profileCompleteness}`);
          throw new Error('Database update verification failed');
        }
        
        console.log(`💾 Profile completeness (${completion}%) updated in database`);
        
      } catch (error) {
        console.error(`❌ Error updating profileCompleteness:`, error);
        throw error;
      }
      
      // Check if user should be marked as not first login (100% threshold)
      if (completion >= 100) {
        console.log('🎉 Profile is 100% complete! Updating user flags and status if needed...');

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

          console.log('✅ User update result:', updatedUser ? {
            userId: updatedUser._id,
            status: updatedUser.status,
            profileCompleted: updatedUser.profileCompleted
          } : 'not found');
        } catch (err) {
          console.error('❌ Error updating user flags for completed profile:', err);
          throw err;
        }
      } else {
        console.log('⚠️ Profile is less than 100% complete, keeping user status as is');
      }

      console.log(`✅ Profile updated for user: ${req.user.userUuid} (${user.email})`, {
        updatedFields: Object.keys(sanitizedUpdates),
        profileCompleteness: completion
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: user.toPublicJSON(),
        profileCompleteness: completion
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

      console.log(`🔄 Update first login flag - User: ${userId}, isFirstLogin: ${isFirstLogin}`);

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
        console.warn(`❌ User not found for first login flag update: ${req.user.userUuid} (${req.user.email})`);
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      console.log(`✅ First login flag updated for user: ${user.email} (${user.userUuid}) - isFirstLogin: ${isFirstLogin}`);

      res.status(200).json({
        success: true,
        message: 'First login flag updated successfully',
        isFirstLogin: user.isFirstLogin
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

      console.log(`✅ Onboarding message flag updated for user: ${user.email} (${user.userUuid}) - hasSeenOnboardingMessage: ${hasSeenOnboardingMessage}`);

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