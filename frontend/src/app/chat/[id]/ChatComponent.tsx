'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';

interface Match {
  name: string;
  image: string;
}

interface ChatComponentProps {
  match: Match;
}

export default function ChatComponent({ match }: ChatComponentProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hi! Nice to meet you 😊',
      sender: 'other',
      timestamp: new Date(Date.now() - 120000),
      encrypted: true
    },
    {
      id: 2,
      text: 'Hello! Thank you for matching with me',
      sender: 'me',
      timestamp: new Date(Date.now() - 60000),
      encrypted: true
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // GSAP animations on component mount
  useEffect(() => {
    try {
      // Animate header entrance
      if (headerRef.current) {
        gsap.fromTo(headerRef.current, 
          { y: -50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
        );
      }

      // Animate chat container
      if (chatContainerRef.current) {
        gsap.fromTo(chatContainerRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.5, delay: 0.2, ease: "power2.out" }
        );
      }

      // Animate existing messages
      const messageElements = document.querySelectorAll('.chat-message');
      messageElements.forEach((element, index) => {
        gsap.fromTo(element,
          { x: index % 2 === 0 ? -30 : 30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, delay: 0.4 + (index * 0.1), ease: "power2.out" }
        );
      });
    } catch (error) {
      // Silently handle GSAP errors
    }
  }, []);

  // Animate new messages
  useEffect(() => {
    try {
      const lastMessage = document.querySelector('.chat-message:last-child');
      if (lastMessage) {
        gsap.fromTo(lastMessage,
          { scale: 0.8, opacity: 0, y: 20 },
          { scale: 1, opacity: 1, y: 0, duration: 0.3, ease: "back.out(1.7)" }
        );
      }
    } catch (error) {
      // Silently handle GSAP errors
    }
  }, [messages.length]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: message,
      sender: 'me' as const,
      timestamp: new Date(),
      encrypted: true
    };

    setMessages([...messages, newMessage]);
    setMessage('');

    // Animate send button
    try {
      const sendButton = document.querySelector('.send-button');
      if (sendButton) {
        gsap.to(sendButton, {
          scale: 0.9,
          duration: 0.1,
          ease: "power2.out",
          yoyo: true,
          repeat: 1
        });
      }
    } catch (error) {
      // Silently handle GSAP errors
    }

    // Simulate response
    setTimeout(() => {
      const responseMessage = {
        id: messages.length + 2,
        text: 'Thank you for your message! 😊',
        sender: 'other' as const,
        timestamp: new Date(),
        encrypted: true
      };
      setMessages(prev => [...prev, responseMessage]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col relative overflow-hidden">
      {/* Glassy background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/30 to-pink-100/30 backdrop-blur-[2.5px] pointer-events-none z-0"></div>
      {/* Header */}
      <div ref={headerRef} className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg z-40 px-4 py-3">
        <div className="flex items-center space-x-3">
          <Link href="/matches" className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <i className="ri-arrow-left-line"></i>
          </Link>
          <img
            src={match.image}
            alt={match.name}
            className="w-10 h-10 rounded-full object-cover object-top"
          />
          <div className="flex-1">
            <h1 className="font-semibold text-gray-800">{match.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 flex items-center justify-center">
              <i className="ri-shield-check-line text-green-500 text-sm" title="End-to-end encrypted"></i>
            </div>
            <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <i className="ri-more-line"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 pt-20 pb-20 px-4 overflow-y-auto z-10">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
              className={`max-w-xs px-4 py-2 rounded-2xl shadow-lg transition-all duration-200 ${
                msg.sender === 'me'
                  ? 'bg-white/90 border-2 border-rose-500 text-rose-500 backdrop-blur-md'
                  : 'bg-white/80 text-gray-800 shadow-md border border-gray-200 backdrop-blur-md'
              }`}
              >
                <p className="text-sm">{msg.text}</p>
                <div className="flex items-center justify-end mt-1 space-x-1">
                  <span className={`text-xs ${
                    msg.sender === 'me' ? 'text-rose-400' : 'text-gray-400'
                  }`} suppressHydrationWarning={true}>
                    {msg.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  {msg.encrypted && (
                    <i className={`ri-lock-line text-xs ${
                      msg.sender === 'me' ? 'text-rose-100' : 'text-gray-400'
                    }`}></i>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 z-20 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="flex-1 flex items-center bg-gray-100/80 rounded-full px-4 py-2 shadow-sm">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            <button className="w-6 h-6 flex items-center justify-center text-gray-500 ml-2 hover:text-rose-500 transition-colors">
              <i className="ri-emotion-line"></i>
            </button>
          </div>
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="send-button w-10 h-10 bg-white/90 border-2 border-rose-500 rounded-full flex items-center justify-center text-rose-500 disabled:opacity-50 hover:bg-rose-50 transition-all duration-200 shadow-lg"
          >
            <i className="ri-send-plane-line"></i>
          </button>
        </div>
        <div className="text-center mt-2">
          <span className="text-xs text-gray-400 flex items-center justify-center">
            <i className="ri-shield-check-line mr-1"></i>
            Messages are end-to-end encrypted
          </span>
        </div>
      </div>
    </div>
  );
}
