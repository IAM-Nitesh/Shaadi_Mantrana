'use client';

import { useState, useEffect, useRef } from 'react';
import { safeGsap } from '../../components/SafeGsap';
import CustomIcon from '../../components/CustomIcon';

interface FilterModalProps {
  onClose: () => void;
  onApply: (filters: FilterState, callback?: () => void) => void;
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
      safeGsap.fromTo?.(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: 'power2.out' }
      );
    }
    if (modalRef.current) {
      safeGsap.fromTo?.(
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

  // Initialize state with current filters
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
    setAgeRange(prev => [Math.min(value, prev[1] - 1), prev[1]]);
  };

  const handleMaxAgeChange = (value: number) => {
    setAgeRange(prev => [prev[0], Math.max(value, prev[0] + 1)]);
  };

  const clearAll = () => {
    // Reset to default values
    setAgeRange([18, 70]);
    setSelectedProfessions([]);
    setSelectedCountry('');
    setSelectedState('');
    
    // Also apply the cleared filters immediately to reset the dashboard
    const clearedFilters: FilterState = {
      ageRange: [18, 70],
      selectedProfessions: [],
      selectedCountry: '',
      selectedState: ''
    };
    
    onApply(clearedFilters, () => {
      onClose();
    });
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

  // Check if current modal state differs from the original currentFilters
  const hasChanges = 
    ageRange[0] !== currentFilters.ageRange[0] ||
    ageRange[1] !== currentFilters.ageRange[1] ||
    JSON.stringify(selectedProfessions.sort()) !== JSON.stringify(currentFilters.selectedProfessions.sort()) ||
    selectedCountry !== currentFilters.selectedCountry ||
    selectedState !== currentFilters.selectedState;

  // Check if any filters are active (for visual feedback)
  const hasActiveFilters = selectedProfessions.length > 0 || 
                          selectedCountry !== '' || 
                          selectedState !== '' ||
                          ageRange[0] !== 18 || 
                          ageRange[1] !== 70;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      ref={backdropRef} 
      className="fixed inset-0 z-[70] flex items-end bg-black/70 backdrop-blur-md"
      onClick={handleBackdropClick}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        ref={modalRef}
        className="bg-royal-obsidian/95 backdrop-blur-3xl border-t border-royal-gold/20 w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-none pb-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={applyFilters}
              disabled={!hasChanges}
              className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-md ${
                hasChanges
                  ? 'button-royal border-none cursor-pointer'
                  : 'bg-royal-obsidian border border-royal-gold/20 text-royal-gold/50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center">
                {hasChanges && <CustomIcon name="ri-arrow-right-line" className="mr-1 text-sm" />}
                Apply
              </div>
            </button>
            <h2 className="text-xl font-semibold text-royal-gold">Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-royal-gold/50 hover:bg-royal-gold/10 hover:text-royal-gold rounded-full transition-all duration-200 hover:scale-110"
            aria-label="Close filter modal"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Age Range */}
        <div className="mb-6">
          <h3 className="font-semibold text-royal-gold mb-4">Age Range</h3>
          
          <div className="space-y-4">
            {/* Min Age Slider */}
            <div>
              <label className="text-sm text-royal-gold-light/60 mb-2 block">Minimum Age: {ageRange[0]}</label>
              <input
                type="range"
                min="18"
                max="70"
                value={ageRange[0]}
                onChange={(e) => handleMinAgeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-[#1F1F1F] rounded-lg appearance-none cursor-pointer slider transition-all duration-200 focus:ring-2 focus:ring-royal-gold/50"
                style={{
                  background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${((ageRange[0] - 18) / 52) * 100}%, #1F1F1F ${((ageRange[0] - 18) / 52) * 100}%, #1F1F1F 100%)`
                }}
              />
            </div>
            
            {/* Max Age Slider */}
            <div>
              <label className="text-sm text-royal-gold-light/60 mb-2 block">Maximum Age: {ageRange[1]}</label>
              <input
                type="range"
                min="18"
                max="70"
                value={ageRange[1]}
                onChange={(e) => handleMaxAgeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-[#1F1F1F] rounded-lg appearance-none cursor-pointer slider transition-all duration-200 focus:ring-2 focus:ring-royal-gold/50"
                style={{
                  background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${((ageRange[1] - 18) / 52) * 100}%, #1F1F1F ${((ageRange[1] - 18) / 52) * 100}%, #1F1F1F 100%)`
                }}
              />
            </div>
          </div>
          
          <div className="flex justify-between text-sm text-royal-gold/50 mt-2">
            <span>{ageRange[0]} years</span>
            <span>{ageRange[1]} years</span>
          </div>
        </div>

        {/* Location Filters */}
        <div className="mb-6">
          <h3 className="font-semibold text-royal-gold mb-4">Location</h3>
          
          {/* Country Dropdown */}
          <div className="mb-4">
            <label className="text-sm text-royal-gold-light/60 mb-2 block">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full p-3 border border-royal-gold/20 rounded-lg text-sm text-royal-gold focus:outline-none focus:ring-2 focus:ring-royal-gold/50 transition-all duration-200 bg-royal-obsidian/40 backdrop-blur-md"
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
            <label className="text-sm text-royal-gold-light/60 mb-2 block">State/Province</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              disabled={!selectedCountry}
              className="w-full p-3 border border-royal-gold/20 rounded-lg text-sm text-royal-gold focus:outline-none focus:ring-2 focus:ring-royal-gold/50 disabled:bg-royal-obsidian disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-royal-obsidian/40 backdrop-blur-md"
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
          <h3 className="font-semibold text-royal-gold mb-3">Profession</h3>
          <div className="grid grid-cols-2 gap-2">
            {professions.map((profession) => (
              <button
                key={profession}
                onClick={() => toggleProfession(profession)}
                className={`px-3 py-2 rounded-lg text-sm border transition-all duration-200 transform hover:scale-105 focus:ring-2 focus:ring-royal-gold/50 shadow-sm ${
                  selectedProfessions.includes(profession)
                    ? 'bg-royal-gold/10 text-royal-gold border-royal-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                    : 'bg-royal-obsidian/40 text-royal-gold/60 border-royal-gold/20 hover:border-royal-gold/50'
                }`}
              >
                {profession}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button
            onClick={clearAll}
            disabled={!hasActiveFilters}
            className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${
              hasActiveFilters
                ? 'button-royal-outline'
                : 'border border-royal-gold/20 text-royal-gold/40 cursor-not-allowed opacity-50'
            }`}
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
}