'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InterestModal from './InterestModal';
import { ImageUploadService, UploadResult } from '../../services/image-upload-service';
import { AuthService } from '../../services/auth-service';
import CustomIcon from '../../components/CustomIcon';
import { gsap } from 'gsap';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { ProfileService } from '../../services/profile-service';
import { AnimatePresence, motion } from 'framer-motion';
import { DatePicker } from '../../components/date-picker';
import * as Popover from '@radix-ui/react-popover';
import { Label } from '@radix-ui/react-label';
import { ClockIcon, CalendarIcon } from '@radix-ui/react-icons';
import { format, setHours, setMinutes, setSeconds } from 'date-fns';
import 'react-time-picker/dist/TimePicker.css';
import { TimePicker } from '../../components/time-picker';
import HeartbeatLoader from '../../components/HeartbeatLoader';

// Demo profile data - ONLY used in static mode (when NEXT_PUBLIC_API_BASE_URL is not configured)
const defaultProfileData = {
  name: '',
  gender: '',
  nativePlace: '',
  currentResidence: '',
  maritalStatus: '',
  manglik: '',
  dateOfBirth: '',
  timeOfBirth: '',
  placeOfBirth: '',
  height: '',
  weight: '',
  complexion: '',
  fatherGotra: '',
  motherGotra: '',
  grandfatherGotra: '',
  grandmotherGotra: '',
  education: '',
  occupation: '',
  annualIncome: '',
  eatingHabit: '',
  smokingHabit: '',
  drinkingHabit: '',
  father: '',
  mother: '',
  brothers: '',
  sisters: '',
  specificRequirements: '',
  settleAbroad: '',
  about: '',
  interests: [],
  verified: false,
  images: []
};

// Helper to format time as hh:mm AM/PM
function formatTime(date: Date) {
  return format(date, 'hh:mm aa');
}

// Helper to convert date to YYYY-MM-DD
function toISODateString(date: string | Date | null): string | null {
  if (!date) return null;
  if (typeof date === 'string') {
    // Try to parse DD-MM-YYYY or other formats
    const parts = date.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      // DD-MM-YYYY to YYYY-MM-DD
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return date;
  }
  // Check if date is valid before calling toISOString
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

export default function Profile() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeButtonEnabled, setWelcomeButtonEnabled] = useState(false);
  const [welcomeTimeLeft, setWelcomeTimeLeft] = useState(15);
  const [profile, setProfile] = useState<any>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  const [tiltAnimationFields, setTiltAnimationFields] = useState<{[key: string]: boolean}>({});
  const [validationTimeouts, setValidationTimeouts] = useState<{[key: string]: NodeJS.Timeout}>({});
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('hasSeenOnboarding') === 'true' : false
  );

  // GSAP refs for animations
  const headerRef = useRef<HTMLDivElement>(null);
  const profileInfoRef = useRef<HTMLDivElement>(null);
  const profileDetailsRef = useRef<HTMLDivElement>(null);

  // GSAP animations for onboarding overlay
  useEffect(() => {
    if (showWelcome && welcomeRef.current && typeof gsap !== 'undefined') {
      // Initial setup - hide elements
      gsap.set(welcomeRef.current, { 
        opacity: 0, 
        y: 50,
        scale: 0.9,
        rotation: -2
      });
      
      // Create timeline for smooth entrance animation
      const tl = gsap.timeline({ delay: 0.2 });
      
      // Animate in with brand-style entrance
      tl.to(welcomeRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.8,
        ease: "back.out(1.7)"
      })
      // Add subtle bounce effect
      .to(welcomeRef.current, {
        y: -5,
        duration: 0.3,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      }, "-=0.2");
      
      // Trigger canvas-confetti animation
      const triggerConfetti = () => {
        // Fire multiple confetti bursts
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        // Additional bursts for more dramatic effect
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
        }, 250);
        
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 400);
        
        // Continuous confetti shower
        const confettiInterval = setInterval(() => {
          confetti({
            particleCount: 30,
            spread: 90,
            origin: { y: 0.6 }
          });
        }, 2000);
        
        // Stop confetti after 10 seconds
        setTimeout(() => {
          clearInterval(confettiInterval);
        }, 10000);
      };
      
      // Trigger confetti after a short delay
      setTimeout(triggerConfetti, 500);
    }
  }, [showWelcome]);

  // For date picker state
  const [dateValue, setDateValue] = useState({ startDate: null, endDate: null });
  // For time picker state
  const [clockTime, setClockTime] = useState(new Date());
  const [showClock, setShowClock] = useState(false);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimeouts).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [validationTimeouts]);

  // Update dateValue and clockTime when profile is loaded
  useEffect(() => {
    if (profile) {
      const dateString = profile.dateOfBirth ? toISODateString(profile.dateOfBirth) : null;
      setDateValue(dateString ? { startDate: dateString, endDate: dateString } : { startDate: null, endDate: null });
      if (profile.timeOfBirth) {
        // If already a Date, use as is; if string, parse to Date
        let t = profile.timeOfBirth;
        let d: Date;
        if (typeof t === 'string') {
          d = new Date(`1970-01-01T${t}`);
          if (isNaN(d.getTime())) d = new Date();
        } else if (t instanceof Date) {
          d = t;
        } else {
          d = new Date();
        }
        setClockTime(d);
      } else {
        setClockTime(new Date());
      }
    }
  }, [profile]);

  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push('/');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  // Fetch profile from backend after authentication
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingProfile(true);
    ProfileService.getUserProfile().then((apiProfile) => {
      if (apiProfile) {
        // Use API profile directly - no merging with demo data
        console.log('📋 API Profile from MongoDB:', apiProfile);
        console.log('🎯 Dropdown values in loaded profile:', {
          gender: apiProfile.gender,
          maritalStatus: apiProfile.maritalStatus,
          manglik: apiProfile.manglik,
          complexion: apiProfile.complexion,
          eatingHabit: apiProfile.eatingHabit,
          smokingHabit: apiProfile.smokingHabit,
          drinkingHabit: apiProfile.drinkingHabit,
          settleAbroad: apiProfile.settleAbroad
        });
        setProfile(apiProfile);
        setShowWelcome(!!apiProfile.isFirstLogin);
        console.log('✅ Profile set successfully');
      } else {
        // Only use default data if we're in static mode (no API_BASE_URL)
        const isStaticMode = !process.env.NEXT_PUBLIC_API_BASE_URL;
        if (isStaticMode) {
          console.log('📋 Static mode: Using default profile data');
          setProfile(defaultProfileData);
          setShowWelcome(true); // Show onboarding for new users
        } else {
          console.log('📋 MongoDB mode: No profile found, user needs to create profile');
          // In MongoDB mode, create an empty profile structure for new users
          const emptyProfile = {
            email: localStorage.getItem('userEmail') || '',
            role: 'user',
            verified: false,
            lastActive: new Date().toISOString(),
            isFirstLogin: true,
            // Initialize all required fields as empty
            name: '',
            gender: '',
            nativePlace: '',
            currentResidence: '',
            maritalStatus: '',
            manglik: '',
            dateOfBirth: '',
            timeOfBirth: '',
            placeOfBirth: '',
            height: '',
            weight: '',
            complexion: '',
            education: '',
            occupation: '',
            annualIncome: '',
            eatingHabit: '',
            smokingHabit: '',
            drinkingHabit: '',
            father: '',
            mother: '',
            brothers: '',
            sisters: '',
            fatherGotra: '',
            motherGotra: '',
            grandfatherGotra: '',
            grandmotherGotra: '',
            specificRequirements: '',
            settleAbroad: '',
            about: '',
            interests: []
          };
          console.log('📋 Created empty profile:', emptyProfile);
          setProfile(emptyProfile);
          setShowWelcome(true);
        }
      }
      setLoadingProfile(false);
    }).catch((error) => {
      console.error('❌ Error loading profile:', error);
      // Only fallback to default data in static mode
      const isStaticMode = !process.env.NEXT_PUBLIC_API_BASE_URL;
      if (isStaticMode) {
        setProfile(defaultProfileData);
        setShowWelcome(true);
      } else {
        // In MongoDB mode, show error state
        console.error('❌ MongoDB connection error - cannot load profile');
        setProfile(null);
        setShowWelcome(false);
      }
      setLoadingProfile(false);
    });
  }, [isAuthenticated]);

  // Show onboarding overlay if isFirstLogin is true, hasSeenOnboarding is false, and profile completion is less than 75%
  useEffect(() => {
    if (profile && typeof profile.isFirstLogin !== 'undefined') {
      const seen = typeof window !== 'undefined' ? localStorage.getItem('hasSeenOnboarding') === 'true' : hasSeenOnboarding;
      const profileCompletion = localStorage.getItem('profileCompletion');
      const completion = profileCompletion ? parseInt(profileCompletion) : 0;
      
      // Only show onboarding if profile is incomplete (< 75%) and user hasn't seen it
      const shouldShowOnboarding = !!profile.isFirstLogin && !seen && completion < 75;
      setShowWelcome(shouldShowOnboarding);
      
      console.log('🎯 Profile page onboarding check:', {
        isFirstLogin: profile.isFirstLogin,
        hasSeenOnboarding: seen,
        profileCompletion: completion,
        shouldShowOnboarding,
        profile: profile
      });
      
      // If profile is 75%+ complete, ensure onboarding is marked as seen
      if (completion >= 75 && !seen) {
        console.log('✅ Profile 75%+ complete, marking onboarding as seen');
        localStorage.setItem('hasSeenOnboarding', 'true');
        localStorage.setItem('isFirstLogin', 'false');
        setShowWelcome(false);
      }
    }
  }, [profile, hasSeenOnboarding]);

  // GSAP premium entrance animation
  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated) {
      const elements = [headerRef.current, profileInfoRef.current, profileDetailsRef.current].filter(Boolean);
      if (elements.length > 0) {
        gsap.set(elements, { opacity: 0, y: 40, filter: 'blur(8px)' });
        gsap.to(elements, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.13,
          delay: 0.18
        });
      }
    }
  }, [isAuthenticated]);

  // Simple modal animation
  useEffect(() => {
    if (showInterestModal && typeof window !== 'undefined') {
      const overlay = document.querySelector('.modal-overlay');
      const content = document.querySelector('.modal-content');
      
      if (overlay && content) {
        try {
          gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
          gsap.fromTo(content, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
        } catch (error) {
          // Silently handle GSAP errors
        }
      }
    }
  }, [showInterestModal]);

  // Add lockout timer for onboarding overlay
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let interval: NodeJS.Timeout;
    if (showWelcome) {
      setWelcomeButtonEnabled(false);
      setWelcomeTimeLeft(15);
      interval = setInterval(() => {
        setWelcomeTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setWelcomeButtonEnabled(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      timer = setTimeout(() => {
        setWelcomeButtonEnabled(true);
        clearInterval(interval);
      }, 15000);
    }
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [showWelcome]);

  // Debug profile state changes
  useEffect(() => {
    if (profile) {
      console.log('🔄 Profile state updated:', {
        gender: profile.gender,
        maritalStatus: profile.maritalStatus,
        manglik: profile.manglik,
        complexion: profile.complexion,
        eatingHabit: profile.eatingHabit,
        smokingHabit: profile.smokingHabit,
        drinkingHabit: profile.drinkingHabit,
        settleAbroad: profile.settleAbroad
      });
      
      // Log the specific fields that should be visible
      console.log('🎯 Fields that should be visible in UI:', {
        manglik: profile.manglik || 'Not specified',
        complexion: profile.complexion || 'Not specified', 
        eatingHabit: profile.eatingHabit || 'Not specified',
        smokingHabit: profile.smokingHabit || 'Not specified',
        drinkingHabit: profile.drinkingHabit || 'Not specified',
        settleAbroad: profile.settleAbroad || 'Not specified'
      });
      
      // Also check the actual dropdown elements
      const dropdownFields = ['gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad', 'grandfatherGotra', 'grandmotherGotra'];
      console.log('🎯 Dropdown element values:');
      dropdownFields.forEach(field => {
        const el = document.querySelector(`[data-field="${field}"]`) as HTMLSelectElement;
        if (el) {
          console.log(`  ${field} element value: "${el.value}"`);
        } else {
          console.log(`  ${field} element: not found`);
        }
      });
      
      // Also check height dropdowns
      const feetEl = document.querySelector(`[data-field="height-feet"]`) as HTMLSelectElement;
      const inchesEl = document.querySelector(`[data-field="height-inches"]`) as HTMLSelectElement;
      if (feetEl && inchesEl) {
        console.log(`  height-feet element value: "${feetEl.value}"`);
        console.log(`  height-inches element value: "${inchesEl.value}"`);
      } else {
        console.log(`  height dropdowns: not found`);
      }
    }
  }, [profile]);

  const requiredFields = [
    'name', 'gender', 'nativePlace', 'currentResidence', 'maritalStatus', 'manglik',
    'dateOfBirth', 'timeOfBirth', 'placeOfBirth', 'height', 'weight', 'complexion',
    'education', 'occupation', 'annualIncome', 'eatingHabit', 'smokingHabit', 'drinkingHabit',
    'father', 'mother', 'brothers', 'sisters', 'settleAbroad',
    'fatherGotra', 'motherGotra', 'grandfatherGotra', 'grandmotherGotra'
  ];

  const handleSave = async () => {
    console.log('🔍 Starting validation...');
    console.log('📋 Current profile data:', profile);
    console.log('📋 Required fields:', requiredFields);
    
    // Debug dropdown values specifically
    const dropdownFields = ['gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad', 'grandfatherGotra', 'grandmotherGotra'];
    console.log('🎯 Dropdown field values:');
    dropdownFields.forEach(field => {
      console.log(`  ${field}: "${profile[field]}" (type: ${typeof profile[field]})`);
    });
    
    // Debug interests field specifically
    console.log('🎯 Interests field:', {
      value: profile.interests,
      type: typeof profile.interests,
      isArray: Array.isArray(profile.interests),
      length: Array.isArray(profile.interests) ? profile.interests.length : 'N/A'
    });
    
    // Validate required fields
    const errors: {[key: string]: boolean} = {};
    const validationDetails: {[key: string]: any} = {};
    
    requiredFields.forEach(field => {
      let fieldValue = profile[field];
      let isEmpty = false;
      let reason = '';
      
      // Special handling for height field (two dropdowns)
      if (field === 'height') {
        // Check if both height dropdowns have values
        const feetEl = document.querySelector(`[data-field="height-feet"]`) as HTMLSelectElement;
        const inchesEl = document.querySelector(`[data-field="height-inches"]`) as HTMLSelectElement;
        
        if (feetEl && inchesEl && feetEl.value && inchesEl.value && feetEl.value.trim() !== '' && inchesEl.value.trim() !== '') {
          isEmpty = false;
          reason = 'valid height selection (both feet and inches)';
          console.log(`  📏 Height: feet="${feetEl.value}", inches="${inchesEl.value}", isEmpty: false`);
        } else {
          isEmpty = true;
          reason = 'missing height selection (feet or inches)';
          console.log(`  ❌ Height: feet="${feetEl?.value || 'undefined'}", inches="${inchesEl?.value || 'undefined'}", isEmpty: true`);
        }
      } else {
        console.log(`🔍 Checking field "${field}":`, fieldValue, `(type: ${typeof fieldValue})`);
        
        // Handle different data types
        if (fieldValue === null || fieldValue === undefined) {
          // For dropdown fields, check if the actual element has a value
          const dropdownFields = ['gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad', 'grandfatherGotra', 'grandmotherGotra'];
          if (dropdownFields.includes(field)) {
            const el = document.querySelector(`[data-field="${field}"]`) as HTMLSelectElement;
            if (el && el.value && el.value.trim() !== '') {
              // Element has a value, so the field is valid
              isEmpty = false;
              reason = 'valid dropdown selection (from element)';
              console.log(`  📝 Field "${field}" is dropdown, element value: "${el.value}", isEmpty: false`);
            } else {
              isEmpty = true;
              reason = 'null/undefined and no element value';
              console.log(`  ❌ Field "${field}" is null/undefined and element has no value`);
            }
          } else {
            isEmpty = true;
            reason = 'null/undefined';
            console.log(`  ❌ Field "${field}" is null/undefined`);
          }
        } else if (typeof fieldValue === 'string') {
          // For dropdown fields, check if it's a valid selection (not empty string)
          const dropdownFields = ['gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad', 'grandfatherGotra', 'grandmotherGotra'];
          if (dropdownFields.includes(field)) {
            // For dropdowns, any non-empty string is valid
            isEmpty = fieldValue.trim() === '';
            reason = isEmpty ? 'empty dropdown selection' : 'valid dropdown selection';
            console.log(`  📝 Field "${field}" is dropdown, value: "${fieldValue}", isEmpty: ${isEmpty}`);
          } else {
            isEmpty = fieldValue.trim() === '';
            reason = isEmpty ? 'empty string after trim' : 'valid string';
            console.log(`  📝 Field "${field}" is string, trimmed: "${fieldValue.trim()}", isEmpty: ${isEmpty}`);
          }
        } else if (typeof fieldValue === 'number') {
          isEmpty = fieldValue === 0 || isNaN(fieldValue);
          reason = isEmpty ? (fieldValue === 0 ? 'zero value' : 'NaN') : 'valid number';
          console.log(`  🔢 Field "${field}" is number: ${fieldValue}, isEmpty: ${isEmpty}`);
        } else if (typeof fieldValue === 'boolean') {
          isEmpty = false; // Boolean values are always valid
          reason = 'boolean (always valid)';
          console.log(`  ✅ Field "${field}" is boolean: ${fieldValue}, always valid`);
        } else if (Array.isArray(fieldValue)) {
          isEmpty = fieldValue.length === 0;
          reason = isEmpty ? 'empty array' : `array with ${fieldValue.length} items`;
          console.log(`  📋 Field "${field}" is array:`, fieldValue, `, isEmpty: ${isEmpty}`);
        } else if (fieldValue instanceof Date) {
          isEmpty = isNaN(fieldValue.getTime());
          reason = isEmpty ? 'invalid date' : 'valid date';
          console.log(`  📅 Field "${field}" is Date:`, fieldValue, `, isEmpty: ${isEmpty}`);
        } else {
          isEmpty = !fieldValue;
          reason = isEmpty ? 'falsy value' : 'truthy value';
          console.log(`  ❓ Field "${field}" is other type:`, fieldValue, `, isEmpty: ${isEmpty}`);
        }
      }
      
      validationDetails[field] = {
        value: fieldValue,
        type: typeof fieldValue,
        isEmpty,
        reason
      };
      
      if (isEmpty) {
        errors[field] = true;
        console.log(`❌ Field "${field}" is empty or invalid:`, fieldValue, `(type: ${typeof fieldValue}) - Reason: ${reason}`);
      } else {
        console.log(`✅ Field "${field}" is valid:`, fieldValue, `(type: ${typeof fieldValue}) - Reason: ${reason}`);
      }
    });
    
    console.log('🔍 Validation errors:', errors);
    console.log('🔍 Validation details:', validationDetails);
    console.log('📋 Profile data:', profile);
    
    // Log which fields are missing data-field attributes
    const missingDataFields = requiredFields.filter(field => {
      // Special handling for height field
      if (field === 'height') {
        const feetEl = document.querySelector(`[data-field="height-feet"]`);
        const inchesEl = document.querySelector(`[data-field="height-inches"]`);
        return !feetEl || !inchesEl;
      }
      const el = document.querySelector(`[data-field="${field}"]`);
      return !el;
    });
    if (missingDataFields.length > 0) {
      console.log('⚠️ Fields missing data-field attributes:', missingDataFields);
    }
    
    // Log which fields are failing validation
    const failingFields = Object.keys(errors);
    console.log('❌ Fields failing validation:', failingFields);
    failingFields.forEach(field => {
      console.log(`  ${field}: ${validationDetails[field]?.reason || 'unknown reason'}`);
    });
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Show error message
      alert('Please fill in all required fields marked in red.');
      
      console.log('🎨 Applying error styling to fields:', Object.keys(errors));
      
      // Add error styling to all missing fields
      Object.keys(errors).forEach(fieldName => {
        let el: HTMLElement | null = null;
        
        // Special handling for height field
        if (fieldName === 'height') {
          el = document.querySelector(`[data-field="height-feet"]`) as HTMLElement;
          console.log(`🎯 Height field - feet element:`, el);
          if (el) {
            el.classList.add('border-red-500', 'bg-red-50', 'animate-shake');
            el.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.3)';
            el.style.borderRadius = '8px';
            el.style.padding = '8px';
            el.style.margin = '4px';
            console.log(`✅ Applied styling to height-feet element`);
          }
        } else {
          el = document.querySelector(`[data-field="${fieldName}"]`) as HTMLElement;
          console.log(`🎯 Field "${fieldName}" - element:`, el);
        }
        
        if (el) {
          // Add red border and background to highlight missing fields
          el.classList.add('border-red-500', 'bg-red-50', 'animate-shake');
          // Add a text box effect around the field
          el.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.3)';
          el.style.borderRadius = '8px';
          el.style.padding = '8px';
          el.style.margin = '4px';
          console.log(`✅ Applied styling to "${fieldName}" element`);
        } else {
          console.log(`⚠️ Could not find element with data-field="${fieldName}"`);
          
          // Special handling for interests field if element not found
          if (fieldName === 'interests') {
            const interestsContainer = document.querySelector('[data-field="interests"]');
            console.log(`🎯 Interests container:`, interestsContainer);
            if (interestsContainer) {
              interestsContainer.classList.add('border-red-500', 'bg-red-50', 'animate-shake');
              (interestsContainer as HTMLElement).style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.3)';
              (interestsContainer as HTMLElement).style.borderRadius = '8px';
              (interestsContainer as HTMLElement).style.padding = '8px';
              (interestsContainer as HTMLElement).style.margin = '4px';
              console.log(`✅ Applied styling to interests container`);
            }
          }
        }
      });
      
      // Animate first error field and scroll to it
      const firstError = Object.keys(errors)[0];
      console.log('🎯 First error field:', firstError);
      let el: Element | null = null;
      
      if (firstError === 'height') {
        el = document.querySelector(`[data-field="height-feet"]`);
      } else {
        el = document.querySelector(`[data-field="${firstError}"]`);
      }
      
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return; // Prevent save
    }

    try {
      // Show loading state
      const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement;
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
      }

      // Filter out empty enum fields before sending to backend
      const enumFields = ['gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad'];
      const cleanProfile = { ...profile };
      
      // Only remove enum fields if they are explicitly empty strings, not if they're undefined
      // This allows dropdown values to be saved even if they weren't in the initial profile
      enumFields.forEach(field => {
        if (cleanProfile[field] === '') {
          delete cleanProfile[field];
        }
        // Don't delete if undefined or null - let the backend handle it
      });
      
      console.log('🧹 Cleaned profile data:', cleanProfile);
      
      // Prepare profile data for API
      const profileData = {
        ...cleanProfile,
        isFirstLogin: false // Set to false when profile is complete
      };

      console.log('📤 Sending profile data to backend:', profileData);
      console.log('🎯 Dropdown values being sent:', {
        gender: profileData.gender,
        maritalStatus: profileData.maritalStatus,
        manglik: profileData.manglik,
        complexion: profileData.complexion,
        eatingHabit: profileData.eatingHabit,
        smokingHabit: profileData.smokingHabit,
        drinkingHabit: profileData.drinkingHabit,
        settleAbroad: profileData.settleAbroad
      });

      // Call backend API to update profile
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4500';
      const response = await fetch(`${apiBaseUrl}/api/profiles/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to save profile (${response.status})`);
      }

      const result = await response.json();
      
      console.log('📥 Backend response after save:', result);
      
      if (result.success) {
        // Refresh profile data from backend to ensure all fields are properly updated
        let refreshedProfile = null;
        try {
          refreshedProfile = await ProfileService.getUserProfile();
          if (refreshedProfile) {
            setProfile(refreshedProfile);
            console.log('🔄 Profile refreshed from backend:', refreshedProfile);
          }
        } catch (refreshError) {
          console.error('Error refreshing profile:', refreshError);
          // Fallback to local update if refresh fails
          setProfile(prev => ({
            ...prev,
            ...profileData
          }));
        }
        
        // Calculate profile completion
        const calculateProfileCompletion = (profile: any): number => {
          if (!profile) return 0;

          const requiredFields = [
            'name', 'gender', 'dateOfBirth', 'height', 'weight', 'complexion',
            'education', 'occupation', 'annualIncome', 'nativePlace', 'currentResidence',
            'maritalStatus', 'father', 'mother', 'about'
          ];

          const optionalFields = [
            'timeOfBirth', 'placeOfBirth', 'manglik', 'eatingHabit', 'smokingHabit', 
            'drinkingHabit', 'brothers', 'sisters', 'fatherGotra', 'motherGotra',
            'grandfatherGotra', 'grandmotherGotra', 'specificRequirements', 'settleAbroad',
            'interests'
          ];

          let completedFields = 0;

          // Check required fields (weight: 2x)
          requiredFields.forEach(field => {
            if (profile[field] && profile[field].toString().trim() !== '') {
              completedFields += 2;
            }
          });

          // Check optional fields (weight: 1x)
          optionalFields.forEach(field => {
            if (profile[field] && profile[field].toString().trim() !== '') {
              completedFields += 1;
            }
          });

          // Calculate percentage (max 100%)
          const percentage = Math.min(100, Math.round((completedFields / (requiredFields.length * 2 + optionalFields.length)) * 100));
          return percentage;
        };

        const completion = calculateProfileCompletion(refreshedProfile || { ...profile, ...profileData });
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('isFirstLogin', completion >= 75 ? 'false' : 'true');
          localStorage.setItem('hasSeenOnboarding', 'true');
          localStorage.setItem('profileCompletion', completion.toString());
        }
        
        // Show success message
        if (completion >= 75) {
          alert('Profile saved successfully! You can now use Discover and Matches.');
        } else {
          alert('Profile saved successfully! Please complete more fields to access all features.');
        }
        
        // Exit edit mode
        setIsEditing(false);
        setFieldErrors({});
        setShowWelcome(false); // Hide onboarding overlay
        
        // Clear all error styling from fields
        document.querySelectorAll('[data-field]').forEach(el => {
          const element = el as HTMLElement;
          element.classList.remove('border-red-500', 'bg-red-50', 'animate-shake');
          element.style.boxShadow = '';
          element.style.borderRadius = '';
          element.style.padding = '';
          element.style.margin = '';
        });
        
        // Redirect to dashboard after a short delay if profile is 75% complete
        if (completion >= 75) {
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      } else {
        throw new Error(result.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile. Please try again.';
      alert(errorMessage);
    } finally {
      // Reset button state
      const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement;
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
      }
    }
    setHasSeenOnboarding(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenOnboarding', 'true');
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('');

    try {
      // Basic file validation
      if (!file.type.startsWith('image/')) {
        setUploadMessage('❌ Please select a valid image file (JPEG, PNG, GIF, WEBP)');
        setIsUploading(false);
        return;
      }

      setUploadMessage('🔍 Checking image quality...');

      // Validate image quality first
      const qualityCheck = await ImageUploadService.validateImageQuality(file);
      if (!qualityCheck.isValid) {
        setUploadMessage(`❌ ${qualityCheck.error || 'Invalid image quality'}`);
        setIsUploading(false);
        return;
      }

      setUploadMessage('🤖 Detecting face in image...');

      // Upload and validate face
      const result: UploadResult = await ImageUploadService.uploadProfileImage(file);
      
      if (result.success && result.imageUrl) {
        // Update profile with new image
        setProfile(prev => ({
          ...prev,
          images: [result.imageUrl!, ...((prev.images || []).slice(1))]
        }));
        
        // Clear the success message after a short delay
        setTimeout(() => {
          setUploadMessage('');
        }, 1000);
      } else {
        setUploadMessage(`❌ ${result.error || 'Failed to upload image'}`);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setUploadMessage('❌ Error processing image. Please try again with a different photo.');
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addInterest = (interest: string) => {
    const currentInterests = profile.interests || [];
    if (!currentInterests.includes(interest)) {
      setProfile({...profile, interests: [...currentInterests, interest]});
    }
  };

  const removeInterest = (index: number) => {
    const currentInterests = profile.interests || [];
    const newInterests = currentInterests.filter((_, i) => i !== index);
    setProfile({...profile, interests: newInterests});
  };

  const calculateAge = (dateOfBirth: string | Date | undefined) => {
    if (!dateOfBirth) return '-';
    
    let birthDate: Date;
    
    if (dateOfBirth instanceof Date) {
      birthDate = dateOfBirth;
    } else if (typeof dateOfBirth === 'string') {
      // Handle different date string formats
      if (dateOfBirth.includes('-')) {
        // Try to parse as ISO date or DD-MM-YYYY format
        if (dateOfBirth.includes('T') || dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
          birthDate = new Date(dateOfBirth);
        } else {
          // Assume DD-MM-YYYY format
          birthDate = new Date(dateOfBirth.split('-').reverse().join('-'));
        }
      } else {
        birthDate = new Date(dateOfBirth);
      }
    } else {
      return '-';
    }
    
    if (isNaN(birthDate.getTime())) return '-';
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Get appropriate icon for occupation
  const getOccupationIcon = (occupation: string | undefined) => {
    if (!occupation) return 'ri-briefcase-line';
    
    const occupationLower = occupation.toLowerCase();
    
    if (occupationLower.includes('doctor') || occupationLower.includes('physician') || occupationLower.includes('surgeon')) {
      return 'ri-heart-pulse-line';
    } else if (occupationLower.includes('engineer') || occupationLower.includes('developer') || occupationLower.includes('programmer')) {
      return 'ri-code-s-slash-line';
    } else if (occupationLower.includes('teacher') || occupationLower.includes('professor') || occupationLower.includes('lecturer')) {
      return 'ri-book-open-line';
    } else if (occupationLower.includes('lawyer') || occupationLower.includes('advocate') || occupationLower.includes('attorney')) {
      return 'ri-scales-3-line';
    } else if (occupationLower.includes('accountant') || occupationLower.includes('cpa') || occupationLower.includes('finance')) {
      return 'ri-calculator-line';
    } else if (occupationLower.includes('designer') || occupationLower.includes('artist') || occupationLower.includes('creative')) {
      return 'ri-palette-line';
    } else if (occupationLower.includes('manager') || occupationLower.includes('director') || occupationLower.includes('executive')) {
      return 'ri-user-settings-line';
    } else if (occupationLower.includes('sales') || occupationLower.includes('marketing')) {
      return 'ri-customer-service-2-line';
    } else if (occupationLower.includes('nurse') || occupationLower.includes('medical')) {
      return 'ri-heart-pulse-line';
    } else if (occupationLower.includes('student')) {
      return 'ri-graduation-cap-line';
    } else if (occupationLower.includes('business') || occupationLower.includes('entrepreneur')) {
      return 'ri-building-line';
    } else if (occupationLower.includes('chef') || occupationLower.includes('cook')) {
      return 'ri-restaurant-line';
    } else if (occupationLower.includes('driver') || occupationLower.includes('transport')) {
      return 'ri-steering-line';
    } else if (occupationLower.includes('police') || occupationLower.includes('officer')) {
      return 'ri-shield-user-line';
    } else if (occupationLower.includes('army') || occupationLower.includes('military') || occupationLower.includes('defense')) {
      return 'ri-shield-star-line';
    } else if (occupationLower.includes('pilot') || occupationLower.includes('airline')) {
      return 'ri-flight-takeoff-line';
    } else if (occupationLower.includes('journalist') || occupationLower.includes('reporter') || occupationLower.includes('media')) {
      return 'ri-article-line';
    } else if (occupationLower.includes('architect') || occupationLower.includes('construction')) {
      return 'ri-building-2-line';
    } else if (occupationLower.includes('scientist') || occupationLower.includes('researcher')) {
      return 'ri-microscope-line';
    } else if (occupationLower.includes('pharmacist') || occupationLower.includes('chemist')) {
      return 'ri-medicine-bottle-line';
    } else if (occupationLower.includes('dentist')) {
      return 'ri-tooth-line';
    } else if (occupationLower.includes('veterinarian') || occupationLower.includes('vet')) {
      return 'ri-heart-line';
    } else if (occupationLower.includes('photographer') || occupationLower.includes('camera')) {
      return 'ri-camera-line';
    } else if (occupationLower.includes('musician') || occupationLower.includes('singer')) {
      return 'ri-music-2-line';
    } else if (occupationLower.includes('actor') || occupationLower.includes('actress') || occupationLower.includes('artist')) {
      return 'ri-movie-line';
    } else if (occupationLower.includes('writer') || occupationLower.includes('author')) {
      return 'ri-quill-pen-line';
    } else if (occupationLower.includes('fashion') || occupationLower.includes('stylist')) {
      return 'ri-t-shirt-line';
    } else if (occupationLower.includes('fitness') || occupationLower.includes('trainer') || occupationLower.includes('coach')) {
      return 'ri-run-line';
    } else if (occupationLower.includes('consultant') || occupationLower.includes('advisor')) {
      return 'ri-user-voice-line';
    } else if (occupationLower.includes('analyst') || occupationLower.includes('data')) {
      return 'ri-bar-chart-line';
    } else if (occupationLower.includes('hr') || occupationLower.includes('human resource')) {
      return 'ri-team-line';
    } else if (occupationLower.includes('it') || occupationLower.includes('technology')) {
      return 'ri-computer-line';
    } else if (occupationLower.includes('bank') || occupationLower.includes('banking')) {
      return 'ri-bank-line';
    } else if (occupationLower.includes('insurance')) {
      return 'ri-shield-check-line';
    } else if (occupationLower.includes('real estate') || occupationLower.includes('property')) {
      return 'ri-home-line';
    } else if (occupationLower.includes('retail') || occupationLower.includes('shop')) {
      return 'ri-store-line';
    } else if (occupationLower.includes('hotel') || occupationLower.includes('hospitality')) {
      return 'ri-hotel-line';
    } else if (occupationLower.includes('government') || occupationLower.includes('public')) {
      return 'ri-government-line';
    } else if (occupationLower.includes('freelancer') || occupationLower.includes('self-employed')) {
      return 'ri-user-star-line';
    } else {
      return 'ri-briefcase-line'; // Default icon
    }
  };

  // Generate acronym from occupation
  const getOccupationAcronym = (occupation: string | undefined) => {
    if (!occupation || typeof occupation !== 'string') return '-';
    
    const trimmed = occupation.trim();
    if (trimmed.length === 0) return '-';
    
    // Split by spaces and get first letter of each word
    const words = trimmed.split(' ').filter(word => word.length > 0);
    
    if (words.length === 1) {
      // Single word: take first 3 letters
      return trimmed.substring(0, 3).toUpperCase();
    } else if (words.length === 2) {
      // Two words: first letter of each
      return (words[0][0] + words[1][0]).toUpperCase();
    } else {
      // Multiple words: first letter of first two words
      return (words[0][0] + words[1][0]).toUpperCase();
    }
  };

  // Field validation rules
  const fieldValidationRules = {
    name: {
      pattern: /^[a-zA-Z\s]+$/,
      maxLength: 30,
      minLength: 1,
      message: 'Name should only contain letters and spaces (max 30 characters)'
    },
    nativePlace: {
      pattern: /^[a-zA-Z\s]+$/,
      maxLength: 10,
      minLength: 1,
      message: 'Native place should only contain letters and spaces (max 10 characters)'
    },
    currentResidence: {
      pattern: /^[a-zA-Z\s]+$/,
      maxLength: 30,
      minLength: 1,
      message: 'Current residence should only contain letters and spaces (max 30 characters)'
    },
    placeOfBirth: {
      pattern: /^[a-zA-Z\s]+$/,
      maxLength: 30,
      minLength: 1,
      message: 'Birth place should only contain letters and spaces (max 30 characters)'
    },
    weight: {
      pattern: /^[0-9]+$/,
      maxLength: 3,
      minLength: 1,
      message: 'Weight should be numbers only (30-200 kg)',
      customValidation: (value: string) => {
        const num = parseInt(value);
        return num >= 30 && num <= 200;
      }
    },
    education: {
      pattern: /^[a-zA-Z0-9\s\.\,\&]+$/,
      maxLength: 20,
      minLength: 1,
      message: 'Education should only contain letters, numbers, spaces, and basic punctuation (max 20 characters)'
    },
    occupation: {
      pattern: /^[a-zA-Z0-9\s\.\,\&]+$/,
      maxLength: 20,
      minLength: 1,
      message: 'Occupation should only contain letters, numbers, spaces, and basic punctuation (max 20 characters)'
    },
    annualIncome: {
      pattern: /^[0-9]+$/,
      maxLength: 8,
      minLength: 1,
      message: 'Annual income should be numbers only (no symbols)'
    },
    father: {
      pattern: /^[a-zA-Z\s]+$/,
      maxLength: 20,
      minLength: 1,
      message: 'Father\'s name should only contain letters and spaces (max 20 characters)'
    },
    mother: {
      pattern: /^[a-zA-Z\s]+$/,
      maxLength: 20,
      minLength: 1,
      message: 'Mother\'s name should only contain letters and spaces (max 20 characters)'
    },
    brothers: {
      pattern: /^[0-9]+$/,
      maxLength: 2,
      minLength: 1,
      message: 'Number of brothers should be numbers only (0-10)',
      customValidation: (value: string) => {
        const num = parseInt(value);
        return num >= 0 && num <= 10;
      }
    },
    sisters: {
      pattern: /^[0-9]+$/,
      maxLength: 2,
      minLength: 1,
      message: 'Number of sisters should be numbers only (0-10)',
      customValidation: (value: string) => {
        const num = parseInt(value);
        return num >= 0 && num <= 10;
      }
    },
    specificRequirements: {
      pattern: /^[a-zA-Z0-9\s\.\,\!\?\-\:\;]+$/,
      maxLength: 50,
      minLength: 1,
      message: 'Requirements should only contain letters, numbers, spaces, and basic punctuation (max 50 characters)'
    },
    about: {
      pattern: /^[a-zA-Z0-9\s\.\,\!\?\-\:\;]+$/,
      maxLength: 500,
      minLength: 20,
      message: 'About should only contain letters, numbers, spaces, and basic punctuation (20-500 characters)'
    },
    fatherGotra: {
      pattern: /^[a-zA-Z]+$/,
      maxLength: 20,
      minLength: 1,
      message: 'Gotra should only contain letters (max 20 characters)'
    },
    motherGotra: {
      pattern: /^[a-zA-Z]+$/,
      maxLength: 20,
      minLength: 1,
      message: 'Gotra should only contain letters (max 20 characters)'
    },
    grandfatherGotra: {
      pattern: /^[a-zA-Z]+$/,
      maxLength: 20,
      minLength: 1,
      message: 'Gotra should only contain letters (max 20 characters)'
    },
    grandmotherGotra: {
      pattern: /^[a-zA-Z]+$/,
      maxLength: 20,
      minLength: 1,
      message: 'Gotra should only contain letters (max 20 characters)'
    }
  };

  // Validate field input
  const validateFieldInput = (fieldName: string, value: string): { isValid: boolean; message: string } => {
    const rules = fieldValidationRules[fieldName as keyof typeof fieldValidationRules];
    if (!rules) return { isValid: true, message: '' };

    // Check if value is empty
    if (!value || value.trim() === '') {
      return { isValid: false, message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required` };
    }

    const trimmedValue = value.trim();

    // Check length
    if (trimmedValue.length < rules.minLength) {
      return { isValid: false, message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} should be at least ${rules.minLength} characters` };
    }

    if (trimmedValue.length > rules.maxLength) {
      return { isValid: false, message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} should not exceed ${rules.maxLength} characters` };
    }

    // Check pattern
    if (!rules.pattern.test(trimmedValue)) {
      return { isValid: false, message: rules.message };
    }

    // Check custom validation if exists
    if ('customValidation' in rules && rules.customValidation && !rules.customValidation(trimmedValue)) {
      return { isValid: false, message: rules.message };
    }

    return { isValid: true, message: '' };
  };

  // Helper function to generate input className with animations
  const getInputClassName = (fieldName: string) => {
    const baseClasses = "w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500";
    const errorClasses = "border-red-500";
    const normalClasses = "border-gray-200";
    
    if (tiltAnimationFields[fieldName]) {
      return `${baseClasses} animate-tilt-error-glow`;
    } else if (fieldErrors[fieldName]) {
      return `${baseClasses} ${errorClasses} animate-shake`;
    } else {
      return `${baseClasses} ${normalClasses}`;
    }
  };

  // Handle field change with debounced validation and tilt animation
  const handleFieldChange = (fieldName: string, value: string) => {
    // Clear existing timeout for this field
    if (validationTimeouts[fieldName]) {
      clearTimeout(validationTimeouts[fieldName]);
    }

    // Update profile immediately
    setProfile(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: false
      }));
      
      // Clear error styling from the field
      const el = document.querySelector(`[data-field="${fieldName}"]`) as HTMLElement;
      if (el) {
        el.classList.remove('border-red-500', 'bg-red-50', 'animate-shake');
        el.style.boxShadow = '';
        el.style.borderRadius = '';
        el.style.padding = '';
        el.style.margin = '';
      }
    }

    // Clear any existing tilt animation for this field
    setTiltAnimationFields(prev => ({
      ...prev,
      [fieldName]: false
    }));

    // Set a timeout for validation (1.5 seconds after user stops typing)
    const timeout = setTimeout(() => {
      const validation = validateFieldInput(fieldName, value);
      
      // Update field errors
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: !validation.isValid
      }));

      // Trigger tilt animation if validation fails
      if (!validation.isValid) {
        console.log(`❌ ${fieldName}: ${validation.message}`);
        
        // Add tilt animation class
        setTiltAnimationFields(prev => ({
          ...prev,
          [fieldName]: true
        }));

        // Remove tilt animation class after animation completes
        setTimeout(() => {
          setTiltAnimationFields(prev => ({
            ...prev,
            [fieldName]: false
          }));
        }, 1000); // Match the animation duration
      }
    }, 1500); // 1.5 second delay

    // Store the timeout
    setValidationTimeouts(prev => ({
      ...prev,
      [fieldName]: timeout
    }));
  };

  // For height picker
  const feetOptions = [4, 5, 6, 7, 8];
  const inchOptions = Array.from({ length: 12 }, (_, i) => i);
  // Parse height for dropdowns
  let feet = '';
  let inches = '';
  if (profile && profile.height && typeof profile.height === 'string') {
    const match = profile.height.match(/(\d+)'(\d+)?/);
    if (match) {
      feet = match[1];
      inches = match[2] || '';
    }
  }
  // Today's date for max date
  const todayStr = new Date().toISOString().split('T')[0];

  // Show loading screen while checking authentication or loading profile
  if (!isAuthenticated || loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <HeartbeatLoader 
            size="lg" 
            text={!isAuthenticated ? 'Checking Authentication' : 'Loading Your Profile'} 
            className="mb-4"
          />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50 px-4">
        <div className="flex flex-col items-center space-y-6 p-10 bg-white/80 rounded-2xl shadow-lg border border-rose-100">
          <Image src="/icons/user.svg" alt="No Profile" width={80} height={80} className="mb-2 opacity-60" />
          <h2 className="text-2xl font-bold text-rose-600">No Profile Data</h2>
          <p className="text-gray-500 text-center max-w-md">We couldn't find your profile information. Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  // When overlay is dismissed, set hasSeenOnboarding to true
  const handleDismissWelcome = () => {
    setShowWelcome(false);
    setIsEditing(true);
    setHasSeenOnboarding(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenOnboarding', 'true');
      localStorage.setItem('isFirstLogin', 'false');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/30 to-pink-100/30 backdrop-blur-[2.5px]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(236,72,153,0.13),transparent_50%)]"></div>
      
      {/* Onboarding Overlay for First-Time Users */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          {/* Canvas Confetti will be triggered via JavaScript */}
          
          {/* Background Pattern - Removed rotating matrix */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-100/30 to-pink-100/30"></div>
          
          {/* No background animations - only blur effect */}
          
          {/* Subtle Background Orbs */}
          <div className="absolute top-20 -left-20 w-48 h-48 bg-gradient-to-br from-rose-200/10 to-pink-200/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 -right-20 w-52 h-52 bg-gradient-to-br from-purple-200/10 to-rose-200/10 rounded-full blur-2xl"></div>
          
          <div ref={welcomeRef} className="bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden group">
            {/* Card Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 via-pink-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            
            <div className="relative z-10">
              {/* Brand Logo */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif" }}>
                  <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent">
                    Shaadi
                  </span>
                  <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent ml-2">
                    Mantra
                  </span>
                </h1>
                <p className="text-slate-600 text-sm">
                  Your journey to forever starts here
                </p>
              </div>
              
              {/* Welcome Message */}
              <div className="mb-6">
                <div className="flex items-center justify-center mx-auto mb-4">
                  <img src="/icon.svg" alt="Shaadi Mantra" className="w-16 h-16 heartbeat-animation" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome to Your Journey!</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Let's create your perfect profile to help you find your soulmate. 
                  Fill in your details to get started with smart matching.
                </p>
              </div>
              
              {/* Feature Steps */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Complete Profile</h3>
                    <p className="text-slate-500 text-xs">Add your personal details and preferences</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Smart Matching</h3>
                    <p className="text-slate-500 text-xs">Get personalized match suggestions</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Start Chatting</h3>
                    <p className="text-slate-500 text-xs">Connect with your matches</p>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={handleDismissWelcome}
                className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold py-3 px-6 rounded-xl hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl relative overflow-hidden group"
                disabled={!welcomeButtonEnabled}
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative z-10">
                  {welcomeButtonEnabled ? "Let's Get Started" : `Please wait... (${welcomeTimeLeft}s)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div ref={headerRef} className="fixed top-0 w-full backdrop-blur-sm bg-white/80 border-b border-white/20 shadow-lg z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="profile-title text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">My Profile</h1>
          <button
            onClick={() => {
              if (!isEditing) {
                // Clear all error styling when entering edit mode
                document.querySelectorAll('[data-field]').forEach(el => {
                  const element = el as HTMLElement;
                  element.classList.remove('border-red-500', 'bg-red-50', 'animate-shake');
                  element.style.boxShadow = '';
                  element.style.borderRadius = '';
                  element.style.padding = '';
                  element.style.margin = '';
                });
                setFieldErrors({});
              }
              setIsEditing(!isEditing);
            }}
            className="edit-toggle-btn btn-secondary text-sm py-2 px-4 hover-lift"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 pt-16 pb-24 page-transition">
        {/* Profile Image */}
        <div className="px-4 py-6">
          <div className="relative w-32 h-32 mx-auto">
            {profile.images && profile.images.length > 0 && profile.images[0] ? (
              <Image
                src={profile.images[0]}
                alt="Profile"
                width={128}
                height={128}
                className="w-full h-full rounded-full object-cover object-top border-4 border-white shadow-2xl hover:shadow-3xl transition-shadow duration-300 bg-white/60 backdrop-blur-md"
              />
            ) : (
              <button
                type="button"
                onClick={handleCameraClick}
                className="w-full h-full flex flex-col items-center justify-center rounded-full border-4 border-dashed border-rose-300 bg-white/60 hover:bg-rose-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                style={{ minHeight: 128, minWidth: 128 }}
              >
                <Image
                  src="/icons/user.svg"
                  alt="Upload Profile"
                  width={64}
                  height={64}
                  className="mx-auto mb-2 opacity-70"
                />
                <span className="text-xs text-rose-500 font-semibold">Upload Image</span>
              </button>
            )}
            
            {/* Age Badge */}
            {profile.dateOfBirth && (
              <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white">
                {calculateAge(profile.dateOfBirth)}y
              </div>
            )}
            
            {/* Image upload disabled for now - will be implemented later */}
            {isEditing && (
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-3 bg-gray-100 border-gray-300 text-gray-400">
                <CustomIcon name="ri-camera-off-line" size={22} />
              </div>
            )}
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {/* Image upload disabled for now */}
          <div className="mt-3 p-3 rounded-lg text-sm bg-gray-100 text-gray-600 border border-gray-200">
            <div className="font-medium mb-1">Image upload coming soon</div>
            <div className="text-xs opacity-75">
              Profile images will be available in the next update
            </div>
          </div>
        </div>

        {/* Profile Name and Quick Info */}
        <div ref={profileInfoRef} className="px-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-neutral-900">{profile.name}</h1>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-neutral-600 mb-4">
              <div className="flex items-center gap-2">
                <CustomIcon name="ri-calendar-line" size={16} />
                <span>{calculateAge(profile.dateOfBirth)} years</span>
              </div>
              <div className="flex items-center gap-2">
                <CustomIcon name={getOccupationIcon(profile.occupation)} size={16} />
                <span>{getOccupationAcronym(profile.occupation)}</span>
              </div>
              <div className="flex items-center gap-2">
                <CustomIcon name="ri-map-pin-line" size={16} />
                <span>{profile.currentResidence}</span>
              </div>
            </div>
            

          </div>
        </div>

        {/* Profile Details */}
        <div ref={profileDetailsRef} className="px-4 space-y-6">
          {/* Basic Information */}
          <div className="card-modern p-6 hover-lift">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <CustomIcon name="ri-user-line" size={20} className="text-rose-600 mr-3" />
              Basic Information
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                  {isEditing ? (
                                       <input
                     type="text"
                     value={profile.name || ""}
                     onChange={(e) => handleFieldChange('name', e.target.value)}
                     placeholder="e.g. Rahul Kumar Sharma"
                     data-field="name"
                     maxLength={30}
                     className={getInputClassName('name')}
                   />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-neutral-800 text-sm">{profile.name}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                  {isEditing ? (
                    <select
                      value={profile.gender || ""}
                      onChange={(e) => {
                        console.log('🎯 Gender dropdown changed:', e.target.value);
                        setProfile({...profile, gender: e.target.value});
                      }}
                      data-field="gender"
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.gender}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Native Place</label>
                  {isEditing ? (
                                       <input
                     type="text"
                     value={profile.nativePlace || ""}
                     onChange={(e) => handleFieldChange('nativePlace', e.target.value)}
                     placeholder="e.g. Lucknow"
                     data-field="nativePlace"
                     maxLength={10}
                     className={getInputClassName('nativePlace')}
                   />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.nativePlace}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Current Residence</label>
                  {isEditing ? (
                                       <input
                     type="text"
                     value={profile.currentResidence || ""}
                     onChange={(e) => handleFieldChange('currentResidence', e.target.value)}
                     placeholder="e.g. Noida"
                     data-field="currentResidence"
                     maxLength={30}
                     className={getInputClassName('currentResidence')}
                   />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.currentResidence}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Marital Status</label>
                  {isEditing ? (
                    <select
                      value={profile.maritalStatus || ""}
                      onChange={(e) => {
                        console.log('🎯 Marital Status dropdown changed:', e.target.value);
                        setProfile({...profile, maritalStatus: e.target.value});
                      }}
                      data-field="maritalStatus"
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring-rose-500"
                    >
                      <option value="Never Married">Never Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.maritalStatus}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Manglik</label>
                  {isEditing ? (
                    <select
                      value={profile.manglik || ""}
                      onChange={(e) => {
                        console.log('🎯 Manglik dropdown changed:', e.target.value);
                        setProfile({...profile, manglik: e.target.value});
                      }}
                      data-field="manglik"
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Don't Know">Don't Know</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.manglik || 'Not specified'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Birth Details */}
          <div className="card-modern p-6 hover-lift">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <CustomIcon name="ri-calendar-line" size={20} className="text-rose-600 mr-3" />
              Birth Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                  {isEditing ? (
                    <DatePicker
                      date={dateValue.startDate ? (() => {
                        const date = new Date(dateValue.startDate);
                        return isNaN(date.getTime()) ? undefined : date;
                      })() : undefined}
                      onChange={date => {
                        setDateValue({ startDate: date, endDate: date });
                        // Store the date as an ISO string for consistency
                        const dateString = date ? date.toISOString().split('T')[0] : '';
                        setProfile({ ...profile, dateOfBirth: dateString });
                      }}
                      data-field="dateOfBirth"
                      className="w-full"
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">
                      {(() => {
                        if (profile.dateOfBirth instanceof Date) {
                          return format(profile.dateOfBirth, 'PPP');
                        } else if (profile.dateOfBirth) {
                          const date = new Date(profile.dateOfBirth);
                          return isNaN(date.getTime()) ? '' : format(date, 'PPP');
                        }
                        return '';
                      })()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Time</label>
                  {isEditing ? (
                    <TimePicker
                      time={clockTime}
                      onChange={date => {
                        setClockTime(date);
                        setProfile({ ...profile, timeOfBirth: date });
                      }}
                      data-field="timeOfBirth"
                      className="w-full"
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">
                      {(() => {
                        if (profile.timeOfBirth instanceof Date) {
                          return format(profile.timeOfBirth, 'hh:mm aa');
                        } else if (profile.timeOfBirth) {
                          const time = new Date(profile.timeOfBirth);
                          return isNaN(time.getTime()) ? '' : format(time, 'hh:mm aa');
                        }
                        return '';
                      })()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Place</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.placeOfBirth || ""}
                      onChange={(e) => handleFieldChange('placeOfBirth', e.target.value)}
                      placeholder="e.g. Dehradun"
                      data-field="placeOfBirth"
                      maxLength={30}
                      className={`w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${fieldErrors.placeOfBirth ? 'border-red-500 animate-shake' : 'border-gray-200'}`}
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.placeOfBirth}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Physical Details */}
          <div className="card-modern p-6 hover-lift">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <CustomIcon name="ri-user-heart-line" size={20} className="text-rose-600 mr-3" />
              Physical Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Height</label>
                  {isEditing ? (
                    <div className="flex flex-col md:flex-row gap-2 w-full">
                      <select
                        value={feet}
                        onChange={e => {
                          const newFeet = e.target.value;
                          setProfile({
                            ...profile,
                            height: `${newFeet}'${inches || 0}"`
                          });
                        }}
                        data-field="height-feet"
                        className={`w-full md:w-1/2 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-gray-800 bg-rose-50 ${fieldErrors.height ? 'border-red-500 animate-shake' : 'border-gray-200'}`}
                      >
                        {feetOptions.map(f => <option key={f} value={f}>{f} ft</option>)}
                      </select>
                      <select
                        value={inches}
                        onChange={e => {
                          const newInches = e.target.value;
                          setProfile({
                            ...profile,
                            height: `${feet || 0}'${newInches}"`
                          });
                        }}
                        data-field="height-inches"
                        className={`w-full md:w-1/2 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-gray-800 bg-rose-50 ${fieldErrors.height ? 'border-red-500 animate-shake' : 'border-gray-200'}`}
                      >
                        {inchOptions.map(i => <option key={i} value={i}>{i} in</option>)}
                      </select>
                    </div>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.height}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Weight</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profile.weight || ""}
                      onChange={(e) => handleFieldChange('weight', e.target.value)}
                      placeholder="e.g. 65"
                      data-field="weight"
                      min="30"
                      max="200"
                      className={getInputClassName('weight')}
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.weight}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Complexion</label>
                  {isEditing ? (
                    <select
                      value={profile.complexion || ""}
                      onChange={(e) => {
                        console.log('🎯 Complexion dropdown changed:', e.target.value);
                        setProfile({...profile, complexion: e.target.value});
                      }}
                      data-field="complexion"
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Fair">Fair</option>
                      <option value="Medium">Medium</option>
                      <option value="Dark">Dark</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.complexion || 'Not specified'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gotra Details */}
          <div className="card-modern p-6 hover-lift">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <CustomIcon name="ri-building-line" size={20} className="text-rose-600 mr-3" />
              Gotra Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Father's Gotra</label>
                  {isEditing ? (
                                       <input
                     type="text"
                     value={profile.fatherGotra || ""}
                     onChange={(e) => handleFieldChange('fatherGotra', e.target.value)}
                     placeholder="e.g. Kashyap"
                     data-field="fatherGotra"
                     maxLength={20}
                     className={getInputClassName('fatherGotra')}
                   />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.fatherGotra}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Mother's Gotra</label>
                  {isEditing ? (
                                       <input
                     type="text"
                     value={profile.motherGotra || ""}
                     onChange={(e) => handleFieldChange('motherGotra', e.target.value)}
                     placeholder="e.g. Bharadwaj"
                     data-field="motherGotra"
                     maxLength={20}
                     className={getInputClassName('motherGotra')}
                   />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.motherGotra}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Grandfather's Gotra</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.grandfatherGotra || ""}
                      onChange={(e) => setProfile({...profile, grandfatherGotra: e.target.value})}
                      data-field="grandfatherGotra"
                      className={`w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${fieldErrors.grandfatherGotra ? 'border-red-500 animate-shake' : 'border-gray-200'}`}
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.grandfatherGotra}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Grandmother's Gotra</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.grandmotherGotra || ""}
                      onChange={(e) => setProfile({...profile, grandmotherGotra: e.target.value})}
                      data-field="grandmotherGotra"
                      className={`w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 ${fieldErrors.grandmotherGotra ? 'border-red-500 animate-shake' : 'border-gray-200'}`}
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.grandmotherGotra}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="card-modern p-6 hover-lift">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <CustomIcon name="ri-briefcase-line" size={20} className="text-rose-600 mr-3" />
              Professional Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Education</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.education || ""}
                    onChange={(e) => handleFieldChange('education', e.target.value)}
                    placeholder="e.g. B.Tech MBA"
                    data-field="education"
                    maxLength={20}
                    className={getInputClassName('education')}
                  />
                ) : (
                  <p className="text-neutral-800 text-sm">{profile.education}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Occupation</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.occupation || ""}
                    onChange={(e) => handleFieldChange('occupation', e.target.value)}
                    placeholder="e.g. Software Engineer"
                    data-field="occupation"
                    maxLength={20}
                    className={getInputClassName('occupation')}
                  />
                ) : (
                  <p className="text-neutral-800 text-sm">{profile.occupation}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Annual Income</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.annualIncome || ""}
                    onChange={(e) => handleFieldChange('annualIncome', e.target.value)}
                    placeholder="e.g. 1200000"
                    data-field="annualIncome"
                    className={getInputClassName('annualIncome')}
                  />
                ) : (
                  <p className="text-neutral-800 text-sm">{profile.annualIncome}</p>
                )}
              </div>
            </div>
          </div>

          {/* Lifestyle */}
          <div className="card-modern p-6 hover-lift">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <CustomIcon name="ri-heart-3-line" size={20} className="text-rose-600 mr-3" />
              Lifestyle
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Eating Habit</label>
                  {isEditing ? (
                    <select
                      value={profile.eatingHabit || ""}
                      onChange={(e) => {
                        console.log('🎯 Eating Habit dropdown changed:', e.target.value);
                        setProfile({...profile, eatingHabit: e.target.value});
                      }}
                      data-field="eatingHabit"
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Eggetarian">Eggetarian</option>
                      <option value="Non-Vegetarian">Non-Vegetarian</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.eatingHabit || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Smoking</label>
                  {isEditing ? (
                    <select
                      value={profile.smokingHabit || ""}
                      onChange={(e) => {
                        console.log('🎯 Smoking Habit dropdown changed:', e.target.value);
                        setProfile({...profile, smokingHabit: e.target.value});
                      }}
                      data-field="smokingHabit"
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Occasionally">Occasionally</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.smokingHabit || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Drinking</label>
                  {isEditing ? (
                    <select
                      value={profile.drinkingHabit || ""}
                      onChange={(e) => {
                        console.log('🎯 Drinking Habit dropdown changed:', e.target.value);
                        setProfile({...profile, drinkingHabit: e.target.value});
                      }}
                      data-field="drinkingHabit"
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Socially">Socially</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.drinkingHabit || 'Not specified'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Family Details */}
          <div className="card-modern p-6 hover-lift">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <CustomIcon name="ri-group-line" size={20} className="text-rose-600 mr-3" />
              Family Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Father</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.father || ""}
                    onChange={(e) => handleFieldChange('father', e.target.value)}
                    placeholder="e.g. Rajesh Kumar Sharma"
                    data-field="father"
                    maxLength={20}
                    className={getInputClassName('father')}
                  />
                ) : (
                  <p className="text-neutral-800 text-sm">{profile.father}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Mother</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.mother || ""}
                    onChange={(e) => handleFieldChange('mother', e.target.value)}
                    placeholder="e.g. Sunita Sharma"
                    data-field="mother"
                    maxLength={20}
                    className={getInputClassName('mother')}
                  />
                ) : (
                  <p className="text-neutral-800 text-sm">{profile.mother}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Brothers</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profile.brothers || ""}
                      onChange={(e) => handleFieldChange('brothers', e.target.value)}
                      placeholder="e.g. 2"
                      data-field="brothers"
                      min="0"
                      max="10"
                      className={getInputClassName('brothers')}
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.brothers}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Sisters</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profile.sisters || ""}
                      onChange={(e) => handleFieldChange('sisters', e.target.value)}
                      placeholder="e.g. 1"
                      data-field="sisters"
                      min="0"
                      max="10"
                      className={getInputClassName('sisters')}
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.sisters}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card-modern p-6 hover-lift">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <CustomIcon name="ri-settings-line" size={20} className="text-rose-600 mr-3" />
              Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Specific Requirements</label>
                {isEditing ? (
                  <textarea
                    value={profile.specificRequirements || ""}
                    onChange={(e) => handleFieldChange('specificRequirements', e.target.value)}
                    rows={2}
                    maxLength={50}
                    placeholder="e.g. Looking for a well-educated, family-oriented person."
                    data-field="specificRequirements"
                    className={`w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none ${getInputClassName('specificRequirements')}`}
                  />
                ) : (
                  <p className="text-neutral-800 text-sm">{profile.specificRequirements}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Willingness to Settle Abroad</label>
                {isEditing ? (
                                      <select
                      value={profile.settleAbroad || ""}
                      onChange={(e) => {
                        console.log('🎯 Settle Abroad dropdown changed:', e.target.value);
                        setProfile({...profile, settleAbroad: e.target.value});
                      }}
                      data-field="settleAbroad"
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Maybe">Maybe</option>
                  </select>
                ) : (
                  <p className="text-neutral-800 text-sm">{profile.settleAbroad || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* About */}
          <div className="card-modern p-6 hover-lift">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <CustomIcon name="ri-file-text-line" size={20} className="text-rose-600 mr-3" />
              About Me
            </h2>
            {isEditing ? (
              <textarea
                value={profile.about || ""}
                onChange={(e) => handleFieldChange('about', e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="e.g. I enjoy reading, traveling, and spending time with family and friends. Looking for a supportive and understanding partner."
                data-field="about"
                className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none ${getInputClassName('about')}`}
              />
            ) : (
              <p className="text-neutral-800">{profile.about}</p>
            )}
          </div>

          {/* Interests */}
          <div className={`card-modern p-6 hover-lift ${fieldErrors.interests ? 'border-2 border-red-500 animate-shake' : ''}`} data-field="interests">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <CustomIcon name="ri-heart-line" size={20} className="text-rose-600 mr-3" />
              Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(profile.interests) && profile.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-rose-100/80 text-rose-600 rounded-full text-sm shadow-sm hover:bg-rose-200/80 transition-colors duration-150"
                >
                  {interest}
                  {isEditing && (
                    <button
                      onClick={() => removeInterest(index)}
                      className="ml-2 text-rose-400 hover:text-rose-600"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {isEditing && (
                <button 
                  onClick={() => setShowInterestModal(true)}
                  className="px-3 py-1 border-2 border-dashed border-gray-300 rounded-full text-sm text-gray-500 !rounded-button"
                >
                  + Add Interest
                </button>
              )}
              {fieldErrors.interests && (
                <p className="text-red-500 text-sm mt-2">Please add at least one interest</p>
              )}
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <button
              onClick={handleSave}
              data-save-button
              className="w-full btn-primary py-4 text-lg font-semibold hover-lift"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-4 h-16">
          <button
            onClick={() => {
              if (profile.isFirstLogin) {
                router.push('/profile');
              } else {
                router.push('/dashboard');
              }
            }}
            className="flex flex-col items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-gray-50 transition-all duration-200 group w-full h-full"
            type="button"
          >
            <CustomIcon name="ri-heart-line" className="text-xl mb-1 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-xs">Discover</span>
          </button>
          <button
            onClick={() => {
              if (profile.isFirstLogin) {
                router.push('/profile');
              } else {
                router.push('/matches');
              }
            }}
            className="flex flex-col items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-gray-50 transition-all duration-200 group w-full h-full"
            type="button"
          >
            <CustomIcon name="ri-chat-3-line" className="text-xl mb-1 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-xs">Matches</span>
          </button>
          <Link 
            href="/profile" 
            className="flex flex-col items-center justify-center text-rose-500 active:bg-rose-50"
          >
            <CustomIcon name="ri-user-line" className="text-xl mb-1" />
            <span className="text-xs">Profile</span>
          </Link>
          <Link 
            href="/settings" 
            className="flex flex-col items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-gray-50 transition-all duration-200 group"
          >
            <CustomIcon name="ri-settings-line" className="text-xl mb-1 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </div>

      {/* Interest Modal */}
      {showInterestModal && (
        <InterestModal
          onClose={() => setShowInterestModal(false)}
          onAdd={addInterest}
          existingInterests={profile.interests || []}
        />
      )}
    </div>
  );
}