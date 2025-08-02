
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Profile } from '../../services/profile-service';
import Image from 'next/image';
import { ImageUploadService } from '../../services/image-upload-service';

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
    };
    verification?: {
      isVerified: boolean;
    };
  };
  onSwipe: (direction: 'left' | 'right') => void;
}

export default function SwipeCard({ profile, onSwipe }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const likeRef = useRef<HTMLDivElement>(null);
  const passRef = useRef<HTMLDivElement>(null);
  // GSAP entrance animation
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
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
          console.log('🖼️ Fetching signed URL for profile:', profile._id);
          const signedUrl = await ImageUploadService.getUserProfilePictureSignedUrlCached(profile._id);
          if (signedUrl) {
            console.log('✅ Signed URL fetched successfully for profile:', profile._id);
            setSignedImageUrl(signedUrl);
          } else {
            console.log('❌ No signed URL returned for profile:', profile._id);
            setImageError(true);
            setIsLoadingImage(false);
          }
        } catch (error) {
          console.error('❌ Failed to fetch signed URL for user:', profile._id, error);
          setImageError(true);
          setIsLoadingImage(false);
        }
      } else {
        console.log('ℹ️ No images field or profile ID for profile:', profile._id);
        setImageError(true);
        setIsLoadingImage(false);
      }
    };

    fetchSignedUrl();
    
    // Debug: Log profile data received by SwipeCard
    console.log('🎯 SwipeCard received profile:', {
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
    console.log('🖼️ Image failed to load, showing fallback');
    setImageError(true);
    setImageLoaded(false);
    setIsLoadingImage(false);
  };

  const handleImageLoad = () => {
    console.log('🖼️ Image loaded successfully');
    setImageLoaded(true);
    setImageError(false);
    setIsLoadingImage(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    try {
      setIsDragging(true);
      const startX = e.clientX;
      
      const handleMouseMove = (e: MouseEvent) => {
        try {
          const currentX = e.clientX;
          const deltaX = currentX - startX;
          setDragX(deltaX);
        } catch (error) {
          console.warn('Error in handleMouseMove:', error);
        }
      };
      
      const handleMouseUp = () => {
        try {
          setIsDragging(false);
          if (Math.abs(dragX) > 100) {
            onSwipe(dragX > 0 ? 'right' : 'left');
          }
          setDragX(0);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        } catch (error) {
          console.warn('Error in handleMouseUp:', error);
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } catch (error) {
      console.warn('Error in handleMouseDown:', error);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    try {
      setIsDragging(true);
      const startX = e.touches[0].clientX;
      
      const handleTouchMove = (e: TouchEvent) => {
        try {
          const currentX = e.touches[0].clientX;
          const deltaX = currentX - startX;
          setDragX(deltaX);
        } catch (error) {
          console.warn('Error in handleTouchMove:', error);
        }
      };
      
      const handleTouchEnd = () => {
        try {
          setIsDragging(false);
          if (Math.abs(dragX) > 100) {
            onSwipe(dragX > 0 ? 'right' : 'left');
          }
          setDragX(0);
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
        } catch (error) {
          console.warn('Error in handleTouchEnd:', error);
        }
      };
      
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    } catch (error) {
      console.warn('Error in handleTouchStart:', error);
    }
  };

  return (
    <div className="relative">
      <div
        ref={cardRef}
        className={`bg-white/70 backdrop-blur-lg border border-white/40 shadow-2xl rounded-3xl overflow-hidden cursor-grab select-none transition-transform duration-200 ${
          isDragging ? 'cursor-grabbing scale-105 shadow-rose-200' : 'hover:scale-[1.025] hover:shadow-2xl'
        }`}
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX * 0.1}deg)`,
          boxShadow: isDragging
            ? '0 8px 32px 0 rgba(244,63,94,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.10)'
            : '0 8px 32px 0 rgba(30,41,59,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.06)',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Main Image */}
        <div className="relative h-96">
          {isLoadingImage && !signedImageUrl ? (
            <div className="w-full h-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
              <div className="text-center text-rose-600">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-lg font-medium">Loading profile photo...</p>
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto"></div>
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
            <Image
              src={signedImageUrl || profileImage}
              alt={`${profile.profile.name || 'Profile'}`}
              layout="fill"
              objectFit="cover"
              objectPosition="top"
              quality={100} // Increased from 95 to 100 for maximum quality
              priority={true} // Priority loading for better performance
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              onError={handleImageError}
              onLoad={handleImageLoad}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="swipe-card-image profile-image-optimized profile-image-maximum-quality" // Apply enhanced optimized CSS classes
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
              <div className="text-center text-rose-600">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-lg font-medium">No profile photo</p>
                <p className="text-sm opacity-75">User hasn't uploaded a photo yet.</p>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" style={{backdropFilter:'blur(2px)'}}></div>
          
          {/* Basic Info */}
          <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-2xl font-bold">{profile.profile.name || 'Unknown'}</h3>
                <p className="text-lg opacity-90">{profile.profile.age || 'Unknown'} years old</p>
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-10 h-10 bg-white/30 hover:bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                style={{ boxShadow: '0 2px 8px 0 rgba(244,63,94,0.10)' }}
              >
                <i className={`ri-${showDetails ? 'arrow-up' : 'information'}-line text-2xl text-rose-500`}></i>
              </button>
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

        {/* Detailed Info */}
        {showDetails && (
          <div className="p-6 space-y-4 animate-fadeIn">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Education</h4>
              <p className="text-gray-600">{profile.profile.education || 'Not specified'}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">About</h4>
              <p className="text-gray-600">{profile.profile.about || 'No information available'}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  console.log('🎯 SwipeCard interests rendering:', {
                    interests: profile.profile.interests,
                    type: typeof profile.profile.interests,
                    length: profile.profile.interests?.length,
                    isArray: Array.isArray(profile.profile.interests)
                  });
                  
                  if (profile.profile.interests && profile.profile.interests.length > 0) {
                    return profile.profile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-rose-100/80 text-rose-600 rounded-full text-sm shadow-sm hover:bg-rose-200/80 transition-colors duration-150"
                      >
                        {interest}
                      </span>
                    ));
                  } else {
                    return <span className="text-gray-500 text-sm">No interests specified</span>;
                  }
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Swipe Indicators */}
      {/* Animated Swipe Indicators */}
      <div
        ref={likeRef}
        className={`pointer-events-none absolute top-20 left-4 px-4 py-2 rounded-xl font-bold text-2xl shadow-lg transition-all duration-200 scale-90 ${
          isDragging && dragX > 50 ? 'opacity-100 scale-110 bg-green-500/90 text-white' : 'opacity-0'
        }`}
        style={{ filter: 'drop-shadow(0 2px 8px rgba(16,185,129,0.18))' }}
      >
        <span className="tracking-widest">LIKE</span>
      </div>
      <div
        ref={passRef}
        className={`pointer-events-none absolute top-20 right-4 px-4 py-2 rounded-xl font-bold text-2xl shadow-lg transition-all duration-200 scale-90 ${
          isDragging && dragX < -50 ? 'opacity-100 scale-110 bg-red-500/90 text-white' : 'opacity-0'
        }`}
        style={{ filter: 'drop-shadow(0 2px 8px rgba(244,63,94,0.18))' }}
      >
        <span className="tracking-widest">PASS</span>
      </div>
    </div>
  );
}
