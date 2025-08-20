// pages/profile.js - 프로필 관리 페이지 (단일 폼)
import React, { useState, useEffect } from 'react';
import ProfileForm from '../components/profile/ProfileForm';
import { 
  Card, 
  Alert, 
  Badge,
  LoadingSpinner,
  PageHeader
} from '../components/ui/DesignSystem';
import { User, Mail, Shield, Settings, ExternalLink } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function ProfilePage() {
  const { isAuthenticated, loading, user } = useAuthContext();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleProfileUpdate = () => {
    setSuccessMessage('프로필이 성공적으로 업데이트되었습니다.');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge variant="danger" icon={Shield}>관리자</Badge>;
      case 'user':
        return <Badge variant="primary" icon={User}>사용자</Badge>;
      case 'freelancer':
        return <Badge variant="success" icon={User}>프리랜서</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
      <div className="max-w-5xl space-y-8">
        
        {/* 페이지 헤더 */}
        <PageHeader
          title="프로필 관리"
          description="프로필 정보를 수정하고 공개 페이지를 관리하세요"
          action={
            <div className="flex items-center gap-3">
              {getRoleBadge(user?.role)}
              <button
                onClick={() => router.push('/public-page')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings size={16} />
                공개 페이지 관리
              </button>
            </div>
          }
        />

        {/* 성공 메시지 */}
        {successMessage && (
          <Alert type="success" title="업데이트 완료" dismissible onDismiss={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {/* 기본 정보 요약 카드 */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <User size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
                <p className="text-blue-700 flex items-center gap-2">
                  <Mail size={16} />
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getRoleBadge(user?.role)}
              <button
                onClick={() => window.open(`/public/${user?.id}`, '_blank')}
                className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors text-sm"
              >
                <ExternalLink size={14} />
                공개 페이지
              </button>
            </div>
          </div>
        </Card>

        {/* 통합 프로필 폼 */}
        <Card>
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Settings size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">프로필 정보</h2>
                <p className="text-gray-600">모든 프로필 정보를 한 번에 관리하세요</p>
              </div>
            </div>
            
            {/* 프로필 폼 컴포넌트 */}
            <ProfileForm onSuccess={handleProfileUpdate} />
          </div>
        </Card>

      </div>
  );
}