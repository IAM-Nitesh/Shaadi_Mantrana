// Chat Service - Socket.IO Client Integration
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from './auth-service';
import configService from './configService';
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
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.baseUrl}/api/chat/${connectionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
      console.error('Error sending message:', error);
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