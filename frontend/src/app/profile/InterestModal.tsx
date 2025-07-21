'use client';

import React, { useState } from 'react';
import { interests } from '../../utils/interests';

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Add Interests</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500"
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
                className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                  selectedInterests.includes(interest)
                    ? 'bg-white text-rose-500 border-rose-500 border-2'
                    : 'bg-white text-gray-600 border-gray-200'
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
                  className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-sm flex items-center"
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
            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium !rounded-button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={selectedInterests.length === 0}
            className="flex-1 py-3 bg-white border-2 border-rose-500 text-rose-500 rounded-xl font-medium disabled:opacity-50 hover:bg-rose-50"
          >
            Add Selected
          </button>
        </div>
      </div>
    </div>
  );
}