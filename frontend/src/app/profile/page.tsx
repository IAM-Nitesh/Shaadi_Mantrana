'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InterestModal from './InterestModal';
import { ImageUploadService, UploadResult } from '../../services/image-upload-service';
import { config as configService } from '../../services/configService';
import { AuthGuardV2 } from '../../components/AuthGuardV2';
import CustomIcon from '../../components/CustomIcon';
import ImageCompression from '../../utils/imageCompression';
import { safeGsap } from '../../components/SafeGsap';
import Image from 'next/image';
import { ProfileService } from '../../services/profile-service';
import { DatePicker } from '../../components/date-picker';
import { format } from 'date-fns';
import 'react-time-picker/dist/TimePicker.css';
import { TimePicker } from '../../components/time-picker';
import RoyalLoader from '../../components/RoyalLoader';
import FilterModal, { type FilterState } from '../dashboard/FilterModal';
import { userNavItems } from '../../config/navigation';
import { matchesCountService } from '../../services/matches-count-service';
import ToastService from '../../services/toastService';
import OnboardingOverlay from '../../components/OnboardingOverlay';
import RoyalOnboardingWizard from '../../components/onboarding/RoyalOnboardingWizard';
import ProfileCompletionOverlay from '../../components/profile/ProfileCompletionOverlay';
import { useAuth } from '../../contexts/AuthContext';
import { OnboardingService } from '../../services/onboarding-service';
import logger from '../../utils/logger';
import { apiClient } from '../../utils/api-client';
import { getAuthHeaders } from '../../services/auth-utils';
import posthog from 'posthog-js';
import { calculateProfileCompletion as calcCompleteness } from '../../constants/profileCompleteness';

import { FIELD_HINTS } from '../../config/profileValidation';

// Helper to format time as hh:mm AM/PM
function formatTime(date: Date) {
  return format(date, 'hh:mm aa');
}

function parseTimeOfBirth(value: string | Date | null | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value !== 'string') return undefined;

  const isoTime = new Date(`1970-01-01T${value}`);
  if (!isNaN(isoTime.getTime())) return isoTime;

  const match = value.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return undefined;

  let hours = parseInt(match[1], 10) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;

  const date = new Date();
  date.setHours(hours, parseInt(match[2], 10), 0, 0);
  return date;
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

const INCOME_OPTIONS = [
  { value: 'Under 5L', label: 'Under 5 Lakhs' },
  { value: '5L - 10L', label: '5 Lakhs - 10 Lakhs' },
  { value: '10L - 20L', label: '10 Lakhs - 20 Lakhs' },
  { value: '20L - 50L', label: '20 Lakhs - 50 Lakhs' },
  { value: '50L - 1Cr', label: '50 Lakhs - 1 Crore' },
  { value: 'Above 1Cr', label: 'Above 1 Crore' }
];

const SIBLING_OPTIONS = Array.from({ length: 6 }, (_, value) => ({
  value: String(value),
  label: String(value)
}));

const TEXT_ONLY_FIELDS = new Set([
  'name',
  'nativePlace',
  'currentResidence',
  'placeOfBirth',
  'father',
  'mother',
  'fatherGotra',
  'motherGotra',
  'grandfatherGotra',
  'grandmotherGotra'
]);

const NUMBER_ONLY_FIELDS = new Set(['weight']);

function sanitizeProfileField(fieldName: string, value: string) {
  if (TEXT_ONLY_FIELDS.has(fieldName)) {
    return value.replace(/[^a-zA-Z\s]/g, '');
  }

  if (NUMBER_ONLY_FIELDS.has(fieldName)) {
    return value.replace(/\D/g, '');
  }

  return value;
}

function ProfileContent() {
  const router = useRouter();
  const { user, isAuthenticated, forceRefresh, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  const [tiltAnimationFields, setTiltAnimationFields] = useState<{[key: string]: boolean}>({});
  const [validationTimeouts, setValidationTimeouts] = useState<{[key: string]: NodeJS.Timeout}>({});
  const [showFilter, setShowFilter] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ageRange: [18, 70],
    selectedProfessions: [],
    selectedCountry: '',
    selectedState: ''
  });
  
  // Matches count state
  const [matchesCount, setMatchesCount] = useState(0);
  
  // Temporary image state for preview before B2 upload
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState<boolean>(false);

  // GSAP refs for animations
  const headerRef = useRef<HTMLDivElement>(null);
  const profileInfoRef = useRef<HTMLDivElement>(null);
  const profileDetailsRef = useRef<HTMLDivElement>(null);

  // Field hints state
  const [fieldHints, setFieldHints] = useState<{[key: string]: boolean}>({});
  const [completedFields, setCompletedFields] = useState<{[key: string]: boolean}>({});
  const [interactedFields, setInteractedFields] = useState<{[key: string]: boolean}>({});
  const [activeField, setActiveField] = useState<string | null>(null);

  // Helper functions for field hints
  const getFieldHint = (fieldName: string) => {
    return FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS]?.hint || '';
  };

  const getFieldPlaceholder = (fieldName: string) => {
    return FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS]?.placeholder || '';
  };

  const isFieldValid = (fieldName: string, value: any) => {
    const config = FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS];
    if (!config) return true;
    return config.validation(value);
  };

  const shouldShowHint = (fieldName: string) => {
    if (!isEditing) return false;
    const value = profile[fieldName];
    const isValid = isFieldValid(fieldName, value);
    
    // Only show hints after user has interacted with THIS specific field
    const hasUserInteracted = interactedFields[fieldName];
    const shouldShow = !isValid && fieldHints[fieldName] && hasUserInteracted;
    
    return shouldShow;
  };

  // New function to show error messages with warning icon
  const shouldShowError = (fieldName: string) => {
    if (!isEditing) return false;
    const value = profile[fieldName];
    const isValid = isFieldValid(fieldName, value);
    
    // Only show errors after user has interacted with THIS specific field
    const hasUserInteracted = interactedFields[fieldName];
    const shouldShow = !isValid && hasUserInteracted;
    
    return shouldShow;
  };

  // Function to get error message for a field
  const getErrorMessage = (fieldName: string) => {
    const fieldConfig = FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS];
    return fieldConfig?.errorMessage || 'This field is required';
  };

  const handleFieldFocus = (fieldName: string) => {
    setActiveField(fieldName);
    setInteractedFields(prev => ({ ...prev, [fieldName]: true }));
    setFieldHints(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleFieldBlur = (fieldName: string) => {
    setActiveField(null);
    try {
      const value = profile[fieldName];
      let isValid = isFieldValid(fieldName, value);

      const dropdownFields = ['height', 'gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad', 'grandfatherGotra', 'grandmotherGotra'];
      if (dropdownFields.includes(fieldName) && !isValid) {
        const el = document.querySelector(`[data-field="${fieldName}"]`) as HTMLSelectElement | null;
        if (el && el.value && el.value.trim() !== '') {
          isValid = true;
        }
      }

      setInteractedFields(prev => ({ ...prev, [fieldName]: true }));
      setFieldErrors(prev => ({ ...prev, [fieldName]: !isValid }));
    } catch (err) {
      const value = profile[fieldName];
      const valid = isFieldValid(fieldName, value);
      setFieldErrors(prev => ({ ...prev, [fieldName]: !valid }));
    }
  };

  const markFieldAsCompleted = (fieldName: string) => {
    setCompletedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  // Initialize completed fields based on current profile data
  useEffect(() => {
    if (profile) {
      const completed: {[key: string]: boolean} = {};
      Object.keys(FIELD_HINTS).forEach(fieldName => {
        const value = profile[fieldName];
        if (isFieldValid(fieldName, value)) {
          completed[fieldName] = true;
        }
      });
      setCompletedFields(completed);
    }
  }, [profile]);

  // Fetch signed URL for the current user's profile picture when profile loads
  useEffect(() => {
    const fetchMySignedUrl = async () => {
      if (profile?.images && !tempImageUrl) {
        setImageLoadFailed(false);
        
        // If profile.images is already a full URL or absolute path (from local upload), just use it
        const rawImageUrl = Array.isArray(profile.images) ? profile.images[0] : profile.images;
        if (rawImageUrl && (rawImageUrl.startsWith('http') || rawImageUrl.startsWith('/uploads'))) {
          let finalUrl = rawImageUrl;
          
          // Fix localhost URLs for mobile devices by using apiBaseUrl
          if (finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1')) {
            try {
              const urlObj = new URL(finalUrl);
              // Only override if apiBaseUrl is configured
              if (configService.apiBaseUrl) {
                finalUrl = `${configService.apiBaseUrl}${urlObj.pathname}`;
              }
            } catch {
              // Ignore parse errors
            }
          } else if (finalUrl.startsWith('/uploads')) {
            if (configService.apiBaseUrl) {
              finalUrl = `${configService.apiBaseUrl}${finalUrl}`;
            }
          }
          
          setSignedImageUrl(finalUrl);
          logger.debug('✅ Profile: Using direct image URL:', finalUrl);
          return;
        }

        try {
          const url = await ImageUploadService.getMyProfilePictureSignedUrl();
          if (url) {
            // Check if default avatar returned
            if (url.includes('default-avatar.png')) {
               setSignedImageUrl(null);
               setImageLoadFailed(true);
            } else {
               setSignedImageUrl(url);
               logger.debug('✅ Profile: Fetched signed URL for own profile picture');
            }
          } else {
            logger.debug('ℹ️ Profile: No signed URL available (image may be pending review)');
            setImageLoadFailed(true);
          }
        } catch (err) {
          logger.warn('⚠️ Profile: Could not fetch signed URL', err);
          setImageLoadFailed(true);
        }
      } else if (!profile?.images) {
        // No image stored — clear any stale signed URL
        setSignedImageUrl(null);
        setImageLoadFailed(false);
      }
    };
    fetchMySignedUrl();
  }, [profile?.images]);

  // Real-time profile completeness tracking
  useEffect(() => {
    if (profile && isEditing) {
      // Recalculate completion percentage in real-time
      const currentCompleteness = calculateProfileCompletion(profile);
    }
  }, [profile, isEditing]);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      await ProfileService.updateOnboardingMessage(true);
    } catch (error) {

    }

    // Update local state regardless of backend success
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Subscribe to matches count updates
  useEffect(() => {
    const unsubscribe = matchesCountService.subscribe((count) => {
      setMatchesCount(count);
    });
    
    // Initial fetch
    matchesCountService.fetchCount();
    
    return unsubscribe;
  }, []);

  // For date picker state
  const [dateValue, setDateValue] = useState<{ startDate: string | null; endDate: string | null }>({ startDate: null, endDate: null });
  // For time picker state
  const [clockTime, setClockTime] = useState(new Date());

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
        setClockTime(parseTimeOfBirth(profile.timeOfBirth) || new Date());
      } else {
        setClockTime(new Date());
      }
    }
  }, [profile]);

  // Authentication is now handled by ServerAuthGuard
  useEffect(() => {
            // Authentication is handled by useServerAuth hook
  }, []);

  // REMOVED: Redundant onboarding check (consolidated below)

  // REMOVED: Redundant profile fetch (consolidated below)

  // REMOVED: This useEffect was causing race conditions
  // All onboarding and redirection logic is now handled in the main authentication useEffect above

  // Calculate profile completeness — delegates to the canonical shared function.
  // The shared function counts exactly 12 mandatory text fields + 1 photo = 13 total.
  const calculateProfileCompletion = (profile: any): number => {
    const hasTempImage = !!(tempImageFile || tempImageUrl || signedImageUrl);
    return calcCompleteness(profile, hasTempImage);
  };

  // Real-time calculated completeness
  const calculatedCompleteness = calculateProfileCompletion(profile);
  
  // Helper function to check if a field is required
  const isRequiredField = (fieldName: string) => {
    return requiredFields.includes(fieldName);
  };
  
  // Helper function to render field label with asterisk if required
  const renderFieldLabel = (fieldName: string, label: string) => {
    const isRequired = isRequiredField(fieldName);
    
    return (
      <div className="mb-2">
        <label className="block text-sm font-medium text-royal-gold-light/80">
          {label}
          {isEditing && isRequired && (
            <span className="text-royal-crimson ml-1">*</span>
          )}
        </label>
      </div>
    );
  };

  // Helper function to render inline error messages or hints below input fields
  const renderInlineError = (fieldName: string) => {
    const showError = shouldShowError(fieldName);
    const hint = getFieldHint(fieldName);
    
    if (showError) {
      return (
        <div className="mt-1 p-2 bg-royal-crimson/10 border border-royal-crimson/30 rounded-lg transition-all duration-300">
          <div className="flex items-start space-x-2">
            <CustomIcon name="ri-error-warning-line" className="text-royal-crimson text-sm mt-0.5 flex-shrink-0" />
            <p className="text-xs text-royal-crimson">{getErrorMessage(fieldName)}</p>
          </div>
        </div>
      );
    }
    
    if (activeField === fieldName && hint) {
      return (
        <div className="mt-1 p-2 bg-royal-gold/5 border border-royal-gold/20 rounded-lg transition-all duration-300">
          <div className="flex items-start space-x-2">
            <CustomIcon name="ri-information-line" className="text-royal-gold/80 text-sm mt-0.5 flex-shrink-0" />
            <p className="text-xs text-royal-gold/80 italic">{hint}</p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Debug logging for image completion
  logger.debug('📊 Profile completion debug:', {
    hasExistingImage: !!profile?.images,
    hasTempImage: !!(tempImageFile || tempImageUrl),
    finalImagesValue: profile?.images,
    calculatedCompleteness,
    backendCompleteness: profile?.profileCompleteness
  });

  // Check if profile is complete for feature access
  const isProfileComplete = calculatedCompleteness >= 100;

  // Highlight missing fields when profile is incomplete
  useEffect(() => {
    if (profile) {
      const missingFields = requiredFields.filter(field => {
        const value = profile[field];
        if (field === 'height') {
          // Check if height field exists in profile data first
          if (!value || value === '' || value === null || value === undefined) {
            logger.debug('❌ Height field missing from profile data');
            return true; // Missing height field
          }
          // If height exists, also check if it's properly formatted
          const heightMatch = value.match(/(\d+)'(\d+)?/);
          if (!heightMatch) {
            logger.debug('❌ Height field has invalid format:', value);
            return true; // Invalid height format
          }
          logger.debug('✅ Height field is valid:', value);
          return false; // Height is valid
        }
        if (field === 'images') {
          return !value;
        }
        return value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '');
      });
      
      logger.debug('🔍 Missing fields detected:', missingFields);
      
      // Set errors for missing fields and clear errors for valid fields
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        
        // Set errors for missing fields
        missingFields.forEach(field => {
          newErrors[field] = true;
        });
        
        // Clear errors for fields that are now valid
        requiredFields.forEach(field => {
          if (!missingFields.includes(field)) {
            newErrors[field] = false;
          }
        });
        
        return newErrors;
      });
    }
  }, [profile]);

  // Profile completion is now handled by the backend
  useEffect(() => {
    if (profile && typeof window !== 'undefined') {
      // Profile completion is managed by the backend
      logger.debug('✅ Profile completion managed by backend');
    }
  }, [profile]);



  // GSAP premium entrance animation
  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated && !loadingProfile) {
      const elements = [headerRef.current, profileInfoRef.current, profileDetailsRef.current].filter(Boolean);
      if (elements.length > 0) {
        safeGsap.set?.(elements, { opacity: 0, y: 40, filter: 'blur(8px)' });
        safeGsap.to?.(elements, {
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
  }, [isAuthenticated, loadingProfile]);

  // Simple modal animation
  useEffect(() => {
    if (showInterestModal && typeof window !== 'undefined') {
      const overlay = document.querySelector('.modal-overlay');
      const content = document.querySelector('.modal-content');
      
      if (overlay && content) {
        // Use safeGsap guards to avoid target-not-found warnings
        safeGsap.fromTo?.(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        safeGsap.fromTo?.(content, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
      }
    }
  }, [showInterestModal]);

  // Add lockout timer for onboarding overlay
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined = undefined;
    let interval: NodeJS.Timeout | undefined = undefined;
    if (showOnboarding) {
      // This useEffect is no longer needed as OnboardingOverlay handles its own timer
      logger.debug('✅ Onboarding overlay is visible');
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [showOnboarding]);

  // Debug profile state changes
  useEffect(() => {
    if (profile) {
      logger.debug('🔄 Profile state updated:', {
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
      logger.debug('🎯 Fields that should be visible in UI:', {
        manglik: profile.manglik || 'Not specified',
        complexion: profile.complexion || 'Not specified', 
        eatingHabit: profile.eatingHabit || 'Not specified',
        smokingHabit: profile.smokingHabit || 'Not specified',
        drinkingHabit: profile.drinkingHabit || 'Not specified',
        settleAbroad: profile.settleAbroad || 'Not specified'
      });
      
      // Also check the actual dropdown elements
      const dropdownFields = ['gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad', 'grandfatherGotra', 'grandmotherGotra'];
      logger.debug('🎯 Dropdown element values:');
      dropdownFields.forEach(field => {
        const el = document.querySelector(`[data-field="${field}"]`) as HTMLSelectElement;
        if (el) {
          logger.debug(`  ${field} element value: "${el.value}"`);
        } else {
          logger.debug(`  ${field} element: not found`);
        }
      });
    }
  }, [profile]);

  // Add lockout timer for onboarding overlay
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined = undefined;
    let interval: NodeJS.Timeout | undefined = undefined;
    if (showOnboarding) {
      // This useEffect is no longer needed as OnboardingOverlay handles its own timer
      logger.debug('✅ Onboarding overlay is visible');
    }
    return () => {
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [showOnboarding]);



  const requiredFields = [
    'name', 'gender', 'dateOfBirth', 'timeOfBirth', 'placeOfBirth',
    'height', 'weight', 'complexion', 'education', 'occupation',
    'maritalStatus', 'manglik', 'eatingHabit', 'smokingHabit',
    'drinkingHabit', 'nativePlace', 'currentResidence',
    'fatherGotra', 'motherGotra', 'father', 'mother',
    'settleAbroad', 'about'
  ];

  const handleSave = async () => {
    logger.debug('🔍 Starting validation...');
    logger.debug('📋 Current profile data:', profile);
    logger.debug('📋 Required fields:', requiredFields);
    
    // Debug dropdown values specifically
    const dropdownFields = ['gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad', 'grandfatherGotra', 'grandmotherGotra'];
    logger.debug('🎯 Dropdown field values:');
    dropdownFields.forEach(field => {
      logger.debug(`  ${field}: "${profile[field]}" (type: ${typeof profile[field]})`);
    });
    
    // Debug interests field specifically
    logger.debug('🎯 Interests field:', {
      value: profile.interests,
      type: typeof profile.interests,
      isArray: Array.isArray(profile.interests),
      length: Array.isArray(profile.interests) ? profile.interests.length : 'N/A'
    });
    
    // Validate required fields
    const errors: {[key: string]: boolean} = {};
    const validationDetails: {[key: string]: any} = {};
    
    requiredFields.forEach(field => {
        const fieldValue = profile[field];
        let isEmpty = false;
        let reason = '';
      
        logger.debug(` Checking field "${field}":`, fieldValue, `(type: ${typeof fieldValue})`);
        
        // Handle different data types
        if (fieldValue === null || fieldValue === undefined) {
          // For dropdown fields, check if the actual element has a value
          const dropdownFields = ['height', 'gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad', 'grandfatherGotra', 'grandmotherGotra'];
          if (dropdownFields.includes(field)) {
            const el = document.querySelector(`[data-field="${field}"]`) as HTMLSelectElement;
            if (el && el.value && typeof el.value === 'string' && el.value.trim() !== '') {
              // Element has a value, so the field is valid
              isEmpty = false;
              reason = 'valid dropdown selection (from element)';
              logger.debug(`  📝 Field "${field}" is dropdown, element value: "${el.value}", isEmpty: false`);
            } else {
              isEmpty = true;
              reason = 'null/undefined and no element value';
              logger.debug(`  ❌ Field "${field}" is null/undefined and element has no value`);
            }
          } else {
            isEmpty = true;
            reason = 'null/undefined';
            logger.debug(`  ❌ Field "${field}" is null/undefined`);
          }
        } else if (typeof fieldValue === 'string') {
          // For dropdown fields, check if it's a valid selection (not empty string)
          const dropdownFields = ['height', 'gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad', 'grandfatherGotra', 'grandmotherGotra'];
          if (dropdownFields.includes(field)) {
            // For dropdowns, any non-empty string is valid
            isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
            reason = isEmpty ? 'empty dropdown selection' : 'valid dropdown selection';
            logger.debug(`  📝 Field "${field}" is dropdown, value: "${fieldValue}", isEmpty: ${isEmpty}`);
          } else {
            isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
            reason = isEmpty ? 'empty string after trim' : 'valid string';
            logger.debug(`  📝 Field "${field}" is string, trimmed: "${fieldValue && typeof fieldValue === 'string' ? fieldValue.trim() : 'undefined'}", isEmpty: ${isEmpty}`);
          }
        } else if (typeof fieldValue === 'number') {
          isEmpty = fieldValue === 0 || isNaN(fieldValue);
          reason = isEmpty ? (fieldValue === 0 ? 'zero value' : 'NaN') : 'valid number';
          logger.debug(`  🔢 Field "${field}" is number: ${fieldValue}, isEmpty: ${isEmpty}`);
        } else if (typeof fieldValue === 'boolean') {
          isEmpty = false; // Boolean values are always valid
          reason = 'boolean (always valid)';
          logger.debug(`  ✅ Field "${field}" is boolean: ${fieldValue}, always valid`);
        } else if (Array.isArray(fieldValue)) {
          isEmpty = fieldValue.length === 0;
          reason = isEmpty ? 'empty array' : `array with ${fieldValue.length} items`;
          logger.debug(`  📋 Field "${field}" is array:`, fieldValue, `, isEmpty: ${isEmpty}`);
        } else if (fieldValue instanceof Date) {
          isEmpty = isNaN(fieldValue.getTime());
          reason = isEmpty ? 'invalid date' : 'valid date';
          logger.debug(`  📅 Field "${field}" is Date:`, fieldValue, `, isEmpty: ${isEmpty}`);
        } else {
          isEmpty = !fieldValue;
          reason = isEmpty ? 'falsy value' : 'truthy value';
          logger.debug(`  ❓ Field "${field}" is other type:`, fieldValue, `, isEmpty: ${isEmpty}`);
        }
      
      validationDetails[field] = {
        value: fieldValue,
        type: typeof fieldValue,
        isEmpty,
        reason
      };
      
      if (isEmpty) {
        errors[field] = true;
        logger.debug(`❌ Field "${field}" is empty or invalid:`, fieldValue, `(type: ${typeof fieldValue}) - Reason: ${reason}`);
      } else {
        logger.debug(`✅ Field "${field}" is valid:`, fieldValue, `(type: ${typeof fieldValue}) - Reason: ${reason}`);
      }
    });
    
    logger.debug('🔍 Validation errors:', errors);
    logger.debug('🔍 Validation details:', validationDetails);
    logger.debug('📋 Profile data:', profile);
    
    // Log which fields are missing data-field attributes
    const missingDataFields = requiredFields.filter(field => {
      const el = document.querySelector(`[data-field="${field}"]`);
      return !el;
    });
    if (missingDataFields.length > 0) {
      logger.debug('⚠️ Fields missing data-field attributes:', missingDataFields);
    }
    
    // Log which fields are failing validation
    const failingFields = Object.keys(errors);
    logger.debug('❌ Fields failing validation:', failingFields);
    failingFields.forEach(field => {
      logger.debug(`  ${field}: ${validationDetails[field]?.reason || 'unknown reason'}`);
    });
    
    // Don't set global field errors - let field-specific validation handle it
    // setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Show error message
      ToastService.error('Please fill in all required fields marked in red.');
      
      logger.debug('🎨 Applying error styling to fields:', Object.keys(errors));
      
      // Add red border styling to all missing fields
      Object.keys(errors).forEach(fieldName => {
        let el: HTMLElement | null = null;
        
        el = document.querySelector(`[data-field="${fieldName}"]`) as HTMLElement;
        logger.debug(`🎯 Field "${fieldName}" - element:`, el);
        
        if (el) {
          // Add red border and background to highlight missing fields
          el.classList.add('border-royal-crimson', 'bg-royal-crimson/10', 'animate-shake');
          logger.debug(`✅ Applied red border to "${fieldName}" element`);
        } else {
          logger.debug(`⚠️ Could not find element with data-field="${fieldName}"`);
          
          // Special handling for interests field if element not found
          if (fieldName === 'interests') {
            const interestsContainer = document.querySelector('[data-field="interests"]');
            logger.debug(`🎯 Interests container:`, interestsContainer);
            if (interestsContainer) {
              interestsContainer.classList.add('border-royal-crimson', 'bg-royal-crimson/10', 'animate-shake');
              logger.debug(`✅ Applied red border to interests container`);
            }
          }
        }
      });
      
      // Animate first error field and scroll to it
      const firstError = Object.keys(errors)[0];
      logger.debug('🎯 First error field:', firstError);
      let el: Element | null = null;
      
      el = document.querySelector(`[data-field="${firstError}"]`);
      
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
      
      // Handle empty dropdown values by setting defaults for required fields
      // If user doesn't pick a value, set the first option as default
      const dropdownDefaults = {
        gender: 'Male', // Default to first option
        maritalStatus: 'Never Married', // Default to first option
        manglik: 'No', // Default to second option (more common)
        complexion: 'Medium', // Default to second option
        eatingHabit: 'Vegetarian', // Default to first option
        smokingHabit: 'No', // Default to second option (more common)
        drinkingHabit: 'No', // Default to second option (more common)
        settleAbroad: 'Maybe' // Default to third option (neutral)
      };
      
      // Set default values for empty dropdown fields
      enumFields.forEach(field => {
        if (cleanProfile[field] === '' || cleanProfile[field] === null || cleanProfile[field] === undefined) {
          cleanProfile[field] = dropdownDefaults[field as keyof typeof dropdownDefaults];
          logger.debug(`🎯 Set default value for ${field}: ${cleanProfile[field]}`);
        }
      });
      
      // Handle interests - ensure at least one interest is selected
      if (!cleanProfile.interests || cleanProfile.interests.length === 0) {
        cleanProfile.interests = ['Reading']; // Default interest
        logger.debug('🎯 Set default interest: Reading');
      }
      
      // Use backend calculation - let the backend calculate the completion
      logger.debug(`📊 Profile completion will be calculated by backend`);
      
      logger.debug('🧹 Cleaned profile data:', cleanProfile);
      
      // Prepare profile data for API
      const profileData = {
        ...cleanProfile,
        // Include temporary image information for completeness calculation
        images: cleanProfile.images,
        isFirstLogin: false // Set to false when profile is complete
      };

      logger.debug('📤 Sending profile data to backend:', profileData);
      logger.debug('📸 Image status:', {
        existingImage: profile?.images || signedImageUrl,
        tempImageFile: tempImageFile ? 'exists' : 'none',
        tempImageUrl: tempImageUrl ? 'exists' : 'none',
        finalImages: profileData.images
      });
      logger.debug('🎯 Dropdown values being sent:', {
        gender: profileData.gender,
        maritalStatus: profileData.maritalStatus,
        manglik: profileData.manglik,
        complexion: profileData.complexion,
        eatingHabit: profileData.eatingHabit,
        smokingHabit: profileData.smokingHabit,
        drinkingHabit: profileData.drinkingHabit,
        settleAbroad: profileData.settleAbroad
      });

      // Check if user has a profile picture (either existing or temporary)
      const hasExistingImage = profile?.images || signedImageUrl;
      const hasTemporaryImage = tempImageFile || tempImageUrl;
      
      if (!hasExistingImage && !hasTemporaryImage) {
        setUploadMessage('❌ Please select a profile picture before saving. Click the camera icon to upload an image.');
        setIsUploading(false);
        return; // Stop the save process
      }

      // Upload image to B2 if there's a temporary image
      let uploadedFileName: string | null = null;
      if (tempImageFile) {
        const loadingToast = ToastService.loading('☁️ Saving your profile picture...');
        try {
          const uploadResult = await ImageUploadService.uploadProfileImage(tempImageFile);
          if (uploadResult.success && uploadResult.imageUrl) {
            uploadedFileName = uploadResult.fileName || null;
            setSignedImageUrl(uploadResult.imageUrl);
            setTempImageFile(null);
            setTempImageUrl(null);
            logger.debug('✅ Image uploaded to B2:', uploadResult.imageUrl);
            posthog.capture('profile_photo_uploaded', { file_type: tempImageFile.type });
            ToastService.dismiss(loadingToast);
            ToastService.profilePictureVerificationPending();
          } else {
            throw new Error(uploadResult.error || 'Failed to upload image');
          }
        } catch (uploadError) {
          logger.error('❌ Image upload failed:', uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          
          ToastService.dismiss(loadingToast);
          
          if (errorMessage.includes('No file provided')) {
            ToastService.error('❌ Please select a profile picture before saving. Click the camera icon to upload an image.');
            setIsUploading(false);
            return;
          }
          
          ToastService.error(errorMessage.includes('Authentication') ? errorMessage : 'Failed to upload image. Please try again.');
          setIsUploading(false);
          return;
        }
      }

      const authHeaders = await getAuthHeaders();

      // Call backend API to update profile
      const response = await apiClient.put('/api/profiles/me', {
        ...profileData,
        ...(uploadedFileName ? { images: uploadedFileName } : {}),
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        credentials: 'include',
        timeout: 20000
      });

      if (!response.ok) {
        throw new Error(response.data?.error || `Failed to save profile (${response.status})`);
      }

      const result = response.data;
      
      logger.debug('📥 Backend response after save:', result);
      
      if (result.success) {
        // Get the updated profile completeness from backend
        const backendCompleteness = result.profileCompleteness || calculatedCompleteness;
        logger.debug('📊 Backend calculated completeness:', backendCompleteness);
        
        // Add a small delay to ensure backend has fully processed the update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh profile data from backend to ensure all fields are properly updated
        let refreshedProfile: Record<string, any> | null = null;
        try {
          // Add cache-busting parameter to ensure fresh data
          const refreshHeaders = await getAuthHeaders();
          const response = await apiClient.get(`/api/profiles/me?t=${Date.now()}`, {
            headers: {
              ...refreshHeaders,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            credentials: 'include',
            timeout: 15000
          });

          if (response.ok) {
            const data = response.data;
            logger.debug('📥 Raw backend response after refresh:', data);
            // Backend returns: { success: true, user: { userId, email, userUuid, profile: {...}, ... } }
            if (data.success && data.user) {
              refreshedProfile = {
                ...data.user.profile,
                email: data.user.email,
                userUuid: data.user.userUuid,
                isFirstLogin: data.user.isFirstLogin,
                id: data.user.userId?.toString(),
                role: data.user.role || 'user',
                verified: data.user.verification?.isVerified || false,
                lastActive: data.user.lastActive || new Date().toISOString(),
                hasSeenOnboardingMessage: data.user.hasSeenOnboardingMessage || false,
                // ✅ FIX: preserve profileCompleteness so profile page never shows empty
                profileCompleteness: data.user.profile?.profileCompleteness ?? data.user.profileCompleteness ?? backendCompleteness
              };
              setProfile(refreshedProfile);
              logger.debug('🔄 Profile refreshed from backend with cache-busting:', refreshedProfile);
              logger.debug('📊 Refreshed profile completeness:', refreshedProfile?.profileCompleteness);
            } else {
              logger.error('❌ Invalid profile data structure in response:', data);
            }
          } else {
            logger.error('Failed to refresh profile:', response.status);
          }
        } catch (refreshError) {
          logger.error('Error refreshing profile:', refreshError);
          // Fallback to local update if refresh fails
          setProfile(prev => ({
            ...prev,
            ...profileData,
            profileCompleteness: backendCompleteness
          }));
        }
        
        // Profile completion is now handled server-side
        
        // Clear all hints and validation indicators
        setFieldHints({});
        setTiltAnimationFields({});
        setInteractedFields({});
        
 // Clear all validation timeouts
        Object.values(validationTimeouts).forEach(timeout => {
          if (timeout) clearTimeout(timeout);
        });
        setValidationTimeouts({});
        
        // Show success message with profile picture verification info
        if (uploadedFileName) {
          setTimeout(() => {
            setUploadMessage('');
          }, 500);
        }
        
        posthog.capture('profile_saved', { completeness: backendCompleteness, photo_uploaded: !!uploadedFileName });
        if (backendCompleteness >= 100) {
          ToastService.profileSaved();
        } else {
          ToastService.info(`Profile saved successfully! (${backendCompleteness}% complete) Please complete all required fields to access all features.`);
        }
        
        // Clear temporary image state after successful save
        if (tempImageFile || tempImageUrl) {
          setTempImageFile(null);
          setTempImageUrl(null);
        }
        
        // Exit edit mode
        setIsEditing(false);
        setFieldErrors({});
        setInteractedFields({}); // Clear field interaction states
        setShowOnboarding(false); // Hide onboarding overlay
        
        // Clear all border styling from fields after successful save
        document.querySelectorAll('[data-field]').forEach(el => {
          const element = el as HTMLElement;
          element.classList.remove('border-royal-crimson', 'border-emerald-600', 'bg-royal-crimson/10', 'bg-emerald-900/30', 'animate-shake');
          element.style.boxShadow = '';
          element.style.borderRadius = '';
          element.style.padding = '';
          element.style.margin = '';
        });
        
        // Clear all hints and validation indicators
        setFieldHints({});
        setTiltAnimationFields({});
        
        // Clear all validation timeouts
        Object.values(validationTimeouts).forEach(timeout => {
          if (timeout) clearTimeout(timeout);
        });
        setValidationTimeouts({});
        
        // Redirect to dashboard after a short delay if profile is 100% complete
        if (backendCompleteness >= 100) {
          // Mark user as not first login since profile is complete
          try {
            await OnboardingService.markProfileCompleted();
            logger.debug('✅ User marked as not first login (profile complete)');
          } catch (error) {
            logger.error('Error marking profile as completed:', error);
            // Continue with redirect even if flag update fails
          }
          
          // ✅ FIX: Update local context directly to avoid Rate Limit errors
          updateUser({ profileCompleteness: backendCompleteness });
          setShowCompletionOverlay(true);
        }
      } else {
        throw new Error(result.error || 'Failed to save profile');
      }
    } catch (error) {
      logger.error('Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile. Please try again.';
              ToastService.error(errorMessage);
    } finally {
      // Reset button state
      const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement;
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Changes';
      }
    }
    setHasSeenOnboarding(true);
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

      setUploadMessage('🔍 Validating image...');

      // Validate image using ImageCompression utility
      const validation = ImageCompression.validateImage(file);
      if (!validation.valid) {
        setUploadMessage(`❌ ${validation.error || 'Invalid image file'}`);
        setIsUploading(false);
        return;
      }

      // Check file size before creating preview
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setUploadMessage('❌ File too large. Please select an image less than 2MB');
        setIsUploading(false);
        return;
      }

      // Create preview URL for immediate display
      const previewUrl = await ImageCompression.createPreviewUrl(file);
      
      // Store file and preview URL for later B2 upload
      setTempImageFile(file);
      setTempImageUrl(previewUrl);
      
      // Update profile state to include temporary image for completion calculation
      setProfile(prev => ({
        ...(prev || {}),
        images: prev?.images || 'temp_image_uploaded'
      }));
      
      setUploadMessage('Image selected! Click "Save Changes" to upload');
      
      // Clear the success message after a short delay
      setTimeout(() => {
        setUploadMessage('');
      }, 3000);
    } catch (error) {
      logger.error('Image validation error:', error);
      setUploadMessage('❌ Error processing image. Please try again with a different photo.');
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteProfilePicture = async () => {
    // If there's a temporary image, just clear it
    if (tempImageFile || tempImageUrl) {
      setTempImageFile(null);
      setTempImageUrl(null);
      
      // Remove temporary image from profile state
      setProfile(prev => ({
        ...prev,
        images: prev.images === 'temp_image_uploaded' ? null : prev.images
      }));
      
      setUploadMessage('✅ Temporary image removed');
      setTimeout(() => {
        setUploadMessage('');
      }, 2000);
      return;
    }

    // If there's an existing profile image, delete from B2
    if (!profile?.images && !signedImageUrl) return;

    setIsUploading(true);
    setUploadMessage('🗑️ Deleting profile picture...');

    try {
      const success = await ImageUploadService.deleteProfilePictureFromB2();
      
      if (success) {
        // Remove image from profile
        setProfile(prev => ({
          ...prev,
          images: null
        }));
        
        setUploadMessage('✅ Profile picture deleted successfully!');
        
        // Clear the success message after a short delay
        setTimeout(() => {
          setUploadMessage('');
        }, 3000);
      } else {
        setUploadMessage('❌ Failed to delete profile picture');
      }
    } catch (error) {
      logger.error('Profile picture deletion error:', error);
      setUploadMessage('❌ Error deleting profile picture. Please try again.');
    } finally {
      setIsUploading(false);
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
      pattern: /^(Under 5L|5L - 10L|10L - 20L|20L - 50L|50L - 1Cr|Above 1Cr)$/,
      maxLength: 20,
      minLength: 1,
      message: 'Please select an annual income range'
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
      pattern: /^[0-5]$/,
      maxLength: 1,
      minLength: 1,
      message: 'Number of brothers should be between 0 and 5',
      customValidation: (value: string) => {
        const num = parseInt(value);
        return num >= 0 && num <= 5;
      }
    },
    sisters: {
      pattern: /^[0-5]$/,
      maxLength: 1,
      minLength: 1,
      message: 'Number of sisters should be between 0 and 5',
      customValidation: (value: string) => {
        const num = parseInt(value);
        return num >= 0 && num <= 5;
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
      minLength: 10,
      message: 'About section should be meaningful (min 10 characters, max 500 characters)',
      customValidation: (value: string) => {
        // Check for placeholder content
        const placeholderPatterns = ['naaaa', 'test', 'placeholder', 'dummy'];
        return !placeholderPatterns.some(pattern => 
          value.toLowerCase().includes(pattern.toLowerCase())
        );
      }
    },
    dateOfBirth: {
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      maxLength: 10,
      minLength: 10,
      customValidation: (value: string) => {
        if (!value) return false;
        
        const birthDate = new Date(value);
        const today = new Date();
        
        // Check if date is valid and in the past
        if (isNaN(birthDate.getTime()) || birthDate >= today) {
          return false;
        }
        
        // Calculate age
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        
        // Gender-specific age validation
        const gender = profile?.gender;
        if (gender === 'Male') {
          return calculatedAge >= 21 && calculatedAge <= 80;
        } else if (gender === 'Female') {
          return calculatedAge >= 18 && calculatedAge <= 80;
        }
        
        // Default validation if gender not specified
        return calculatedAge >= 18 && calculatedAge <= 80;
      },
      message: 'Date of birth must be valid and meet age requirements (Male: 21+, Female: 18+)'
    },
    height: {
      pattern: /^\d+'(\d+)?"?$/,
      maxLength: 10,
      minLength: 3,
      customValidation: (value: string) => {
        if (!value) return false;
        
        // Parse height in feet and inches format (e.g., "5'8"", "6'2"")
        const heightMatch = value.match(/^(\d+)'(\d+)"?$/);
        if (!heightMatch) return false;
        
        const feet = parseInt(heightMatch[1]);
        const inches = parseInt(heightMatch[2]);
        
        // Convert to total inches for validation
        const totalInches = (feet * 12) + inches;
        
        // Min 4 feet (48 inches), Max 8 feet (96 inches)
        return totalInches >= 48 && totalInches <= 96;
      },
      message: 'Height must be between 4\'0" and 8\'0" in feet and inches format (e.g., 5\'8")'
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
  const validateFieldInput = (fieldName: string, value: any): { isValid: boolean; message: string } => {
    const rules = fieldValidationRules[fieldName as keyof typeof fieldValidationRules];
    if (!rules) return { isValid: true, message: '' };

    // Check if value is empty
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return { isValid: false, message: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required` };
    }

    const trimmedValue = typeof value === 'string' ? value.trim() : value;

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

  // Helper function to generate input className with dynamic border colors
  const getInputClassName = (fieldName: string) => {
    const baseClasses = "w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal-gold transition-all duration-300";
    
    const value = profile[fieldName];
    const fieldConfig = FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS];
    const isValid = fieldConfig ? fieldConfig.validation(value) : true;
    const hasValue = value !== undefined && value !== null && value !== '';
    
    const hasUserInteracted = interactedFields[fieldName];
    
    if (tiltAnimationFields[fieldName]) {
      return `${baseClasses} border-royal-crimson bg-royal-crimson/10`;
    } else if (hasUserInteracted && !isValid) {
      return `${baseClasses} border-royal-crimson bg-royal-crimson/10 text-royal-crimson shadow-[0_0_10px_rgba(239,68,68,0.2)]`;
    } else if ((hasUserInteracted || hasValue) && isValid) {
      return `${baseClasses} border-emerald-500 bg-emerald-900/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]`;
    } else if (activeField === fieldName) {
      return `${baseClasses} border-royal-gold bg-white/5 text-white`;
    } else {
      return `${baseClasses} border-royal-gold/20 bg-royal-obsidian text-white hover:border-royal-gold/40`;
    }
  };

  // Helper function to get select element className with dynamic borders
  const getSelectClassName = (fieldName: string) => {
    const baseClasses = "w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal-gold transition-all duration-300";
    
    const value = profile[fieldName];
    const fieldConfig = FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS];
    const isValid = fieldConfig ? fieldConfig.validation(value) : true;
    const hasValue = value !== undefined && value !== null && value !== '';
    
    const hasUserInteracted = interactedFields[fieldName];
    
    if (tiltAnimationFields[fieldName]) {
      return `${baseClasses} border-royal-crimson bg-royal-crimson/10`;
    } else if (hasUserInteracted && !isValid) {
      return `${baseClasses} border-royal-crimson bg-royal-crimson/10 text-royal-crimson shadow-[0_0_10px_rgba(239,68,68,0.2)]`;
    } else if ((hasUserInteracted || hasValue) && isValid) {
      return `${baseClasses} border-emerald-500 bg-emerald-900/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]`;
    } else if (activeField === fieldName) {
      return `${baseClasses} border-royal-gold bg-white/5 text-white`;
    } else {
      return `${baseClasses} border-royal-gold/20 bg-royal-obsidian text-white hover:border-royal-gold/40`;
    }
  };

  // Helper function to get date/time picker className with dynamic borders
  const getDatePickerClassName = (fieldName: string) => {
    const baseClasses = "w-full border rounded-lg transition-all duration-300";
    
    const value = profile[fieldName];
    const fieldConfig = FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS];
    const isValid = fieldConfig ? fieldConfig.validation(value) : true;
    const hasValue = value !== undefined && value !== null && value !== '';
    
    const hasUserInteracted = interactedFields[fieldName];
    
    if (tiltAnimationFields[fieldName]) {
      return `${baseClasses} border-royal-crimson bg-royal-crimson/10`;
    } else if (hasUserInteracted && !isValid) {
      return `${baseClasses} border-royal-crimson bg-royal-crimson/10`;
    } else if ((hasUserInteracted || hasValue) && isValid) {
      return `${baseClasses} border-emerald-500 bg-emerald-900/10 text-emerald-400`;
    } else {
      return `${baseClasses} border-royal-gold/20 bg-royal-obsidian hover:border-royal-gold/40`;
    }
  };

  // Helper function to get progress bar color based on completion percentage
  const getProgressBarColor = (completion: number) => {
    if (completion >= 100) {
      return 'bg-royal-gold shadow-[0_0_15px_rgba(212,175,55,0.5)]';
    } else if (completion >= 80) {
      return 'bg-royal-gold/80';
    } else if (completion >= 60) {
      return 'bg-royal-gold/60';
    } else if (completion >= 40) {
      return 'bg-royal-gold/40';
    } else {
      return 'bg-royal-gold/20';
    }
  };

  // Handle field change with debounced validation and tilt animation
  const handleFieldChange = (fieldName: string, value: string) => {
    const nextValue = sanitizeProfileField(fieldName, value);
    // Clear existing timeout for this field
    if (validationTimeouts[fieldName]) {
      clearTimeout(validationTimeouts[fieldName]);
    }

    // Update profile immediately
    setProfile(prev => ({
      ...prev,
      [fieldName]: nextValue
    }));

    // Clear field error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: false
      }));
    }

    // Clear any existing tilt animation for this field
    setTiltAnimationFields(prev => ({
      ...prev,
      [fieldName]: false
    }));

    // Mark field as interacted when user starts typing
    setInteractedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Show hint immediately when user starts typing
    setFieldHints(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Debug logging for field-specific interactions
    logger.debug(`🎯 Field interaction for ${fieldName}:`, {
      value: nextValue,
      fieldErrors: fieldErrors[fieldName],
      interactedFields: interactedFields[fieldName],
      fieldHints: fieldHints[fieldName]
    });

    // Set a timeout for validation (1.5 seconds after user stops typing)
    const timeout = setTimeout(() => {
      const validation = validateFieldInput(fieldName, nextValue);
      const fieldConfig = FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS];
      const isValid = fieldConfig ? fieldConfig.validation(nextValue) : true;
      
      // Update field errors
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: !isValid
      }));

      // Check if field is now valid and mark as completed
      if (isValid) {
        markFieldAsCompleted(fieldName);
        // Hide hint when field becomes valid
        setFieldHints(prev => ({
          ...prev,
          [fieldName]: false
        }));
      } else {
        // Remove completion mark if field becomes invalid
        setCompletedFields(prev => ({
          ...prev,
          [fieldName]: false
        }));
        // Keep hint visible for invalid fields
        setFieldHints(prev => ({
          ...prev,
          [fieldName]: true
        }));
      }

      // Trigger tilt animation if validation fails
      if (!isValid) {
        logger.debug(`❌ ${fieldName}: ${validation.message}`);
        
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
  const HEIGHT_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const f = Math.floor(i / 12) + 4;
    const inc = i % 12;
    return { value: `${f}'${inc}"`, label: `${f} ft ${inc} in` };
  });






  // When overlay is dismissed, set hasSeenOnboarding to true
  // Handle filter application
  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    const hasActive = newFilters.selectedProfessions.length > 0 ||
                     newFilters.selectedCountry !== '' ||
                     newFilters.selectedState !== '' ||
                     newFilters.ageRange[0] !== 18 ||
                     newFilters.ageRange[1] !== 70;
    setHasActiveFilters(hasActive);
  };



  useEffect(() => {
    const loadProfile = async () => {
      try {
        logger.debug('🔄 Profile: Loading user profile...');
        
        // Load user profile
        const profileData = await ProfileService.getUserProfile();
        
        if (profileData) {
          // The ProfileService now returns flattened data directly
          setProfile(profileData);
          
          // Use backend data as authoritative source for onboarding logic
          const isFirstLoginFromApi = profileData.isFirstLogin;
          const profileCompletenessFromApi = profileData.profileCompleteness;
          const hasSeenOnboardingMessageFromApi = profileData.hasSeenOnboardingMessage;
          
          logger.debug('🔍 Profile page onboarding check:', {
            isFirstLogin: isFirstLoginFromApi,
            profileCompleteness: profileCompletenessFromApi,
            hasSeenOnboardingMessage: hasSeenOnboardingMessageFromApi,
            profileDataKeys: Object.keys(profileData)
          });
          
          // Show onboarding overlay for first-time users who haven't seen the message
          if (isFirstLoginFromApi && !hasSeenOnboardingMessageFromApi) {
            logger.debug('🎯 Showing onboarding overlay for first-time user');
            setShowOnboarding(true);
            setHasSeenOnboarding(false);
          } else {
            // For all other cases, don't show onboarding
            logger.debug('📝 User has seen onboarding or is returning user');
            setShowOnboarding(false);
            setHasSeenOnboarding(true);
            
            // If profile is incomplete AND wizard hasn't been finished, enable Royal Wizard
            if ((profileCompletenessFromApi ?? 0) < 100 && !profileData.hasCompletedWizard) {
              setShowWizard(true);
              setIsEditing(true); // Keep isEditing for backward compatibility in some components
            }

          }
        } else {
          logger.warn('⚠️ Profile data not available or incomplete', {
            hasProfileData: !!profileData,
            profileDataKeys: profileData ? Object.keys(profileData) : 'null'
          });
          // Set a default empty profile to prevent errors
          setProfile({});
          setShowOnboarding(false);
          setHasSeenOnboarding(true);
          setIsEditing(true);
        }
      } catch (error: any) {
        logger.error('❌ Error loading profile:', error);
        
        if (error.message === 'RATE_LIMIT_EXCEEDED') {
          ToastService.info('Please wait a moment before refreshing your profile.');
          // Don't wipe existing profile state on rate limit
        } else {
          // Set a default empty profile to prevent errors
          setProfile({});
          setShowOnboarding(false);
          setHasSeenOnboarding(true);
          setIsEditing(true);
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  // Show loading screen only while loading profile, not for authentication
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-royal-obsidian p-4 md:p-8 space-y-8 mt-16 max-w-4xl mx-auto">
        <RoyalLoader variant="skeleton" className="w-full h-48 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <RoyalLoader key={i} variant="skeleton" className="w-full h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-royal-obsidian px-4">
        <div className="flex flex-col items-center space-y-6 p-10 bg-royal-gold/5 rounded-2xl shadow-lg border border-royal-gold/20">
          <Image src="/icons/user.svg" alt="No Profile" width={80} height={80} className="mb-2 opacity-60 filter grayscale contrast-200" />
          <h2 className="text-2xl font-bold text-royal-gold">No Profile Data</h2>
          <p className="text-royal-gold-light/60 text-center max-w-md">We couldn't find your profile information. Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

  // NOTE: onboarding effect moved earlier to preserve hook order and avoid React hooks ordering errors

  // Handle onboarding message dismissal
  const handleOnboardingDismiss = async () => {
    try {
      // Mark onboarding message as seen
      await OnboardingService.markOnboardingMessageSeen();
      
      // Update local state
      setShowOnboarding(false);
      
      // If profile is incomplete AND wizard hasn't been finished, transition to Royal Wizard
      if (profile && (profile.profileCompleteness || 0) < 100 && !profile.hasCompletedWizard) {
        setShowWizard(true);
      }
      
      logger.debug('✅ Onboarding message marked as seen');
    } catch (error) {
      logger.error('Error marking onboarding message as seen:', error);
      // Still hide the message locally even if API call fails
      setShowOnboarding(false);
    }
  };

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-royal-obsidian">
        <OnboardingOverlay
          isVisible={showOnboarding}
          onComplete={handleOnboardingDismiss}
        />
      </div>
    );
  }

  if (showWizard) {
    return (
      <RoyalOnboardingWizard 
        initialProfile={profile} 
        onComplete={async (finalProfile) => {
          setProfile(finalProfile);
          setShowWizard(false);
          setIsEditing(false);
          
          // Mark wizard as completed regardless of completeness percentage
          try {
            await ProfileService.updateProfile({ hasCompletedWizard: true });
            logger.info('✅ Wizard marked as completed');
            
            // CRITICAL: Update local auth state instead of forceRefresh
            updateUser({ hasCompletedWizard: true });
            logger.info('🔄 Local Auth state updated after wizard completion');
          } catch (error) {
            logger.error('Error marking wizard as completed:', error);
          }

          // Force a refresh to recalculate completeness
          const updatedProfile = await ProfileService.getUserProfile();
          setProfile(updatedProfile);

          // Redirect to dashboard if profile is now 100% complete
          if (updatedProfile && (updatedProfile.profileCompleteness || 0) >= 100) {
            try {
              await OnboardingService.markProfileCompleted();
              updateUser({ profileCompleteness: 100 });
              setShowCompletionOverlay(true);
            } catch (error) {
              logger.error('Error marking profile as completed:', error);
              setShowCompletionOverlay(true);
            }
          } else {
            setIsEditing(true); // Automatically put them in edit mode
            ToastService.info('Please complete the remaining fields highlighted in red to unlock all features.');
          }

        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-royal-obsidian relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-royal-obsidian backdrop-blur-[2.5px]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(212,175,55,0.05),transparent_50%)]"></div>
      
      <ProfileCompletionOverlay 
        isVisible={showCompletionOverlay} 
        onComplete={() => {
          setShowCompletionOverlay(false);
          router.push('/dashboard');
        }} 
      />
      
  {/* Content */}
  <div className="relative z-10 page-transition" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))' }}>

        {/* Pinned Progress Bar */}
        {calculatedCompleteness < 100 && (
          <div className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top,0px)]">
            <div className="relative h-[3px] w-full bg-royal-gold/10">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-royal-gold via-royal-gold-light to-royal-gold shadow-[0_0_15px_rgba(212,175,55,0.8)] transition-all duration-700 ease-out"
                style={{ width: `${calculatedCompleteness}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1),0_0_20px_rgba(212,175,55,1)] transition-all duration-700 ease-out"
                style={{ left: `${calculatedCompleteness}%` }}
              />
              {/* Floating % badge */}
              <div
                className="absolute -top-5 -translate-x-1/2 text-[10px] font-bold text-royal-gold transition-all duration-700 ease-out"
                style={{ left: `${calculatedCompleteness}%` }}
              >
                {calculatedCompleteness}%
              </div>
            </div>
          </div>
        )}

        {/* Profile Complete Success Banner */}
        {isProfileComplete && (
          <div className="mx-4 mb-6 bg-royal-gold/10 border border-royal-gold/30 rounded-xl p-4 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-royal-gold mb-1">
                  Profile Complete! 🎉
                </h3>
                <p className="text-xs text-royal-gold-light/80">
                  You can now access Discover and Matches features
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Profile Header */}
        <div className="px-6 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-playfair font-bold text-royal-gold">Sacred Profile</h1>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={() => {
                  setIsEditing(true);
                }}
                className="flex items-center space-x-2 px-5 py-2.5 bg-royal-gold text-royal-obsidian rounded-xl text-sm font-bold shadow-lg shadow-royal-gold/10 active:scale-95 transition-all"
              >
                <CustomIcon name="ri-edit-line" size={16} />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setShowWizard(false);
                  }}
                  className="px-5 py-2.5 bg-royal-gold/10 text-royal-gold border border-royal-gold/20 rounded-xl text-sm font-bold active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Image */}
        <div className="px-4 py-6">
          <div className="flex flex-col items-center justify-center gap-4">
            {/* Profile Image Container - Centrally Aligned */}
            <div 
              className={`relative w-32 h-32 ${isEditing ? 'cursor-pointer group' : ''}`}
              onClick={isEditing ? handleCameraClick : undefined}
            >
              {/* 1. Temp preview image (just selected, not yet uploaded) */}
              {tempImageUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={tempImageUrl}
                    alt="Profile Preview"
                    width={128}
                    height={128}
                    className={`w-full h-full rounded-full object-cover object-top border-4 border-royal-gold shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 bg-royal-obsidian/40 ${isEditing ? 'group-hover:opacity-80 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]' : ''}`}
                  />
                </div>
              ) : signedImageUrl ? (
                /* 2. Signed URL ready — show actual image */
                <div className="relative w-full h-full">
                  <Image
                    src={signedImageUrl}
                    alt="Profile"
                    width={128}
                    height={128}
                    className={`w-full h-full rounded-full object-cover object-top border-4 border-royal-gold shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all duration-300 bg-royal-obsidian/40 ${isEditing ? 'group-hover:opacity-80 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]' : ''}`}
                    onError={(e) => {
                      logger.error('❌ Signed image failed to load:', e);
                      setSignedImageUrl(null); // Clear broken URL
                      setImageLoadFailed(true);
                    }}
                  />
                </div>
              ) : profile?.images && !imageLoadFailed ? (
                /* 3. Image stored in backend but signed URL still loading */
                <div className="w-full h-full rounded-full border-4 border-royal-gold/60 bg-royal-obsidian/60 flex items-center justify-center"
                  style={{ minHeight: 128, minWidth: 128 }}
                >
                  <div className="w-8 h-8 border-2 border-royal-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                /* 4. No image at all */
                <div className="w-full h-full flex flex-col items-center justify-center rounded-full border-4 border-dashed border-royal-gold/30 bg-royal-obsidian/40 transition-all duration-200 relative"
                  style={{ minHeight: 128, minWidth: 128 }}
                >
                  <Image
                    src="/icons/user.svg"
                    alt="Profile Placeholder"
                    width={64}
                    height={64}
                    className="mx-auto mb-2 opacity-40 brightness-200"
                  />
                  <span className="text-xs text-royal-gold/60 font-semibold">No Photo</span>
                  
                  {/* Small camera icon for upload when editing */}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCameraClick();
                      }}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-royal-obsidian/90 text-royal-gold flex items-center justify-center shadow-lg hover:bg-royal-obsidian hover:text-royal-gold-light transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-royal-gold border border-royal-gold/40"
                      aria-label="Upload profile photo"
                    >
                      <CustomIcon name="ri-camera-line" className="text-sm" />
                    </button>
                  )}
                </div>
              )}

              
              {/* Camera and Delete icons for editing - show when there's an image (temporary or existing) */}
              {isEditing && (tempImageUrl || signedImageUrl || (profile?.images && !imageLoadFailed)) && (
                <>
                  {/* Camera icon for upload */}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCameraClick();
                    }}
                    className="absolute -bottom-2 -right-2 text-royal-gold hover:text-royal-gold-light transition-colors duration-200 cursor-pointer bg-royal-obsidian rounded-full p-1"
                    aria-label="Change profile photo"
                  >
                    <CustomIcon name="ri-camera-line" size={22} />
                  </button>
                  
                  {/* Delete icon */}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteProfilePicture();
                    }}
                    className="absolute -top-2 -right-2 text-royal-crimson hover:text-royal-crimson transition-colors duration-200 cursor-pointer bg-royal-obsidian rounded-full p-1"
                    title={tempImageUrl ? "Remove temporary image" : "Delete profile picture"}
                  >
                    <CustomIcon name="ri-delete-bin-line" size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Upload Message */}
          {uploadMessage && (
            <div className={`mt-2 p-2 rounded-lg text-sm ${
              uploadMessage.includes('❌') ? 'bg-royal-crimson/20 text-royal-crimson' :
              uploadMessage.includes('Image selected!') ? 'bg-emerald-900/40 text-emerald-400' :
              uploadMessage.includes('✅') ? 'bg-emerald-900/40 text-emerald-400' :
              'bg-blue-100 text-blue-700'
            }`}>
              {uploadMessage}
            </div>
          )}
          

          {/* Hidden File Input for Image Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onClick={(event) => {
              event.currentTarget.value = '';
            }}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Profile Name and Quick Info */}
        <div ref={profileInfoRef} className="px-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-playfair font-bold text-white">{profile.name}</h1>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-royal-gold-light/60 mb-4">
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
        <div ref={profileDetailsRef} className="px-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch pb-6">
          {/* Basic Information */}
          <div className="card-modern p-6 hover-lift flex flex-col h-full">
            <h2 className="font-playfair font-bold text-royal-gold mb-4 flex items-center">
              <CustomIcon name="ri-user-line" size={20} className="text-royal-gold mr-3" />
              Basic Information
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderFieldLabel('name', 'Name')}
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name || ""}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      onFocus={() => handleFieldFocus('name')}
                      onBlur={() => handleFieldBlur('name')}
                      placeholder={getFieldPlaceholder('name')}
                      data-field="name"
                      maxLength={30}
                      className={getInputClassName('name')}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-white/90 text-sm">{profile.name || 'Not specified'}</p>
                    </div>
                  )}
                  {renderInlineError('name')}
                </div>
                
                <div>
                  {renderFieldLabel('gender', 'Gender')}
                  {isEditing ? (
                    <select
                      value={profile.gender || ""}
                      onChange={(e) => handleFieldChange('gender', e.target.value)}
                      onFocus={() => handleFieldFocus('gender')}
                      onBlur={() => handleFieldBlur('gender')}
                      data-field="gender"
                      className={getSelectClassName('gender')}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  ) : (
                    <p className="text-white/90 text-sm">{profile.gender || 'Not specified'}</p>
                  )}
                  {renderInlineError('gender')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderFieldLabel('nativePlace', 'Native Place')}
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
                    <p className="text-white/90 text-sm">{profile.nativePlace || 'Not specified'}</p>
                  )}
                  {renderInlineError('nativePlace')}
                </div>
                
                <div>
                  {renderFieldLabel('currentResidence', 'Current Residence')}
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
                    <p className="text-white/90 text-sm">{profile.currentResidence || 'Not specified'}</p>
                  )}
                  {renderInlineError('currentResidence')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderFieldLabel('maritalStatus', 'Marital Status')}
                  {isEditing ? (
                    <select
                      value={profile.maritalStatus || ""}
                      onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
                      onFocus={() => handleFieldFocus('maritalStatus')}
                      onBlur={() => handleFieldBlur('maritalStatus')}
                      data-field="maritalStatus"
                      className={getSelectClassName('maritalStatus')}
                    >
                      <option value="">Select Marital Status</option>
                      <option value="Never Married">Never Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  ) : (
                    <p className="text-white/90 text-sm">{profile.maritalStatus || 'Not specified'}</p>
                  )}
                  {renderInlineError('maritalStatus')}
                </div>
                
                <div>
                  {renderFieldLabel('manglik', 'Manglik')}
                  {isEditing ? (
                    <select
                      value={profile.manglik || ""}
                      onChange={(e) => handleFieldChange('manglik', e.target.value)}
                      onFocus={() => handleFieldFocus('manglik')}
                      onBlur={() => handleFieldBlur('manglik')}
                      data-field="manglik"
                      className={getSelectClassName('manglik')}
                    >
                      <option value="">Select Manglik Status</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Don't Know">Don't Know</option>
                    </select>
                  ) : (
                    <p className="text-white/90 text-sm">{profile.manglik || 'Not specified'}</p>
                  )}
                  {renderInlineError('manglik')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Birth Details */}
          <div className="card-modern p-6 hover-lift flex flex-col h-full">
            <h2 className="font-playfair font-bold text-royal-gold mb-4 flex items-center">
              <CustomIcon name="ri-calendar-line" size={20} className="text-royal-gold mr-3" />
              Birth Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  {renderFieldLabel('dateOfBirth', 'Date of Birth')}
                  {isEditing ? (
                    <div
                      onFocus={() => handleFieldFocus('dateOfBirth')}
                      onBlur={() => handleFieldBlur('dateOfBirth')}
                      data-field="dateOfBirth"
                      className={getDatePickerClassName('dateOfBirth')}
                    >
                      <DatePicker
                        date={dateValue.startDate ? (() => {
                          const date = new Date(dateValue.startDate);
                          return isNaN(date.getTime()) ? undefined : date;
                        })() : undefined}
                        onChange={date => {
                          setDateValue({ 
                            startDate: date ? date.toISOString().split('T')[0] : null, 
                            endDate: date ? date.toISOString().split('T')[0] : null 
                          });
                          const dateString = date ? date.toISOString().split('T')[0] : '';
                          handleFieldChange('dateOfBirth', dateString);
                        }}
                        className="!border-none !bg-transparent hover:!bg-transparent focus:!ring-0 shadow-none"
                      />
                    </div>
                  ) : (
                    <p className="text-white/90 text-sm">
                      {(() => {
                        if (profile.dateOfBirth instanceof Date) {
                          return format(profile.dateOfBirth, 'PPP');
                        } else if (profile.dateOfBirth) {
                          const date = new Date(profile.dateOfBirth);
                          return isNaN(date.getTime()) ? 'Not specified' : format(date, 'PPP');
                        }
                        return 'Not specified';
                      })()}
                    </p>
                  )}
                  {renderInlineError('dateOfBirth')}
                </div>
                <div>
                  {renderFieldLabel('timeOfBirth', 'Time of Birth')}
                  {isEditing ? (
                    <div
                      onFocus={() => handleFieldFocus('timeOfBirth')}
                      onBlur={() => handleFieldBlur('timeOfBirth')}
                      data-field="timeOfBirth"
                      className={getDatePickerClassName('timeOfBirth')}
                    >
                      <TimePicker
                        time={clockTime}
                        onChange={date => {
                          if (date) setClockTime(date);
                          handleFieldChange('timeOfBirth', date ? formatTime(date) : '');
                        }}
                        className="!border-none !bg-transparent hover:!bg-transparent focus:!ring-0 shadow-none"
                      />
                    </div>
                  ) : (
                    <p className="text-white/90 text-sm">
                      {(() => {
                        if (profile.timeOfBirth instanceof Date) {
                          return format(profile.timeOfBirth, 'hh:mm aa');
                        } else if (profile.timeOfBirth) {
                          const time = parseTimeOfBirth(profile.timeOfBirth);
                          return time ? format(time, 'hh:mm aa') : 'Not specified';
                        }
                        return 'Not specified';
                      })()}
                    </p>
                  )}
                </div>
                <div>
                  {renderFieldLabel('placeOfBirth', 'Place')}
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.placeOfBirth || ""}
                      onChange={(e) => handleFieldChange('placeOfBirth', e.target.value)}
                      onFocus={() => handleFieldFocus('placeOfBirth')}
                      onBlur={() => handleFieldBlur('placeOfBirth')}
                      placeholder={getFieldPlaceholder('placeOfBirth')}
                      data-field="placeOfBirth"
                      maxLength={30}
                      className={getInputClassName('placeOfBirth')}
                    />
                  ) : (
                    <p className="text-white/90 text-sm">{profile.placeOfBirth || 'Not specified'}</p>
                  )}
                  {renderInlineError('placeOfBirth')}
                </div>
              </div>
            </div>
          </div>

          {/* Physical Details */}
          <div className="card-modern p-6 hover-lift flex flex-col h-full">
            <h2 className="font-playfair font-bold text-royal-gold mb-4 flex items-center">
              <CustomIcon name="ri-user-heart-line" size={20} className="text-royal-gold mr-3" />
              Physical Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  {renderFieldLabel('height', 'Height')}
                  {isEditing ? (
                    <>
                      <div className="flex flex-col md:flex-row gap-2 w-full">
                        <select
                          value={profile.height || ""}
                          onChange={e => handleFieldChange('height', e.target.value)}
                          onFocus={() => handleFieldFocus('height')}
                          onBlur={() => handleFieldBlur('height')}
                          data-field="height"
                          className={`w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal-gold bg-royal-obsidian text-white transition-all duration-300 appearance-none ${
                            fieldErrors.height ? 'border-royal-crimson bg-royal-crimson/10' : 
                            (profile.height && profile.height.match(/^(\d+)'(\d+)"*$/)) ? 'border-emerald-500 bg-emerald-900/10 text-emerald-400' : 'border-royal-gold/20 hover:border-royal-gold/40'
                          }`}
                        >
                          <option value="">Select Height</option>
                          {HEIGHT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                      {renderInlineError('height')}
                    </>
                  ) : (
                    <p className="text-white/90 text-sm">{profile.height || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  {renderFieldLabel('weight', 'Weight')}
                  {isEditing ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={profile.weight || ""}
                      onChange={(e) => handleFieldChange('weight', e.target.value)}
                      placeholder="e.g. 65"
                      data-field="weight"
                      className={getInputClassName('weight')}
                    />
                  ) : (
                    <p className="text-white/90 text-sm">{profile.weight || 'Not specified'}</p>
                  )}
                  {renderInlineError('weight')}
                </div>
                <div>
                  {renderFieldLabel('complexion', 'Complexion')}
                  {isEditing ? (
                    <select
                      value={profile.complexion || ""}
                      onChange={(e) => handleFieldChange('complexion', e.target.value)}
                      onFocus={() => handleFieldFocus('complexion')}
                      onBlur={() => handleFieldBlur('complexion')}
                      data-field="complexion"
                      className={getSelectClassName('complexion')}
                    >
                      <option value="">Select Complexion</option>
                      <option value="Fair">Fair</option>
                      <option value="Medium">Medium</option>
                      <option value="Dark">Dark</option>
                    </select>
                  ) : (
                    <p className="text-white/90 text-sm">{profile.complexion || 'Not specified'}</p>
                  )}
                  {renderInlineError('complexion')}
                </div>
              </div>
            </div>
          </div>

          {/* Gotra Details */}
          <div className="card-modern p-6 hover-lift flex flex-col h-full">
            <h2 className="font-playfair font-bold text-royal-gold mb-4 flex items-center">
              <CustomIcon name="ri-yantra-line" size={20} className="text-royal-gold mr-3" />
              Gotra Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderFieldLabel('fatherGotra', 'Father\'s Gotra')}
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
                    <p className="text-white/90 text-sm">{profile.fatherGotra || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  {renderFieldLabel('motherGotra', 'Mother\'s Gotra')}
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
                    <p className="text-white/90 text-sm">{profile.motherGotra || 'Not specified'}</p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  {renderFieldLabel('grandfatherGotra', 'Grandfather\'s Gotra')}
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.grandfatherGotra || ""}
                      onChange={(e) => handleFieldChange('grandfatherGotra', e.target.value)}
                      onFocus={() => handleFieldFocus('grandfatherGotra')}
                      onBlur={() => handleFieldBlur('grandfatherGotra')}
                      placeholder={getFieldPlaceholder('grandfatherGotra')}
                      data-field="grandfatherGotra"
                      className={getInputClassName('grandfatherGotra')}
                    />
                  ) : (
                    <p className="text-white/90 text-sm">{profile.grandfatherGotra || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  {renderFieldLabel('grandmotherGotra', 'Grandmother\'s Gotra')}
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.grandmotherGotra || ""}
                      onChange={(e) => handleFieldChange('grandmotherGotra', e.target.value)}
                      onFocus={() => handleFieldFocus('grandmotherGotra')}
                      onBlur={() => handleFieldBlur('grandmotherGotra')}
                      placeholder={getFieldPlaceholder('grandmotherGotra')}
                      data-field="grandmotherGotra"
                      className={getInputClassName('grandmotherGotra')}
                    />
                  ) : (
                    <p className="text-white/90 text-sm">{profile.grandmotherGotra || 'Not specified'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="card-modern p-6 hover-lift flex flex-col h-full">
            <h2 className="font-playfair font-bold text-royal-gold mb-4 flex items-center">
              <CustomIcon name="ri-briefcase-line" size={20} className="text-royal-gold mr-3" />
              Professional Details
            </h2>
            <div className="space-y-4">
              <div>
                {renderFieldLabel('education', 'Education')}
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.education || ""}
                    onChange={(e) => handleFieldChange('education', e.target.value)}
                    onFocus={() => handleFieldFocus('education')}
                    onBlur={() => handleFieldBlur('education')}
                    placeholder={getFieldPlaceholder('education')}
                    data-field="education"
                    maxLength={20}
                    className={getInputClassName('education')}
                  />
                ) : (
                  <p className="text-white/90 text-sm">{profile.education || 'Not specified'}</p>
                )}
                {renderInlineError('education')}
              </div>
              <div>
                {renderFieldLabel('occupation', 'Occupation')}
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.occupation || ""}
                    onChange={(e) => handleFieldChange('occupation', e.target.value)}
                    onFocus={() => handleFieldFocus('occupation')}
                    onBlur={() => handleFieldBlur('occupation')}
                    placeholder={getFieldPlaceholder('occupation')}
                    data-field="occupation"
                    maxLength={20}
                    className={getInputClassName('occupation')}
                  />
                ) : (
                  <p className="text-white/90 text-sm">{profile.occupation || 'Not specified'}</p>
                )}
                {renderInlineError('occupation')}
              </div>
              <div>
                {renderFieldLabel('annualIncome', 'Annual Income')}
                {isEditing ? (
                  <select
                    value={profile.annualIncome ?? ""}
                    onChange={(e) => handleFieldChange('annualIncome', e.target.value)}
                    onFocus={() => handleFieldFocus('annualIncome')}
                    onBlur={() => handleFieldBlur('annualIncome')}
                    data-field="annualIncome"
                    className={getSelectClassName('annualIncome')}
                  >
                    <option value="">Select Annual Income</option>
                    {INCOME_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-white/90 text-sm">{profile.annualIncome || 'Not specified'}</p>
                )}
                {renderInlineError('annualIncome')}
              </div>
            </div>
          </div>

          {/* Lifestyle */}
          <div className="card-modern p-6 hover-lift flex flex-col h-full">
            <h2 className="font-playfair font-bold text-royal-gold mb-4 flex items-center">
              <CustomIcon name="ri-heart-3-line" size={20} className="text-royal-gold mr-3" />
              Lifestyle
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderFieldLabel('smokingHabit', 'Smoking')}
                  {isEditing ? (
                    <select
                      value={profile.smokingHabit || ""}
                      onChange={(e) => handleFieldChange('smokingHabit', e.target.value)}
                      onFocus={() => handleFieldFocus('smokingHabit')}
                      onBlur={() => handleFieldBlur('smokingHabit')}
                      data-field="smokingHabit"
                      className={getSelectClassName('smokingHabit')}
                    >
                      <option value="">Select Smoking Habit</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Occasionally">Occasionally</option>
                    </select>
                  ) : (
                    <p className="text-white/90 text-sm">{profile.smokingHabit || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  {renderFieldLabel('drinkingHabit', 'Drinking')}
                  {isEditing ? (
                    <select
                      value={profile.drinkingHabit || ""}
                      onChange={(e) => handleFieldChange('drinkingHabit', e.target.value)}
                      onFocus={() => handleFieldFocus('drinkingHabit')}
                      onBlur={() => handleFieldBlur('drinkingHabit')}
                      data-field="drinkingHabit"
                      className={getSelectClassName('drinkingHabit')}
                    >
                      <option value="">Select Drinking Habit</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Occasionally">Occasionally</option>
                    </select>
                  ) : (
                    <p className="text-white/90 text-sm">{profile.drinkingHabit || 'Not specified'}</p>
                  )}
                </div>
              </div>
              <div>
                {renderFieldLabel('eatingHabit', 'Eating Habit')}
                {isEditing ? (
                  <select
                    value={profile.eatingHabit || ""}
                    onChange={(e) => handleFieldChange('eatingHabit', e.target.value)}
                    onFocus={() => handleFieldFocus('eatingHabit')}
                    onBlur={() => handleFieldBlur('eatingHabit')}
                    data-field="eatingHabit"
                    className={getSelectClassName('eatingHabit')}
                  >
                    <option value="">Select Eating Habit</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Eggetarian">Eggetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                  </select>
                ) : (
                  <p className="text-white/90 text-sm">{profile.eatingHabit || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Family Details */}
          <div className="card-modern p-6 hover-lift flex flex-col h-full">
            <h2 className="font-playfair font-bold text-royal-gold mb-4 flex items-center">
              <CustomIcon name="ri-group-line" size={20} className="text-royal-gold mr-3" />
              Family Details
            </h2>
            <div className="space-y-4">
              <div>
                {renderFieldLabel('father', 'Father')}
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
                  <p className="text-white/90 text-sm">{profile.father || 'Not specified'}</p>
                )}
              </div>
              <div>
                {renderFieldLabel('mother', 'Mother')}
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
                  <p className="text-white/90 text-sm">{profile.mother || 'Not specified'}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderFieldLabel('brothers', 'Brothers')}
                  {isEditing ? (
                    <select
                      value={profile.brothers ?? ""}
                      onChange={(e) => handleFieldChange('brothers', e.target.value)}
                      onFocus={() => handleFieldFocus('brothers')}
                      onBlur={() => handleFieldBlur('brothers')}
                      data-field="brothers"
                      className={getSelectClassName('brothers')}
                    >
                      <option value="">Select</option>
                      {SIBLING_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                                  ) : (
                  <p className="text-white/90 text-sm">{profile.brothers ?? 'Not specified'}</p>
                )}
                </div>
                <div>
                  {renderFieldLabel('sisters', 'Sisters')}
                  {isEditing ? (
                    <select
                      value={profile.sisters ?? ""}
                      onChange={(e) => handleFieldChange('sisters', e.target.value)}
                      onFocus={() => handleFieldFocus('sisters')}
                      onBlur={() => handleFieldBlur('sisters')}
                      data-field="sisters"
                      className={getSelectClassName('sisters')}
                    >
                      <option value="">Select</option>
                      {SIBLING_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                                  ) : (
                  <p className="text-white/90 text-sm">{profile.sisters ?? 'Not specified'}</p>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card-modern p-6 hover-lift flex flex-col h-full">
            <h2 className="font-playfair font-bold text-royal-gold mb-4 flex items-center">
              <CustomIcon name="ri-settings-line" size={20} className="text-royal-gold mr-3" />
              Preferences
            </h2>
            <div className="space-y-4">
              <div>
                {renderFieldLabel('specificRequirements', 'Specific Requirements')}
                {isEditing ? (
                  <textarea
                    value={profile.specificRequirements || ""}
                    onChange={(e) => handleFieldChange('specificRequirements', e.target.value)}
                    rows={2}
                    maxLength={50}
                    placeholder="e.g. Looking for a well-educated, family-oriented person."
                    data-field="specificRequirements"
                    className={`w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal-gold resize-none ${getInputClassName('specificRequirements')}`}
                  />
                ) : (
                  <p className="text-white/90 text-sm">{profile.specificRequirements || 'Not specified'}</p>
                )}
              </div>
              <div>
                {renderFieldLabel('settleAbroad', 'Willingness to Settle Abroad')}
                {isEditing ? (
                  <select
                    value={profile.settleAbroad || ""}
                    onChange={(e) => handleFieldChange('settleAbroad', e.target.value)}
                    onFocus={() => handleFieldFocus('settleAbroad')}
                    onBlur={() => handleFieldBlur('settleAbroad')}
                    data-field="settleAbroad"
                    className={getSelectClassName('settleAbroad')}
                  >
                    <option value="">Select Preference</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Maybe">Maybe</option>
                  </select>
                ) : (
                  <p className="text-white/90 text-sm">{profile.settleAbroad || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>

          {/* About */}
          <div className="card-modern p-6 hover-lift flex flex-col h-full">
            <h2 className="font-playfair font-bold text-royal-gold mb-4 flex items-center">
              <CustomIcon name="ri-file-text-line" size={20} className="text-royal-gold mr-3" />
              About Me
              {isEditing && isRequiredField('about') && (
                <span className="text-royal-crimson ml-1">*</span>
              )}
            </h2>
            {isEditing ? (
              <textarea
                value={profile.about || ""}
                onChange={(e) => handleFieldChange('about', e.target.value)}
                onFocus={() => handleFieldFocus('about')}
                onBlur={() => handleFieldBlur('about')}
                rows={4}
                maxLength={500}
                placeholder={getFieldPlaceholder('about')}
                data-field="about"
                className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-royal-gold resize-none ${getInputClassName('about')}`}
              />
            ) : (
              <p className="text-white/90">{profile.about || 'Not specified'}</p>
            )}
            {renderInlineError('about')}
          </div>

          {/* Interests */}
          <div 
            className={`card-modern p-6 hover-lift transition-all duration-300 ${
              fieldErrors.interests ? 'border-2 border-royal-crimson bg-royal-crimson/10' : 
              (profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0) ? 'border-2 border-emerald-500 bg-emerald-900/10' : 
              'border border-royal-gold/20'
            }`} 
            data-field="interests"
            onFocus={() => handleFieldFocus('interests')}
            onBlur={() => handleFieldBlur('interests')}
          >
            <h2 className="font-playfair font-bold text-royal-gold mb-4 flex items-center">
              <CustomIcon name="ri-heart-line" size={20} className="text-royal-gold mr-3" />
              Interests
              {isEditing && isRequiredField('interests') && (
                <span className="text-royal-crimson ml-1">*</span>
              )}
            </h2>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(profile.interests) && profile.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-royal-gold/20 text-royal-gold rounded-full text-sm shadow-sm hover:bg-royal-gold/30 transition-colors duration-150"
                >
                  {interest}
                  {isEditing && (
                    <button
                      onClick={() => removeInterest(index)}
                      className="ml-2 text-royal-gold hover:text-white"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {isEditing && (
                <button 
                  onClick={() => setShowInterestModal(true)}
                  className="px-3 py-1 border border-dashed border-royal-gold/40 text-royal-gold/60 hover:text-royal-gold hover:border-royal-gold/60 hover:bg-royal-gold/10 rounded-full text-sm transition-colors duration-200"
                >
                  + Add Interest
                </button>
              )}
            </div>
            {renderInlineError('interests')}
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="md:col-span-2 space-y-3 relative z-[100001]">
              <button
                onClick={handleSave}
                data-save-button
                className={`w-full py-4 text-lg font-semibold hover-lift transition-all duration-300 rounded-xl ${
                  calculatedCompleteness >= 100 
                    ? 'bg-gradient-to-r from-royal-gold to-royal-gold-light text-royal-obsidian hover:from-royal-gold-light hover:to-royal-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]' 
                    : 'bg-gradient-to-r from-royal-gold/20 to-royal-gold/10 border border-royal-gold/50 text-royal-gold shadow-[0_4px_14px_0_rgba(212,175,55,0.2)] hover:from-royal-gold/30 hover:to-royal-gold/20 hover:border-royal-gold hover:shadow-[0_6px_20px_rgba(212,175,55,0.3)] backdrop-blur-sm transform hover:-translate-y-0.5'
                }`}
                style={{ position: 'relative', zIndex: 100002 }}
              >
                {calculatedCompleteness >= 100 ? '🎉 Save Complete Profile' : 'Save Changes'}
              </button>
            </div>
          )}
      {/* Filter Modal */}
      {showFilter && (
        <FilterModal
          onClose={() => setShowFilter(false)}
          onApply={handleApplyFilters}
          currentFilters={filters}
        />
      )}

      {/* Interest Modal */}
      {showInterestModal && (
        <InterestModal
          onClose={() => setShowInterestModal(false)}
          onAdd={addInterest}
          existingInterests={profile.interests || []}
        />
      )}


      {/* Bottom Navigation is handled globally in layout.tsx */}
        </div>
      </div>
  );
}

export default function Profile() {
  return (
    <AuthGuardV2 requiresCompleteProfile={false}>
      <ProfileContent />
    </AuthGuardV2>
  );
}
