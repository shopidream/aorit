// pages/services.js - 통합 서비스 카탈로그 페이지 (ErrorBoundary 적용)
import React, { useEffect } from 'react';
import ServiceCatalog from '../components/catalog/ServiceCatalog';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuthContext } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function ServicesPage() {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (

        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>

    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (

      <ErrorBoundary>
        <ServiceCatalog />
      </ErrorBoundary>

  );
}