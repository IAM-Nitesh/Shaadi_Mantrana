
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Profile } from '../../services/profile-service';

interface SwipeCardProps {
  profile: Profile;
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    try {
      console.warn('Failed to load image for profile:', profile.name);
      setImageError(true);
    } catch (error) {
      console.warn('Error in handleImageError:', error);
    }
  };

  const handleImageLoad = () => {
    try {
      setImageError(false);
    } catch (error) {
      console.warn('Error in handleImageLoad:', error);
    }
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
          {!imageError ? (
            <img
              src={profile.image}
              alt={profile.name}
              className="w-full h-full object-cover object-top"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
              <div className="text-center text-rose-600">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-lg font-medium">{profile.name}</p>
                <p className="text-sm opacity-75">Photo unavailable</p>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" style={{backdropFilter:'blur(2px)'}}></div>
          
          {/* Basic Info */}
          <div className="absolute bottom-4 left-4 right-4 text-white drop-shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-2xl font-bold">{profile.name}</h3>
                <p className="text-lg opacity-90">{profile.age} years old</p>
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
              <span>{profile.profession}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm opacity-90 mt-1">
              <i className="ri-map-pin-line"></i>
              <span>{profile.location}</span>
            </div>
          </div>
        </div>

        {/* Detailed Info */}
        {showDetails && (
          <div className="p-6 space-y-4 animate-fadeIn">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Education</h4>
              <p className="text-gray-600">{profile.education}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">About</h4>
              <p className="text-gray-600">{profile.about}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-rose-100/80 text-rose-600 rounded-full text-sm shadow-sm hover:bg-rose-200/80 transition-colors duration-150"
                  >
                    {interest}
                  </span>
                ))}
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
