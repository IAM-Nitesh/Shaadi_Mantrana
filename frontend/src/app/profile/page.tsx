'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InterestModal from './InterestModal';
import { ImageUploadService, UploadResult } from '../../services/image-upload-service';
import ServerAuthGuard from '../../components/ServerAuthGuard';
import CustomIcon from '../../components/CustomIcon';
import ImageCompression from '../../utils/imageCompression';
import { gsap } from 'gsap';
import Image from 'next/image';
import { ProfileService } from '../../services/profile-service';
import { DatePicker } from '../../components/date-picker';
import { format } from 'date-fns';
import 'react-time-picker/dist/TimePicker.css';
import { TimePicker } from '../../components/time-picker';
import HeartbeatLoader from '../../components/HeartbeatLoader';
import StandardHeader from '../../components/StandardHeader';
import FilterModal, { type FilterState } from '../dashboard/FilterModal';
import SmoothNavigation from '../../components/SmoothNavigation';
import { matchesCountService } from '../../services/matches-count-service';
import ToastService from '../../services/toastService';
import { ServerAuthService } from '../../services/server-auth-service';
import OnboardingOverlay from '../../components/OnboardingOverlay';
import { useServerAuth } from '../../hooks/useServerAuth';

// Type definition for field configuration
interface FieldConfig {
  hint: string;
  placeholder: string;
  validation: (value: any) => boolean;
  errorMessage: string;
}

// Field hints configuration with backend-aligned validation
const FIELD_HINTS: { [key: string]: FieldConfig } = {
  name: {
    hint: "Enter your full name (minimum 2 characters)",
    placeholder: "e.g. Priya Sharma",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 2,
    errorMessage: "Full name must be at least 2 characters"
  },
  gender: {
    hint: "Select your gender",
    placeholder: "Choose gender",
    validation: (value: string) => value && ['Male', 'Female'].includes(value),
    errorMessage: "Please select your gender"
  },
  dateOfBirth: {
    hint: "Select your date of birth (Age: 18-80 years)",
    placeholder: "Choose date",
    validation: (value: string) => {
      if (!value) return false;
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 80;
    },
    errorMessage: "Age must be between 18-80 years"
  },
  height: {
    hint: "Select your height in feet and inches",
    placeholder: "e.g. 5'6\"",
    validation: (value: string) => {
      if (!value) return false;
      const match = value.match(/^(\d+)'(\d+)"*$/);
      if (!match) return false;
      const feet = parseInt(match[1]);
      const inches = parseInt(match[2]);
      const totalInches = (feet * 12) + inches;
      return totalInches >= 48 && totalInches <= 96;
    },
    errorMessage: "Please select your height"
  },
  weight: {
    hint: "Enter your weight in kg (30-200 kg)",
    placeholder: "e.g. 65",
    validation: (value: string) => {
      if (!value) return false;
      const weight = parseInt(value);
      return weight >= 30 && weight <= 200;
    },
    errorMessage: "Weight must be between 30-200 kg"
  },
  complexion: {
    hint: "Select your skin complexion",
    placeholder: "Choose complexion",
    validation: (value: string) => value && ['Fair', 'Medium', 'Dark'].includes(value),
    errorMessage: "Please select your skin complexion"
  },
  education: {
    hint: "Enter your highest education qualification (minimum 3 characters)",
    placeholder: "e.g. Bachelor's Degree, MBA, PhD",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 3,
    errorMessage: "Education qualification must be at least 3 characters"
  },
  occupation: {
    hint: "Enter your profession or occupation (minimum 3 characters)",
    placeholder: "e.g. Software Engineer, Doctor, Teacher",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 3,
    errorMessage: "Profession must be at least 3 characters"
  },
  annualIncome: {
    hint: "Enter your annual income in lakhs",
    placeholder: "e.g. 8",
    validation: (value: string) => {
      if (!value) return false;
      const income = parseInt(value);
      return income > 0;
    },
    errorMessage: "Please enter your annual income"
  },
  nativePlace: {
    hint: "Enter your native place/city (minimum 2 characters)",
    placeholder: "e.g. Mumbai, Delhi, Bangalore",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 2,
    errorMessage: "Native place must be at least 2 characters"
  },
  currentResidence: {
    hint: "Enter your current residence city (minimum 2 characters)",
    placeholder: "e.g. Mumbai, Delhi, Bangalore",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 2,
    errorMessage: "Current residence must be at least 2 characters"
  },
  maritalStatus: {
    hint: "Select your current marital status",
    placeholder: "Choose status",
    validation: (value: string) => value && ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'].includes(value),
    errorMessage: "Please select your marital status"
  },
  father: {
    hint: "Enter your father's name (minimum 2 characters)",
    placeholder: "e.g. Rajesh Kumar",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 2,
    errorMessage: "Father's name must be at least 2 characters"
  },
  mother: {
    hint: "Enter your mother's name (minimum 2 characters)",
    placeholder: "e.g. Sunita Devi",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 2,
    errorMessage: "Mother's name must be at least 2 characters"
  },
  about: {
    hint: "Tell us about yourself (minimum 10 characters)",
    placeholder: "Share your interests, values, and what you're looking for...",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 10,
    errorMessage: "About section must be at least 10 characters"
  },
  images: {
    hint: "Upload a clear profile picture",
    placeholder: "Click to upload photo",
    validation: (value: any) => value && typeof value === 'string' && value.trim() !== '',
    errorMessage: "Please upload a profile picture"
  },
  timeOfBirth: {
    hint: "Select your time of birth (required for accurate matching)",
    placeholder: "Choose time",
    validation: (value: any) => value && typeof value === 'string' && value.trim() !== '',
    errorMessage: "Please select your time of birth"
  },
  placeOfBirth: {
    hint: "Enter your place of birth (minimum 2 characters)",
    placeholder: "e.g. Mumbai, Delhi",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 2,
    errorMessage: "Place of birth must be at least 2 characters"
  },
  manglik: {
    hint: "Select your Manglik status",
    placeholder: "Choose status",
    validation: (value: string) => value && ['Yes', 'No', 'Dont Know'].includes(value),
    errorMessage: "Please select your Manglik status"
  },
  fatherGotra: {
    hint: "Enter your father's gotra (minimum 3 characters)",
    placeholder: "e.g. Kashyap, Vashisht, Bharadwaj",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 3,
    errorMessage: "Father's gotra must be at least 3 characters"
  },
  motherGotra: {
    hint: "Enter your mother's gotra (minimum 3 characters)",
    placeholder: "e.g. Kashyap, Vashisht, Bharadwaj",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 3,
    errorMessage: "Mother's gotra must be at least 3 characters"
  },
  grandfatherGotra: {
    hint: "Enter your grandfather's gotra (minimum 3 characters)",
    placeholder: "e.g. Kashyap, Vashisht, Bharadwaj",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 3,
    errorMessage: "Grandfather's gotra must be at least 3 characters"
  },
  grandmotherGotra: {
    hint: "Enter your grandmother's gotra (minimum 3 characters)",
    placeholder: "e.g. Kashyap, Vashisht, Bharadwaj",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 3,
    errorMessage: "Grandmother's gotra must be at least 3 characters"
  },
  brothers: {
    hint: "Enter number of brothers",
    placeholder: "e.g. 2",
    validation: (value: string) => {
      if (!value) return false;
      const count = parseInt(value);
      return count >= 0 && count <= 10;
    },
    errorMessage: "Please enter number of brothers"
  },
  sisters: {
    hint: "Enter number of sisters",
    placeholder: "e.g. 1",
    validation: (value: string) => {
      if (!value) return false;
      const count = parseInt(value);
      return count >= 0 && count <= 10;
    },
    errorMessage: "Please enter number of sisters"
  },
  eatingHabit: {
    hint: "Select your eating preference",
    placeholder: "Choose preference",
    validation: (value: string) => value && ['Vegetarian', 'Non-Vegetarian', 'Eggetarian'].includes(value),
    errorMessage: "Please select your eating preference"
  },
  smokingHabit: {
    hint: "Select your smoking preference",
    placeholder: "Choose preference",
    validation: (value: string) => value && ['Yes', 'No', 'Occasionally'].includes(value),
    errorMessage: "Please select your smoking preference"
  },
  drinkingHabit: {
    hint: "Select your drinking preference",
    placeholder: "Choose preference",
    validation: (value: string) => value && ['Yes', 'No', 'Occasionally'].includes(value),
    errorMessage: "Please select your drinking preference"
  },
  settleAbroad: {
    hint: "Select your preference for settling abroad",
    placeholder: "Choose preference",
    validation: (value: string) => value && ['Yes', 'No', 'Maybe'].includes(value),
    errorMessage: "Please select your preference for settling abroad"
  },
  interests: {
    hint: "Add your interests and hobbies (minimum 1 interest)",
    placeholder: "e.g. Reading, Travel, Music",
    validation: (value: any) => {
      if (!value) return false;
      if (Array.isArray(value)) {
        return value.length > 0 && value.every(interest => interest && typeof interest === 'string' && interest.trim().length > 0);
      }
      return false;
    },
    errorMessage: "Please add at least 1 interest"
  },
  specificRequirements: {
    hint: "Enter any specific requirements or preferences (minimum 10 characters)",
    placeholder: "e.g. Looking for someone from same city, specific education background",
    validation: (value: any) => value && typeof value === 'string' && value.trim().length >= 10,
    errorMessage: "Specific requirements must be at least 10 characters"
  }
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

function ProfileContent() {
  const router = useRouter();
  const { user, isAuthenticated } = useServerAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  const [tiltAnimationFields, setTiltAnimationFields] = useState<{[key: string]: boolean}>({});
  const [validationTimeouts, setValidationTimeouts] = useState<{[key: string]: NodeJS.Timeout}>({});
  const [showFilter, setShowFilter] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ageRange: [18, 60],
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

  // GSAP refs for animations
  const headerRef = useRef<HTMLDivElement>(null);
  const profileInfoRef = useRef<HTMLDivElement>(null);
  const profileDetailsRef = useRef<HTMLDivElement>(null);

  // Field hints state
  const [fieldHints, setFieldHints] = useState<{[key: string]: boolean}>({});
  const [completedFields, setCompletedFields] = useState<{[key: string]: boolean}>({});
  const [interactedFields, setInteractedFields] = useState<{[key: string]: boolean}>({});

  // Helper functions for field hints
  const getFieldHint = (fieldName: string) => {
    return FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS]?.hint || '';
  };

  const getFieldPlaceholder = (fieldName: string) => {
    return FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS]?.placeholder || '';
  };

  const isFieldValid = (fieldName: string, value: any) => {
    const fieldConfig = FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS];
    if (!fieldConfig) return true;
    
    // Add debugging for specific problematic fields
    if (fieldName === 'about' || fieldName === 'education' || fieldName === 'occupation' || fieldName === 'interests') {
      const isValid = fieldConfig.validation(value);
      console.log(`🔍 Validation debug for ${fieldName}:`, {
        value,
        trimmedValue: typeof value === 'string' ? (value ? value.trim() : 'undefined') : value,
        trimmedLength: typeof value === 'string' ? (value ? value.trim().length : 'N/A') : 'N/A',
        isValid,
        validationRule: fieldConfig.validation.toString()
      });
      return isValid;
    }
    
    return fieldConfig.validation(value);
  };

  const shouldShowHint = (fieldName: string) => {
    if (!isEditing) return false;
    const value = profile[fieldName];
    const isValid = isFieldValid(fieldName, value);
    
    // Only show hints after user has interacted with THIS specific field
    const hasUserInteracted = interactedFields[fieldName];
    const shouldShow = !isValid && fieldHints[fieldName] && hasUserInteracted;
    
    // Debug logging for problematic fields
    if (fieldName === 'about' || fieldName === 'education' || fieldName === 'occupation' || fieldName === 'interests') {
      console.log(`💡 Hint debug for ${fieldName}:`, {
        value,
        isValid,
        fieldHints: fieldHints[fieldName],
        hasUserInteracted,
        shouldShow,
        isEditing
      });
    }
    
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
    
    // Debug logging for field-specific validation
    if (fieldName === 'about' || fieldName === 'education' || fieldName === 'occupation' || fieldName === 'interests') {
      console.log(`🚨 Error validation for ${fieldName}:`, {
        value,
        isValid,
        hasUserInteracted,
        shouldShow,
        interactedFields: interactedFields[fieldName]
      });
    }
    
    return shouldShow;
  };

  // Function to get error message for a field
  const getErrorMessage = (fieldName: string) => {
    const fieldConfig = FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS];
    return fieldConfig?.errorMessage || 'This field is required';
  };

  const handleFieldFocus = (fieldName: string) => {
    // Mark field as interacted when user focuses on it
    setInteractedFields(prev => ({ ...prev, [fieldName]: true }));
    // Show hint when user focuses on field
    setFieldHints(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleFieldBlur = (fieldName: string) => {
    // Only hide hint if field is valid, keep hint visible for invalid fields
    const value = profile[fieldName];
    const isValid = isFieldValid(fieldName, value);
    
    // Debug logging for field-specific blur
    console.log(`👁️ Field blur for ${fieldName}:`, {
      value,
      isValid,
      interactedFields: interactedFields[fieldName]
    });
    
    if (isValid) {
      // Hide hint after a moment for valid fields
      setTimeout(() => {
        setFieldHints(prev => ({ ...prev, [fieldName]: false }));
      }, 2000);
    }
    // Keep hint visible for invalid fields
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

  // Test validation with profile data (for debugging only)
  useEffect(() => {
    if (profile && isEditing) {
      const problematicFields = ['about', 'education', 'occupation', 'interests'];
      
      // Test validation with actual data
      console.log('🧪 Testing validation with profile data:', {
        about: profile.about,
        education: profile.education,
        occupation: profile.occupation,
        interests: profile.interests
      });
      
      // Test with the exact data you provided
      const testData = {
        about: "sd    sdsds.     dsdsd shadbvdfhjbfjdf",
        education: "saaaaasadfdvbv",
        occupation: "asadfgfhgfdhj",
        interests: ["reading", "yoga"]
      };
      
      console.log('🧪 Testing with exact provided data:');
      problematicFields.forEach(fieldName => {
        const testValue = testData[fieldName as keyof typeof testData];
        const testIsValid = isFieldValid(fieldName, testValue);
        console.log(`🧪 Test validation for ${fieldName}:`, {
          value: testValue,
          isValid: testIsValid,
          trimmedValue: typeof testValue === 'string' ? (testValue ? testValue.trim() : 'undefined') : testValue,
          trimmedLength: typeof testValue === 'string' ? (testValue ? testValue.trim().length : 'N/A') : 'N/A'
        });
      });
    }
  }, [profile, isEditing]);

  // Real-time profile completeness tracking
  useEffect(() => {
    if (profile && isEditing) {
      // Recalculate completion percentage in real-time
      const currentCompleteness = calculateProfileCompletion(profile);
      
      console.log('📊 Real-time completeness update:', {
        currentCompleteness,
        backendCompleteness: profile.profileCompleteness
      });
    }
  }, [profile, isEditing]);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    try {
      console.log('✅ Onboarding message marked as seen');
      await ProfileService.updateOnboardingMessage(true);
    } catch (error) {
      console.error('❌ Error updating onboarding message:', error);
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
  const [dateValue, setDateValue] = useState({ startDate: null, endDate: null });
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
        // If already a Date, use as is; if string, parse to Date
        const t = profile.timeOfBirth;
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

  // Authentication is now handled by ServerAuthGuard
  useEffect(() => {
            // Authentication is handled by useServerAuth hook
  }, []);

  // Fetch profile from backend after authentication
  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    ProfileService.getUserProfile().then((apiProfile) => {
      if (apiProfile) {
        // Use API profile directly from MongoDB
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
        // Onboarding is handled by ServerAuthService.shouldShowOnboarding()
        console.log('✅ Profile set successfully');
        
        // Profile completion is now handled by the backend
        console.log('✅ Profile completion handled by backend');
        
        // User ID is now handled server-side
        
        // Force authentication refresh to get latest user data
        (async () => {
          try {
            await ProfileService.forceAuthRefresh();
          } catch (error) {
            console.error('Failed to force auth refresh:', error);
          }
        })();
        
        // Always fetch signed URL for profile image if it exists
        if (apiProfile.images) {
          console.log('🔍 Profile image found:', apiProfile.images);
          
          // Always fetch signed URL, regardless of whether it's a direct B2 URL or not
          console.log('🔄 Fetching signed URL for profile image...');
          
          // Add a small delay to ensure the profile is fully loaded
          setTimeout(() => {
            ImageUploadService.getMyProfilePictureSignedUrl()
              .then((signedUrl) => {
                if (signedUrl) {
                  setSignedImageUrl(signedUrl);
                  console.log('✅ Signed URL fetched:', signedUrl);
                } else {
                  console.log('⚠️ No signed URL returned for profile image');
                }
              })
              .catch((error) => {
                console.error('Failed to fetch signed URL:', error);
              });
          }, 100);
        } else {
          console.log('ℹ️ No profile image found in profile data');
          console.log('🔍 Profile structure:', apiProfile);
        }
      } else {
        // No profile found, create empty profile for new user
        console.log('📋 No profile found, creating empty profile for new user');
        const emptyProfile = {
          email: '',
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
        setProfile(emptyProfile);
        // Onboarding is handled by ServerAuthService.shouldShowOnboarding()
      }
      setLoadingProfile(false);
    }).catch((error) => {
      console.error('Failed to load profile:', error);
      setLoadingProfile(false);
    });
  }, [isAuthenticated]);

  // REMOVED: This useEffect was causing race conditions
  // All onboarding and redirection logic is now handled in the main authentication useEffect above

  // Calculate profile completeness at the top level so it's available everywhere
  const calculateProfileCompletion = (profile: any): number => {
    if (!profile) return 0;
    // If backend provides profileCompleteness, use it as the authoritative source
    if (profile.profileCompleteness !== undefined) {
      return profile.profileCompleteness;
    }
    // Fallback to frontend calculation if backend doesn't provide profileCompleteness
    const requiredFields = [
      'name', 'gender', 'dateOfBirth', 'height', 'weight', 'complexion',
      'education', 'occupation', 'annualIncome', 'nativePlace', 'currentResidence',
      'maritalStatus', 'father', 'mother', 'about', 'images',
      'timeOfBirth', 'placeOfBirth', 'manglik', 'eatingHabit', 'smokingHabit', 
      'drinkingHabit', 'brothers', 'sisters', 'fatherGotra', 'motherGotra',
      'grandfatherGotra', 'grandmotherGotra', 'specificRequirements', 'settleAbroad',
      'interests'
    ];
    const optionalFields = [];
    let completedFields = 0;
    let totalWeight = 0;
    requiredFields.forEach(field => {
      totalWeight += 1;
      if (profile[field]) {
        if (field === 'images') {
          if (Array.isArray(profile[field]) && profile[field].length > 0) {
            completedFields += 1;
          } else if (typeof profile[field] === 'string' && profile[field] && profile[field].trim() !== '') {
            completedFields += 1;
          }
        } else if (typeof profile[field] === 'string' && profile[field] && profile[field].trim() !== '') {
          completedFields += 1;
        } else if (typeof profile[field] === 'number' && profile[field] > 0) {
          completedFields += 1;
        }
      }
    });
    const percentage = Math.min(100, Math.round((completedFields / totalWeight) * 100));
    return percentage;
  };

  // Use backend profileCompleteness as the authoritative source
  const calculatedCompleteness = profile?.profileCompleteness || 0;
  
  // Helper function to check if a field is required
  const isRequiredField = (fieldName: string) => {
    return requiredFields.includes(fieldName);
  };
  
  // Helper function to render field label with asterisk if required
  const renderFieldLabel = (fieldName: string, label: string) => {
    const isRequired = isRequiredField(fieldName);
    
    return (
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-800">
          {label}
          {isEditing && isRequired && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      </div>
    );
  };

  // Helper function to render inline error messages below input fields
  const renderInlineError = (fieldName: string) => {
    const showError = shouldShowError(fieldName);
    
    if (!showError) return null;
    
    return (
      <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <CustomIcon name="ri-error-warning-line" className="text-red-600 text-sm mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-800">{getErrorMessage(fieldName)}</p>
        </div>
      </div>
    );
  };

  // Debug logging for image completion
  console.log('📊 Profile completion debug:', {
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
            console.log('❌ Height field missing from profile data');
            return true; // Missing height field
          }
          // If height exists, also check if it's properly formatted
          const heightMatch = value.match(/(\d+)'(\d+)?/);
          if (!heightMatch) {
            console.log('❌ Height field has invalid format:', value);
            return true; // Invalid height format
          }
          console.log('✅ Height field is valid:', value);
          return false; // Height is valid
        }
        if (field === 'images') {
          return !value;
        }
        return value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '');
      });
      
      console.log('🔍 Missing fields detected:', missingFields);
      
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
      console.log('✅ Profile completion managed by backend');
    }
  }, [profile]);



  // GSAP premium entrance animation
  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated && !loadingProfile) {
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
  }, [isAuthenticated, loadingProfile]);

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
    if (showOnboarding) {
      // This useEffect is no longer needed as OnboardingOverlay handles its own timer
      console.log('✅ Onboarding overlay is visible');
    }
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [showOnboarding]);

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
    }
  }, [profile]);

  // Add lockout timer for onboarding overlay
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let interval: NodeJS.Timeout;
    if (showOnboarding) {
      // This useEffect is no longer needed as OnboardingOverlay handles its own timer
      console.log('✅ Onboarding overlay is visible');
    }
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [showOnboarding]);



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
              const fieldValue = profile[field];
        let isEmpty = false;
        let reason = '';
      
      // Special handling for height field (two dropdowns)
      if (field === 'height') {
        // Check if both height dropdowns have values
        const feetEl = document.querySelector(`[data-field="height-feet"]`) as HTMLSelectElement;
        const inchesEl = document.querySelector(`[data-field="height-inches"]`) as HTMLSelectElement;
        
        if (feetEl && inchesEl && feetEl.value && inchesEl.value && typeof feetEl.value === 'string' && feetEl.value.trim() !== '' && typeof inchesEl.value === 'string' && inchesEl.value.trim() !== '') {
          isEmpty = false;
          reason = 'valid height selection (both feet and inches)';
          console.log(`  📏 Height: feet="${feetEl.value}", inches="${inchesEl.value}", isEmpty: false`);
        } else {
          isEmpty = true;
          reason = 'missing height selection (feet or inches)';
          console.log(`  ❌ Height: feet="${feetEl?.value || 'undefined'}", inches="${inchesEl?.value || 'undefined'}", isEmpty: true`);
        }
      } else {
        console.log(`�� Checking field "${field}":`, fieldValue, `(type: ${typeof fieldValue})`);
        
        // Handle different data types
        if (fieldValue === null || fieldValue === undefined) {
          // For dropdown fields, check if the actual element has a value
          const dropdownFields = ['gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad', 'grandfatherGotra', 'grandmotherGotra'];
          if (dropdownFields.includes(field)) {
            const el = document.querySelector(`[data-field="${field}"]`) as HTMLSelectElement;
            if (el && el.value && typeof el.value === 'string' && el.value.trim() !== '') {
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
            isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
            reason = isEmpty ? 'empty dropdown selection' : 'valid dropdown selection';
            console.log(`  📝 Field "${field}" is dropdown, value: "${fieldValue}", isEmpty: ${isEmpty}`);
          } else {
            isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
            reason = isEmpty ? 'empty string after trim' : 'valid string';
            console.log(`  📝 Field "${field}" is string, trimmed: "${fieldValue && typeof fieldValue === 'string' ? fieldValue.trim() : 'undefined'}", isEmpty: ${isEmpty}`);
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
    
    // Don't set global field errors - let field-specific validation handle it
    // setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Show error message
      ToastService.error('Please fill in all required fields marked in red.');
      
      console.log('🎨 Applying error styling to fields:', Object.keys(errors));
      
      // Add red border styling to all missing fields
      Object.keys(errors).forEach(fieldName => {
        let el: HTMLElement | null = null;
        
        // Special handling for height field
        if (fieldName === 'height') {
          el = document.querySelector(`[data-field="height-feet"]`) as HTMLElement;
          console.log(`🎯 Height field - feet element:`, el);
          if (el) {
            el.classList.add('border-red-500', 'bg-red-50', 'animate-shake');
            console.log(`✅ Applied red border to height-feet element`);
          }
        } else {
          el = document.querySelector(`[data-field="${fieldName}"]`) as HTMLElement;
          console.log(`🎯 Field "${fieldName}" - element:`, el);
        }
        
        if (el) {
          // Add red border and background to highlight missing fields
          el.classList.add('border-red-500', 'bg-red-50', 'animate-shake');
          console.log(`✅ Applied red border to "${fieldName}" element`);
        } else {
          console.log(`⚠️ Could not find element with data-field="${fieldName}"`);
          
          // Special handling for interests field if element not found
          if (fieldName === 'interests') {
            const interestsContainer = document.querySelector('[data-field="interests"]');
            console.log(`🎯 Interests container:`, interestsContainer);
            if (interestsContainer) {
              interestsContainer.classList.add('border-red-500', 'bg-red-50', 'animate-shake');
              console.log(`✅ Applied red border to interests container`);
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
          console.log(`🎯 Set default value for ${field}: ${cleanProfile[field]}`);
        }
      });
      
      // Handle interests - ensure at least one interest is selected
      if (!cleanProfile.interests || cleanProfile.interests.length === 0) {
        cleanProfile.interests = ['Reading']; // Default interest
        console.log('🎯 Set default interest: Reading');
      }
      
      // Use backend calculation - let the backend calculate the completion
      console.log(`📊 Profile completion will be calculated by backend`);
      
      console.log('🧹 Cleaned profile data:', cleanProfile);
      
      // Prepare profile data for API
      const profileData = {
        ...cleanProfile,
        // Include temporary image information for completeness calculation
        images: cleanProfile.images,
        isFirstLogin: false // Set to false when profile is complete
      };

      console.log('📤 Sending profile data to backend:', profileData);
      console.log('📸 Image status:', {
        existingImage: profile.profile?.images || signedImageUrl,
        tempImageFile: tempImageFile ? 'exists' : 'none',
        tempImageUrl: tempImageUrl ? 'exists' : 'none',
        finalImages: profileData.images
      });
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

      // Check if user has a profile picture (either existing or temporary)
      const hasExistingImage = profile.profile?.images || signedImageUrl;
      const hasTemporaryImage = tempImageFile || tempImageUrl;
      
      if (!hasExistingImage && !hasTemporaryImage) {
        setUploadMessage('❌ Please select a profile picture before saving. Click the camera icon to upload an image.');
        setIsUploading(false);
        return; // Stop the save process
      }

      // Upload image to B2 if there's a temporary image
      let uploadedImageUrl = null;
      if (tempImageFile) {
        const loadingToast = ToastService.loading('☁️ Saving your profile picture...');
        try {
          const uploadResult = await ImageUploadService.uploadProfilePictureToB2(tempImageFile);
          if (uploadResult.success && uploadResult.imageUrl) {
            uploadedImageUrl = uploadResult.imageUrl;
            console.log('✅ Image uploaded to B2:', uploadedImageUrl);
            ToastService.dismiss(loadingToast);
            ToastService.profilePictureVerificationPending();
          } else {
            throw new Error(uploadResult.error || 'Failed to upload image');
          }
        } catch (uploadError) {
          console.error('❌ Image upload failed:', uploadError);
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          
          // Dismiss loading toast
          ToastService.dismiss(loadingToast);
          
          // Show specific error message for "No file provided"
          if (errorMessage.includes('No file provided')) {
            ToastService.error('❌ Please select a profile picture before saving. Click the camera icon to upload an image.');
            setIsUploading(false);
            return; // Stop the save process
          }
          
          ToastService.imageUploadError();
          throw new Error(`Failed to upload image: ${errorMessage}`);
        }
      }

      // Call backend API to update profile
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5500';
      const response = await fetch(`${apiBaseUrl}/api/profiles/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await ServerAuthService.getBearerToken()}`,
        },
        body: JSON.stringify({
          ...profileData,
          images: uploadedImageUrl || profileData.images
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Failed to save profile (${response.status})`);
      }

      const result = await response.json();
      
      console.log('📥 Backend response after save:', result);
      
      if (result.success) {
        // Get the updated profile completeness from backend
        const backendCompleteness = result.profileCompleteness || calculatedCompleteness;
        console.log('📊 Backend calculated completeness:', backendCompleteness);
        
        // Add a small delay to ensure backend has fully processed the update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Refresh profile data from backend to ensure all fields are properly updated
        let refreshedProfile = null;
        try {
          // Add cache-busting parameter to ensure fresh data
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5500';
          const response = await fetch(`${apiBaseUrl}/api/profiles/me?t=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${await ServerAuthService.getBearerToken()}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('📥 Raw backend response after refresh:', data);
            if (data.profile && data.profile.profile) {
              refreshedProfile = {
                ...data.profile.profile,
                email: data.profile.email,
                userUuid: data.profile.userUuid,
                isFirstLogin: data.profile.isFirstLogin,
                id: data.profile.userId?.toString(),
                role: 'user',
                verified: data.profile.verification?.isVerified || false,
                lastActive: data.profile.lastActive || new Date().toISOString()
              };
              setProfile(refreshedProfile);
              console.log('🔄 Profile refreshed from backend with cache-busting:', refreshedProfile);
              console.log('📊 Refreshed profile completeness:', refreshedProfile.profileCompleteness);
            } else {
              console.error('❌ Invalid profile data structure in response:', data);
            }
          } else {
            console.error('Failed to refresh profile:', response.status);
          }
        } catch (refreshError) {
          console.error('Error refreshing profile:', refreshError);
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
        if (uploadedImageUrl) {
          // Add a delay to simulate verification process
          setTimeout(() => {
            ToastService.profilePictureUploaded();
            setUploadMessage('');
          }, 500);
        }
        
        // Show appropriate success message based on backend completeness
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
          element.classList.remove('border-red-500', 'border-green-500', 'bg-red-50', 'bg-green-50', 'animate-shake');
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
        ...prev,
        images: prev.images || 'temp_image_uploaded'
      }));
      
      setUploadMessage('Image selected! Click "Save Changes" to upload');
      
      // Show toast notification for image selection
      setTimeout(() => {
        ToastService.profilePictureUploaded();
      }, 500);
      
      // Clear the success message after a short delay
      setTimeout(() => {
        setUploadMessage('');
      }, 3000);
    } catch (error) {
      console.error('Image validation error:', error);
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
    if (!profile.profile?.images && !signedImageUrl) return;

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
      console.error('Profile picture deletion error:', error);
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
    const baseClasses = "w-full p-2 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all duration-300";
    
    // Get current field value and validation status
    const value = profile[fieldName];
    const fieldConfig = FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS];
    const isValid = fieldConfig ? fieldConfig.validation(value) : true;
    const hasValue = value && (typeof value === 'string' ? value.trim() !== '' : true);
    
    // Only show validation indicators after user has interacted with THIS specific field
    const hasUserInteracted = interactedFields[fieldName];
    
    // Debug logging for problematic fields
    if (fieldName === 'about' || fieldName === 'education' || fieldName === 'occupation' || fieldName === 'interests') {
      console.log(`🎨 Border color debug for ${fieldName}:`, {
        value,
        hasValue,
        isValid,
        hasUserInteracted,
        willShowRed: hasUserInteracted && !isValid && hasValue,
        willShowGreen: hasUserInteracted && isValid && hasValue,
        interactedFields: interactedFields[fieldName]
      });
    }
    
    // Determine border color based on validation status - only after user interaction
    if (tiltAnimationFields[fieldName]) {
      return `${baseClasses} border-red-500 bg-red-50 animate-tilt-error-glow`;
    } else if (hasUserInteracted && !isValid && hasValue) {
      return `${baseClasses} border-red-500 bg-red-50 animate-shake`;
    } else if (hasUserInteracted && isValid && hasValue) {
      return `${baseClasses} border-green-500 bg-green-50`;
    } else {
      return `${baseClasses} border-gray-200`;
    }
  };

  // Helper function to get select element className with dynamic borders
  const getSelectClassName = (fieldName: string) => {
    const baseClasses = "w-full p-2 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all duration-300";
    
    // Get current field value and validation status
    const value = profile[fieldName];
    const fieldConfig = FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS];
    const isValid = fieldConfig ? fieldConfig.validation(value) : true;
    const hasValue = value && (typeof value === 'string' ? value.trim() !== '' : true);
    
    // Only show validation indicators after user has interacted with THIS specific field
    const hasUserInteracted = interactedFields[fieldName];
    
    // Determine border color based on validation status - only after user interaction
    if (tiltAnimationFields[fieldName]) {
      return `${baseClasses} border-red-500 bg-red-50 animate-tilt-error-glow`;
    } else if (hasUserInteracted && !isValid && hasValue) {
      return `${baseClasses} border-red-500 bg-red-50 animate-shake`;
    } else if (hasUserInteracted && isValid && hasValue) {
      return `${baseClasses} border-green-500 bg-green-50`;
    } else {
      return `${baseClasses} border-gray-200`;
    }
  };

  // Helper function to get date/time picker className with dynamic borders
  const getDatePickerClassName = (fieldName: string) => {
    const baseClasses = "w-full border-2 rounded-lg transition-all duration-300";
    
    // Get current field value and validation status
    const value = profile[fieldName];
    const fieldConfig = FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS];
    const isValid = fieldConfig ? fieldConfig.validation(value) : true;
    const hasValue = value && (typeof value === 'string' ? value.trim() !== '' : true);
    
    // Only show validation indicators after user has interacted with THIS specific field
    const hasUserInteracted = interactedFields[fieldName];
    
    // Determine border color based on validation status - only after user interaction
    if (tiltAnimationFields[fieldName]) {
      return `${baseClasses} border-red-500 bg-red-50 animate-tilt-error-glow`;
    } else if (hasUserInteracted && !isValid && hasValue) {
      return `${baseClasses} border-red-500 bg-red-50 animate-shake`;
    } else if (hasUserInteracted && isValid && hasValue) {
      return `${baseClasses} border-green-500 bg-green-50`;
    } else {
      return `${baseClasses} border-gray-200`;
    }
  };

  // Helper function to get progress bar color based on completion percentage
  const getProgressBarColor = (completion: number) => {
    if (completion >= 100) {
      return 'bg-gradient-to-r from-green-500 to-emerald-500';
    } else if (completion >= 80) {
      return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    } else if (completion >= 60) {
      return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    } else if (completion >= 40) {
      return 'bg-gradient-to-r from-orange-500 to-red-500';
    } else {
      return 'bg-gradient-to-r from-red-500 to-pink-500';
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
    console.log(`🎯 Field interaction for ${fieldName}:`, {
      value,
      fieldErrors: fieldErrors[fieldName],
      interactedFields: interactedFields[fieldName],
      fieldHints: fieldHints[fieldName]
    });

    // Set a timeout for validation (1.5 seconds after user stops typing)
    const timeout = setTimeout(() => {
      const validation = validateFieldInput(fieldName, value);
      const fieldConfig = FIELD_HINTS[fieldName as keyof typeof FIELD_HINTS];
      const isValid = fieldConfig ? fieldConfig.validation(value) : true;
      
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
  console.log('🔍 Height parsing debug:', {
    hasProfile: !!profile,
    hasHeightField: !!profile?.height,
    heightValue: profile?.height,
    heightType: typeof profile?.height
  });
  
  if (profile && profile.height && typeof profile.height === 'string') {
    const match = profile.height.match(/(\d+)'(\d+)?/);
    if (match) {
      feet = match[1];
      inches = match[2] || '';
      console.log('✅ Height parsed successfully:', { feet, inches });
    } else {
      console.log('❌ Height format not recognized:', profile.height);
    }
  } else {
    console.log('❌ Height field missing or invalid');
  }






  // When overlay is dismissed, set hasSeenOnboarding to true
  // Handle filter application
  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    const hasActive = newFilters.selectedProfessions.length > 0 ||
                     newFilters.selectedCountry !== '' ||
                     newFilters.selectedState !== '' ||
                     newFilters.ageRange[0] !== 18 ||
                     newFilters.ageRange[1] !== 60;
    setHasActiveFilters(hasActive);
  };



  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('🔄 Profile: Loading user profile...');
        
        // Load user profile
        const profileData = await ProfileService.getUserProfile();
        
        if (profileData) {
          // The ProfileService now returns flattened data directly
          setProfile(profileData);
          
          // Use backend data as authoritative source for onboarding logic
          const isFirstLoginFromApi = profileData.isFirstLogin;
          const profileCompletenessFromApi = profileData.profileCompleteness;
          const hasSeenOnboardingMessageFromApi = profileData.hasSeenOnboardingMessage;
          
          console.log('🔍 Profile page onboarding check:', {
            isFirstLogin: isFirstLoginFromApi,
            profileCompleteness: profileCompletenessFromApi,
            hasSeenOnboardingMessage: hasSeenOnboardingMessageFromApi,
            profileDataKeys: Object.keys(profileData)
          });
          
          // Show onboarding overlay for first-time users who haven't seen the message
          if (isFirstLoginFromApi && !hasSeenOnboardingMessageFromApi) {
            console.log('🎯 Showing onboarding overlay for first-time user');
            setShowOnboarding(true);
            setHasSeenOnboarding(false);
          } else {
            // For all other cases, don't show onboarding
            console.log('📝 User has seen onboarding or is returning user');
            setShowOnboarding(false);
            setHasSeenOnboarding(true);
            
            // If profile is incomplete, enable edit mode
            if (profileCompletenessFromApi < 100) {
              setIsEditing(true);
            }
          }
        } else {
          console.warn('⚠️ Profile data not available or incomplete', {
            hasProfileData: !!profileData,
            profileDataKeys: profileData ? Object.keys(profileData) : 'null'
          });
          // Set a default empty profile to prevent errors
          setProfile({});
          setShowOnboarding(false);
          setHasSeenOnboarding(true);
          setIsEditing(true);
        }
      } catch (error) {
        console.error('❌ Error loading profile:', error);
        // Set a default empty profile to prevent errors
        setProfile({});
        setShowOnboarding(false);
        setHasSeenOnboarding(true);
        setIsEditing(true);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  // Show loading screen only while loading profile, not for authentication
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <HeartbeatLoader 
            logoSize="xxxxl"
            textSize="xl"
            text="Loading Your Profile" 
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/30 to-pink-100/30 backdrop-blur-[2.5px]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(236,72,153,0.13),transparent_50%)]"></div>
      
      {/* Onboarding Overlay */}
      <OnboardingOverlay
        isVisible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
      
      {/* Header */}
      <StandardHeader
        showFilter={true}
        onFilterClick={() => setShowFilter(true)}
        hasActiveFilters={hasActiveFilters}
        showProfileLink={true}
      />

      {/* Content */}
      <div className="relative z-10 pt-16 pb-24 page-transition">

        {/* Profile Complete Success Banner */}
        {isProfileComplete && (
          <div className="mx-4 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <CustomIcon name="ri-check-circle-line" className="text-green-600 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-800 mb-1">
                  Profile Complete! 🎉
                </h3>
                <p className="text-xs text-green-700">
                  You can now access Discover and Matches features
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Image */}
        <div className="px-4 py-6">
          <div className={`flex items-center gap-4 ${!isEditing ? 'justify-end pr-8' : 'justify-center'}`}>
            {/* Profile Image Container - Centrally Aligned */}
            <div className="relative w-32 h-32">
              {/* Show temporary image if available, otherwise show existing profile image */}
              {(tempImageUrl || signedImageUrl) ? (
                <div className="relative">
                  <Image
                    src={tempImageUrl || signedImageUrl}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-full h-full rounded-full object-cover object-top border-4 border-white shadow-2xl hover:shadow-3xl transition-shadow duration-300 bg-white/60 backdrop-blur-md"
                    onError={(e) => {
                      console.error('❌ Image failed to load:', e);
                    }}
                  />

                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center rounded-full border-4 border-dashed border-rose-300 bg-white/60 transition-all duration-200 relative"
                  style={{ minHeight: 128, minWidth: 128 }}
                >
                  <Image
                    src="/icons/user.svg"
                    alt="Profile Placeholder"
                    width={64}
                    height={64}
                    className="mx-auto mb-2 opacity-70"
                  />
                  <span className="text-xs text-rose-500 font-semibold">No Photo</span>
                  
                  {/* Small camera icon for upload when editing */}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleCameraClick}
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-rose-500 flex items-center justify-center shadow-lg hover:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-rose-400 border border-rose-200"
                    >
                      <CustomIcon name="ri-camera-line" className="text-sm" />
                    </button>
                  )}
                </div>
              )}
              
              {/* Camera and Delete icons for editing - show when there's an image (temporary or existing) */}
              {isEditing && (tempImageUrl || signedImageUrl || profile.profile?.images) && (
                <>
                  {/* Camera icon for upload */}
                  <button
                    onClick={handleCameraClick}
                    className="absolute -bottom-2 -right-2 text-rose-500 hover:text-rose-600 transition-colors duration-200 cursor-pointer"
                  >
                    <CustomIcon name="ri-camera-line" size={22} />
                  </button>
                  
                  {/* Delete icon */}
                  <button
                    onClick={handleDeleteProfilePicture}
                    className="absolute -top-2 -right-2 text-red-500 hover:text-red-600 transition-colors duration-200 cursor-pointer"
                    title={tempImageUrl ? "Remove temporary image" : "Delete profile picture"}
                  >
                    <CustomIcon name="ri-delete-bin-line" size={18} />
                  </button>
                </>
              )}
            </div>
            
            {/* Edit Button - Only show when not editing */}
            {!isEditing && (
              <button
                onClick={() => {
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
                  setIsEditing(true);
                }}
                className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <CustomIcon name="ri-edit-line" className="text-sm" />
                <span className="text-sm">Edit</span>
              </button>
            )}
          </div>
          
          {/* Upload Message */}
          {uploadMessage && (
            <div className={`mt-2 p-2 rounded-lg text-sm ${
              uploadMessage.includes('❌') ? 'bg-red-100 text-red-700' :
              uploadMessage.includes('Image selected!') ? 'bg-green-100 text-green-700' :
              uploadMessage.includes('✅') ? 'bg-green-100 text-green-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {uploadMessage}
            </div>
          )}
          

          


          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
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
                      <p className="text-neutral-800 text-sm">{profile.name || 'Not specified'}</p>
                    </div>
                  )}
                  {renderInlineError('name')}
                </div>
                
                <div>
                  {renderFieldLabel('gender', 'Gender')}
                  {isEditing ? (
                    <select
                      value={profile.gender || ""}
                      onChange={(e) => {
                        console.log('🎯 Gender dropdown changed:', e.target.value);
                        setProfile({...profile, gender: e.target.value});
                      }}
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
                    <p className="text-neutral-800 text-sm">{profile.gender || 'Not specified'}</p>
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
                    <p className="text-neutral-800 text-sm">{profile.nativePlace || 'Not specified'}</p>
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
                    <p className="text-neutral-800 text-sm">{profile.currentResidence || 'Not specified'}</p>
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
                      onChange={(e) => {
                        console.log('🎯 Marital Status dropdown changed:', e.target.value);
                        setProfile({...profile, maritalStatus: e.target.value});
                      }}
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
                    <p className="text-neutral-800 text-sm">{profile.maritalStatus || 'Not specified'}</p>
                  )}
                  {renderInlineError('maritalStatus')}
                </div>
                
                <div>
                  {renderFieldLabel('manglik', 'Manglik')}
                  {isEditing ? (
                    <select
                      value={profile.manglik || ""}
                      onChange={(e) => {
                        console.log('🎯 Manglik dropdown changed:', e.target.value);
                        setProfile({...profile, manglik: e.target.value});
                      }}
                      onFocus={() => handleFieldFocus('manglik')}
                      onBlur={() => handleFieldBlur('manglik')}
                      data-field="manglik"
                      className={getSelectClassName('manglik')}
                    >
                      <option value="">Select Manglik Status</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Dont Know">Dont Know</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.manglik || 'Not specified'}</p>
                  )}
                  {renderInlineError('manglik')}
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
                  {renderFieldLabel('dateOfBirth', 'Date')}
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
                          setDateValue({ startDate: date, endDate: date });
                          // Store the date as an ISO string for consistency
                          const dateString = date ? date.toISOString().split('T')[0] : '';
                          setProfile({ ...profile, dateOfBirth: dateString });
                        }}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <p className="text-neutral-800 text-sm">
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
                  {renderFieldLabel('timeOfBirth', 'Time')}
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
                          setClockTime(date);
                          setProfile({ ...profile, timeOfBirth: date });
                        }}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <p className="text-neutral-800 text-sm">
                      {(() => {
                        if (profile.timeOfBirth instanceof Date) {
                          return format(profile.timeOfBirth, 'hh:mm aa');
                        } else if (profile.timeOfBirth) {
                          const time = new Date(profile.timeOfBirth);
                          return isNaN(time.getTime()) ? 'Not specified' : format(time, 'hh:mm aa');
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
                    <p className="text-neutral-800 text-sm">{profile.placeOfBirth || 'Not specified'}</p>
                  )}
                  {renderInlineError('placeOfBirth')}
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
                  {renderFieldLabel('height', 'Height')}
                  {isEditing ? (
                    <>
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
                          onFocus={() => handleFieldFocus('height')}
                          onBlur={() => handleFieldBlur('height')}
                          data-field="height-feet"
                          className={`w-full md:w-1/2 p-2 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-gray-800 transition-all duration-300 ${
                            fieldErrors.height ? 'border-red-500 bg-red-50 animate-shake' : 
                            (profile.height && profile.height.match(/^(\d+)'(\d+)"*$/)) ? 'border-green-500 bg-green-50' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select Feet</option>
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
                          onFocus={() => handleFieldFocus('height')}
                          onBlur={() => handleFieldBlur('height')}
                          data-field="height-inches"
                          className={`w-full md:w-1/2 p-2 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-gray-800 transition-all duration-300 ${
                            fieldErrors.height ? 'border-red-500 bg-red-50 animate-shake' : 
                            (profile.height && profile.height.match(/^(\d+)'(\d+)"*$/)) ? 'border-green-500 bg-green-50' : 'border-gray-200'
                          }`}
                        >
                          <option value="">Select Inches</option>
                          {inchOptions.map(i => <option key={i} value={i}>{i} in</option>)}
                        </select>
                      </div>
                      {renderInlineError('height')}
                    </>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.height || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  {renderFieldLabel('weight', 'Weight')}
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
                    <p className="text-neutral-800 text-sm">{profile.weight || 'Not specified'}</p>
                  )}
                  {renderInlineError('weight')}
                </div>
                <div>
                  {renderFieldLabel('complexion', 'Complexion')}
                  {isEditing ? (
                    <select
                      value={profile.complexion || ""}
                      onChange={(e) => {
                        console.log('🎯 Complexion dropdown changed:', e.target.value);
                        setProfile({...profile, complexion: e.target.value});
                      }}
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
                    <p className="text-neutral-800 text-sm">{profile.complexion || 'Not specified'}</p>
                  )}
                  {renderInlineError('complexion')}
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
                    <p className="text-neutral-800 text-sm">{profile.fatherGotra || 'Not specified'}</p>
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
                    <p className="text-neutral-800 text-sm">{profile.motherGotra || 'Not specified'}</p>
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
                    <p className="text-neutral-800 text-sm">{profile.grandfatherGotra || 'Not specified'}</p>
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
                    <p className="text-neutral-800 text-sm">{profile.grandmotherGotra || 'Not specified'}</p>
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
                  <p className="text-neutral-800 text-sm">{profile.education || 'Not specified'}</p>
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
                  <p className="text-neutral-800 text-sm">{profile.occupation || 'Not specified'}</p>
                )}
                {renderInlineError('occupation')}
              </div>
              <div>
                {renderFieldLabel('annualIncome', 'Annual Income')}
                {isEditing ? (
                  <input
                    type="number"
                    value={profile.annualIncome || ""}
                    onChange={(e) => handleFieldChange('annualIncome', e.target.value)}
                    onFocus={() => handleFieldFocus('annualIncome')}
                    onBlur={() => handleFieldBlur('annualIncome')}
                    placeholder={getFieldPlaceholder('annualIncome')}
                    data-field="annualIncome"
                    min="1"
                    className={getInputClassName('annualIncome')}
                  />
                ) : (
                  <p className="text-neutral-800 text-sm">{profile.annualIncome || 'Not specified'}</p>
                )}
                {renderInlineError('annualIncome')}
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
                  {renderFieldLabel('eatingHabit', 'Eating Habit')}
                  {isEditing ? (
                    <select
                      value={profile.eatingHabit || ""}
                      onChange={(e) => {
                        console.log('🎯 Eating Habit dropdown changed:', e.target.value);
                        setProfile({...profile, eatingHabit: e.target.value});
                      }}
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
                    <p className="text-neutral-800 text-sm">{profile.eatingHabit || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  {renderFieldLabel('smokingHabit', 'Smoking')}
                  {isEditing ? (
                    <select
                      value={profile.smokingHabit || ""}
                      onChange={(e) => {
                        console.log('🎯 Smoking Habit dropdown changed:', e.target.value);
                        setProfile({...profile, smokingHabit: e.target.value});
                      }}
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
                    <p className="text-neutral-800 text-sm">{profile.smokingHabit || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  {renderFieldLabel('drinkingHabit', 'Drinking')}
                  {isEditing ? (
                    <select
                      value={profile.drinkingHabit || ""}
                      onChange={(e) => {
                        console.log('🎯 Drinking Habit dropdown changed:', e.target.value);
                        setProfile({...profile, drinkingHabit: e.target.value});
                      }}
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
                  <p className="text-neutral-800 text-sm">{profile.father || 'Not specified'}</p>
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
                  <p className="text-neutral-800 text-sm">{profile.mother || 'Not specified'}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {renderFieldLabel('brothers', 'Brothers')}
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
                  <p className="text-neutral-800 text-sm">{profile.brothers || 'Not specified'}</p>
                )}
                </div>
                <div>
                  {renderFieldLabel('sisters', 'Sisters')}
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
                  <p className="text-neutral-800 text-sm">{profile.sisters || 'Not specified'}</p>
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
                {renderFieldLabel('specificRequirements', 'Specific Requirements')}
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
                  <p className="text-neutral-800 text-sm">{profile.specificRequirements || 'Not specified'}</p>
                )}
              </div>
              <div>
                {renderFieldLabel('settleAbroad', 'Willingness to Settle Abroad')}
                {isEditing ? (
                  <select
                    value={profile.settleAbroad || ""}
                    onChange={(e) => {
                      console.log('🎯 Settle Abroad dropdown changed:', e.target.value);
                      setProfile({...profile, settleAbroad: e.target.value});
                    }}
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
              {isEditing && isRequiredField('about') && (
                <span className="text-red-500 ml-1">*</span>
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
                className={`w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none ${getInputClassName('about')}`}
              />
            ) : (
              <p className="text-neutral-800">{profile.about || 'Not specified'}</p>
            )}
            {renderInlineError('about')}
          </div>

          {/* Interests */}
          <div 
            className={`card-modern p-6 hover-lift transition-all duration-300 ${
              fieldErrors.interests ? 'border-2 border-red-500 bg-red-50 animate-shake' : 
              (profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0) ? 'border-2 border-green-500 bg-green-50' : 
              'border-2 border-gray-200'
            }`} 
            data-field="interests"
            onFocus={() => handleFieldFocus('interests')}
            onBlur={() => handleFieldBlur('interests')}
          >
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <CustomIcon name="ri-heart-line" size={20} className="text-rose-600 mr-3" />
              Interests
              {isEditing && isRequiredField('interests') && (
                <span className="text-red-500 ml-1">*</span>
              )}
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

            </div>
            {renderInlineError('interests')}
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="space-y-3">
              {/* Progress indicator */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Profile Completion</span>
                <span className="font-semibold">{calculatedCompleteness}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${getProgressBarColor(calculatedCompleteness)} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${calculatedCompleteness}%` }}
                ></div>
              </div>
              
              <button
                onClick={handleSave}
                data-save-button
                className={`w-full py-4 text-lg font-semibold hover-lift transition-all duration-300 ${
                  calculatedCompleteness >= 100 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600'
                }`}
              >
                {calculatedCompleteness >= 100 ? '🎉 Save Complete Profile' : 'Save Changes'}
              </button>
              
              {calculatedCompleteness < 100 && (
                <p className="text-xs text-gray-500 text-center">
                  {30 - Math.round((calculatedCompleteness / 100) * 30)} fields remaining
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilter && (
        <FilterModal
          onClose={() => setShowFilter(false)}
          onApply={handleApplyFilters}
          currentFilters={filters}
        />
      )}

      {/* Modern Bottom Navigation */}
      <SmoothNavigation 
        items={[
          { href: '/dashboard', icon: 'ri-heart-line', label: 'Discover', activeIcon: 'ri-heart-fill' },
          { 
            href: '/matches', 
            icon: 'ri-chat-3-line', 
            label: 'Matches',
            activeIcon: 'ri-chat-3-fill',
            ...(matchesCount > 0 && { badge: matchesCount })
          },
          { href: '/profile', icon: 'ri-user-line', label: 'Profile', activeIcon: 'ri-user-fill' },
          { href: '/settings', icon: 'ri-settings-line', label: 'Settings', activeIcon: 'ri-settings-fill' },
        ]}
      />

      {/* Interest Modal */}
      {showInterestModal && (
        <InterestModal
          onClose={() => setShowInterestModal(false)}
          onAdd={addInterest}
          existingInterests={profile.interests || []}
        />
      )}

      {/* Onboarding Overlay */}
      <OnboardingOverlay
        isVisible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}

export default function Profile() {
  return (
    <ServerAuthGuard requireAuth={true} requireCompleteProfile={false}>
      <ProfileContent />
    </ServerAuthGuard>
  );
}