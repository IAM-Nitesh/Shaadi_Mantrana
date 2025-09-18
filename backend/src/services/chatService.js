// Chat Service with Socket.IO - In-memory storage
const { Server } = require('socket.io');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const ChatThread = require('../models/ChatThread');
const mongoose = require('mongoose');
const { JWTSessionManager } = require('../middleware/auth');

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
          ? [
              "https://shaadi-mantrana.vercel.app", 
              "https://www.shaadimantrana.app", 
              "https://shaadimantrana.app",
              "https://www.shaadimantrana.live",
              "https://shaadimantrana.live"
            ] 
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
    this.io.on('connection', async (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      // Attempt automatic authentication from handshake auth (if provided)
      const handshakeToken = socket.handshake && socket.handshake.auth && socket.handshake.auth.token;
      if (handshakeToken) {
        try {
          const decoded = JWTSessionManager.verifyAccessToken(handshakeToken);
          if (!(await JWTSessionManager.validateSession(decoded.sessionId))) {
            throw new Error('Invalid session');
          }

          const userId = decoded.userId;
          this.userSockets.set(userId, socket.id);
          this.socketUsers.set(socket.id, userId);
          console.log(`✅ User auto-authenticated via handshake: ${userId} -> ${socket.id}`);
          socket.emit('authenticated', { success: true, userId });
        } catch (e) {
          console.warn('Handshake token invalid:', e.message);
          socket.emit('unauthorized', { message: 'Invalid authentication token' });
          socket.disconnect(true);
          return;
        }
      }

      // Handle user authentication (client can emit authenticate)
      socket.on('authenticate', async (data) => {
        const token = data && (data.token || data.authToken);

        if (!token) {
          socket.emit('unauthorized', { message: 'Authentication token required' });
          socket.disconnect(true);
          return;
        }

        try {
          const decoded = JWTSessionManager.verifyAccessToken(token);
          if (!(await JWTSessionManager.validateSession(decoded.sessionId))) {
            throw new Error('Invalid session');
          }

          const userId = decoded.userId;
          this.userSockets.set(userId, socket.id);
          this.socketUsers.set(socket.id, userId);

          console.log(`✅ User authenticated: ${userId} -> ${socket.id}`);
          socket.emit('authenticated', { success: true, userId });
        } catch (e) {
          console.warn('Socket authentication failed:', e.message);
          socket.emit('unauthorized', { message: 'Authentication failed' });
          socket.disconnect(true);
        }
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
      socket.on('send_message', async (data) => {
        const { connectionId, message, timestamp } = data;
        const userId = this.socketUsers.get(socket.id);
        
        if (!userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        const messageData = {
          senderId: userId,
          message: message,
          timestamp: timestamp || new Date().toISOString(),
          connectionId: connectionId
        };

        // Persist message to DB using a transaction (message + conversation stats)
        let msgDoc = null;
        const session = await mongoose.startSession();
        try {
          session.startTransaction();


            // Append into ChatThread (single document per connection)
            const appendResult = await ChatThread.appendMessage(connectionId, {
              sender: userId,
              text: message,
              status: 'sent',
              createdAt: new Date()
            }, { session, new: true });

            // Map to a virtual msgDoc-like object for downstream
            msgDoc = appendResult.message || null;

            const conv = await Conversation.findOne({ connectionId }).session(session);
            if (conv) {
              await Conversation.updateOne(
                { _id: conv._id },
                { $set: { messageCount: conv.messageCount + 1, lastMessageAt: new Date() } },
                { session }
              );
            }

          await session.commitTransaction();

          // Replace id/timestamp with persisted values
          messageData.id = msgDoc._id;
          messageData.timestamp = msgDoc.createdAt;
          messageData.status = msgDoc.status;
        } catch (err) {
          await session.abortTransaction();
          console.warn('Socket transaction failed, falling back to non-transactional persistence:', err.message);

          try {
            const appendResult = await ChatThread.appendMessage(connectionId, {
              sender: userId,
              text: message,
              status: 'sent',
              createdAt: new Date()
            }, { new: true, upsert: true });

            msgDoc = appendResult.message || null;

            const convFallback = await Conversation.findByConnectionId(connectionId);
            if (convFallback) {
              await Conversation.updateStats(convFallback._id, convFallback.messageCount + 1, new Date());
            }

            if (msgDoc) {
              messageData.id = msgDoc._id;
              messageData.timestamp = msgDoc.createdAt;
              messageData.status = msgDoc.status;
            } else {
              messageData.id = this.generateMessageId();
              messageData.status = 'failed';
            }
          } catch (persistErr) {
            console.error('Failed to persist message in fallback:', persistErr.message);
            // fallback to in-memory id
            messageData.id = this.generateMessageId();
            messageData.status = 'failed';
          }
        } finally {
          session.endSession();
        }

        // Normalize payload to match REST API shape (strings + ISO timestamp)
        const normalized = {
          id: messageData.id ? (messageData.id.toString ? messageData.id.toString() : String(messageData.id)) : this.generateMessageId(),
          senderId: messageData.senderId || messageData.sender || userId,
          message: messageData.message || messageData.text || message,
          timestamp: messageData.timestamp && messageData.timestamp.toISOString ? messageData.timestamp.toISOString() : (new Date(messageData.timestamp)).toISOString(),
          status: messageData.status || 'sent',
          connectionId: connectionId
        };

        // Store message in memory with same shape
        this.storeMessage(connectionId, normalized);

        // Broadcast to all users in the room
        this.io.to(connectionId).emit('new_message', normalized);
        
        console.log(`
 Message sent in ${connectionId}: ${String(message).substring(0, 50)}...`);
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