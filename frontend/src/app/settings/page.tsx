'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CustomIcon from '../../components/CustomIcon';
import { AuthGuardV2 } from '../../components/AuthGuardV2';
import ToastService from '../../services/toastService';
import { matchesCountService } from '../../services/matches-count-service';
import { safeGsap } from '../../components/SafeGsap';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';
import posthog from 'posthog-js';
import { App } from '@capacitor/app';
import { ProfileService } from '../../services/profile-service';

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

interface SettingsRowProps {
  href?: string;
  onClick?: () => void;
  icon: string;
  label: string;
  sublabel?: string;
  danger?: boolean;
}

function SettingsRow({ href, onClick, icon, label, sublabel, danger }: SettingsRowProps) {
  const inner = (
    <div
      className={`flex items-center justify-between px-5 py-4 transition-all duration-200 group
        ${danger
          ? 'hover:bg-royal-crimson/10 active:bg-royal-crimson/15'
          : 'hover:bg-royal-gold/5 active:bg-royal-gold/10'
        }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200
          ${danger
            ? 'bg-royal-crimson/10 group-hover:bg-royal-crimson/20'
            : 'bg-royal-gold/10 group-hover:bg-royal-gold/15'
          }`}
        >
          <CustomIcon
            name={icon}
            size={18}
            className={danger ? 'text-royal-crimson' : 'text-royal-gold'}
          />
        </div>
        <div>
          <p className={`text-sm font-medium ${danger ? 'text-royal-crimson' : 'text-white'}`}>
            {label}
          </p>
          {sublabel && <p className="text-xs text-royal-gold/40 mt-0.5">{sublabel}</p>}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{inner}</Link>;
  }
  return <button onClick={onClick} className="w-full text-left">{inner}</button>;
}

interface SettingsSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  return (
    <div className="card-modern overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-royal-gold/10">
        <CustomIcon name={icon} size={14} className="text-royal-gold/50" />
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-royal-gold/50">
          {title}
        </span>
      </div>
      {/* Rows */}
      <div className="divide-y divide-royal-gold/5">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Content
// ─────────────────────────────────────────────────────────

function SettingsContent() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  const [matchesCount, setMatchesCount] = useState(0);
  const [appVersion, setAppVersion] = useState<string>(
    // NEXT_PUBLIC_APP_VERSION is baked in at CI build time (e.g. "1.0.24")
    process.env.NEXT_PUBLIC_APP_VERSION || ''
  );

  useEffect(() => {
    const unsubscribe = matchesCountService.subscribe((count) => {
      setMatchesCount(count);
    });
    matchesCountService.fetchCount();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Resolve the displayed version:
  // 1. NEXT_PUBLIC_APP_VERSION (baked by CI — most accurate)
  // 2. Capacitor App.getInfo() on real device (reads native versionName)
  // 3. fallback empty string
  useEffect(() => {
    if (appVersion) return; // already resolved from env var
    App.getInfo()
      .then(info => setAppVersion(info.version))
      .catch(() => {}); // silently ignore in browser/web
  }, []);

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = async () => {
    try {
      setShowLogoutConfirm(false);
      posthog.capture('user_logged_out');
      posthog.reset();
      await logout();

      setShowLogoutAnimation(true);
      try {
        const tl = safeGsap.timeline?.();
        if (tl) {
          tl.to?.('.settings-container', { opacity: 0, duration: 0.35 });
          tl.to?.('.logout-overlay', { opacity: 1, duration: 0.4 });
        }
      } catch (e) {
        logger.warn('GSAP timeline failed', e);
      }

      setTimeout(() => router.push('/'), 700);
    } catch (error) {
      logger.error('Error during logout:', error);
      ToastService.error('An error occurred during logout. Please try again.');
    }
  };

  const cancelLogout = () => setShowLogoutConfirm(false);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-royal-obsidian relative settings-container">

      {/* ── Logout Confirmation Modal ──────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex flex-col items-center justify-center p-4">
          <div
            className="bg-royal-obsidian/95 border border-royal-gold/20 rounded-3xl p-8 w-full max-w-sm shadow-[0_0_60px_rgba(212,175,55,0.12)] flex flex-col items-center justify-center relative overflow-hidden"
            style={{ animation: 'fadeInScale 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-royal-crimson/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <h3 className="text-xl font-playfair font-bold text-white text-center mb-2 relative z-10">
              Ready to leave?
            </h3>
            <p className="text-sm text-royal-gold/60 text-center mb-8 relative z-10">
              Your sacred journey awaits your return.
            </p>
            <div className="flex gap-4 w-full relative z-10">
              <button
                onClick={cancelLogout}
                className="flex-1 py-3.5 rounded-xl border border-royal-gold/30 bg-royal-gold/5 text-royal-gold/90 text-sm font-semibold hover:bg-royal-gold/15 hover:border-royal-gold/60 hover:text-royal-gold shadow-[0_0_10px_rgba(212,175,55,0.05)] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition-all duration-300"
              >
                Stay
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3.5 rounded-xl border border-royal-crimson/30 bg-royal-crimson/10 text-royal-crimson text-sm font-semibold hover:bg-royal-crimson hover:text-white shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:shadow-[0_0_30px_rgba(220,38,38,0.35)] transition-all duration-300"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── Logout Animation Overlay ───────────────────── */}
      {showLogoutAnimation && (
        <div className="logout-overlay fixed inset-0 bg-royal-obsidian flex items-center justify-center z-[9999] opacity-0">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-royal-gold/10 flex items-center justify-center mx-auto">
              <CustomIcon name="ri-moon-line" size={24} className="text-royal-gold" />
            </div>
            <p className="font-playfair text-royal-gold text-lg">Until next time…</p>
            <p className="text-royal-gold/40 text-xs tracking-widest uppercase">Redirecting</p>
          </div>
        </div>
      )}

      {/* ── Page Content ───────────────────────────────── */}
      <div
        className="px-4 space-y-5"
        style={{
          paddingTop: 'calc(var(--header-height, 4rem) + 1.5rem)',
          paddingBottom: 'calc(var(--bottom-nav-height, 5rem) + env(safe-area-inset-bottom, 0px) + 1.5rem)',
        }}
      >
        {/* ── Page Header ── */}
        <div className="mb-2">
          <h1 className="text-3xl font-playfair font-bold text-royal-gold">Settings</h1>
          <p className="text-royal-gold/40 text-xs tracking-widest uppercase mt-1">
            Manage your sacred account
          </p>
        </div>

        {/* ── Account Info Card ── */}
        {user && (
          <div className="card-modern p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-royal-gold/10 flex items-center justify-center flex-shrink-0">
              <CustomIcon name="ri-user-3-line" size={22} className="text-royal-gold" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {(user as any).name || 'Sacred Member'}
              </p>
              <p className="text-royal-gold/40 text-xs truncate">
                {(user as any).phoneNumber || (user as any).email || 'Verified Account'}
              </p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-royal-gold/10 border border-royal-gold/20 text-[10px] text-royal-gold font-medium tracking-wide">
                <CustomIcon name="ri-shield-check-line" size={10} className="text-royal-gold" />
                Verified
              </span>
            </div>
          </div>
        )}

        {/* ── Account Section ── */}
        <SettingsSection title="Account" icon="ri-account-circle-line">
          <SettingsRow
            href="/profile"
            icon="ri-user-heart-line"
            label="Sacred Profile"
            sublabel="Edit your profile details"
          />
        </SettingsSection>

        {/* ── Support Section ── */}
        <SettingsSection title="Support" icon="ri-customer-service-line">
          <SettingsRow
            href="/help"
            icon="ri-question-line"
            label="Help & Support"
            sublabel="FAQs and contact us"
          />
          <SettingsRow
            href="/terms"
            icon="ri-file-list-3-line"
            label="Terms of Condition"
            sublabel="Review our terms"
          />
          <SettingsRow
            href="/privacy"
            icon="ri-shield-keyhole-line"
            label="Privacy Policy"
            sublabel="How we protect you"
          />
        </SettingsSection>

        {/* ── Account Management ── */}
        <SettingsSection title="Account Management" icon="ri-user-settings-line">
          <SettingsRow
            onClick={handleLogout}
            icon="ri-logout-box-r-line"
            label="Log Out"
            sublabel="End your current session"
          />
        </SettingsSection>

        {/* ── App Version ── */}
        <p className="text-center text-[10px] text-royal-gold/20 tracking-widest uppercase pb-2">
          <span className="text-white">Shaadi</span> Mantrana
          {appVersion && (
            <span className="ml-2 text-royal-gold/40">v{appVersion}</span>
          )}
        </p>
      </div>

      {/* Subtle fade-in animation keyframes */}
      <style jsx>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page export
// ─────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <AuthGuardV2>
      <SettingsContent />
    </AuthGuardV2>
  );
}
