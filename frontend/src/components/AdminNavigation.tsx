'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CustomIcon from './CustomIcon';
import { useServerAuth } from '../hooks/useServerAuth';

export default function AdminNavigation() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useServerAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin when authentication state changes
    if (!isLoading && isAuthenticated && user) {
      setIsAdmin(user.role === 'admin');
    } else if (!isLoading && !isAuthenticated) {
      setIsAdmin(false);
    }
  }, [isAuthenticated, isLoading, user]);

  // Don't render navigation if not admin or still loading
  if (isLoading || !isAuthenticated || !isAdmin) {
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