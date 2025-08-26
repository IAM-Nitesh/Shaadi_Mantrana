// Check specific user role
const mongoose = require('mongoose');

async function checkUserRole() {
  try {
    console.log('\ud83d\udd0d Checking user role...');
    
    const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment.');
    
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check specific user
    const userEmail = 'niteshkumar9591@gmail.com';
    
    // Check in users collection
    const user = await db.collection('users').findOne({ email: userEmail });
    console.log('\\n\ud83d\udc64 User details:');
    if (user) {
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Status: ${user.status}`);
      console.log(`   - Created: ${user.createdAt}`);
      console.log(`   - User ID: ${user._id}`);
    } else {
      console.log('   - User not found in users collection');
    }
    
    // Check all users
    const allUsers = await db.collection('users').find({}).toArray();
    console.log('\\n\ud83d\udc65 All users:');
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (role: ${user.role}, status: ${user.status})`);
    });

  } catch (error) {
    console.error('\u274c Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

checkUserRole(); 
