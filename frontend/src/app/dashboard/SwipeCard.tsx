
'use client';

import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Profile } from '../../services/profile-service';

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: 'left' | 'right') => void;
}

export default function SwipeCard({ profile, onSwipe }: SwipeCardProps) {
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
        className={`bg-white rounded-2xl shadow-xl overflow-hidden cursor-grab select-none transition-transform duration-200 ${
          isDragging ? 'cursor-grabbing scale-105' : ''
        }`}
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX * 0.1}deg)`,
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {/* Basic Info */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-2xl font-bold">{profile.name}</h3>
                <p className="text-lg opacity-90">{profile.age} years old</p>
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center !rounded-button"
              >
                <i className={`ri-${showDetails ? 'arrow-up' : 'information'}-line`}></i>
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
          <div className="p-6 space-y-4">
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
                    className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-sm"
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
      {isDragging && (
        <>
          <div
            className={`absolute top-20 left-4 px-4 py-2 rounded-xl font-bold text-2xl transition-opacity ${
              dragX > 50 ? 'opacity-100 bg-green-500 text-white' : 'opacity-0'
            }`}
          >
            LIKE
          </div>
          <div
            className={`absolute top-20 right-4 px-4 py-2 rounded-xl font-bold text-2xl transition-opacity ${
              dragX < -50 ? 'opacity-100 bg-red-500 text-white' : 'opacity-0'
            }`}
          >
            PASS
          </div>
        </>
      )}
    </div>
  );
}
