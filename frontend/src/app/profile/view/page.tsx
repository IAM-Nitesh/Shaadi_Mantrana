'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AuthGuardV2 } from '../../../components/AuthGuardV2';
import { ImageUploadService } from '../../../services/image-upload-service';
import { getAuthHeaders } from '../../../services/auth-utils';
import { config as configService } from '../../../services/configService';
import MandalaBackground from '../../../components/ui/MandalaBackground';
import RoyalLoader from '../../../components/RoyalLoader';
import logger from '../../../utils/logger';

interface PublicProfile {
  _id: string;
  userUuid?: string;
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
    languages?: string[];
  };
  verification?: { isVerified: boolean };
  lastActive?: string;
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

function ProfileViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!userId) {
        setError('No user specified');
        setLoading(false);
        return;
    }
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${configService.apiBaseUrl}/api/profiles/public/${userId}`, {
          headers: { ...authHeaders },
        });
        if (!response.ok) throw new Error('Profile not found');
        const data = await response.json();
        if (data.success && data.profile) {
          setProfile(data.profile);
        } else {
          setError('Profile not found');
        }
      } catch (err) {
        logger.error('Failed to fetch public profile:', err);
        setError('Could not load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    if (!profile) return;
    setSignedImageUrl(null);
    setImageError(false);
    ImageUploadService.getUserProfilePictureSignedUrlCached(profile._id)
      .then(url => { if (url) setSignedImageUrl(url); else setImageError(true); })
      .catch(() => setImageError(true));
  }, [profile?._id]);

  const p = profile?.profile;
  const interests = Array.isArray(p?.interests) ? p.interests : [];

  return (
    <div className="min-h-screen bg-royal-obsidian relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none opacity-15 mix-blend-screen blur-sm z-0">
        <MandalaBackground rotationSpeed={300} />
      </div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.03)_0%,transparent_70%)] z-0" />

      {/* Sticky Header */}
      <div
        className="sticky top-0 z-30 flex items-center px-4 py-3 bg-royal-obsidian/80 backdrop-blur-xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center text-royal-gold/80 hover:text-royal-gold hover:bg-royal-gold/10 rounded-full transition-all duration-200 mr-3"
          aria-label="Go back"
        >
          <i className="ri-arrow-left-line text-xl" />
        </button>
        <h1 className="text-royal-gold font-playfair font-bold text-lg">
          {p?.name || 'Profile'}
        </h1>
        {profile?.verification?.isVerified && (
          <div className="ml-2 flex items-center space-x-1 bg-royal-gold/15 border border-royal-gold/30 rounded-full px-2 py-0.5">
            <i className="ri-shield-check-fill text-royal-gold text-xs" />
            <span className="text-royal-gold text-xs font-medium">Verified</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[80vh]">
          <RoyalLoader variant="grand" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-[70vh] px-8 text-center">
          <i className="ri-error-warning-line text-5xl text-royal-gold/40 mb-4" />
          <p className="text-royal-gold-light/60 font-inter">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-2.5 bg-royal-gold text-royal-obsidian font-semibold rounded-full text-sm"
          >
            Go Back
          </button>
        </div>
      ) : profile ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 pb-24"
        >
          {/* Hero Photo */}
          <div className="relative w-full" style={{ height: '60vw', maxHeight: 360 }}>
            {signedImageUrl && !imageError ? (
              <Image
                src={signedImageUrl}
                alt={p?.name || 'Profile'}
                fill
                className="object-cover object-top"
                onError={() => setImageError(true)}
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-royal-gold/20 via-royal-obsidian to-royal-obsidian flex items-center justify-center">
                <i className="ri-user-3-line text-7xl text-royal-gold/30" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-royal-obsidian via-black/30 to-transparent" />

            {/* Hero name */}
            <div className="absolute bottom-5 left-5 right-5">
              <h2 className="text-4xl font-playfair font-bold text-royal-gold drop-shadow-lg">
                {p?.name || 'Unknown'}
              </h2>
              {p?.age && (
                <p className="text-royal-gold-light/90 font-inter text-lg mt-1">{p.age} years old</p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="px-5 pt-5 space-y-6">

            {/* Quick chips */}
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
                <h3 className="text-royal-gold font-playfair font-semibold text-lg mb-2">About</h3>
                <p className="text-royal-gold-light/80 font-inter text-sm leading-relaxed">{p.about}</p>
              </div>
            )}

            {/* Core Details */}
            <div>
              <h3 className="text-royal-gold font-playfair font-semibold text-lg mb-3">Details</h3>
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
                <h3 className="text-royal-gold font-playfair font-semibold text-lg mb-3">Interests</h3>
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
                <h3 className="text-royal-gold font-playfair font-semibold text-lg mb-3">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {p.languages.map((lang, i) => (
                    <span key={i} className="px-3 py-1.5 bg-royal-gold/5 text-royal-gold/80 border border-royal-gold/15 rounded-full text-xs font-inter">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Back button */}
            <div className="pt-4 pb-8">
              <button
                onClick={() => router.back()}
                className="w-full py-4 bg-gradient-to-r from-royal-gold to-royal-gold-dark text-royal-obsidian font-bold rounded-2xl text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(212,175,55,0.3)] active:scale-95 transition-all duration-200"
              >
                ← Back to Chat
              </button>
            </div>

          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

export default function ProfileViewPage() {
  return (
    <AuthGuardV2 requiresCompleteProfile={false}>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-royal-obsidian">
            <RoyalLoader variant="grand" />
        </div>
      }>
        <ProfileViewContent />
      </Suspense>
    </AuthGuardV2>
  );
}
