const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
  const mongoURI = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
  if (!mongoURI) throw new Error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment.');
  await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema (simplified version)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'pending'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

const createAdminUser = async () => {
  try {
    await connectDB();

    const adminEmail = 'admin@shaadimantrana.com';
    const adminPassword = 'admin123'; // Change this to a secure password
    const adminFirstName = 'Admin';
    const adminLastName = 'User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      process.exit(0);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user
    const adminUser = new User({
      email: adminEmail,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: 'admin',
      password: hashedPassword,
      status: 'active'
    });

    await adminUser.save();

    console.log('\u2705 Admin user created successfully!');
    console.log('\ud83d\udce7 Email:', adminEmail);
    console.log('\ud83d\udd11 Password:', adminPassword);
    console.log('\ud83d\udc64 Role: admin');
    console.log('');
    console.log('You can now login to the admin panel with these credentials.');

  } catch (error) {
    console.error('\u274c Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Run the script
createAdminUser(); 
