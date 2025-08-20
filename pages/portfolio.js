// pages/portfolio.js - 포트폴리오 관리 페이지
import React, { useState, useEffect } from 'react';
import PortfolioForm from '../components/portfolio/PortfolioForm';
import PortfolioList from '../components/portfolio/PortfolioList';
import { Card, Tabs } from '../components/ui/DesignSystem';
import { useAuthContext } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function PortfolioPage() {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('list');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const handlePortfolioCreated = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('list');
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-64">
          <div>로딩 중...</div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: 'list', label: '포트폴리오 목록' },
    { id: 'create', label: '새 프로젝트 추가' }
  ];

  return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">포트폴리오 관리</h1>
          <p className="text-gray-600">완료한 프로젝트를 등록하고 공개 페이지에 표시하세요</p>
        </div>

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="mt-6">
          {activeTab === 'list' && (
            <PortfolioList key={refreshKey} />
          )}

          {activeTab === 'create' && (
            <Card className="p-6 max-w-2xl">
              <h2 className="text-xl font-bold mb-4">새 프로젝트 추가</h2>
              <PortfolioForm onSuccess={handlePortfolioCreated} />
            </Card>
          )}
        </div>
      </div>
  );
}