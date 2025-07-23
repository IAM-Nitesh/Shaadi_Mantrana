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
    name: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100
    },
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
    education: {
      type: String,
      trim: true,
      maxlength: 200
    },
    about: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    interests: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    images: [{
      type: String,
      trim: true,
      maxlength: 500
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
  }
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

// Virtual for profile completion calculation
userSchema.virtual('profileCompletion').get(function() {
  let completion = 0;
  const fields = ['name', 'age', 'profession', 'location', 'education', 'about'];
  
  fields.forEach(field => {
    if (this.profile[field]) completion += 16.67; // 100/6 fields
  });
  
  if (this.profile.interests && this.profile.interests.length > 0) completion += 10;
  if (this.profile.images && this.profile.images.length > 0) completion += 10;
  
  return Math.round(completion);
});

// Pre-save middleware to update profile completeness
userSchema.pre('save', function(next) {
  this.profile.profileCompleteness = this.profileCompletion;
  next();
});

// Method to sanitize user data for public viewing
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  
  // Remove sensitive information
  delete user.__v;
  delete user.loginHistory;
  
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
    createdAt: user.createdAt
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
