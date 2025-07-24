'use client';

import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';

import CustomIcon from '../../components/CustomIcon';

interface InterestModalProps {
  onClose: () => void;
  onAdd: (interest: string) => void;
  existingInterests: string[];
}

const popularInterests = [
  'Travel', 'Music', 'Reading', 'Cooking', 'Dancing', 'Movies',
  'Photography', 'Sports', 'Yoga', 'Art', 'Technology', 'Fashion',
  'Fitness', 'Nature', 'Literature', 'Gaming', 'Shopping', 'Writing',
  'Gardening', 'Swimming', 'Singing', 'Drawing', 'Cricket', 'Football'
];

export default function InterestModal({ onClose, onAdd, existingInterests }: InterestModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  // GSAP modal entrance
  useEffect(() => {
    if (backdropRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.32, ease: 'power2.out' }
      );
    }
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { y: 60, opacity: 0, scale: 0.98, filter: 'blur(8px)' },
        { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.48, ease: 'power3.out', delay: 0.04 }
      );
    }
  }, []);
  const [customInterest, setCustomInterest] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const availableInterests = popularInterests.filter(
    interest => !existingInterests.includes(interest)
  );

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    if (customInterest.trim() && !existingInterests.includes(customInterest.trim())) {
      setSelectedInterests(prev => [...prev, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const handleSave = () => {
    selectedInterests.forEach(interest => {
      onAdd(interest);
    });
    onClose();
  };

  return (
    <div ref={backdropRef} className="fixed inset-0 z-50 flex items-end bg-gradient-to-br from-black/60 via-black/40 to-rose-100/30 backdrop-blur-[2.5px]">
      <div
        ref={modalRef}
        className="bg-white/80 backdrop-blur-2xl border border-white/40 w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto shadow-2xl animate-none"
        style={{ boxShadow: '0 8px 32px 0 rgba(244,63,94,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Add Interests</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-rose-100/70 rounded-full transition-all duration-200 shadow-sm hover:scale-110"
            style={{ boxShadow: '0 2px 8px 0 rgba(244,63,94,0.08)' }}
            aria-label="Close interest modal"
          >
            <CustomIcon name="ri-close-line" />
          </button>
        </div>

        {/* Custom Interest */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Add custom interest..."
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              maxLength={20}
            />
            <button
              onClick={addCustomInterest}
              disabled={!customInterest.trim()}
              className="px-4 py-2 bg-white border-2 border-rose-500 text-rose-500 rounded-lg font-medium disabled:opacity-50 hover:bg-rose-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Popular Interests */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Popular Interests</h3>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-2 rounded-full text-sm border transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-rose-400 shadow-sm ${
                  selectedInterests.includes(interest)
                    ? 'bg-white/90 text-rose-500 border-rose-500 border-2 shadow-md'
                    : 'bg-white/80 text-gray-600 border-gray-200 hover:border-rose-300'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Interests */}
        {selectedInterests.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Selected ({selectedInterests.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedInterests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-rose-100/80 text-rose-600 rounded-full text-sm flex items-center shadow-sm hover:bg-rose-200/80 transition-colors duration-150"
                >
                  {interest}
                  <button
                    onClick={() => toggleInterest(interest)}
                    className="ml-2 text-rose-400 hover:text-rose-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium !rounded-button hover:bg-gray-50 transition-all duration-200 shadow-sm hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selectedInterests.length === 0}
            className="flex-1 py-3 bg-white/90 border-2 border-rose-500 text-rose-500 rounded-xl font-medium disabled:opacity-50 hover:bg-rose-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Add Selected
          </button>
        </div>
      </div>
    </div>
  );
}