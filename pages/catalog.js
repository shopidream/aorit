import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, Button, Badge, Input } from '../components/ui/DesignSystem';
import ServiceCard from '../components/catalog/ServiceCard';
import ServiceModal from '../components/catalog/ServiceModal';
import PlanSection from '../components/catalog/PlanSection';

export default function CatalogPage() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      const activeServices = data.filter(s => s.isActive);
      setServices(activeServices);
    } catch (error) {
      console.error('서비스 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedServices = {
    basic: services.filter(s => s.planType === 'basic'),
    standard: services.filter(s => s.planType === 'standard'), 
    premium: services.filter(s => s.planType === 'premium'),
    addon: services.filter(s => s.planType === 'addon'),
    marketing: services.filter(s => s.planType === 'marketing')
  };

  const handleServiceDetail = (service) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  const handleServiceSelect = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const handleCreateQuote = () => {
    if (selectedServices.length === 0) return;
    
    const serviceIds = selectedServices.map(s => s.id).join(',');
    router.push({
      pathname: '/quotes/create',
      query: { services: serviceIds }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">서비스를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 헤더 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">서비스 카탈로그</h1>
            </div>
            <div className="flex items-center space-x-4">
              {selectedServices.length > 0 && (
                <Button onClick={handleCreateQuote} size="sm">
                  견적서 ({selectedServices.length})
                </Button>
              )}
              <Button as="a" href="/login" variant="outline">
                로그인
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 히어로 섹션 */}
        <div className="text-center space-y-4 py-12">
          <h2 className="text-5xl font-bold text-gray-900">전문적인 디지털 솔루션</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            비즈니스 성장을 위한 맞춤형 웹개발, 디자인, 마케팅 서비스를 제공합니다
          </p>
        </div>

        {/* 검색 및 필터 */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="서비스명, 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-gray-500/50 focus:border-gray-500"
            >
              <option value="all">전체 카테고리</option>
              <option value="웹개발">웹개발</option>
              <option value="디자인">디자인</option>
              <option value="마케팅">마케팅</option>
              <option value="컨설팅">컨설팅</option>
            </select>
          </div>

          {selectedServices.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">견적서에 {selectedServices.length}개 서비스 추가됨</span>
                <span className="text-gray-600 ml-2">
                  총 {selectedServices.reduce((sum, service) => sum + (service.price || 0), 0).toLocaleString()}원
                </span>
              </div>
              <Button onClick={handleCreateQuote} size="sm">
                견적서 확인
              </Button>
            </div>
          )}
        </Card>

        {/* 베이직 플랜 */}
        <PlanSection 
          title="베이직 플랜"
          description="기본적인 디지털 솔루션으로 시작하세요"
          services={groupedServices.basic}
          userRole="customer"
          onServiceDetail={handleServiceDetail}
          onServiceSelect={handleServiceSelect}
          selectedServices={selectedServices}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
        />

        {/* 스탠다드 플랜 */}
        <PlanSection 
          title="스탠다드 플랜"
          description="더 많은 기능과 전문적인 서비스"
          services={groupedServices.standard}
          userRole="customer"
          onServiceDetail={handleServiceDetail}
          onServiceSelect={handleServiceSelect}
          selectedServices={selectedServices}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
        />

        {/* 프리미엄 플랜 */}
        <PlanSection 
          title="프리미엄 플랜"
          description="최고 수준의 맞춤형 솔루션"
          services={groupedServices.premium}
          userRole="customer"
          onServiceDetail={handleServiceDetail}
          onServiceSelect={handleServiceSelect}
          selectedServices={selectedServices}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
        />

        {/* 추가 서비스 */}
        <PlanSection 
          title="추가 서비스"
          description="기존 서비스를 확장하는 애드온"
          services={groupedServices.addon}
          userRole="customer"
          onServiceDetail={handleServiceDetail}
          onServiceSelect={handleServiceSelect}
          selectedServices={selectedServices}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
        />

        {/* 마케팅 서비스 */}
        <PlanSection 
          title="마케팅 서비스"
          description="비즈니스 성장을 위한 마케팅 솔루션"
          services={groupedServices.marketing}
          userRole="customer"
          onServiceDetail={handleServiceDetail}
          onServiceSelect={handleServiceSelect}
          selectedServices={selectedServices}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
        />

        {/* CTA 섹션 */}
        <div className="bg-gray-900 text-white rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">맞춤형 견적이 필요하신가요?</h3>
          <p className="text-gray-300 mb-6 text-lg">
            프로젝트 규모와 요구사항에 따른 정확한 견적을 받아보세요
          </p>
          <Button 
            onClick={handleCreateQuote}
            size="lg"
            className="bg-white text-gray-900 hover:bg-gray-100"
            disabled={selectedServices.length === 0}
          >
            무료 견적 상담 받기
          </Button>
        </div>
      </div>

      {/* 서비스 상세 모달 */}
      {showServiceModal && (
        <ServiceModal
          service={selectedService}
          isEditMode={false}
          userRole="customer"
          isOpen={showServiceModal}
          onClose={() => {
            setShowServiceModal(false);
            setSelectedService(null);
          }}
        />
      )}
    </div>
  );
}