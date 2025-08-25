// Simple Socket.IO Connection Test (No Authentication)
const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:5500';

console.log('\ud83e\uddea Testing simple Socket.IO connection...');

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  auth: {} // Empty auth to bypass authentication temporarily
});

socket.on('connect', () => {
  console.log('\u2705 Socket.IO connection successful!');
  console.log(`   Socket ID: ${socket.id}`);
  console.log(`   Connected: ${socket.connected}`);
  console.log(`   Transport: ${socket.io.engine.transport.name}`);
  
  setTimeout(() => {
    socket.disconnect();
    console.log('\ud83d\udd0c Socket disconnected');
    process.exit(0);
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.error('\u274c Socket.IO connection failed:', error.message);
  console.error('   Error details:', error);
  process.exit(1);
});

socket.on('error', (error) => {
  console.error('\u274c Socket error:', error);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\u274c Connection timeout');
  socket.disconnect();
  process.exit(1);
}, 10000); 
