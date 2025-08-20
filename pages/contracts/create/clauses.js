import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../../contexts/AuthContext';
import ClauseSelector from '../../../components/contracts/ClauseSelector';
import { CheckCircle, FileText, ArrowLeft, AlertTriangle, Target, Layers, Loader2, Bot, Zap } from 'lucide-react';

// 계약서 길이 옵션 정의
const CONTRACT_LENGTH_OPTIONS = {
  simple: {
    name: '간단형',
    icon: Target,
    color: 'bg-green-600 border-green-600 text-white',
    inactiveColor: 'bg-gray-100 border-gray-300 text-gray-600'
  },
  standard: {
    name: '표준형',
    icon: FileText,
    color: 'bg-blue-600 border-blue-600 text-white',
    inactiveColor: 'bg-gray-100 border-gray-300 text-gray-600'
  },
  detailed: {
    name: '상세형',
    icon: Layers,
    color: 'bg-purple-600 border-purple-600 text-white',
    inactiveColor: 'bg-gray-100 border-gray-300 text-gray-600'
  }
};

// 생성 방식 옵션
const GENERATION_OPTIONS = {
  template: {
    name: '템플릿 기반',
    description: '검증된 템플릿으로 빠르고 안정적',
    icon: FileText,
    color: 'bg-blue-600 border-blue-600 text-white',
    inactiveColor: 'bg-gray-100 border-gray-300 text-gray-600',
    benefits: ['빠른 생성 (5초)', '법률 검증됨', '안정적']
  },
  ai: {
    name: 'AI 맞춤 생성',
    description: 'GPT+Claude로 맞춤형 조항 생성',
    icon: Bot,
    color: 'bg-purple-600 border-purple-600 text-white',
    inactiveColor: 'bg-gray-100 border-gray-300 text-gray-600',
    benefits: ['맞춤형 조항', '세밀한 분석', '유연한 구성']
  }
};

export default function ClausesPage() {
  const router = useRouter();
  const { user, getAuthHeaders } = useAuthContext();
  const { quoteId } = router.query;

  const [contractData, setContractData] = useState(null);
  const [selectedClauses, setSelectedClauses] = useState([]);
  const [variables, setVariables] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creatingContract, setCreatingContract] = useState(false);
  
  // 계약서 길이 및 생성 방식
  const [contractLength, setContractLength] = useState('simple');
  const [generationType, setGenerationType] = useState('template'); // 새로 추가
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    if (quoteId) {
      loadContractData();
    }
  }, [quoteId]);

  const calculateRecommendedLength = (contractData) => {
    const serviceCount = contractData.services?.length || 1;
    const totalAmount = contractData.amount || 0;
    
    let score = 0;
    
    if (totalAmount >= 50000000) score += 4;
    else if (totalAmount >= 10000000) score += 3;
    else if (totalAmount >= 3000000) score += 2;
    else score += 1;
    
    if (serviceCount >= 5) score += 3;
    else if (serviceCount >= 3) score += 2;
    else score += 1;
    
    const hasComplexServices = contractData.services?.some(service => 
      service.serviceDescription && service.serviceDescription.length > 100
    );
    if (hasComplexServices) score += 2;
    
    if (score >= 8) return 'detailed';
    if (score >= 5) return 'standard';
    return 'simple';
  };

  const loadContractData = async () => {
    setLoading(true);
    try {
      const [quoteRes, clientsRes] = await Promise.all([
        fetch(`/api/quotes/${quoteId}`, { headers: getAuthHeaders() }),
        fetch('/api/clients', { headers: getAuthHeaders() })
      ]);
      
      if (!quoteRes.ok) {
        setError('견적서를 찾을 수 없습니다.');
        return;
      }

      const quote = await quoteRes.json();
      const clients = await clientsRes.json();
      
      let client = Array.isArray(clients) ? clients.find(c => String(c.id) === String(quote.clientId)) : null;
      
      if (!client && quote.clientId) {
        client = {
          name: '고객명 없음',
          email: '',
          phone: '',
          company: ''
        };
      } else if (!client) {
        client = {
          name: '고객명 없음', 
          email: '',
          phone: '',
          company: ''
        };
      }

      if (!quote) {
        setError('견적 정보를 찾을 수 없습니다.');
        return;
      }

      let allServices = [];
      let totalAmount = quote.amount || 0;
      
      try {
        const metadata = JSON.parse(quote.metadata || '{}');
        if (metadata.pricing && metadata.pricing.total) {
          totalAmount = metadata.pricing.total;
        }
      } catch (err) {
        console.error('pricing 메타데이터 파싱 오류:', err);
      }

      let serviceName = quote.title || '서비스';
      let duration = '30일';

      try {
        const quoteItems = JSON.parse(quote.items || '[]');
        if (Array.isArray(quoteItems) && quoteItems.length > 0) {
          allServices = quoteItems.map(item => ({
            serviceName: item.name || item.serviceName || '서비스',
            serviceDescription: item.description || item.serviceDescription || '',
            price: item.totalPrice || item.price || 0,
            quantity: item.quantity || 1
          }));
          
          const firstItem = quoteItems[0];
          if (firstItem?.name || firstItem?.serviceName) {
            serviceName = allServices.length > 1 
              ? `${allServices.length}개 서비스 통합 패키지`
              : (firstItem.name || firstItem.serviceName);
          }
        }
      } catch (err) {
        console.error('견적 items 파싱 오류:', err);
      }

      let paymentTerms = null;
      try {
        const metadata = JSON.parse(quote.metadata || '{}');
        paymentTerms = metadata.paymentTerms;
      } catch (err) {
        console.error('metadata 파싱 오류:', err);
      }

      const contractInfo = {
        serviceName,
        serviceDescription: allServices.length > 0 
          ? allServices.map((s, i) => `${i + 1}. ${s.serviceName}: ${s.serviceDescription}`).join('\n')
          : '전문 서비스',
        amount: totalAmount,
        duration,
        services: allServices,
        paymentTerms: paymentTerms,
        client: {
          name: client.name || '',
          email: client.email || '',
          phone: client.phone || '',
          company: client.company || ''
        },
        provider: {
          name: user?.name || 'AORAT',
          email: user?.email || 'cs@aorat.com',
          phone: user?.profile?.phone || '02-1234-5678'
        }
      };

      setContractData(contractInfo);
      
    } catch (error) {
      console.error('계약 데이터 로드 오류:', error);
      setError('계약 데이터 로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContract = async () => {
    if (!contractData || !user) return;

    setLoading(true);
    setError('');

    try {
      const services = contractData.services || [];
      
      const response = await fetch('/api/ai/auto-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          contractData: {
            ...contractData,
            industry: inferIndustry(services),
            specificRequirements: generateSpecificRequirements(services)
          },
          selectedServices: services,
          contractLength,
          quoteId: parseInt(quoteId),
          generation_type: generationType, // 새로 추가
          options: {
            saveToDatabase: false,
            templateType: 'standard',
            riskTolerance: 'medium'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '조항 생성에 실패했습니다');
      }

      const result = await response.json();
      
      if (result.success && result.contract) {
        const processedClauses = result.contract.clauses || [];
        setSelectedClauses(processedClauses);
        setIsGenerated(true);
        
        const generationMethod = generationType === 'template' ? '템플릿 기반' : 'AI 맞춤';
        console.log(`${generationMethod} 조항 생성 성공 (${CONTRACT_LENGTH_OPTIONS[contractLength].name}):`, processedClauses.length, '개 조항');
      } else {
        throw new Error('응답 형식이 올바르지 않습니다');
      }

    } catch (error) {
      console.error('조항 생성 오류:', error);
      setError(error.message);
      
      // Fallback: 기본 조항들 사용
      const fallbackClauses = generateFallbackClauses(contractData, contractLength);
      setSelectedClauses(fallbackClauses);
      setIsGenerated(true);
      
    } finally {
      setLoading(false);
    }
  };

  const handleClausesChange = (clauses) => {
    setSelectedClauses(Array.isArray(clauses) ? clauses : []);
  };

  const handleVariablesChange = (newVariables) => {
    setVariables(newVariables);
  };

  const handleCreateContract = async () => {
    if (!Array.isArray(selectedClauses) || selectedClauses.length === 0) {
      setError('최소 1개 이상의 조항이 선택되어야 합니다.');
      return;
    }

    setCreatingContract(true);
    setError('');

    try {
      const payload = {
        contractData,
        selectedClauses: selectedClauses,
        variables,
        contractLength,
        lengthOption: CONTRACT_LENGTH_OPTIONS[contractLength],
        quoteId: parseInt(quoteId)
      };

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/contracts/${result.id}`);
      } else {
        setError(result.error || '계약서 생성에 실패했습니다.');
      }
    } catch (error) {
      setError('계약서 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setCreatingContract(false);
    }
  };

  if (loading && !contractData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">계약 데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 조항 분석 */}
        {contractData && (
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">조항 분석</h2>
            
            {/* 서비스 정보 */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">고객:</span>
                  <div className="font-medium">{contractData.client?.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">금액:</span>
                  <div className="font-medium text-purple-600">
                    {contractData.amount?.toLocaleString()}원
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">기간:</span>
                  <div className="font-medium">{contractData.duration}</div>
                </div>
              </div>
              
              {contractData.services && contractData.services.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">분석된 서비스:</p>
                  <div className="flex flex-wrap gap-2">
                    {contractData.services.map((service, idx) => (
                      <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                        {service.serviceName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 생성 방식 선택 */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">생성 방식 선택</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(GENERATION_OPTIONS).map(([key, option]) => {
                  const Icon = option.icon;
                  const isSelected = key === generationType;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setGenerationType(key)}
                      disabled={loading}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected ? option.color : option.inactiveColor
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Icon className="w-5 h-5" />
                        <div className="font-medium">{option.name}</div>
                      </div>
                      <div className="text-sm opacity-90 mb-2">{option.description}</div>
                      <div className="flex flex-wrap gap-1">
                        {option.benefits.map((benefit, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-white/20 rounded">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 길이 선택 카드 */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">계약서 상세도 선택</h3>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(CONTRACT_LENGTH_OPTIONS).map(([key, option]) => {
                  const Icon = option.icon;
                  const isSelected = key === contractLength;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setContractLength(key)}
                      disabled={loading}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        isSelected ? option.color : option.inactiveColor
                      } disabled:opacity-50`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-medium">{option.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 계약서 생성 버튼 */}
            <div className="text-center">
              <button
                onClick={handleGenerateContract}
                disabled={loading}
                className={`px-8 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center space-x-2 mx-auto ${
                  generationType === 'template' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>생성 중...</span>
                  </>
                ) : (
                  <>
                    {generationType === 'template' ? (
                      <Zap className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                    <span>
                      {GENERATION_OPTIONS[generationType].name} 생성 ({CONTRACT_LENGTH_OPTIONS[contractLength].name})
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 선택된 조항 목록 */}
        {isGenerated && (
          <ClauseSelector
            contractData={contractData}
            contractLength={contractLength}
            lengthOption={CONTRACT_LENGTH_OPTIONS[contractLength]}
            selectedClauses={selectedClauses}
            onClausesChange={handleClausesChange}
            onVariablesChange={handleVariablesChange}
            hideAnalysis={true}
          />
        )}

        {/* 하단 버튼 */}
        {isGenerated && (
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>이전 단계</span>
            </button>
            
            <button
              onClick={handleCreateContract}
              disabled={!Array.isArray(selectedClauses) || selectedClauses.length === 0 || creatingContract}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
            >
              {creatingContract ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>생성 중...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>계약서 최종 생성</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper 함수들 (기존과 동일)
function inferIndustry(services) {
  if (!services || services.length === 0) return 'general';
  
  const allText = services.map(s => 
    `${s.serviceName} ${s.serviceDescription}`.toLowerCase()
  ).join(' ');
  
  if (allText.includes('로고') || allText.includes('디자인') || allText.includes('브랜딩')) {
    return 'creative';
  }
  if (allText.includes('개발') || allText.includes('웹사이트') || allText.includes('앱') || allText.includes('쇼피파이')) {
    return 'development';
  }
  if (allText.includes('마케팅') || allText.includes('광고') || allText.includes('sns')) {
    return 'marketing';
  }
  if (allText.includes('컨설팅') || allText.includes('자문') || allText.includes('분석')) {
    return 'consulting';
  }
  
  return 'complex';
}

function generateSpecificRequirements(services) {
  if (!services || services.length === 0) return '';
  
  const requirements = [];
  
  services.forEach(service => {
    if (service.serviceDescription) {
      requirements.push(`${service.serviceName}: ${service.serviceDescription}`);
    }
  });
  
  return requirements.join('; ');
}

function generateFallbackClauses(contractData, contractLength = 'simple') {
  const services = contractData.services || [];
  const serviceDescription = services.length > 0 
    ? services.map(s => s.serviceName).join(', ')
    : contractData.serviceName;

  const baseClauses = [
    {
      id: 'fallback_purpose',
      title: '계약 목적',
      content: `본 계약은 발주자가 수행자에게 ${serviceDescription}을 의뢰하고, 수행자가 이를 성실히 수행함을 목적으로 한다.`,
      essential: true,
      order: 1
    },
    {
      id: 'fallback_payment',
      title: '계약금액',
      content: generatePaymentClause(contractData),
      essential: true,
      order: 2
    },
    {
      id: 'fallback_completion',
      title: '계약 완료',
      content: `모든 업무가 완료되고 발주자의 승인을 받은 시점에 계약이 종료된다.`,
      essential: true,
      order: 3
    }
  ];

  if (contractLength === 'detailed') {
    baseClauses.push(
      {
        id: 'fallback_detailed_scope',
        title: '세부 업무 범위',
        content: services.length > 0 
          ? services.map((s, i) => `${i + 1}. ${s.serviceName}: ${s.serviceDescription || '세부 내용 협의'}`).join('\n')
          : '세부 업무 범위는 별도 협의에 따라 결정한다.',
        essential: false,
        order: 4
      },
      {
        id: 'fallback_warranty',
        title: '하자보증',
        content: `수행자는 납품 완료 후 30일간 하자보증 의무를 진다. 하자 발견 시 무상으로 수정한다.`,
        essential: false,
        order: 5
      }
    );
  } else if (contractLength === 'standard') {
    baseClauses.push(
      {
        id: 'fallback_standard_warranty',
        title: '품질보증',
        content: `수행자는 완성된 결과물의 품질을 보증하며, 하자 발견 시 수정한다.`,
        essential: false,
        order: 4
      }
    );
  }

  return baseClauses;
}

function generatePaymentClause(contractData) {
  const amount = contractData.amount?.toLocaleString() || '0';
  const paymentTerms = contractData.paymentTerms;
  
  if (!paymentTerms || !paymentTerms.schedule || paymentTerms.schedule.length === 0) {
    return `계약 총액은 ${amount}원이며, 서비스 완료 후 지급한다.`;
  }
  
  const schedule = paymentTerms.schedule.sort((a, b) => a.order - b.order);
  
  if (schedule.length === 1) {
    return `계약 총액은 ${amount}원이며, 서비스 완료 후 지급한다.`;
  }
  
  const paymentSteps = schedule.map((step, index) => {
    if (index === 0) {
      return `계약금 ${step.percentage}%`;
    } else if (index === schedule.length - 1) {
      return `잔금 ${step.percentage}%`;
    } else {
      return `중도금 ${step.percentage}%`;
    }
  }).join(', ');
  
  return `계약 총액은 ${amount}원이며, ${paymentSteps}로 분할 지급한다.`;
}