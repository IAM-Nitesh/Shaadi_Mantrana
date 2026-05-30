'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomIcon from '../../components/CustomIcon';
import { ContactService } from '../../services/contact-service';
import StandardHeader from '../../components/StandardHeader';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileService } from '../../services/profile-service';
import ToastService from '../../services/toastService';
import posthog from 'posthog-js';
import logger from '../../utils/logger';

export default function Help() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const router = useRouter();
  const { logout } = useAuth();

  const handleDeleteClick = () => {
    setDeleteConfirmText('');
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setDeleteConfirmText('');
    setShowDeleteConfirm(false);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      const success = await ProfileService.deleteProfile();
      if (success) {
        setShowDeleteConfirm(false);
        ToastService.success('Your account has been deleted permanently.');
        posthog.capture('user_deleted_account');
        posthog.reset();
        await logout();
        router.push('/');
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      logger.error('Error during account deletion:', error);
      ToastService.error('Failed to delete account. Please contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  const faqs = [
    {
      question: 'How do I create a profile?',
      answer: 'After logging in with your approved phone number, navigate to the Profile section and fill in your details including photos, education, profession, and preferences.'
    },
    {
      question: 'How does matching work?',
      answer: 'Our smart algorithm shows you potential matches based on your preferences. Swipe right to like someone or left to pass. When both users like each other, it creates a match!'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! All your conversations are end-to-end encrypted, and we follow strict privacy guidelines. Your data is never shared with third parties.'
    },
    {
      question: 'How do I get my number approved?',
      answer: 'Contact our admin team to get your phone number approved. Only approved numbers can access the app for security reasons.'
    },
    {
      question: 'Can I change my preferences?',
      answer: 'Yes, you can update your matching preferences anytime from the Settings or Filter options on the main screen.'
    },
    {
      question: 'How do I report someone?',
      answer: 'If you encounter inappropriate behavior, use the report option in the chat or profile section. Our team reviews all reports promptly.'
    },
    {
      question: 'How can I delete my data?',
      answer: 'You can request complete data deletion by contacting our admin team. We will permanently remove all your information within 30 days.'
    }
  ];

  return (
    <div className="min-h-screen bg-royal-obsidian">
      <StandardHeader showBackButton={true} showProfileLink={false} title="Help & Support" />
  {/* Content */}
  <div className="pb-8 px-4" style={{ paddingTop: 'calc(var(--header-height) + 1rem)' }}>
        {/* Contact Support */}
        <div className="card-modern p-6 mb-6 transform hover:scale-105 transition-all duration-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-royal-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CustomIcon name="ri-customer-service-line" className="text-2xl text-royal-gold" />
            </div>
            <h2 className="text-xl font-semibold text-royal-gold font-playfair mb-2">Need Help?</h2>
            <p className="text-white/80 font-inter mb-6">Our admin team is here to help you with any questions or issues.</p>
            
            <div className="space-y-3">
              <button
                onClick={() => ContactService.handleEmailContact()}
                className="flex items-center justify-center space-x-3 w-full bg-royal-glass border border-royal-glass-border border-2 border-royal-gold text-royal-gold py-3 rounded-xl font-medium hover:bg-royal-gold/10 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <CustomIcon name="ri-mail-line" />
                <span>Email Support</span>
              </button>
              <button
                onClick={() => ContactService.handlePhoneContact()}
                className="flex items-center justify-center space-x-3 w-full border border-royal-gold text-royal-gold py-3 rounded-xl font-medium !rounded-button hover:bg-royal-gold/10 transition-all duration-200 transform hover:scale-105"
              >
                <CustomIcon name="ri-phone-line" />
                <span>Call Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-royal-glass border border-royal-glass-border rounded-xl shadow-sm">
          <div className="p-4 border-b border-royal-gold/10">
            <h2 className="font-semibold text-royal-gold font-playfair">Frequently Asked Questions</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {faqs.map((faq, index) => (
              <details key={index} className="group">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-royal-gold/5 transition-colors duration-200">
                  <span className="font-medium text-royal-gold font-playfair">{faq.question}</span>
                  <CustomIcon name="ri-arrow-right-s-line" className="text-royal-gold/40 group-open:rotate-90 transition-transform duration-200" />
                </summary>
                <div className="px-4 pb-4">
                  <p className="text-white/80 font-inter text-sm leading-relaxed">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-royal-glass border border-royal-glass-border rounded-xl p-4 shadow-sm mt-4">
          <div className="text-center">
            <h3 className="font-semibold text-royal-gold font-playfair mb-2">Delete Account</h3>
            <p className="text-sm text-white/80 font-inter mb-4">
              Permanently erase all your data from our systems, including your profile, messages, and matches.
            </p>
            <div className="bg-royal-crimson/10 border border-royal-crimson/30 rounded-lg p-3 mb-4">
              <p className="text-xs text-royal-crimson">
                ⚠️ This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleDeleteClick}
                className="inline-block bg-royal-crimson text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-royal-glass border border-royal-glass-border rounded-xl p-4 shadow-sm mt-4">
          <div className="text-center">
            <h3 className="font-semibold text-royal-gold font-playfair mb-2">Export Your Data</h3>
            <p className="text-sm text-white/80 font-inter mb-4">
              Request a copy of all your personal data stored in our systems.
            </p>
            <button
              onClick={() => ContactService.handleEmailContact(
                'Data Export Request',
                'I would like to request an export of all my personal data from Shaadi Mantrana app.\n\nPlease provide:\n1. My complete profile information\n2. All my photos and documents\n3. Message history and conversations\n4. Matching preferences and activity\n5. Account settings and privacy preferences\n\nContact Email: [Please specify]\nPhone number: [Please specify]'
              )}
              className="inline-block bg-royal-glass border border-royal-glass-border border-2 border-royal-gold text-royal-gold px-4 py-2 rounded-lg text-sm font-medium hover:bg-royal-gold/10 transition-all duration-200 shadow-lg"
            >
              Request Data Export
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="card-modern p-6 mt-4 border border-royal-glass-border">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  <span className="bg-gradient-to-r from-royal-gold via-royal-gold-light to-royal-gold bg-clip-text text-transparent">
                    Shaadi
                  </span>
                  <span className="bg-gradient-to-r from-royal-gold-light via-royal-gold to-royal-gold-light bg-clip-text text-transparent ml-1">
                    Mantrana
                  </span>
                </h3>
                <div className="flex items-center justify-center space-x-1 mt-0.5">
                  <div className="w-5 h-0.5 bg-gradient-to-r from-royal-gold to-royal-gold-light"></div>
                  <div className="w-1 h-1 bg-royal-gold rounded-full"></div>
                  <div className="w-5 h-0.5 bg-gradient-to-r from-royal-gold-light to-royal-gold"></div>
                </div>
              </div>
            </div>
            <div className="text-sm text-white/80 font-inter space-y-1">
              <p className="font-medium text-royal-gold">100% Free Platform</p>
              <p className="text-xs flex items-center justify-center space-x-4 mt-2">
                <span className="flex items-center space-x-1.5">
                  <CustomIcon name="ri-lock-line" className="text-royal-gold text-base" />
                  <span>End-to-end encrypted</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CustomIcon name="ri-shield-check-line" className="text-royal-gold text-base" />
                  <span>HTTPS secured</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CustomIcon name="ri-phone-line" className="text-royal-gold text-base" />
                  <span>Play Store compliant</span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Delete Account Confirmation Modal ──────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex flex-col items-center justify-center p-4">
          <div
            className="bg-royal-obsidian/95 border border-royal-crimson/50 rounded-3xl p-8 w-full max-w-sm shadow-[0_0_60px_rgba(220,38,38,0.15)] flex flex-col items-center justify-center relative overflow-hidden"
            style={{ animation: 'fadeInScale 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-royal-crimson/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="w-16 h-16 rounded-full bg-royal-crimson/20 flex items-center justify-center mb-4 relative z-10">
              <CustomIcon name="ri-alert-fill" size={32} className="text-royal-crimson" />
            </div>

            <h3 className="text-xl font-playfair font-bold text-white text-center mb-2 relative z-10">
              Delete Account?
            </h3>
            <p className="text-sm text-royal-gold/60 text-center mb-4 relative z-10">
              This action is permanent and cannot be undone. All your profile data, matches, and messages will be permanently erased.
            </p>
            <p className="text-xs text-royal-gold/50 text-center mb-3 relative z-10">
              Type <span className="font-mono text-royal-crimson">DELETE</span> to confirm
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="w-full mb-4 px-4 py-3 rounded-xl bg-black/40 border border-royal-crimson/30 text-white text-sm text-center font-mono tracking-widest placeholder:text-royal-gold/30 focus:outline-none focus:border-royal-crimson/60 relative z-10"
            />
            <div className="flex flex-col gap-3 w-full relative z-10">
              <button
                onClick={confirmDelete}
                disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                className="w-full py-3.5 rounded-xl border border-royal-crimson/50 bg-royal-crimson text-white text-sm font-semibold hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="w-full py-3.5 rounded-xl border border-royal-gold/30 bg-transparent text-royal-gold/90 text-sm font-semibold hover:bg-royal-gold/10 transition-all duration-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}