'use client';

import { useState, useRef, useEffect } from 'react';
import { RoyalInput, RoyalSelect } from './RoyalFields';
import { ImageUploadService } from '../../services/image-upload-service';
import Image from 'next/image';
import logger from '../../utils/logger';
import ToastService from '../../services/toastService';

interface PersonalGraceStepProps {
  data: any;
  updateField: (field: string, value: any) => void;
}

export default function PersonalGraceStep({ data, updateField }: PersonalGraceStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ FIX: On mount, if data.images is a B2 filename (not a URL), fetch the signed URL
  // This handles the case when user navigates away and returns to step 1
  useEffect(() => {
    const storedImage = Array.isArray(data.images) ? data.images[0] : data.images;
    if (!storedImage || typeof storedImage !== 'string') return;
    
    if (storedImage.startsWith('http')) {
      // Already a full URL (signed or public) — use directly
      setPreviewUrl(storedImage);
    } else {
      // B2 filename — fetch a fresh signed URL
      ImageUploadService.getMyProfilePictureSignedUrl()
        .then(url => { if (url) setPreviewUrl(url); })
        .catch(err => logger.warn('PersonalGraceStep: could not fetch signed URL', err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await ImageUploadService.uploadProfileImage(file);
      if (result.success && result.imageUrl) {
        setPreviewUrl(result.imageUrl);
        // Store file reference for profile completeness; backend already saved B2 fileName
        updateField('images', result.fileName || result.imageUrl);
        ToastService.success('Profile photo uploaded');
      } else {
        const msg = result.error || 'Upload failed';
        logger.error('Upload failed:', msg);
        ToastService.error(msg);
      }
    } catch (err) {
      logger.error('Error in image upload:', err);
      ToastService.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const storedImage = Array.isArray(data.images) ? data.images[0] : data.images;
  const imageUrl =
    previewUrl ||
    (typeof storedImage === 'string' && storedImage.startsWith('http') ? storedImage : null);

  return (
    <div className="space-y-8">
      {/* Photo Upload Section */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div 
          onClick={handleImageClick}
          className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-royal-gold/30 bg-royal-gold/5 flex items-center justify-center cursor-pointer group"
        >
          {imageUrl ? (
            <Image 
              src={imageUrl} 
              alt="Profile" 
              fill 
              unoptimized
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="text-royal-gold/40 flex flex-col items-center">
              <i className="ri-camera-line text-3xl mb-1"></i>
              <span className="text-[10px] uppercase tracking-tighter">Add Photo</span>
            </div>
          )}
          
          {isUploading && (
            <div className="absolute inset-0 bg-royal-obsidian/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-royal-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <i className="ri-edit-line text-white text-xl"></i>
          </div>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        <p className="text-royal-gold/40 text-[10px] uppercase tracking-widest text-center">
          {imageUrl ? 'Change Sacred Portrait' : 'Upload Sacred Portrait'}
        </p>
      </div>

      <div className="space-y-6">
        <RoyalInput 
          label="Name" 
          fieldName="name"
          value={data.name || ''} 
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Enter your full name"
        />

        <RoyalSelect 
          label="Gender" 
          fieldName="gender"
          value={data.gender || ''}
          onChange={(e) => updateField('gender', e.target.value)}
          options={[
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' }
          ]}
        />

        <div className="grid grid-cols-2 gap-4">
          <RoyalInput 
            label="Date of Birth" 
            fieldName="dateOfBirth"
            type="date"
            value={data.dateOfBirth || ''} 
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
          />
          <RoyalInput 
            label="Time of Birth" 
            fieldName="timeOfBirth"
            type="time"
            value={data.timeOfBirth || ''} 
            onChange={(e) => updateField('timeOfBirth', e.target.value)}
          />
        </div>

        <RoyalInput 
          label="Place of Birth" 
          fieldName="placeOfBirth"
          value={data.placeOfBirth || ''} 
          onChange={(e) => updateField('placeOfBirth', e.target.value)}
          placeholder="City, State"
        />
      </div>
    </div>
  );
}