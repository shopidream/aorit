// pages/ai/auto-contract.js - AI 자동 계약서 생성 페이지
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../contexts/AuthContext';
import { 
  Button, 
  Alert, 
  BotIcon, 
  CheckCircleIcon,
  ArrowRightIcon,
  UsersIcon,
  CalculatorIcon,
  ContractIcon,
  SettingsIcon,
  DocumentIcon 
} from '../../components/ui/DesignSystem';

export default function AIAutoContract() {
  const router = useRouter();
  const { user, getAuthHeaders } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [autoData, setAutoData] = useState(null);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    company: '',
    phone: ''
  });
  const [selectedClauses, setSelectedClauses] = useState([]);
  const [contractSettings, setContractSettings] = useState({
    paymentMethod: '',
    revisionCount: 0,
    deliveryMethod: '',
    maintenancePeriod: 0
  });

  const steps = [
    { number: 1, title: 'AI 견적 완료', completed: true },
    { number: 2, title: '고객 정보', active: true },
    { number: 3, title: '계약 생성', description: '계약서를 생성합니다' }
  ];

  useEffect(() => {
    // URL에서 AI 견적 데이터 가져오기
    const { data } = router.query;
    if (data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        setAutoData(parsedData.aiResult);
        
        // AI 추천 설정을 기본값으로 설정
        if (parsedData.aiResult?.recommendations) {
          setContractSettings({
            paymentMethod: parsedData.aiResult.recommendations.paymentMethod,
            revisionCount: parsedData.aiResult.recommendations.revisionCount,
            deliveryMethod: parsedData.aiResult.recommendations.deliveryMethod,
            maintenancePeriod: parsedData.aiResult.recommendations.maintenancePeriod
          });
        }

        // 업종별 기본 조항 자동 설정
        generateBasicClauses(parsedData.aiResult, parsedData.analysisResult);
        
      } catch (error) {
        console.error('AI 데이터 파싱 실패:', error);
        setError('AI 견적 데이터를 불러오는데 실패했습니다.');
      }
    }
  }, [router.query]);

  // 업종별 기본 조항 생성
  const generateBasicClauses = (aiResult, analysisResult) => {
    const industry = analysisResult?.industry || '기타';
    
    const industryClauseMap = {
      '개발': [
        {
          id: 'dev_scope',
          title: '업무 범위',
          content: `을은 갑에게 다음과 같은 개발 서비스를 제공한다:\n${aiResult.services.map(s => `- ${s.title}: ${s.description}`).join('\n')}`,
          category: 'scope',
          riskLevel: 'medium'
        },
        {
          id: 'dev_ip',
          title: '지적재산권',
          content: '본 계약으로 개발된 소스코드 및 관련 저작물의 저작권은 완성과 동시에 갑에게 이전되며, 을은 포트폴리오 목적으로만 활용할 수 있다.',
          category: 'ip',
          riskLevel: 'high'
        },
        {
          id: 'dev_delivery',
          title: '납품 및 테스트',
          content: '을은 개발 완료 후 갑에게 테스트 기간 7일을 제공하며, 이 기간 중 발견된 버그는 무료로 수정한다.',
          category: 'delivery',
          riskLevel: 'medium'
        }
      ],
      '디자인': [
        {
          id: 'design_scope',
          title: '업무 범위',
          content: `을은 갑에게 다음과 같은 디자인 서비스를 제공한다:\n${aiResult.services.map(s => `- ${s.title}: ${s.description}`).join('\n')}`,
          category: 'scope',
          riskLevel: 'medium'
        },
        {
          id: 'design_revision',
          title: '수정 및 보완',
          content: `갑은 ${contractSettings.revisionCount || 3}회의 무료 수정을 요청할 수 있으며, 이를 초과하는 수정은 회당 별도 비용이 발생한다.`,
          category: 'modification',
          riskLevel: 'medium'
        },
        {
          id: 'design_copyright',
          title: '저작권 및 사용권',
          content: '완성된 디자인의 저작권은 갑에게 이전되며, 을은 포트폴리오 및 홍보 목적으로 활용할 수 있다.',
          category: 'ip',
          riskLevel: 'medium'
        }
      ],
      '사진/영상': [
        {
          id: 'media_scope',
          title: '촬영/편집 범위',
          content: `을은 갑에게 다음과 같은 영상/사진 서비스를 제공한다:\n${aiResult.services.map(s => `- ${s.title}: ${s.description}`).join('\n')}`,
          category: 'scope',
          riskLevel: 'medium'
        },
        {
          id: 'media_usage',
          title: '이용 권한',
          content: '갑은 제작된 영상/사진을 상업적 목적으로 자유롭게 이용할 수 있으며, 을은 포트폴리오 및 홍보 목적으로 활용할 수 있다.',
          category: 'usage',
          riskLevel: 'medium'
        },
        {
          id: 'media_delivery',
          title: '납품 형태',
          content: `모든 결과물은 원본 파일로 ${contractSettings.deliveryMethod || '클라우드 드라이브'}를 통해 납품되며, 백업본을 30일간 보관한다.`,
          category: 'delivery',
          riskLevel: 'low'
        }
      ]
    };

    // 공통 조항
    const commonClauses = [
      {
        id: 'payment',
        title: '대금 지급',
        content: `총 계약금액은 ${autoData?.quotation?.total?.toLocaleString() || 0}원(부가세 포함)이며, ${contractSettings.paymentMethod || '50% 선금 + 50% 잔금'} 방식으로 지급한다. 선금은 계약 체결 후 3일 이내, 잔금은 최종 납품 후 7일 이내에 지급한다.`,
        category: 'payment',
        riskLevel: 'high'
      },
      {
        id: 'schedule',
        title: '일정 및 납기',
        content: '작업 일정은 계약 체결 후 상호 협의하여 정하며, 갑의 사유로 인한 지연은 납기 연장 사유가 된다.',
        category: 'schedule',
        riskLevel: 'medium'
      },
      {
        id: 'confidentiality',
        title: '비밀유지',
        content: '양 당사자는 본 계약과 관련하여 취득한 상대방의 기밀정보를 제3자에게 누설하거나 본 계약 목적 외에 사용하지 않는다.',
        category: 'confidentiality',
        riskLevel: 'high'
      },
      {
        id: 'termination',
        title: '계약 해제',
        content: '어느 일방이 본 계약을 위반하고 7일 이내에 이를 시정하지 않을 때, 상대방은 본 계약을 해제할 수 있다.',
        category: 'termination',
        riskLevel: 'medium'
      }
    ];

    const industryClauses = industryClauseMap[industry] || industryClauseMap['개발'];
    setSelectedClauses([...industryClauses, ...commonClauses]);
  };

  // 고객 정보로 계약 생성
  const handleCreateContract = async () => {
    if (!clientInfo.name || !clientInfo.email) {
      setError('고객 이름과 이메일은 필수입니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. 고객 정보 저장/조회
      let client = await createOrFindClient();
      
      // 2. 견적 생성
      const quote = await createQuote(client);
      
      // 3. 계약 생성
      const contract = await createContract(client, quote);
      
      setSuccess(true);
      setTimeout(() => {
        router.push(`/contracts/${contract.id}`);
      }, 2000);

    } catch (error) {
      console.error('계약 생성 실패:', error);
      setError('계약 생성에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createOrFindClient = async () => {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(clientInfo)
    });

    if (!response.ok) {
      throw new Error('고객 정보 저장 실패');
    }

    return await response.json();
  };

  const createQuote = async (client) => {
    const quoteData = {
      clientInfo,
      items: autoData.quotation.items.map(item => ({
        serviceName: item.serviceName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity
      })),
      pricing: {
        subtotal: autoData.quotation.subtotal,
        total: autoData.quotation.total
      }
    };

    const response = await fetch('/api/quotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(quoteData)
    });

    if (!response.ok) {
      throw new Error('견적 생성 실패');
    }

    return await response.json();
  };

  const createContract = async (client, quote) => {
    const contractData = {
      clientId: client.id,
      quoteId: quote.id,
      clauses: selectedClauses,
      content: generateContractContent(client, quote)
    };

    const response = await fetch('/api/contracts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(contractData)
    });

    if (!response.ok) {
      throw new Error('계약서 생성 실패');
    }

    return await response.json();
  };

  const generateContractContent = (client, quote) => {
    const today = new Date().toLocaleDateString('ko-KR');
    
    return {
      title: `${autoData.services[0]?.title || '서비스'} 제공 계약서`,
      sections: selectedClauses.map((clause, index) => ({
        title: `제${index + 1}조 (${clause.title})`,
        content: clause.content
      })),
      footer: {
        date: today,
        parties: [
          { role: '발주자(갑)', name: client.name, signature: '(인)' },
          { role: '수행자(을)', name: user?.name || 'ShopIDream', signature: '(인)' }
        ]
      }
    };
  };

  if (!autoData) {
    return (

        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <BotIcon size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">AI 견적 데이터를 불러오는 중...</p>
            <Button onClick={() => router.push('/ai/auto-quote')}>
              AI 견적 다시 생성
            </Button>
          </div>
        </div>

    );
  }

  if (success) {
    return (

        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center py-16 space-y-6">
            <CheckCircleIcon size={80} className="text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900">AI 계약서가 생성되었습니다!</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              AI가 분석한 내용을 바탕으로 전문적인 계약서가 완성되었습니다.
              곧 계약서 페이지로 이동합니다.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                <SettingsIcon size={14} />
                업종별 맞춤 조항
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                <BotIcon size={14} />
                AI 추천 조건
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full flex items-center gap-1">
                <ContractIcon size={14} />
                전문 계약서
              </span>
            </div>
          </div>
        </div>

    );
  }

  return (

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          {/* 헤더 */}
          <div className="mb-8">
            <button 
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 mb-4 flex items-center gap-2"
            >
              <ArrowRightIcon size={16} className="rotate-180" />
              이전 단계로
            </button>
            <div className="flex items-center gap-3 mb-2">
              <BotIcon size={32} className="text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">AI 계약서 생성</h1>
            </div>
            <p className="text-gray-600">
              AI가 분석한 견적을 바탕으로 계약서를 자동 생성합니다
            </p>
          </div>

          {/* 진행 단계 */}
          <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step.completed ? 'bg-green-600 text-white' : 
                  step.active ? 'bg-blue-600 text-white' : 
                  'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed ? <CheckCircleIcon size={20} /> : step.number}
                </div>
                <div className="ml-2 mr-6">
                  <div className="text-sm font-medium">{step.title}</div>
                </div>
                {index < steps.length - 1 && <div className={`w-20 h-0.5 ${
                  step.completed ? 'bg-green-600' : 'bg-gray-200'
                }`} />}
              </div>
            ))}
          </div>

          {error && <Alert type="error" className="mb-6">{error}</Alert>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* AI 분석 요약 (왼쪽) */}
            <div className="space-y-6">
              
              {/* 업종 & 서비스 */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <CalculatorIcon size={20} className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">AI 견적 요약</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">총 예상 금액</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {autoData.quotation.total.toLocaleString()}원
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">포함된 서비스</div>
                    <div className="space-y-2">
                      {autoData.services.map((service, index) => (
                        <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="font-medium">{service.title}</div>
                          <div className="text-xs text-gray-500">{service.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI 추천 조건 */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <SettingsIcon size={20} className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">AI 추천 계약 조건</h2>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">결제 방식</span>
                    <span className="text-sm font-medium">{contractSettings.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">수정 횟수</span>
                    <span className="text-sm font-medium">{contractSettings.revisionCount}회</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">납품 방법</span>
                    <span className="text-sm font-medium">{contractSettings.deliveryMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">유지보수</span>
                    <span className="text-sm font-medium">{contractSettings.maintenancePeriod}개월</span>
                  </div>
                </div>
              </div>

              {/* 자동 생성된 조항 미리보기 */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <ContractIcon size={20} className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">자동 생성된 조항</h2>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedClauses.map((clause, index) => (
                    <div key={clause.id} className="border-l-4 border-blue-500 pl-3">
                      <div className="font-medium text-sm text-gray-900">
                        제{index + 1}조 - {clause.title}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {clause.content.substring(0, 100)}...
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-xs text-blue-600 bg-blue-50 p-3 rounded flex items-start gap-2">
                  <DocumentIcon size={16} className="flex-shrink-0 mt-0.5" />
                  <span>업종별 전문 조항이 자동으로 생성되었습니다. 필요시 계약서 완성 후 수정 가능합니다.</span>
                </div>
              </div>
            </div>

            {/* 고객 정보 입력 (오른쪽) */}
            <div className="space-y-6">
              
              <div className="bg-white border border-gray-200 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <UsersIcon size={20} className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">고객 정보 입력</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      고객명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientInfo.name}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="홍길동"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이메일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="client@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
                    <input
                      type="text"
                      value={clientInfo.company}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="(주)고객회사"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <input
                      type="tel"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>
              </div>

              {/* 최종 확인 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-6 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BotIcon size={20} className="text-blue-900" />
                  <h3 className="font-medium text-blue-900">AI 계약서 생성 준비 완료</h3>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• AI 견적: {autoData.services.length}개 서비스</li>
                  <li>• 자동 조항: {selectedClauses.length}개 조항</li>
                  <li>• 계약 금액: {autoData.quotation.total.toLocaleString()}원</li>
                  <li>• 업종별 맞춤: 전문 계약 조항 포함</li>
                </ul>
                
                <div className="mt-4 p-3 bg-white/50 rounded">
                  <p className="text-xs text-blue-700">
                    <strong>생성 후 작업:</strong> 계약서 생성 후 세부 조항 수정, 전자서명 요청, PDF 다운로드가 가능합니다.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleCreateContract}
                disabled={!clientInfo.name || !clientInfo.email || loading}
                size="lg"
                className="w-full"
                icon={BotIcon}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>AI 계약서 생성 중...</span>
                  </div>
                ) : (
                  'AI 계약서 생성하기'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

  );
}