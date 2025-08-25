// Test invitation sending functionality
const mongoose = require('mongoose');
const { User, Preapproved, Invitation } = require('../src/models');

async function testInvitationSend() {
  try {
    console.log('\ud83e\uddea Testing invitation sending functionality...');
    
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const testEmail = 'niteshkumar9591@gmail.com';
    
    // Find the user
    const user = await User.findOne({ email: testEmail });
    if (!user) {
      console.log('\u274c User not found');
      return;
    }
    
    console.log(`\\n\ud83d\udc64 Found user: ${user.email} (UUID: ${user.userUuid})`);
    
    // Check current state
    console.log('\\n\ud83d\udcca Before invitation:');
    const preapprovedBefore = await Preapproved.findOne({ email: testEmail });
    const invitationBefore = await Invitation.findOne({ email: testEmail });
    
    console.log(`   - Preapproved entry: ${preapprovedBefore ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`   - Invitation entry: ${invitationBefore ? 'EXISTS' : 'NOT FOUND'}`);
    
    // Simulate invitation sending logic
    console.log('\\n\ud83d\udce7 Simulating invitation send...');
    
    // Create or update invitation
    let invitation = await Invitation.findOne({ email: user.email });
    if (!invitation) {
      invitation = new Invitation({
        uuid: user.userUuid,
        email: user.email,
        invitationId: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sentBy: 'test-admin'
      });
    } else {
      const newInvitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      invitation.invitationId = newInvitationId;
      invitation.sentDate = new Date();
      invitation.count += 1;
      invitation.sentBy = 'test-admin';
    }
    await invitation.save();
    console.log('\u2705 Invitation record created/updated');
    
    // Create or update preapproved entry
    let preapprovedEntry = await Preapproved.findOne({ email: user.email });
    if (!preapprovedEntry) {
      preapprovedEntry = new Preapproved({
        email: user.email,
        uuid: user.userUuid,
        approvedByAdmin: true,
        addedBy: 'test-admin',
        addedAt: new Date()
      });
      await preapprovedEntry.save();
      console.log('\u2705 Preapproved entry created');
    } else {
      preapprovedEntry.approvedByAdmin = true;
      await preapprovedEntry.save();
      console.log('\u2705 Preapproved entry updated');
    }
    
    // Check final state
    console.log('\\n\ud83d\udcca After invitation:');
    const preapprovedAfter = await Preapproved.findOne({ email: testEmail });
    const invitationAfter = await Invitation.findOne({ email: testEmail });
    
    console.log(`   - Preapproved entry: ${preapprovedAfter ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`   - Invitation entry: ${invitationAfter ? 'EXISTS' : 'NOT FOUND'}`);
    
    if (preapprovedAfter) {
      console.log(`   - Preapproved approved: ${preapprovedAfter.approvedByAdmin}`);
    }
    
    if (invitationAfter) {
      console.log(`   - Invitation count: ${invitationAfter.count}`);
    }

  } catch (error) {
    console.error('\u274c Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

testInvitationSend(); 
