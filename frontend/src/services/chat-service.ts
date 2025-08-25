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

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    return MatchingService.getCacheStats();
  }
} 