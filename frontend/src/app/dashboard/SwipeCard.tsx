'use client';

import React, { useState, useRef, useEffect } from 'react';
import { safeGsap } from '../../components/SafeGsap';
import { RippleButton } from '../../components/RippleButton';
import { BottomSheet } from '../../components/BottomSheet';
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
      images?: string | string[]; // Handle both string and array cases
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
}

export default function SwipeCard({ profile, onSwipe, onDrag }: SwipeCardProps) {
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
      // Reset states for new profile
      setIsLoadingImage(true);
      setImageError(false);
      setImageLoaded(false);
      setSignedImageUrl(null);
      
      // Handle both array and string cases for images
      const images = profile.profile.images;
      const hasImages = images && (
        (Array.isArray(images) && images.length > 0 && images[0]) ||
        (typeof images === 'string' && images.trim().length > 0)
      );
      
      if (hasImages && profile._id) {
        try {
          logger.debug('🖼️ Fetching signed URL for profile:', profile._id);
          const signedUrl = await ImageUploadService.getUserProfilePictureSignedUrlCached(profile._id);
          if (signedUrl) {
            logger.debug('✅ Signed URL fetched successfully for profile:', profile._id);
            setSignedImageUrl(signedUrl);
          } else {
            logger.debug('❌ No signed URL returned for profile:', profile._id);
            setImageError(true);
            setIsLoadingImage(false);
          }
        } catch (error) {
          logger.error('❌ Failed to fetch signed URL for user:', profile._id, error);
          setImageError(true);
          setIsLoadingImage(false);
        }
      } else {
        logger.debug('ℹ️ No images field or profile ID for profile:', profile._id);
        setImageError(true);
        setIsLoadingImage(false);
      }
    };

    fetchSignedUrl();
    
    // Debug: Log profile data received by SwipeCard
    logger.debug('🎯 SwipeCard received profile:', {
      id: profile._id,
      name: profile.profile?.name,
      hasImages: !!profile.profile?.images,
      images: profile.profile?.images,
      imagesType: typeof profile.profile?.images,
      isArray: Array.isArray(profile.profile?.images),
      interests: profile.profile?.interests,
      interestsType: typeof profile.profile?.interests,
      interestsLength: profile.profile?.interests?.length,
      profession: profile.profile?.profession,
      occupation: profile.profile?.occupation,
      currentResidence: profile.profile?.currentResidence,
      nativePlace: profile.profile?.nativePlace
    });
  }, [profile._id, profile.profile.images]);

  // Cleanup effect to ensure proper state reset when profile changes
  useEffect(() => {
    setIsDragging(false);
    setDragX(0);
    setShowDetails(false);
  }, [profile._id]);

  // Fallback swipe handler for edge cases
  const handleSwipeFallback = (direction: 'left' | 'right') => {
    try {
      // Add haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      onSwipe(direction);
    } catch (error) {
      logger.warn('Error in fallback swipe handler:', error);
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  // Get the profile image, handling both array and string cases
  const getProfileImage = () => {
    const images = profile.profile.images;
    if (!images) return '';
    
    if (Array.isArray(images)) {
      return images.length > 0 ? images[0] : '';
    } else if (typeof images === 'string') {
      return images;
    }
    
    return '';
  };

  const profileImage = getProfileImage();

  const handleImageError = () => {
    logger.debug('🖼️ Image failed to load, showing fallback');
    setImageError(true);
    setImageLoaded(false);
    setIsLoadingImage(false);
  };

  const handleImageLoad = () => {
    logger.debug('🖼️ Image loaded successfully');
    setImageLoaded(true);
    setImageError(false);
    setIsLoadingImage(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setIsDragging(true);
      const startX = e.clientX;
      let currentDragX = 0;
      
      const handleMouseMove = (e: MouseEvent) => {
        try {
          e.preventDefault();
          const currentX = e.clientX;
          const deltaX = currentX - startX;
          currentDragX = deltaX;
          setDragX(deltaX);
          onDrag?.(deltaX);

          // GSAP 3D Tilt Effect
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
          if (Math.abs(currentDragX) > 80) {
            if ('vibrate' in navigator) {
              navigator.vibrate(50);
            }
            onSwipe(currentDragX > 0 ? 'right' : 'left');
          }
          setDragX(0);
          onDrag?.(0);
          
          // Reset GSAP Tilt
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
    e.preventDefault();
    try {
      setIsDragging(true);
      const startX = e.touches[0].clientX;
      let currentDragX = 0;
      
      const handleTouchMove = (e: TouchEvent) => {
        try {
          e.preventDefault();
          const currentX = e.touches[0].clientX;
          const deltaX = currentX - startX;
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
          if (Math.abs(currentDragX) > 80) {
            if ('vibrate' in navigator) {
              navigator.vibrate(50);
            }
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
          transform: `translateX(${dragX}px) rotate(${dragX * 0.1}deg) ${showDetails ? 'rotateY(180deg)' : ''}`,
          boxShadow: isDragging
            ? dragX > 0 
              ? '0 8px 32px 0 rgba(16,185,129,0.25), 0 1.5px 8px 0 rgba(0,0,0,0.10)' // Green for like
              : dragX < 0
                ? '0 8px 32px 0 rgba(244,63,94,0.25), 0 1.5px 8px 0 rgba(0,0,0,0.10)' // Red for pass
                : '0 8px 32px 0 rgba(212,175,55,0.2), 0 1.5px 8px 0 rgba(0,0,0,0.10)' // Gold neutral
            : '0 8px 32px 0 rgba(212,175,55,0.15), 0 1.5px 8px 0 rgba(0,0,0,0.06)',
          transformStyle: 'preserve-3d'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Swipe Direction Indicators (Only visible on front and when dragging) */}
        {!showDetails && isDragging && (
          <>
            {/* Like Indicator (Right Swipe) */}
            {dragX > 50 && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg z-20 transform rotate-12">
                LIKE
              </div>
            )}
            
            {/* Pass Indicator (Left Swipe) */}
            {dragX < -50 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg z-20 transform -rotate-12">
                PASS
              </div>
            )}
          </>
        )}
        
        {/* FRONT SIDE */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-royal-obsidian" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" style={{backdropFilter:'blur(1px)'}}></div>
          
          {/* Basic Info */}
          <div className="absolute bottom-4 left-4 right-4 text-royal-gold-light drop-shadow-lg z-10 pointer-events-none">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-3xl font-playfair font-bold text-royal-gold">{profile.profile.name || 'Unknown'}</h3>
                <p className="text-lg opacity-90 font-inter">{profile.profile.age || 'Unknown'} years old</p>
              </div>
              <RippleButton
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(true);
                }}
                hapticFeedback="light"
                className="flex items-center space-x-2 px-3 py-1.5 bg-royal-obsidian/60 hover:bg-royal-obsidian/80 backdrop-blur-md border border-royal-gold/30 rounded-full shadow-lg transition-all duration-200 pointer-events-auto"
              >
                <i className="ri-information-line text-lg text-royal-gold"></i>
                <span className="text-xs font-medium text-royal-gold uppercase tracking-wider">Info</span>
              </RippleButton>
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

        {/* BACK SIDE */}
        <div 
          className="absolute inset-0 rounded-2xl overflow-y-auto bg-royal-obsidian border border-royal-gold/30 p-6 flex flex-col hide-scrollbar" 
          style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-royal-obsidian/90 backdrop-blur pb-2 z-10 border-b border-royal-gold/20">
            <h3 className="text-xl font-playfair font-bold text-royal-gold">Sacred Details</h3>
            <RippleButton
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(false);
              }}
              hapticFeedback="light"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-royal-gold/10 hover:bg-royal-gold/20 transition-colors pointer-events-auto"
            >
              <i className="ri-close-line text-royal-gold text-xl"></i>
            </RippleButton>
          </div>

          <div className="space-y-6 flex-1 text-royal-gold-light pointer-events-auto" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
            {/* Physical Details */}
            <div className="grid grid-cols-2 gap-4">
              {profile.profile.height && (
                <div className="bg-royal-gold/5 p-3 rounded-lg border border-royal-gold/10">
                  <span className="text-xs text-royal-gold/60 uppercase tracking-wider block mb-1">Height</span>
                  <span className="font-medium font-inter">{profile.profile.height}</span>
                </div>
              )}
              {profile.profile.weight && (
                <div className="bg-royal-gold/5 p-3 rounded-lg border border-royal-gold/10">
                  <span className="text-xs text-royal-gold/60 uppercase tracking-wider block mb-1">Weight</span>
                  <span className="font-medium font-inter">{profile.profile.weight} kg</span>
                </div>
              )}
            </div>

            {/* About */}
            {profile.profile.about && (
              <div>
                <h4 className="font-semibold text-royal-gold mb-2 font-playfair">About</h4>
                <p className="text-royal-gold-light/80 font-inter leading-relaxed text-sm">{profile.profile.about}</p>
              </div>
            )}
            
            {/* Education */}
            {profile.profile.education && (
              <div>
                <h4 className="font-semibold text-royal-gold mb-2 font-playfair">Education</h4>
                <p className="text-royal-gold-light/80 font-inter text-sm">{profile.profile.education}</p>
              </div>
            )}

            {/* Interests */}
            <div>
              <h4 className="font-semibold text-royal-gold mb-2 font-playfair">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {profile.profile.interests && profile.profile.interests.length > 0 ? (
                  profile.profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-royal-gold/10 text-royal-gold border border-royal-gold/30 rounded-full text-xs font-medium font-inter shadow-sm"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <span className="text-royal-gold/40 text-xs">No interests specified</span>
                )}
              </div>
            </div>
            
            <div className="pt-8 pb-4 flex justify-center mt-auto">
              <RippleButton
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(false);
                }}
                className="px-8 py-2 bg-royal-gold text-royal-obsidian font-bold rounded-full shadow-lg hover:bg-royal-gold-light transition-all duration-300"
              >
                Return to Profile
              </RippleButton>
            </div>
          </div>
        </div>
      </LiquidGlassBackground>
    </div>
  );
}
