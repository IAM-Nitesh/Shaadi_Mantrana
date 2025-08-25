// Add admin email to database
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

async function addAdminEmail() {
  try {
    console.log('\ud83d\udd27 Adding admin email to database...');
    
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const adminEmail = 'codebynitesh@gmail.com';
    const userUuid = uuidv4();

    // Import models
    const { Preapproved, User } = require('../src/models');

    // Check if email already exists in preapproved
    const existingPreapproved = await Preapproved.findOne({ email: adminEmail });
    if (existingPreapproved) {
      console.log(`\u26a0\ufe0f  Email ${adminEmail} is already in preapproved list`);
    } else {
      // Create new preapproved email
      const newPreapproved = new Preapproved({
        email: adminEmail,
        uuid: userUuid,
        approvedByAdmin: true,
        addedAt: new Date()
      });

      await newPreapproved.save();
      console.log(`\u2705 Email ${adminEmail} has been added to preapproved list`);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log(`\u2139\ufe0f  User ${adminEmail} already exists in database`);
      
      // Update user role to admin if not already
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(`\u2705 Updated ${adminEmail} to admin role`);
      } else {
        console.log(`\u2139\ufe0f  ${adminEmail} is already an admin`);
      }
    } else {
      // Create new admin user
      const newUser = new User({
        email: adminEmail,
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
          location: [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
            "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
            "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
            "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
            "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
            "Uttar Pradesh", "Uttarakhand", "West Bengal",
            "Andaman and Nicobar Islands", "Chandigarh",
            "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
            "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
          ],
          ageRange: {
            min: 18,
            max: 50
          },
          profession: [],
          education: []
        },
        role: 'admin',
        status: 'active',
        isFirstLogin: true
      });

      await newUser.save();
      console.log(`\u2705 Created new admin user: ${adminEmail}`);
    }

    console.log('\u2705 Admin email setup completed successfully!');

  } catch (error) {
    console.error('\u274c Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

addAdminEmail(); 
