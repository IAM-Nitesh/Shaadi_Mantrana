const mongoose = require('mongoose');

const messageSubSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  status: { type: String, enum: ['sending','sent','delivered','read','failed'], default: 'sent' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });


const chatThreadSchema = new mongoose.Schema({
  connectionId: { type: String, required: true, index: true },
  messages: { type: [messageSubSchema], default: [] },
  // Track last message time for sliding TTL
  lastMessageAt: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// TTL: expire thread document 12 hours after lastMessageAt (sliding TTL)
chatThreadSchema.index({ lastMessageAt: 1 }, { expireAfterSeconds: 12 * 60 * 60 });

// Append a message to the existing thread or create a new thread document
chatThreadSchema.statics.appendMessage = async function(connectionId, msgObj, options = {}) {
  // msgObj should be { sender, text, status, createdAt }
  const now = msgObj.createdAt || new Date();
  const update = {
    $push: { messages: msgObj },
    $set: { lastMessageAt: now },
    $setOnInsert: { connectionId }
  };

  const opts = Object.assign({ new: true, upsert: true, setDefaultsOnInsert: true }, options);
  const thread = await this.findOneAndUpdate({ connectionId }, update, opts).exec();

  // Return the last pushed message subdocument and the thread
  const lastMsg = thread.messages && thread.messages.length ? thread.messages[thread.messages.length - 1] : null;
  return { thread, message: lastMsg };
};

chatThreadSchema.statics.getByConnection = async function(connectionId, limit = 100) {
  const doc = await this.findOne({ connectionId }).lean();
  if (!doc) return [];
  // Return up to `limit` messages (most recent at end)
  const msgs = doc.messages || [];
  return msgs.slice(-limit).map(m => ({
    _id: m._id,
    connectionId: connectionId,
    sender: m.sender,
    text: m.text,
    status: m.status,
    createdAt: m.createdAt,
  }));
};

module.exports = mongoose.model('ChatThread', chatThreadSchema);
