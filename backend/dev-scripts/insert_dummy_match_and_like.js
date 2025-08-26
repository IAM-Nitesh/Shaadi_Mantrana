/*
Dev script to upsert a Match and a DailyLike for testing.
Usage:
  node insert_dummy_match_and_like.js <userId> <targetUserId>

If IDs aren't provided defaults will be used.
*/

const mongoose = require('mongoose');

async function main() {
  const args = process.argv.slice(2);
  const defaultUser = '688cd9380cb5ed82f8c063cd';
  const defaultTarget = '688cd7d40cb5ed82f8c063b3';
  const userId = args[0] || defaultUser;
  const targetUserId = args[1] || defaultTarget;

  const config = require('../src/config');
  const models = require('../src/models');
  const Match = models.Match;
  const DailyLike = models.DailyLike;

  const uri = (config && config.DATABASE && config.DATABASE.URI) ? config.DATABASE.URI : (process.env.MONGODB_URI || process.env.MONGODB_TEST_URI);
  if (!uri) {
    console.error('MongoDB URI not found in config or environment');
    process.exit(2);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const uId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : new mongoose.Types.ObjectId();
  const tId = mongoose.Types.ObjectId.isValid(targetUserId) ? new mongoose.Types.ObjectId(targetUserId) : new mongoose.Types.ObjectId();

  try {
    // Upsert Match
    const matchDoc = {
      userId: uId,
      likedUserId: tId,
      action: 'like',
      isMatch: true,
      swipedAt: new Date(),
      matchedAt: new Date(),
      compatibilityScore: Math.floor(Math.random() * 100),
      metadata: { source: 'discovery', platform: 'web' }
    };

    const matchRes = await Match.updateOne(
      { userId: uId, likedUserId: tId },
      { $setOnInsert: matchDoc },
      { upsert: true }
    );

    console.log('Match upsert result:', matchRes);

    // Upsert DailyLike (mark mutual)
    const dlDoc = {
      userId: uId,
      likedProfileId: tId,
      type: 'like',
      likeDate: new Date(),
      isMutualMatch: true,
      createdAt: new Date()
    };

    const dlRes = await DailyLike.updateOne(
      { userId: uId, likedProfileId: tId },
      { $setOnInsert: dlDoc },
      { upsert: true }
    );

    console.log('DailyLike upsert result:', dlRes);

    // Show inserted/updated docs
    const match = await Match.findOne({ userId: uId, likedUserId: tId }).lean();
    const like = await DailyLike.findOne({ userId: uId, likedProfileId: tId }).lean();

    console.log('Match doc:', match);
    console.log('DailyLike doc:', like);

  } catch (err) {
    console.error('Error inserting docs:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
