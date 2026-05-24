'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

export default function CapacitorInit() {
  useEffect(() => {
    const initCapacitor = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // 1. Configure Status Bar for Edge-to-Edge
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setStyle({ style: Style.Dark });
          
          // 2. Configure Keyboard
          if (Capacitor.getPlatform() === 'ios') {
            await Keyboard.setAccessoryBarVisible({ isVisible: false });
          }
          await Keyboard.setScroll({ isDisabled: true });

          // 3. Handle Back Button (Android)
          App.addListener('backButton', ({ canGoBack }) => {
            if (!canGoBack) {
              App.exitApp();
            } else {
              window.history.back();
            }
          });

        } catch (error) {
          console.error('Error initializing Capacitor:', error);
        }
      }
    };

    initCapacitor();

    return () => {
      if (Capacitor.isNativePlatform()) {
        App.removeAllListeners();
      }
    };
  }, []);

  return null;
}
