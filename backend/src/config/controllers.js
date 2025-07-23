// Controller Configuration - Flexible data source selection
// Supports switching between static/mock data and MongoDB based on DATA_SOURCE environment variable

const config = require('./index');

// Determine controller type based on data source configuration
const dataSource = config.DATA_SOURCE;
const USE_MONGODB = dataSource === 'mongodb' && config.DATABASE.URI;
const USE_STATIC = dataSource === 'static' || !config.DATABASE.URI;

// Controller imports - Use MongoDB controllers when database is configured
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

// Log which controllers are being used with data source info
console.log(`🔧 Data Source: ${dataSource.toUpperCase()}`);
console.log(`🔧 Using ${USE_MONGODB ? 'MongoDB' : 'Memory/Static'} controllers`);

if (USE_MONGODB && config.DATABASE.URI) {
  const dbUri = config.DATABASE.URI.replace(/:[^:@]*@/, ':***@');
  console.log(`📊 Database: ${dbUri}`);
  console.log(`📁 Database Name: ${config.DATABASE.NAME}`);
} else if (USE_STATIC) {
  console.log(`📊 Using static/mock data - No database required`);
}

module.exports = {
  authController,
  profileController,
  invitationController,
  uploadController,
  USE_MONGODB,
  USE_STATIC,
  DATA_SOURCE: dataSource
};
