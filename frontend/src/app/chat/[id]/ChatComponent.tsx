'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageList, Input, MessageBox } from 'react-chat-elements';
import 'react-chat-elements/dist/main.css';
import { AnimatePresence, motion } from 'framer-motion';

interface Match {
  name: string;
  image: string;
  id?: string | number;
}

interface ChatComponentProps {
  match: Match;
}

export default function ChatComponent({ match }: ChatComponentProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{
    id: string;
    position: 'left' | 'right';
    type: 'text';
    text: string;
    date: Date;
    title: string;
    focus: boolean;
    status: 'received' | 'sent' | 'waiting' | 'read';
    notch: boolean;
    avatar?: string;
    titleColor: string;
    forwarded: boolean;
    replyButton: boolean;
    removeButton: boolean;
    retracted: boolean;
  }[]>([
    {
      id: '1',
      position: 'left',
      type: 'text',
      text: 'Hi! Nice to meet you 😊',
      date: new Date(Date.now() - 120000),
      title: match.name,
      avatar: match.image,
      focus: false,
      status: 'received',
      notch: true,
      titleColor: '#000',
      forwarded: false,
      replyButton: false,
      removeButton: false,
      retracted: false,
    },
    {
      id: '2',
      position: 'right',
      type: 'text',
      text: 'Hello! Thank you for matching with me',
      date: new Date(Date.now() - 60000),
      title: 'You',
      avatar: undefined,
      focus: false,
      status: 'sent',
      notch: true,
      titleColor: '#000',
      forwarded: false,
      replyButton: false,
      removeButton: false,
      retracted: false,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages([
      ...messages,
      {
        id: String(messages.length + 1),
        position: 'right',
        type: 'text',
        text: message,
        date: new Date(),
        title: 'You',
        avatar: undefined,
        focus: false,
        status: 'sent',
        notch: true,
        titleColor: '#000',
        forwarded: false,
        replyButton: false,
        removeButton: false,
        retracted: false,
      },
    ]);
    setMessage('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(prev.length + 1),
          position: 'left',
          type: 'text',
          text: 'Thank you for your message! 😊',
          date: new Date(),
          title: match.name,
          avatar: match.image,
          focus: false,
          status: 'received',
          notch: true,
          titleColor: '#000',
          forwarded: false,
          replyButton: false,
          removeButton: false,
          retracted: false,
        },
      ]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg z-40 px-4 py-3">
        <div className="flex items-center space-x-3">
          <Link href="/matches" className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <i className="ri-arrow-left-line"></i>
          </Link>
          <Image
            src={match.image}
            alt={match.name}
            width={40}
            height={40}
            className="rounded-full object-cover object-top"
          />
          <div className="flex-1">
            <h1 className="font-semibold text-gray-800">{match.name}</h1>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 pt-20 pb-24 px-2 overflow-y-auto z-10">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.position === 'right' ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: msg.position === 'right' ? 40 : -40 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`chat-message flex ${msg.position === 'right' ? 'justify-end' : 'justify-start'} mb-2`}
            >
              {/* Message bubble ... */}
              <MessageBox {...msg} />
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 z-20 shadow-2xl">
        <div className="flex items-center space-x-3">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendMessage()}
            multiline={false}
            maxHeight={100}
            rightButtons={
              <motion.button
                onClick={sendMessage}
                disabled={!message.trim()}
                className="w-10 h-10 flex items-center justify-center p-0 bg-transparent shadow-none border-none disabled:opacity-50"
                whileTap={{ scale: 0.85 }}
                style={{ boxShadow: 'none', background: 'none', border: 'none' }}
              >
                <img src="/favicon.svg" alt="Send" className="w-7 h-7" style={{ filter: 'none' }} />
              </motion.button>
            }
          />
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
