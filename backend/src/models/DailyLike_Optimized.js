// Optimized Daily Like Model - MongoDB Schema
const mongoose = require('mongoose');

const dailyLikeSchema = new mongoose.Schema({
  // User who liked
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Profile that was liked
  likedProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Date of the like (for daily tracking)
  likeDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Like type
  type: {
    type: String,
    enum: ['like', 'super_like'],
    default: 'like'
  },
  
  // Whether this led to a mutual match
  isMutualMatch: {
    type: Boolean,
    default: false
  }
  
  // OPTIMIZED: Removed redundant createdAt field (timestamps provides this)
}, {
  timestamps: true
});

// Indexes for performance
dailyLikeSchema.index({ userId: 1, likeDate: 1 });
dailyLikeSchema.index({ likedProfileId: 1 });
dailyLikeSchema.index({ userId: 1, likedProfileId: 1 }, { unique: true });
dailyLikeSchema.index({ likeDate: 1 });

// OPTIMIZED: Add TTL index for old daily likes (90 days)
dailyLikeSchema.index({ likeDate: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to get daily like count for a user
dailyLikeSchema.statics.getDailyLikeCount = function(userId, date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.countDocuments({
    userId,
    likeDate: { $gte: startOfDay, $lte: endOfDay }
  });
};

// Static method to check if user can like today
dailyLikeSchema.statics.canLikeToday = function(userId, date = new Date()) {
  return this.getDailyLikeCount(userId, date).then(count => count < 5);
};

// Static method to get liked profiles for a user
dailyLikeSchema.statics.getLikedProfiles = function(userId) {
  return this.find({ userId })
    .populate('likedProfileId', 'profile.name profile.age profile.profession profile.images profile.about profile.education profile.interests profile.location verification.isVerified')
    .sort({ createdAt: -1 });
};

// Static method to check if mutual match exists
dailyLikeSchema.statics.checkMutualMatch = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { userId: userId1, likedProfileId: userId2 },
      { userId: userId2, likedProfileId: userId1 }
    ]
  });
};

// OPTIMIZED: Method to get user's like statistics
dailyLikeSchema.statics.getUserLikeStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$likeDate" }
        },
        dailyCount: { $sum: 1 },
        superLikes: {
          $sum: { $cond: [{ $eq: ["$type", "super_like"] }, 1, 0] }
        },
        mutualMatches: {
          $sum: { $cond: [{ $eq: ["$isMutualMatch", true] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: -1 } },
    { $limit: 30 } // Last 30 days
  ]);
};

// OPTIMIZED: Method to get recent likes for a user
dailyLikeSchema.statics.getRecentLikes = function(userId, limit = 20) {
  return this.find({ userId })
    .populate('likedProfileId', 'profile.name profile.age profile.profession profile.images verification.isVerified')
    .sort({ likeDate: -1 })
    .limit(limit);
};

module.exports = mongoose.model('DailyLike', dailyLikeSchema); 