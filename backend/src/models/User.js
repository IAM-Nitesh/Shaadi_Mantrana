// User Model - MongoDB Schema (Optimized)
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  // Unique User Identifier
  userUuid: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },
  
  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  // Profile Information
  profile: {
    // Basic Information
    name: {
      type: String,
      required: false,
      trim: true,
      maxlength: 50
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: false
    },
    nativePlace: {
      type: String,
      trim: true,
      maxlength: 30
    },
    currentResidence: {
      type: String,
      trim: true,
      maxlength: 30
    },
    maritalStatus: {
      type: String,
      enum: ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'],
      required: false
    },
    manglik: {
      type: String,
      enum: ['Yes', 'No', 'Don\'t Know'],
      required: false
    },
    
    // Birth Details
    dateOfBirth: {
      type: String,
      trim: true
    },
    timeOfBirth: {
      type: String,
      trim: true
    },
    placeOfBirth: {
      type: String,
      trim: true,
      maxlength: 30
    },
    
    // Physical Details
    height: {
      type: String,
      trim: true,
      maxlength: 10
    },
    weight: {
      type: String,
      trim: true,
      maxlength: 10
    },
    complexion: {
      type: String,
      enum: ['Fair', 'Medium', 'Dark'],
      required: false
    },
    
    // Professional Details
    education: {
      type: String,
      trim: true,
      maxlength: 50
    },
    occupation: {
      type: String,
      trim: true,
      maxlength: 40
    },
    annualIncome: {
      type: String,
      trim: true,
      maxlength: 15
    },
    
    // Lifestyle Details
    eatingHabit: {
      type: String,
      enum: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'],
      required: false
    },
    smokingHabit: {
      type: String,
      enum: ['Yes', 'No', 'Occasionally'],
      required: false
    },
    drinkingHabit: {
      type: String,
      enum: ['Yes', 'No', 'Occasionally'],
      required: false
    },
    
    // Family Details
    father: {
      type: String,
      trim: true,
      maxlength: 40
    },
    mother: {
      type: String,
      trim: true,
      maxlength: 40
    },
    brothers: {
      type: String,
      trim: true,
      maxlength: 2
    },
    sisters: {
      type: String,
      trim: true,
      maxlength: 2
    },
    
    // Gotra Details
    fatherGotra: {
      type: String,
      trim: true,
      maxlength: 20
    },
    motherGotra: {
      type: String,
      trim: true,
      maxlength: 20
    },
    grandfatherGotra: {
      type: String,
      trim: true,
      maxlength: 20
    },
    grandmotherGotra: {
      type: String,
      trim: true,
      maxlength: 20
    },
    
    // Preferences
    specificRequirements: {
      type: String,
      trim: true,
      maxlength: 200
    },
    settleAbroad: {
      type: String,
      enum: ['Yes', 'No', 'Maybe'],
      required: false
    },
    about: {
      type: String,
      trim: true,
      maxlength: 500
    },
    
    // Interests and Images
    interests: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    images: {
      type: mongoose.Schema.Types.Mixed, // Allow both string and array
      validate: {
        validator: function(value) {
          // Allow string, array, or null/undefined
          if (value === null || value === undefined) return true;
          if (typeof value === 'string') return true;
          if (Array.isArray(value)) return true;
          return false;
        },
        message: 'Images must be a string, array, or null'
      }
    },
    
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

  // Role
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },

  // Status and Settings
  status: {
    type: String,
    enum: ['invited', 'active', 'paused'],
    default: 'invited'
  },
  
  // Admin approval tracking
  isApprovedByAdmin: {
    type: Boolean,
    default: true
  },
  
  // Admin tracking fields
  addedAt: {
    type: Date,
    default: Date.now
  },
  
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  premium: {
    type: Boolean,
    default: false
  },

  // Activity Tracking - OPTIMIZED: Single lastLogin instead of array
  lastActive: {
    type: Date,
    default: Date.now
  },
  
  // OPTIMIZED: Replace loginHistory array with single lastLogin object
  lastLogin: {
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    deviceType: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet'],
      default: 'desktop'
    }
  },
  
  // Profile completion tracking
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  
  // Onboarding message tracking
  hasSeenOnboardingMessage: {
    type: Boolean,
    default: false
  },
  
  profileCompleted: {
    type: Boolean,
    default: false
  },

  // OPTIMIZED: Preferences structure - only store user's actual preferences
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
    // OPTIMIZED: Only store user's selected locations, not all possible states
    locations: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    // OPTIMIZED: Only store user's selected professions
    professions: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    // OPTIMIZED: Only store user's selected education levels
    education: [{
      type: String,
      trim: true,
      maxlength: 50
    }]
  }

}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ 'profile.gender': 1 });
userSchema.index({ 'profile.maritalStatus': 1 });
userSchema.index({ 'profile.currentResidence': 1 });
userSchema.index({ status: 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'lastLogin.timestamp': -1 });

// Virtual for profile completion calculation (legacy - use profileCompleteness instead)
userSchema.virtual('profileCompletion').get(function() {
  // Use the actual profileCompleteness field if available, otherwise calculate
  if (this.profile && this.profile.profileCompleteness !== undefined) {
    return this.profile.profileCompleteness;
  }
  
  let completion = 0;
  const requiredFields = [
    'name', 'gender', 'dateOfBirth', 'height', 'weight', 'complexion',
    'education', 'occupation', 'annualIncome', 'nativePlace', 'currentResidence',
    'maritalStatus', 'father', 'mother', 'about'
  ];
  
  requiredFields.forEach(field => {
    if (this.profile[field] && this.profile[field].toString().trim() !== '') {
      completion += 6.67; // 100/15 fields
    }
  });
  
  if (this.profile.interests && this.profile.interests.length > 0) completion += 5;
  if (this.profile.images && this.profile.images.length > 0) completion += 5;
  
  return Math.round(Math.min(completion, 100));
});

// Virtual for age calculation
userSchema.virtual('calculatedAge').get(function() {
  if (!this.profile.dateOfBirth) return null;
  
  const birthDate = new Date(this.profile.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Pre-save middleware to update profile completeness
userSchema.pre('save', function(next) {
  const calculatedCompletion = this.profileCompletion;
  this.profile.profileCompleteness = Math.min(calculatedCompletion, 100);
  next();
});

// Method to sanitize user data for public viewing
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  
  // Remove sensitive information
  delete user.__v;
  delete user.lastLogin; // OPTIMIZED: Remove lastLogin from public view
  
  return {
    userId: user._id,
    email: user.email,
    userUuid: user.userUuid,
    role: user.role,
    profile: user.profile,
    preferences: user.preferences,
    verification: user.verification,
    status: user.status,
    premium: user.premium,
    lastActive: user.lastActive,
    createdAt: user.createdAt,
    // Add fields needed for frontend authentication
    isFirstLogin: user.isFirstLogin,
    isApprovedByAdmin: user.isApprovedByAdmin,
    profileCompleteness: user.profile?.profileCompleteness || 0,
    hasSeenOnboardingMessage: user.hasSeenOnboardingMessage,
  };
};

// Static method to find users with filters
userSchema.statics.findWithFilters = function(filters = {}) {
  const query = { status: 'active' };
  
  if (filters.ageMin || filters.ageMax) {
    // OPTIMIZED: Use calculated age instead of stored age
    query['profile.dateOfBirth'] = { $exists: true };
  }
  
  if (filters.location) {
    query['profile.currentResidence'] = new RegExp(filters.location, 'i');
  }
  
  if (filters.occupation) {
    query['profile.occupation'] = new RegExp(filters.occupation, 'i');
  }
  
  if (filters.verified !== undefined) {
    query['verification.isVerified'] = filters.verified;
  }
  
  if (filters.premium !== undefined) {
    query.premium = filters.premium;
  }
  
  return this.find(query);
};

// OPTIMIZED: Method to update last login (replaces loginHistory array)
userSchema.methods.updateLastLogin = function(ipAddress, userAgent, deviceType = 'desktop') {
  this.lastLogin = {
    timestamp: new Date(),
    ipAddress,
    userAgent,
    deviceType
  };
  this.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema); 