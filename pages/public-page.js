// pages/public-page.js - 공개 페이지 관리 (전체 너비)
import React, { useState, useEffect } from 'react';
import PageEditor from '../components/public/PageEditor';
import PreviewMode from '../components/public/PreviewMode';
import { 
  Card, 
  Badge, 
  LoadingSpinner, 
  PageHeader,
  DocumentIcon, 
  SettingsIcon,
  CheckCircleIcon,
  InfoIcon
} from '../components/ui/DesignSystem';
import { useAuthContext } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

// 모던한 Tabs 컴포넌트
const Tabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="border-b border-gray-200 mb-8">
    <nav className="-mb-px flex space-x-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`py-4 px-2 border-b-2 font-semibold text-base transition-all duration-200 ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </div>
        </button>
      ))}
    </nav>
  </div>
);

export default function PublicPageManagement() {
  const { isAuthenticated, loading, user, getAuthHeaders } = useAuthContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('editor');
  const [pageData, setPageData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [previewData, setPreviewData] = useState({
    services: [],
    portfolio: [],
    profile: null
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreviewData();
    }
  }, [isAuthenticated]);

  const fetchPreviewData = async () => {
    setDataLoading(true);
    try {
      const [servicesRes, portfolioRes, profileRes] = await Promise.all([
        fetch('/api/services', { headers: getAuthHeaders() }),
        fetch('/api/portfolio', { headers: getAuthHeaders() }),
        fetch('/api/profile', { headers: getAuthHeaders() })
      ]);

      const services = await servicesRes.json();
      const portfolio = await portfolioRes.json();
      const profile = await profileRes.json();

      setPreviewData({
        services: services.filter(s => s.isActive),
        portfolio,
        profile
      });
    } catch (error) {
      console.error('미리보기 데이터 조회 실패:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handlePageSave = (savedPageData) => {
    setPageData(savedPageData);
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

  const tabs = [
    { 
      id: 'editor', 
      label: '페이지 관리',
      icon: <SettingsIcon size={20} />
    },
    { 
      id: 'preview', 
      label: '미리보기',
      icon: <DocumentIcon size={20} />
    }
  ];

  return (
      <div className="max-w-6xl space-y-8">
        
        {/* 페이지 헤더 */}
        <PageHeader
          title="공개 페이지 관리"
          description="고객에게 보여줄 공개 페이지를 설정하고 관리하세요"
          action={
            <div className="flex items-center gap-3">
              <Badge variant="info" icon={InfoIcon}>
                {previewData.services.length}개 서비스
              </Badge>
              <Badge variant="success" icon={CheckCircleIcon}>
                활성 상태
              </Badge>
            </div>
          }
        />

        {/* 탭 네비게이션 */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* 탭 콘텐츠 - 전체 너비 활용 */}
        <div className="min-h-[600px]">
          {activeTab === 'editor' && (
            <PageEditor onSave={handlePageSave} />
          )}

          {activeTab === 'preview' && (
            <div className="space-y-6">
              
              {/* 미리보기 헤더 */}
              <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <DocumentIcon size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">페이지 미리보기</h2>
                      <p className="text-gray-600">실제 고객이 보게 될 페이지를 확인하세요</p>
                    </div>
                  </div>
                  {pageData?.slug && (
                    <Badge variant="info" className="text-base px-4 py-2">
                      yoursite.com/{pageData.slug}
                    </Badge>
                  )}
                </div>
              </Card>

              {/* 실제 공개 페이지로 리다이렉트 안내 */}
              <Card className="text-center py-12">
                <DocumentIcon size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  실제 공개 페이지에서 확인하세요
                </h3>
                <p className="text-gray-600 mb-6">
                  미리보기는 실제 공개 페이지와 동일합니다
                </p>
                {pageData?.slug && pageData.isActive ? (
                  <button
                    onClick={() => window.open(`/public/${pageData.slug}`, '_blank')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <DocumentIcon size={20} />
                    공개 페이지 열기
                  </button>
                ) : (
                  <p className="text-amber-600">
                    페이지를 먼저 활성화하고 URL을 설정해주세요
                  </p>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
  );
}