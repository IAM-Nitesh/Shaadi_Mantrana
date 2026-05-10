// Match Model - MongoDB Schema for tracking likes and matches
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  // User who performed the swipe action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // User who was swiped on
  likedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Type of swipe action
  action: {
    type: String,
    enum: ['like', 'super_like', 'pass'],
    default: 'like'
  },
  
  // Whether this resulted in a mutual match
  isMatch: {
    type: Boolean,
    default: false
  },
  
  // Timestamp of the swipe action
  swipedAt: {
    type: Date,
    default: Date.now
  },
  
  // Match timestamp (when both users liked each other)
  matchedAt: {
    type: Date
  },
  
  // Compatibility score (if calculated)
  compatibilityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Metadata about the swipe
  metadata: {
    source: {
      type: String,
      enum: ['discovery', 'search', 'recommendation'],
      default: 'discovery'
    },
    platform: {
      type: String,
      enum: ['web', 'mobile', 'desktop'],
      default: 'web'
    },
    location: {
      type: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
matchSchema.index({ userId: 1 });
matchSchema.index({ likedUserId: 1 });
matchSchema.index({ action: 1 });
matchSchema.index({ isMatch: 1 });
matchSchema.index({ swipedAt: -1 });
matchSchema.index({ matchedAt: -1 });

// Compound indexes
matchSchema.index({ userId: 1, likedUserId: 1 }, { unique: true });
matchSchema.index({ userId: 1, action: 1 });
matchSchema.index({ userId: 1, isMatch: 1 });

// Virtual for getting the other user in a match
matchSchema.virtual('otherUser', {
  ref: 'User',
  localField: 'likedUserId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to check for mutual matches
matchSchema.pre('save', async function(next) {
  if (this.action === 'like' || this.action === 'super_like') {
    // Check if the other user has also liked this user
    const mutualMatch = await this.constructor.findOne({
      userId: this.likedUserId,
      likedUserId: this.userId,
      action: { $in: ['like', 'super_like'] }
    });
    
    if (mutualMatch) {
      // It's a match!
      this.isMatch = true;
      this.matchedAt = new Date();
      
      // Update the other match record as well
      mutualMatch.isMatch = true;
      mutualMatch.matchedAt = new Date();
      await mutualMatch.save();
    }
  }
  next();
});

// Static method to get all matches for a user
matchSchema.statics.getMatches = function(userId) {
  return this.find({
    userId: userId,
    isMatch: true
  }).populate('likedUserId', 'profile.name profile.firstName profile.lastName profile.photos profile.location');
};

// Static method to get all likes for a user
matchSchema.statics.getLikes = function(userId) {
  return this.find({
    userId: userId,
    action: { $in: ['like', 'super_like'] }
  }).populate('likedUserId', 'profile.name profile.firstName profile.lastName profile.photos profile.location');
};

// Static method to get all users who liked this user
matchSchema.statics.getLikedBy = function(userId) {
  return this.find({
    likedUserId: userId,
    action: { $in: ['like', 'super_like'] }
  }).populate('userId', 'profile.name profile.firstName profile.lastName profile.photos profile.location');
};

module.exports = mongoose.model('Match', matchSchema); 