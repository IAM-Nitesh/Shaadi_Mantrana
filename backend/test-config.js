require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

require('dotenv').config();

const config = require('./src/config');

console.log('Environment:', process.env.NODE_ENV);
console.log('Config NODE_ENV:', config.NODE_ENV);
console.log('Config isProduction:', config.isProduction);
console.log('MongoDB URI:', config.DATABASE.URI ? config.DATABASE.URI.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@') : 'Not set');
console.log('Database Name:', config.DATABASE.NAME);
