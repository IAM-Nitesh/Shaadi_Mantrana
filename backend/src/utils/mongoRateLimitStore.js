/**
 * MongoDB-backed store for express-rate-limit.
 * Persists counters across server restarts (Render cold starts).
 */
const RateLimit = require('../models/RateLimit');

class MongoRateLimitStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl_';
    this.windowMs = 15 * 60 * 1000;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  _fullKey(key) {
    return `${this.prefix}${key}`;
  }

  async increment(key) {
    const fullKey = this._fullKey(key);
    const now = Date.now();
    const newResetTime = new Date(now + this.windowMs);

    const existing = await RateLimit.findOne({ key: fullKey }).lean();

    if (!existing || existing.resetTime.getTime() <= now) {
      const doc = await RateLimit.findOneAndUpdate(
        { key: fullKey },
        { $set: { totalHits: 1, resetTime: newResetTime } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return { totalHits: doc.totalHits, resetTime: doc.resetTime };
    }

    const doc = await RateLimit.findOneAndUpdate(
      { key: fullKey },
      { $inc: { totalHits: 1 } },
      { new: true }
    );
    return { totalHits: doc.totalHits, resetTime: doc.resetTime };
  }

  async decrement(key) {
    const fullKey = this._fullKey(key);
    await RateLimit.findOneAndUpdate(
      { key: fullKey, totalHits: { $gt: 0 } },
      { $inc: { totalHits: -1 } }
    );
  }

  async resetKey(key) {
    await RateLimit.deleteOne({ key: this._fullKey(key) });
  }
}

module.exports = MongoRateLimitStore;
