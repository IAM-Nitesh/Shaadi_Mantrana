'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomIcon from '../../components/CustomIcon';
import { AuthGuardV2 } from '../../components/AuthGuardV2';
import ToastService from '../../services/toastService';
import { matchesCountService } from '../../services/matches-count-service';
import { safeGsap } from '../../components/SafeGsap';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';
import posthog from 'posthog-js';

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
      <CustomIcon
        name="ri-arrow-right-s-line"
        size={20}
        className={danger ? 'text-royal-crimson/50' : 'text-royal-gold/30 group-hover:text-royal-gold/60'}
      />
    </div>
  );

  if (href) {
    return <a href={href} className="block">{inner}</a>;
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

  useEffect(() => {
    const unsubscribe = matchesCountService.subscribe((count) => {
      setMatchesCount(count);
    });
    matchesCountService.fetchCount();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div
            className="bg-royal-obsidian/95 border border-royal-gold/15 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_60px_rgba(212,175,55,0.08)]"
            style={{ animation: 'fadeInScale 0.2s ease-out' }}
          >
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-royal-crimson/10 flex items-center justify-center mx-auto mb-4">
              <CustomIcon name="ri-logout-box-r-line" size={26} className="text-royal-crimson" />
            </div>
            <h3 className="text-lg font-playfair font-bold text-white text-center mb-1">
              Ready to leave?
            </h3>
            <p className="text-sm text-royal-gold/50 text-center mb-6">
              Your sacred journey awaits your return.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelLogout}
                className="flex-1 py-3 rounded-xl border border-royal-gold/20 text-royal-gold/70 text-sm font-medium hover:border-royal-gold/40 hover:text-royal-gold transition-all duration-200"
              >
                Stay
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3 rounded-xl bg-royal-crimson/90 hover:bg-royal-crimson text-white text-sm font-semibold shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_30px_rgba(220,38,38,0.35)] transition-all duration-200"
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
          />
          <SettingsRow
            href="/privacy"
            icon="ri-shield-keyhole-line"
            label="Privacy Policy"
          />
        </SettingsSection>

        {/* ── Danger Zone ── */}
        <SettingsSection title="Session" icon="ri-door-open-line">
          <SettingsRow
            onClick={handleLogout}
            icon="ri-logout-box-r-line"
            label="Log Out"
            sublabel="End your current session"
            danger
          />
        </SettingsSection>

        {/* ── App Version ── */}
        <p className="text-center text-[10px] text-royal-gold/20 tracking-widest uppercase pb-2">
          Shaadi Mantrana · v2.0
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
