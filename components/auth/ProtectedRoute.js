// components/auth/ProtectedRoute.js - 보호된 라우트
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function ProtectedRoute({ 
  children, 
  requireAuth = true,
  requiredRole = null,
  redirectTo = '/login',
  fallback = null
}) {
  const { user, isAuthenticated, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // 로딩 중이면 대기

    // 인증이 필요한데 로그인하지 않은 경우
    if (requireAuth && !isAuthenticated) {
      const currentPath = router.asPath;
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.replace(loginUrl);
      return;
    }

    // 특정 역할이 필요한데 권한이 없는 경우
    if (requiredRole && user?.role !== requiredRole) {
      router.replace('/unauthorized');
      return;
    }

    // 인증이 필요하지 않은데 로그인한 경우 (로그인/회원가입 페이지)
    if (!requireAuth && isAuthenticated) {
      const redirectPath = router.query.redirect || '/dashboard';
      router.replace(redirectPath);
      return;
    }
  }, [loading, isAuthenticated, user, router, requireAuth, requiredRole, redirectTo]);

  // 로딩 중
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증이 필요한데 로그인하지 않은 경우
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600">잠시 후 로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  // 역할 권한이 없는 경우
  if (requiredRole && user?.role !== requiredRole) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600">이 페이지에 접근할 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  // 모든 조건을 만족하면 children 렌더링
  return children;
}

// HOC 형태로 사용할 수 있는 버전
export const withAuth = (WrappedComponent, options = {}) => {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

// 역할별 보호된 라우트 컴포넌트들
export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute requiredRole="admin" redirectTo="/dashboard" {...props}>
    {children}
  </ProtectedRoute>
);

export const FreelancerRoute = ({ children, ...props }) => (
  <ProtectedRoute requiredRole="freelancer" {...props}>
    {children}
  </ProtectedRoute>
);

// 공개 라우트 (로그인한 사용자는 대시보드로 리다이렉트)
export const PublicRoute = ({ children, ...props }) => (
  <ProtectedRoute requireAuth={false} {...props}>
    {children}
  </ProtectedRoute>
);