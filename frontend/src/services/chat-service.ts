// Chat Service - Socket.IO Client Integration
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from './auth-service';

export interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  timestamp: string;
  connectionId: string;
}

export interface ChatConnection {
  connectionId: string;
  otherUser: {
    _id: string;
    name: string;
    image: string;
  };
}

class ChatService {
  private socket: Socket | null = null;
  private isConnected = false;
  private currentUserId: string | null = null;
  private messageHandlers: Map<string, (message: ChatMessage) => void> = new Map();
  private typingHandlers: Map<string, (userId: string) => void> = new Map();
  private stoppedTypingHandlers: Map<string, (userId: string) => void> = new Map();
  private chatHistoryHandlers: Map<string, (history: ChatMessage[]) => void> = new Map();

  // Initialize the chat service
  initialize(userId: string) {
    if (this.socket) {
      this.disconnect();
    }

    this.currentUserId = userId;
    
    // Connect to Socket.IO server
    const socketUrl = API_CONFIG.API_BASE_URL;
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.setupEventHandlers();
    this.authenticate();
  }

  // Setup Socket.IO event handlers
  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Connected to chat server');
      this.isConnected = true;
      this.authenticate();
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from chat server');
      this.isConnected = false;
    });

    this.socket.on('authenticated', (data) => {
      console.log('✅ Chat authentication successful');
    });

    this.socket.on('chat_history', (data) => {
      console.log(`📜 Received chat history for ${data.connectionId}: ${data.messages.length} messages`);
      const handler = this.chatHistoryHandlers.get(data.connectionId);
      if (handler) {
        handler(data.messages);
      }
    });

    this.socket.on('new_message', (message: ChatMessage) => {
      console.log(`💬 New message received: ${message.message.substring(0, 50)}...`);
      const handler = this.messageHandlers.get(message.connectionId);
      if (handler) {
        handler(message);
      }
    });

    this.socket.on('user_typing', (data) => {
      const handler = this.typingHandlers.get(data.connectionId);
      if (handler) {
        handler(data.userId);
      }
    });

    this.socket.on('user_stopped_typing', (data) => {
      const handler = this.stoppedTypingHandlers.get(data.connectionId);
      if (handler) {
        handler(data.userId);
      }
    });

    this.socket.on('error', (error) => {
      console.error('❌ Chat error:', error);
    });
  }

  // Authenticate with the chat server
  private authenticate() {
    if (!this.socket || !this.currentUserId) return;

    const token = localStorage.getItem('authToken');
    this.socket.emit('authenticate', {
      userId: this.currentUserId,
      token: token
    });
  }

  // Join a chat room
  joinRoom(connectionId: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Socket not connected, cannot join room');
      return;
    }

    console.log(`👥 Joining chat room: ${connectionId}`);
    this.socket.emit('join_room', { connectionId });
  }

  // Leave a chat room
  leaveRoom(connectionId: string) {
    if (!this.socket) return;

    console.log(`👋 Leaving chat room: ${connectionId}`);
    this.socket.emit('leave_room', { connectionId });
  }

  // Send a message
  sendMessage(connectionId: string, message: string) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Socket not connected, cannot send message');
      return false;
    }

    if (!message.trim()) {
      return false;
    }

    const messageData = {
      connectionId,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    console.log(`💬 Sending message to ${connectionId}: ${message.substring(0, 50)}...`);
    this.socket.emit('send_message', messageData);
    return true;
  }

  // Start typing indicator
  startTyping(connectionId: string) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('typing_start', { connectionId });
  }

  // Stop typing indicator
  stopTyping(connectionId: string) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('typing_stop', { connectionId });
  }

  // Register message handler for a connection
  onMessage(connectionId: string, handler: (message: ChatMessage) => void) {
    this.messageHandlers.set(connectionId, handler);
  }

  // Register typing handler for a connection
  onTyping(connectionId: string, handler: (userId: string) => void) {
    this.typingHandlers.set(connectionId, handler);
  }

  // Register stopped typing handler for a connection
  onStoppedTyping(connectionId: string, handler: (userId: string) => void) {
    this.stoppedTypingHandlers.set(connectionId, handler);
  }

  // Register chat history handler for a connection
  onChatHistory(connectionId: string, handler: (history: ChatMessage[]) => void) {
    this.chatHistoryHandlers.set(connectionId, handler);
  }

  // Remove handlers for a connection
  removeHandlers(connectionId: string) {
    this.messageHandlers.delete(connectionId);
    this.typingHandlers.delete(connectionId);
    this.stoppedTypingHandlers.delete(connectionId);
    this.chatHistoryHandlers.delete(connectionId);
  }

  // Get connection status
  isSocketConnected(): boolean {
    return this.isConnected;
  }

  // Disconnect from chat server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentUserId = null;
    this.messageHandlers.clear();
    this.typingHandlers.clear();
    this.stoppedTypingHandlers.clear();
    this.chatHistoryHandlers.clear();
    console.log('🔌 Chat service disconnected');
  }
}

// Export singleton instance
export const chatService = new ChatService(); 