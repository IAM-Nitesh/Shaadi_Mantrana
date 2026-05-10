// Optimized Invitation Model - MongoDB Schema
const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  uuid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  invitationId: {
    type: String,
    required: true
  },
  sentDate: {
    type: Date,
    default: Date.now
  },
  count: {
    type: Number,
    default: 1
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed', 'opened'],
    default: 'sent'
  },
  
  // OPTIMIZED: Replace history array with single lastStatus object
  lastStatus: {
    sentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'opened'],
      default: 'sent'
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
invitationSchema.index({ email: 1 });
invitationSchema.index({ uuid: 1 });
invitationSchema.index({ sentDate: -1 });
invitationSchema.index({ status: 1 });

// OPTIMIZED: Add TTL index for old invitations (1 year)
invitationSchema.index({ sentDate: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// OPTIMIZED: Method to update invitation status (replaces history array)
invitationSchema.methods.updateStatus = function(status, sentBy = null) {
  this.status = status;
  this.lastStatus = {
    sentDate: new Date(),
    status,
    sentBy: sentBy || this.lastStatus?.sentBy
  };
  this.count += 1;
  return this.save();
};

// OPTIMIZED: Method to get invitation statistics
invitationSchema.statics.getInvitationStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalSent: { $sum: '$count' }
      }
    },
    {
      $group: {
        _id: null,
        statuses: {
          $push: {
            status: '$_id',
            count: '$count',
            totalSent: '$totalSent'
          }
        },
        totalInvitations: { $sum: '$count' },
        totalSent: { $sum: '$totalSent' }
      }
    }
  ]);
};

// OPTIMIZED: Method to get recent invitations
invitationSchema.statics.getRecentInvitations = function(limit = 10) {
  return this.find()
    .populate('sentBy', 'profile.name email')
    .sort({ sentDate: -1 })
    .limit(limit);
};

// OPTIMIZED: Method to check if email has been invited recently
invitationSchema.statics.hasRecentInvitation = function(email, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.findOne({
    email: email.toLowerCase(),
    sentDate: { $gte: cutoffDate }
  });
};

module.exports = mongoose.model('Invitation', invitationSchema); 