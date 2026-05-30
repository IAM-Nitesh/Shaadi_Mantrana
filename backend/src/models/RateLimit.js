const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  totalHits: { type: Number, default: 0 },
  resetTime: { type: Date, required: true },
});

// Auto-expire records once their window ends
rateLimitSchema.index({ resetTime: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.RateLimit || mongoose.model('RateLimit', rateLimitSchema);
