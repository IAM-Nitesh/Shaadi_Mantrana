/* Dev script to insert test DailyLike documents for testing daily limit and unmatch

Usage:
  node insert_test_likes.js <userId> <targetUserId> [count]

Defaults:
  count = 6

This script will connect to the project's MongoDB using existing config and insert 'count' DailyLike docs
for <userId> liking <targetUserId> spaced by 1 second timestamps to avoid unique constraint issues.
*/

const path = require('path');
const mongoose = require('mongoose');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node insert_test_likes.js <userId> <targetUserId> [count]');
    process.exit(1);
  }

  const [userId, targetUserId, countArg] = args;
  const count = parseInt(countArg, 10) || 6;

  // Load project config and models
  const config = require('../src/config');
  const { DailyLike } = require('../src/models');

  const uri = (config && config.DATABASE && config.DATABASE.URI) ? config.DATABASE.URI : (process.env.MONGODB_URI || process.env.MONGODB_TEST_URI);

  if (!uri) {
    console.error('MongoDB URI not found in config or environment');
    process.exit(2);
  }

  console.log('Connecting to MongoDB:', uri.replace(/(?<=:\/\/)[^@]+@/, '***@'));
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  console.log('Connected. Inserting test DailyLike documents...');

  // Insert 'count' entries; ensure each likeDate is unique
  const docs = [];
  const now = new Date();
  // If targetUserId === 'auto', generate distinct random target ids
  let targetIds = [];
  if (String(targetUserId).toLowerCase() === 'auto') {
    for (let i = 0; i < count; i++) {
      targetIds.push(new mongoose.Types.ObjectId().toString());
    }
  } else {
    // If single target provided but count > 1, generate unique targets instead to avoid unique index
    if (count > 1) {
      // Create one provided target plus additional random targets
      targetIds.push(String(targetUserId));
      while (targetIds.length < count) {
        targetIds.push(new mongoose.Types.ObjectId().toString());
      }
    } else {
      targetIds = [String(targetUserId)];
    }
  }

  for (let i = 0; i < count; i++) {
    docs.push({
      userId: String(userId),
      likedProfileId: String(targetIds[i]),
      type: 'like',
      likeDate: new Date(now.getTime() - (count - i) * 1000), // spaced by seconds
    });
  }

  try {
  const res = await DailyLike.insertMany(docs, { ordered: false });
  console.log(`Inserted ${res.length} DailyLike documents`);

  const total = await DailyLike.countDocuments({ userId: String(userId) });
  console.log(`Total DailyLike documents for user ${userId}: ${total}`);
  } catch (err) {
    // If some duplicates or errors, print summary and continue
    console.error('Insert errors (may include duplicates):', err.message || err);
    if (err.result && err.result.insertedCount !== undefined) {
      console.log('Inserted count (partial):', err.result.insertedCount);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected. Done.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
