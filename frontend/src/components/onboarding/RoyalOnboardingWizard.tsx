'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MandalaBackground from '../ui/MandalaBackground';
import Image from 'next/image';
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
    <div ref={containerRef} className="fixed inset-0 z-50 bg-royal-obsidian flex flex-col overflow-hidden">
      {/* Background Mandala */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <MandalaBackground rotationSpeed={180} />
      </div>

      {/* Header with Progress */}
      <header className="relative z-10 pt-[env(safe-area-inset-top,1rem)] px-6 pb-4 bg-royal-obsidian/80 backdrop-blur-md border-b border-royal-gold/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 relative">
              <Image src="/icon.png" alt="Logo" width={32} height={32} className="brightness-125 object-contain" />
            </div>
            <div>
              <h1 className="text-royal-gold font-playfair text-lg font-bold">Sacred Profiling</h1>
              <p className="text-royal-gold/40 text-[10px] tracking-widest uppercase">Step {currentStepIndex + 1} of {STEPS.length}</p>
            </div>
          </div>
          
          <div className="text-right">
             <div className="text-royal-gold font-medium text-xs">{Math.round(progress)}%</div>
          </div>
        </div>

        {/* Premium Progress Bar */}
        <div className="h-[2px] w-full bg-royal-gold/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-royal-gold/40 via-royal-gold to-royal-gold/40 shadow-[0_0_10px_rgba(212,175,55,0.5)]"
          />
        </div>
      </header>

      {/* Step Content */}
      <main className="relative z-10 flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-8 pb-32"
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-playfair font-bold text-white tracking-tight">{currentStep.title}</h2>
              <p className="text-royal-gold-light/60 text-sm italic">{currentStep.subtitle}</p>
            </div>

            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="relative z-20 p-6 bg-gradient-to-t from-royal-obsidian via-royal-obsidian to-transparent pb-[calc(env(safe-area-inset-bottom,1rem)+1.5rem)]">
        <div className="flex items-center space-x-4">
          {currentStepIndex > 0 && (
            <button
              onClick={handleBack}
              className="px-6 py-4 text-royal-gold/60 font-medium hover:text-royal-gold transition-colors active:scale-95"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isSaving}
            className="flex-1 group relative overflow-hidden bg-royal-gold text-royal-obsidian py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="relative z-10">
              {isSaving ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-royal-obsidian border-t-transparent rounded-full animate-spin" />
                  <span>Preserving...</span>
                </div>
              ) : (
                currentStepIndex === STEPS.length - 1 ? 'Finalize Vows' : 'Continue Journey'
              )}
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>
        </div>
      </footer>
    </div>
  );
}
