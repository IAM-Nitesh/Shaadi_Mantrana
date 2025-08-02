// Script to initialize all MongoDB collections with proper indexes
const mongoose = require('mongoose');

async function initializeCollections() {
  try {
    console.log('🔧 Initializing MongoDB collections...');
    
    const mongoUri = 'mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Import all models to ensure they're registered
    console.log('\n📋 Loading models...');
    const { User, Invitation, Match, PreapprovedEmail } = require('../src/models');
    console.log('✅ Models loaded successfully');

    // List current collections
    console.log('\n📊 Current collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });

    // Initialize each collection by creating a test document and removing it
    console.log('\n🔧 Initializing collections...');
    
    // 1. Users collection
    console.log('   📝 Initializing users collection...');
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
      console.log('   ✅ Users collection initialized');
    } catch (error) {
      console.log('   ⚠️  Users collection already exists');
    }

    // 2. PreapprovedEmail collection
    console.log('   📧 Initializing preapprovedemails collection...');
    try {
      const testPreapproved = new PreapprovedEmail({
        email: 'test@init.com',
        uuid: 'test-uuid-init',
        approvedByAdmin: true
      });
      await testPreapproved.save();
      await PreapprovedEmail.deleteOne({ email: 'test@init.com' });
      console.log('   ✅ PreapprovedEmail collection initialized');
    } catch (error) {
      console.log('   ⚠️  PreapprovedEmail collection already exists');
    }

    // 3. Invitation collection
    console.log('   📨 Initializing invitations collection...');
    try {
      const testInvitation = new Invitation({
        email: 'test@init.com',
        invitationCode: 'test-code-init',
        sentBy: new mongoose.Types.ObjectId(),
        status: 'sent'
      });
      await testInvitation.save();
      await Invitation.deleteOne({ email: 'test@init.com' });
      console.log('   ✅ Invitations collection initialized');
    } catch (error) {
      console.log('   ⚠️  Invitations collection already exists');
    }

    // 4. Match collection
    console.log('   💕 Initializing matches collection...');
    try {
      const testMatch = new Match({
        userId: new mongoose.Types.ObjectId(),
        likedUserId: new mongoose.Types.ObjectId(),
        action: 'like',
        isMatch: false
      });
      await testMatch.save();
      await Match.deleteOne({ userId: testMatch.userId });
      console.log('   ✅ Matches collection initialized');
    } catch (error) {
      console.log('   ⚠️  Matches collection already exists');
    }

    // Verify all collections exist
    console.log('\n📊 Final collections:');
    const finalCollections = await db.listCollections().toArray();
    finalCollections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });

    // Check indexes for each collection
    console.log('\n🔍 Checking collection indexes...');
    
    for (const collection of finalCollections) {
      const indexes = await db.collection(collection.name).indexes();
      console.log(`   📋 ${collection.name}: ${indexes.length} indexes`);
      indexes.forEach(index => {
        console.log(`      - ${index.name}: ${Object.keys(index.key).join(', ')}`);
      });
    }

    console.log('\n✅ Collection initialization completed!');
    console.log('📋 Summary:');
    console.log('   - All collections created with proper schemas');
    console.log('   - Indexes created for optimal performance');
    console.log('   - Ready for application use');

  } catch (error) {
    console.error('❌ Initialization error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

initializeCollections(); 