const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Message = require('../models/Message');
const ChatThread = require('../models/ChatThread');
const Conversation = require('../models/Conversation');

// Protect debug routes with auth to avoid accidental exposure
router.use(authenticateToken);

// Get debug stats for a connection
router.get('/chat/:connectionId/stats', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const messages = await Message.find({ connectionId }).sort({ createdAt: 1 }).lean();
    const thread = await ChatThread.findOne({ connectionId }).lean();
    const conv = await Conversation.findOne({ connectionId }).lean();

    res.status(200).json({
      success: true,
      connectionId,
      messagesCount: messages.length,
      messages: messages.map(m => ({
        _id: m._id,
        sender: m.sender,
        text: m.text,
        status: m.status,
        createdAt: m.createdAt
      })),
      chatThread: thread || null,
      conversation: conv || null
    });
  } catch (error) {
    console.error('Debug stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Migrate existing Message documents for a connection into a single ChatThread
router.post('/chat/:connectionId/migrate', async (req, res) => {
  try {
    const { connectionId } = req.params;

    const messages = await Message.find({ connectionId }).sort({ createdAt: 1 }).lean();
    if (!messages || messages.length === 0) {
      return res.status(200).json({ success: true, message: 'No messages to migrate' });
    }

    // Build subdocuments preserving createdAt
    const subdocs = messages.map(m => ({
      sender: m.sender,
      text: m.text,
      status: m.status || 'sent',
      createdAt: m.createdAt
    }));

    // Determine lastMessageAt as the latest message time
    const lastMessageAt = messages[messages.length - 1].createdAt || new Date();

    // If a thread exists, append; otherwise create new thread with preserved lastMessageAt
    let thread = await ChatThread.findOne({ connectionId });
    if (thread) {
      // Append messages and update lastMessageAt
      await ChatThread.updateOne({ connectionId }, { $push: { messages: { $each: subdocs } }, $set: { lastMessageAt } });
      thread = await ChatThread.findOne({ connectionId }).lean();
    } else {
      // Create new thread and set lastMessageAt to latest message time
      thread = await ChatThread.create({ connectionId, messages: subdocs, lastMessageAt });
    }

    // Remove old Message documents
    await Message.deleteMany({ connectionId });

    res.status(200).json({ success: true, migrated: subdocs.length, chatThread: thread });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

