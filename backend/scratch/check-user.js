const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env.production' });
require('dotenv').config();

const User = require('../src/models/User');

async function checkUser() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster-m0freetier.5xmurlk.mongodb.net/shaadimantrana_prod';
  console.log('Connecting to MongoDB URI:', uri.replace(/:[^:@]*@/, ':***@'));
  
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const firebaseUid = 'cbEoYZcN2TcFUBPkL9eA8meZWIw1';
    console.log(`Searching for firebaseUid: "${firebaseUid}"...`);
    
    const user = await User.findOne({ firebaseUid });
    if (user) {
      console.log('🎉 FOUND USER DOCUMENT IN MONGODB:', JSON.stringify(user, null, 2));
    } else {
      console.log('❌ NO USER DOCUMENT FOUND FOR THIS FIREBASE UID');
      
      // Let's also look for any recent users created
      const recentUsers = await User.find().sort({ addedAt: -1 }).limit(5).lean();
      console.log('Recent 5 users created in database:', JSON.stringify(recentUsers, null, 2));
    }
  } catch (error) {
    console.error('Error in database check:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

checkUser();
