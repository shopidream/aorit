// components/public/PreviewMode.js - 실제 공개 페이지 스타일 미리보기
import React from 'react';
import { Button, Card, Badge, StatsCard } from '../ui/DesignSystem';
import { 
  BriefcaseIcon, 
  CheckCircleIcon, 
  UsersIcon,
  MailIcon,
  PhoneIcon,
  GlobeIcon,
  ExternalLinkIcon
} from '../ui/DesignSystem';

export default function PreviewMode({ user, services, portfolio, profile, pageData }) {
  const snsLinks = profile?.snsLinks ? JSON.parse(profile.snsLinks) : {};
  const totalProjects = portfolio?.length || 0;
  const activeServices = services?.length || 0;

  if (!pageData?.isActive) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 mb-4">📄</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">페이지가 비활성화됨</h3>
          <p className="text-gray-500">페이지를 활성화하면 미리보기를 확인할 수 있습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[600px]">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* 프로필 헤더 */}
        <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0">
          <div className="text-center space-y-6">
            
            {/* 기본 정보 */}
            <div>
              <h1 className="text-4xl font-bold mb-3">{user?.name || '사용자명'}</h1>
              {profile?.title && (
                <p className="text-xl text-blue-100 mb-4">{profile.title}</p>
              )}
              {profile?.bio && (
                <p className="text-lg text-blue-50 leading-relaxed max-w-2xl mx-auto">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* 연락처 버튼 */}
            <div className="flex justify-center gap-4 flex-wrap">
              {profile?.email && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={MailIcon}
                  className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-blue-600"
                >
                  이메일
                </Button>
              )}
              {profile?.phone && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={PhoneIcon}
                  className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-blue-600"
                >
                  전화
                </Button>
              )}
              {profile?.website && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={GlobeIcon}
                  className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-blue-600"
                >
                  웹사이트
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="제공 서비스"
            value={activeServices}
            icon={BriefcaseIcon}
            variant="primary"
          />
          <StatsCard
            title="완료 프로젝트"
            value={totalProjects}
            icon={CheckCircleIcon}
            variant="success"
          />
          <StatsCard
            title="평균 만족도"
            value="4.9/5.0"
            icon={UsersIcon}
            variant="warning"
          />
        </div>

        {/* 서비스 목록 */}
        <Card>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-100 rounded-xl">
              <BriefcaseIcon size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">제공 서비스</h2>
              <p className="text-gray-600">전문적인 서비스를 제공합니다</p>
            </div>
          </div>
          
          {services && services.length > 0 ? (
            <div className="grid gap-6">
              {services.slice(0, 3).map((service) => (
                <Card key={service.id} className="border-2 border-gray-200 hover:border-blue-500 transition-all duration-200" hover>
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    
                    {/* 서비스 정보 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h3>
                          <Badge variant="primary" className="text-sm">
                            {service.category?.name || '미분류'}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed mb-4">{service.description}</p>
                      
                      {/* 서비스 특징 */}
                      <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">가격: {service.price?.toLocaleString()}원</span>
                        </div>
                        {service.duration && (
                          <div className="flex items-center gap-2">
                            <span>기간: {service.duration}</span>
                          </div>
                        )}
                      </div>

                      {/* 주요 기능 */}
                      {service.features && service.features.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">주요 기능</h4>
                          <div className="flex flex-wrap gap-2">
                            {service.features.slice(0, 3).map((feature, index) => (
                              <Badge key={index} variant="secondary" size="sm">
                                {feature}
                              </Badge>
                            ))}
                            {service.features.length > 3 && (
                              <Badge variant="secondary" size="sm">
                                +{service.features.length - 3}개 더
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 견적 요청 버튼 */}
                    <div className="flex-shrink-0">
                      <Button 
                        variant="primary" 
                        size="lg"
                        className="w-full md:w-auto min-w-[140px]"
                      >
                        견적 요청
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {services.length > 3 && (
                <div className="text-center py-4">
                  <p className="text-gray-600">
                    총 {services.length}개 서비스 중 3개 표시
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BriefcaseIcon size={48} className="mx-auto mb-4 text-gray-300" />
              <p>제공 중인 서비스가 없습니다</p>
              <p className="text-sm mt-2">서비스를 등록하고 공개 설정을 활성화하세요</p>
            </div>
          )}
        </Card>

        {/* 포트폴리오 */}
        {portfolio && portfolio.length > 0 && (
          <Card>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-purple-100 rounded-xl">
                <CheckCircleIcon size={24} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">포트폴리오</h2>
                <p className="text-gray-600">완성된 프로젝트들을 확인하세요</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.slice(0, 6).map((item) => (
                <Card key={item.id} className="border-2 border-gray-200 hover:border-purple-500 transition-all duration-200" hover>
                  
                  {/* 포트폴리오 이미지 */}
                  {item.imageUrl && (
                    <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-4">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* 포트폴리오 정보 */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-4">{item.description}</p>
                    
                    {/* 링크 */}
                    <div className="flex gap-2">
                      {item.link && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          icon={ExternalLinkIcon}
                          className="flex-1"
                        >
                          프로젝트 보기
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* 연락처 */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">프로젝트 문의</h2>
              <p className="text-xl text-gray-600">전문적인 서비스로 도움드리겠습니다</p>
            </div>
            
            <div className="flex justify-center gap-4 flex-wrap">
              <Button 
                variant="primary" 
                size="lg"
                icon={MailIcon}
              >
                이메일로 문의
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                icon={PhoneIcon}
              >
                전화 문의
              </Button>
            </div>
            
            <div className="text-sm text-gray-500 space-y-1">
              <p>✓ 무료 상담 및 견적 제공</p>
              <p>✓ 빠른 응답 보장</p>
              <p>✓ 맞춤형 솔루션 제안</p>
            </div>
          </div>
        </Card>

        {/* 페이지 URL 표시 */}
        {pageData?.slug && (
          <div className="text-center py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              공개 주소: <span className="font-mono text-blue-600">yoursite.com/public/{pageData.slug}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}