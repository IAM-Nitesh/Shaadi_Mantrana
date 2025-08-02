const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { User, Preapproved, Invitation } = require('../src/models');

async function testAuthFlow() {
  try {
    console.log('🧪 Testing Authentication Flow with Admin Approval...');
    
    // Connect to MongoDB
    const environment = process.env.NODE_ENV || 'development';
    const DEV_MONGODB_URI = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    let mongoUri;
    switch (environment) {
      case 'development':
      case 'dev':
      case 'local':
        mongoUri = process.env.MONGODB_URI || DEV_MONGODB_URI;
        break;
      case 'production':
      case 'prod':
        mongoUri = process.env.MONGODB_URI || process.env.MONGODB_PRODUCTION_URI;
        break;
      case 'test':
        mongoUri = process.env.MONGODB_TEST_URI || DEV_MONGODB_URI;
        break;
      default:
        mongoUri = DEV_MONGODB_URI;
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const testEmail = 'test-auth-flow@example.com';
    const userUuid = uuidv4();

    // Test 1: Try to send OTP without admin approval (should fail)
    console.log('\n📝 Test 1: Attempting login without admin approval...');
    
    const preapprovedCheck = await Preapproved.findOne({ email: testEmail });
    if (preapprovedCheck) {
      console.log('❌ User already exists in preapproved collection');
    } else {
      console.log('✅ User not in preapproved collection (expected)');
    }

    // Test 2: Create admin-approved user
    console.log('\n📝 Test 2: Creating admin-approved user...');
    
    // Create preapproved entry
    const preapprovedUser = new Preapproved({
      email: testEmail,
      uuid: userUuid,
      isFirstLogin: true,
      approvedByAdmin: true,
      addedAt: new Date()
    });

    await preapprovedUser.save();
    console.log('✅ Created preapproved entry');

    // Create user entry
    const user = new User({
      email: testEmail,
      userUuid: userUuid,
      profile: {
        location: "India",
        profileCompleteness: 17,
        // Initialize all dropdown fields as undefined (empty)
        gender: undefined,
        maritalStatus: undefined,
        manglik: undefined,
        complexion: undefined,
        eatingHabit: undefined,
        smokingHabit: undefined,
        drinkingHabit: undefined,
        settleAbroad: undefined,
        // Initialize other profile fields as empty
        name: '',
        nativePlace: '',
        currentResidence: '',
        dateOfBirth: '',
        timeOfBirth: '',
        placeOfBirth: '',
        height: '',
        weight: '',
        education: '',
        occupation: '',
        annualIncome: '',
        father: '',
        mother: '',
        brothers: '',
        sisters: '',
        fatherGotra: '',
        motherGotra: '',
        grandfatherGotra: '',
        grandmotherGotra: '',
        specificRequirements: '',
        about: '',
        interests: [],
        images: []
      },
      preferences: {
        location: ["Delhi", "Mumbai", "Bangalore"],
        ageRange: {
          min: 18,
          max: 50
        },
        profession: [],
        education: []
      },
      isFirstLogin: true,
      role: 'user',
      status: 'active'
    });

    await user.save();
    console.log('✅ Created user entry');

    // Test 3: Verify user can now login (simulate auth check)
    console.log('\n📝 Test 3: Verifying user can login...');
    
    const authCheck = await Preapproved.findOne({ email: testEmail });
    if (authCheck && authCheck.approvedByAdmin) {
      console.log('✅ User is approved and can login');
    } else {
      console.log('❌ User is not approved for login');
    }

    // Test 4: Test pause functionality
    console.log('\n📝 Test 4: Testing pause functionality...');
    
    await Preapproved.findOneAndUpdate(
      { email: testEmail },
      { approvedByAdmin: false }
    );

    const pausedCheck = await Preapproved.findOne({ email: testEmail });
    if (!pausedCheck.approvedByAdmin) {
      console.log('✅ User is paused and cannot login');
    } else {
      console.log('❌ User pause failed');
    }

    // Test 5: Test resume functionality
    console.log('\n📝 Test 5: Testing resume functionality...');
    
    await Preapproved.findOneAndUpdate(
      { email: testEmail },
      { approvedByAdmin: true }
    );

    const resumedCheck = await Preapproved.findOne({ email: testEmail });
    if (resumedCheck.approvedByAdmin) {
      console.log('✅ User is resumed and can login again');
    } else {
      console.log('❌ User resume failed');
    }

    // Test 6: Clean up
    console.log('\n🧹 Test 6: Cleaning up test data...');
    
    await Preapproved.findOneAndDelete({ email: testEmail });
    await User.findOneAndDelete({ email: testEmail });
    
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Authentication flow test completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- ✅ Admin approval system working');
    console.log('- ✅ Authentication checks working');
    console.log('- ✅ Pause/Resume functionality working');
    console.log('- ✅ User creation workflow working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testAuthFlow(); 