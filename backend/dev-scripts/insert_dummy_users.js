/*
Dev script to insert 6 dummy users for discovery/dashboard testing
Usage:
  node insert_dummy_users.js [count]
Default count: 6
*/

const mongoose = require('mongoose');
// lightweight random helpers (avoid external dependency)
function randName(i) {
  const first = ['Aarav','Vivaan','Aditya','Arjun','Vihaan','Ishaan','Ananya','Saanvi','Aadhya','Ira'][i%10];
  const last = ['Shah','Patel','Kumar','Reddy','Singh','Gupta','Mehta','Jain','Nair','Kapoor'][i%10];
  return `${first} ${last}`;
}

async function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args[0], 10) || 6;

  const config = require('../src/config');
  const { User } = require('../src/models');

  const uri = (config && config.DATABASE && config.DATABASE.URI) ? config.DATABASE.URI : (process.env.MONGODB_URI || process.env.MONGODB_TEST_URI);
  if (!uri) {
    console.error('MongoDB URI not found in config or environment');
    process.exit(2);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const inserted = [];

  for (let i = 0; i < count; i++) {
    const name = randName(i);
    const email = `dev.user.${Date.now()}${i}@example.com`;
    const gender = i % 2 === 0 ? 'Male' : 'Female';

    const user = new User({
      email,
      profile: {
        name,
        gender,
        dateOfBirth: '1995-01-01',
        profileCompleteness: 80,
        images: [],
        interests: ['Music', 'Travel']
      },
      verification: { isVerified: true },
      status: 'active',
      profileCompleted: true,
      isFirstLogin: false
    });

    try {
      const saved = await user.save();
      inserted.push(saved);
      console.log('Inserted user:', saved._id.toString(), saved.email);
    } catch (err) {
      console.error('Failed to insert user:', err.message || err);
    }
  }

  await mongoose.disconnect();
  console.log('Disconnected. Inserted users count:', inserted.length);
  console.log(inserted.map(u => u._id.toString()));
}

main().catch(err => { console.error(err); process.exit(1); });
