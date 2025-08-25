// Basic Socket.IO Connection Test
const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const SERVER_URL = 'http://localhost:5500';

console.log('\ud83e\uddea Testing basic Socket.IO connection...');

// Generate a test JWT token
const testToken = jwt.sign(
  { userId: 'test-user-id' },
  process.env.JWT_SECRET || 'test-secret-key',
  { expiresIn: '1h' }
);

const socket = io(SERVER_URL, {
  auth: { token: testToken },
  transports: ['websocket', 'polling'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('\u2705 Socket.IO connection successful!');
  console.log(`   Socket ID: ${socket.id}`);
  console.log(`   Connected: ${socket.connected}`);
  console.log(`   Transport: ${socket.io.engine.transport.name}`);
  
  // Test a simple emit
  socket.emit('test', { message: 'Hello from test client' });
  
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

socket.on('test', (data) => {
  console.log('\u2705 Received test event:', data);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\u274c Connection timeout');
  socket.disconnect();
  process.exit(1);
}, 10000); 
