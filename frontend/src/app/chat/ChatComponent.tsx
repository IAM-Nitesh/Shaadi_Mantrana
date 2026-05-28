'use client';

import { useState, useRef, useEffect } from 'react';
;
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import { ChatMessage } from '../../services/chat-service';
import { ImageUploadService } from '../../services/image-upload-service';
import CustomIcon from '../../components/CustomIcon';
import { ChatService } from '../../services/chat-service';
import { MatchingService } from '../../services/matching-service';
import ToastService from '../../services/toastService';
import logger from '../../utils/logger';
import posthog from 'posthog-js';

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
  const [headerOffset, setHeaderOffset] = useState<number>(0);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
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
    const token = await localStorage.getItem('accessToken') || '';
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


  // Compute top offset so chat header sits below app banner and any extra banner
  useEffect(() => {
    const computeOffset = () => {
      try {
        let offset = 0;
        const appBanner = document.querySelector('[role="banner"]') as HTMLElement | null;
        if (appBanner) offset += appBanner.offsetHeight || 0;

        // Read the CSS var --header-height (e.g. "96px") and parse it to a number
        let parsedHeaderHeight = 0;
        try {
          const raw = getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '';
          const px = raw.trim().endsWith('px') ? raw.trim().slice(0, -2) : raw.trim();
          parsedHeaderHeight = Number(px) || 0;
        } catch (e) {
          parsedHeaderHeight = 0;
        }

        setHeaderHeight(parsedHeaderHeight);
        setHeaderOffset(offset);
      } catch (e) {
        // ignore
      }
    };

    computeOffset();
    const onResize = () => computeOffset();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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
        if (data && data.success) {
          // Normalize incoming messages to ChatMessageUI shape and coerce timestamps to Date
          const normalized: ChatMessageUI[] = (data.messages || []).map((m: any) => {
            const ts = m.timestamp ?? m.createdAt ?? m.time ?? null;
            let date: Date | null = null;
            if (ts != null) {
              try {
                if (typeof ts === 'object' && ts !== null) {
                  if (ts.$date) {
                    const raw = typeof ts.$date === 'object' && ts.$date.$numberLong ? Number(ts.$date.$numberLong) : ts.$date;
                    date = new Date(raw as any);
                  } else if (ts.$numberLong) {
                    date = new Date(Number(ts.$numberLong));
                  } else if (ts.toString) {
                    date = new Date(ts.toString());
                  }
                } else {
                  date = new Date(ts as any);
                }
                if (date && Number.isNaN(date.getTime())) date = null;
              } catch (e) {
                date = null;
              }
            }

            return {
              id: m.id || m._id || Date.now().toString(),
              text: m.message || m.text || '',
              timestamp: date || new Date(),
              isOwn: String(m.senderId || m.sender) === String(currentUserId),
              status: (m as any).status || 'sent'
            } as ChatMessageUI;
          });

          setMessages(normalized);
        }

        setLoading(false);
      } catch (error) {
        logger.error('Failed to initialize chat:', error);
        setConnectionError(true);
        // Ensure loading state is cleared on error
        setLoading(false);
      }
    };

    let unsubscribe: (() => void) | null = null;

    (async () => {
      await initializeChat();

      // Initialize socket after loading messages
      try {
        await ChatService.initSocket(connectionId);

        unsubscribe = ChatService.subscribeToMessages(async (msg) => {
          try {
            const incoming: ChatMessageUI = {
              id: msg.id || Date.now().toString(),
              text: msg.message,
              timestamp: new Date(msg.timestamp),
              isOwn: msg.senderId === (await getCurrentUserId()),
              status: (msg as any).status || 'sent'
            };
            
            // Prevent duplicate messages by checking if message ID already exists
            setMessages(prev => {
              const exists = prev.some(m => m.id === incoming.id);
              if (exists) {
                console.log('Duplicate message detected, skipping:', incoming.id);
                return prev;
              }
              return [...prev, incoming];
            });
          } catch (e) {
            logger.error('Error handling incoming socket message', e);
          }
        });
      } catch (socketErr) {
        logger.error('Socket init failed', socketErr);
      }
    })();

    // cleanup on unmount
    return () => {
      if (unsubscribe) unsubscribe();
      ChatService.disconnectSocket();
    };
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
        const sentMessage: ChatMessageUI = {
          id: response.messageId || response.id || `local-${Date.now()}`,
          text: response.message || messageText,
          timestamp: new Date(),
          isOwn: true,
          status: 'sent'
        };

        setMessages(prev => {
          if (prev.some(existing => existing.id === sentMessage.id)) {
            return prev;
          }
          return [...prev, sentMessage];
        });

        posthog.capture('message_sent', { connection_id: connectionId });
      } else {
        logger.error('Failed to send message:', response.message);
      }
    } catch (error) {
      logger.error('Error sending message:', error);
      posthog.captureException(error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle unmatch
  const handleUnmatch = async () => {
    if (!connectionId || isUnmatching) return;

    // Existing menu-driven flow kept for backward compatibility
    if (!confirm(`Are you sure you want to unmatch from ${match.name}? This action cannot be undone.`)) {
      return;
    }

    await performUnmatch();
  };

  // Extracted unmatch operation so it can be triggered from different UI (menu or toast)
  const performUnmatch = async () => {
    if (!connectionId || isUnmatching) return;

    setIsUnmatching(true);
    try {
  // Pass both connectionId and the other user's id so backend can
  // clear DailyLike records and perform defensive cleanup even when
  // the Connection document or connectionId field on DailyLike is missing.
  await MatchingService.unmatchProfile({ connectionId, targetUserId: match.otherUserId });

  // Show swipeable success toast controlled by GSAP (auto-dismiss after 3s)
  toast((t) => <AutoDismissToast toastId={t.id} message={'Successfully unmatched!'} />, { duration: Infinity });

      posthog.capture('user_unmatched', { connection_id: connectionId });
      router.push('/matches');
    } catch (error) {
      logger.error('Error unmatching:', error);
      ToastService.error('Failed to unmatch. Please try again.');
    } finally {
      setIsUnmatching(false);
      setShowUnmatchMenu(false);
    }
  };

  // Show an actionable toast confirmation (Yes / No) before performing unmatch
  const showUnmatchToastConfirmation = () => {
    if (!connectionId || isUnmatching) return;

    toast((t) => (
      <div className="p-2">
        <div className="text-sm mb-3">Are you sure you want to unmatch {match.name}?</div>
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              await performUnmatch();
            }}
            className="px-4 py-1.5 bg-rose-900/80 border border-rose-500/50 text-rose-200 rounded-full text-sm font-medium hover:bg-rose-900"
          >
            Yes, Unmatch
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-1.5 bg-royal-glass border border-royal-gold/30 text-royal-gold rounded-full text-sm font-medium hover:bg-royal-glass/60"
          >
            No
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  // Small component used to auto-dismiss a toast after 3s using GSAP animation
  const AutoDismissToast: React.FC<{ toastId: string; message: string }> = ({ toastId, message }) => {
    const elRef = useRef<HTMLDivElement | null>(null);
    const dismissRef = useRef<number | null>(null);

    useEffect(() => {
      const node = elRef.current;
      if (!node) return;

      // Visible initial state
      gsap.set(node, { y: 0, opacity: 1, scale: 1 });

      // Auto dismiss after 3s with a smoother exit (translate + fade + scale)
      dismissRef.current = window.setTimeout(() => {
        gsap.to(node, {
          y: -30,
          opacity: 0,
          scale: 0.96,
          duration: 0.55,
          ease: 'power3.out',
          onComplete: () => toast.dismiss(toastId),
        });
      }, 3000) as unknown as number;

      return () => {
        if (dismissRef.current) {
          clearTimeout(dismissRef.current as number);
        }
      };
    }, [toastId]);

    return (
      <motion.div
        ref={elRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragStart={() => {
          // cancel auto-dismiss while user interacts
          if (dismissRef.current) clearTimeout(dismissRef.current as number);
        }}
        onDragEnd={(e: any, info: any) => {
          if (Math.abs(info.offset.x) > 100) {
            toast.dismiss(toastId);
            return;
          }

          // if not dismissed, re-arm timer for a short period to let user continue
          dismissRef.current = window.setTimeout(() => {
            const node = elRef.current;
            if (!node) return;
            gsap.to(node, {
              y: -30,
              opacity: 0,
              scale: 0.96,
              duration: 0.55,
              ease: 'power3.out',
              onComplete: () => toast.dismiss(toastId),
            });
          }, 2000) as unknown as number;
        }}
        initial={{ x: 0, opacity: 0, y: 8 }}
        animate={{ x: 0, opacity: 1, y: 0 }}
        exit={{ x: 0, opacity: 0, y: -20 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="p-0"
        style={{ cursor: 'grab' }}
      >
  <div className="flex items-center space-x-3 px-4 py-3 rounded-xl shadow-xl text-white bg-gradient-to-r from-red-600 to-red-500 border border-red-700/30">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div className="flex-1 text-sm font-medium">{message}</div>
          <button
            onClick={() => toast.dismiss(toastId)}
            aria-label="dismiss"
            className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </motion.div>
    );
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

  const formatTime = (date: Date | string | number | null | undefined) => {
  if (!date) return '';
  // If value isn't a Date, attempt to coerce using the shared helper
  let d: Date | null = date instanceof Date ? date : null;
  if (!d) d = coerceTimestamp(date);
  if (!d || Number.isNaN(d.getTime())) return '';

    // If toLocaleTimeString is not available for this object, fall back safely
    if (typeof (d as any).toLocaleTimeString !== 'function') {
      try {
        const iso = d.toISOString ? d.toISOString() : String(d);
        const match = iso.match(/T?(\d{2}:\d{2})/);
        return match ? match[1] : iso.slice(11,16);
      } catch (e) {
        return '';
      }
    }

    try {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      try {
        return d.toTimeString().split(' ')[0].slice(0,5);
      } catch (e2) {
        return '';
      }
    }
  };

  // Coerce any timestamp-like value into a Date or null at render time to avoid runtime errors
  const coerceTimestamp = (val: any): Date | null => {
    if (!val) return null;
    try {
      if (val instanceof Date) return val;
      // Common server shapes
      if (typeof val === 'object') {
        if (val.$date) {
          const raw = typeof val.$date === 'object' && val.$date.$numberLong ? Number(val.$date.$numberLong) : val.$date;
          const d = new Date(raw as any);
          return Number.isNaN(d.getTime()) ? null : d;
        }
        if (val.$numberLong) {
          const d = new Date(Number(val.$numberLong));
          return Number.isNaN(d.getTime()) ? null : d;
        }
        // If it's a plain object that serializes to ISO string
        if (typeof val.toString === 'function') {
          const maybe = new Date(val.toString());
          return Number.isNaN(maybe.getTime()) ? null : maybe;
        }
        return null;
      }

      // numbers and strings
      const d = new Date(val as any);
      return Number.isNaN(d.getTime()) ? null : d;
    } catch (e) {
      // Log once to help debugging malformed payloads
      try { console.error('coerceTimestamp failed for value:', val); } catch (err) {}
      return null;
    }
  };

  // Prepare a safely coerced messages array for rendering
  const renderedMessages = messages.map(m => ({
    ...m,
    timestamp: coerceTimestamp(m.timestamp)
  } as ChatMessageUI));

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
    <div className="min-h-screen bg-royal-obsidian flex flex-col relative overflow-hidden">
      {/* Header */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed w-full bg-royal-obsidian/90 backdrop-blur-xl border-b border-royal-gold/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-40 px-4 py-3"
          style={{ top: headerOffset > 0 ? `${headerOffset}px` : 'var(--header-height)' }}
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
            className="w-10 h-10 flex items-center justify-center text-royal-gold/70 hover:bg-royal-gold/10 hover:text-royal-gold rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-royal-gold/30 to-royal-gold/10 border border-royal-gold/20 flex items-center justify-center text-royal-gold font-semibold text-lg shadow-lg">
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
            <h1 className="font-semibold text-white text-lg">{match.name}</h1>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${isConnected ? 'text-emerald-400' : 'text-royal-gold/50'}`}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
              {isTyping && (
                <motion.span 
                  className="text-sm text-royal-gold/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  typing...
                </motion.span>
              )}
            </div>
          </div>
          
          {/* Direct Unmatch button (top-right) */}
          <div className="mr-2">
            <button
              onClick={showUnmatchToastConfirmation}
              disabled={isUnmatching}
              title="Unmatch"
              aria-label="Unmatch"
              className={`px-4 py-1.5 bg-rose-900/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 hover:text-rose-200 rounded-full text-sm font-medium transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isUnmatching ? 'shimmer-button' : ''}`}
              aria-busy={isUnmatching}
            >
              {isUnmatching ? 'Unmatching...' : 'Unmatch'}
            </button>
          </div>

          {/* Unmatch Menu */}
          <div className="relative unmatch-menu">
            <button
              onClick={() => setShowUnmatchMenu(!showUnmatchMenu)}
              className="w-10 h-10 flex items-center justify-center text-royal-gold/60 hover:bg-royal-gold/10 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
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
                className="absolute right-0 top-12 bg-royal-obsidian rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.7)] border border-royal-gold/20 py-2 z-50 min-w-[160px]"
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

      {/* Chat messages area */}

      {/* Messages - scrollable area between fixed header (top) and input (bottom) */}
      <div
        className="absolute left-0 right-0 z-10 overflow-y-auto px-4"
        style={{
          top: headerOffset > 0 ? `${headerOffset + headerHeight}px` : '96px',
          bottom: '112px'
        }}
      >
        {loading ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <p className="text-royal-gold/60">Loading messages...</p>
          </motion.div>
  ) : renderedMessages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <motion.div 
              className="w-24 h-24 bg-gradient-to-br from-royal-gold/20 to-royal-gold/5 border border-royal-gold/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(212,175,55,0.15)]"
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
              <CustomIcon name="ri-chat-3-line" className="text-4xl text-royal-gold" />
            </motion.div>
            <h3 className="text-xl font-semibold text-royal-gold mb-3">Start a conversation!</h3>
            <p className="text-royal-gold-light/60 max-w-sm leading-relaxed">
              Send your first message to {match.name} and begin your journey together. 
              Every great relationship starts with a simple "Hello"! 💕
            </p>

          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {renderedMessages.map((msg, index) => (
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
                    delay: index === renderedMessages.length - 1 ? 0.05 : 0
                  }}
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md ${msg.isOwn ? 'order-2' : 'order-1'}`}>
                    <motion.div
                      className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                        msg.isOwn 
                          ? 'bg-royal-gold text-royal-obsidian rounded-br-md font-medium' 
                          : 'bg-white/5 text-royal-gold rounded-bl-md border border-royal-gold/20'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: 'spring', stiffness: 500, duration: 0.1 }}
                    >
                      <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                      
                      <div className={`flex items-center justify-end space-x-1 mt-2 ${
                        msg.isOwn ? 'text-royal-obsidian/70' : 'text-royal-gold/50'
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
        className="fixed bottom-0 w-full bg-royal-obsidian/95 backdrop-blur-xl border-t border-royal-gold/20 p-4 z-20 shadow-[0_-4px_30px_rgba(0,0,0,0.5)]"
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
              className="w-full px-4 py-3 pr-12 bg-royal-gold/5 text-royal-gold placeholder:text-royal-gold/30 border border-royal-gold/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-royal-gold/50 focus:border-royal-gold/50 transition-all duration-200 disabled:opacity-50"
            />
            
            {/* Typing indicator */}
            {isTyping && isConnected && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-8 left-0 text-xs text-royal-gold/60"
              >
                {match.name} is typing...
              </motion.div>
            )}
          </div>
          
          <motion.button
            onClick={sendMessage}
            disabled={!message.trim() || isSending}
            aria-label="Send"
            className="w-14 h-14 bg-gradient-to-br from-royal-gold to-royal-gold-light border-2 border-royal-gold-light/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed android-touch-target"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CustomIcon name="ri-send-plane-fill" className="text-2xl text-royal-obsidian" />
          </motion.button>
        </div>
        
        <div className="text-center mt-3">
          <span className="text-xs text-royal-gold/40 flex items-center justify-center">
            <CustomIcon name="ri-shield-check-line" className="mr-1" />
            Messages are end-to-end encrypted
          </span>
        </div>
      </motion.div>
    </div>
  );
}
