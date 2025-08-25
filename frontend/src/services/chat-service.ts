// Chat Service - Socket.IO Client Integration
import { io, Socket } from 'socket.io-client';
import logger from '../utils/logger';
import { loggerForUser } from '../utils/pino-logger';
import { getCurrentUser } from './auth-utils';
import { config as configService } from './configService';
import { MatchingService } from './matching-service';
import { getBearerToken, isAuthenticated } from './auth-utils';

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

export class ChatService {
  private static baseUrl = configService.apiBaseUrl;
  private static socket: Socket | null = null;
  private static messageListeners: Array<(msg: ChatMessage) => void> = [];

  /**
   * Get chat messages with caching for 1 day
   */
  static async getChatMessages(connectionId: string): Promise<any> {
    // Use the MatchingService cache for chat messages
    return await MatchingService.getChatMessages(connectionId);
  }

  /**
   * Send a message and clear cache for that chat
   */
  static async sendMessage(connectionId: string, message: string): Promise<any> {
    try {
      // Check if user is authenticated using server-side auth
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        throw new Error('No authentication token found');
      }

      // Get Bearer token for backend API call
      const bearerToken = await getBearerToken();
      if (!bearerToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseUrl}/api/chat/${connectionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Clear cache for this chat when new message is sent
      MatchingService.clearChatCache(connectionId);
      
      return data;
    } catch (error) {
      try {
        const user = await getCurrentUser();
  const log = loggerForUser(user?.userUuid);
  log.error({ err: error }, 'Error sending message');
      } catch (e) {
  logger.error({ err: error }, 'Error sending message');
      }
      throw error;
    }
  }

  // Initialize Socket.IO connection and join a room
  static async initSocket(connectionId: string) {
    try {
      if (this.socket && this.socket.connected) {
        // already connected
        this.socket.emit('join_room', { connectionId });
        return;
      }
      // Ensure we have freshest auth status when initializing sockets
      try { (await import('./auth-utils')).clearAuthStatusCache(); } catch (e) { /* ignore */ }

      const authenticated = await isAuthenticated();
      if (!authenticated) throw new Error('User not authenticated');

      // Attempt to get bearer token; if missing, clear cache once and retry (helps transient 401s)
      let bearerToken = await getBearerToken();
      if (!bearerToken) {
        if (process.env.NODE_ENV === 'development') logger.warn('🔁 ChatService: Bearer token missing, clearing auth cache and retrying');
        try { (await import('./auth-utils')).clearAuthStatusCache(); } catch (e) { /* ignore */ }
        bearerToken = await getBearerToken();
      }
      if (!bearerToken) throw new Error('No auth token');

      // create socket with token in auth handshake
      this.socket = io(this.baseUrl, {
        auth: { token: bearerToken },
        transports: ['websocket'],
        reconnectionAttempts: 3
      });

      // Clear previous listeners just in case
      this.socket.off('new_message');

      this.socket.on('connect', () => {
        // join the chat room
        this.socket?.emit('join_room', { connectionId });
      });

      this.socket.on('authenticated', (data: any) => {
        // optionally handle auth
        // join room on successful authentication
        this.socket?.emit('join_room', { connectionId });
      });

      this.socket.on('new_message', (msg: ChatMessage) => {
        // notify all listeners
        this.messageListeners.forEach(fn => {
          try { fn(msg); } catch (e) { /* swallow */ }
        });
      });

      this.socket.on('connect_error', (err) => {
        logger.error('Socket connection error', err);
      });

    } catch (error) {
      logger.error('Failed to initialize socket', error);
      throw error;
    }
  }

  static subscribeToMessages(fn: (msg: ChatMessage) => void) {
    this.messageListeners.push(fn);
    return () => this.unsubscribeFromMessages(fn);
  }

  static unsubscribeFromMessages(fn: (msg: ChatMessage) => void) {
    this.messageListeners = this.messageListeners.filter(f => f !== fn);
  }

  static disconnectSocket() {
    try {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.messageListeners = [];
      }
    } catch (e) {
      logger.error('Error disconnecting socket', e);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    return MatchingService.getCacheStats();
  }
} 