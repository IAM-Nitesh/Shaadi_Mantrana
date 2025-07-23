// User Model - MongoDB Schema with UUID and Best Practices
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  // Unique identifier - UUID for external references
  userUuid: {
    type: String,
    unique: true,
    required: true,
    default: uuidv4,
    index: true
  },

  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    index: true
  },
  
  // Profile Information - Enhanced with validation
  profile: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
      minlength: [2, 'Name must be at least 2 characters']
    },
    age: {
      type: Number,
      min: [18, 'Age must be at least 18'],
      max: [80, 'Age cannot exceed 80']
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(value) {
          if (!value) return true; // Optional field
          const today = new Date();
          const age = Math.floor((today - value) / (365.25 * 24 * 60 * 60 * 1000));
          return age >= 18 && age <= 80;
        },
        message: 'Date of birth must correspond to age between 18 and 80'
      }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      lowercase: true
    },
    profession: {
      type: String,
      trim: true,
      maxlength: [100, 'Profession cannot exceed 100 characters']
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters']
    },
    location: {
      city: {
        type: String,
        trim: true,
        maxlength: [50, 'City name cannot exceed 50 characters']
      },
      state: {
        type: String,
        trim: true,
        maxlength: [50, 'State name cannot exceed 50 characters']
      },
      country: {
        type: String,
        trim: true,
        maxlength: [50, 'Country name cannot exceed 50 characters'],
        default: 'India'
      },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    education: {
      degree: {
        type: String,
        trim: true,
        maxlength: [100, 'Degree cannot exceed 100 characters']
      },
      institution: {
        type: String,
        trim: true,
        maxlength: [150, 'Institution name cannot exceed 150 characters']
      },
      year: {
        type: Number,
        min: [1950, 'Graduation year cannot be before 1950'],
        max: [new Date().getFullYear() + 5, 'Graduation year cannot be more than 5 years in the future']
      }
    },
    about: {
      type: String,
      trim: true,
      maxlength: [1000, 'About section cannot exceed 1000 characters']
    },
    height: {
      type: Number, // in centimeters
      min: [120, 'Height must be at least 120 cm'],
      max: [250, 'Height cannot exceed 250 cm']
    },
    religion: {
      type: String,
      trim: true,
      maxlength: [50, 'Religion cannot exceed 50 characters']
    },
    caste: {
      type: String,
      trim: true,
      maxlength: [50, 'Caste cannot exceed 50 characters']
    },
    motherTongue: {
      type: String,
      trim: true,
      maxlength: [30, 'Mother tongue cannot exceed 30 characters']
    },
    maritalStatus: {
      type: String,
      enum: ['never_married', 'divorced', 'widowed', 'separated'],
      default: 'never_married'
    },
    interests: [{
      type: String,
      trim: true,
      maxlength: [50, 'Interest cannot exceed 50 characters']
    }],
    hobbies: [{
      type: String,
      trim: true,
      maxlength: [50, 'Hobby cannot exceed 50 characters']
    }],
    images: [{
      url: {
        type: String,
        trim: true,
        maxlength: [500, 'Image URL cannot exceed 500 characters']
      },
      caption: {
        type: String,
        trim: true,
        maxlength: [200, 'Image caption cannot exceed 200 characters']
      },
      isProfile: {
        type: Boolean,
        default: false
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Authentication
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    approvalType: {
      type: String,
      enum: ['direct', 'domain', 'admin'],
      default: 'direct'
    }
  },

  // Status and Settings
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  
  premium: {
    type: Boolean,
    default: false
  },

  // Activity Tracking
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],

  // Enhanced Preferences for Better Matching
  preferences: {
    ageRange: {
      min: {
        type: Number,
        default: 18,
        min: 18,
        max: 80
      },
      max: {
        type: Number,
        default: 50,
        min: 18,
        max: 80
      }
    },
    heightRange: {
      min: {
        type: Number, // in centimeters
        min: 120,
        max: 250
      },
      max: {
        type: Number, // in centimeters
        min: 120,
        max: 250
      }
    },
    location: {
      preferredCities: [String],
      preferredStates: [String],
      maxDistance: {
        type: Number, // in kilometers
        default: 100
      }
    },
    profession: [String],
    educationPreferences: {
      minimumDegree: String,
      preferredInstitutions: [String]
    },
    religion: [String],
    caste: [String],
    motherTongue: [String],
    maritalStatus: [String],
    onlyVerifiedProfiles: {
      type: Boolean,
      default: false
    },
    showMeOnlyTo: {
      verifiedUsers: {
        type: Boolean,
        default: false
      },
      premiumUsers: {
        type: Boolean,
        default: false
      }
    }
  },

  // Privacy Settings
  privacy: {
    showAge: {
      type: Boolean,
      default: true
    },
    showLocation: {
      type: Boolean,
      default: true
    },
    showProfession: {
      type: Boolean,
      default: true
    },
    showEducation: {
      type: Boolean,
      default: true
    },
    showImages: {
      type: Boolean,
      default: true
    },
    contactInfo: {
      type: String,
      enum: ['public', 'matches_only', 'premium_only', 'hidden'],
      default: 'matches_only'
    }
  },

  // Communication Preferences
  communication: {
    emailNotifications: {
      newMatches: {
        type: Boolean,
        default: true
      },
      messages: {
        type: Boolean,
        default: true
      },
      profileViews: {
        type: Boolean,
        default: false
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    smsNotifications: {
      enabled: {
        type: Boolean,
        default: false
      },
      phone: {
        type: String,
        trim: true,
        match: [/^[+]?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid phone number']
      }
    }
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ userUuid: 1 }, { unique: true });
userSchema.index({ 'profile.age': 1, status: 1 });
userSchema.index({ 'profile.location.city': 1, 'profile.location.state': 1 });
userSchema.index({ 'profile.profession': 1, status: 1 });
userSchema.index({ 'profile.education.degree': 1 });
userSchema.index({ 'profile.religion': 1, 'profile.caste': 1 });
userSchema.index({ status: 1, 'verification.isVerified': 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ premium: 1, status: 1 });

// Text index for search functionality
userSchema.index({
  'profile.name': 'text',
  'profile.profession': 'text',
  'profile.about': 'text',
  'profile.interests': 'text',
  'profile.hobbies': 'text'
});

// Geospatial index for location-based queries
userSchema.index({ 'profile.location.coordinates': '2dsphere' });

// Virtual for profile completion calculation - Enhanced
userSchema.virtual('profileCompletion').get(function() {
  let completion = 0;
  const basicFields = ['name', 'age', 'profession', 'location.city', 'about'];
  const optionalFields = ['education.degree', 'gender', 'height', 'religion'];
  
  // Basic fields (70% weight)
  let basicScore = 0;
  basicFields.forEach(field => {
    const value = field.includes('.') ? 
      field.split('.').reduce((obj, key) => obj?.[key], this.profile) : 
      this.profile[field];
    if (value) basicScore += 14; // 70/5 fields
  });
  
  // Optional fields (20% weight)
  let optionalScore = 0;
  optionalFields.forEach(field => {
    const value = field.includes('.') ? 
      field.split('.').reduce((obj, key) => obj?.[key], this.profile) : 
      this.profile[field];
    if (value) optionalScore += 5; // 20/4 fields
  });
  
  // Additional fields (10% weight)
  if (this.profile.interests && this.profile.interests.length > 0) completion += 5;
  if (this.profile.images && this.profile.images.length > 0) completion += 5;
  
  completion = basicScore + optionalScore;
  return Math.min(Math.round(completion), 100);
});

// Virtual for age calculation from date of birth
userSchema.virtual('calculatedAge').get(function() {
  if (this.profile.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.profile.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return this.profile.age;
});

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Update profile completeness
  this.profile.profileCompleteness = this.profileCompletion;
  
  // Auto-calculate age from date of birth if provided
  if (this.profile.dateOfBirth && !this.profile.age) {
    this.profile.age = this.calculatedAge;
  }
  
  // Validate age range preferences
  if (this.preferences.ageRange.min > this.preferences.ageRange.max) {
    this.preferences.ageRange.max = this.preferences.ageRange.min + 10;
  }
  
  // Ensure only one profile image
  if (this.profile.images && this.profile.images.length > 0) {
    const profileImages = this.profile.images.filter(img => img.isProfile);
    if (profileImages.length > 1) {
      // Keep only the first profile image
      this.profile.images.forEach((img, index) => {
        if (index > 0 && img.isProfile) {
          img.isProfile = false;
        }
      });
    }
  }
  
  next();
});

// Method to sanitize user data for public viewing - Enhanced
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  
  // Remove sensitive information
  delete user.__v;
  delete user.loginHistory;
  delete user.communication.smsNotifications.phone;
  
  // Apply privacy settings
  if (!this.privacy.showAge) {
    delete user.profile.age;
    delete user.profile.dateOfBirth;
  }
  
  if (!this.privacy.showLocation) {
    delete user.profile.location;
  }
  
  if (!this.privacy.showProfession) {
    delete user.profile.profession;
    delete user.profile.company;
  }
  
  if (!this.privacy.showEducation) {
    delete user.profile.education;
  }
  
  if (!this.privacy.showImages) {
    user.profile.images = [];
  }
  
  return {
    id: user._id,
    userUuid: user.userUuid,
    email: user.email,
    profile: user.profile,
    verification: {
      isVerified: user.verification.isVerified
    },
    status: user.status,
    premium: user.premium,
    lastActive: user.lastActive,
    createdAt: user.createdAt,
    privacy: user.privacy
  };
};

// Method for detailed profile (for profile owner)
userSchema.methods.toDetailedJSON = function() {
  const user = this.toObject();
  delete user.__v;
  return user;
};

// Static method to find users with enhanced filters
userSchema.statics.findWithFilters = function(filters = {}, currentUser = null) {
  const query = { status: 'active' };
  
  // Exclude current user from results
  if (currentUser) {
    query._id = { $ne: currentUser._id };
  }
  
  // Age filter
  if (filters.ageMin || filters.ageMax) {
    query['profile.age'] = {};
    if (filters.ageMin) query['profile.age'].$gte = parseInt(filters.ageMin);
    if (filters.ageMax) query['profile.age'].$lte = parseInt(filters.ageMax);
  }
  
  // Location filter - enhanced
  if (filters.city) {
    query['profile.location.city'] = new RegExp(filters.city, 'i');
  }
  if (filters.state) {
    query['profile.location.state'] = new RegExp(filters.state, 'i');
  }
  if (filters.locations && filters.locations.length > 0) {
    query.$or = [
      { 'profile.location.city': { $in: filters.locations.map(l => new RegExp(l, 'i')) } },
      { 'profile.location.state': { $in: filters.locations.map(l => new RegExp(l, 'i')) } }
    ];
  }
  
  // Profession filter
  if (filters.profession) {
    query['profile.profession'] = new RegExp(filters.profession, 'i');
  }
  if (filters.professions && filters.professions.length > 0) {
    query['profile.profession'] = { $in: filters.professions.map(p => new RegExp(p, 'i')) };
  }
  
  // Education filter
  if (filters.education) {
    query['profile.education.degree'] = new RegExp(filters.education, 'i');
  }
  if (filters.educations && filters.educations.length > 0) {
    query['profile.education.degree'] = { $in: filters.educations.map(e => new RegExp(e, 'i')) };
  }
  
  // Interests filter
  if (filters.interests && filters.interests.length > 0) {
    query['profile.interests'] = { $in: filters.interests.map(i => new RegExp(i, 'i')) };
  }
  
  // Verification filter
  if (filters.verified !== undefined) {
    query['verification.isVerified'] = filters.verified;
  }
  
  // Premium filter
  if (filters.premium !== undefined) {
    query.premium = filters.premium;
  }
  
  // Gender filter
  if (filters.gender) {
    query['profile.gender'] = filters.gender;
  }
  
  // Religion filter
  if (filters.religion) {
    query['profile.religion'] = new RegExp(filters.religion, 'i');
  }
  
  // Height filter
  if (filters.heightMin || filters.heightMax) {
    query['profile.height'] = {};
    if (filters.heightMin) query['profile.height'].$gte = parseInt(filters.heightMin);
    if (filters.heightMax) query['profile.height'].$lte = parseInt(filters.heightMax);
  }
  
  // Marital status filter
  if (filters.maritalStatus) {
    query['profile.maritalStatus'] = filters.maritalStatus;
  }
  
  // Apply current user's preferences if provided
  if (currentUser && currentUser.preferences) {
    const prefs = currentUser.preferences;
    
    // Age preferences
    if (prefs.ageRange && prefs.ageRange.min && prefs.ageRange.max) {
      query['profile.age'] = {
        ...query['profile.age'],
        $gte: prefs.ageRange.min,
        $lte: prefs.ageRange.max
      };
    }
    
    // Only verified profiles preference
    if (prefs.onlyVerifiedProfiles) {
      query['verification.isVerified'] = true;
    }
  }
  
  return this.find(query);
};

// Static method for text search
userSchema.statics.searchProfiles = function(searchTerm, filters = {}) {
  const query = {
    ...this.findWithFilters(filters).getQuery(),
    $text: { $search: searchTerm }
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Static method to get compatibility score
userSchema.statics.getCompatibilityScore = function(user1, user2) {
  let score = 0;
  let maxScore = 0;
  
  // Age compatibility (20 points)
  maxScore += 20;
  if (user1.profile.age && user2.profile.age) {
    const ageDiff = Math.abs(user1.profile.age - user2.profile.age);
    if (ageDiff <= 2) score += 20;
    else if (ageDiff <= 5) score += 15;
    else if (ageDiff <= 10) score += 10;
    else if (ageDiff <= 15) score += 5;
  }
  
  // Location compatibility (15 points)
  maxScore += 15;
  if (user1.profile.location?.city && user2.profile.location?.city) {
    if (user1.profile.location.city.toLowerCase() === user2.profile.location.city.toLowerCase()) {
      score += 15;
    } else if (user1.profile.location.state && user2.profile.location.state &&
               user1.profile.location.state.toLowerCase() === user2.profile.location.state.toLowerCase()) {
      score += 10;
    }
  }
  
  // Education compatibility (15 points)
  maxScore += 15;
  if (user1.profile.education?.degree && user2.profile.education?.degree) {
    const edu1 = user1.profile.education.degree.toLowerCase();
    const edu2 = user2.profile.education.degree.toLowerCase();
    if (edu1.includes('phd') || edu2.includes('phd')) {
      if (edu1.includes('phd') && edu2.includes('phd')) score += 15;
      else if ((edu1.includes('master') || edu1.includes('mtech') || edu1.includes('mba')) || 
               (edu2.includes('master') || edu2.includes('mtech') || edu2.includes('mba'))) score += 12;
      else score += 8;
    } else if ((edu1.includes('master') || edu1.includes('mtech') || edu1.includes('mba')) &&
               (edu2.includes('master') || edu2.includes('mtech') || edu2.includes('mba'))) {
      score += 15;
    } else if ((edu1.includes('bachelor') || edu1.includes('btech') || edu1.includes('engineering')) &&
               (edu2.includes('bachelor') || edu2.includes('btech') || edu2.includes('engineering'))) {
      score += 12;
    }
  }
  
  // Interests compatibility (25 points)
  maxScore += 25;
  if (user1.profile.interests && user2.profile.interests) {
    const commonInterests = user1.profile.interests.filter(interest =>
      user2.profile.interests.some(i => i.toLowerCase() === interest.toLowerCase())
    );
    const interestScore = Math.min((commonInterests.length / Math.max(user1.profile.interests.length, user2.profile.interests.length)) * 25, 25);
    score += interestScore;
  }
  
  // Religion compatibility (10 points)
  maxScore += 10;
  if (user1.profile.religion && user2.profile.religion) {
    if (user1.profile.religion.toLowerCase() === user2.profile.religion.toLowerCase()) {
      score += 10;
    }
  }
  
  // Profession compatibility (15 points)
  maxScore += 15;
  if (user1.profile.profession && user2.profile.profession) {
    const prof1 = user1.profile.profession.toLowerCase();
    const prof2 = user2.profile.profession.toLowerCase();
    
    // Similar profession categories
    const techFields = ['engineer', 'developer', 'programmer', 'software', 'it', 'computer'];
    const medicalFields = ['doctor', 'nurse', 'medical', 'physician', 'surgeon'];
    const businessFields = ['manager', 'business', 'executive', 'consultant', 'analyst'];
    
    const isUser1Tech = techFields.some(field => prof1.includes(field));
    const isUser2Tech = techFields.some(field => prof2.includes(field));
    const isUser1Medical = medicalFields.some(field => prof1.includes(field));
    const isUser2Medical = medicalFields.some(field => prof2.includes(field));
    const isUser1Business = businessFields.some(field => prof1.includes(field));
    const isUser2Business = businessFields.some(field => prof2.includes(field));
    
    if ((isUser1Tech && isUser2Tech) || (isUser1Medical && isUser2Medical) || (isUser1Business && isUser2Business)) {
      score += 15;
    } else if (prof1.includes(prof2) || prof2.includes(prof1)) {
      score += 10;
    }
  }
  
  return Math.round((score / maxScore) * 100);
};

module.exports = mongoose.model('User', userSchema);
