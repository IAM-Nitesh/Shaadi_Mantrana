// Session Model for MongoDB
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userUuid: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    default: 'user'
  },
  verified: {
    type: Boolean,
    default: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 * 30 // 30 days absolute expiry
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  userAgent: String,
  ipAddress: String
});

// Add indexes for performance
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ lastAccessed: 1 }, { expireAfterSeconds: 86400 * 7 }); // Auto-expire after 7 days of inactivity

// Static methods
sessionSchema.statics.findBySessionId = function(sessionId) {
  return this.findOne({ sessionId });
};

sessionSchema.statics.findByUserId = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

sessionSchema.statics.deleteBySessionId = function(sessionId) {
  return this.deleteOne({ sessionId });
};

sessionSchema.statics.deleteByUserId = function(userId) {
  return this.deleteMany({ userId });
};

sessionSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });
};

module.exports = mongoose.model('Session', sessionSchema);
