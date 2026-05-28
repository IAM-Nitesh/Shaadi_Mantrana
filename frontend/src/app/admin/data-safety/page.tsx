'use client';

import { useEffect } from 'react';
import CustomIcon from '../../../components/CustomIcon';
import { safeGsap } from '../../../components/SafeGsap';

export default function DataSafety() {
  useEffect(() => {
  // Animate content on load (safe)
  safeGsap.fromTo?.('.safety-card', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-10 pt-6">
          <h1 className="text-3xl font-bold text-royal-gold font-playfair mb-3 flex items-center">
            <CustomIcon name="ri-shield-check-line" className="text-4xl text-royal-gold mr-4" />
            Admin Data Management
          </h1>
          <p className="text-white/80 font-inter text-lg">Admin tools for data safety, privacy, and user management</p>
        </div>

        {/* Admin Security & Actions Section */}
        <div className="safety-card bg-royal-glass rounded-2xl shadow-lg p-8 border border-royal-glass-border mb-10">
          <div className="flex items-center mb-8">
            <div className="bg-royal-gold/10 rounded-full w-14 h-14 flex items-center justify-center mr-5">
              <CustomIcon name="ri-lock-line" className="text-3xl text-royal-gold" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-royal-gold font-playfair mb-2">Admin Security & Actions</h2>
              <p className="text-white/80 font-inter">Security measures and available admin actions</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center text-center p-6 bg-royal-gold/5 rounded-xl border border-royal-gold/10 h-full">
              <div className="text-4xl text-royal-gold mb-4">🔐</div>
              <h3 className="font-semibold text-royal-gold font-playfair mb-3 text-lg">Admin Authentication</h3>
              <p className="text-sm text-white/80 font-inter">Secure admin login with role-based access control</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 bg-royal-gold/5 rounded-xl border border-royal-gold/10 h-full">
              <div className="text-4xl text-royal-gold-light mb-4">👥</div>
              <h3 className="font-semibold text-royal-gold font-playfair mb-3 text-lg">User Management</h3>
              <p className="text-sm text-white/80 font-inter">View, pause, resume, and manage user accounts</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 bg-royal-gold/5 rounded-xl border border-royal-gold/10 h-full">
              <div className="text-4xl text-royal-gold mb-4">📱</div>
              <h3 className="font-semibold text-royal-gold font-playfair mb-3 text-lg">Invitation Control</h3>
              <p className="text-sm text-white/80 font-inter">Send and track phone invitations</p>
            </div>
          </div>
          
          <div className="bg-royal-obsidian rounded-xl p-8">
            <h3 className="font-semibold text-royal-gold font-playfair mb-6 flex items-center text-lg">
              <div className="text-royal-gold mr-3">🛡️</div>
              Admin Capabilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <div className="text-royal-gold-light mr-4 text-xl">👁️</div>
                <span className="text-royal-gold-light">View all user profiles and data</span>
              </div>
              <div className="flex items-center">
                <div className="text-yellow-500 mr-4 text-xl">⏸️</div>
                <span className="text-royal-gold-light">Pause user accounts</span>
              </div>
              <div className="flex items-center">
                <div className="text-royal-gold-light mr-4 text-xl">▶️</div>
                <span className="text-royal-gold-light">Resume user accounts</span>
              </div>
              <div className="flex items-center">
                <div className="text-royal-gold mr-4 text-xl">📱</div>
                <span className="text-royal-gold-light">Send phone invitations</span>
              </div>
              <div className="flex items-center">
                <div className="text-royal-gold mr-4 text-xl">🖼️</div>
                <span className="text-royal-gold-light">Access profile images</span>
              </div>
              <div className="flex items-center">
                <div className="text-indigo-500 mr-4 text-xl">📊</div>
                <span className="text-royal-gold-light">Monitor platform statistics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Access Section */}
        <div className="safety-card bg-royal-glass rounded-2xl shadow-lg p-8 border border-royal-glass-border mb-10">
          <div className="flex items-center mb-8">
            <div className="bg-royal-gold/10 rounded-full w-14 h-14 flex items-center justify-center mr-5">
              <CustomIcon name="ri-file-text-line" className="text-3xl text-royal-gold" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-royal-gold font-playfair mb-2">Data Access & Management</h2>
              <p className="text-white/80 font-inter">Admin access to user data and platform information</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="font-semibold text-royal-gold font-playfair mb-6 flex items-center text-lg">
                <CustomIcon name="ri-user-line" className="text-royal-gold-light mr-3" />
                User Data Access
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-royal-gold-light mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-royal-gold-light">View user profiles and personal information</span>
                </li>
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-royal-gold-light mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-royal-gold-light">Access profile images and media files</span>
                </li>
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-royal-gold-light mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-royal-gold-light">Monitor user activity and login history</span>
                </li>
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-royal-gold-light mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-royal-gold-light">Track profile completion status</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-royal-gold font-playfair mb-6 flex items-center text-lg">
                <CustomIcon name="ri-settings-line" className="text-royal-gold mr-3" />
                Platform Management
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-royal-gold-light mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-royal-gold-light">Manage user account status</span>
                </li>
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-royal-gold-light mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-royal-gold-light">Send and track invitations</span>
                </li>
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-royal-gold-light mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-royal-gold-light">Monitor platform statistics</span>
                </li>
                <li className="flex items-start">
                  <CustomIcon name="ri-check-line" className="text-royal-gold-light mt-1 mr-3 flex-shrink-0 text-lg" />
                  <span className="text-royal-gold-light">Access cloud storage management</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Admin Support Section */}
        <div className="safety-card bg-royal-glass rounded-2xl shadow-lg p-8 border border-royal-glass-border">
          <div className="flex items-center mb-8">
            <div className="bg-royal-gold/10 rounded-full w-14 h-14 flex items-center justify-center mr-5">
              <CustomIcon name="ri-customer-service-line" className="text-3xl text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-royal-gold font-playfair mb-2">Admin Support & Resources</h2>
              <p className="text-white/80 font-inter">Support and resources for admin operations</p>
            </div>
          </div>
          
          <div className="text-center p-8 bg-royal-obsidian border border-royal-gold/20 rounded-2xl max-w-md mx-auto shadow-md">
            <CustomIcon name="ri-mail-line" className="text-4xl text-royal-gold mx-auto mb-4" />
            <h3 className="font-semibold text-royal-gold font-playfair mb-3 text-lg">Admin Support</h3>
            <p className="text-sm text-white/60 mb-4">For admin access and technical support</p>
            <a href="mailto:shaadimantrana.help@gmail.com" className="text-royal-gold hover:text-royal-gold-light font-medium block transition-colors">
              shaadimantrana.help@gmail.com
            </a>
          </div>
        </div>
      </div>
  );
}
