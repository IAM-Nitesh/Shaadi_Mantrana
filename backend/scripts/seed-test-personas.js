#!/usr/bin/env node
const mongoose = require('mongoose');
const { User, Match } = require('../src/models');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority';
const TEST_PHONE = '9354799303';

const TEST_EMAIL = 'test-suite-user@shaadimantrana.com';

const PERSONA_CONFIGS = {
  admin: {
    phoneNumber: '9898989898',
    email: 'admin.test@shaadimantrana.com',
    role: 'admin',
    isApprovedByAdmin: true,
    isFirstLogin: false,
    hasCompletedWizard: true,
    profile: { name: 'Test Admin', profileCompleteness: 100 }
  },
  fresh: {
    phoneNumber: '9999999999',
    email: 'fresh.test@shaadimantrana.com',
    role: 'user',
    isApprovedByAdmin: true,
    isFirstLogin: true,
    hasCompletedWizard: false,
    profile: { name: 'Fresh User', profileCompleteness: 0 }
  },
  incomplete: {
    phoneNumber: '9354799303',
    email: 'incomplete.test@shaadimantrana.com',
    role: 'user',
    isApprovedByAdmin: true,
    isFirstLogin: false,
    hasCompletedWizard: false,
    profile: { name: 'Incomplete User', profileCompleteness: 60 }
  },
  complete: {
    phoneNumber: '9876543210',
    email: 'complete.test@shaadimantrana.com',
    role: 'user',
    isApprovedByAdmin: true,
    isFirstLogin: false,
    hasCompletedWizard: true,
    profile: { name: 'Complete User A', profileCompleteness: 100 }
  }
};

async function switchPersona(type) {
  const config = PERSONA_CONFIGS[type];
  if (!config) {
    console.error(`❌ Unknown persona type: ${type}. Available: ${Object.keys(PERSONA_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`🚀 Switching ${config.phoneNumber} to Persona: ${type.toUpperCase()}`);

    await User.findOneAndUpdate(
      { phoneNumber: config.phoneNumber },
      { 
        ...config, 
        verified: true, 
        status: 'active',
        isTestData: true 
      },
      { upsert: true, new: true, runValidators: false }
    );

    console.log(`✅ ${TEST_PHONE} is now configured as ${type.toUpperCase()}`);
  } catch (error) {
    console.error('❌ Failed to switch persona:', error);
  } finally {
    await mongoose.disconnect();
  }
}

const args = process.argv.slice(2);
let target = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--as' && args[i + 1]) {
    target = args[i + 1];
    break;
  } else if (args[i].startsWith('--as=')) {
    target = args[i].split('=')[1];
    break;
  }
}

if (!target) {
  console.log('Usage: node seed-test-personas.js --as <type>');
  console.log('Types: admin, fresh, incomplete, complete');
  process.exit(1);
}

switchPersona(target.trim().toLowerCase());
