'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ChatMessage } from '../../../services/chat-service';
import { ImageUploadService } from '../../../services/image-upload-service';
import CustomIcon from '../../../components/CustomIcon';
import { ChatService } from '../../../services/chat-service';
import { MatchingService } from '../../../services/matching-service';
import ToastService from '../../../services/toastService';
import { ServerAuthService } from '../../../services/server-auth-service';
import logger from '../../../utils/logger';

interface Match {
  name: string;
  image: string;
  connectionId?: string;
  otherUserId?: string;
}

interface ChatComponentProps {
  match: Match;
}

interface ChatMessageUI {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export default function ChatComponent({ match }: ChatComponentProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [showDisappearingBanner, setShowDisappearingBanner] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUnmatchMenu, setShowUnmatchMenu] = useState(false);
  const [isUnmatching, setIsUnmatching] = useState(false);
  
  // Fetch profile image for the match
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (match.otherUserId) {
        try {
          const signedUrl = await ImageUploadService.getUserProfilePictureSignedUrlCached(match.otherUserId);
          if (signedUrl) {
            setProfileImageUrl(signedUrl);
            setImageError(false);
          }
        } catch (error) {
          logger.error('Failed to fetch profile image for match:', match.otherUserId, error);
          setImageError(true);
        }
      }
    };

    fetchProfileImage();
  }, [match.otherUserId]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const connectionId = match.connectionId;

  // Get current user ID from JWT token
  const getCurrentUserId = async (): Promise<string | null> => {
    const token = await ServerAuthService.getBearerToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload._id || payload.id;
      } catch (e) {
        logger.error('Error parsing JWT token:', e);
      }
    }
    return null;
  };

  // Hide disappearing banner after 5 seconds
  useEffect(() => {
    logger.debug('🎬 Chat banner timer started - will hide in 5 seconds');
    const timer = setTimeout(() => {
      logger.debug('🎬 Hiding chat banner after 5 seconds');
      setShowDisappearingBanner(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Close unmatch menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUnmatchMenu && !target.closest('.unmatch-menu')) {
        setShowUnmatchMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUnmatchMenu]);

  // Initialize chat connection
  useEffect(() => {
    if (!connectionId) return;

    const initializeChat = async () => {
      try {
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
          logger.error('No current user ID found');
          return;
        }

        // Mark match toast as seen when entering chat with retry mechanism
        const markToastSeenWithRetry = async (retries = 3, delay = 200) => {
          for (let i = 0; i < retries; i++) {
            try {
              const result = await MatchingService.markToastSeenOnChatEntry(connectionId);
              if (result.success) {
                return;
              } else {
                if (i < retries - 1) {
                  await new Promise(resolve => setTimeout(resolve, delay));
                }
              }
            } catch (error) {
              if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }
        };
        
        // Don't await this to avoid blocking chat initialization
        markToastSeenWithRetry();

        // Fetch initial messages using the new caching system
        const data = await ChatService.getChatMessages(connectionId);
        if (data.success) {
          setMessages(data.messages || []);
        }
        setIsConnected(true);
      } catch (error) {
        logger.error('Failed to initialize chat:', error);
        setConnectionError(true);
      }
    };

    initializeChat();
  }, [connectionId]);

  // Send message function
  const sendMessage = async () => {
    if (!message.trim() || !connectionId || isSending) return;

    setIsSending(true);
    const messageText = message.trim();
    setMessage('');

    try {
      // Send message using the new service
      const response = await ChatService.sendMessage(connectionId, messageText);
      
      if (response.success) {
        // Add message to local state
        const newMessage: ChatMessageUI = {
          id: Date.now().toString(),
          text: messageText,
          timestamp: new Date(),
          isOwn: true,
          status: 'sent'
        };
        
        setMessages(prev => [...prev, newMessage]);
      } else {
        logger.error('Failed to send message:', response.message);
      }
    } catch (error) {
      logger.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle unmatch
  const handleUnmatch = async () => {
    if (!connectionId || isUnmatching) return;
    
    if (!confirm(`Are you sure you want to unmatch from ${match.name}? This action cannot be undone.`)) {
      return;
    }

    setIsUnmatching(true);
    try {
      await MatchingService.unmatchProfile(connectionId);
      
      // Show success message and redirect
              ToastService.success('Successfully unmatched!');
      router.push('/matches');
    } catch (error) {
      logger.error('Error unmatching:', error);
              ToastService.error('Failed to unmatch. Please try again.');
    } finally {
      setIsUnmatching(false);
      setShowUnmatchMenu(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      // Typing stopped
    }, 2000);
    
    setTypingTimeout(timeout);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status: ChatMessageUI['status']) => {
    switch (status) {
      case 'sending':
        return <CustomIcon name="ri-time-line" className="text-gray-400 text-xs" />;
      case 'sent':
        return <CustomIcon name="ri-check-line" className="text-gray-400 text-xs" />;
      case 'delivered':
        return <CustomIcon name="ri-check-double-line" className="text-gray-400 text-xs" />;
      case 'read':
        return <CustomIcon name="ri-check-double-line" className="text-blue-500 text-xs" />;
      case 'failed':
        return <CustomIcon name="ri-error-warning-line" className="text-red-500 text-xs" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-white/20 shadow-lg z-40 px-4 py-3"
        style={{ top: showDisappearingBanner ? '60px' : '0px' }}
      >
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              try {
                router.back();
              } catch (error) {
                // Fallback to matches page if router.back() fails
                router.push('/matches');
              }
            }}
            className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <CustomIcon name="ri-arrow-left-line" className="text-xl" />
          </button>
          
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {profileImageUrl && !imageError ? (
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg">
                <Image
                  src={profileImageUrl}
                  alt={match.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                {match.name.charAt(0).toUpperCase()}
              </div>
            )}
            {/* Connection status indicator */}
            <motion.div 
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              }`}
              animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 2, repeat: isConnected ? Infinity : 0 }}
            />
          </motion.div>
          
          <div className="flex-1">
            <h1 className="font-semibold text-gray-800 text-lg">{match.name}</h1>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
              {isTyping && (
                <motion.span 
                  className="text-sm text-gray-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  typing...
                </motion.span>
              )}
            </div>
          </div>
          
          {/* Unmatch Menu */}
          <div className="relative unmatch-menu">
            <button
              onClick={() => setShowUnmatchMenu(!showUnmatchMenu)}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
              title="More options"
            >
              <CustomIcon name="ri-more-2-fill" className="text-xl" />
            </button>
            
            {showUnmatchMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[160px]"
              >
                <button
                  onClick={handleUnmatch}
                  disabled={isUnmatching}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors duration-200"
                >
                  <CustomIcon 
                    name="ri-user-unfollow-line" 
                    className="text-lg"
                  />
                  <span>Unmatch</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Disappearing Messages Banner */}
      <AnimatePresence>
        {showDisappearingBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50"
          >
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm px-4 py-3 shadow-lg border-b border-pink-400/30 flex items-center justify-center">
              <span className="text-center font-medium">Messages in this chat are not saved. They'll be automatically deleted after 24 hours.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div 
        className={`flex-1 pb-28 px-4 overflow-y-auto z-10 ${showDisappearingBanner ? 'pt-32' : 'pt-24'}`}
        style={{ paddingTop: showDisappearingBanner ? '120px' : '96px' }}
      >
        {loading ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <p className="text-gray-600">Loading messages...</p>
          </motion.div>
        ) : messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <motion.div 
              className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-6"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <CustomIcon name="ri-chat-3-line" className="text-3xl text-rose-500" />
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Start a conversation!</h3>
            <p className="text-gray-600 max-w-sm leading-relaxed">
              Send your first message to {match.name} and begin your journey together. 
              Every great relationship starts with a simple "Hello"! 💕
            </p>

          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 500, 
                    damping: 35,
                    duration: 0.2,
                    delay: index === messages.length - 1 ? 0.05 : 0
                  }}
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${msg.isOwn ? 'order-2' : 'order-1'}`}>
                    <motion.div
                      className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                        msg.isOwn 
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-br-md' 
                          : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 500, duration: 0.1 }}
                    >
                      <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                      
                      <div className={`flex items-center justify-end space-x-1 mt-2 ${
                        msg.isOwn ? 'text-white/70' : 'text-gray-400'
                      }`}>
                        <span className="text-xs">{formatTime(msg.timestamp)}</span>
                        {msg.isOwn && getStatusIcon(msg.status)}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35, duration: 0.15 }}
        className="fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 z-20 shadow-2xl"
        style={{ paddingBottom: 'calc(16px + var(--safe-area-inset-bottom))' }}
      >
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
            />
            
            {/* Typing indicator */}
            {isTyping && isConnected && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-8 left-0 text-xs text-gray-500"
              >
                {match.name} is typing...
              </motion.div>
            )}
          </div>
          
          <motion.button
            onClick={sendMessage}
            disabled={!message.trim() || isSending}
            className="w-14 h-14 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-pink-300 hover:bg-pink-50 android-touch-target"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img 
              src="/icon.svg" 
              alt="Send" 
              className="w-6 h-6 text-pink-500"
            />
          </motion.button>
        </div>
        
        <div className="text-center mt-3">
          <span className="text-xs text-gray-400 flex items-center justify-center">
            <CustomIcon name="ri-shield-check-line" className="mr-1" />
            Messages are end-to-end encrypted
          </span>
        </div>
      </motion.div>
    </div>
  );
}
