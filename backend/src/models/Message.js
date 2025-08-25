// Message Model - MongoDB Schema for individual messages
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'emoji'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sending'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    fileUrl: String,
    fileSize: Number,
    fileType: String,
    thumbnailUrl: String
  }
}, {
  timestamps: true
});

// Indexes for performance
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ type: 1 });

// Compound indexes
messageSchema.index({ conversationId: 1, status: 1 });
messageSchema.index({ conversationId: 1, senderId: 1 });

// TTL index to expire messages after 12 hours (43200 seconds)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 43200 });

// Pre-save middleware to validate content
messageSchema.pre('save', function(next) {
  if (!this.content || this.content.trim().length === 0) {
    return next(new Error('Message content cannot be empty'));
  }
  
  if (this.content.length > 1000) {
    return next(new Error('Message content cannot exceed 1000 characters'));
  }
  
  next();
});

// Virtual to check if message is from today
messageSchema.virtual('isFromToday').get(function() {
  const today = new Date();
  const messageDate = new Date(this.timestamp);
  return messageDate.toDateString() === today.toDateString();
});

// Static method to get messages for a conversation
messageSchema.statics.getConversationMessages = function(conversationId, limit = 50, skip = 0) {
  return this.find({ conversationId })
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .populate('senderId', 'profile.name profile.images')
    .populate('readBy.userId', 'profile.name profile.images');
};

// Static method to get unread messages for a user
messageSchema.statics.getUnreadMessages = function(conversationId, userId) {
  return this.find({
    conversationId,
    senderId: { $ne: userId },
    status: { $ne: 'read' }
  }).sort({ timestamp: 1 });
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(conversationId, userId) {
  const now = new Date();
  
  return this.updateMany(
    {
      conversationId,
      senderId: { $ne: userId },
      status: { $in: ['sent', 'delivered'] }
    },
    {
      $set: { status: 'read' },
      $push: { readBy: { userId, readAt: now } }
    }
  );
};

// Static method to get message statistics
messageSchema.statics.getMessageStats = function(conversationId) {
  return this.aggregate([
    { $match: { conversationId: new mongoose.Types.ObjectId(conversationId) } },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        textMessages: { $sum: { $cond: [{ $eq: ['$type', 'text'] }, 1, 0] } },
        imageMessages: { $sum: { $cond: [{ $eq: ['$type', 'image'] }, 1, 0] } },
        fileMessages: { $sum: { $cond: [{ $eq: ['$type', 'file'] }, 1, 0] } },
        unreadMessages: { $sum: { $cond: [{ $ne: ['$status', 'read'] }, 1, 0] } }
      }
    }
  ]);
};

// Instance method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  if (this.status !== 'read') {
    this.status = 'read';
    this.readBy.push({
      userId: userId,
      readAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to update status
messageSchema.methods.updateStatus = function(status) {
  this.status = status;
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema); 