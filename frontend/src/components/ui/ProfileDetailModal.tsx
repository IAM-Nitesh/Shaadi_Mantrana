'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUploadService } from '../../services/image-upload-service';
import CustomIcon from '../CustomIcon';

export interface ProfileForModal {
  _id: string;
  profile: {
    name: string;
    age?: number;
    gender?: string;
    profession?: string;
    occupation?: string;
    images?: string | string[];
    about?: string;
    education?: string;
    nativePlace?: string;
    currentResidence?: string;
    interests?: string[];
    height?: string;
    weight?: string;
    religion?: string;
    caste?: string;
    manglik?: string;
    gotra?: string;
    maritalStatus?: string;
    diet?: string;
    smoking?: string;
    drinking?: string;
    languages?: string[];
    hobbies?: string[];
  };
  verification?: { isVerified: boolean };
  lastActive?: string;
}

interface ProfileDetailModalProps {
  profile: ProfileForModal | null;
  onClose: () => void;
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div className="flex items-start space-x-3 py-3 border-b border-royal-gold/10 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-royal-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <i className={`${icon} text-royal-gold text-sm`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-royal-gold/50 text-xs uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-royal-gold-light font-inter text-sm leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

export default function ProfileDetailModal({ profile, onClose }: ProfileDetailModalProps) {
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setSignedImageUrl(null);
    setImageError(false);
    const fetchImage = async () => {
      try {
        const url = await ImageUploadService.getUserProfilePictureSignedUrlCached(profile._id);
        if (url) setSignedImageUrl(url);
        else setImageError(true);
      } catch {
        setImageError(true);
      }
    };
    fetchImage();
  }, [profile?._id]);

  // Close on back button / escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (profile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [profile]);

  const p = profile?.profile;
  const interests = Array.isArray(p?.interests) ? p.interests : [];

  return (
    <AnimatePresence>
      {profile && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Panel — slides up from bottom */}
          <motion.div
            key="panel"
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[301] bg-royal-obsidian rounded-t-3xl overflow-hidden"
            style={{
              maxHeight: '93vh',
              boxShadow: '0 -20px 60px rgba(212,175,55,0.15), 0 -2px 0 rgba(212,175,55,0.3)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-royal-gold/30" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto hide-scrollbar" style={{ maxHeight: 'calc(93vh - 20px)' }}>

              {/* Hero Photo */}
              <div className="relative w-full" style={{ height: '55vw', maxHeight: 320 }}>
                {signedImageUrl && !imageError ? (
                  <Image
                    src={signedImageUrl}
                    alt={p?.name || 'Profile'}
                    fill
                    className="object-cover object-top"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-royal-gold/20 to-royal-obsidian flex items-center justify-center">
                    <i className="ri-user-3-line text-6xl text-royal-gold/40" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-royal-obsidian via-black/20 to-transparent" />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
                  aria-label="Close profile"
                >
                  <i className="ri-close-line text-lg" />
                </button>

                {/* Name & age hero */}
                <div className="absolute bottom-4 left-5 right-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-3xl font-playfair font-bold text-royal-gold drop-shadow-lg leading-tight">
                        {p?.name || 'Unknown'}
                      </h2>
                      {p?.age && (
                        <p className="text-royal-gold-light/90 font-inter text-base mt-0.5">
                          {p.age} years old
                        </p>
                      )}
                    </div>
                    {profile.verification?.isVerified && (
                      <div className="flex items-center space-x-1 bg-royal-gold/20 border border-royal-gold/40 rounded-full px-2.5 py-1 backdrop-blur-sm mb-1">
                        <i className="ri-shield-check-fill text-royal-gold text-sm" />
                        <span className="text-royal-gold text-xs font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details body */}
              <div className="px-5 pb-12 pt-4 space-y-6">

                {/* Quick stats row */}
                {(p?.profession || p?.occupation || p?.currentResidence || p?.nativePlace) && (
                  <div className="flex flex-wrap gap-2">
                    {(p?.profession || p?.occupation) && (
                      <span className="flex items-center space-x-1.5 bg-royal-gold/10 border border-royal-gold/20 rounded-full px-3 py-1.5 text-royal-gold text-xs font-medium">
                        <i className="ri-briefcase-line" />
                        <span>{p.profession || p.occupation}</span>
                      </span>
                    )}
                    {(p?.currentResidence || p?.nativePlace) && (
                      <span className="flex items-center space-x-1.5 bg-royal-gold/10 border border-royal-gold/20 rounded-full px-3 py-1.5 text-royal-gold text-xs font-medium">
                        <i className="ri-map-pin-line" />
                        <span>{p.currentResidence || p.nativePlace}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* About */}
                {p?.about && (
                  <div>
                    <h3 className="text-royal-gold font-playfair font-semibold text-base mb-2">About</h3>
                    <p className="text-royal-gold-light/80 font-inter text-sm leading-relaxed">{p.about}</p>
                  </div>
                )}

                {/* Core Details */}
                <div>
                  <h3 className="text-royal-gold font-playfair font-semibold text-base mb-3">Details</h3>
                  <div className="bg-royal-gold/5 border border-royal-gold/10 rounded-2xl px-4 divide-y divide-royal-gold/10">
                    <InfoRow icon="ri-book-open-line" label="Education" value={p?.education} />
                    <InfoRow icon="ri-ruler-line" label="Height" value={p?.height} />
                    <InfoRow icon="ri-scales-3-line" label="Weight" value={p?.weight ? `${p.weight} kg` : undefined} />
                    <InfoRow icon="ri-map-pin-2-line" label="Native Place" value={p?.nativePlace} />
                    <InfoRow icon="ri-home-4-line" label="Current Residence" value={p?.currentResidence} />
                    <InfoRow icon="ri-pray-line" label="Religion" value={p?.religion} />
                    <InfoRow icon="ri-group-line" label="Caste" value={p?.caste} />
                    <InfoRow icon="ri-star-line" label="Gotra" value={p?.gotra} />
                    <InfoRow icon="ri-heart-pulse-line" label="Manglik" value={p?.manglik} />
                    <InfoRow icon="ri-user-heart-line" label="Marital Status" value={p?.maritalStatus} />
                    <InfoRow icon="ri-restaurant-line" label="Diet" value={p?.diet} />
                    <InfoRow icon="ri-gender-line" label="Gender" value={p?.gender} />
                  </div>
                </div>

                {/* Interests */}
                {interests.length > 0 && (
                  <div>
                    <h3 className="text-royal-gold font-playfair font-semibold text-base mb-3">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {interests.map((interest, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-royal-gold/10 text-royal-gold border border-royal-gold/25 rounded-full text-xs font-medium font-inter"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {Array.isArray(p?.languages) && p.languages.length > 0 && (
                  <div>
                    <h3 className="text-royal-gold font-playfair font-semibold text-base mb-3">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {p.languages.map((lang, i) => (
                        <span key={i} className="px-3 py-1.5 bg-royal-gold/5 text-royal-gold/80 border border-royal-gold/15 rounded-full text-xs font-inter">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
