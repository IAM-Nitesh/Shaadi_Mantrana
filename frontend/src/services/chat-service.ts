// Chat Service - Socket.IO Integration
import { io, Socket } from 'socket.io-client';
import logger from '../utils/logger';
import { loggerForUser } from '../utils/pino-logger';
import { getAuthHeaders, getCurrentUser, isAuthenticated } from './auth-utils';
import { apiClient } from '../utils/api-client';
import { config as configService } from './configService';
import { MatchingService } from './matching-service';

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
    return await MatchingService.getChatMessages(connectionId);
  }

  /**
   * Send a message and broadcast via Socket.IO
   */
  static async sendMessage(connectionId: string, message: string): Promise<any> {
    try {
      const authHeaders = await getAuthHeaders();

      // 1. Send to backend for persistence via REST
      const response = await apiClient.post(`/api/chat/${connectionId}`, { message }, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = response.data;
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

  // Initialize Socket.IO connection
  static async initSocket(connectionId: string) {
    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) throw new Error('User not authenticated');

      if (this.socket && this.socket.connected) {
        this.socket.emit('join_room', { connectionId });
        return;
      }

      const authHeaders = await getAuthHeaders();
      const token = authHeaders.Authorization?.replace('Bearer ', '');

      // Initialize Socket.IO
      this.socket = io(this.baseUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        logger.info('🔌 Connected to Chat Socket.IO server');
        this.socket?.emit('authenticate', { token });
      });

      this.socket.on('authenticated', () => {
        logger.info(`✅ Authenticated on Socket.IO, joining room: ${connectionId}`);
        this.socket?.emit('join_room', { connectionId });
      });

      this.socket.on('new_message', (payload: ChatMessage) => {
        this.messageListeners.forEach(fn => {
          try { fn(payload); } catch (e) { /* swallow */ }
        });
      });

      this.socket.on('connect_error', (error) => {
        logger.error('Socket.IO connection error', error);
      });

    } catch (error) {
      logger.error('Failed to initialize Socket.IO', error);
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
      logger.error('Error disconnecting Socket.IO', e);
    }
  }

  static getCacheStats() {
    return MatchingService.getCacheStats();
  }
}
