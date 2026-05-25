'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useServiceWorker, useOnlineStatus, usePushNotifications } from '../hooks/useServiceWorker';
import { motion, AnimatePresence } from 'framer-motion';

interface PWAContextType {
  isOnline: boolean;
  isInstalled: boolean;
  isUpdated: boolean;
  showInstallPrompt: boolean;
  showUpdatePrompt: boolean;
  installApp: () => void;
  updateApp: () => void;
  dismissInstallPrompt: () => void;
  dismissUpdatePrompt: () => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const isOnline = useOnlineStatus();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const {
    isSupported: swSupported,
    isInstalled,
    isUpdated,
    skipWaiting,
  } = useServiceWorker({
    onUpdate: () => setShowUpdatePrompt(true),
    onInstall: () => setShowInstallPrompt(true),
  });

  // Handle install prompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle app installed
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
      }
    }
  };

  const updateApp = async () => {
    await skipWaiting();
    setShowUpdatePrompt(false);
    window.location.reload();
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  const dismissUpdatePrompt = () => {
    setShowUpdatePrompt(false);
  };

  const contextValue: PWAContextType = {
    isOnline,
    isInstalled,
    isUpdated,
    showInstallPrompt,
    showUpdatePrompt,
    installApp,
    updateApp,
    dismissInstallPrompt,
    dismissUpdatePrompt,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      
      {/* Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-4 right-4 z-50"
          >
            <div className="card-modern rounded-2xl shadow-2xl p-4 border border-royal-glass-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-royal-gold to-royal-gold-light rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-royal-gold-light">Install Shaadi Mantra</h3>
                    <p className="text-sm text-royal-gold/60 font-inter">Add to home screen for quick access</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={dismissInstallPrompt}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-white/80 font-inter"
                  >
                    Later
                  </button>
                  <button
                    onClick={installApp}
                    className="px-4 py-2 bg-gradient-to-r from-royal-gold to-royal-gold-light text-royal-obsidian text-sm font-medium rounded-lg hover:from-royal-gold-light hover:to-royal-gold shadow-md"
                  >
                    Install
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Prompt */}
      <AnimatePresence>
        {showUpdatePrompt && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-4 right-4 z-50"
          >
            <div className="card-modern rounded-2xl shadow-2xl p-4 border border-royal-glass-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-royal-obsidian to-royal-glass-border border border-royal-gold/20 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-royal-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-royal-gold-light">Update Available</h3>
                    <p className="text-sm text-royal-gold/60 font-inter">A new version is ready to install</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={dismissUpdatePrompt}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-white/80 font-inter"
                  >
                    Later
                  </button>
                  <button
                    onClick={updateApp}
                    className="px-4 py-2 bg-royal-obsidian border border-royal-gold/50 text-royal-gold text-sm font-medium rounded-lg hover:bg-royal-gold/10"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Indicator */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 z-50"
          >
            <div className="bg-royal-obsidian border border-royal-gold/50 text-royal-gold px-4 py-3 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-royal-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-medium text-royal-gold-light">You're offline. Some features may be limited.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PWAContext.Provider>
  );
} 