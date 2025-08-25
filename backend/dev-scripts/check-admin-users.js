// Check admin users in database
const mongoose = require('mongoose');

async function checkAdminUsers() {
  try {
    console.log('\ud83d\udd0d Checking admin users in database...');
    
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check users collection for admin users
    const adminUsers = await db.collection('users').find({ role: 'admin' }).toArray();
    console.log('\\n\ud83d\udc51 Admin Users in users collection:');
    adminUsers.forEach(user => {
      console.log(`   - ${user.email} (role: ${user.role}, status: ${user.status})`);
    });
    
    // Check preapproved collection for admin emails
    const adminPreapproved = await db.collection('preapprovedemails').find({ 
      email: { $regex: /admin|codebynitesh/ } 
    }).toArray();
    console.log('\\n\u2705 Admin emails in preapproved collection:');
    adminPreapproved.forEach(preapproved => {
      console.log(`   - ${preapproved.email} (approved: ${preapproved.approvedByAdmin})`);
    });
    
    // Check for codebynitesh@gmail.com specifically
    const specificUser = await db.collection('users').findOne({ email: 'codebynitesh@gmail.com' });
    const specificPreapproved = await db.collection('preapprovedemails').findOne({ email: 'codebynitesh@gmail.com' });
    
    console.log('\\n\ud83c\udfaf Specific check for codebynitesh@gmail.com:');
    console.log(`   - In users collection: ${specificUser ? 'YES' : 'NO'}`);
    console.log(`   - In preapproved collection: ${specificPreapproved ? 'YES' : 'NO'}`);
    
    if (specificUser) {
      console.log(`   - User role: ${specificUser.role}`);
      console.log(`   - User status: ${specificUser.status}`);
    }
    
    if (specificPreapproved) {
      console.log(`   - Preapproved status: ${specificPreapproved.approvedByAdmin}`);
    }

  } catch (error) {
    console.error('\u274c Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

checkAdminUsers(); 
