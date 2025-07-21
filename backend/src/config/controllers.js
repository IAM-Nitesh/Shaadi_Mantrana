// Controller Configuration - Switch between memory-based and MongoDB-based controllers
// Set USE_MONGODB=true to use MongoDB controllers, false for memory-based controllers

const USE_MONGODB = process.env.USE_MONGODB === 'true' || false;

// Controller imports
const authController = USE_MONGODB 
  ? require('../controllers/authControllerMongo')
  : require('../controllers/authController');

const profileController = USE_MONGODB
  ? require('../controllers/profileControllerMongo') 
  : require('../controllers/profileController');

const invitationController = USE_MONGODB
  ? require('../controllers/invitationControllerMongo')
  : require('../controllers/invitationController');

const uploadController = require('../controllers/uploadController'); // No MongoDB version needed

console.log(`🔧 Using ${USE_MONGODB ? 'MongoDB' : 'Memory'} controllers`);

module.exports = {
  authController,
  profileController,
  invitationController,
  uploadController,
  USE_MONGODB
};
