// User Model - MongoDB Schema
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
      enum: ['Yes', 'No', 'Dont Know', 'Don\'t Know'],
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
      type: String,
      trim: true,
      maxlength: 500
    },
    

    
    // Legacy fields for backward compatibility
    age: {
      type: Number,
      min: 18,
      max: 80
    },
    profession: {
      type: String,
      trim: true,
      maxlength: 100
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200
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
  
  // Admin approval status
  isApprovedByAdmin: {
    type: Boolean,
    default: false
  },
  
  // Admin tracking fields (migrated from PreapprovedEmail)
  addedAt: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],

  // Preferences
  preferences: {
    ageRange: {
      min: {
        type: Number,
        default: 18
      },
      max: {
        type: Number,
        default: 50
      }
    },
    location: [String],
    profession: [String],
    education: [String]
  },



}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ 'profile.age': 1 });
userSchema.index({ 'profile.location': 1 });
userSchema.index({ 'profile.profession': 1 });
userSchema.index({ status: 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ createdAt: -1 });

// Virtual for profile completion calculation (legacy - use profileCompleteness instead)
userSchema.virtual('profileCompletion').get(function() {
  // Use the actual profileCompleteness field if available, otherwise calculate
  if (this.profile && this.profile.profileCompleteness !== undefined) {
    return this.profile.profileCompleteness;
  }
  
  let completion = 0;
  const fields = ['name', 'age', 'profession', 'location', 'education', 'about'];
  
  fields.forEach(field => {
    if (this.profile[field]) completion += 16.67; // 100/6 fields
  });
  
  if (this.profile.interests && this.profile.interests.length > 0) completion += 10;
  if (this.profile.images) completion += 10;
  
  return Math.round(completion);
});

// Virtual for age calculation (alternative approach)
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
  this.profile.profileCompleteness = Math.min(calculatedCompletion, 100); // Cap at 100
  next();
});

// Method to sanitize user data for public viewing
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  
  // Remove sensitive information
  delete user.__v;
  delete user.loginHistory;
  
  return {
    userId: user._id,
    email: user.email,
    userUuid: user.userUuid,
    role: user.role, // Include role for role-based routing
    profile: user.profile,
    preferences: user.preferences,
    verification: user.verification,
    status: user.status,
    premium: user.premium,
    lastActive: user.lastActive,
    createdAt: user.createdAt,
    profileCompleted: user.profileCompleted || false
  };
};

// Static method to find users with filters
userSchema.statics.findWithFilters = function(filters = {}) {
  const query = { status: 'active' };
  
  if (filters.ageMin || filters.ageMax) {
    query['profile.age'] = {};
    if (filters.ageMin) query['profile.age'].$gte = filters.ageMin;
    if (filters.ageMax) query['profile.age'].$lte = filters.ageMax;
  }
  
  if (filters.location) {
    query['profile.location'] = new RegExp(filters.location, 'i');
  }
  
  if (filters.profession) {
    query['profile.profession'] = new RegExp(filters.profession, 'i');
  }
  
  if (filters.verified !== undefined) {
    query['verification.isVerified'] = filters.verified;
  }
  
  if (filters.premium !== undefined) {
    query.premium = filters.premium;
  }
  
  return this.find(query);
};

module.exports = mongoose.model('User', userSchema);
