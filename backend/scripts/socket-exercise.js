// Simple Socket.IO exercise script for local testing
// Usage: node scripts/socket-exercise.js

const { io } = require('socket.io-client');

const SERVER = process.env.SOCKET_SERVER || 'http://localhost:5500';
const connectionId = process.env.CONNECTION_ID || 'conn123';
const token = process.env.ACCESS_TOKEN || null; // if your server expects JWT

(async function main() {
  const socket = io(SERVER, {
    autoConnect: false,
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('Connected to server', socket.id);
    // Authenticate (if server listens for authenticate)
    socket.emit('authenticate', { userId: '507f1f77bcf86cd799439011', token });

    socket.on('authenticated', (data) => {
      console.log('Authenticated:', data);

      // Join room
      socket.emit('join_room', { connectionId });

      // Send a test message
      socket.emit('send_message', { connectionId, message: 'Hello from script', timestamp: new Date().toISOString() });
    });

    socket.on('new_message', (msg) => {
      console.log('New message received:', msg);
      socket.disconnect();
    });
  });

  socket.on('connect_error', (err) => {
    console.error('Connect error:', err.message);
  });

  socket.connect();
})();
