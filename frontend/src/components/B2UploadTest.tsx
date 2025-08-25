'use client';

import { useState } from 'react';
import { ImageUploadService, UploadResult } from '../services/image-upload-service';
import ImageCompression from '../utils/imageCompression';

export default function B2UploadTest() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setMessage('');

    // Create preview
    try {
      const url = await ImageCompression.createPreviewUrl(file);
      setPreviewUrl(url);
    } catch (error) {

    }

    // Validate file
    const validation = ImageCompression.validateImage(file);
    if (!validation.valid) {
      setMessage(`❌ ${validation.error}`);
      return;
    }

    setMessage('✅ File selected and validated');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('❌ Please select a file first');
      return;
    }

    setIsUploading(true);
    setMessage('🔄 Uploading to B2 Cloud Storage...');

    try {
      const result = await ImageUploadService.uploadProfilePictureToB2(selectedFile);
      setUploadResult(result);
      
      if (result.success) {
        setMessage('✅ Upload successful! Image compressed and stored in B2.');
      } else {
        setMessage(`❌ Upload failed: ${result.error}`);
      }
    } catch (error) {

      setMessage('❌ Upload error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!uploadResult?.success) {
      setMessage('❌ No uploaded image to delete');
      return;
    }

    setIsUploading(true);
    setMessage('🗑️ Deleting from B2...');

    try {
      const success = await ImageUploadService.deleteProfilePictureFromB2();
      
      if (success) {
        setMessage('✅ Image deleted successfully from B2');
        setUploadResult(null);
        setPreviewUrl(null);
        setSelectedFile(null);
      } else {
        setMessage('❌ Failed to delete image');
      }
    } catch (error) {

      setMessage('❌ Delete error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">B2 Cloud Storage Test</h2>
      
      {/* File Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Image File
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
        />
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg border"
          />
        </div>
      )}

      {/* File Info */}
      {selectedFile && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-2">File Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Name:</strong> {selectedFile.name}</p>
            <p><strong>Size:</strong> {ImageCompression.formatFileSize(selectedFile.size)}</p>
            <p><strong>Type:</strong> {selectedFile.type}</p>
          </div>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-700 mb-2">Upload Result</h3>
          <div className="text-sm text-green-600 space-y-1">
            <p><strong>Status:</strong> {uploadResult.success ? 'Success' : 'Failed'}</p>
            {uploadResult.imageUrl && (
              <p><strong>URL:</strong> <span className="break-all">{uploadResult.imageUrl}</span></p>
            )}
            {uploadResult.validation && (
              <p><strong>Validation:</strong> {uploadResult.validation.isValid ? 'Valid' : 'Invalid'}</p>
            )}
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('❌') ? 'bg-red-50 text-red-700' :
          message.includes('✅') ? 'bg-green-50 text-green-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {message}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="flex-1 bg-rose-500 text-white py-2 px-4 rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload to B2'}
        </button>
        
        {uploadResult?.success && (
          <button
            onClick={handleDelete}
            disabled={isUploading}
            className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-700 mb-2">Instructions</h3>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>• Select an image file (JPEG, PNG, WebP)</li>
          <li>• Image will be compressed and optimized</li>
          <li>• Uploaded to B2 Cloud Storage</li>
          <li>• One profile picture per user (overwrites existing)</li>
        </ul>
      </div>
    </div>
  );
} 