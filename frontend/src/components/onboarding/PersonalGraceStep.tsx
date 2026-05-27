'use client';

import { useState, useRef } from 'react';
import { RoyalInput, RoyalSelect } from './RoyalFields';
import { ImageUploadService } from '../../services/image-upload-service';
import Image from 'next/image';
import logger from '../../utils/logger';

interface PersonalGraceStepProps {
  data: any;
  updateField: (field: string, value: any) => void;
}

export default function PersonalGraceStep({ data, updateField }: PersonalGraceStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await ImageUploadService.uploadProfilePictureToB2(file);
      if (result.success && result.imageUrl) {
        updateField('images', result.imageUrl);
      } else {
        logger.error('❌ Upload failed:', result.error);
      }
    } catch (err) {
      logger.error('❌ Error in image upload:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const imageUrl = Array.isArray(data.images) ? (data.images.length > 0 ? data.images[0] : null) : data.images;

  return (
    <div className="space-y-8">
      {/* Photo Upload Section */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div 
          onClick={handleImageClick}
          className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-royal-gold/30 bg-royal-gold/5 flex items-center justify-center cursor-pointer group"
        >
          {imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '' ? (
            <Image 
              src={imageUrl} 
              alt="Profile" 
              fill 
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
          {data.images ? 'Change Sacred Portrait' : 'Upload Sacred Portrait'}
        </p>
      </div>

      <div className="space-y-6">
        <RoyalInput 
          label="Name" 
          value={data.name || ''} 
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Enter your full name"
        />

        <RoyalSelect 
          label="Gender" 
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
            type="date"
            value={data.dateOfBirth || ''} 
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
          />
          <RoyalInput 
            label="Time of Birth" 
            type="time"
            value={data.timeOfBirth || ''} 
            onChange={(e) => updateField('timeOfBirth', e.target.value)}
          />
        </div>

        <RoyalInput 
          label="Place of Birth" 
          value={data.placeOfBirth || ''} 
          onChange={(e) => updateField('placeOfBirth', e.target.value)}
          placeholder="City, State"
        />
      </div>
    </div>
  );
}
