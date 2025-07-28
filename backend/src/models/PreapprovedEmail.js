const mongoose = require('mongoose');

const preapprovedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  uuid: {
    type: String,
    required: true,
    unique: true
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  approvedByAdmin: {
    type: Boolean,
    default: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Additional fields for better tracking
  status: {
    type: String,
    enum: ['active', 'paused', 'expired'],
    default: 'active'
  },
  lastLoginAt: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better query performance
preapprovedEmailSchema.index({ email: 1 });
preapprovedEmailSchema.index({ uuid: 1 });
preapprovedEmailSchema.index({ approvedByAdmin: 1 });
preapprovedEmailSchema.index({ status: 1 });
preapprovedEmailSchema.index({ addedAt: -1 });

// Static method to get active preapproved emails
preapprovedEmailSchema.statics.getActiveEmails = function() {
  return this.find({ 
    approvedByAdmin: true, 
    status: 'active' 
  });
};

// Static method to get paused emails
preapprovedEmailSchema.statics.getPausedEmails = function() {
  return this.find({ 
    approvedByAdmin: false, 
    status: 'active' 
  });
};

module.exports = mongoose.model('PreapprovedEmail', preapprovedEmailSchema); 