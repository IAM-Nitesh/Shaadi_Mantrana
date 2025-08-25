// Script to check admin user details and verify login capability
const mongoose = require('mongoose');

async function checkAdminUser() {
  try {
    console.log('\ud83d\udd0d Checking admin user details...');
    
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const { User, PreapprovedEmail } = require('../src/models');

    // Check admin user in users collection
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (adminUser) {
      console.log('\\n\ud83d\udc51 Admin User Details:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   UUID: ${adminUser.userUuid}`);
      console.log(`   Status: ${adminUser.status}`);
      console.log(`   Created: ${adminUser.createdAt}`);
    } else {
      console.log('\u274c No admin user found in users collection');
    }

    // Check if admin exists in preapproved emails
    const adminPreapproved = await PreapprovedEmail.findOne({ email: 'codebynitesh@gmail.com' });
    
    if (adminPreapproved) {
      console.log('\\n\u26a0\ufe0f  Admin found in preapproved emails (should not be there):');
      console.log(`   Email: ${adminPreapproved.email}`);
      console.log(`   Approved: ${adminPreapproved.approvedByAdmin}`);
    } else {
      console.log('\\n\u2705 Admin correctly NOT in preapproved emails collection');
    }

    // Test login logic
    console.log('\\n\ud83d\udd10 Testing login logic:');
    const testEmail = 'codebynitesh@gmail.com';
    
    // Simulate the login check logic
    const existingUser = await User.findOne({ email: testEmail });
    const isAdmin = existingUser && existingUser.role === 'admin';
    const preapproved = await PreapprovedEmail.findOne({ email: testEmail });
    
    console.log(`   Email: ${testEmail}`);
    console.log(`   User exists: ${!!existingUser}`);
    console.log(`   Is admin: ${isAdmin}`);
    console.log(`   In preapproved: ${!!preapproved}`);
    
    if (isAdmin) {
      console.log('   \u2705 Admin can login (bypasses preapproved check)');
    } else if (preapproved && preapproved.approvedByAdmin) {
      console.log('   \u2705 Regular user can login (approved by admin)');
    } else {
      console.log('   \u274c User cannot login (not approved)');
    }

    console.log('\\n\u2705 Admin user check completed!');

  } catch (error) {
    console.error('\u274c Check error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

checkAdminUser(); 
