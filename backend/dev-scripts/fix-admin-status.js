const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User } = require('../src/models');

async function fixAdminStatus() {
  try {
    console.log('\ud83d\udd27 Fixing admin user status...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'codebynitesh@gmail.com' });
    if (!adminUser) {
      console.log('\u274c Admin user not found');
      return;
    }

    console.log(`\ud83d\udc51 Admin user before fix: ${adminUser.email}`);
    console.log(`   - Role: ${adminUser.role}`);
    console.log(`   - Status: ${adminUser.status}`);
    console.log(`   - isApprovedByAdmin: ${adminUser.isApprovedByAdmin}`);

    // Fix admin user status
    adminUser.status = 'active';
    adminUser.isApprovedByAdmin = true; // Admin users should be approved
    adminUser.role = 'admin'; // Ensure role is admin
    await adminUser.save();

    console.log(`\n\u2705 Admin user fixed: ${adminUser.email}`);
    console.log(`   - Role: ${adminUser.role}`);
    console.log(`   - Status: ${adminUser.status}`);
    console.log(`   - isApprovedByAdmin: ${adminUser.isApprovedByAdmin}`);

    // Verify the fix
    const updatedAdmin = await User.findOne({ email: 'codebynitesh@gmail.com' });
    console.log(`\n\ud83d\udd0d Verification: ${updatedAdmin.email}`);
    console.log(`   - Role: ${updatedAdmin.role}`);
    console.log(`   - Status: ${updatedAdmin.status}`);
    console.log(`   - isApprovedByAdmin: ${updatedAdmin.isApprovedByAdmin}`);

    console.log('\n\u2705 Admin status fix completed!');
    
  } catch (error) {
    console.error('\u274c Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\ud83d\udd0c Disconnected from MongoDB');
  }
}

// Run fix
fixAdminStatus(); 
