// Controller Configuration - MongoDB Only
// All controllers use MongoDB for data persistence

const config = require('./index');

// Controller imports - MongoDB controllers only
const authController = require('../controllers/authControllerMongo');
const profileController = require('../controllers/profileControllerMongo');
const invitationController = require('../controllers/invitationControllerMongo');
const uploadController = require('../controllers/uploadController');

// Log controller configuration
console.log(`🔧 Data Source: MONGODB`);
console.log(`🔧 Using MongoDB controllers`);

if (config.DATABASE.URI) {
  const dbUri = config.DATABASE.URI.replace(/:[^:@]*@/, ':***@');
  console.log(`📊 Database: ${dbUri}`);
  console.log(`📁 Database Name: ${config.DATABASE.NAME}`);
} else {
  console.log(`⚠️  Warning: MongoDB URI not configured`);
}

module.exports = {
  authController,
  profileController,
  invitationController,
  uploadController,
  USE_MONGODB: true,
  USE_STATIC: false,
  DATA_SOURCE: 'mongodb'
};
