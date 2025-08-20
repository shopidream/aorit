// lib/contractGenerator.js - 새로운 변수 기반 계약서 생성

import { 
  selectClausesByVariables, 
  selectClausesByPreset,
  smartInferVariables,
  analyzeVariableCombination,
  VARIABLES 
} from './clauseSelector.js';

/**
 * 메인 함수: 완전한 계약서 생성
 */
export async function generateCompleteContract(contractData, options = {}) {
  try {
    // 1. 변수 추론 또는 설정
    const variables = await processContractVariables(contractData, options);
    
    // 2. 조항 선택
    const clauseResult = selectClausesByVariables(variables, options);
    if (!clauseResult.success) {
      throw new Error(`조항 선택 실패: ${clauseResult.error}`);
    }

    // 3. 변수 치환
    const processedClauses = substitutePlaceholders(clauseResult.clauses, contractData);

    // 4. 계약서 정보 생성
    const contractInfo = generateContractInfo(contractData, variables);

    return {
      success: true,
      contractInfo,
      clauses: processedClauses,
      variables,
      metadata: {
        totalClauses: processedClauses.length,
        riskLevel: analyzeVariableCombination(variables).risk_level,
        generatedAt: new Date().toISOString(),
        version: '2.0'
      }
    };

  } catch (error) {
    console.error('계약서 생성 오류:', error);
    return {
      success: false,
      error: error.message,
      contractInfo: generateFallbackContractInfo(contractData),
      clauses: getFallbackClauses(),
      variables: {},
      metadata: { fallback: true }
    };
  }
}

/**
 * 프리셋으로 계약서 생성
 */
export async function generateContractFromPreset(presetName, contractData, customVariables = {}) {
  try {
    const clauseResult = selectClausesByPreset(presetName, customVariables);
    if (!clauseResult.success) {
      throw new Error(`프리셋 선택 실패: ${clauseResult.error}`);
    }

    const processedClauses = substitutePlaceholders(clauseResult.clauses, contractData);
    const contractInfo = generateContractInfo(contractData, clauseResult.metadata.variables);

    return {
      success: true,
      contractInfo,
      clauses: processedClauses,
      variables: clauseResult.metadata.variables,
      preset: presetName,
      metadata: {
        totalClauses: processedClauses.length,
        usedPreset: presetName,
        generatedAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('프리셋 계약서 생성 오류:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 변수 처리 (추론 또는 직접 설정)
 */
async function processContractVariables(contractData, options) {
  // 1. 직접 변수 제공된 경우
  if (contractData.variables && isValidVariables(contractData.variables)) {
    return contractData.variables;
  }

  // 2. 스마트 추론
  if (contractData.serviceDescription) {
    const inferred = smartInferVariables(contractData.serviceDescription, {
      amount: contractData.amount,
      duration: contractData.duration
    });
    
    // 부분적으로 제공된 변수와 병합
    return { ...inferred, ...(contractData.variables || {}) };
  }

  // 3. 기본값 사용
  return getDefaultVariables();
}

/**
 * 변수 유효성 검사
 */
function isValidVariables(variables) {
  const requiredVars = Object.keys(VARIABLES);
  return requiredVars.every(varType => 
    variables[varType] && VARIABLES[varType].values.includes(variables[varType])
  );
}

/**
 * 기본 변수 설정
 */
function getDefaultVariables() {
  return {
    execution_cycle: 'single',
    service_type: 'service',
    complexity: 'medium',
    project_scale: 'small',
    location: 'hybrid',
    equipment: 'intangible'
  };
}

/**
 * 플레이스홀더 치환
 */
function substitutePlaceholders(clauses, contractData) {
  const substitutionData = generateSubstitutionData(contractData);
  
  return clauses.map(clause => ({
    ...clause,
    content: replacePlaceholders(clause.content, substitutionData)
  }));
}

/**
 * 치환 데이터 생성
 */
function generateSubstitutionData(contractData) {
  const payment = calculatePaymentSchedule(contractData.amount || 0);
  const dates = calculateProjectDates(contractData.startDate, contractData.duration);
  
  return {
    // 기본 정보
    serviceName: contractData.serviceName || contractData.service?.title || '전문 서비스',
    serviceDescription: contractData.serviceDescription || '전문적인 서비스 제공',
    clientName: contractData.client?.name || contractData.clientName || '발주자',
    providerName: contractData.provider?.name || contractData.providerName || '수행자',
    contactInfo: formatContactInfo(contractData),
    
    // 금액 정보
    totalAmount: (contractData.amount || 0).toLocaleString(),
    totalAmountNum: contractData.amount || 0,
    downPaymentRate: payment.downRate,
    middlePaymentRate: payment.middleRate, 
    finalPaymentRate: payment.finalRate,
    downPaymentAmount: payment.downAmount.toLocaleString(),
    middlePaymentAmount: payment.middleAmount.toLocaleString(),
    finalPaymentAmount: payment.finalAmount.toLocaleString(),
    
    // 일정 정보
    startDate: dates.startDate,
    endDate: dates.endDate,
    duration: contractData.duration || '30일',
    
    // 프로젝트 세부사항
    workLocation: contractData.workLocation || '지정 장소',
    serviceCycle: contractData.serviceCycle || '월 1회',
    noticePeriod: getNoticePeriod(contractData.amount),
    renewalNotice: '30일',
    
    // 품질 관련
    maxRevisions: getMaxRevisions(contractData.amount, contractData.serviceType),
    warrantyPeriod: getWarrantyPeriod(contractData.serviceType),
    warrantyResponseTime: '24시간',
    warrantyFixTime: '72시간',
    
    // 결과물 관련  
    deliverableSpecs: contractData.deliverableSpecs || '계약서에 명시된 규격',
    qualityStandards: contractData.qualityStandards || '업계 표준 품질',
    deliverableFormat: getDeliverableFormat(contractData.serviceType),
    deliveryMethod: getDeliveryMethod(contractData.location),
    
    // 작업 관련
    workScope: contractData.workScope || '계약서에 명시된 업무 범위',
    performanceMethod: contractData.performanceMethod || '전문적 방법론 적용',
    completionCriteria: contractData.completionCriteria || '발주자 승인 완료',
    consultingScope: contractData.consultingScope || '전문 분야 자문',
    
    // 마일스톤
    milestones: generateMilestones(contractData.duration),
    
    // 비용 관련
    travelExpense: contractData.travelExpense || '실비 지급',
    hourlyRate: contractData.hourlyRate || '50,000',
    onsiteRatio: '60%',
    remoteRatio: '40%',
    
    // 성과 관련
    performanceKPI: contractData.performanceKPI || '계약 목표 달성도',
    evaluationPeriod: '30일',
    
    // 법적 정보
    jurisdiction: contractData.jurisdiction || '서울중앙지방법원'
  };
}

/**
 * 플레이스홀더 교체
 */
function replacePlaceholders(content, data) {
  if (!content || typeof content !== 'string') return '';
  
  let result = content;
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, String(value || ''));
  });
  
  // 남은 플레이스홀더 제거
  result = result.replace(/{[^}]+}/g, '[정보 없음]');
  
  return result;
}

/**
 * 결제 일정 계산
 */
function calculatePaymentSchedule(amount) {
  let downRate, middleRate, finalRate;
  
  if (amount < 1000000) {
    // 100만원 미만: 완료 후 일괄
    downRate = 0; middleRate = 0; finalRate = 100;
  } else if (amount < 5000000) {
    // 500만원 미만: 착수 30% + 완료 70%
    downRate = 30; middleRate = 0; finalRate = 70;
  } else {
    // 500만원 이상: 착수 30% + 중간 40% + 완료 30%
    downRate = 30; middleRate = 40; finalRate = 30;
  }
  
  return {
    downRate,
    middleRate,
    finalRate,
    downAmount: Math.round(amount * downRate / 100),
    middleAmount: Math.round(amount * middleRate / 100),
    finalAmount: Math.round(amount * finalRate / 100)
  };
}

/**
 * 프로젝트 일정 계산
 */
function calculateProjectDates(startDate, duration) {
  const start = startDate ? new Date(startDate) : new Date();
  const totalDays = parseDurationToDays(duration || '30일');
  
  const end = new Date(start);
  end.setDate(end.getDate() + totalDays);
  
  return {
    startDate: start.toLocaleDateString('ko-KR'),
    endDate: end.toLocaleDateString('ko-KR')
  };
}

/**
 * 연락처 정보 포맷팅
 */
function formatContactInfo(contractData) {
  const parts = [];
  
  if (contractData.provider?.email || contractData.providerEmail) {
    parts.push(`이메일: ${contractData.provider?.email || contractData.providerEmail}`);
  }
  
  if (contractData.provider?.phone || contractData.providerPhone) {
    parts.push(`전화: ${contractData.provider?.phone || contractData.providerPhone}`);
  }
  
  return parts.length > 0 ? parts.join(', ') : '연락처 정보';
}

/**
 * 통지 기간 계산
 */
function getNoticePeriod(amount) {
  if (amount >= 10000000) return '30일';
  if (amount >= 3000000) return '14일';
  return '7일';
}

/**
 * 최대 수정 횟수
 */
function getMaxRevisions(amount, serviceType) {
  if (serviceType === 'consulting') return '1';
  if (amount >= 5000000) return '3';
  if (amount >= 1000000) return '2';
  return '1';
}

/**
 * 하자보증 기간
 */
function getWarrantyPeriod(serviceType) {
  switch (serviceType) {
    case 'manufacturing': return '3개월';
    case 'service': return '1개월';
    case 'consulting': return '해당없음';
    default: return '1개월';
  }
}

/**
 * 결과물 형식
 */
function getDeliverableFormat(serviceType) {
  switch (serviceType) {
    case 'manufacturing': return '완성된 결과물 파일';
    case 'service': return '작업 완료 확인서';
    case 'consulting': return '분석 보고서';
    default: return '약정된 형식';
  }
}

/**
 * 전달 방법
 */
function getDeliveryMethod(location) {
  switch (location) {
    case 'remote': return '온라인 전송';
    case 'onsite': return '현장 직접 전달';
    case 'hybrid': return '온라인 및 현장 전달';
    default: return '협의된 방법';
  }
}

/**
 * 마일스톤 생성
 */
function generateMilestones(duration) {
  const days = parseDurationToDays(duration || '30일');
  
  if (days <= 14) {
    return '중간 점검';
  } else if (days <= 60) {
    return '1차 결과물 완성, 2차 수정 적용';
  } else {
    return '기획 완료, 1차 결과물, 2차 수정, 최종 완성';
  }
}

/**
 * 기간 파싱
 */
function parseDurationToDays(duration) {
  if (!duration || typeof duration !== 'string') return 30;
  
  const matches = duration.match(/(\d+)\s*(일|주|개월|월)/);
  if (!matches) return 30;
  
  const [, num, unit] = matches;
  const number = parseInt(num);
  if (isNaN(number)) return 30;
  
  switch (unit) {
    case '일': return number;
    case '주': return number * 7;
    case '개월':
    case '월': return number * 30;
    default: return 30;
  }
}

/**
 * 계약서 정보 생성
 */
function generateContractInfo(contractData, variables) {
  return {
    title: generateContractTitle(contractData, variables),
    client: {
      name: contractData.client?.name || contractData.clientName || '발주자',
      email: contractData.client?.email || contractData.clientEmail || '',
      phone: contractData.client?.phone || contractData.clientPhone || ''
    },
    provider: {
      name: contractData.provider?.name || contractData.providerName || '수행자',
      email: contractData.provider?.email || contractData.providerEmail || '',
      phone: contractData.provider?.phone || contractData.providerPhone || ''
    },
    project: {
      title: contractData.serviceName || contractData.service?.title || '전문 서비스',
      description: contractData.serviceDescription || contractData.service?.description || '',
      amount: contractData.amount || 0,
      duration: contractData.duration || '30일',
      category: getServiceCategory(variables.service_type)
    },
    variables
  };
}

/**
 * 계약서 제목 생성
 */
function generateContractTitle(contractData, variables) {
  const serviceName = contractData.serviceName || contractData.service?.title || '서비스';
  const typeLabel = getServiceTypeLabel(variables.service_type);
  
  return `${serviceName} ${typeLabel} 계약서`;
}

/**
 * 서비스 타입 라벨
 */
function getServiceTypeLabel(serviceType) {
  switch (serviceType) {
    case 'manufacturing': return '제작';
    case 'service': return '용역';
    case 'consulting': return '컨설팅';
    case 'complex': return '종합서비스';
    default: return '제공';
  }
}

/**
 * 서비스 카테고리
 */
function getServiceCategory(serviceType) {
  switch (serviceType) {
    case 'manufacturing': return 'creative';
    case 'service': return 'service';
    case 'consulting': return 'consulting';
    case 'complex': return 'complex';
    default: return 'general';
  }
}

/**
 * Fallback 계약서 정보
 */
function generateFallbackContractInfo(contractData) {
  return {
    title: '서비스 제공 계약서',
    client: { name: '발주자', email: '', phone: '' },
    provider: { name: '수행자', email: '', phone: '' },
    project: {
      title: '전문 서비스',
      description: '',
      amount: contractData?.amount || 0,
      duration: '30일',
      category: 'general'
    }
  };
}

/**
 * Fallback 조항들
 */
function getFallbackClauses() {
  return [
    {
      id: 'fallback_purpose',
      title: '계약 목적',
      content: '본 계약은 발주자와 수행자 간의 서비스 제공을 목적으로 한다.',
      essential: true,
      order: 1
    },
    {
      id: 'fallback_payment',
      title: '대금 지급',
      content: '서비스 완료 후 계약 금액을 지급한다.',
      essential: true,
      order: 2
    }
  ];
}

/**
 * HTML 계약서 생성
 */
export function generateContractHTML(contractResult) {
  if (!contractResult.success) {
    return generateErrorHTML(contractResult.error);
  }

  const { contractInfo, clauses } = contractResult;
  
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${contractInfo.title}</title>
    <style>
        body { 
            font-family: 'Malgun Gothic', sans-serif; 
            line-height: 1.8; 
            margin: 0; 
            padding: 40px;
            background-color: #f8f9fa;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white;
            padding: 60px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
            text-align: center; 
            margin-bottom: 50px; 
            border-bottom: 2px solid #8B5CF6;
            padding-bottom: 30px;
        }
        .header h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 20px;
        }
        .parties {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding: 20px;
            background-color: #f3f4f6;
            border-radius: 8px;
        }
        .party {
            text-align: center;
        }
        .party-label {
            font-weight: bold;
            color: #8B5CF6;
            margin-bottom: 8px;
        }
        .clause { 
            margin: 30px 0; 
            padding: 25px; 
            border-left: 4px solid #8B5CF6;
            background-color: #faf9ff;
            border-radius: 0 8px 8px 0;
        }
        .clause h4 { 
            color: #8B5CF6; 
            margin-bottom: 15px;
            font-size: 18px;
        }
        .clause-content {
            color: #374151;
            white-space: pre-line;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${contractInfo.title}</h1>
            <div class="parties">
                <div class="party">
                    <div class="party-label">발주자 (갑)</div>
                    <div>${contractInfo.client.name}</div>
                </div>
                <div class="party">
                    <div class="party-label">수행자 (을)</div>
                    <div>${contractInfo.provider.name}</div>
                </div>
            </div>
        </div>
        
        <div class="clauses">
            ${clauses.map((clause, index) => `
                <div class="clause">
                    <h4>제${index + 1}조 (${clause.title})</h4>
                    <div class="clause-content">${clause.content}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            본 계약서는 ${new Date().toLocaleDateString('ko-KR')}에 생성되었습니다.
        </div>
    </div>
</body>
</html>`;
}

/**
 * 에러 HTML 생성
 */
function generateErrorHTML(error) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>계약서 생성 오류</title>
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; text-align: center; }
        .error { color: #dc2626; margin-top: 40px; }
    </style>
</head>
<body>
    <h1>계약서 생성 중 오류가 발생했습니다</h1>
    <div class="error">${error}</div>
</body>
</html>`;
}

/**
 * 데이터 검증
 */
export function validateContractData(contractData) {
  const errors = [];
  const warnings = [];
  
  // 필수 필드 검사
  if (!contractData.client?.name && !contractData.clientName) {
    errors.push('발주자 이름이 필요합니다');
  }
  
  if (!contractData.provider?.name && !contractData.providerName) {
    errors.push('수행자 이름이 필요합니다');
  }
  
  if (!contractData.serviceName && !contractData.service?.title) {
    warnings.push('서비스명이 없습니다');
  }
  
  if (!contractData.amount || contractData.amount <= 0) {
    warnings.push('계약 금액이 설정되지 않았습니다');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 계약서 미리보기 생성
 */
export function generateContractPreview(contractData) {
  try {
    const variables = smartInferVariables(
      contractData.serviceDescription || '전문 서비스',
      { amount: contractData.amount, duration: contractData.duration }
    );
    
    const analysis = analyzeVariableCombination(variables);
    
    let preview = `📄 ${contractData.serviceName || '서비스'} 계약서\n\n`;
    preview += `👥 발주자: ${contractData.client?.name || contractData.clientName || '발주자'}\n`;
    preview += `👥 수행자: ${contractData.provider?.name || contractData.providerName || '수행자'}\n`;
    preview += `💰 금액: ${(contractData.amount || 0).toLocaleString()}원\n`;
    preview += `📅 기간: ${contractData.duration || '30일'}\n\n`;
    
    preview += `🔧 추론된 변수:\n`;
    Object.entries(variables).forEach(([key, value]) => {
      const label = VARIABLES[key]?.labels[value] || value;
      preview += `• ${key}: ${label}\n`;
    });
    
    preview += `\n⚡ 위험도: ${analysis.risk_level}\n`;
    preview += `📊 복잡도: ${analysis.complexity_score}/10\n`;
    
    if (analysis.recommendations.length > 0) {
      preview += `\n💡 권장사항:\n`;
      analysis.recommendations.forEach(rec => {
        preview += `• ${rec}\n`;
      });
    }
    
    return preview;
    
  } catch (error) {
    return '미리보기를 생성할 수 없습니다.';
  }
}