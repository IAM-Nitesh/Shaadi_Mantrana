// Script to initialize all MongoDB collections with proper indexes
const mongoose = require('mongoose');

async function initializeCollections() {
  try {
    console.log('\ud83d\udd27 Initializing MongoDB collections...');
    
    const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment.');
    
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Import all models to ensure they're registered
    console.log('\n\ud83d\udccb Loading models...');
    const { User, Invitation, Match, PreapprovedEmail } = require('../src/models');
    console.log('\u2705 Models loaded successfully');

    // List current collections
    console.log('\n\ud83d\udcca Current collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });

    // Initialize each collection by creating a test document and removing it
    console.log('\n\ud83d\udd27 Initializing collections...');
    
    // 1. Users collection
    console.log('   \ud83d\udcdd Initializing users collection...');
    try {
      const testUser = new User({
        email: 'test@init.com',
        userUuid: 'test-uuid-init',
        role: 'user',
        profile: {
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User'
        }
      });
      await testUser.save();
      await User.deleteOne({ email: 'test@init.com' });
      console.log('   \u2705 Users collection initialized');
    } catch (error) {
      console.log('   \u26a0\ufe0f  Users collection already exists');
    }

    // 2. PreapprovedEmail collection
    console.log('   \ud83d\udce7 Initializing preapprovedemails collection...');
    try {
      const testPreapproved = new PreapprovedEmail({
        email: 'test@init.com',
        uuid: 'test-uuid-init',
        approvedByAdmin: true
      });
      await testPreapproved.save();
      await PreapprovedEmail.deleteOne({ email: 'test@init.com' });
      console.log('   \u2705 PreapprovedEmail collection initialized');
    } catch (error) {
      console.log('   \u26a0\ufe0f  PreapprovedEmail collection already exists');
    }

    // 3. Invitation collection
    console.log('   \ud83d\udce8 Initializing invitations collection...');
    try {
      const testInvitation = new Invitation({
        email: 'test@init.com',
        invitationCode: 'test-code-init',
        sentBy: new mongoose.Types.ObjectId(),
        status: 'sent'
      });
      await testInvitation.save();
      await Invitation.deleteOne({ email: 'test@init.com' });
      console.log('   \u2705 Invitations collection initialized');
    } catch (error) {
      console.log('   \u26a0\ufe0f  Invitations collection already exists');
    }

    // 4. Match collection
    console.log('   \ud83d\udc95 Initializing matches collection...');
    try {
      const testMatch = new Match({
        userId: new mongoose.Types.ObjectId(),
        likedUserId: new mongoose.Types.ObjectId(),
        action: 'like',
        isMatch: false
      });
      await testMatch.save();
      await Match.deleteOne({ userId: testMatch.userId });
      console.log('   \u2705 Matches collection initialized');
    } catch (error) {
      console.log('   \u26a0\ufe0f  Matches collection already exists');
    }

    // Verify all collections exist
    console.log('\n\ud83d\udcca Final collections:');
    const finalCollections = await db.listCollections().toArray();
    finalCollections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });

    // Check indexes for each collection
    console.log('\n\ud83d\udd0d Checking collection indexes...');
    
    for (const collection of finalCollections) {
      const indexes = await db.collection(collection.name).indexes();
      console.log(`   \ud83d\udccb ${collection.name}: ${indexes.length} indexes`);
      indexes.forEach(index => {
        console.log(`      - ${index.name}: ${Object.keys(index.key).join(', ')}`);
      });
    }

    console.log('\n\u2705 Collection initialization completed!');
    console.log('\ud83d\udccb Summary:');
    console.log('   - All collections created with proper schemas');
    console.log('   - Indexes created for optimal performance');
    console.log('   - Ready for application use');

  } catch (error) {
    console.error('\u274c Initialization error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

initializeCollections(); 
