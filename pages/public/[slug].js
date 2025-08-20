// pages/public/[slug].js - 공개 페이지
import React from 'react';
import Head from 'next/head';
import { prisma } from '../../lib/prisma';
import { 
  Card, 
  Button, 
  Badge, 
  EmptyState,
  StatsCard,
  CheckCircleIcon,
  StarIcon,
  ClockIcon,
  PriceIcon,
  MailIcon,
  PhoneIcon,
  GlobeIcon,
  YoutubeIcon,
  ExternalLinkIcon,
  ServiceIcon,
  PortfolioIcon
} from '../../components/ui/DesignSystem';

export default function PublicPage({ user, services, portfolio, profile }) {
  if (!user) {
    return (
      <>
        <Head>
          <title>페이지를 찾을 수 없습니다</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <EmptyState
            icon={ServiceIcon}
            title="페이지를 찾을 수 없습니다"
            description="요청하신 페이지가 존재하지 않거나 비활성화되었습니다."
            action={
              <Button variant="primary" as="a" href="/">
                홈으로 돌아가기
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const snsLinks = profile?.snsLinks ? JSON.parse(profile.snsLinks) : {};
  const totalProjects = portfolio.length;
  const activeServices = services.length;

  return (
    <>
      <Head>
        <title>{user.name} - 프로페셔널 서비스</title>
        <meta name="description" content={profile?.bio || `${user.name}의 전문 서비스를 확인하세요`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          
          {/* 프로필 헤더 */}
          <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0 shadow-2xl">
            <div className="text-center space-y-6">
              
              {/* 프로필 이미지 */}
              {profile?.profileImage && (
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
                    <img 
                      src={profile.profileImage} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              {/* 기본 정보 */}
              <div>
                <h1 className="text-4xl font-bold mb-3">{user.name}</h1>
                {profile?.title && (
                  <p className="text-xl text-blue-100 mb-4">{profile.title}</p>
                )}
                {profile?.bio && (
                  <p className="text-lg text-blue-50 leading-relaxed max-w-2xl mx-auto">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* 연락처 및 소셜 링크 */}
              <div className="flex justify-center gap-4 flex-wrap">
                {profile?.email && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    as="a" 
                    href={`mailto:${profile.email}`}
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
                    as="a" 
                    href={`tel:${profile.phone}`}
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
                    as="a" 
                    href={profile.website} 
                    target="_blank"
                    icon={GlobeIcon}
                    className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-blue-600"
                  >
                    웹사이트
                  </Button>
                )}
                {profile?.youtube && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    as="a" 
                    href={profile.youtube} 
                    target="_blank"
                    icon={YoutubeIcon}
                    className="bg-white/10 border-white/30 text-white hover:bg-white hover:text-blue-600"
                  >
                    YouTube
                  </Button>
                )}
              </div>

              {/* SNS 링크 */}
              {Object.keys(snsLinks).length > 0 && (
                <div className="flex justify-center gap-2 flex-wrap">
                  {Object.entries(snsLinks).map(([platform, link]) => (
                    <Badge key={platform} variant="secondary" className="bg-white/20 text-white border-white/30">
                      {platform}: {link}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="제공 서비스"
              value={activeServices}
              icon={ServiceIcon}
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
              icon={StarIcon}
              variant="warning"
            />
          </div>

          {/* 서비스 목록 */}
          <Card>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-blue-100 rounded-xl">
                <ServiceIcon size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">제공 서비스</h2>
                <p className="text-gray-600">전문적인 서비스를 제공합니다</p>
              </div>
            </div>
            
            {services.length > 0 ? (
              <div className="grid gap-6">
                {services.map((service) => (
                  <Card key={service.id} className="border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200" hover>
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
                            <PriceIcon size={16} className="text-emerald-600" />
                            <span className="font-semibold">가격: {service.price?.toLocaleString()}원</span>
                          </div>
                          {service.duration && (
                            <div className="flex items-center gap-2">
                              <ClockIcon size={16} className="text-blue-600" />
                              <span>기간: {service.duration}</span>
                            </div>
                          )}
                        </div>

                        {/* 주요 기능 */}
                        {service.features && Array.isArray(service.features) && service.features.length > 0 && (
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
                          as="a"
                          href={`mailto:${profile?.email || user.email}?subject=${encodeURIComponent(`${service.title} 견적 요청`)}&body=${encodeURIComponent(`안녕하세요. ${service.title} 서비스에 대한 견적을 요청드립니다.`)}`}
                          className="w-full md:w-auto min-w-[140px]"
                        >
                          견적 요청
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ServiceIcon}
                title="제공 중인 서비스가 없습니다"
                description="아직 등록된 서비스가 없습니다."
              />
            )}
          </Card>

          {/* 포트폴리오 */}
          {portfolio.length > 0 && (
            <Card>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <PortfolioIcon size={24} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">포트폴리오</h2>
                  <p className="text-gray-600">완성된 프로젝트들을 확인하세요</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolio.map((item) => (
                  <Card key={item.id} className="border-2 border-gray-200 hover:border-purple-500 hover:shadow-lg transition-all duration-200" hover>
                    
                    {/* 포트폴리오 이미지 */}
                    {item.image && (
                      <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-4">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* 포트폴리오 정보 */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 leading-relaxed mb-4">{item.description}</p>
                      
                      {/* 기술 스택 */}
                      {item.technologies && Array.isArray(item.technologies) && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {item.technologies.map((tech, index) => (
                            <Badge key={index} variant="secondary" size="sm">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* 링크 */}
                      <div className="flex gap-2">
                        {item.link && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            as="a" 
                            href={item.link} 
                            target="_blank"
                            icon={ExternalLinkIcon}
                            className="flex-1"
                          >
                            프로젝트 보기
                          </Button>
                        )}
                        {item.github && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            as="a" 
                            href={item.github} 
                            target="_blank"
                            className="flex-1"
                          >
                            GitHub
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
                {profile?.email && (
                  <Button 
                    variant="primary" 
                    size="lg"
                    as="a" 
                    href={`mailto:${profile.email}?subject=${encodeURIComponent('프로젝트 문의')}`}
                    icon={MailIcon}
                  >
                    이메일로 문의
                  </Button>
                )}
                {profile?.phone && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    as="a" 
                    href={`tel:${profile.phone}`}
                    icon={PhoneIcon}
                  >
                    전화 문의
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-gray-500 space-y-1">
                <p>✓ 무료 상담 및 견적 제공</p>
                <p>✓ 빠른 응답 보장</p>
                <p>✓ 맞춤형 솔루션 제안</p>
              </div>
            </div>
          </Card>

          {/* 푸터 */}
          <div className="text-center py-8 border-t border-gray-200">
            <p className="text-gray-500">
              © 2024 {user.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const publicPage = await prisma.publicPage.findUnique({
      where: { slug: params.slug },
      include: {
        user: {
          include: {
            profile: true,
            services: {
              where: { isActive: true },
              include: {
                category: true
              },
              orderBy: { createdAt: 'desc' }
            },
            portfolio: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!publicPage || !publicPage.isActive) {
      return { notFound: true };
    }

    // JSON 필드들을 파싱
    const processedServices = publicPage.user.services.map(service => ({
      ...service,
      features: service.features ? (typeof service.features === 'string' ? JSON.parse(service.features) : service.features) : [],
      images: service.images ? (typeof service.images === 'string' ? JSON.parse(service.images) : service.images) : []
    }));

    const processedPortfolio = publicPage.user.portfolio.map(item => ({
      ...item,
      technologies: item.technologies ? (typeof item.technologies === 'string' ? JSON.parse(item.technologies) : item.technologies) : []
    }));

    return {
      props: {
        user: {
          id: publicPage.user.id,
          name: publicPage.user.name,
          email: publicPage.user.email
        },
        services: processedServices,
        portfolio: processedPortfolio,
        profile: publicPage.user.profile
      }
    };
  } catch (error) {
    console.error('페이지 로드 실패:', error);
    return { notFound: true };
  }
}