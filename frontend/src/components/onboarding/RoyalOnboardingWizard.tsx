'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MandalaBackground from '../ui/MandalaBackground';
import RoyalIcon from '../RoyalIcon';
import { ProfileService } from '../../services/profile-service';
import logger from '../../utils/logger';

// Step Components
import PersonalGraceStep from './PersonalGraceStep';
import PhysicalVitalityStep from './PhysicalVitalityStep';
import IntellectualPathStep from './IntellectualPathStep';
import SacredRootsStep from './SacredRootsStep';
import SacredIntentStep from './SacredIntentStep';

interface RoyalOnboardingWizardProps {
  initialProfile: any;
  onComplete: (finalProfile: any) => void;
}

const STEPS = [
  { id: 'personal', title: 'Personal Grace', subtitle: 'The Essence of Identity' },
  { id: 'physical', title: 'Physical & Vitality', subtitle: 'The Temple of Health' },
  { id: 'intellectual', title: 'Intellectual Path', subtitle: 'Wisdom & Prosperity' },
  { id: 'roots', title: 'Sacred Roots', subtitle: 'Lineage & Heritage' },
  { id: 'intent', title: 'Sacred Intent', subtitle: 'Vows & Bio' },
];

export default function RoyalOnboardingWizard({ initialProfile, onComplete }: RoyalOnboardingWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [profile, setProfile] = useState(initialProfile || {});
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentStep = STEPS[currentStepIndex];
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleNext = async () => {
    // Save progress before moving
    await saveProgress();
    
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      // Scroll to top of content
      const mainElement = containerRef.current?.querySelector('main');
      if (mainElement) mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onComplete(profile);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const saveProgress = async () => {
    try {
      setIsSaving(true);
      await ProfileService.updateProfile(profile);
    } catch (error) {
      logger.error('❌ Failed to auto-save profile progress:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (currentStepIndex) {
      case 0: return <PersonalGraceStep data={profile} updateField={updateField} />;
      case 1: return <PhysicalVitalityStep data={profile} updateField={updateField} />;
      case 2: return <IntellectualPathStep data={profile} updateField={updateField} />;
      case 3: return <SacredRootsStep data={profile} updateField={updateField} />;
      case 4: return <SacredIntentStep data={profile} updateField={updateField} />;
      default: return null;
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-[200] bg-royal-obsidian flex flex-col overflow-hidden">
      {/* Background Mandala */}
      <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen blur-sm">
        <MandalaBackground rotationSpeed={240} />
      </div>
      
      {/* Dramatic Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(18,18,18,0.8)_100%)]" />

      {/* Ultra-minimal Fixed Progress Bar at Absolute Top */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-royal-gold/10 z-[210]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-royal-gold via-royal-gold-light to-royal-gold shadow-[0_0_15px_rgba(212,175,55,0.8)]"
        />
        <motion.div 
          initial={{ left: 0 }}
          animate={{ left: `${progress}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1),0_0_20px_rgba(212,175,55,1)]"
        />
      </div>

      {/* Single Scrollable Canvas */}
      <main className="relative z-10 flex-1 overflow-y-auto custom-scrollbar w-full">
        <div className="min-h-full flex flex-col pt-12 pb-24 px-4 max-w-2xl mx-auto">
          
          {/* Scrollable Header */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center space-x-3">
              <RoyalIcon size="md" />
              <div>
                <h1 className="text-royal-gold font-playfair text-xl font-bold drop-shadow-md">Sacred Profiling</h1>
                <p className="text-royal-gold-light/60 text-[10px] tracking-[0.2em] uppercase mt-0.5">Step {currentStepIndex + 1} of {STEPS.length}</p>
              </div>
            </div>
            <div className="text-royal-gold font-medium text-sm drop-shadow-md">{Math.round(progress)}%</div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.98 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col"
            >
              <div className="backdrop-blur-xl bg-white/[0.03] border border-royal-gold/20 rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] flex-1 flex flex-col">
                <div className="space-y-2 mb-10 text-center">
                  <h2 className="text-3xl font-playfair font-bold text-royal-gold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{currentStep.title}</h2>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-royal-gold/50" />
                    <p className="text-royal-gold/80 text-xs tracking-widest uppercase">{currentStep.subtitle}</p>
                    <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-royal-gold/50" />
                  </div>
                </div>

                <div className="flex-1 mb-12">
                  {renderStep()}
                </div>

                {/* Integrated Action Buttons at bottom of card */}
                <div className="flex items-center space-x-4 mt-auto pt-6 border-t border-royal-gold/10">
                  {currentStepIndex > 0 && (
                    <button
                      onClick={handleBack}
                      className="px-6 py-4 text-royal-gold/60 font-medium hover:text-royal-gold transition-colors active:scale-95 border border-royal-gold/20 rounded-xl bg-royal-gold/5 hover:bg-royal-gold/10"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={isSaving}
                    className={`flex-1 group relative overflow-hidden bg-gradient-to-r from-royal-gold via-royal-gold-light to-royal-gold text-gray-900 py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all active:scale-95 disabled:opacity-50 ${isSaving ? 'shimmer-button' : ''}`}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {isSaving ? (
                        <span className="tracking-widest uppercase text-sm font-black">Preserving...</span>
                      ) : (
                        <>
                          <span className="tracking-widest uppercase text-sm font-black mr-2">
                            {currentStepIndex === STEPS.length - 1 ? 'Finalize Vows' : 'Continue Journey'}
                          </span>
                          {currentStepIndex < STEPS.length - 1 && (
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          )}
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
