/**
 * Dashboard Sayfa Layout
 * Rol bazlı erişim kontrolü ile
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { Loading } from '@/components/ui/loading';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <Loading message="Yükleniyor..." />;
  }

  if (!isAuthenticated || !user) {
    return <Loading message="Giriş sayfasına yönlendiriliyor..." />;
  }

  return <>{children}</>;
}
