'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface FilterModalProps {
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export interface FilterState {
  ageRange: [number, number];
  selectedProfessions: string[];
  selectedCountry: string;
  selectedState: string;
}

const countryStateData = {
  'India': [
    // States (28) - Alphabetically ordered
    'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 
    'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 
    'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 
    'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 
    'West Bengal'
  ],
  'USA': ['California', 'Florida', 'Georgia', 'Illinois', 'Michigan', 'New York', 'North Carolina', 'Ohio', 'Pennsylvania', 'Texas'],
  'Canada': ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'],
  'UK': ['England', 'Northern Ireland', 'Scotland', 'Wales'],
  'Australia': ['Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia']
};

export default function FilterModal({ onClose, onApply, currentFilters }: FilterModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  // GSAP modal entrance
  useEffect(() => {
    if (backdropRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: 'power2.out' }
      );
    }
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { y: 80, opacity: 0, scale: 0.98, filter: 'blur(8px)' },
        { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'power3.out', delay: 0.05 }
      );
    }
    
    // Add escape key handler
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);
  const [ageRange, setAgeRange] = useState<[number, number]>(currentFilters.ageRange);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>(currentFilters.selectedProfessions);
  const [selectedCountry, setSelectedCountry] = useState<string>(currentFilters.selectedCountry);
  const [selectedState, setSelectedState] = useState<string>(currentFilters.selectedState);
  const [availableStates, setAvailableStates] = useState<string[]>([]);

  const professions = [
    'Software Engineer', 'Doctor', 'Teacher', 'Lawyer', 'Banker',
    'Architect', 'Designer', 'Consultant', 'Entrepreneur', 'Other'
  ];

  const countries = Object.keys(countryStateData);

  useEffect(() => {
    if (selectedCountry && countryStateData[selectedCountry as keyof typeof countryStateData]) {
      const states = countryStateData[selectedCountry as keyof typeof countryStateData];
      // Sort states alphabetically
      const sortedStates = [...states].sort();
      setAvailableStates(sortedStates);
      // Reset state if it's not available in the new country
      if (selectedState && !sortedStates.includes(selectedState)) {
        setSelectedState('');
      }
    } else {
      setAvailableStates([]);
      setSelectedState('');
    }
  }, [selectedCountry, selectedState]);

  const toggleProfession = (profession: string) => {
    setSelectedProfessions(prev =>
      prev.includes(profession)
        ? prev.filter(p => p !== profession)
        : [...prev, profession]
    );
  };

  const handleMinAgeChange = (value: number) => {
    if (value <= ageRange[1]) {
      setAgeRange([value, ageRange[1]]);
    }
  };

  const handleMaxAgeChange = (value: number) => {
    if (value >= ageRange[0]) {
      setAgeRange([ageRange[0], value]);
    }
  };

  const clearAll = () => {
    setAgeRange([18, 40]);
    setSelectedProfessions([]);
    setSelectedCountry('');
    setSelectedState('');
  };

  const applyFilters = () => {
    const filters: FilterState = {
      ageRange,
      selectedProfessions,
      selectedCountry,
      selectedState
    };
    onApply(filters);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      ref={backdropRef} 
      className="fixed inset-0 z-50 flex items-end bg-gradient-to-br from-black/60 via-black/40 to-rose-100/30 backdrop-blur-[2.5px]"
      onClick={handleBackdropClick}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        ref={modalRef}
        className="bg-white/80 backdrop-blur-2xl border border-white/40 w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto shadow-2xl animate-none"
        style={{ boxShadow: '0 8px 32px 0 rgba(244,63,94,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-rose-100/70 rounded-full transition-all duration-200 shadow-sm hover:scale-110"
            style={{ boxShadow: '0 2px 8px 0 rgba(244,63,94,0.08)' }}
            aria-label="Close filter modal"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Age Range */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Age Range</h3>
          
          <div className="space-y-4">
            {/* Min Age Slider */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Minimum Age: {ageRange[0]}</label>
              <input
                type="range"
                min="18"
                max="40"
                value={ageRange[0]}
                onChange={(e) => handleMinAgeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider transition-all duration-200 focus:ring-2 focus:ring-rose-400"
                style={{
                  background: `linear-gradient(to right, #f43f5e 0%, #f43f5e ${((ageRange[0] - 18) / 22) * 100}%, #e5e7eb ${((ageRange[0] - 18) / 22) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
            
            {/* Max Age Slider */}
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Maximum Age: {ageRange[1]}</label>
              <input
                type="range"
                min="18"
                max="40"
                value={ageRange[1]}
                onChange={(e) => handleMaxAgeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider transition-all duration-200 focus:ring-2 focus:ring-rose-400"
                style={{
                  background: `linear-gradient(to right, #f43f5e 0%, #f43f5e ${((ageRange[1] - 18) / 22) * 100}%, #e5e7eb ${((ageRange[1] - 18) / 22) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{ageRange[0]} years</span>
            <span>{ageRange[1]} years</span>
          </div>
        </div>

        {/* Location Filters */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Location</h3>
          
          {/* Country Dropdown */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-2 block">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all duration-200 bg-white/70 backdrop-blur-md"
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          
          {/* State Dropdown */}
          <div>
            <label className="text-sm text-gray-600 mb-2 block">State/Province</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              disabled={!selectedCountry}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 bg-white/70 backdrop-blur-md"
            >
              <option value="">Select State/Province</option>
              {availableStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Profession */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-800 mb-3">Profession</h3>
          <div className="grid grid-cols-2 gap-2">
            {professions.map((profession) => (
              <button
                key={profession}
                onClick={() => toggleProfession(profession)}
                className={`px-3 py-2 rounded-lg text-sm border transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-rose-400 shadow-sm ${
                  selectedProfessions.includes(profession)
                    ? 'bg-white/90 text-rose-500 border-rose-500 border-2 shadow-md'
                    : 'bg-white/80 text-gray-600 border-gray-200 hover:border-rose-300'
                }`}
              >
                {profession}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={clearAll}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium !rounded-button hover:bg-gray-50 transition-all duration-200 shadow-sm hover:scale-105"
          >
            Clear All
          </button>
          <button
            onClick={applyFilters}
            className="flex-1 py-3 bg-white/90 border-2 border-rose-500 text-rose-500 rounded-xl font-medium hover:bg-rose-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}