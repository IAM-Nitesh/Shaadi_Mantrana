const mongoose = require('mongoose');

const chatThreadSchema = new mongoose.Schema({
  connectionId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// connectionId is already indexed via 'unique: true' in the schema definition

// Static method to get messages for a connection
chatThreadSchema.statics.getByConnection = async function(connectionId, limit = 50) {
  const thread = await this.findOne({ connectionId });
  if (!thread) return [];
  
  // Return last N messages
  return thread.messages.slice(-limit);
};

// Static method to append a message
chatThreadSchema.statics.appendMessage = async function(connectionId, messageData, options = {}) {
  const { session, new: isNew, upsert = true } = options;
  
  const update = {
    $push: { messages: messageData },
    $set: { lastMessageAt: new Date() }
  };
  
  const thread = await this.findOneAndUpdate(
    { connectionId },
    update,
    { 
      new: true, 
      upsert,
      session
    }
  );
  
  return {
    thread,
    message: thread.messages[thread.messages.length - 1]
  };
};

module.exports = mongoose.model('ChatThread', chatThreadSchema);
