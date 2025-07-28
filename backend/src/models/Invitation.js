// Invitation Model - MongoDB Schema
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
  history: [{
    sentDate: {
      type: Date,
      default: Date.now
    },
    invitationId: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'opened'],
      default: 'sent'
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
invitationSchema.index({ email: 1 });
invitationSchema.index({ uuid: 1 });
invitationSchema.index({ sentDate: -1 });

module.exports = mongoose.model('Invitation', invitationSchema);
