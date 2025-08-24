// components/catalog/ServiceCatalog.js - data-shepherd-target 속성 추가
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, Button, Badge, PageHeader, EmptyState, LoadingSpinner, FloatingActionBar } from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import ServiceCard from './ServiceCard';
import ServiceForm from '../services/ServiceForm';
import ServiceDetail from '../services/ServiceDetail';
import ShareModal from './ShareModal';
import AIServiceModal from './AIServiceModal';
import OnboardingGuide from '../onboarding/CustomOnboardingGuide';
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
  Eye,
  Copy,
  ExternalLink,
  Calendar,
  Users,
  X
} from 'lucide-react';

// Tabs 컴포넌트
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
  
  // URL 파라미터에서 현재 상태 읽기
  const { view = 'list', id, from, client } = router.query;
  const userRole = user?.role || 'customer';
  const isFromClients = from === 'clients' && client;

  // 데이터 상태
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // 온보딩 상태 - 테스트용 (관리자는 항상 볼 수 있음)
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 온보딩 표시 조건
  const shouldShowOnboarding = () => {
    // URL에 onboarding=true 파라미터가 있으면 강제 표시 (테스트용)
    if (router.query.onboarding === 'true') return true;
    
    // localStorage에서 완료 여부 확인
    if (typeof window !== 'undefined') {
      const isCompleted = localStorage.getItem('onboarding_completed');
      if (isCompleted) return false;
    }
    
    // 서비스가 없는 신규 사용자만 표시
    if (['admin', 'freelancer'].includes(userRole) && services.length === 0) return true;
    
    return false;
  };

  // 서비스 로딩 완료 후 온보딩 상태 설정
  useEffect(() => {
    if (!loading) {
      const initialOnboarding = shouldShowOnboarding();
      setShowOnboarding(initialOnboarding);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← 의존성 배열을 빈 배열로 변경 (처음 한 번만 실행)

  // 선택 상태
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // 현재 작업 상태 (URL 기반)
  const [viewingService, setViewingService] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [deletingService, setDeletingService] = useState(null);

  // 모달 상태
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGeneratedServices, setAIGeneratedServices] = useState([]);
  const [shareModal, setShareModal] = useState({ isOpen: false, url: '', serviceCount: 0 });
  
  // 링크 관리 상태
  const [sharedLinks, setSharedLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);

  // 데이터 로딩
  useEffect(() => {
    fetchCategoriesAndServices();
  }, [refreshKey]);

  // URL 상태 동기화
  useEffect(() => {
    if (view === 'detail' && id && services.length > 0) {
      const service = services.find(s => s.id === parseInt(id));
      if (service && !viewingService) {
        setViewingService(normalizeService(service));
      }
    }
    
    if (view === 'edit' && id && !editingService) {
      loadServiceForEdit(id);
    }
  
    if (view === 'links') {
      fetchSharedLinks();
    }
  }, [view, id, services]);
  
  // 선택된 항목이 있을 때만 선택 모드 활성화
  useEffect(() => {
    setSelectionMode(selectedServices.length > 0);
  }, [selectedServices]);

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

  const fetchSharedLinks = async () => {
    try {
      setLinksLoading(true);
      const response = await fetch('/api/shared', { headers: getAuthHeaders() });
      
      if (response.ok) {
        const data = await response.json();
        setSharedLinks(data.links || []);
      } else {
        setSharedLinks([]);
      }
    } catch (error) {
      console.error('링크 히스토리 조회 오류:', error);
      setSharedLinks([]);
    } finally {
      setLinksLoading(false);
    }
  };

  const loadServiceForEdit = async (serviceId) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const service = await response.json();
        setEditingService(service);
      }
    } catch (error) {
      console.error('서비스 로드 실패:', error);
    }
  };

  // 네비게이션 함수들
  const navigateTo = (newView, serviceId = null) => {
    const query = { ...router.query, view: newView };
    
    if (serviceId) {
      query.id = serviceId;
    } else {
      delete query.id;
    }
    
    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });
  };

  const handleTabChange = (tabId) => {
    navigateTo(tabId);
  };

  // 이벤트 핸들러들
  const handleServiceDetail = (service) => {
    if (selectedServices.length > 0) {
      // 선택 모드일 때는 선택 토글
      handleServiceSelect(service);
    } else {
      // 일반 모드일 때는 상세보기
      setViewingService(normalizeService(service));
      navigateTo('detail', service.id);
    }
  };

  const handleServiceEdit = (service) => {
    if (selectedServices.length === 1) {
      navigateTo('edit', service.id);
    } else {
      // 다중 편집 처리 (향후 구현)
      alert('다중 편집 기능은 준비 중입니다.');
    }
  };

  const handleBackToList = () => {
    setEditingService(null);
    setViewingService(null);
    navigateTo('list');
  };

  const handleServiceCreated = () => {
    setRefreshKey(prev => prev + 1);
    navigateTo('list');
  };

  const handleServiceSaved = () => {
    setRefreshKey(prev => prev + 1);
    setEditingService(null);
    navigateTo('list');
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
        if (editingService?.id === serviceId || viewingService?.id === serviceId) {
          navigateTo('list');
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

  // 선택 관련 함수들
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

  const handleClearSelection = () => {
    setSelectedServices([]);
    setSelectionMode(false);
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
        
        if (view === 'links') {
          fetchSharedLinks();
        }
      } else {
        alert(data.error || '공유 링크 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('공유 링크 생성 오류:', error);
      alert('공유 링크 생성 중 오류가 발생했습니다');
    }
  };

  // 링크 관리 함수들
  const handleCopyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
    }
  };

  const handleDeleteSharedLink = async (linkId, linkTitle) => {
    if (!confirm(`"${linkTitle}" 링크를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/shared/${linkId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setSharedLinks(prev => prev.filter(link => link.id !== linkId));
      } else {
        alert('링크 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('링크 삭제 오류:', error);
      alert('링크 삭제 중 오류가 발생했습니다.');
    }
  };

  // AI 서비스 관련 함수들
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
    ...(view === 'detail' ? [{ 
      id: 'detail', 
      label: '서비스 상세',
      icon: <Eye size={20} />
    }] : []),
    ...(view === 'edit' ? [{ 
      id: 'edit', 
      label: '서비스 편집',
      icon: <Edit size={20} />
    }] : [])
  ];

  return (
    <div className="max-w-6xl space-y-8 pb-24">
      
      {/* 페이지 헤더 - Shepherd 타겟 */}
      <div data-shepherd-target="page-header">
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
                  <div data-shepherd-target="new-service-btn">
                    <Button
                      variant="primary"
                      onClick={() => navigateTo('create')}
                      icon={PlusIcon}
                    >
                      새 서비스 등록
                    </Button>
                  </div>
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
      </div>

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

      {/* 탭 네비게이션 */}
      <Tabs
        tabs={tabs}
        activeTab={view}
        onTabChange={handleTabChange}
      />

      {/* 탭 콘텐츠 */}
      <div className="min-h-[400px]">
        {view === 'list' && (
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
                              isSelected={isSelected}
                              onSelect={handleServiceSelect}
                              selectable={selectionMode}
                              showCheckbox={selectedServices.length > 0}
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

            {/* 일반 서비스들 - Shepherd 타겟 */}
            <div data-shepherd-target="service-list">
              {categories.map((category) => {
                const normalServices = (category.services || []).filter(service => !service.isPlan);
                if (normalServices.length === 0) return null;

                return (
                  <div key={category.id} className="space-y-6">
                    <div className="border-b border-gray-200 pb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" size="sm">일반 서비스</Badge>
                        <span className="text-sm text-gray-500">{normalServices.length}개 서비스</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {normalServices.map((service) => {
                        const normalizedService = normalizeService(service);
                        const isSelected = selectedServices.find(s => s.id === normalizedService.id);
                        
                        return (
                          <ServiceCard
                            key={normalizedService.id}
                            service={normalizedService}
                            userRole={userRole}
                            onServiceDetail={handleServiceDetail}
                            isSelected={!!isSelected}
                            onSelect={handleServiceSelect}
                            selectable={selectionMode}
                            showCheckbox={true}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 빈 상태 */}
            {categories.length === 0 && Object.keys(planGroups).length === 0 && aiGeneratedServices.length === 0 && !loading && (
              <div data-shepherd-target="service-list">
                <EmptyState
                  icon={BriefcaseIcon}
                  title="등록된 서비스가 없습니다"
                  description="새 서비스를 추가해보세요"
                  action={
                    ['admin', 'freelancer'].includes(userRole) && (
                      <div data-shepherd-target="new-service-btn">
                        <Button onClick={() => navigateTo('create')} icon={PlusIcon}>
                          첫 서비스 등록하기
                        </Button>
                      </div>
                    )
                  }
                />
              </div>
            )}
          </div>
        )}

        {view === 'create' && (
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
                  onClick={() => navigateTo('list')}
                  icon={ArrowLeft}
                >
                  서비스 목록으로 돌아가기
                </Button>
              </div>
              
              {/* 서비스 폼 - Shepherd 타겟 */}
              <div data-shepherd-target="service-form">
                <ServiceForm 
                  onSuccess={handleServiceCreated}
                />
              </div>
            </div>
          </Card>
        )}

        {view === 'detail' && viewingService && (
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

        {view === 'links' && (
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
                  onClick={() => navigateTo('list')}
                  icon={ArrowLeft}
                >
                  서비스 목록으로 돌아가기
                </Button>
              </div>
              
              {linksLoading ? (
                <div className="flex justify-center py-16">
                  <div className="text-center">
                    <LoadingSpinner size="lg" className="mx-auto mb-4" />
                    <p className="text-gray-600">링크 히스토리를 불러오는 중...</p>
                  </div>
                </div>
              ) : sharedLinks.length > 0 ? (
                <div className="space-y-4">
                  {sharedLinks.map((link) => (
                    <Card key={link.id} className="p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{link.title}</h3>
                            <Badge variant={link.isActive ? "success" : "secondary"} size="sm">
                              {link.isActive ? '활성' : '비활성'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              <Users size={14} />
                              <span>{link.serviceCount}개 서비스</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{new Date(link.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <code className="flex-1 text-sm text-gray-700 truncate">
                              {link.shareUrl}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyLink(link.shareUrl)}
                              icon={copiedLink === link.shareUrl ? CheckIcon : Copy}
                              className={copiedLink === link.shareUrl ? 'text-green-600 border-green-300' : ''}
                            >
                              {copiedLink === link.shareUrl ? '복사됨' : '복사'}
                            </Button>
                          </div>
                          
                          {link.services && link.services.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">포함된 서비스:</h4>
                              <div className="flex flex-wrap gap-2">
                                {link.services.map((service) => (
                                  <Badge key={service.id} variant="secondary" size="sm">
                                    {service.title}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-start gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(link.shareUrl, '_blank')}
                            icon={ExternalLink}
                          >
                            열기
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteSharedLink(link.id, link.title)}
                            icon={Trash2}
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <Link size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">생성된 링크가 없습니다</h3>
                  <p className="mb-6">서비스를 선택하고 공유 링크를 생성해보세요</p>
                  <Button
                    variant="outline"
                    onClick={() => navigateTo('list')}
                    icon={ArrowLeft}
                  >
                    서비스 목록으로 이동
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {view === 'edit' && editingService && (
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

      {/* 플로팅 액션바 */}
      {selectedServices.length > 0 && (
        <FloatingActionBar
        actions={[
          { 
            label: '상세', 
            onClick: () => {
              const service = selectedServices[0];
              setViewingService(normalizeService(service));
              navigateTo('detail', service.id);
            }, 
            show: selectedServices.length === 1 
          },
          { 
            label: '공유', 
            onClick: handleShareServices 
          },
          { 
            label: isFromClients ? '견적 작성' : '견적서 작성', 
            onClick: handleCreateQuote, 
            variant: 'primary' 
          }
        ]}
        onClear={handleClearSelection}
      />
      )}

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

      {/* 커스텀 온보딩 가이드 */}
      <OnboardingGuide 
        isActive={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
          setRefreshKey(prev => prev + 1);
        }}
        onSkip={() => setShowOnboarding(false)}
      />
    </div>
  );
}