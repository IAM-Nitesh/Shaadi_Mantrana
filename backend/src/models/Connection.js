// Connection/Match Model - MongoDB Schema
const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  // Users involved in the connection
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Connection status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked', 'expired'],
    default: 'pending'
  },
  
  // Who initiated the connection
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Connection type
  type: {
    type: String,
    enum: ['like', 'super_like', 'interest', 'match'],
    default: 'like'
  },
  
  // Timestamps for status changes
  timestamps: {
    initiated: {
      type: Date,
      default: Date.now
    },
    responded: Date,
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  
  // Expiry for pending connections
  expiresAt: {
    type: Date,
    default: function() {
      // Pending connections expire after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  
  // Match compatibility score (if applicable)
  compatibility: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    factors: {
      age: Number,
      location: Number,
      profession: Number,
      education: Number,
      interests: Number
    }
  },
  
  // Connection metadata
  metadata: {
    source: {
      type: String,
      enum: ['discovery', 'search', 'recommendation', 'mutual_friend'],
      default: 'discovery'
    },
    platform: {
      type: String,
      enum: ['web', 'mobile', 'desktop'],
      default: 'web'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
connectionSchema.index({ users: 1 });
connectionSchema.index({ initiatedBy: 1 });
connectionSchema.index({ status: 1 });
connectionSchema.index({ type: 1 });
connectionSchema.index({ expiresAt: 1 });
connectionSchema.index({ 'timestamps.initiated': -1 });
connectionSchema.index({ 'timestamps.lastActivity': -1 });

// Compound indexes
connectionSchema.index({ users: 1, status: 1 });
connectionSchema.index({ initiatedBy: 1, status: 1 });
connectionSchema.index({ status: 1, expiresAt: 1 });

// Ensure users array has exactly 2 users
connectionSchema.pre('validate', function(next) {
  if (this.users.length !== 2) {
    return next(new Error('Connection must have exactly 2 users'));
  }
  
  // Ensure users are different
  if (this.users[0].toString() === this.users[1].toString()) {
    return next(new Error('Connection cannot be between the same user'));
  }
  
  // Ensure initiatedBy is one of the users
  if (!this.users.some(userId => userId.toString() === this.initiatedBy.toString())) {
    return next(new Error('Connection must be initiated by one of the users'));
  }
  
  next();
});

// Pre-save middleware to handle status changes
connectionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    // Set responded timestamp when status changes from pending
    if (this.status !== 'pending' && !this.timestamps.responded) {
      this.timestamps.responded = now;
    }
    
    // Update last activity
    this.timestamps.lastActivity = now;
  }
  
  next();
});

// Virtual to check if connection is expired
connectionSchema.virtual('isExpired').get(function() {
  return this.status === 'pending' && this.expiresAt < new Date();
});

// Virtual to get the other user in the connection
connectionSchema.virtual('getOtherUser').get(function() {
  return function(currentUserId) {
    return this.users.find(userId => userId.toString() !== currentUserId.toString());
  }.bind(this);
});

// Virtual to check if it's a mutual match
connectionSchema.virtual('isMutualMatch').get(function() {
  return this.status === 'accepted' && this.type === 'like';
});

// Static method to find user connections
connectionSchema.statics.findUserConnections = function(userId, status = null) {
  const query = { users: userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('users', 'profile.name profile.age profile.profession profile.images verification.isVerified')
    .sort({ 'timestamps.lastActivity': -1 });
};

// Static method to check if connection exists between users
connectionSchema.statics.existsBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    users: { $all: [userId1, userId2] },
    status: { $ne: 'declined' }
  });
};

// Static method to find mutual matches
connectionSchema.statics.findMutualMatches = function(userId) {
  return this.find({
    users: userId,
    status: 'accepted',
    type: 'like'
  })
  .populate('users', 'profile.name profile.age profile.profession profile.images verification.isVerified')
  .sort({ 'timestamps.responded': -1 });
};

// Static method to find pending connections for a user
connectionSchema.statics.findPendingForUser = function(userId) {
  return this.find({
    users: userId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  })
  .populate('users', 'profile.name profile.age profile.profession profile.images verification.isVerified')
  .populate('initiatedBy', 'profile.name profile.age profile.profession')
  .sort({ 'timestamps.initiated': -1 });
};

// Static method to get connection statistics for a user
connectionSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { users: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        statuses: {
          $push: {
            status: '$_id',
            count: '$count'
          }
        },
        totalConnections: { $sum: '$count' }
      }
    }
  ]);
};

// Instance method to accept connection
connectionSchema.methods.accept = function() {
  if (this.status !== 'pending') {
    throw new Error('Only pending connections can be accepted');
  }
  
  this.status = 'accepted';
  this.timestamps.responded = new Date();
  this.timestamps.lastActivity = new Date();
  
  return this.save();
};

// Instance method to decline connection
connectionSchema.methods.decline = function() {
  if (this.status !== 'pending') {
    throw new Error('Only pending connections can be declined');
  }
  
  this.status = 'declined';
  this.timestamps.responded = new Date();
  this.timestamps.lastActivity = new Date();
  
  return this.save();
};

// Instance method to block connection
connectionSchema.methods.block = function() {
  this.status = 'blocked';
  this.timestamps.lastActivity = new Date();
  
  return this.save();
};

module.exports = mongoose.model('Connection', connectionSchema);
