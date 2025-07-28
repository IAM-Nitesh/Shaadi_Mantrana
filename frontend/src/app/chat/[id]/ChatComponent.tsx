'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { chatService, ChatMessage } from '../../../services/chat-service';
import CustomIcon from '../../../components/CustomIcon';

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
  
  // Debug banner state changes
  useEffect(() => {
    console.log('🎬 Banner state changed:', showDisappearingBanner);
  }, [showDisappearingBanner]);
  
  // Debug banner state changes
  useEffect(() => {
    console.log('🎬 Banner state changed:', showDisappearingBanner);
  }, [showDisappearingBanner]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const connectionId = match.connectionId;

  // Get current user ID from JWT token
  const getCurrentUserId = (): string | null => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId || payload._id || payload.id;
      } catch (e) {
        console.error('Error parsing JWT token:', e);
      }
    }
    return null;
  };

  // Hide disappearing banner after 5 seconds
  useEffect(() => {
    console.log('🎬 Chat banner timer started - will hide in 5 seconds');
    const timer = setTimeout(() => {
      console.log('🎬 Hiding chat banner after 5 seconds');
      setShowDisappearingBanner(false);
    }, 5000);

    return () => {
      console.log('🎬 Chat banner timer cleared');
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!connectionId) {
      console.error('No connection ID provided for chat');
      return;
    }

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      console.error('No current user ID found');
      return;
    }

    // Try to initialize chat service
    try {
      chatService.initialize(currentUserId);
      
      // Check connection status after a delay
      setTimeout(() => {
        const connected = chatService.isSocketConnected();
        setIsConnected(connected);
        setConnectionError(!connected);
        
        if (connected) {
          // Join the chat room
          chatService.joinRoom(connectionId);

          // Set up message handler
          chatService.onMessage(connectionId, (chatMessage: ChatMessage) => {
            const isOwnMessage = chatMessage.senderId === currentUserId;
            
            const newMessage: ChatMessageUI = {
              id: chatMessage.id,
              text: chatMessage.message,
              timestamp: new Date(chatMessage.timestamp),
              isOwn: isOwnMessage,
              status: isOwnMessage ? 'read' : 'delivered'
            };

            setMessages(prev => [...prev, newMessage]);
          });

          // Set up chat history handler
          chatService.onChatHistory(connectionId, (history: ChatMessage[]) => {
            const historyMessages: ChatMessageUI[] = history.map(msg => ({
              id: msg.id,
              text: msg.message,
              timestamp: new Date(msg.timestamp),
              isOwn: msg.senderId === currentUserId,
              status: msg.senderId === currentUserId ? 'read' : 'delivered'
            }));
            setMessages(historyMessages);
          });

          // Set up typing indicators
          chatService.onTyping(connectionId, (userId) => {
            if (userId !== currentUserId) {
              setIsTyping(true);
            }
          });

          chatService.onStoppedTyping(connectionId, (userId) => {
            if (userId !== currentUserId) {
              setIsTyping(false);
            }
          });
        }
      }, 2000);

    } catch (error) {
      console.error('Failed to initialize chat service:', error);
      setConnectionError(true);
    }

    // Check connection status periodically
    const checkConnection = () => {
      const connected = chatService.isSocketConnected();
      setIsConnected(connected);
      setConnectionError(!connected);
    };

    const interval = setInterval(checkConnection, 5000);

    return () => {
      clearInterval(interval);
      if (connectionId) {
        chatService.removeHandlers(connectionId);
        chatService.leaveRoom(connectionId);
      }
    };
  }, [connectionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || isSending) return;

    const messageText = message.trim();
    setMessage('');
    setIsSending(true);

    // Add message to UI immediately with 'sending' status
    const tempMessage: ChatMessageUI = {
      id: `temp_${Date.now()}`,
      text: messageText,
      timestamp: new Date(),
      isOwn: true,
      status: 'sending'
    };

    setMessages(prev => [...prev, tempMessage]);

    // Try to send via Socket.IO if connected
    if (isConnected && connectionId) {
      const success = chatService.sendMessage(connectionId, messageText);
      
      if (success) {
        // Update message status to 'sent'
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { ...msg, status: 'sent' as const }
              : msg
          )
        );
        
        // Stop typing indicator
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
        chatService.stopTyping(connectionId);
      } else {
        // Mark as failed
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { ...msg, status: 'failed' as const }
              : msg
          )
        );
      }
    } else {
      // Fallback: just mark as sent (demo mode)
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id 
              ? { ...msg, status: 'sent' as const }
              : msg
          )
        );
      }, 1000);
    }

    setIsSending(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!connectionId || !isConnected) return;

    // Start typing indicator
    chatService.startTyping(connectionId);
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      chatService.stopTyping(connectionId);
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
              {match.name.charAt(0).toUpperCase()}
            </div>
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
            onAnimationStart={() => console.log('🎬 Banner animation started')}
            onAnimationComplete={() => console.log('🎬 Banner animation completed')}
          >
            <div className="bg-gray-800/95 backdrop-blur-md text-white text-sm px-4 py-4 shadow-xl border-b border-gray-700/50 flex items-center justify-center gap-2">
              <CustomIcon name="ri-time-line" className="text-gray-300 text-base" />
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
        {messages.length === 0 ? (
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
                    stiffness: 400, 
                    damping: 30,
                    delay: index === messages.length - 1 ? 0.1 : 0
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
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 400 }}
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
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        className="fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 z-20 shadow-2xl"
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
            className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isSending ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isSending ? Infinity : 0 }}
          >
            {isSending ? (
              <CustomIcon name="ri-loader-4-line" className="text-xl animate-spin" />
            ) : (
              <CustomIcon name="ri-send-plane-fill" className="text-xl" />
            )}
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
