// Usage: node migrate-single-connection.js <connectionId>
const databaseService = require('../src/services/databaseService');
const Message = require('../src/models/Message');
const ChatThread = require('../src/models/ChatThread');

async function migrate(connectionId) {
  try {
    await databaseService.connect();

    console.log('Fetching messages for', connectionId);
    const messages = await Message.find({ connectionId }).sort({ createdAt: 1 }).lean();
    console.log(`Found ${messages.length} messages`);

    if (messages.length === 0) {
      console.log('No messages to migrate');
      process.exit(0);
    }

    const subdocs = messages.map(m => ({ sender: m.sender, text: m.text, status: m.status || 'sent', createdAt: m.createdAt }));
    const lastMessageAt = messages[messages.length -1].createdAt || new Date();

    let thread = await ChatThread.findOne({ connectionId });
    if (thread) {
      console.log('Appending messages to existing thread');
      await ChatThread.updateOne({ connectionId }, { $push: { messages: { $each: subdocs } }, $set: { lastMessageAt } });
      thread = await ChatThread.findOne({ connectionId }).lean();
    } else {
      console.log('Creating new thread');
      thread = await ChatThread.create({ connectionId, messages: subdocs, lastMessageAt });
    }

    // Remove legacy Message documents
    const del = await Message.deleteMany({ connectionId });
    console.log(`Deleted ${del.deletedCount} legacy Message docs`);

    console.log('Migration complete. Thread id:', thread._id.toString());
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(2);
  }
}

const connectionId = process.argv[2];
if (!connectionId) {
  console.error('Usage: node migrate-single-connection.js <connectionId>');
  process.exit(1);
}

migrate(connectionId);
