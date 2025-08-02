'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomIcon from '../../../components/CustomIcon';
import AdminRouteGuard from '../../../components/AdminRouteGuard';
import ToastService from '../../../services/toastService';
import { ServerAuthService } from '../../../services/server-auth-service';
import HeartbeatLoader from '../../../components/HeartbeatLoader';
import { gsap } from 'gsap';

interface DashboardData {
  storageStats: {
    b2Usage: string;
    b2Total: string;
    b2Files?: number;
    b2AverageSize?: string;
    b2OrphanedFiles?: number;
    b2OrphanedSize?: string;
    mongoUsage: string;
    mongoTotal: string;
    mongoProfiles?: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = await ServerAuthService.getBearerToken();
      if (!token) {
        console.log('🔍 Dashboard: No auth token found');
        router.push('/');
        return;
      }

      console.log('🔍 Dashboard: Fetching admin stats from /api/admin/stats');
      
      // Fetch admin stats (includes storage stats)
      const statsResponse = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 Dashboard: Response status:', statsResponse.status);

      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        console.error('🔍 Dashboard: API error response:', errorText);
        throw new Error(`Failed to fetch dashboard data: ${statsResponse.status} ${errorText}`);
      }

      const data = await statsResponse.json();
      console.log('🔍 Dashboard: Received data:', data);
      
      // Transform the data to match the expected format
      const dashboardData: DashboardData = {
        storageStats: {
          b2Usage: data.storageStats?.b2Usage || '0 Bytes',
          b2Total: data.storageStats?.b2Total || '10 GB',
          b2Files: data.storageStats?.b2Files || 0,
          b2AverageSize: data.storageStats?.b2AverageSize || '0 Bytes',
          b2OrphanedFiles: data.storageStats?.b2OrphanedFiles || 0,
          b2OrphanedSize: data.storageStats?.b2OrphanedSize || '0 Bytes',
          mongoUsage: data.storageStats?.mongoUsage || '0 Bytes',
          mongoTotal: data.storageStats?.mongoTotal || '512 MB',
          mongoProfiles: data.storageStats?.mongoProfiles || 0
        }
      };

      console.log('🔍 Dashboard: Transformed data:', dashboardData);
      setDashboardData(dashboardData);
      
      // Animate widgets on load
      gsap.fromTo('.dashboard-widget', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );

    } catch (error) {
      console.error('❌ Dashboard: Error fetching dashboard data:', error);
      setError(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStoragePercentage = (used: string, total: string): number => {
    // Convert string values like "1.2 MB" and "10 GB" to bytes for calculation
    const parseStorageString = (str: string): number => {
      const units: { [key: string]: number } = {
        'Bytes': 1,
        'KB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024
      };
      
      const match = str.match(/^([\d.]+)\s*(\w+)$/);
      if (!match) return 0;
      
      const value = parseFloat(match[1]);
      const unit = match[2];
      return value * (units[unit] || 1);
    };
    
    const usedBytes = parseStorageString(used);
    const totalBytes = parseStorageString(total);
    
    return totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <HeartbeatLoader 
          logoSize="xxxxl"
          textSize="xl"
          text="Loading admin dashboard..." 
          showText={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <CustomIcon name="ri-error-warning-line" className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 pt-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <CustomIcon name="ri-dashboard-line" className="text-4xl text-blue-600 mr-3" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Monitor system performance and user statistics</p>
        </div>

        {/* Storage Usage Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* B2 Storage Widget */}
          <div className="dashboard-widget bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CustomIcon name="ri-cloud-line" className="text-3xl text-blue-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">B2 Cloud Storage</h3>
                  <p className="text-sm text-gray-500">Profile Images</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData ? dashboardData.storageStats.b2Usage : '0 Bytes'}
                </div>
                <div className="text-sm text-gray-500">
                  of {dashboardData ? dashboardData.storageStats.b2Total : '0 Bytes'}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${dashboardData ? getStoragePercentage(dashboardData.storageStats.b2Usage, dashboardData.storageStats.b2Total) : 0}%` 
                }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">
              {dashboardData ? getStoragePercentage(dashboardData.storageStats.b2Usage, dashboardData.storageStats.b2Total) : 0}% used
            </div>
            {dashboardData && dashboardData.storageStats?.b2Files !== undefined && (
              <div className="mt-2 text-xs text-gray-400">
                {dashboardData.storageStats.b2Files} profile pictures stored
                {dashboardData.storageStats?.b2OrphanedFiles && dashboardData.storageStats.b2OrphanedFiles > 0 && (
                  <span className="text-yellow-600 ml-2">
                    ({dashboardData.storageStats.b2OrphanedFiles} orphaned)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* MongoDB Storage Widget */}
          <div className="dashboard-widget bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CustomIcon name="ri-database-2-line" className="text-3xl text-green-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">MongoDB Storage</h3>
                  <p className="text-sm text-gray-500">User Data</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData ? dashboardData.storageStats.mongoUsage : '0 Bytes'}
                </div>
                <div className="text-sm text-gray-500">
                  of {dashboardData ? dashboardData.storageStats.mongoTotal : '0 Bytes'}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${dashboardData ? getStoragePercentage(dashboardData.storageStats.mongoUsage, dashboardData.storageStats.mongoTotal) : 0}%` 
                }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">
              {dashboardData ? getStoragePercentage(dashboardData.storageStats.mongoUsage, dashboardData.storageStats.mongoTotal) : 0}% used
            </div>
            {dashboardData && (
              <div className="mt-2 text-xs text-gray-400">
                {dashboardData.storageStats?.mongoProfiles || 0} profiles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 