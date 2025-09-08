/**
 * Ana sayfa - Authentication
 * Giriş yapılmamışsa auth formu, yapılmışsa dashboard'a yönlendir
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { AuthForm } from '@/components/forms/auth-form';
import { Loading } from '@/components/ui/loading';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <Loading message="Yükleniyor..." />;
  }

  if (isAuthenticated) {
    return <Loading message="Dashboard'a yönlendiriliyor..." />;
  }

  return <AuthForm />;
}
