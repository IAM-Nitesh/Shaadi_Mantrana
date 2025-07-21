// Invitation Model - MongoDB Schema
const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  // Invitation Management
  invitationCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 8,
    maxlength: 12
  },
  
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'opened', 'accepted', 'expired', 'cancelled'],
    default: 'pending'
  },
  
  type: {
    type: String,
    enum: ['email', 'referral', 'admin', 'bulk'],
    default: 'email'
  },
  
  // Sender Information
  sentBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    type: {
      type: String,
      enum: ['admin', 'user', 'system'],
      default: 'system'
    }
  },
  
  // Timing
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  acceptedAt: Date,
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Default expiry: 30 days from creation
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  },
  
  // Tracking
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  
  lastAttemptAt: Date,
  
  failureReason: String,
  
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: String, // 'web', 'mobile', 'admin'
    campaign: String,
    batch: String
  },
  
  // Email Service Response
  emailService: {
    provider: String, // 'sendgrid', 'gmail', 'ses'
    messageId: String,
    response: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
invitationSchema.index({ email: 1 });
invitationSchema.index({ invitationCode: 1 });
invitationSchema.index({ status: 1 });
invitationSchema.index({ expiresAt: 1 });
invitationSchema.index({ 'sentBy.userId': 1 });
invitationSchema.index({ createdAt: -1 });
invitationSchema.index({ sentAt: -1 });

// Compound indexes
invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ status: 1, expiresAt: 1 });

// Virtual for checking if invitation is expired
invitationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual for checking if invitation is valid
invitationSchema.virtual('isValid').get(function() {
  return this.status === 'sent' && !this.isExpired;
});

// Virtual for days until expiry
invitationSchema.virtual('daysUntilExpiry').get(function() {
  if (this.isExpired) return 0;
  const diffTime = this.expiresAt - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to handle status changes
invitationSchema.pre('save', function(next) {
  // Set timestamps based on status changes
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case 'sent':
        if (!this.sentAt) this.sentAt = now;
        break;
      case 'delivered':
        if (!this.deliveredAt) this.deliveredAt = now;
        break;
      case 'opened':
        if (!this.openedAt) this.openedAt = now;
        break;
      case 'accepted':
        if (!this.acceptedAt) this.acceptedAt = now;
        break;
    }
  }
  
  // Update last attempt timestamp
  if (this.isModified('attempts')) {
    this.lastAttemptAt = new Date();
  }
  
  next();
});

// Static method to find pending invitations
invitationSchema.statics.findPending = function(limit = 100) {
  return this.find({
    status: 'pending',
    attempts: { $lt: 5 },
    expiresAt: { $gt: new Date() }
  })
  .sort({ createdAt: 1 })
  .limit(limit);
};

// Static method to find expired invitations
invitationSchema.statics.findExpired = function() {
  return this.find({
    status: { $nin: ['accepted', 'expired', 'cancelled'] },
    expiresAt: { $lt: new Date() }
  });
};

// Static method to get invitation statistics
invitationSchema.statics.getStats = function(dateRange = {}) {
  const pipeline = [];
  
  // Add date filter if provided
  if (dateRange.start || dateRange.end) {
    const dateFilter = {};
    if (dateRange.start) dateFilter.$gte = dateRange.start;
    if (dateRange.end) dateFilter.$lte = dateRange.end;
    pipeline.push({ $match: { createdAt: dateFilter } });
  }
  
  // Group by status and count
  pipeline.push({
    $group: {
      _id: '$status',
      count: { $sum: 1 },
      emails: { $addToSet: '$email' }
    }
  });
  
  // Add total unique emails count
  pipeline.push({
    $group: {
      _id: null,
      statuses: {
        $push: {
          status: '$_id',
          count: '$count',
          uniqueEmails: { $size: '$emails' }
        }
      },
      totalInvitations: { $sum: '$count' }
    }
  });
  
  return this.aggregate(pipeline);
};

// Instance method to mark as opened
invitationSchema.methods.markAsOpened = function(metadata = {}) {
  this.status = 'opened';
  this.openedAt = new Date();
  if (metadata.ipAddress) this.metadata.ipAddress = metadata.ipAddress;
  if (metadata.userAgent) this.metadata.userAgent = metadata.userAgent;
  return this.save();
};

// Instance method to mark as accepted
invitationSchema.methods.markAsAccepted = function() {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  return this.save();
};

// Instance method to increment attempt count
invitationSchema.methods.incrementAttempt = function(failureReason = null) {
  this.attempts += 1;
  this.lastAttemptAt = new Date();
  if (failureReason) {
    this.failureReason = failureReason;
  }
  
  // Mark as cancelled if max attempts reached
  if (this.attempts >= 5) {
    this.status = 'cancelled';
  }
  
  return this.save();
};

module.exports = mongoose.model('Invitation', invitationSchema);
