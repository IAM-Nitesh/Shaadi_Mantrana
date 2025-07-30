'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminAccessLinks() {
  const pathname = usePathname();
  
  // Don't show on admin pages or auth pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/auth') || pathname === '/login') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2">
        <div className="flex flex-col space-y-1">
          <Link 
            href="/admin/login" 
            className="text-xs text-gray-600 hover:text-blue-600 transition-colors duration-200 px-2 py-1 rounded hover:bg-blue-50 whitespace-nowrap"
          >
            Admin Login
          </Link>
          <Link 
            href="/admin/dashboard" 
            className="text-xs text-gray-600 hover:text-blue-600 transition-colors duration-200 px-2 py-1 rounded hover:bg-blue-50 whitespace-nowrap"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 