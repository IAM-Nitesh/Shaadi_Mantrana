// Conversation Model - MongoDB Schema for chat conversations
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Connection ID that this conversation belongs to
  connectionId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Participants in the conversation
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Message count for quick access
  messageCount: {
    type: Number,
    default: 0
  },
  
  // Last message timestamp
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  
  // Conversation status
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  },
  
  // Metadata about the conversation
  metadata: {
    source: {
      type: String,
      enum: ['match', 'invitation', 'manual'],
      default: 'match'
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
conversationSchema.index({ connectionId: 1 }, { unique: true });
conversationSchema.index({ participants: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ messageCount: -1 });

// Compound indexes
conversationSchema.index({ participants: 1, status: 1 });
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

// TTL index to expire conversations after 12 hours (43200 seconds)
conversationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 43200 });

// Ensure exactly 2 participants
conversationSchema.pre('validate', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('Conversation must have exactly 2 participants'));
  }
  
  // Ensure participants are different
  if (this.participants[0].toString() === this.participants[1].toString()) {
    return next(new Error('Conversation cannot be between the same user'));
  }
  
  next();
});

// Virtual to get the other participant
conversationSchema.virtual('getOtherParticipant').get(function() {
  return function(currentUserId) {
    return this.participants.find(participantId => 
      participantId.toString() !== currentUserId.toString()
    );
  }.bind(this);
});

// Virtual to check if user is participant
conversationSchema.virtual('isParticipant').get(function() {
  return function(userId) {
    return this.participants.some(participantId => 
      participantId.toString() === userId.toString()
    );
  }.bind(this);
});

// Static method to find conversation by connection ID
conversationSchema.statics.findByConnectionId = function(connectionId) {
  return this.findOne({ connectionId })
    .populate('participants', 'profile.name profile.age profile.profession profile.images');
};

// Static method to find user conversations
conversationSchema.statics.findUserConversations = function(userId, status = 'active') {
  const query = { participants: userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('participants', 'profile.name profile.age profile.profession profile.images')
    .sort({ lastMessageAt: -1 });
};

// Static method to create conversation
conversationSchema.statics.createConversation = function(connectionId, participants) {
  return this.create({
    connectionId,
    participants,
    messageCount: 0,
    lastMessageAt: new Date()
  });
};

// Static method to update conversation stats
conversationSchema.statics.updateStats = function(conversationId, messageCount, lastMessageAt) {
  return this.updateOne(
    { _id: conversationId },
    { 
      $set: { 
        messageCount: messageCount,
        lastMessageAt: lastMessageAt
      }
    }
  );
};

// Static method to get conversation statistics for a user
conversationSchema.statics.getUserConversationStats = function(userId) {
  return this.aggregate([
    { $match: { participants: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalMessages: { $sum: '$messageCount' }
      }
    },
    {
      $group: {
        _id: null,
        statuses: {
          $push: {
            status: '$_id',
            count: '$count',
            totalMessages: '$totalMessages'
          }
        },
        totalConversations: { $sum: '$count' },
        totalMessages: { $sum: '$totalMessages' }
      }
    }
  ]);
};

// Instance method to update message count
conversationSchema.methods.updateMessageCount = function(count) {
  this.messageCount = count;
  this.lastMessageAt = new Date();
  return this.save();
};

// Instance method to archive conversation
conversationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Instance method to block conversation
conversationSchema.methods.block = function() {
  this.status = 'blocked';
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema); 