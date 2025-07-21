// Enhanced Profile Controller with Comprehensive Edge Case Handling
// Handles profile-related operations with validation and security

// Demo profiles data for development
const demoProfiles = [
  {
    id: 1,
    name: "Priya Sharma",
    age: 26,
    profession: "Software Engineer",
    location: "Mumbai, Maharashtra",
    education: "B.Tech Computer Science",
    image: "/demo-profiles/profile-1.svg",
    interests: ["Travel", "Reading", "Cooking", "Movies"],
    about: "Looking for a life partner who shares similar values and interests. I love exploring new places and trying different cuisines.",
    verified: true,
    lastActive: "2 hours ago",
    premium: false,
    profileCompleteness: 85
  },
  {
    id: 2,
    name: "Amit Patel",
    age: 29,
    profession: "Doctor",
    location: "Delhi, Delhi",
    education: "MBBS",
    image: "/demo-profiles/profile-2.svg",
    interests: ["Fitness", "Music", "Photography", "Volunteering"],
    about: "Passionate about helping others and living a healthy lifestyle. Looking for someone who values family and has a positive outlook on life.",
    verified: true,
    lastActive: "1 day ago",
    premium: true,
    profileCompleteness: 95
  },
  {
    id: 3,
    name: "Sneha Gupta",
    age: 24,
    profession: "Teacher",
    location: "Bangalore, Karnataka",
    education: "M.Ed",
    image: "/demo-profiles/profile-3.svg",
    interests: ["Art", "Dance", "Gardening", "Books"],
    about: "Creative and nurturing personality. I believe in building meaningful relationships and cherishing life's simple moments.",
    verified: true,
    lastActive: "3 hours ago",
    premium: false,
    profileCompleteness: 75
  },
  {
    id: 4,
    name: "Rahul Singh",
    age: 31,
    profession: "Business Analyst",
    location: "Pune, Maharashtra",
    education: "MBA Finance",
    image: "/demo-profiles/match-1.svg",
    interests: ["Sports", "Technology", "Investing", "Travel"],
    about: "Ambitious professional who believes in work-life balance. Looking for a partner to share life's adventures and build a beautiful future together.",
    verified: true,
    lastActive: "5 hours ago",
    premium: true,
    profileCompleteness: 90
  },
  {
    id: 5,
    name: "Kavya Reddy",
    age: 27,
    profession: "Marketing Manager",
    location: "Hyderabad, Telangana",
    education: "MBA Marketing",
    image: "/demo-profiles/match-2.svg",
    interests: ["Fashion", "Food", "Social Media", "Yoga"],
    about: "Enthusiastic and outgoing person who loves connecting with people. Family is very important to me and I'm looking for someone who shares that value.",
    verified: true,
    lastActive: "1 hour ago",
    premium: false,
    profileCompleteness: 80
  },
  {
    id: 6,
    name: "Arjun Kumar",
    age: 28,
    profession: "Civil Engineer",
    location: "Chennai, Tamil Nadu",
    education: "B.Tech Civil",
    image: "/demo-profiles/default-profile.svg",
    interests: ["Architecture", "Swimming", "Chess", "Music"],
    about: "Detail-oriented engineer with a passion for building things that last. Looking for a caring and understanding life partner.",
    verified: false,
    lastActive: "2 days ago",
    premium: false,
    profileCompleteness: 65
  }
];

// Enhanced validation utilities
const ProfileValidationUtils = {
  // Validate profile ID
  validateProfileId: (id) => {
    if (!id) return { valid: false, error: 'Profile ID is required' };
    
    const numId = parseInt(id);
    if (isNaN(numId) || numId <= 0) {
      return { valid: false, error: 'Invalid profile ID format' };
    }
    
    if (numId > 1000000) { // Reasonable upper limit
      return { valid: false, error: 'Profile ID too large' };
    }
    
    return { valid: true, id: numId };
  },

  // Validate pagination parameters
  validatePagination: (page, limit) => {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    
    const errors = [];
    
    if (pageNum < 1) errors.push('Page must be greater than 0');
    if (pageNum > 1000) errors.push('Page number too large (max 1000)');
    if (limitNum < 1) errors.push('Limit must be greater than 0');
    if (limitNum > 100) errors.push('Limit too large (max 100 profiles per page)');
    
    return {
      valid: errors.length === 0,
      errors,
      page: Math.max(1, Math.min(1000, pageNum)),
      limit: Math.max(1, Math.min(100, limitNum))
    };
  },

  // Validate age range
  validateAgeRange: (ageMin, ageMax) => {
    const minAge = parseInt(ageMin) || 18;
    const maxAge = parseInt(ageMax) || 50;
    
    const errors = [];
    
    if (minAge < 18) errors.push('Minimum age cannot be less than 18');
    if (maxAge > 80) errors.push('Maximum age cannot be more than 80');
    if (minAge > maxAge) errors.push('Minimum age cannot be greater than maximum age');
    if (maxAge - minAge > 50) errors.push('Age range too wide (max 50 years)');
    
    return {
      valid: errors.length === 0,
      errors,
      ageMin: Math.max(18, Math.min(80, minAge)),
      ageMax: Math.max(18, Math.min(80, maxAge))
    };
  },

  // Validate filter arrays
  validateFilterArray: (filterString, maxItems = 10, maxLength = 50) => {
    if (!filterString || typeof filterString !== 'string') {
      return { valid: true, filters: [] };
    }
    
    const filters = filterString.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, maxItems) // Limit number of filters
      .map(item => item.substring(0, maxLength)); // Limit length of each filter
    
    // Remove duplicates
    const uniqueFilters = [...new Set(filters)];
    
    return {
      valid: true,
      filters: uniqueFilters
    };
  },

  // Validate profile update data
  validateProfileUpdate: (updateData) => {
    const errors = [];
    const allowedFields = [
      'name', 'age', 'profession', 'location', 'education', 
      'about', 'interests', 'images'
    ];
    
    // Check for invalid fields
    const invalidFields = Object.keys(updateData).filter(
      field => !allowedFields.includes(field)
    );
    
    if (invalidFields.length > 0) {
      errors.push(`Invalid fields: ${invalidFields.join(', ')}`);
    }
    
    // Validate specific fields
    if (updateData.name !== undefined) {
      if (typeof updateData.name !== 'string' || updateData.name.trim().length === 0) {
        errors.push('Name must be a non-empty string');
      } else if (updateData.name.length > 100) {
        errors.push('Name too long (max 100 characters)');
      } else if (!/^[a-zA-Z\s.'-]+$/.test(updateData.name)) {
        errors.push('Name contains invalid characters');
      }
    }
    
    if (updateData.age !== undefined) {
      const age = parseInt(updateData.age);
      if (isNaN(age) || age < 18 || age > 80) {
        errors.push('Age must be between 18 and 80');
      }
    }
    
    if (updateData.profession !== undefined) {
      if (typeof updateData.profession !== 'string' || updateData.profession.trim().length === 0) {
        errors.push('Profession must be a non-empty string');
      } else if (updateData.profession.length > 100) {
        errors.push('Profession too long (max 100 characters)');
      }
    }
    
    if (updateData.location !== undefined) {
      if (typeof updateData.location !== 'string' || updateData.location.trim().length === 0) {
        errors.push('Location must be a non-empty string');
      } else if (updateData.location.length > 200) {
        errors.push('Location too long (max 200 characters)');
      }
    }
    
    if (updateData.education !== undefined) {
      if (typeof updateData.education !== 'string' || updateData.education.trim().length === 0) {
        errors.push('Education must be a non-empty string');
      } else if (updateData.education.length > 200) {
        errors.push('Education too long (max 200 characters)');
      }
    }
    
    if (updateData.about !== undefined) {
      if (typeof updateData.about !== 'string') {
        errors.push('About must be a string');
      } else if (updateData.about.length > 1000) {
        errors.push('About section too long (max 1000 characters)');
      }
    }
    
    if (updateData.interests !== undefined) {
      if (!Array.isArray(updateData.interests)) {
        errors.push('Interests must be an array');
      } else if (updateData.interests.length > 20) {
        errors.push('Too many interests (max 20)');
      } else {
        const invalidInterests = updateData.interests.filter(
          interest => typeof interest !== 'string' || interest.trim().length === 0 || interest.length > 50
        );
        if (invalidInterests.length > 0) {
          errors.push('Each interest must be a non-empty string (max 50 characters)');
        }
      }
    }
    
    if (updateData.images !== undefined) {
      if (!Array.isArray(updateData.images)) {
        errors.push('Images must be an array');
      } else if (updateData.images.length > 10) {
        errors.push('Too many images (max 10)');
      } else {
        const invalidImages = updateData.images.filter(
          image => typeof image !== 'string' || image.trim().length === 0 || image.length > 500
        );
        if (invalidImages.length > 0) {
          errors.push('Each image must be a valid URL string (max 500 characters)');
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      sanitizedData: ProfileValidationUtils.sanitizeUpdateData(updateData)
    };
  },

  // Sanitize update data
  sanitizeUpdateData: (data) => {
    const sanitized = {};
    
    if (data.name !== undefined) {
      sanitized.name = data.name.trim().substring(0, 100);
    }
    
    if (data.age !== undefined) {
      const age = parseInt(data.age);
      sanitized.age = Math.max(18, Math.min(80, age));
    }
    
    if (data.profession !== undefined) {
      sanitized.profession = data.profession.trim().substring(0, 100);
    }
    
    if (data.location !== undefined) {
      sanitized.location = data.location.trim().substring(0, 200);
    }
    
    if (data.education !== undefined) {
      sanitized.education = data.education.trim().substring(0, 200);
    }
    
    if (data.about !== undefined) {
      sanitized.about = data.about.trim().substring(0, 1000);
    }
    
    if (data.interests !== undefined && Array.isArray(data.interests)) {
      sanitized.interests = data.interests
        .slice(0, 20)
        .map(interest => interest.trim().substring(0, 50))
        .filter(interest => interest.length > 0);
    }
    
    if (data.images !== undefined && Array.isArray(data.images)) {
      sanitized.images = data.images
        .slice(0, 10)
        .map(image => image.trim().substring(0, 500))
        .filter(image => image.length > 0);
    }
    
    return sanitized;
  }
};

// Enhanced Profile Controller
const profileController = {
  // Get profiles with comprehensive filtering and validation
  async getProfiles(req, res) {
    const startTime = Date.now();
    
    try {
      // Extract and validate query parameters
      const {
        page = 1,
        limit = 10,
        ageMin = 18,
        ageMax = 50,
        professions = '',
        locations = '',
        education = '',
        interests = '',
        verified = '',
        premium = '',
        sortBy = 'lastActive',
        sortOrder = 'desc'
      } = req.query;

      // Validate pagination
      const paginationValidation = ProfileValidationUtils.validatePagination(page, limit);
      if (!paginationValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters',
          details: paginationValidation.errors,
          code: 'INVALID_PAGINATION'
        });
      }

      // Validate age range
      const ageValidation = ProfileValidationUtils.validateAgeRange(ageMin, ageMax);
      if (!ageValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid age range',
          details: ageValidation.errors,
          code: 'INVALID_AGE_RANGE'
        });
      }

      // Validate and parse filters
      const professionFilter = ProfileValidationUtils.validateFilterArray(professions, 10, 50);
      const locationFilter = ProfileValidationUtils.validateFilterArray(locations, 10, 100);
      const educationFilter = ProfileValidationUtils.validateFilterArray(education, 10, 50);
      const interestFilter = ProfileValidationUtils.validateFilterArray(interests, 20, 50);

      // Validate boolean filters
      let verifiedFilter = null;
      if (verified && verified !== '') {
        if (verified.toLowerCase() === 'true') verifiedFilter = true;
        else if (verified.toLowerCase() === 'false') verifiedFilter = false;
        else {
          return res.status(400).json({
            success: false,
            error: 'Verified filter must be true or false',
            code: 'INVALID_VERIFIED_FILTER'
          });
        }
      }

      let premiumFilter = null;
      if (premium && premium !== '') {
        if (premium.toLowerCase() === 'true') premiumFilter = true;
        else if (premium.toLowerCase() === 'false') premiumFilter = false;
        else {
          return res.status(400).json({
            success: false,
            error: 'Premium filter must be true or false',
            code: 'INVALID_PREMIUM_FILTER'
          });
        }
      }

      // Validate sorting
      const allowedSortFields = ['lastActive', 'age', 'name', 'profileCompleteness'];
      const allowedSortOrders = ['asc', 'desc'];
      
      if (!allowedSortFields.includes(sortBy)) {
        return res.status(400).json({
          success: false,
          error: `Invalid sort field. Allowed: ${allowedSortFields.join(', ')}`,
          code: 'INVALID_SORT_FIELD'
        });
      }
      
      if (!allowedSortOrders.includes(sortOrder.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: `Invalid sort order. Allowed: ${allowedSortOrders.join(', ')}`,
          code: 'INVALID_SORT_ORDER'
        });
      }

      // Apply filters
      let filteredProfiles = demoProfiles.filter(profile => {
        try {
          // Age filter
          if (profile.age < ageValidation.ageMin || profile.age > ageValidation.ageMax) {
            return false;
          }

          // Profession filter
          if (professionFilter.filters.length > 0 && 
              !professionFilter.filters.some(p => 
                profile.profession.toLowerCase().includes(p.toLowerCase())
              )) {
            return false;
          }

          // Location filter
          if (locationFilter.filters.length > 0 && 
              !locationFilter.filters.some(l => 
                profile.location.toLowerCase().includes(l.toLowerCase())
              )) {
            return false;
          }

          // Education filter
          if (educationFilter.filters.length > 0 && 
              !educationFilter.filters.some(e => 
                profile.education.toLowerCase().includes(e.toLowerCase())
              )) {
            return false;
          }

          // Interest filter
          if (interestFilter.filters.length > 0 && 
              !interestFilter.filters.some(i => 
                profile.interests.some(pi => pi.toLowerCase().includes(i.toLowerCase()))
              )) {
            return false;
          }

          // Verified filter
          if (verifiedFilter !== null && profile.verified !== verifiedFilter) {
            return false;
          }

          // Premium filter
          if (premiumFilter !== null && profile.premium !== premiumFilter) {
            return false;
          }

          return true;
        } catch (error) {
          console.error('❌ Error filtering profile:', error);
          return false; // Exclude profiles that cause errors
        }
      });

      // Apply sorting
      try {
        filteredProfiles.sort((a, b) => {
          let comparison = 0;
          
          switch (sortBy) {
            case 'age':
              comparison = a.age - b.age;
              break;
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'profileCompleteness':
              comparison = a.profileCompleteness - b.profileCompleteness;
              break;
            case 'lastActive':
            default:
              // Simple lastActive comparison (in a real app, this would be timestamps)
              const timeValues = {
                '1 hour ago': 1,
                '2 hours ago': 2,
                '3 hours ago': 3,
                '5 hours ago': 5,
                '1 day ago': 24,
                '2 days ago': 48
              };
              comparison = (timeValues[a.lastActive] || 999) - (timeValues[b.lastActive] || 999);
              break;
          }
          
          return sortOrder.toLowerCase() === 'desc' ? -comparison : comparison;
        });
      } catch (error) {
        console.error('❌ Error sorting profiles:', error);
        // Continue without sorting if there's an error
      }

      // Apply pagination
      const startIndex = (paginationValidation.page - 1) * paginationValidation.limit;
      const endIndex = startIndex + paginationValidation.limit;
      const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex);

      // Remove sensitive information for public viewing
      const publicProfiles = paginatedProfiles.map(profile => {
        const publicProfile = { ...profile };
        
        // Only show partial information for non-authenticated users
        if (!req.user) {
          publicProfile.about = profile.about ? profile.about.substring(0, 100) + '...' : '';
          publicProfile.interests = profile.interests.slice(0, 3);
        }
        
        return publicProfile;
      });

      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        profiles: publicProfiles,
        pagination: {
          currentPage: paginationValidation.page,
          totalPages: Math.ceil(filteredProfiles.length / paginationValidation.limit),
          totalProfiles: filteredProfiles.length,
          hasNextPage: endIndex < filteredProfiles.length,
          hasPrevPage: paginationValidation.page > 1,
          pageSize: paginationValidation.limit
        },
        filters: {
          ageRange: { min: ageValidation.ageMin, max: ageValidation.ageMax },
          professions: professionFilter.filters,
          locations: locationFilter.filters,
          education: educationFilter.filters,
          interests: interestFilter.filters,
          verified: verifiedFilter,
          premium: premiumFilter,
          sortBy,
          sortOrder
        },
        metadata: {
          authenticated: !!req.user,
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error fetching profiles:', error);
      const processingTime = Date.now() - startTime;
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profiles',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        code: 'FETCH_PROFILES_ERROR',
        processingTime: `${processingTime}ms`
      });
    }
  },

  // Get specific profile by ID with validation
  async getProfile(req, res) {
    const startTime = Date.now();
    
    try {
      const { id } = req.params;
      
      // Validate profile ID
      const idValidation = ProfileValidationUtils.validateProfileId(id);
      if (!idValidation.valid) {
        return res.status(400).json({
          success: false,
          error: idValidation.error,
          code: 'INVALID_PROFILE_ID'
        });
      }

      // Find profile
      const profile = demoProfiles.find(p => p.id === idValidation.id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          code: 'PROFILE_NOT_FOUND',
          requestedId: idValidation.id
        });
      }

      // Create response profile
      const responseProfile = { ...profile };
      
      // Limit information for non-authenticated users
      if (!req.user) {
        responseProfile.about = profile.about ? profile.about.substring(0, 150) + '...' : '';
        responseProfile.interests = profile.interests.slice(0, 5);
        
        // Hide sensitive information
        delete responseProfile.lastActive;
      }

      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        profile: responseProfile,
        metadata: {
          authenticated: !!req.user,
          canEdit: req.user?.email === `user${profile.id}@example.com`, // Simple ownership check
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      const processingTime = Date.now() - startTime;
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        code: 'FETCH_PROFILE_ERROR',
        processingTime: `${processingTime}ms`
      });
    }
  },

  // Update user profile with comprehensive validation
  async updateProfile(req, res) {
    const startTime = Date.now();
    
    try {
      // Authentication is required (handled by middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const { id } = req.params;
      
      // Validate profile ID
      const idValidation = ProfileValidationUtils.validateProfileId(id);
      if (!idValidation.valid) {
        return res.status(400).json({
          success: false,
          error: idValidation.error,
          code: 'INVALID_PROFILE_ID'
        });
      }

      // Find profile
      const profileIndex = demoProfiles.findIndex(p => p.id === idValidation.id);
      
      if (profileIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          code: 'PROFILE_NOT_FOUND',
          requestedId: idValidation.id
        });
      }

      // Check ownership (simple check for demo)
      const isOwner = req.user.email === `user${idValidation.id}@example.com` || 
                     req.user.email.includes('admin') || 
                     req.user.userId === idValidation.id.toString();
      
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to edit this profile',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_BODY'
        });
      }

      if (Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No update data provided',
          code: 'NO_UPDATE_DATA'
        });
      }

      // Validate update data
      const updateValidation = ProfileValidationUtils.validateProfileUpdate(req.body);
      if (!updateValidation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid update data',
          details: updateValidation.errors,
          code: 'INVALID_UPDATE_DATA'
        });
      }

      // Apply updates
      const updatedProfile = {
        ...demoProfiles[profileIndex],
        ...updateValidation.sanitizedData,
        id: idValidation.id, // Ensure ID doesn't change
        lastUpdated: new Date().toISOString()
      };

      // Update profile in demo array
      demoProfiles[profileIndex] = updatedProfile;

      const processingTime = Date.now() - startTime;

      console.log(`✅ Profile ${idValidation.id} updated by ${req.user.email}`);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile: updatedProfile,
        metadata: {
          updatedFields: Object.keys(updateValidation.sanitizedData),
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error updating profile:', error);
      const processingTime = Date.now() - startTime;
      
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        code: 'UPDATE_PROFILE_ERROR',
        processingTime: `${processingTime}ms`
      });
    }
  }
};

module.exports = profileController;
