// components/onboarding/CustomOnboardingGuide.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button, Card, Input, Textarea } from '../ui/DesignSystem';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles,
  User,
  FileText,
  ScrollText,
  X,
  PlusIcon,
  Copy,
  Bot,
  Zap,
  Settings,
  Upload,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';

const CustomOnboardingGuide = ({ 
  isActive = false, 
  onComplete = () => {}, 
  onSkip = () => {} 
}) => {
  const router = useRouter();
  const { getAuthHeaders } = useAuthContext();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    service: null,
    client: null,
    quote: null,
    contract: null
  });
  const [categories, setCategories] = useState([]);

  // 서비스 폼 데이터 (실제 ServiceForm과 동일)
  const [serviceFormData, setServiceFormData] = useState({
    categoryId: '',
    title: '',
    description: '',
    price: 0,
    duration: '',
    images: [],
    features: [],
    isActive: true,
    isPlan: false
  });

  // 고객 폼 데이터 (실제 ClientForm과 동일)
  const [clientFormData, setClientFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    businessNumber: '',
    companyAddress: '',
    companyPhone: '',
    websiteUrl: '',
    memo: ''
  });

  // 견적서 폼 데이터
  const [quoteFormData, setQuoteFormData] = useState({
    contractRate: 50,
    middleRate: 0,
    finalRate: 50,
    deliveryDays: 30,
    inspectionDays: 7,
    discountType: 'none',
    discountValue: 0
  });

  // 온보딩 단계 정의
  const steps = [
    {
      id: 'welcome',
      title: '환영합니다! 👋',
      description: '지금 하고 있는 서비스를 등록하고, 고객과 손쉽게 소통하는 과정을 체험해보세요.'
    },
    {
      id: 'service-intro',
      title: '1단계: 서비스 등록',
      description: '현재 하고 계신 서비스를 등록하세요. AI에게 간단히 설명만 해도 자동으로 폼이 채워집니다.'
    },
    {
      id: 'service-form',
      title: '서비스 등록 폼',
      description: '내 서비스가 온라인 페이지로 손쉽게 만들어집니다.',
      showModal: 'service'
    },
    {
      id: 'client-intro',
      title: '2단계: 고객 등록',
      description: '서비스가 준비되었으니, 이제 고객을 등록하고 견적서를 만들어볼 수 있습니다.'
    },
    {
      id: 'client-form',
      title: '고객 등록 폼',
      description: '고객 등록폼에 견적서나 계약서 링크를 보낼 고객을 등록하세요.',
      showModal: 'client'
    },
    {
      id: 'quote-intro',
      title: '3단계: 견적서 생성',
      description: '서비스와 고객이 등록되면 견적서를 생성할 수 있습니다',
      showFloatingBar: true,
      highlightButton: '견적서 생성'
    },
    {
      id: 'quote-form',
      title: '견적서 작성 폼',
      description: '견적서는 지급방식과 할인을 적용할 수 있어요.',
      showModal: 'quote'
    },
    {
      id: 'contract-intro',
      title: '4단계: 계약서 생성 방법',
      description: '견적서를 선택한 후 클릭 몇 번으로 계약서를 만들 수 있습니다.',
      showFloatingBar: true,
      highlightButton: '계약서 작성'
    },
    {
      id: 'contract-clauses',
      title: '계약서 생성',
      description: '생성 방식과 계약서 상세도를 선택하고 일반적인 계약서는 템플릿을, 특수한 계약서는 AI제작을 선택하세요.',
      showModal: 'contract-clauses'
    },
    {
      id: 'contract-result',
      title: '계약서 생성 완료',
      description: '전문적인 계약서가 생성되었습니다',
      showModal: 'contract-result'
    },
    {
      id: 'signature',
      title: '전자서명',
      description: '계약서 하단의 서명란에서 서명을 진행합니다',
      showModal: 'signature'
    },
    {
      id: 'link-copy',
      title: '링크 복사',
      description: '생성된 계약서 링크를 복사해서 고객에게 보낼 수 있습니다',
      highlightButton: '링크 복사'
    },
    {
      id: 'finish',
      title: '모든 과정 완료! 🎉',
      description: '축하합니다! 서비스 등록부터 계약 서명까지 모든 과정을 완료했습니다!'
    }
  ];

  // 현재 단계 가져오기
  const getCurrentStep = () => steps[currentStep];

  // 카테고리 로드
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setCategories(data || []);
      
      // 기본 카테고리가 있으면 선택
      if (data && data.length > 0) {
        setServiceFormData(prev => ({ ...prev, categoryId: data[0].id }));
      }
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    if (isActive) {
      fetchCategories();
    }
  }, [isActive]);

  // 타이핑 애니메이션
  const typeText = async (setter, field, text, speed = 50) => {
    for (let i = 0; i <= text.length; i++) {
      setter(prev => ({ ...prev, [field]: text.substring(0, i) }));
      await new Promise(resolve => setTimeout(resolve, speed));
    }
  };

  // 서비스 폼 자동 입력 애니메이션
  const animateServiceForm = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await typeText(setServiceFormData, 'title', '워드프레스 웹사이트 제작', 80);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await typeText(setServiceFormData, 'description', '전문적인 워드프레스 웹사이트를 제작해드립니다. 반응형 디자인과 SEO 최적화가 포함됩니다.', 30);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setServiceFormData(prev => ({ ...prev, price: 800000 }));
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await typeText(setServiceFormData, 'duration', '2-3주');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setServiceFormData(prev => ({ 
      ...prev, 
      features: ['반응형 디자인', 'SEO 최적화', '관리자 교육']
    }));
    
    // 실제 데이터 저장
    await saveDemoService();
  };

  // 고객 폼 자동 입력 애니메이션
  const animateClientForm = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await typeText(setClientFormData, 'name', '김철수', 100);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await typeText(setClientFormData, 'company', '(주)데모컴퍼니', 80);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await typeText(setClientFormData, 'email', 'demo@example.com', 60);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await typeText(setClientFormData, 'phone', '010-1234-5678', 80);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await typeText(setClientFormData, 'companyAddress', '서울특별시 강남구 테헤란로 123');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await typeText(setClientFormData, 'companyPhone', '02-1234-5678');
    
    // 실제 데이터 저장
    await saveDemoClient();
  };

  // 더미 서비스 저장
  const saveDemoService = async () => {
    try {
      const response = await fetch('/api/onboarding/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          type: 'service',
          data: {
            categoryId: serviceFormData.categoryId,
            title: serviceFormData.title,
            description: serviceFormData.description,
            price: parseInt(serviceFormData.price),
            duration: serviceFormData.duration,
            features: serviceFormData.features,
            images: JSON.stringify(serviceFormData.images),
            isActive: serviceFormData.isActive,
            isPlan: serviceFormData.isPlan,
            isDemo: true
          }
        })
      });
      
      if (response.ok) {
        const service = await response.json();
        setOnboardingData(prev => ({ ...prev, service }));
        showSuccessMessage('서비스가 성공적으로 등록되었습니다! 🎉');
      }
    } catch (error) {
      console.error('서비스 저장 실패:', error);
    }
  };

  // 더미 고객 저장
  const saveDemoClient = async () => {
    try {
      const response = await fetch('/api/onboarding/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          type: 'client',
          data: {
            name: clientFormData.name,
            email: clientFormData.email,
            phone: clientFormData.phone,
            company: clientFormData.company,
            businessNumber: clientFormData.businessNumber,
            companyAddress: clientFormData.companyAddress,
            companyPhone: clientFormData.companyPhone,
            websiteUrl: clientFormData.websiteUrl,
            memo: clientFormData.memo,
            isDemo: true
          }
        })
      });
      
      if (response.ok) {
        const client = await response.json();
        setOnboardingData(prev => ({ ...prev, client }));
        showSuccessMessage('고객이 성공적으로 등록되었습니다! 🎉');
      }
    } catch (error) {
      console.error('고객 저장 실패:', error);
    }
  };

  // 성공 메시지 표시
  const showSuccessMessage = (message) => {
    const successEl = document.createElement('div');
    successEl.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-8 py-4 rounded-lg shadow-xl z-[10002] text-lg font-semibold';
    successEl.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        ${message}
      </div>
    `;
    document.body.appendChild(successEl);
    
    setTimeout(() => {
      if (document.body.contains(successEl)) {
        document.body.removeChild(successEl);
      }
    }, 2000);
  };

  // 다음 단계로 이동
  const handleNext = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const step = getCurrentStep();

    try {
      // 모달 표시 단계
      if (step.showModal) {
        setShowModal(step.showModal);
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
        return;
      }

      // 완료 처리
      if (step.id === 'finish') {
        await handleComplete();
        return;
      }

      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } catch (error) {
      console.error('단계 진행 오류:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  // 이전 단계로 이동
  const handlePrev = () => {
    if (currentStep > 0) {
      setShowModal(null);
      setCurrentStep(prev => prev - 1);
    }
  };

  // 모달 닫기 및 다음 단계로 이동
  const handleModalClose = () => {
    setShowModal(null);
    setCurrentStep(prev => prev + 1);
  };

  // 레이어 클릭으로 다음 단계 이동
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && showModal) {
      handleModalClose();
    }
  };

  // 완료 처리
  const handleComplete = async () => {
    try {
      // 백엔드에 완료 기록
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ completed: true, completedAt: new Date().toISOString() })
      });
  
      // 완료 메시지 표시
      showSuccessMessage('온보딩이 완료되었습니다! 🎉');
  
      // URL 파라미터 제거
      const url = new URL(window.location);
      url.searchParams.delete('onboarding');
      window.history.replaceState({}, '', url);
  
      // 1.5초 후 온보딩 종료
      setTimeout(onComplete, 1500);
  
    } catch (error) {
      console.error('온보딩 완료 실패:', error);
      onComplete();
    }
  };



  // 모달 표시 시 자동 애니메이션 시작
  useEffect(() => {
    if (showModal === 'service') {
      animateServiceForm();
    } else if (showModal === 'client') {
      animateClientForm();
    }
  }, [showModal]);

  if (!isActive || isCompleted) return null;

  const step = getCurrentStep();

  return (
    <>
      {/* 검은색 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center"
        onClick={handleOverlayClick}
      >
        
        {/* 서비스 등록 폼 모달 - 실제 ServiceForm과 동일 */}
        {showModal === 'service' && (
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={handleOverlayClick}>
            <Card className="bg-white p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto z-[10001]" onClick={(e) => e?.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <PlusIcon size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">새 서비스 등록</h2>
                    <p className="text-gray-600">서비스 정보를 입력해서 등록하세요</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={handleModalClose}>
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-6">
                {/* 기본 정보 */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
                  <div className="space-y-4">
                    {/* 카테고리 선택 */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        서비스 카테고리 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={serviceFormData.categoryId}
                        className="block w-full px-4 py-3 text-base border border-gray-200 bg-gray-50 rounded-xl"
                        disabled
                      >
                        <option value="">서비스 카테고리를 선택하세요</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          서비스명 <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={serviceFormData.title}
                          placeholder="서비스명을 입력하세요"
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          기본 가격 <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={serviceFormData.price.toLocaleString()}
                          placeholder="0"
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        서비스 소개 <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        value={serviceFormData.description}
                        placeholder="서비스에 대한 상세한 설명을 입력하세요"
                        rows={4}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        예상 기간
                      </label>
                      <Input
                        value={serviceFormData.duration}
                        placeholder="예: 2-3주"
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </Card>

                {/* 주요 기능 */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 기능</h3>
                  <div className="space-y-3">
                    {serviceFormData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border-l-4 border-emerald-400">
                        <span className="flex-1 text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* 서비스 설정 */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">서비스 설정</h3>
                  <div className="space-y-4">
                    <Card className="border-2 border-gray-200">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={serviceFormData.isActive}
                          disabled
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-emerald-600" />
                          <label className="text-sm font-semibold text-gray-700">
                            서비스 활성화
                          </label>
                        </div>
                      </div>
                    </Card>
                  </div>
                </Card>
              </div>
            </Card>
          </div>
        )}

        {/* 고객 등록 폼 모달 - 실제 ClientForm과 동일 */}
        {showModal === 'client' && (
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={handleOverlayClick}>
            <Card className="bg-white p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto z-[10001]" onClick={(e) => e?.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">새 고객 등록</h2>
                    <p className="text-gray-600">고객 정보를 입력해서 등록하세요</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={handleModalClose}>
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-6">
                {/* 담당자 정보 */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">담당자 정보</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          담당자명 <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={clientFormData.name}
                          placeholder="홍길동"
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          담당자 전화번호 <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={clientFormData.phone}
                          placeholder="010-0000-0000"
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        담당자 이메일 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={clientFormData.email}
                        placeholder="example@company.com"
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                </Card>

                {/* 회사 정보 */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">회사 정보</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">회사명</label>
                        <Input
                          value={clientFormData.company}
                          placeholder="주식회사 예시"
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">사업자번호</label>
                        <Input
                          value={clientFormData.businessNumber}
                          placeholder="000-00-00000"
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">회사주소</label>
                      <Input
                        value={clientFormData.companyAddress}
                        placeholder="서울특별시 강남구 테헤란로 123"
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">회사 전화번호</label>
                        <Input
                          value={clientFormData.companyPhone}
                          placeholder="02-0000-0000"
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">웹사이트 주소</label>
                        <Input
                          value={clientFormData.websiteUrl}
                          placeholder="company.com"
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 메모 */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">메모</h3>
                  <Textarea
                    value={clientFormData.memo}
                    placeholder="고객에 대한 추가 정보나 특이사항을 입력하세요..."
                    rows={4}
                    readOnly
                    className="bg-gray-50"
                  />
                </Card>
              </div>
            </Card>
          </div>
        )}

        {/* 견적서 작성 폼 모달 */}
        {showModal === 'quote' && (
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={handleOverlayClick}>
            <Card className="bg-white p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto z-[10001]" onClick={(e) => e?.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <FileText size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">견적서 생성</h2>
                    <p className="text-gray-600">결제 조건과 할인을 설정하세요</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={handleModalClose}>
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-6">
                {/* 선택된 서비스 및 고객 정보 */}
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">견적 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">고객:</span>
                      <div className="font-medium text-blue-700">{clientFormData.name}</div>
                      <div className="text-xs text-gray-500">{clientFormData.company}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">서비스:</span>
                      <div className="font-medium text-purple-700">{serviceFormData.title}</div>
                      <div className="text-xs text-gray-500">기본 가격: {serviceFormData.price.toLocaleString()}원</div>
                    </div>
                    <div>
                      <span className="text-gray-600">예상 기간:</span>
                      <div className="font-medium text-green-700">{serviceFormData.duration}</div>
                    </div>
                  </div>
                </Card>

                {/* 결제 조건 */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">결제 조건</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">계약금 (%)</label>
                      <Input
                        type="number"
                        value={quoteFormData.contractRate}
                        readOnly
                        className="bg-gray-50 text-center font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">중도금 (%)</label>
                      <Input
                        type="number"
                        value={quoteFormData.middleRate}
                        readOnly
                        className="bg-gray-50 text-center font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">잔금 (%)</label>
                      <Input
                        type="number"
                        value={quoteFormData.finalRate}
                        readOnly
                        className="bg-gray-50 text-center font-semibold"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="font-semibold">{((serviceFormData.price * quoteFormData.contractRate) / 100).toLocaleString()}원</div>
                          <div className="text-xs">계약시 지급</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{((serviceFormData.price * quoteFormData.middleRate) / 100).toLocaleString()}원</div>
                          <div className="text-xs">중도금</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{((serviceFormData.price * quoteFormData.finalRate) / 100).toLocaleString()}원</div>
                          <div className="text-xs">완료시 지급</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 기간 설정 */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">기간 설정</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">납품기한 (일)</label>
                      <Input
                        type="number"
                        value={quoteFormData.deliveryDays}
                        readOnly
                        className="bg-gray-50 text-center font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">검수기간 (일)</label>
                      <Input
                        type="number"
                        value={quoteFormData.inspectionDays}
                        readOnly
                        className="bg-gray-50 text-center font-semibold"
                      />
                    </div>
                  </div>
                </Card>

                {/* 할인 설정 */}
                <Card className="p-6 border-2 border-amber-200 bg-amber-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">할인 설정</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">할인 유형</label>
                      <select
                        value={quoteFormData.discountType}
                        className="block w-full px-4 py-3 text-base border border-gray-200 bg-gray-50 rounded-xl"
                        disabled
                      >
                        <option value="none">할인 없음</option>
                        <option value="percent">퍼센트 할인</option>
                        <option value="amount">금액 할인</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">할인 비율</label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={quoteFormData.discountValue}
                          readOnly
                          className="bg-gray-50 pr-8 text-center font-semibold text-red-600"
                        />
                        <span className="absolute right-3 top-3 text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">할인 사유</label>
                      <Input
                        value="신규고객 할인"
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  {quoteFormData.discountValue > 0 && (
                    <div className="mt-4 p-4 bg-yellow-100 rounded-lg border border-yellow-300">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Sparkles size={16} />
                        <span className="font-semibold">할인 적용!</span>
                      </div>
                      <div className="text-sm text-yellow-700 mt-1">
                        {quoteFormData.discountValue}% 할인으로 {(serviceFormData.price * quoteFormData.discountValue / 100).toLocaleString()}원 절약
                      </div>
                    </div>
                  )}
                </Card>

                {/* 견적 요약 */}
                <Card className="p-6 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">견적 요약</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-lg">
                      <span>소계</span>
                      <span className="font-medium">{serviceFormData.price.toLocaleString()}원</span>
                    </div>
                    {quoteFormData.discountValue > 0 && (
                      <div className="flex justify-between text-lg text-red-600">
                        <span>할인 ({quoteFormData.discountValue}%)</span>
                        <span className="font-medium">-{(serviceFormData.price * quoteFormData.discountValue / 100).toLocaleString()}원</span>
                      </div>
                    )}
                    <div className="border-t-2 border-gray-300 pt-3 flex justify-between text-2xl font-bold">
                      <span>최종 견적 금액</span>
                      <span className="text-emerald-600">
                        {(serviceFormData.price * (1 - quoteFormData.discountValue / 100)).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </div>
        )}

        {/* 계약서 조항 분석 모달 */}
        {showModal === 'contract-clauses' && (
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={handleOverlayClick}>
            <Card className="bg-white p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto z-[10001]" onClick={(e) => e?.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <ScrollText size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">계약서 조항 분석</h2>
                    <p className="text-gray-600">생성 방식과 계약서 상세도를 선택합니다</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={handleModalClose}>
                  <X size={20} />
                </Button>
              </div>

              {/* 계약 정보 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">계약 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">고객:</span>
                    <div className="font-medium">{clientFormData.name}</div>
                    <div className="text-xs text-gray-500">{clientFormData.company}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">금액:</span>
                    <div className="font-medium text-purple-600">
                      {(serviceFormData.price * (1 - quoteFormData.discountValue / 100)).toLocaleString()}원
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">기간:</span>
                    <div className="font-medium">{quoteFormData.deliveryDays}일</div>
                  </div>
                </div>
              </div>

              {/* 생성 방식 선택 */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">생성 방식 선택</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border-2 bg-blue-600 border-blue-600 text-white transform scale-105 shadow-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Zap className="w-5 h-5" />
                      <div className="font-medium">템플릿 기반</div>
                    </div>
                    <div className="text-sm opacity-90 mb-2">검증된 템플릿으로 빠르고 안정적</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs px-2 py-1 bg-white/20 rounded">빠른 생성 (5초)</span>
                      <span className="text-xs px-2 py-1 bg-white/20 rounded">법률 검증됨</span>
                      <span className="text-xs px-2 py-1 bg-white/20 rounded">안정적</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border-2 bg-gray-100 border-gray-300 text-gray-600">
                    <div className="flex items-center space-x-3 mb-2">
                      <Bot className="w-5 h-5" />
                      <div className="font-medium">AI 맞춤 생성</div>
                    </div>
                    <div className="text-sm opacity-90 mb-2">GPT+Claude로 맞춤형 조항 생성</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs px-2 py-1 bg-white/40 rounded">맞춤형 조항</span>
                      <span className="text-xs px-2 py-1 bg-white/40 rounded">세밀한 분석</span>
                      <span className="text-xs px-2 py-1 bg-white/40 rounded">유연한 구성</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 계약서 상세도 선택 */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">계약서 상세도 선택</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border-2 bg-gray-100 border-gray-300 text-gray-600 text-center">
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="font-medium">간단형</div>
                    <div className="text-xs mt-1">핵심 조항만</div>
                  </div>
                  <div className="p-4 rounded-lg border-2 bg-blue-600 border-blue-600 text-white text-center transform scale-105 shadow-lg">
                    <div className="text-2xl mb-2">📄</div>
                    <div className="font-medium">표준형</div>
                    <div className="text-xs mt-1">일반적인 조항</div>
                  </div>
                  <div className="p-4 rounded-lg border-2 bg-gray-100 border-gray-300 text-gray-600 text-center">
                    <div className="text-2xl mb-2">📚</div>
                    <div className="font-medium">상세형</div>
                    <div className="text-xs mt-1">모든 조항 포함</div>
                  </div>
                </div>
              </div>

              {/* 생성 버튼 */}
              <div className="text-center">
                <Button className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 text-lg font-medium animate-pulse shadow-lg">
                  <Zap className="w-4 h-4 mr-2" />
                  템플릿 기반 생성 (표준형)
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* 계약서 생성 완료 모달 */}
        {showModal === 'contract-result' && (
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={handleOverlayClick}>
            <Card className="bg-white p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto z-[10001]" onClick={(e) => e?.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Check size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">계약서 생성 완료</h2>
                    <p className="text-gray-600">전문적인 계약서가 성공적으로 생성되었습니다</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={handleModalClose}>
                  <X size={20} />
                </Button>
              </div>

              {/* 계약서 미리보기 */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{serviceFormData.title} 계약서</h3>
                  <p className="text-sm text-gray-600">계약번호: #DEMO-{Date.now().toString().slice(-6)}</p>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded">
                      <h4 className="font-semibold text-blue-700 mb-2">발주자 (갑)</h4>
                      <div>이름: {clientFormData.name}</div>
                      <div>회사: {clientFormData.company}</div>
                      <div>이메일: {clientFormData.email}</div>
                      <div>연락처: {clientFormData.phone}</div>
                    </div>
                    <div className="bg-white p-4 rounded">
                      <h4 className="font-semibold text-purple-700 mb-2">수행자 (을)</h4>
                      <div>이름: AORAT</div>
                      <div>이메일: cs@aorat.com</div>
                      <div>연락처: 02-1234-5678</div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded">
                    <h4 className="font-semibold mb-2">계약 내용</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {(serviceFormData.price * (1 - quoteFormData.discountValue / 100)).toLocaleString()}원
                        </div>
                        <div className="text-xs text-gray-600">계약금액</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{quoteFormData.deliveryDays}일</div>
                        <div className="text-xs text-gray-600">작업기간</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{quoteFormData.inspectionDays}일</div>
                        <div className="text-xs text-gray-600">검수기간</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded">
                    <h4 className="font-semibold mb-2">주요 조항 (5개)</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="w-4 h-4 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                        <span>제1조 - 계약의 목적</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                        <span>제2조 - 대금청구 및 지급</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                        <span>제3조 - 용역의 완료</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                        <span>제4조 - 품질보증</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                        <span>제5조 - 계약의 해지</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 스크롤 애니메이션으로 하단 보기 */}
                <div className="mt-6 text-center">
                  <Button 
                    variant="outline" 
                    className="animate-bounce"
                    onClick={() => {
                      // 하단으로 스크롤 애니메이션
                      setTimeout(() => {
                        const modal = document.querySelector('.z-\\[10001\\]');
                        if (modal) {
                          modal.scrollTo({
                            top: modal.scrollHeight,
                            behavior: 'smooth'
                          });
                        }
                      }, 500);
                    }}
                  >
                    하단 서명란 보기 ⬇️
                  </Button>
                </div>

                {/* 하단 여백 */}
                <div className="h-32"></div>

                {/* 서명란 */}
                <div className="border-t-2 border-gray-300 pt-6 mt-6">
                  <h4 className="font-semibold text-center mb-6 text-lg">전자서명란</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <div className="text-gray-500 mb-2">발주자 서명</div>
                      <div className="w-32 h-16 border border-gray-300 rounded mx-auto mb-2 flex items-center justify-center bg-gray-50" id="client-signature-box">
                        <span className="text-gray-400">서명 대기중</span>
                      </div>
                      <Button 
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 demo-signature-btn"
                        id="client-signature-btn"
                        onClick={async (e) => {
                          // 서명 애니메이션
                          e.target.disabled = true;
                          e.target.textContent = '서명 중...';
                          
                          await new Promise(resolve => setTimeout(resolve, 1500));
                          
                          const signBox = document.getElementById('client-signature-box');
                          signBox.innerHTML = `<span class="text-lg font-bold text-blue-600">${clientFormData.name}</span>`;
                          signBox.className = 'w-32 h-16 border border-blue-300 rounded mx-auto mb-2 flex items-center justify-center bg-blue-50';
                          
                          e.target.textContent = '서명 완료';
                          e.target.className = 'bg-green-500 text-white px-4 py-2 cursor-not-allowed';
                          
                          showSuccessMessage('전자서명이 완료되었습니다! ✍️');
                        }}
                      >
                        전자서명 하기
                      </Button>
                    </div>
                    <div className="text-center p-6 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
                      <div className="text-green-700 mb-2">수행자 서명</div>
                      <div className="w-32 h-16 border border-green-300 rounded mx-auto mb-2 flex items-center justify-center bg-green-100">
                        <span className="text-lg font-bold text-green-600">AORAT</span>
                      </div>
                      <div className="bg-green-500 text-white px-4 py-2 rounded cursor-not-allowed">
                        서명 완료
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}


        {/* 전자서명 모달 */}
        {showModal === 'signature' && (
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={handleOverlayClick}>
            <Card className="bg-white p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto z-[10001]" onClick={(e) => e?.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">전자서명</h2>
                    <p className="text-gray-600">계약서에 서명하여 계약을 완료하세요</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={handleModalClose}>
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-6">
                {/* 계약서 요약 */}
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">서명할 계약서</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">서비스:</span>
                      <div className="font-medium text-blue-700">{serviceFormData.title}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">금액:</span>
                      <div className="font-medium text-purple-700">
                        {(serviceFormData.price * (1 - quoteFormData.discountValue / 100)).toLocaleString()}원
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">계약기간:</span>
                      <div className="font-medium text-green-700">{quoteFormData.deliveryDays}일</div>
                    </div>
                  </div>
                </Card>

                {/* 서명 방식 선택 (간소화된 데모 버전) */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">서명 방식 선택</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* 직접 서명 */}
                    <div className="p-4 rounded-lg border-2 bg-blue-600 border-blue-600 text-white transform scale-105 shadow-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <PlusIcon className="w-5 h-5" />
                        <div className="font-medium">직접 서명하기</div>
                      </div>
                      <div className="text-sm opacity-90 mb-3">마우스나 터치로 서명</div>
                      
                      {/* 서명 캔버스 (데모용 간소화) */}
                      <div className="bg-white/20 rounded-lg p-4 mb-3">
                        <div className="bg-white rounded h-16 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">여기에 서명하세요</span>
                        </div>
                      </div>
                      
                      <Button
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-full"
                        onClick={async () => {
                          // 서명 애니메이션
                          const signArea = document.querySelector('.bg-white.rounded.h-16');
                          if (signArea) {
                            signArea.innerHTML = '<div class="text-blue-600 font-bold text-lg animate-pulse">서명 중...</div>';
                            
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            
                            signArea.innerHTML = `<div class="text-blue-600 font-bold text-lg">${clientFormData.name}</div>`;
                            signArea.className = 'bg-blue-50 rounded h-16 flex items-center justify-center border-2 border-blue-300';
                            
                            showSuccessMessage('전자서명이 완료되었습니다! ✍️');
                            
                            // 3초 후 자동으로 다음 단계
                            setTimeout(() => {
                              handleModalClose();
                            }, 1500);
                          }
                        }}
                      >
                        서명하기
                      </Button>
                    </div>

                    {/* 이미지 업로드 */}
                    <div className="p-4 rounded-lg border-2 bg-gray-100 border-gray-300 text-gray-600">
                      <div className="flex items-center space-x-3 mb-2">
                        <Upload className="w-5 h-5" />
                        <div className="font-medium">이미지 업로드</div>
                      </div>
                      <div className="text-sm opacity-90 mb-3">서명 이미지 파일 업로드</div>
                      <div className="bg-white/40 rounded-lg p-4 mb-3">
                        <div className="border-2 border-dashed border-gray-400 rounded h-16 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">이미지 선택</span>
                        </div>
                      </div>
                      <Button variant="outline" disabled className="w-full">
                        파일 선택
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* 본인 확인 (간소화) */}
                <Card className="p-6 bg-yellow-50 border-2 border-yellow-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">본인 확인</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">사업자번호</label>
                      <Input
                        value="123-45-67890"
                        readOnly
                        className="bg-gray-50 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">확인 상태</label>
                      <div className="flex items-center gap-2 p-3 bg-green-100 rounded-xl">
                        <Check size={16} className="text-green-600" />
                        <span className="text-green-700 font-medium">본인 확인 완료</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 법적 안내 */}
                <Card className="p-6 border-2 border-blue-200 bg-blue-50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ScrollText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-2">전자서명 법적 효력</h4>
                      <p className="text-sm text-blue-800">
                        전자서명법에 따라 이 전자서명은 수기서명과 동일한 법적 효력을 가집니다. 
                        서명 후에는 계약 내용을 변경할 수 없으니 신중하게 서명해 주세요.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </div>
        )}





        {/* 가이드 카드 */}
        {!showModal && (
          <Card className="relative bg-white p-8 max-w-md mx-4 z-[10000]" onClick={(e) => e?.stopPropagation()}>
            {/* 닫기 버튼 */}
            <button
              onClick={onSkip}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            {/* 진행률 */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>진행률</span>
                <span>{currentStep + 1}/{steps.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* 단계 아이콘 */}
            <div className="text-center mb-4">
              {step.id === 'welcome' && <Sparkles size={48} className="mx-auto text-blue-500" />}
              {step.id.includes('service') && <Sparkles size={48} className="mx-auto text-green-500" />}
              {step.id.includes('client') && <User size={48} className="mx-auto text-purple-500" />}
              {step.id.includes('quote') && <FileText size={48} className="mx-auto text-orange-500" />}
              {step.id.includes('contract') && <ScrollText size={48} className="mx-auto text-red-500" />}
              {step.id.includes('signature') && <ScrollText size={48} className="mx-auto text-indigo-500" />}
              {step.id.includes('link') && <Copy size={48} className="mx-auto text-teal-500" />}
              {step.id === 'finish' && <Check size={48} className="mx-auto text-green-500" />}
            </div>

            {/* 제목과 설명 */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {step.title}
              </h2>
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>

            {/* 플로팅바 표시 */}
            {step.showFloatingBar && (
              <div className="mb-6">
                <div className="bg-gray-100 p-4 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-2">화면 하단 플로팅바:</div>
                  <div className="flex justify-center">
                    <Button
                      className={`px-6 py-2 ${
                        step.highlightButton === '견적서 생성' 
                          ? 'bg-orange-500 hover:bg-orange-600 animate-pulse shadow-lg' 
                          : 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg'
                      } text-white`}
                    >
                      {step.highlightButton}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 링크 복사 버튼 하이라이트 */}
            {step.highlightButton === '링크 복사' && (
              <div className="mb-6">
                <div className="bg-teal-50 p-4 rounded-lg border-2 border-teal-200">
                  <div className="text-sm text-teal-700 mb-3 text-center">계약서 공유 링크:</div>
                  <div className="flex items-center gap-2 p-3 bg-white rounded border">
                    <code className="flex-1 text-sm text-gray-700 truncate">
                      https://aorat.com/contracts/demo-001
                    </code>
                    <Button
                      size="sm"
                      className="bg-teal-500 hover:bg-teal-600 text-white animate-bounce shadow-lg"
                      onClick={() => {
                        showSuccessMessage('링크가 클립보드에 복사되었습니다! 📋');
                      }}
                    >
                      <Copy size={16} className="mr-1" />
                      복사
                    </Button>
                  </div>
                  <p className="text-xs text-teal-600 mt-2 text-center">
                    이 링크를 고객에게 보내서 계약서를 공유할 수 있습니다
                  </p>
                </div>
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  icon={ArrowLeft}
                  disabled={isAnimating}
                  className="flex-1"
                >
                  이전
                </Button>
              )}
              
              <Button
                variant="primary"
                onClick={currentStep === steps.length - 1 ? handleComplete : handleNext}
                icon={currentStep === steps.length - 1 ? Check : ArrowRight}
                disabled={isAnimating}
                className="flex-1"
              >
                {isAnimating ? '진행 중...' : 
                 currentStep === steps.length - 1 ? '완료' : '다음'}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* CSS 스타일 */}
      <style jsx global>{`
        .onboarding-highlight {
          position: relative;
          z-index: 10000 !important;
          border-radius: 8px;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4) !important;
          animation: pulse-highlight 2s infinite;
        }
        
        @keyframes pulse-highlight {
          0%, 100% { 
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.4); 
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.6); 
          }
        }
        
        .onboarding-pointer {
          position: absolute;
          z-index: 9998;
          pointer-events: none;
          animation: bounce-arrow 1.5s infinite;
        }
        
        @keyframes bounce-arrow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
};

export default CustomOnboardingGuide;