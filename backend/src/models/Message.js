// Message Model - MongoDB Schema for chat messages
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  connectionId: {
    type: String,
    required: true,
    index: true
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Keep messages for 24 hours (TTL index)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

messageSchema.statics.getByConnection = function(connectionId, limit = 100) {
  return this.find({ connectionId }).sort({ createdAt: 1 }).limit(limit).lean();
};

module.exports = mongoose.model('Message', messageSchema);