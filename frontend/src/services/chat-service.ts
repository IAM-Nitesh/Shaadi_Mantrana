// Chat Service - Supabase Realtime Integration
import { supabase, getChatChannel } from '../utils/supabase';
import logger from '../utils/logger';
import { loggerForUser } from '../utils/pino-logger';
import { getCurrentUser } from './auth-utils';
import { apiClient } from '../utils/api-client';
import { config as configService } from './configService';
import { MatchingService } from './matching-service';
import { getAuthHeaders, isAuthenticated } from './auth-utils';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  private static channel: RealtimeChannel | null = null;
  private static messageListeners: Array<(msg: ChatMessage) => void> = [];

  /**
   * Get chat messages with caching for 1 day
   */
  static async getChatMessages(connectionId: string): Promise<any> {
    return await MatchingService.getChatMessages(connectionId);
  }

  /**
   * Send a message and broadcast to Supabase channel
   */
  static async sendMessage(connectionId: string, message: string): Promise<any> {
    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        throw new Error('No authentication token found');
      }

      const authHeaders = await getAuthHeaders();
      const currentUser = await getCurrentUser();

      // 1. Send to backend for persistence
      const response = await apiClient.post(`/api/chat/${connectionId}`, { message }, {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = response.data;
      
      // 2. Broadcast via Supabase for Realtime delivery
      if (this.channel) {
        this.channel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: {
            id: data.messageId || Date.now().toString(),
            senderId: currentUser?.userId || currentUser?._id,
            message,
            timestamp: new Date().toISOString(),
            connectionId
          }
        });
      }
      
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

  // Initialize Supabase Channel connection
  static async initSocket(connectionId: string) {
    try {
      if (this.channel) {
        return;
      }

      const authenticated = await isAuthenticated();
      if (!authenticated) throw new Error('User not authenticated');

      // Initialize Supabase Channel
      this.channel = getChatChannel(connectionId);

      // Listen for broadcasts
      this.channel
        .on('broadcast', { event: 'new_message' }, ({ payload }) => {
          this.messageListeners.forEach(fn => {
            try { fn(payload as ChatMessage); } catch (e) { /* swallow */ }
          });
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            logger.info(`✅ Subscribed to Supabase channel: chat:${connectionId}`);
          }
        });

    } catch (error) {
      logger.error('Failed to initialize Supabase channel', error);
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
      if (this.channel) {
        this.channel.unsubscribe();
        this.channel = null;
        this.messageListeners = [];
      }
    } catch (e) {
      logger.error('Error unsubscribing from Supabase channel', e);
    }
  }

  static getCacheStats() {
    return MatchingService.getCacheStats();
  }
}