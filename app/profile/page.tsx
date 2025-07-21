'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InterestModal from '../../frontend/src/app/profile/InterestModal';
import { ImageUploadService, UploadResult } from '../../frontend/src/services/image-upload-service';
import { AuthService } from '../../frontend/src/services/auth-service';
import CustomIcon from '../../frontend/src/components/CustomIcon';
import { gsap } from 'gsap';

const defaultProfileData = {
  name: 'Rahul Kumar Sharma',
  gender: 'Male',
  nativePlace: 'Lucknow',
  currentResidence: 'Noida',
  maritalStatus: 'Never Married',
  manglik: 'No',
  dateOfBirth: '07-10-1995',
  timeOfBirth: '2:50 AM',
  placeOfBirth: 'Dehradun',
  height: "6'1\"",
  weight: '91 Kg',
  complexion: 'Fair',
  fatherGotra: 'Akanniya',
  motherGotra: 'Srivas',
  grandfatherGotra: 'Bharadwaj',
  grandmotherGotra: 'Kashyap',
  education: 'B.Tech MBA',
  occupation: 'Senior Consultant in Pvt. Company Noida',
  annualIncome: '12 LPA',
  eatingHabit: 'Eggetarian',
  smokingHabit: 'No',
  drinkingHabit: 'No',
  father: 'G.K.Sharma Retd Class 1 Govt. Officer',
  mother: 'Home maker MA. B.Ed',
  brothers: '1 Elder Happily married posted abroad',
  sisters: 'No',
  specificRequirements: 'Working Girl and not less than 5\'4" height',
  settleAbroad: 'May be',
  about: 'Looking for a life partner who values family and career equally. I enjoy traveling, reading, and spending time with loved ones.',
  interests: ['Travel', 'Technology', 'Music', 'Fitness'],
  verified: true,
  images: [
    '/demo-profiles/profile-1.svg'
  ]
};

export default function Profile() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState(defaultProfileData);

  // GSAP refs for animations
  const headerRef = useRef<HTMLDivElement>(null);
  const profileInfoRef = useRef<HTMLDivElement>(null);
  const profileDetailsRef = useRef<HTMLDivElement>(null);

  // Check authentication on component mount
  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      router.push('/');
      return;
    }
    setIsAuthenticated(true);
  }, [router]);

  // Load profile from localStorage on component mount
  useEffect(() => {
    if (!isAuthenticated) return; // Don't load profile until authenticated
    
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile({ ...defaultProfileData, ...parsedProfile });
      } catch (error) {
        console.error('Error loading profile from localStorage:', error);
      }
    }
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }, [profile]);

  // GSAP animations on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && isAuthenticated) {
      // Simple entrance animation without console logs
      const elements = [headerRef.current, profileInfoRef.current, profileDetailsRef.current].filter(Boolean);
      
      if (elements.length > 0) {
        // Set initial state quietly
        gsap.set(elements, { 
          opacity: 0.3, 
          y: 20 
        });
        
        // Simple entrance animation
        gsap.to(elements, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.1,
          delay: 0.2
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

  const handleSave = () => {
    setIsEditing(false);
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
          images: [result.imageUrl!, ...prev.images.slice(1)]
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
    if (!profile.interests.includes(interest)) {
      setProfile({...profile, interests: [...profile.interests, interest]});
    }
  };

  const removeInterest = (index: number) => {
    const newInterests = profile.interests.filter((_, i) => i !== index);
    setProfile({...profile, interests: newInterests});
  };

  const calculateAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth.split('-').reverse().join('-'));
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Show loading screen while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-100/20 to-pink-100/20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_25%_25%,rgba(236,72,153,0.1),transparent_50%)]"></div>
      
      {/* Header */}
      <div ref={headerRef} className="fixed top-0 w-full backdrop-blur-sm bg-white/80 border-b border-white/20 shadow-lg z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="profile-title text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">My Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
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
            <img
              src={profile.images[0]}
              alt="Profile"
              className="w-full h-full rounded-full object-cover object-top border-4 border-white shadow-2xl hover:shadow-3xl transition-shadow duration-300"
            />
            {isEditing && (
              <button 
                onClick={handleCameraClick}
                disabled={isUploading}
                className={`absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center shadow-xl border-3 transition-all duration-300 ${
                  isUploading 
                    ? 'bg-white border-gray-300 text-gray-400' 
                    : 'bg-white border-rose-500 text-rose-500 hover:bg-rose-50 hover:border-rose-600 hover:text-rose-600 hover:scale-105'
                }`}
              >
                {isUploading ? (
                  <div className="upload-spinner w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                ) : (
                  <CustomIcon name="ri-camera-line" size={22} />
                )}
              </button>
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
          
          {/* Upload message */}
          {uploadMessage && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              uploadMessage.includes('✅') 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              <div className="font-medium mb-1">
                {uploadMessage.split('Tips:')[0]}
              </div>
              {uploadMessage.includes('Tips:') && (
                <div className="text-xs opacity-75">
                  Tips: {uploadMessage.split('Tips:')[1]}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Name and Quick Info */}
        <div ref={profileInfoRef} className="px-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-neutral-900">{profile.name}</h1>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-neutral-600 mb-4">
              <div className="flex items-center gap-1">
                <CustomIcon name="ri-calendar-line" size={16} />
                <span>{calculateAge(profile.dateOfBirth)} years</span>
              </div>
              <div className="flex items-center gap-1">
                <CustomIcon name="ri-briefcase-line" size={16} />
                <span>{profile.occupation.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-1">
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
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                      value={profile.gender}
                      onChange={(e) => setProfile({...profile, gender: e.target.value})}
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
                      value={profile.nativePlace}
                      onChange={(e) => setProfile({...profile, nativePlace: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                      value={profile.currentResidence}
                      onChange={(e) => setProfile({...profile, currentResidence: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                      value={profile.maritalStatus}
                      onChange={(e) => setProfile({...profile, maritalStatus: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                      value={profile.manglik}
                      onChange={(e) => setProfile({...profile, manglik: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Don't Know">Don't Know</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.manglik}</p>
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
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.dateOfBirth}
                      onChange={(e) => setProfile({...profile, dateOfBirth: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.dateOfBirth}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Time</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.timeOfBirth}
                      onChange={(e) => setProfile({...profile, timeOfBirth: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.timeOfBirth}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Place</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.placeOfBirth}
                      onChange={(e) => setProfile({...profile, placeOfBirth: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Height</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.height}
                      onChange={(e) => setProfile({...profile, height: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.height}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Weight</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.weight}
                      onChange={(e) => setProfile({...profile, weight: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.weight}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Complexion</label>
                  {isEditing ? (
                    <select
                      value={profile.complexion}
                      onChange={(e) => setProfile({...profile, complexion: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Fair">Fair</option>
                      <option value="Medium">Medium</option>
                      <option value="Dark">Dark</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.complexion}</p>
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
                      value={profile.fatherGotra}
                      onChange={(e) => setProfile({...profile, fatherGotra: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                      value={profile.motherGotra}
                      onChange={(e) => setProfile({...profile, motherGotra: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                      value={profile.grandfatherGotra}
                      onChange={(e) => setProfile({...profile, grandfatherGotra: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                      value={profile.grandmotherGotra}
                      onChange={(e) => setProfile({...profile, grandmotherGotra: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                    value={profile.education}
                    onChange={(e) => setProfile({...profile, education: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                    value={profile.occupation}
                    onChange={(e) => setProfile({...profile, occupation: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                ) : (
                  <p className="text-neutral-800 text-sm">{profile.occupation}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Annual Income</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.annualIncome}
                    onChange={(e) => setProfile({...profile, annualIncome: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                      value={profile.eatingHabit}
                      onChange={(e) => setProfile({...profile, eatingHabit: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Eggetarian">Eggetarian</option>
                      <option value="Non-Vegetarian">Non-Vegetarian</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.eatingHabit}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Smoking</label>
                  {isEditing ? (
                    <select
                      value={profile.smokingHabit}
                      onChange={(e) => setProfile({...profile, smokingHabit: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Occasionally">Occasionally</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.smokingHabit}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Drinking</label>
                  {isEditing ? (
                    <select
                      value={profile.drinkingHabit}
                      onChange={(e) => setProfile({...profile, drinkingHabit: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Socially">Socially</option>
                    </select>
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.drinkingHabit}</p>
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
                    value={profile.father}
                    onChange={(e) => setProfile({...profile, father: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                    value={profile.mother}
                    onChange={(e) => setProfile({...profile, mother: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                      type="text"
                      value={profile.brothers}
                      onChange={(e) => setProfile({...profile, brothers: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  ) : (
                    <p className="text-neutral-800 text-sm">{profile.brothers}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Sisters</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.sisters}
                      onChange={(e) => setProfile({...profile, sisters: e.target.value})}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                    value={profile.specificRequirements}
                    onChange={(e) => setProfile({...profile, specificRequirements: e.target.value})}
                    rows={2}
                    maxLength={200}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  />
                ) : (
                  <p className="text-neutral-800 text-sm">{profile.specificRequirements}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Willingness to Settle Abroad</label>
                {isEditing ? (
                  <select
                    value={profile.settleAbroad}
                    onChange={(e) => setProfile({...profile, settleAbroad: e.target.value})}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="May be">May be</option>
                  </select>
                ) : (
                  <p className="text-neutral-800 text-sm">{profile.settleAbroad}</p>
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
                value={profile.about}
                onChange={(e) => setProfile({...profile, about: e.target.value})}
                rows={4}
                maxLength={500}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            ) : (
              <p className="text-neutral-800">{profile.about}</p>
            )}
          </div>

          {/* Interests */}
          <div className="card-modern p-6 hover-lift">
            <h2 className="font-semibold text-neutral-800 mb-4 flex items-center">
              <CustomIcon name="ri-heart-line" size={20} className="text-rose-600 mr-3" />
              Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-sm"
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
          </div>

          {/* Save Button */}
          {isEditing && (
            <button
              onClick={handleSave}
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
          <Link 
            href="/dashboard" 
            className="flex flex-col items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-gray-50 transition-all duration-200 group"
          >
            <CustomIcon name="ri-heart-line" className="text-xl mb-1 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-xs">Discover</span>
          </Link>
          <Link 
            href="/matches" 
            className="flex flex-col items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-gray-50 transition-all duration-200 group"
          >
            <CustomIcon name="ri-chat-3-line" className="text-xl mb-1 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-xs">Matches</span>
          </Link>
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
          existingInterests={profile.interests}
        />
      )}
    </div>
  );
}