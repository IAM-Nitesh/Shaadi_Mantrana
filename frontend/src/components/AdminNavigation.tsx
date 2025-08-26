'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import CustomIcon from './CustomIcon';
// Avoid importing server-only auth service in client components
import { config as configService } from '../services/configService';

export default function AdminNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const authRes = await fetch('/api/auth/status', { method: 'GET', credentials: 'include' });
      if (!authRes.ok) {
        setLoading(false);
        return;
      }
      const authStatus = await authRes.json();
      if (!authStatus.authenticated) {
        setLoading(false);
        return;
      }

      const tokenRes = await fetch('/api/auth/token', { method: 'GET', credentials: 'include' });
      const tokenData = tokenRes.ok ? await tokenRes.json().catch(() => ({})) : {};
      const token = tokenData?.token;
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${configService.apiBaseUrl}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setIsAdmin(userData.profile?.role === 'admin');
      }
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  if (loading || !isAdmin) {
    return null;
  }

  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: 'ri-dashboard-line',
      active: pathname === '/admin/dashboard'
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: 'ri-user-settings-line',
      active: pathname === '/admin/users'
    },
    {
      href: '/admin/email-invitations',
      label: 'Invitations',
      icon: 'ri-mail-line',
      active: pathname === '/admin/email-invitations'
    },
    {
      href: '/admin/data-safety',
      label: 'Data Safety',
      icon: 'ri-shield-check-line',
      active: pathname === '/admin/data-safety'
    }
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-2">
        <div className="flex space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2 rounded-xl transition-all duration-200 ${
                item.active
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <CustomIcon name={item.icon} className="mr-2" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 