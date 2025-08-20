// src/pages/PublicService.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EstimateRequest from '../components/estimate/EstimateRequest';
import DigitalCard from '../components/profile/DigitalCard';
import { 
  designSystem, 
  getButtonStyles, 
  getServiceCardStyles,
  getTabStyles,
  getBadgeStyles
} from '../styles/designSystem';

const PublicService = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  
  const [freelancerData, setFreelancerData] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('services');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFreelancerData();
  }, [username]);

  const loadFreelancerData = async () => {
    try {
      setLoading(true);
      
      // TODO: API 호출로 대체
      const mockData = {
        profile: {
          basic: {
            name: '김프리',
            title: 'UI/UX 디자이너',
            company: '프리랜서',
            bio: '사용자 중심의 디자인으로 비즈니스 가치를 창출하는 디자이너입니다.',
            expertise: 'UI/UX 디자인, 브랜딩, 웹디자인, 모바일 앱 디자인',
            profileImage: '/api/placeholder/150/150'
          },
          contact: {
            email: 'designer@example.com',
            phone: '010-1234-5678',
            website: 'https://portfolio.example.com'
          },
          social: {
            behance: 'https://behance.net/designer',
            instagram: 'https://instagram.com/designer'
          },
          portfolio: {
            completedProjects: 127,
            satisfactionRate: 98,
            experience: 5,
            achievements: '• 2023 굿디자인어워드 수상\n• 네이버 D2SF 프로젝트 참여\n• 100+ 프로젝트 성공 완료'
          }
        },
        services: [
          {
            id: 'ui-design',
            name: 'UI 디자인',
            category: 'design',
            price: 500000,
            description: '사용자 인터페이스 디자인 서비스',
            features: ['와이어프레임 제작', '프로토타입 제작', '디자인 시스템', '반응형 디자인'],
            duration: '5-7일',
            revisions: 3
          },
          {
            id: 'ux-research',
            name: 'UX 리서치',
            category: 'research',
            price: 300000,
            description: '사용자 경험 분석 및 개선 방안 제시',
            features: ['사용자 인터뷰', '경쟁사 분석', 'UX 감사', '개선안 제시'],
            duration: '3-5일',
            revisions: 2
          },
          {
            id: 'branding',
            name: '브랜드 디자인',
            category: 'branding',
            price: 800000,
            description: '브랜드 아이덴티티 디자인',
            features: ['로고 디자인', '브랜드 가이드라인', '명함/편지지', '패키지 디자인'],
            duration: '7-10일',
            revisions: 5
          }
        ],
        reviews: [
          {
            id: 1,
            clientName: '홍길동',
            company: '스타트업 A',
            rating: 5,
            comment: '정말 만족스러운 결과물이었습니다. 커뮤니케이션도 원활하고 일정도 정확히 지켜주셨어요.',
            project: 'UI 디자인',
            date: '2024-01-15'
          },
          {
            id: 2,
            clientName: '이영희',
            company: '기업 B',
            rating: 5,
            comment: '전문적인 접근과 창의적인 아이디어로 기대 이상의 결과를 얻었습니다.',
            project: '브랜드 디자인',
            date: '2024-01-10'
          }
        ],
        settings: {
          theme: 'modern',
          primaryColor: '#4F46E5',
          isPublic: true,
          allowDirectContract: true
        }
      };
      
      setFreelancerData(mockData);
      setAvailableServices(mockData.services);
      
    } catch (err) {
      setError('프로필을 불러오는데 실패했습니다.');
      console.error('Error loading freelancer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateComplete = (estimateData) => {
    console.log('견적 완료:', estimateData);
    navigate(`/estimate/${estimateData.estimate.id}`);
  };

  const handleDirectContract = (service) => {
    console.log('바로 계약:', service);
    navigate(`/contract/create`, { 
      state: { 
        service, 
        freelancer: freelancerData.profile 
      } 
    });
  };

  if (loading) {
    return (
      <div className={`${designSystem.layout.container} ${designSystem.layout.flexCol} items-center justify-center min-h-screen`}>
        <div className={`w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4`}></div>
        <p className={designSystem.typography.body}>프로필을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${designSystem.layout.container} ${designSystem.layout.flexCol} items-center justify-center min-h-screen`}>
        <div className={`${designSystem.colors.status.error} p-8 rounded-2xl text-center`}>
          <h2 className={designSystem.typography.h2}>오류가 발생했습니다</h2>
          <p className={`${designSystem.typography.body} mb-6`}>{error}</p>
          <button 
            onClick={loadFreelancerData} 
            className={getButtonStyles('primary')}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!freelancerData) {
    return (
      <div className={`${designSystem.layout.container} ${designSystem.layout.flexCol} items-center justify-center min-h-screen`}>
        <div className={`${designSystem.form.fieldset} text-center`}>
          <h2 className={designSystem.typography.h2}>프로필을 찾을 수 없습니다</h2>
          <p className={designSystem.typography.body}>존재하지 않는 사용자이거나 비공개 프로필입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className={`${designSystem.gradients.primary} text-white`}>
        <div className={`${designSystem.layout.container} py-16`}>
          <div className={`${designSystem.layout.flexRow} justify-between items-start`}>
            <div className={designSystem.layout.flexRow}>
              {freelancerData.profile.basic.profileImage && (
                <img 
                  src={freelancerData.profile.basic.profileImage} 
                  alt="Profile" 
                  className={designSystem.profile.avatarLarge}
                />
              )}
              <div className={designSystem.layout.flexCol}>
                <h1 className={`${designSystem.typography.h1} text-white mb-2`}>
                  {freelancerData.profile.basic.name}
                </h1>
                <p className={`${designSystem.typography.h4} text-violet-100 mb-4`}>
                  {freelancerData.profile.basic.title}
                </p>
                <p className={`${designSystem.typography.body} text-violet-50 max-w-2xl`}>
                  {freelancerData.profile.basic.bio}
                </p>
              </div>
            </div>
            
            <div className={`${designSystem.layout.flexRow} gap-8`}>
              <div className={designSystem.profile.statCard}>
                <div className={`${designSystem.typography.h2} text-violet-600`}>
                  {freelancerData.profile.portfolio.completedProjects}
                </div>
                <div className={designSystem.typography.bodySmall}>완료 프로젝트</div>
              </div>
              <div className={designSystem.profile.statCard}>
                <div className={`${designSystem.typography.h2} text-violet-600`}>
                  {freelancerData.profile.portfolio.satisfactionRate}%
                </div>
                <div className={designSystem.typography.bodySmall}>만족도</div>
              </div>
              <div className={designSystem.profile.statCard}>
                <div className={`${designSystem.typography.h2} text-violet-600`}>
                  {freelancerData.profile.portfolio.experience}년
                </div>
                <div className={designSystem.typography.bodySmall}>경력</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 네비게이션 */}
      <nav className={`bg-white border-b border-gray-200 sticky top-0 z-10`}>
        <div className={designSystem.layout.container}>
          <div className={designSystem.tabs.list}>
            <button 
              onClick={() => setCurrentView('services')}
              className={getTabStyles(currentView === 'services')}
            >
              서비스
            </button>
            <button 
              onClick={() => setCurrentView('estimate')}
              className={getTabStyles(currentView === 'estimate')}
            >
              견적 요청
            </button>
            <button 
              onClick={() => setCurrentView('profile')}
              className={getTabStyles(currentView === 'profile')}
            >
              프로필
            </button>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className={`${designSystem.layout.container} py-12`}>
        {currentView === 'services' && (
          <ServicesView 
            services={availableServices}
            onEstimateRequest={() => setCurrentView('estimate')}
            onDirectContract={handleDirectContract}
          />
        )}
        
        {currentView === 'estimate' && (
          <div className={designSystem.layout.spacingSection}>
            <div className={`${designSystem.layout.flexRow} justify-between items-center mb-8`}>
              <h2 className={designSystem.typography.h2}>견적 요청</h2>
              <div className={getBadgeStyles('primary')}>
                무료 견적
              </div>
            </div>
            <EstimateRequest 
              availableServices={availableServices}
              onEstimateComplete={handleEstimateComplete}
            />
          </div>
        )}
        
        {currentView === 'profile' && (
          <ProfileView 
            profileData={freelancerData.profile}
            reviews={freelancerData.reviews}
          />
        )}
      </main>

      {/* 푸터 */}
      <footer className={`bg-gray-900 text-white py-16`}>
        <div className={designSystem.layout.container}>
          <div className={`${designSystem.layout.grid} md:grid-cols-3`}>
            <div>
              <h4 className={`${designSystem.typography.h4} text-white mb-4`}>연락처</h4>
              <div className={designSystem.layout.flexCol}>
                <p className={`${designSystem.typography.body} text-gray-300`}>
                  📧 {freelancerData.profile.contact.email}
                </p>
                <p className={`${designSystem.typography.body} text-gray-300`}>
                  📞 {freelancerData.profile.contact.phone}
                </p>
                {freelancerData.profile.contact.website && (
                  <a 
                    href={freelancerData.profile.contact.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${designSystem.typography.body} text-violet-400 hover:text-violet-300 ${designSystem.transitions.fast}`}
                  >
                    🌐 포트폴리오 보기
                  </a>
                )}
              </div>
            </div>
            
            <div>
              <h4 className={`${designSystem.typography.h4} text-white mb-4`}>SNS</h4>
              <div className={designSystem.layout.flexCol}>
                {freelancerData.profile.social.behance && (
                  <a 
                    href={freelancerData.profile.social.behance} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${designSystem.typography.body} text-gray-300 hover:text-white ${designSystem.transitions.fast}`}
                  >
                    🎨 Behance
                  </a>
                )}
                {freelancerData.profile.social.instagram && (
                  <a 
                    href={freelancerData.profile.social.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${designSystem.typography.body} text-gray-300 hover:text-white ${designSystem.transitions.fast}`}
                  >
                    📸 Instagram
                  </a>
                )}
              </div>
            </div>

            <div>
              <h4 className={`${designSystem.typography.h4} text-white mb-4`}>전문 분야</h4>
              <div className={`${designSystem.layout.flexRow} flex-wrap gap-2`}>
                {freelancerData.profile.basic.expertise?.split(',').map((skill, index) => (
                  <span 
                    key={index} 
                    className={`${getBadgeStyles('default')} bg-gray-800 text-gray-300`}
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// 서비스 목록 뷰
const ServicesView = ({ services, onEstimateRequest, onDirectContract }) => {
  const groupedServices = services.reduce((groups, service) => {
    const category = service.category || 'other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(service);
    return groups;
  }, {});

  return (
    <div className={designSystem.layout.spacingSection}>
      <div className={`${designSystem.layout.flexRow} justify-between items-center mb-8`}>
        <h2 className={designSystem.typography.h2}>제공 서비스</h2>
        <button 
          onClick={onEstimateRequest} 
          className={getButtonStyles('primary', 'lg')}
        >
          견적 요청하기
        </button>
      </div>

      {Object.entries(groupedServices).map(([category, categoryServices]) => (
        <div key={category} className={designSystem.layout.spacingSection}>
          <h3 className={`${designSystem.typography.h3} mb-6`}>
            {getCategoryDisplayName(category)}
          </h3>
          
          <div className={`${designSystem.layout.grid} md:grid-cols-2 lg:grid-cols-3`}>
            {categoryServices.map((service) => (
              <div 
                key={service.id} 
                className={`${getServiceCardStyles()} ${designSystem.layout.spacingCard}`}
              >
                <div className={`${designSystem.layout.flexRow} justify-between items-start mb-4`}>
                  <h4 className={designSystem.typography.h4}>{service.name}</h4>
                  <div className={getBadgeStyles('primary')}>
                    {new Intl.NumberFormat('ko-KR').format(service.price)}원
                  </div>
                </div>
                
                <p className={`${designSystem.typography.body} mb-6`}>
                  {service.description}
                </p>
                
                <div className={`${designSystem.layout.flexRow} justify-between text-sm mb-4`}>
                  <div className={designSystem.typography.bodySmall}>
                    <span className="font-medium">소요 기간:</span> {service.duration}
                  </div>
                  <div className={designSystem.typography.bodySmall}>
                    <span className="font-medium">수정:</span> {service.revisions}회
                  </div>
                </div>
                
                {service.features && (
                  <div className="mb-6">
                    <h5 className={`${designSystem.typography.h5} mb-2`}>포함 사항:</h5>
                    <ul className={designSystem.layout.spacingCard}>
                      {service.features.map((feature, index) => (
                        <li key={index} className={`${designSystem.typography.bodySmall} flex items-start`}>
                          <span className="text-violet-600 mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className={`${designSystem.layout.flexRow} gap-3`}>
                  <button 
                    onClick={() => onDirectContract(service)}
                    className={getButtonStyles('primary', 'sm')}
                  >
                    바로 계약
                  </button>
                  <button 
                    onClick={onEstimateRequest}
                    className={getButtonStyles('outline', 'sm')}
                  >
                    견적에 추가
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// 프로필 상세 뷰
const ProfileView = ({ profileData, reviews }) => {
  return (
    <div className={designSystem.layout.spacingSection}>
      {/* 기본 정보 */}
      <div className={`${designSystem.form.fieldset} mb-8`}>
        <h3 className={`${designSystem.typography.h3} mb-6`}>프로필</h3>
        <div className={designSystem.layout.formGrid}>
          <div>
            <h4 className={designSystem.typography.h4}>기본 정보</h4>
            <div className={designSystem.layout.spacingCard}>
              <p className={designSystem.typography.body}>
                <strong>이름:</strong> {profileData.basic.name}
              </p>
              <p className={designSystem.typography.body}>
                <strong>직책:</strong> {profileData.basic.title}
              </p>
              <p className={designSystem.typography.body}>
                <strong>회사:</strong> {profileData.basic.company}
              </p>
            </div>
          </div>
          <div>
            <h4 className={designSystem.typography.h4}>연락처</h4>
            <div className={designSystem.layout.spacingCard}>
              <p className={designSystem.typography.body}>
                <strong>이메일:</strong> {profileData.contact.email}
              </p>
              <p className={designSystem.typography.body}>
                <strong>전화:</strong> {profileData.contact.phone}
              </p>
              {profileData.contact.website && (
                <p className={designSystem.typography.body}>
                  <strong>웹사이트:</strong> 
                  <a 
                    href={profileData.contact.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${designSystem.colors.primary.text} hover:underline ml-1`}
                  >
                    {profileData.contact.website}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 전문 분야 */}
      <div className={`${designSystem.form.fieldset} mb-8`}>
        <h3 className={`${designSystem.typography.h3} mb-6`}>전문 분야</h3>
        <div className={`${designSystem.layout.flexRow} flex-wrap gap-3`}>
          {profileData.basic.expertise?.split(',').map((skill, index) => (
            <span 
              key={index} 
              className={getBadgeStyles('secondary')}
            >
              {skill.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* 주요 성과 */}
      <div className={`${designSystem.form.fieldset} mb-8`}>
        <h3 className={`${designSystem.typography.h3} mb-6`}>주요 성과</h3>
        <div className={designSystem.layout.spacingCard}>
          {profileData.portfolio.achievements?.split('\n').map((achievement, index) => (
            <div key={index} className={`${designSystem.typography.body} flex items-start`}>
              <span className="text-emerald-600 mr-2">✓</span>
              {achievement}
            </div>
          ))}
        </div>
      </div>

      {/* 고객 후기 */}
      <div className={designSystem.form.fieldset}>
        <h3 className={`${designSystem.typography.h3} mb-6`}>고객 후기</h3>
        {reviews && reviews.length > 0 ? (
          <div className={designSystem.layout.grid}>
            {reviews.map((review) => (
              <div key={review.id} className={`${getServiceCardStyles()} ${designSystem.layout.spacingCard}`}>
                <div className={`${designSystem.layout.flexRow} justify-between items-start mb-4`}>
                  <div>
                    <h4 className={designSystem.typography.h4}>{review.clientName}</h4>
                    <p className={designSystem.typography.bodySmall}>{review.company}</p>
                  </div>
                  <div className={designSystem.layout.flexRow}>
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                </div>
                
                <p className={`${designSystem.typography.body} mb-4 italic`}>
                  "{review.comment}"
                </p>
                
                <div className={`${designSystem.layout.flexRow} justify-between text-sm border-t pt-4`}>
                  <span className={getBadgeStyles('default')}>
                    {review.project}
                  </span>
                  <span className={designSystem.typography.bodySmall}>
                    {review.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${designSystem.colors.neutral.text} text-center py-8`}>
            <p className={designSystem.typography.body}>아직 등록된 후기가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 카테고리 표시명 변환
function getCategoryDisplayName(category) {
  const categoryNames = {
    'design': '디자인',
    'development': '개발',
    'marketing': '마케팅',
    'consulting': '컨설팅',
    'research': '리서치',
    'branding': '브랜딩',
    'other': '기타'
  };
  
  return categoryNames[category] || category;
}

export default PublicService;