import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Dashboard from '../components/dashboard/Dashboard';
import ErrorBoundary from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/ui/DesignSystem';
import { useAuthContext } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
      <ErrorBoundary>
        <Dashboard />
      </ErrorBoundary>
  );
}