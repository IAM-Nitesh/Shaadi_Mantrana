'use client';

import { useState } from 'react';

interface DataSafetyInfo {
  dataCollected: {
    personalInfo: boolean;
    financialInfo: boolean;
    healthInfo: boolean;
    location: boolean;
    contacts: boolean;
    userContent: boolean;
    searchHistory: boolean;
    identifiers: boolean;
    usage: boolean;
    diagnostics: boolean;
  };
  dataSharing: {
    shared: boolean;
    sharedForAdvertising: boolean;
    sharedForAnalytics: boolean;
    sharedForDevelopment: boolean;
  };
  dataSecurity: {
    dataEncrypted: boolean;
    userCanRequestDeletion: boolean;
    userCanRequestData: boolean;
  };
}

export default function DataSafetyForm() {
  const [dataSafety, setDataSafety] = useState<DataSafetyInfo>({
    dataCollected: {
      personalInfo: true, // Name, email for matrimonial profiles
      financialInfo: false,
      healthInfo: false,
      location: true, // For local matches
      contacts: false,
      userContent: true, // Profile info, messages
      searchHistory: true, // Matching preferences
      identifiers: true, // User ID, device ID
      usage: true, // App interaction data
      diagnostics: false
    },
    dataSharing: {
      shared: false, // No third-party sharing
      sharedForAdvertising: false,
      sharedForAnalytics: false,
      sharedForDevelopment: false
    },
    dataSecurity: {
      dataEncrypted: true,
      userCanRequestDeletion: true,
      userCanRequestData: true
    }
  });

  const generatePlayStoreForm = () => {
    const form = {
      "app_name": "Shaadi Mantra",
      "app_package": "com.shaadimatra.app",
      "data_safety": {
        "data_collected": {
          "personal_info": {
            "collected": dataSafety.dataCollected.personalInfo,
            "shared": false,
            "optional": false,
            "purpose": ["Account management", "Personalization"]
          },
          "location": {
            "collected": dataSafety.dataCollected.location,
            "shared": false,
            "optional": true,
            "purpose": ["App functionality"]
          },
          "user_content": {
            "collected": dataSafety.dataCollected.userContent,
            "shared": false,
            "optional": false,
            "purpose": ["App functionality", "Personalization"]
          },
          "identifiers": {
            "collected": dataSafety.dataCollected.identifiers,
            "shared": false,
            "optional": false,
            "purpose": ["Account management", "App functionality"]
          }
        },
        "data_shared": {
          "shared_with_third_parties": dataSafety.dataSharing.shared
        },
        "security_practices": {
          "data_encrypted_in_transit": true,
          "data_encrypted_at_rest": true,
          "data_deletion_policy": "User can request deletion",
          "data_export_policy": "User can request data export",
          "independent_security_review": false,
          "privacy_policy_url": "https://shaadimatra.com/privacy"
        }
      }
    };

    return JSON.stringify(form, null, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Google Play Data Safety Form Generator</h1>
        
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Collection Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Data Collected</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={dataSafety.dataCollected.personalInfo}
                    onChange={(e) => setDataSafety(prev => ({
                      ...prev,
                      dataCollected: { ...prev.dataCollected, personalInfo: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  Personal Information (Name, Email)
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={dataSafety.dataCollected.location}
                    onChange={(e) => setDataSafety(prev => ({
                      ...prev,
                      dataCollected: { ...prev.dataCollected, location: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  Location Data
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={dataSafety.dataCollected.userContent}
                    onChange={(e) => setDataSafety(prev => ({
                      ...prev,
                      dataCollected: { ...prev.dataCollected, userContent: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  User Content (Photos, Messages)
                </label>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Security Practices</h3>
              <div className="space-y-2">
                <div className="flex items-center text-green-600">
                  <i className="ri-shield-check-line mr-2"></i>
                  Data encrypted in transit
                </div>
                <div className="flex items-center text-green-600">
                  <i className="ri-shield-check-line mr-2"></i>
                  Data encrypted at rest
                </div>
                <div className="flex items-center text-green-600">
                  <i className="ri-shield-check-line mr-2"></i>
                  User can delete data
                </div>
                <div className="flex items-center text-green-600">
                  <i className="ri-shield-check-line mr-2"></i>
                  User can export data
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Generated Play Store Form</h2>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            {generatePlayStoreForm()}
          </pre>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Instructions:</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Copy the JSON above</li>
              <li>2. Go to Google Play Console → App content → Data safety</li>
              <li>3. Fill in the form based on the generated data</li>
              <li>4. Ensure your privacy policy URL is accessible</li>
              <li>5. Submit for review</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
