// Chat Service with Socket.IO - In-memory storage
const { Server } = require('socket.io');

class ChatService {
  constructor() {
    this.io = null;
    this.chatRooms = new Map(); // connectionId -> messages[]
    this.userSockets = new Map(); // userId -> socketId
    this.socketUsers = new Map(); // socketId -> userId
  }

  // Initialize Socket.IO with the HTTP server
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ["https://yourdomain.com"] 
          : ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupEventHandlers();
    console.log('🚀 Socket.IO chat service initialized');
  }

  // Setup Socket.IO event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (data) => {
        const { userId, token } = data;
        
        // In a real app, you'd verify the JWT token here
        // For now, we'll trust the userId from the client
        
        this.userSockets.set(userId, socket.id);
        this.socketUsers.set(socket.id, userId);
        
        console.log(`✅ User authenticated: ${userId} -> ${socket.id}`);
        socket.emit('authenticated', { success: true });
      });

      // Handle joining a chat room
      socket.on('join_room', (data) => {
        const { connectionId } = data;
        const userId = this.socketUsers.get(socket.id);
        
        if (!userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        socket.join(connectionId);
        console.log(`👥 User ${userId} joined room: ${connectionId}`);
        
        // Send chat history (last 50 messages)
        const messages = this.getChatHistory(connectionId);
        socket.emit('chat_history', { connectionId, messages });
      });

      // Handle leaving a chat room
      socket.on('leave_room', (data) => {
        const { connectionId } = data;
        socket.leave(connectionId);
        console.log(`👋 User left room: ${connectionId}`);
      });

      // Handle new message
      socket.on('send_message', (data) => {
        const { connectionId, message, timestamp } = data;
        const userId = this.socketUsers.get(socket.id);
        
        if (!userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const messageData = {
          id: this.generateMessageId(),
          senderId: userId,
          message: message,
          timestamp: timestamp || new Date().toISOString(),
          connectionId: connectionId
        };

        // Store message in memory
        this.storeMessage(connectionId, messageData);

        // Broadcast to all users in the room
        this.io.to(connectionId).emit('new_message', messageData);
        
        console.log(`💬 Message sent in ${connectionId}: ${message.substring(0, 50)}...`);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const { connectionId } = data;
        const userId = this.socketUsers.get(socket.id);
        
        if (userId) {
          socket.to(connectionId).emit('user_typing', { userId, connectionId });
        }
      });

      socket.on('typing_stop', (data) => {
        const { connectionId } = data;
        const userId = this.socketUsers.get(socket.id);
        
        if (userId) {
          socket.to(connectionId).emit('user_stopped_typing', { userId, connectionId });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userId = this.socketUsers.get(socket.id);
        
        if (userId) {
          this.userSockets.delete(userId);
          this.socketUsers.delete(socket.id);
          console.log(`🔌 User disconnected: ${userId}`);
        }
      });
    });
  }

  // Store a message in memory
  storeMessage(connectionId, messageData) {
    if (!this.chatRooms.has(connectionId)) {
      this.chatRooms.set(connectionId, []);
    }

    const messages = this.chatRooms.get(connectionId);
    messages.push(messageData);

    // Keep only last 100 messages per room to prevent memory bloat
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100);
    }

    // Clean up old messages (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredMessages = messages.filter(msg => new Date(msg.timestamp) > oneDayAgo);
    this.chatRooms.set(connectionId, filteredMessages);
  }

  // Get chat history for a connection
  getChatHistory(connectionId) {
    const messages = this.chatRooms.get(connectionId) || [];
    return messages.slice(-50); // Return last 50 messages
  }

  // Generate a unique message ID
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get online users for a connection
  getOnlineUsers(connectionId) {
    const room = this.io.sockets.adapter.rooms.get(connectionId);
    if (!room) return [];

    const onlineUsers = [];
    for (const socketId of room) {
      const userId = this.socketUsers.get(socketId);
      if (userId) {
        onlineUsers.push(userId);
      }
    }
    return onlineUsers;
  }

  // Clean up old data (run periodically)
  cleanup() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [connectionId, messages] of this.chatRooms.entries()) {
      const filteredMessages = messages.filter(msg => new Date(msg.timestamp) > oneDayAgo);
      if (filteredMessages.length === 0) {
        this.chatRooms.delete(connectionId);
      } else {
        this.chatRooms.set(connectionId, filteredMessages);
      }
    }

    console.log(`🧹 Cleaned up chat data. Active rooms: ${this.chatRooms.size}`);
  }
}

module.exports = new ChatService(); 