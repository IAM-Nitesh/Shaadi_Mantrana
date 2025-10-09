import { redirect } from 'next/navigation';
import { getServerSession } from '../lib/auth-server';

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Check auth on server
  const user = await getServerSession();

  if (user) {
    // User is authenticated, redirect based on profile completeness
    if (user.isFirstLogin || (user.profileCompleteness || 0) < 50) {
      redirect('/profile');
    } else if (user.role === 'admin') {
      redirect('/admin/dashboard');
    } else {
      redirect('/dashboard');
    }
  }

  // User is not authenticated, show login page
  redirect('/login');
}