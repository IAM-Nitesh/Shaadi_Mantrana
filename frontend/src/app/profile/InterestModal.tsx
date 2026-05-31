'use client';

import React, { useState, useRef, useEffect } from 'react';
import { safeGsap } from '../../components/SafeGsap';


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
  
  // Ensure existingInterests is always an array
  const safeExistingInterests = existingInterests || [];
  // GSAP modal entrance (use safeGsap guards)
  useEffect(() => {
    if (backdropRef.current) {
      safeGsap.fromTo?.(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.32, ease: 'power2.out' }
      );
    }
    if (modalRef.current) {
      safeGsap.fromTo?.(
        modalRef.current,
        { y: 60, opacity: 0, scale: 0.98, filter: 'blur(8px)' },
        { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.48, ease: 'power3.out', delay: 0.04 }
      );
    }
  }, []);
  const [customInterest, setCustomInterest] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const availableInterests = popularInterests.filter(
    interest => !safeExistingInterests.includes(interest)
  );

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = () => {
    const trimmedCustomInterest = customInterest.trim();
    const interestsToAdd = trimmedCustomInterest && !safeExistingInterests.includes(trimmedCustomInterest)
      ? [...selectedInterests, trimmedCustomInterest]
      : selectedInterests;

    Array.from(new Set(interestsToAdd)).forEach(interest => {
      onAdd(interest);
    });
    onClose();
  };

  return (
  <div ref={backdropRef} className="fixed inset-0 z-[200000] flex items-end bg-black/70 backdrop-blur-md px-3 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+12px)]">
      <div
        ref={modalRef}
        className="bg-royal-obsidian/95 backdrop-blur-2xl border border-royal-gold/20 w-full rounded-3xl max-h-[calc(100vh-var(--bottom-nav-height)-env(safe-area-inset-bottom)-48px)] overflow-hidden shadow-2xl animate-none relative z-[200001]"
        style={{ boxShadow: '0 8px 32px 0 rgba(212,175,55,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.08)' }}
      >
        <div className="max-h-[inherit] overflow-y-auto p-6 pb-28">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-royal-gold-light">Add Interests</h2>
        </div>

        {/* Custom Interest */}
        <div className="mb-6">
          <div>
            <input
              type="text"
              placeholder="Add custom interest..."
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (customInterest.trim() || selectedInterests.length > 0)) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              className="w-full px-3 py-2 bg-royal-obsidian border border-royal-gold/30 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal-gold"
              maxLength={20}
            />
          </div>
        </div>

        {/* Popular Interests */}
        <div className="mb-6">
          <h3 className="font-semibold text-royal-gold-light mb-3">Popular Interests</h3>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-2 rounded-full text-sm border transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-royal-gold shadow-sm ${
                  selectedInterests.includes(interest)
                    ? 'bg-royal-gold/20 text-royal-gold border-royal-gold border-2 shadow-md'
                    : 'bg-royal-obsidian/50 text-gray-300 border-royal-gold/20 hover:border-royal-gold/50'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        </div>
        {/* Actions */}
        <div className="absolute inset-x-0 bottom-0 flex space-x-3 border-t border-royal-gold/10 bg-royal-obsidian/95 p-4 shadow-[0_-12px_24px_rgba(0,0,0,0.35)]">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-royal-gold/30 rounded-xl text-gray-300 font-medium !rounded-button hover:bg-royal-gold/10 transition-all duration-200 shadow-sm hover:scale-105"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={selectedInterests.length === 0 && !customInterest.trim()}
            className="flex-1 py-3 bg-royal-obsidian border-2 border-royal-gold text-royal-gold rounded-xl font-medium disabled:opacity-50 hover:bg-royal-gold/10 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Add Interest
          </button>
        </div>
      </div>
    </div>
  );
}
