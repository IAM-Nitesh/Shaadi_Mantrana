const mongoose = require('mongoose');
const { User, DailyLike, Connection, Match } = require('../src/models');

// MongoDB connection - using Atlas cloud database
const MONGODB_URI = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function checkAndInsertMatches() {
  try {
    console.log('🔍 Checking and inserting matches for the two users...');
    
    // User IDs from the provided data
    const user1Id = '688756bf0c39e9ad06d67a62'; // dummy user (niteshkumar9591@gmail.com)
    const user2Id = '68878a8ccc09403a065058cb'; // krishankumar6366@gmail.com
    
    console.log('👤 User 1 (dummy):', user1Id);
    console.log('👤 User 2 (krishan):', user2Id);
    
    // Check if users exist
    const user1 = await User.findById(user1Id);
    const user2 = await User.findById(user2Id);
    
    if (!user1) {
      console.error('❌ User 1 (dummy) not found');
      return;
    }
    
    if (!user2) {
      console.error('❌ User 2 (krishan) not found');
      return;
    }
    
    console.log('✅ Both users found');
    console.log('👤 User 1 name:', user1.profile?.name);
    console.log('👤 User 2 name:', user2.profile?.name);
    
    // Check existing DailyLike entries
    console.log('\n🔍 Checking existing DailyLike entries...');
    
    const existingLikes = await DailyLike.find({
      $or: [
        { userId: user1Id, likedProfileId: user2Id },
        { userId: user2Id, likedProfileId: user1Id }
      ]
    });
    
    console.log('📋 Found existing likes:', existingLikes.length);
    existingLikes.forEach(like => {
      console.log(`  - ${like.userId} → ${like.likedProfileId} (${like.isMutualMatch ? 'MUTUAL' : 'SINGLE'})`);
    });
    
    // Check existing Connection entries
    console.log('\n🔍 Checking existing Connection entries...');
    
    const existingConnections = await Connection.find({
      users: { $all: [user1Id, user2Id] }
    });
    
    console.log('📋 Found existing connections:', existingConnections.length);
    existingConnections.forEach(conn => {
      console.log(`  - Connection: ${conn._id}, Status: ${conn.status}, Type: ${conn.type}`);
    });
    
    // Check existing Match entries
    console.log('\n🔍 Checking existing Match entries...');
    
    const existingMatches = await Match.find({
      $or: [
        { userId: user1Id, likedUserId: user2Id },
        { userId: user2Id, likedUserId: user1Id }
      ]
    });
    
    console.log('📋 Found existing matches:', existingMatches.length);
    existingMatches.forEach(match => {
      console.log(`  - Match: ${match.userId} → ${match.likedUserId} (${match.isMatch ? 'MATCH' : 'LIKE'})`);
    });
    
    // Insert missing entries
    console.log('\n🔧 Inserting missing entries...');
    
    // Check if user2 has liked user1 (from logs, this exists)
    const user2LikesUser1 = await DailyLike.findOne({
      userId: user2Id,
      likedProfileId: user1Id
    });
    
    if (!user2LikesUser1) {
      console.log('➕ Creating DailyLike: user2 → user1');
      const like1 = new DailyLike({
        userId: user2Id,
        likedProfileId: user1Id,
        type: 'like',
        likeDate: new Date(),
        isMutualMatch: false
      });
      await like1.save();
      console.log('✅ Created DailyLike:', like1._id);
    } else {
      console.log('✅ DailyLike user2 → user1 already exists');
    }
    
    // Check if user1 has liked user2 (this should create mutual match)
    const user1LikesUser2 = await DailyLike.findOne({
      userId: user1Id,
      likedProfileId: user2Id
    });
    
    if (!user1LikesUser2) {
      console.log('➕ Creating DailyLike: user1 → user2');
      const like2 = new DailyLike({
        userId: user1Id,
        likedProfileId: user2Id,
        type: 'like',
        likeDate: new Date(),
        isMutualMatch: true // This will make it a mutual match
      });
      await like2.save();
      console.log('✅ Created DailyLike:', like2._id);
      
      // Update the other like to mark as mutual match
      if (user2LikesUser1) {
        await DailyLike.updateOne(
          { _id: user2LikesUser1._id },
          { isMutualMatch: true }
        );
        console.log('✅ Updated user2 → user1 like as mutual match');
      }
    } else {
      console.log('✅ DailyLike user1 → user2 already exists');
      
      // If both likes exist, make sure they're both marked as mutual
      if (user2LikesUser1) {
        await Promise.all([
          DailyLike.updateOne(
            { _id: user1LikesUser2._id },
            { isMutualMatch: true }
          ),
          DailyLike.updateOne(
            { _id: user2LikesUser1._id },
            { isMutualMatch: true }
          )
        ]);
        console.log('✅ Updated both likes as mutual matches');
      }
    }
    
    // Check if connection exists for mutual match
    const mutualConnection = await Connection.findOne({
      users: { $all: [user1Id, user2Id] },
      status: 'accepted'
    });
    
    if (!mutualConnection) {
      console.log('➕ Creating Connection for mutual match');
      const connection = new Connection({
        users: [user1Id, user2Id],
        status: 'accepted',
        type: 'like',
        initiatedBy: user2Id, // user2 initiated the first like
        timestamps: {
          initiated: new Date(),
          responded: new Date(),
          lastActivity: new Date()
        }
      });
      await connection.save();
      console.log('✅ Created Connection:', connection._id);
    } else {
      console.log('✅ Connection already exists');
    }
    
    // Check if Match entries exist for mutual match
    const user1MatchUser2 = await Match.findOne({
      userId: user1Id,
      likedUserId: user2Id
    });
    
    const user2MatchUser1 = await Match.findOne({
      userId: user2Id,
      likedUserId: user1Id
    });
    
    if (!user1MatchUser2) {
      console.log('➕ Creating Match: user1 → user2');
      const match1 = new Match({
        userId: user1Id,
        likedUserId: user2Id,
        action: 'like',
        isMatch: true,
        matchedAt: new Date()
      });
      await match1.save();
      console.log('✅ Created Match:', match1._id);
    } else {
      console.log('✅ Match user1 → user2 already exists');
    }
    
    if (!user2MatchUser1) {
      console.log('➕ Creating Match: user2 → user1');
      const match2 = new Match({
        userId: user2Id,
        likedUserId: user1Id,
        action: 'like',
        isMatch: true,
        matchedAt: new Date()
      });
      await match2.save();
      console.log('✅ Created Match:', match2._id);
    } else {
      console.log('✅ Match user2 → user1 already exists');
    }
    
    // Verify the final state
    console.log('\n🔍 Verifying final state...');
    
    const finalLikes = await DailyLike.find({
      $or: [
        { userId: user1Id, likedProfileId: user2Id },
        { userId: user2Id, likedProfileId: user1Id }
      ]
    });
    
    const finalConnections = await Connection.find({
      users: { $all: [user1Id, user2Id] }
    });
    
    const finalMatches = await Match.find({
      $or: [
        { userId: user1Id, likedUserId: user2Id },
        { userId: user2Id, likedUserId: user1Id }
      ]
    });
    
    console.log('📊 Final DailyLike entries:', finalLikes.length);
    finalLikes.forEach(like => {
      console.log(`  - ${like.userId} → ${like.likedProfileId} (${like.isMutualMatch ? 'MUTUAL' : 'SINGLE'})`);
    });
    
    console.log('📊 Final Connection entries:', finalConnections.length);
    finalConnections.forEach(conn => {
      console.log(`  - Connection: ${conn._id}, Status: ${conn.status}, Type: ${conn.type}`);
    });
    
    console.log('📊 Final Match entries:', finalMatches.length);
    finalMatches.forEach(match => {
      console.log(`  - Match: ${match.userId} → ${match.likedUserId} (${match.isMatch ? 'MATCH' : 'LIKE'})`);
    });
    
    console.log('\n✅ Script completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
connectDB().then(checkAndInsertMatches); 