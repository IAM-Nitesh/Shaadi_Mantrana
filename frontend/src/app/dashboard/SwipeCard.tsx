'use client';

import React, { useState, useRef, useEffect } from 'react';
import { safeGsap } from '../../components/SafeGsap';
import { LiquidGlassBackground } from '../../components/LiquidGlassBackground';
import { Profile } from '../../services/profile-service';
import { ImageUploadService } from '../../services/image-upload-service';
import { SwipeCardImage } from '../../components/LazyImage';
import logger from '../../utils/logger';
import GoldLeafFrame from '../../components/ui/GoldLeafFrame';

interface SwipeCardProps {
  profile: {
    _id: string;
    profile: {
      name: string;
      age?: number;
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
    };
    verification?: {
      isVerified: boolean;
    };
  };
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  onDrag?: (x: number) => void;
  onTap?: () => void; // Called when user taps without swiping → expand profile
}

export default function SwipeCard({ profile, onSwipe, onDrag, onTap }: SwipeCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const likeRef = useRef<HTMLDivElement>(null);
  const passRef = useRef<HTMLDivElement>(null);

  // GSAP entrance animation
  useEffect(() => {
    if (cardRef.current) {
      safeGsap.fromTo?.(
        cardRef.current,
        { y: 60, opacity: 0, scale: 0.96, filter: 'blur(6px)' },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.7,
          ease: 'power3.out',
        }
      );
    }
  }, [profile]);

  // Fetch signed URL for profile image when profile changes
  useEffect(() => {
    const fetchSignedUrl = async () => {
      setIsLoadingImage(true);
      setImageError(false);
      setImageLoaded(false);
      setSignedImageUrl(null);
      
      const images = profile.profile.images;
      const hasImages = images && (
        (Array.isArray(images) && images.length > 0 && images[0]) ||
        (typeof images === 'string' && images.trim().length > 0)
      );
      
      if (hasImages && profile._id) {
        try {
          const signedUrl = await ImageUploadService.getUserProfilePictureSignedUrlCached(profile._id);
          if (signedUrl) {
            setSignedImageUrl(signedUrl);
          } else {
            setImageError(true);
            setIsLoadingImage(false);
          }
        } catch (error) {
          setImageError(true);
          setIsLoadingImage(false);
        }
      } else {
        setImageError(true);
        setIsLoadingImage(false);
      }
    };

    fetchSignedUrl();
  }, [profile._id, profile.profile.images]);

  // Reset on profile change
  useEffect(() => {
    setIsDragging(false);
    setDragX(0);
  }, [profile._id]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  const getProfileImage = () => {
    const images = profile.profile.images;
    if (!images) return '';
    if (Array.isArray(images)) return images.length > 0 ? images[0] : '';
    if (typeof images === 'string') return images;
    return '';
  };

  const profileImage = getProfileImage();

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    setIsLoadingImage(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    setIsLoadingImage(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    try {
      setIsDragging(true);
      const startX = e.clientX;
      const startY = e.clientY;
      let currentDragX = 0;
      let hasMoved = false;
      
      const handleMouseMove = (e: MouseEvent) => {
        try {
          e.preventDefault();
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;
          if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) hasMoved = true;
          currentDragX = deltaX;
          setDragX(deltaX);
          onDrag?.(deltaX);

          if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;
            safeGsap.to?.(cardRef.current, {
              rotateY: mouseX * 0.05,
              rotateX: -mouseY * 0.05,
              duration: 0.5,
              ease: 'power2.out',
            });
          }
        } catch (error) {
          logger.warn('Error in handleMouseMove:', error);
        }
      };
      
      const handleMouseUp = () => {
        try {
          setIsDragging(false);
          if (!hasMoved && Math.abs(currentDragX) < 10) {
            // This is a tap — expand profile
            onTap?.();
          } else if (Math.abs(currentDragX) > 80) {
            if ('vibrate' in navigator) navigator.vibrate(50);
            onSwipe(currentDragX > 0 ? 'right' : 'left');
          }
          setDragX(0);
          onDrag?.(0);
          
          if (cardRef.current) {
            safeGsap.to?.(cardRef.current, {
              rotateY: 0,
              rotateX: 0,
              duration: 0.8,
              ease: 'elastic.out(1, 0.3)',
            });
          }

          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        } catch (error) {
          logger.warn('Error in handleMouseUp:', error);
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } catch (error) {
      logger.warn('Error in handleMouseDown:', error);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    try {
      setIsDragging(true);
      const startX = e.touches[0].clientX;
      const startY = e.touches[0].clientY;
      let currentDragX = 0;
      let hasMoved = false;
      
      const handleTouchMove = (e: TouchEvent) => {
        try {
          e.preventDefault();
          const deltaX = e.touches[0].clientX - startX;
          const deltaY = e.touches[0].clientY - startY;
          if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) hasMoved = true;
          currentDragX = deltaX;
          setDragX(deltaX);
          onDrag?.(deltaX);
        } catch (error) {
          logger.warn('Error in handleTouchMove:', error);
        }
      };
      
      const handleTouchEnd = () => {
        try {
          setIsDragging(false);
          if (!hasMoved && Math.abs(currentDragX) < 10) {
            // Tap — expand profile
            onTap?.();
          } else if (Math.abs(currentDragX) > 80) {
            if ('vibrate' in navigator) navigator.vibrate(50);
            onSwipe(currentDragX > 0 ? 'right' : 'left');
          }
          setDragX(0);
          onDrag?.(0);
          document.removeEventListener('touchmove', handleTouchMove, { passive: false } as EventListenerOptions);
          document.removeEventListener('touchend', handleTouchEnd);
        } catch (error) {
          logger.warn('Error in handleTouchEnd:', error);
        }
      };
      
      document.addEventListener('touchmove', handleTouchMove, { passive: false } as EventListenerOptions);
      document.addEventListener('touchend', handleTouchEnd);
    } catch (error) {
      logger.warn('Error in handleTouchStart:', error);
    }
  };

  return (
    <div className="relative h-96 w-full max-w-sm mx-auto" style={{ perspective: '1000px' }}>
      <LiquidGlassBackground
        ref={cardRef}
        data-testid="profile-card"
        className={`w-full h-full cursor-grab select-none transition-transform duration-500 border border-royal-gold rounded-2xl ${
          isMounted && isDragging ? 'cursor-grabbing scale-105' : 'hover:scale-[1.01]'
        }`}
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX * 0.1}deg)`,
          boxShadow: isDragging
            ? dragX > 0 
              ? '0 8px 32px 0 rgba(16,185,129,0.25), 0 1.5px 8px 0 rgba(0,0,0,0.10)'
              : dragX < 0
                ? '0 8px 32px 0 rgba(244,63,94,0.25), 0 1.5px 8px 0 rgba(0,0,0,0.10)'
                : '0 8px 32px 0 rgba(212,175,55,0.2), 0 1.5px 8px 0 rgba(0,0,0,0.10)'
            : '0 8px 32px 0 rgba(212,175,55,0.15), 0 1.5px 8px 0 rgba(0,0,0,0.06)',
          transformStyle: 'preserve-3d'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Swipe Direction Indicators */}
        {isDragging && (
          <>
            {dragX > 50 && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg z-20 transform rotate-12">
                LIKE
              </div>
            )}
            {dragX < -50 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg z-20 transform -rotate-12">
                PASS
              </div>
            )}
          </>
        )}

        {/* Profile Image */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-royal-obsidian">
          {isLoadingImage && !signedImageUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-royal-gold">
                <div className="text-6xl mb-4 animate-pulse">👤</div>
                <p className="text-lg font-medium font-playfair tracking-widest uppercase">Revealing Majesty...</p>
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-royal-gold mx-auto"></div>
                </div>
              </div>
            </div>
          ) : imageError && !signedImageUrl && !profileImage ? (
            <div className="w-full h-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
              <div className="text-center text-rose-600">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-lg font-medium">Photo unavailable</p>
                <p className="text-sm opacity-75">Could not load profile picture.</p>
              </div>
            </div>
          ) : signedImageUrl || profileImage ? (
            <GoldLeafFrame className="w-full h-full">
              <SwipeCardImage
                src={signedImageUrl || profileImage}
                alt={`${profile.profile.name || 'Profile'}`}
                className="swipe-card-image profile-image-optimized profile-image-maximum-quality"
                priority={true}
              />
            </GoldLeafFrame>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-royal-gold">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-lg font-medium font-playfair">No profile photo</p>
                <p className="text-sm opacity-75 font-inter">User hasn't uploaded a photo yet.</p>
              </div>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent pointer-events-none" style={{backdropFilter:'blur(1px)'}}></div>
          
          {/* Tap hint badge — small pulsing "Tap to view" */}
          {!isDragging && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 bg-black/40 backdrop-blur-sm border border-royal-gold/25 rounded-full px-3 py-1 pointer-events-none">
              <i className="ri-touch-line text-royal-gold text-xs" />
              <span className="text-royal-gold text-xs font-inter font-medium tracking-wide">Tap to view Profile info</span>
            </div>
          )}

          {/* Basic Info at bottom */}
          <div className="absolute bottom-4 left-4 right-4 text-royal-gold-light drop-shadow-lg z-10 pointer-events-none">
            <div className="mb-2">
              <h3 className="text-3xl font-playfair font-bold text-royal-gold">{profile.profile.name || 'Unknown'}</h3>
              <p className="text-lg opacity-90 font-inter">{profile.profile.age || 'Unknown'} years old</p>
            </div>
            <div className="flex items-center space-x-2 text-sm opacity-90">
              <i className="ri-briefcase-line"></i>
              <span>{profile.profile.profession || profile.profile.occupation || 'Not specified'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm opacity-90 mt-1">
              <i className="ri-map-pin-line"></i>
              <span>{profile.profile.currentResidence || profile.profile.nativePlace || 'Location not specified'}</span>
            </div>
          </div>
        </div>
      </LiquidGlassBackground>
    </div>
  );
}
