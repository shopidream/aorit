// lib/templateProcessor.js - 템플릿 변수 치환 시스템
import { convertToKoreanMoney } from '../lib/koreanFormUtils.js';

// 변수 매핑 정의
const VARIABLE_MAPPINGS = {
  // 기본 정보
  'clientName': (data) => data.client?.name || '발주자',
  'clientCompany': (data) => data.client?.company || '',
  'clientEmail': (data) => data.client?.email || '',
  'clientPhone': (data) => data.client?.phone || '',
  'providerName': (data) => data.provider?.name || '수행자',
  'providerCompany': (data) => data.provider?.company || '',
  'providerEmail': (data) => data.provider?.email || '',
  'providerPhone': (data) => data.provider?.phone || '',
  
  // 계약 정보
  'contractAmount': (data) => formatAmount(data.amount),
  'contractAmountKorean': (data) => formatAmountWithKorean(data.amount),
  'contractDuration': (data) => data.duration || '30일',
  'contractDate': () => formatDate(new Date()),
  'deliveryDate': (data) => calculateDeliveryDate(data),
  'inspectionPeriod': (data) => data.inspectionDays || '10일',
  
  // 서비스 정보
  'serviceName': (data) => getMainServiceName(data.services),
  'serviceDescription': (data) => getServiceDescription(data.services),
  'serviceList': (data) => formatServiceList(data.services),
  
  // 지급 조건
  'contractPayment': (data) => formatPaymentAmount(data, 'contract'),
  'progressPayment': (data) => formatPaymentAmount(data, 'progress'),
  'finalPayment': (data) => formatPaymentAmount(data, 'final'),
  'contractPaymentTiming': (data) => data.paymentTerms?.contractTiming || '계약과 동시',
  'progressPaymentTiming': (data) => data.paymentTerms?.progressTiming || '중간 납품 시',
  'finalPaymentTiming': (data) => data.paymentTerms?.finalTiming || '검수완료시',
  
  // 기타
  'currentYear': () => new Date().getFullYear().toString(),
  'currentMonth': () => (new Date().getMonth() + 1).toString(),
  'currentDay': () => new Date().getDate().toString(),
};

// 금액 포맷팅
function formatAmount(amount) {
  if (!amount || amount === 0) return '0원';
  return `${amount.toLocaleString()}원`;
}

function formatAmountWithKorean(amount) {
  if (!amount || amount === 0) return '0원(영원, 부가세별도)';
  const korean = convertToKoreanMoney(amount);
  return `${amount.toLocaleString()}원(${korean}, 부가세별도)`;
}

// 지급 조건별 금액 계산
function formatPaymentAmount(data, paymentType) {
  const amount = data.amount || 0;
  const paymentTerms = data.paymentTerms || {};
  
  let percentage = 0;
  switch (paymentType) {
    case 'contract':
      percentage = paymentTerms.contractPercentage || 0;
      break;
    case 'progress':
      percentage = paymentTerms.progressPercentage || 0;
      break;
    case 'final':
      percentage = paymentTerms.finalPercentage || 0;
      break;
  }
  
  if (percentage === 0) return '0원';
  
  const paymentAmount = Math.round(amount * percentage / 100);
  return formatAmountWithKorean(paymentAmount);
}

// 날짜 포맷팅
function formatDate(date, addDays = 0) {
  const targetDate = new Date(date);
  targetDate.setDate(targetDate.getDate() + addDays);
  
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();
  
  return `${year}년 ${month}월 ${day}일`;
}

// 납품일 계산
function calculateDeliveryDate(data) {
  const deliveryDays = data.deliveryDays || 30;
  return formatDate(new Date(), deliveryDays);
}

// 서비스 정보 처리
function getMainServiceName(services) {
  if (!services || services.length === 0) return '서비스';
  
  if (services.length === 1) {
    return services[0].serviceName || services[0].name || '서비스';
  }
  
  return `${services.length}개 서비스 통합 패키지`;
}

function getServiceDescription(services) {
  if (!services || services.length === 0) return '전문 서비스';
  
  return services.map((service, index) => {
    const name = service.serviceName || service.name || '서비스';
    const desc = service.serviceDescription || service.description || '';
    return `${index + 1}. ${name}${desc ? ': ' + desc : ''}`;
  }).join('\n');
}

function formatServiceList(services) {
  if (!services || services.length === 0) return '- 전문 서비스';
  
  return services.map(service => {
    const name = service.serviceName || service.name || '서비스';
    return `- ${name}`;
  }).join('\n');
}

// 변수 추출 (템플릿에서 {{variable}} 형태 찾기)
export function extractVariables(templateContent) {
  const variablePattern = /\{\{(\w+)\}\}/g;
  const variables = [];
  let match;
  
  while ((match = variablePattern.exec(templateContent)) !== null) {
    const variableName = match[1];
    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }
  
  return variables;
}

// 단일 변수 치환
export function replaceVariable(content, variableName, value) {
  const pattern = new RegExp(`\\{\\{${variableName}\\}\\}`, 'g');
  return content.replace(pattern, value || '');
}

// 모든 변수 치환
export function processTemplate(templateContent, contractData) {
  let processedContent = templateContent;
  
  // 템플릿에서 사용된 변수들 추출
  const variables = extractVariables(templateContent);
  
  // 각 변수를 실제 값으로 치환
  variables.forEach(variableName => {
    const mapper = VARIABLE_MAPPINGS[variableName];
    let value = '';
    
    if (mapper) {
      try {
        value = mapper(contractData);
      } catch (error) {
        console.warn(`변수 ${variableName} 처리 오류:`, error);
        value = `[${variableName}]`; // 오류 시 변수명 그대로 표시
      }
    } else {
      console.warn(`알 수 없는 변수: ${variableName}`);
      value = `[${variableName}]`;
    }
    
    processedContent = replaceVariable(processedContent, variableName, value);
  });
  
  return processedContent;
}

// 템플릿 조항들을 실제 계약서 조항으로 변환
export function processTemplateToContract(templates, contractData) {
  console.log('템플릿 처리 시작:', templates.length, '개 조항');
  
  const processedClauses = templates.map((template, index) => {
    try {
      // 템플릿 내용 처리
      const processedContent = processTemplate(template.content, contractData);
      
      // 템플릿 변수 정보 파싱
      let variables = [];
      try {
        variables = JSON.parse(template.variables || '[]');
      } catch (error) {
        console.warn('변수 파싱 오류:', error);
      }
      
      // 계약서 조항 객체 생성
      const clause = {
        number: index + 1,
        title: template.title,
        content: processedContent,
        category: template.category,
        essential: template.type === 'standard',
        templateId: template.id,
        originalTemplate: template.content,
        processedVariables: variables,
        order: index + 1
      };
      
      return clause;
      
    } catch (error) {
      console.error(`템플릿 ${template.id} 처리 오류:`, error);
      
      // 오류 시 기본 조항 반환
      return {
        number: index + 1,
        title: template.title || '조항',
        content: template.content || '',
        category: template.category || 'other',
        essential: false,
        templateId: template.id,
        error: error.message,
        order: index + 1
      };
    }
  });
  
  console.log('템플릿 처리 완료:', processedClauses.length, '개 조항');
  
  return processedClauses;
}

// 사용자 정의 변수 처리 (동적 변수 지원)
export function processCustomVariables(content, customVariables = {}) {
  let processedContent = content;
  
  Object.entries(customVariables).forEach(([key, value]) => {
    processedContent = replaceVariable(processedContent, key, value);
  });
  
  return processedContent;
}

// 조건부 텍스트 처리 (예: {{#if variable}}텍스트{{/if}})
export function processConditionalText(content, contractData) {
  // 간단한 조건부 텍스트 구현
  const conditionalPattern = /\{\{#if (\w+)\}\}(.*?)\{\{\/if\}\}/gs;
  
  return content.replace(conditionalPattern, (match, condition, text) => {
    const value = VARIABLE_MAPPINGS[condition]?.(contractData);
    return value ? text : '';
  });
}

// 템플릿 검증 (변수 누락 등 체크)
export function validateTemplate(templateContent, contractData) {
  const issues = [];
  const variables = extractVariables(templateContent);
  
  // 알 수 없는 변수 체크
  variables.forEach(variable => {
    if (!VARIABLE_MAPPINGS[variable]) {
      issues.push(`알 수 없는 변수: ${variable}`);
    }
  });
  
  // 필수 데이터 체크
  const requiredFields = ['client', 'provider', 'amount'];
  requiredFields.forEach(field => {
    if (!contractData[field]) {
      issues.push(`필수 데이터 누락: ${field}`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    missingVariables: variables.filter(v => !VARIABLE_MAPPINGS[v])
  };
}

// 변수 목록 조회 (관리자용)
export function getAvailableVariables() {
  return Object.keys(VARIABLE_MAPPINGS).map(key => ({
    name: key,
    description: getVariableDescription(key),
    example: getVariableExample(key)
  }));
}

function getVariableDescription(variableName) {
  const descriptions = {
    'clientName': '고객 이름',
    'clientCompany': '고객 회사명',
    'contractAmount': '계약 금액 (숫자)',
    'contractAmountKorean': '계약 금액 (한글 표기)',
    'serviceName': '주요 서비스명',
    'contractDate': '계약 체결일',
    'deliveryDate': '납품 예정일'
  };
  
  return descriptions[variableName] || '사용자 정의 변수';
}

function getVariableExample(variableName) {
  const examples = {
    'clientName': '홍길동',
    'clientCompany': '(주)테스트컴퍼니',
    'contractAmount': '3,000,000원',
    'contractAmountKorean': '3,000,000원(삼백만원, 부가세별도)',
    'serviceName': '쇼피파이 스토어 제작',
    'contractDate': '2025년 8월 16일',
    'deliveryDate': '2025년 9월 15일'
  };
  
  return examples[variableName] || '변수값';
}

export default {
  processTemplate,
  processTemplateToContract,
  processCustomVariables,
  processConditionalText,
  validateTemplate,
  extractVariables,
  replaceVariable,
  getAvailableVariables
};