// components/catalog/ServiceCatalog.js - 탭 형식 서비스 관리 페이지
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, Button, Badge, PageHeader, EmptyState, LoadingSpinner } from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import ServiceCard from './ServiceCard';
import ServiceForm from '../services/ServiceForm';
import ServiceDetail from '../services/ServiceDetail';
import ShareModal from './ShareModal';
import AIServiceModal from './AIServiceModal';
import { normalizeService } from '../../lib/dataTypes';
import { 
  BriefcaseIcon, 
  CheckIcon, 
  PlusIcon,
  SparklesIcon
} from '../ui/DesignSystem';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Share2,
  Link,
  Eye
} from 'lucide-react';

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

export default function ServiceCatalog() {
  const { getAuthHeaders, user } = useAuthContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('list');
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [viewingService, setViewingService] = useState(null);
  const [deletingService, setDeletingService] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGeneratedServices, setAIGeneratedServices] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shareModal, setShareModal] = useState({ isOpen: false, url: '', serviceCount: 0 });

  const userRole = user?.role || 'customer';
  const { from, client } = router.query;
  const isFromClients = from === 'clients' && client;

  useEffect(() => {
    fetchCategoriesAndServices();
  }, [refreshKey]);

  const fetchCategoriesAndServices = async () => {
    try {
      setLoading(true);
      const [categoriesRes, servicesRes] = await Promise.all([
        fetch('/api/categories', { headers: getAuthHeaders() }),
        fetch('/api/services', { headers: getAuthHeaders() })
      ]);

      const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];
      const servicesData = servicesRes.ok ? await servicesRes.json() : [];

      setCategories(Array.isArray(categoriesData) ? categoriesData.map(category => ({
        ...category,
        services: Array.isArray(servicesData) ? servicesData.filter(service => service.categoryId === category.id) : []
      })) : []);
      setServices(servicesData || []);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      setCategories([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service) => {
    const normalizedService = normalizeService(service);
    
    if (normalizedService.isPlan) {
      setSelectedServices(prev => {
        const withoutSameCategory = prev.filter(s => !s.isPlan || s.categoryId !== normalizedService.categoryId);
        const isAlreadySelected = prev.find(s => s.id === normalizedService.id);
        return isAlreadySelected ? withoutSameCategory : [...withoutSameCategory, normalizedService];
      });
    } else {
      setSelectedServices(prev => {
        const isSelected = prev.find(s => s.id === normalizedService.id);
        return isSelected ? prev.filter(s => s.id !== normalizedService.id) : [...prev, normalizedService];
      });
    }
  };

  const handleServiceDetail = (service) => {
    setViewingService(normalizeService(service));
    setActiveTab('detail');
  };

  const handleServiceEdit = async (service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, { headers: getAuthHeaders() });
      setEditingService(response.ok ? await response.json() : normalizeService(service));
    } catch (error) {
      setEditingService(normalizeService(service));
    }
    setActiveTab('edit');
  };

  const handleDeleteService = async (serviceId, serviceName) => {
    if (!confirm(`정말로 "${serviceName}" 서비스를 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingService(serviceId);
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setRefreshKey(prev => prev + 1);
        if (editingService && editingService.id === serviceId) {
          setEditingService(null);
          setActiveTab('list');
        }
        setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
        alert('서비스가 성공적으로 삭제되었습니다.');
      } else {
        const data = await response.json();
        alert(data.error || '서비스 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('서비스 삭제 오류:', error);
      alert('서비스 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingService(null);
    }
  };

  const handleAddAIServiceToMyServices = async (service) => {
    try {
      const category = await createCategoryIfNeeded(service.category);
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          categoryId: category.id,
          title: service.title,
          description: service.description,
          price: service.estimatedPrice,
          features: service.features,
          isActive: true
        })
      });

      if (response.ok) {
        alert(`"${service.title}" 서비스가 추가되었습니다!`);
        setAIGeneratedServices(prev => prev.filter(s => s.id !== service.id));
        setRefreshKey(prev => prev + 1);
      } else {
        throw new Error('서비스 저장에 실패했습니다');
      }
    } catch (error) {
      alert(`서비스 추가에 실패했습니다: ${error.message}`);
    }
  };

  const createCategoryIfNeeded = async (categoryName) => {
    try {
      const categoriesResponse = await fetch('/api/categories', { headers: getAuthHeaders() });
      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json();
        const similarCategory = categories.find(c => 
          c.name.includes(categoryName) || categoryName.includes(c.name.replace('AI ', ''))
        );
        if (similarCategory) return similarCategory;
      }
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          id: `ai_${categoryName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
          name: categoryName,
          type: 'standard'
        })
      });
      
      return response.ok ? await response.json() : { id: 'general', name: '일반' };
    } catch (error) {
      return { id: 'general', name: '일반' };
    }
  };

  const handleServiceSaved = () => {
    setRefreshKey(prev => prev + 1);
    setEditingService(null);
    setActiveTab('list');
  };

  const handleServiceCreated = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('list');
  };

  const handleBackToList = () => {
    setEditingService(null);
    setViewingService(null);
    setActiveTab('list');
  };

  const handleCreateQuote = () => {
    if (selectedServices.length === 0) return;
    const serviceIds = selectedServices.map(s => s.id).join(',');
    router.push(isFromClients ? `/quotes/create?client=${client}&services=${serviceIds}` : `/clients?from=services&services=${serviceIds}`);
  };

  const handleShareServices = async () => {
    if (selectedServices.length === 0) return;
    
    try {
      const response = await fetch('/api/shared/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          serviceIds: selectedServices.map(s => s.id),
          title: `${user?.name || '서비스'} 소개`,
          description: '전문적인 서비스를 제공합니다'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShareModal({
          isOpen: true,
          url: data.shareUrl,
          serviceCount: selectedServices.length
        });
      } else {
        alert(data.error || '공유 링크 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('공유 링크 생성 오류:', error);
      alert('공유 링크 생성 중 오류가 발생했습니다');
    }
  };

  const totalPrice = selectedServices.reduce((sum, service) => sum + (parseFloat(service.price) || 0), 0);

  const planGroups = services.reduce((groups, service) => {
    if (service.isPlan) {
      const groupName = service.category?.name || '미분류 플랜';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(service);
    }
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">서비스를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'list', 
      label: '서비스 목록',
      icon: <BriefcaseIcon size={20} />
    },
    { 
      id: 'links', 
      label: '링크 관리',
      icon: <Link size={20} />
    },
    ...(viewingService ? [{ 
      id: 'detail', 
      label: '서비스 상세',
      icon: <Eye size={20} />
    }] : []),
    ...(editingService ? [{ 
      id: 'edit', 
      label: '서비스 편집',
      icon: <Edit size={20} />
    }] : [])
  ];

  return (
    <div className="max-w-6xl space-y-8">
      
      {/* 페이지 헤더 */}
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <span>서비스 관리</span>
            <Badge variant="info" icon={BriefcaseIcon}>
              {services.length}개
            </Badge>
          </div>
        }
        description={
          isFromClients 
            ? '견적서 작성을 위해 서비스를 선택하세요' 
            : '전문적인 디지털 솔루션으로 비즈니스 성장을 지원합니다'
        }
        action={
          <div className="flex items-center gap-3">
            {isFromClients && (
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                icon={ArrowLeft}
                size="sm"
              >
                고객 선택으로 돌아가기
              </Button>
            )}
            <div className="flex gap-2">
              {['admin', 'freelancer'].includes(userRole) && (
                <Button
                  variant="primary"
                  onClick={() => setActiveTab('create')}
                  icon={PlusIcon}
                >
                  새 서비스 등록
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setShowAIModal(true)}
                icon={SparklesIcon}
              >
                AI 서비스 등록
              </Button>
            </div>
          </div>
        }
      />

      {/* 진행 상태 표시 */}
      {isFromClients && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BriefcaseIcon size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">견적 작성 진행 중</h3>
              <p className="text-blue-700 text-sm">
                선택된 고객: 고객 #{client} | 다음 단계: 서비스 선택 → 견적서 작성
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 선택된 서비스 상태 - 항상 표시 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {selectedServices.length > 0 
              ? `선택: ${selectedServices.length}개 (${totalPrice.toLocaleString()}원)`
              : '서비스를 선택하세요'
            }
          </span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              icon={Share2}
              onClick={handleShareServices}
              disabled={selectedServices.length === 0}
            >
              공유
            </Button>
            <Button 
              size="sm"
              onClick={handleCreateQuote} 
              disabled={selectedServices.length === 0}
              variant={isFromClients ? "primary" : "outline"}
              icon={isFromClients ? CheckIcon : undefined}
            >
              {isFromClients ? '견적 작성' : '견적서 작성'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 탭 네비게이션 */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 탭 콘텐츠 */}
      <div className="min-h-[400px]">
        {activeTab === 'list' && (
          <div className="space-y-8">
            
            {/* AI 생성된 서비스들 */}
            {aiGeneratedServices.length > 0 && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">AI 추천 서비스</h2>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" size="sm">AI 생성</Badge>
                    <span className="text-sm text-gray-500">{aiGeneratedServices.length}개 서비스</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {aiGeneratedServices.map((service) => (
                    <Card key={service.id} className="overflow-hidden">
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                          <div className="text-xl font-bold text-blue-600">
                            {(service.estimatedPrice || 0).toLocaleString()}원
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                          {service.description}
                        </p>

                        {service.features?.length > 0 && (
                          <div className="mb-6">
                            <ul className="space-y-1">
                              {service.features.slice(0, 3).map((feature, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-start">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                                  <span className="line-clamp-1">{feature}</span>
                                </li>
                              ))}
                              {service.features.length > 3 && (
                                <li className="text-sm text-gray-500 pl-5">
                                  +{service.features.length - 3}개 기능 더
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mb-6">
                          <Badge variant="info" size="sm">
                            {service.category}
                          </Badge>
                        </div>

                        <Button
                          onClick={() => handleAddAIServiceToMyServices(service)}
                          variant="secondary"
                          className="w-full"
                        >
                          내 서비스로 추가
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 플랜 서비스들 */}
            {Object.keys(planGroups).length > 0 && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900">플랜 서비스</h2>
                </div>
                
                {Object.entries(planGroups).map(([groupName, groupServices]) => (
                  <div key={groupName} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-800">{groupName}</h3>
                      <Badge variant="warning" size="sm">
                        플랜 ({groupServices.length}개 중 1개 선택)
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {groupServices.map(service => {
                        const normalizedService = normalizeService(service);
                        const isSelected = selectedServices.some(s => s.id === normalizedService.id);
                        const hasOtherSelected = selectedServices.some(s => 
                          s.isPlan && s.categoryId === normalizedService.categoryId && s.id !== normalizedService.id
                        );
                        
                        return (
                          <div key={service.id} className={`relative transition-all duration-200 ${hasOtherSelected ? 'opacity-50' : ''}`}>
                            <ServiceCard
                              service={normalizedService}
                              userRole={userRole}
                              onServiceDetail={handleServiceDetail}
                              onServiceEdit={handleServiceEdit}
                              isSelected={isSelected}
                              onClick={() => !hasOtherSelected && handleServiceSelect(normalizedService)}
                            />
                            {hasOtherSelected && (
                              <div className="absolute inset-0 bg-gray-500 bg-opacity-20 rounded-2xl flex items-center justify-center pointer-events-none">
                                <Badge variant="secondary" size="sm">
                                  다른 플랜이 선택됨
                                </Badge>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 일반 서비스들 */}
            {categories.map((category) => {
              const normalServices = (category.services || []).filter(service => !service.isPlan);
              if (normalServices.length === 0) return null;

              return (
                <div key={category.id} className="space-y-6">
                  <div className="border-b border-gray-200 pb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                      {['admin', 'freelancer'].includes(userRole) && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            if (confirm('정말 이 카테고리를 삭제하시겠습니까?')) {
                              // 삭제 로직 구현
                            }
                          }}
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" size="sm">일반 서비스</Badge>
                      <span className="text-sm text-gray-500">{normalServices.length}개 서비스</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {normalServices.map((service) => {
                      const normalizedService = normalizeService(service);
                      return (
                        <ServiceCard
                          key={normalizedService.id}
                          service={normalizedService}
                          userRole={userRole}
                          onServiceDetail={handleServiceDetail}
                          onServiceEdit={handleServiceEdit}
                          isSelected={!!selectedServices.find(s => s.id === normalizedService.id)}
                          onClick={() => handleServiceSelect(normalizedService)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* 빈 상태 */}
            {categories.length === 0 && Object.keys(planGroups).length === 0 && aiGeneratedServices.length === 0 && !loading && (
              <EmptyState
                icon={BriefcaseIcon}
                title="등록된 서비스가 없습니다"
                description="새 서비스를 추가해보세요"
                action={
                  ['admin', 'freelancer'].includes(userRole) && (
                    <Button onClick={() => setActiveTab('create')} icon={PlusIcon}>
                      첫 서비스 등록하기
                    </Button>
                  )
                }
              />
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <Card>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <PlusIcon size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">새 서비스 등록</h2>
                  <p className="text-gray-600">서비스 정보를 입력해서 등록하세요</p>
                </div>
              </div>
              
              <div className="mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('list')}
                  icon={ArrowLeft}
                >
                  서비스 목록으로 돌아가기
                </Button>
              </div>
              
              <ServiceForm 
                onSuccess={handleServiceCreated}
              />
            </div>
          </Card>
        )}

        {activeTab === 'detail' && viewingService && (
          <ServiceDetail
            service={viewingService}
            user={user}
            profile={user?.profile}
            userRole={userRole}
            onBack={handleBackToList}
            onEdit={handleServiceEdit}
            onDelete={handleDeleteService}
            deleting={deletingService === viewingService.id}
          />
        )}

        {activeTab === 'links' && (
          <Card>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Link size={24} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">링크 관리</h2>
                  <p className="text-gray-600">생성된 공유 링크를 관리하세요</p>
                </div>
              </div>
              
              <div className="mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('list')}
                  icon={ArrowLeft}
                >
                  서비스 목록으로 돌아가기
                </Button>
              </div>
              
              {/* TODO: 링크 히스토리 테이블 구현 */}
              <div className="text-center py-16 text-gray-500">
                <Link size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">링크 히스토리</h3>
                <p>공유 링크 관리 기능을 구현 예정입니다</p>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'edit' && editingService && (
          <Card>
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Edit size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">서비스 편집</h2>
                    <p className="text-gray-600">"{editingService.title}" 서비스의 정보를 수정하세요</p>
                  </div>
                </div>
                
                {/* 삭제 버튼 */}
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDeleteService(editingService.id, editingService.title)}
                  disabled={deletingService === editingService.id}
                >
                  {deletingService === editingService.id ? '삭제 중...' : '서비스 삭제'}
                </Button>
              </div>
              
              <div className="mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToList}
                  icon={ArrowLeft}
                >
                  서비스 목록으로 돌아가기
                </Button>
              </div>
              
              <ServiceForm 
                initialData={editingService}
                onSuccess={handleServiceSaved}
                isEditMode={true}
              />
            </div>
          </Card>
        )}
      </div>

      {/* 공유 모달 */}
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, url: '', serviceCount: 0 })}
        shareUrl={shareModal.url}
        serviceCount={shareModal.serviceCount}
      />

      {/* AI 모달 */}
      <AIServiceModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onServicesGenerated={(result) => setAIGeneratedServices(result.suggestedServices || [])}
      />
    </div>
  );
}