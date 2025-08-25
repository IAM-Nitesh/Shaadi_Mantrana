const mongoose = require('mongoose');
const path = require('path');

async function run() {
  const config = require(path.resolve(__dirname, '../backend/src/config'));
  const User = require(path.resolve(__dirname, '../backend/src/models/User'));

  await mongoose.connect(config.DATABASE.URI.replace(/:\*\*\*@/, ':***@') || config.DATABASE.URI, config.DATABASE.OPTIONS).catch(e => {
    console.error('Mongo connect error', e);
    process.exit(1);
  });

  const email = process.argv[2] || 'niteshkumare9591@gmail.com';

  let user = await User.findOne({ email }).catch(e => { console.error(e); });
  if (!user) {
    user = new User({ email, isApprovedByAdmin: true, status: 'active', role: 'user' });
    await user.save();
    console.log('Created user:', email);
  } else {
    user.isApprovedByAdmin = true;
    user.status = 'active';
    await user.save();
    console.log('Updated user:', email);
  }

  await mongoose.disconnect();
}

run();
