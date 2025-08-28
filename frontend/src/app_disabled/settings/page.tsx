 'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomIcon from '../../components/CustomIcon';
import ServerAuthGuard from '../../components/ServerAuthGuard';
import ToastService from '../../services/toastService';
import { matchesCountService } from '../../services/matches-count-service';
import { safeGsap } from '../../components/SafeGsap';
import { useServerAuth } from '../../hooks/useServerAuth';
import logger from '../../utils/logger';
import { clientLogout } from '../../utils/client-auth';

function SettingsContent() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useServerAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  const [matchesCount, setMatchesCount] = useState(0);

  useEffect(() => {
    const unsubscribe = matchesCountService.subscribe((count) => {
      setMatchesCount(count);
    });

    // initial fetch
    matchesCountService.fetchCount();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      setShowLogoutConfirm(false);
      // call client logout helper
      await clientLogout();
      // optionally call server-side logout handler
      if (typeof logout === 'function') {
        try { logout(); } catch (e) { /* ignore */ }
      }

      // show a small animation then redirect
      setShowLogoutAnimation(true);
      // try a safe gsap timeline if available (non-blocking)
      try {
        const tl = safeGsap.timeline?.();
        if (tl) {
          tl.to?.('.settings-container', { opacity: 0, duration: 0.4 });
          tl.to?.('.logout-overlay', { opacity: 1, duration: 0.5 });
        }
      } catch (e) {
        // don't fail on animation errors
        logger.warn('GSAP timeline failed', e);
      }

      setTimeout(() => {
        router.push('/');
      }, 700);
    } catch (error) {
      logger.error('Error during logout:', error);
      ToastService.error('An error occurred during logout. Please try again.');
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 relative settings-container">
      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold">Ready to log out?</h3>
              <p className="text-sm text-slate-600">We'll miss you — you can sign in again anytime.</p>
            </div>
            <div className="flex space-x-3">
              <button onClick={cancelLogout} className="flex-1 py-3 rounded-lg bg-rose-50 text-rose-700">Stay</button>
              <button onClick={confirmLogout} className="flex-1 py-3 rounded-lg bg-rose-500 text-white">Log out</button>
            </div>
          </div>
        </div>
      )}

      {/* Optional minimal overlay to show during logout */}
      {showLogoutAnimation && (
        <div className="logout-overlay fixed inset-0 bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-8 rounded-xl shadow-xl text-center">
            <h2 className="font-bold">Logged out</h2>
            <p className="text-sm text-slate-600">Redirecting...</p>
          </div>
        </div>
      )}

  <div className="p-4 space-y-4" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}>
        <h1 className="text-2xl font-semibold">Settings</h1>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Account</h2>
          </div>
          <div className="divide-y">
            <Link href="/profile" className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <CustomIcon name="ri-user-line" className="text-gray-600" />
                </div>
                <span>Edit Profile</span>
              </div>
              <CustomIcon name="ri-arrow-right-s-line" className="text-gray-400" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Support</h2>
          </div>
          <div className="divide-y">
            <Link href="/help" className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <CustomIcon name="ri-question-line" className="text-gray-600" />
                </div>
                <span>Help & Support</span>
              </div>
              <CustomIcon name="ri-arrow-right-s-line" className="text-gray-400" />
            </Link>
            <Link href="/terms" className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <CustomIcon name="ri-file-text-line" className="text-gray-600" />
                </div>
                <span>Terms of Service</span>
              </div>
              <CustomIcon name="ri-arrow-right-s-line" className="text-gray-400" />
            </Link>
            <Link href="/privacy" className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <CustomIcon name="ri-shield-line" className="text-gray-600" />
                </div>
                <span>Privacy Policy</span>
              </div>
              <CustomIcon name="ri-arrow-right-s-line" className="text-gray-400" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <button onClick={handleLogout} className="w-full py-4 bg-rose-500 text-white rounded-xl font-semibold">Logout</button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ServerAuthGuard requireAuth>
      <SettingsContent />
    </ServerAuthGuard>
  );
}
