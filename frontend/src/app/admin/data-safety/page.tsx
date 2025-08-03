'use client';

import { useEffect } from 'react';
import CustomIcon from '../../../components/CustomIcon';
import { gsap } from 'gsap';

export default function DataSafety() {
  useEffect(() => {
    // Animate content on load
    gsap.fromTo('.safety-card', 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
    );
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-10 pt-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-3 flex items-center">
            <CustomIcon name="ri-shield-check-line" className="text-4xl text-blue-600 mr-4" />
            Admin Data Management
          </h1>
          <p className="text-gray-600 text-lg">Admin tools for data safety, privacy, and user management</p>
        </div>

        {/* Admin Security & Actions Section */}
        <div className="safety-card bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-10">
          <div className="flex items-center mb-8">
            <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center mr-5">
              <CustomIcon name="ri-lock-password-line" className="text-3xl text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Security & Actions</h2>
              <p className="text-gray-600">Security measures and available admin actions</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-4xl text-blue-600 mx-auto mb-4">🔐</div>
              <h3 className="font-semibold text-gray-800 mb-3 text-lg">Admin Authentication</h3>
              <p className="text-sm text-gray-600">Secure admin login with role-based access control</p>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="text-4xl text-green-600 mx-auto mb-4">👥</div>
              <h3 className="font-semibold text-gray-800 mb-3 text-lg">User Management</h3>
              <p className="text-sm text-gray-600">View, pause, resume, and manage user accounts</p>
            </div>
            
            <div className="text-center p-6 bg-yellow-50 rounded-xl">
              <div className="text-4xl text-yellow-600 mx-auto mb-4">📧</div>
              <h3 className="font-semibold text-gray-800 mb-3 text-lg">Invitation Control</h3>
              <p className="text-sm text-gray-600">Send and track email invitations</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-8">
            <h3 className="font-semibold text-gray-800 mb-6 flex items-center text-lg">
              <div className="text-blue-500 mr-3">🛡️</div>
              Admin Capabilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <div className="text-green-500 mr-4 text-xl">👁️</div>
                <span className="text-gray-700">View all user profiles and data</span>
              </div>
              <div className="flex items-center">
                <div className="text-yellow-500 mr-4 text-xl">⏸️</div>
                <span className="text-gray-700">Pause user accounts</span>
              </div>
              <div className="flex items-center">
                <div className="text-green-500 mr-4 text-xl">▶️</div>
                <span className="text-gray-700">Resume user accounts</span>
              </div>
              <div className="flex items-center">
                <div className="text-blue-500 mr-4 text-xl">📧</div>
                <span className="text-gray-700">Send email invitations</span>
              </div>
              <div className="flex items-center">
                <div className="text-purple-500 mr-4 text-xl">🖼️</div>
                <span className="text-gray-700">Access profile images</span>
              </div>
              <div className="flex items-center">
                <div className="text-indigo-500 mr-4 text-xl">📊</div>
                <span className="text-gray-700">Monitor platform statistics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Access Section */}
        <div className="safety-card bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-10">
          <div className="flex items-center mb-8">
            <div className="bg-purple-100 rounded-full w-14 h-14 flex items-center justify-center mr-5">
              <CustomIcon name="ri-database-line" className="text-3xl text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Data Access & Management</h2>
              <p className="text-gray-600">Admin access to user data and platform information</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-semibold text-gray-800 mb-6 flex items-center text-lg">
                <CustomIcon name="ri-user-line" className="text-green-500 mr-3" />
                User Data Access
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-green-500 mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-gray-700">View user profiles and personal information</span>
                </li>
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-green-500 mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-gray-700">Access profile images and media files</span>
                </li>
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-green-500 mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-gray-700">Monitor user activity and login history</span>
                </li>
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-green-500 mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-gray-700">Track profile completion status</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-6 flex items-center text-lg">
                <CustomIcon name="ri-settings-line" className="text-blue-500 mr-3" />
                Platform Management
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-green-500 mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-gray-700">Manage user account status</span>
                </li>
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-green-500 mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-gray-700">Send and track invitations</span>
                </li>
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-green-500 mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-gray-700">Monitor platform statistics</span>
                </li>
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-green-500 mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-gray-700">Access cloud storage management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Admin Support Section */}
        <div className="safety-card bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center mb-8">
            <div className="bg-orange-100 rounded-full w-14 h-14 flex items-center justify-center mr-5">
              <CustomIcon name="ri-customer-service-2-line" className="text-3xl text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Support & Resources</h2>
              <p className="text-gray-600">Support and resources for admin operations</p>
            </div>
          </div>
          
          <div className="text-center p-8 bg-blue-50 rounded-xl max-w-md mx-auto">
            <CustomIcon name="ri-mail-line" className="text-4xl text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-800 mb-3 text-lg">Admin Support</h3>
            <p className="text-sm text-gray-600 mb-4">For admin access and technical support</p>
            <a href="mailto:shaadimantrana.help@gmail.com" className="text-blue-600 hover:text-blue-700 font-medium">
              shaadimantrana.help@gmail.com
            </a>
          </div>
        </div>
      </div>
  );
}
