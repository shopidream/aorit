// pages/shared/[token].js - 서비스 관리페이지와 통일화된 디자인
import React, { useState } from 'react';
import Head from 'next/head';
import { Card, Button, Badge, FloatingActionBar } from '../../components/ui/DesignSystem';
import ServiceCard from '../../components/catalog/ServiceCard';
import ServiceDetail from '../../components/services/ServiceDetail';
import { normalizeService } from '../../lib/dataTypes';
import { 
  Mail, 
  Phone, 
  Eye, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

export default function SharedServicesPage({ 
  shareData = {}, 
  services = [], 
  user = {}, 
  profile = null, 
  error: serverError 
}) {
  const [selectedServices, setSelectedServices] = useState([]);
  const [viewingService, setViewingService] = useState(null);

  if (serverError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">페이지를 찾을 수 없습니다</h1>
          <p className="text-gray-600">{serverError}</p>
        </div>
      </div>
    );
  }

  const contactEmail = profile?.contactEmail || profile?.companyEmail || user?.email;
  const contactPhone = profile?.contactPhone || profile?.companyPhone;

  const handleServiceSelect = (service) => {
    const normalizedService = normalizeService(service);
    
    if (normalizedService.isPlan) {
      // 플랜 서비스는 같은 카테고리에서 하나만 선택 가능
      setSelectedServices(prev => {
        const withoutSameCategory = prev.filter(s => !s.isPlan || s.categoryId !== normalizedService.categoryId);
        const isAlreadySelected = prev.find(s => s.id === normalizedService.id);
        return isAlreadySelected ? withoutSameCategory : [...withoutSameCategory, normalizedService];
      });
    } else {
      // 일반 서비스는 다중 선택 가능
      setSelectedServices(prev => {
        const isSelected = prev.find(s => s.id === normalizedService.id);
        return isSelected ? prev.filter(s => s.id !== normalizedService.id) : [...prev, normalizedService];
      });
    }
  };

  const handleServiceDetail = (service) => {
    setViewingService(normalizeService(service));
  };

  const handleQuoteRequest = () => {
    if (!contactEmail || selectedServices.length === 0) return;
    
    const serviceNames = selectedServices.map(s => s.title).join(', ');
    const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
    
    const subject = `${serviceNames} 견적 요청`;
    const body = `안녕하세요.\n\n다음 서비스들에 대한 견적을 요청드립니다:\n\n${selectedServices.map((s, i) => `${i+1}. ${s.title} (${s.price ? s.price.toLocaleString() + '원' : '견적 문의'})`).join('\n')}\n\n총 예상 금액: ${totalPrice.toLocaleString()}원\n\n[프로젝트 상세 내용]\n\n\n[예산 범위]\n\n\n[희망 일정]\n\n\n[추가 요청사항]\n\n`;
    
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleClearSelection = () => {
    setSelectedServices([]);
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

  // 플랜 서비스와 일반 서비스 분리
  const planGroups = services.reduce((groups, service) => {
    if (service.isPlan) {
      const groupName = service.category?.name || '미분류 플랜';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(service);
    }
    return groups;
  }, {});

  const categorizedServices = services.reduce((groups, service) => {
    if (!service.isPlan) {
      const categoryName = service.category?.name || '기타 서비스';
      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(service);
    }
    return groups;
  }, {});

  // 서비스 상세보기 - ServiceDetail 컴포넌트 재사용
  if (viewingService) {
    return (
      <>
        <Head>
          <title>{viewingService.title}</title>
        </Head>
        
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-6xl mx-auto p-6">
            <ServiceDetail
              service={viewingService}
              user={user}
              profile={profile}
              userRole="customer"
              onBack={() => setViewingService(null)}
            />
            
            {/* 고객용 서비스 선택 CTA */}
            <Card className="mt-8 bg-blue-50 border-blue-200 text-center p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                이 서비스를 선택하시겠습니까?
              </h3>
              <p className="text-gray-600 mb-6">
                선택하신 서비스는 견적 요청 목록에 추가됩니다.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setViewingService(null)}
                  icon={ArrowLeft}
                >
                  목록으로 돌아가기
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    handleServiceSelect(viewingService);
                    setViewingService(null);
                  }}
                  icon={CheckCircle}
                >
                  이 서비스 선택하기
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{shareData?.title || '서비스 소개'}</title>
        <meta name="description" content={shareData?.description || ''} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        <meta property="og:title" content={shareData?.title || '서비스 소개'} />
        <meta property="og:description" content={shareData?.description || ''} />
        <meta property="og:type" content="website" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareData?.title || '서비스 소개'} />
        <meta name="twitter:description" content={shareData?.description || ''} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6 space-y-8 pb-24">
          
          {/* 헤더 */}
          <div className="text-center py-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {profile?.companyName || user?.name || '서비스'}
            </h1>
            
            {shareData?.description && (
              <p className="text-xl text-gray-600 leading-relaxed mb-6 max-w-2xl mx-auto">
                {shareData.description}
              </p>
            )}
            
            {(contactEmail || contactPhone) && (
              <div className="flex justify-center gap-6">
                {contactEmail && (
                  <a 
                    href={`mailto:${contactEmail}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Mail size={18} />
                    {contactEmail}
                  </a>
                )}
                {contactPhone && (
                  <a 
                    href={`tel:${contactPhone}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Phone size={18} />
                    {contactPhone}
                  </a>
                )}
              </div>
            )}
          </div>



          {/* 플랜 서비스들 */}
          {Object.keys(planGroups).length > 0 && (
            <div className="space-y-8">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">플랜 서비스</h2>
                <p className="text-gray-600">각 카테고리에서 하나씩 선택하실 수 있습니다</p>
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
                            userRole="customer"
                            onServiceDetail={handleServiceDetail}
                            isSelected={isSelected}
                            onSelect={handleServiceSelect}
                            showCheckbox={true}
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
          {Object.keys(categorizedServices).map((categoryName) => {
            const categoryServices = categorizedServices[categoryName];
            if (categoryServices.length === 0) return null;

            return (
              <div key={categoryName} className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">{categoryName}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" size="sm">일반 서비스</Badge>
                    <span className="text-sm text-gray-500">{categoryServices.length}개 서비스</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {categoryServices.map((service) => {
                    const normalizedService = normalizeService(service);
                    const isSelected = selectedServices.find(s => s.id === normalizedService.id);
                    
                    return (
                      <ServiceCard
                        key={normalizedService.id}
                        service={normalizedService}
                        userRole="customer"
                        onServiceDetail={handleServiceDetail}
                        isSelected={!!isSelected}
                        onSelect={handleServiceSelect}
                        showCheckbox={true}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 빈 상태 */}
          {services.length === 0 && (
            <Card className="text-center py-16">
              <div className="mx-auto mb-6 p-4 bg-gray-100 rounded-full w-fit">
                <Eye size={48} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">등록된 서비스가 없습니다</h3>
              <p className="text-gray-600 max-w-sm mx-auto leading-relaxed">
                현재 공유할 수 있는 서비스가 없습니다.
              </p>
            </Card>
          )}

          {/* 푸터 */}
          <div className="text-center py-8 text-gray-500 border-t">
            <p className="text-sm">
              © 2024 {profile?.companyName || user?.name || 'Company'}
            </p>
          </div>
        </div>

        {/* 플로팅 액션바 - 서비스 관리페이지와 동일한 스타일 */}
        {selectedServices.length > 0 && (
          <FloatingActionBar
            selectedCount={selectedServices.length}
            onQuote={handleQuoteRequest}
            onClear={handleClearSelection}
            isFromClients={false}
            quoteButtonText="견적 요청하기"
          />
        )}
      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const { token } = params;

  try {
    console.log('=== 공유 페이지 로드 시작 ===');
    console.log('Token:', token);

    const { prisma } = require('../../lib/prisma');
    
    const sharedService = await prisma.sharedService.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        services: {
          where: { isActive: true },
          include: {
            category: true
          }
        }
      }
    });

    if (!sharedService) {
      return {
        props: {
          error: '페이지를 찾을 수 없습니다'
        }
      };
    }

    const processedServices = sharedService.services.map(service => ({
      ...service,
      createdAt: service.createdAt.toISOString(),
      category: service.category ? {
        ...service.category,
        createdAt: service.category.createdAt.toISOString()
      } : null
    }));

    return {
      props: {
        shareData: {
          title: sharedService.title,
          description: sharedService.description
        },
        services: processedServices,
        user: {
          name: sharedService.user.name,
          email: sharedService.user.email
        },
        profile: sharedService.user.profile
      }
    };

  } catch (error) {
    console.error('공유 페이지 로드 실패:', error);
    return {
      props: {
        error: '데이터 로드 실패'
      }
    };
  }
}