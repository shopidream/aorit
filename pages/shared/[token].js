// pages/shared/[token].js - ServiceDetail 컴포넌트 재사용
import React, { useState } from 'react';
import Head from 'next/head';
import { Card, Button } from '../../components/ui/DesignSystem';
import ServiceDetail from '../../components/services/ServiceDetail';
import { 
  Mail, 
  Phone, 
  Eye, 
  CheckCircle
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
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s.id === service.id);
      return isSelected 
        ? prev.filter(s => s.id !== service.id) 
        : [...prev, service];
    });
  };

  const handleServiceDetail = (service) => {
    setViewingService(service);
  };

  const handleQuoteRequest = () => {
    if (!contactEmail || selectedServices.length === 0) return;
    
    const serviceNames = selectedServices.map(s => s.title).join(', ');
    const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
    
    const subject = `${serviceNames} 견적 요청`;
    const body = `안녕하세요.\n\n다음 서비스들에 대한 견적을 요청드립니다:\n\n${selectedServices.map((s, i) => `${i+1}. ${s.title} (${s.price ? s.price.toLocaleString() + '원' : '견적 문의'})`).join('\n')}\n\n총 예상 금액: ${totalPrice.toLocaleString()}원\n\n[프로젝트 상세 내용]\n\n\n[예산 범위]\n\n\n[희망 일정]\n\n\n[추가 요청사항]\n\n`;
    
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

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
              userRole="customer" // 고객용이므로 편집/삭제 버튼 숨김
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
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  setSelectedServices([viewingService]);
                  setViewingService(null);
                }}
              >
                이 서비스 선택하기
              </Button>
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
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          
          {/* 헤더 */}
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {profile?.companyName || user?.name || '서비스'}
            </h1>
            
            {(contactEmail || contactPhone) && (
              <div className="flex justify-center gap-4">
                {contactEmail && (
                  <a 
                    href={`mailto:${contactEmail}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <Mail size={18} />
                    {contactEmail}
                  </a>
                )}
                {contactPhone && (
                  <a 
                    href={`tel:${contactPhone}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <Phone size={18} />
                    {contactPhone}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 선택된 서비스 상태 */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {selectedServices.length > 0 
                  ? `선택: ${selectedServices.length}개 (${totalPrice.toLocaleString()}원)`
                  : '서비스를 선택하세요'
                }
              </span>
              <Button 
                size="sm"
                onClick={handleQuoteRequest} 
                disabled={selectedServices.length === 0 || !contactEmail}
                variant="primary"
              >
                견적 요청하기
              </Button>
            </div>
          </Card>

          {/* 서비스 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => {
              let images = [];
              let features = [];
              
              try {
                images = service.images && service.images !== '' 
                  ? (typeof service.images === 'string' ? JSON.parse(service.images) : service.images)
                  : [];
              } catch (e) {
                images = [];
              }
              
              try {
                features = service.features && service.features !== ''
                  ? (typeof service.features === 'string' ? JSON.parse(service.features) : service.features)
                  : [];
              } catch (e) {
                features = [];
              }

              const isSelected = selectedServices.find(s => s.id === service.id);
              
              return (
                <Card 
                  key={service.id} 
                  className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer relative ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleServiceSelect(service)}
                >
                  
                  {/* 선택 표시 */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="p-1 bg-blue-600 rounded-full">
                        <CheckCircle size={16} className="text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* 서비스 이미지 */}
                  {images.length > 0 && (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img 
                        src={images[0]} 
                        alt={service.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    {/* 제목과 가격 */}
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                      <div className="text-2xl font-bold text-blue-600">
                        {service.price ? `${service.price.toLocaleString()}원` : '견적 문의'}
                      </div>
                      {service.duration && (
                        <div className="text-sm text-gray-500 mt-1">
                          예상 기간: {service.duration}
                        </div>
                      )}
                    </div>

                    {/* 설명 */}
                    <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
                      {service.description}
                    </p>

                    {/* 주요 기능 */}
                    {features.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">주요 기능</h4>
                        <ul className="space-y-1">
                          {features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-2 flex-shrink-0"></div>
                              <span className="line-clamp-1">{feature}</span>
                            </li>
                          ))}
                          {features.length > 3 && (
                            <li className="text-sm text-gray-500 pl-3.5">
                              +{features.length - 3}개 기능 더
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* 상세보기 버튼 */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceDetail(service);
                      }}
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      className="w-full"
                    >
                      상세보기
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* 푸터 */}
          <div className="text-center py-8 text-gray-500 border-t">
            <p className="text-sm">
              © 2024 {profile?.companyName || user?.name || 'Company'}
            </p>
          </div>
        </div>
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