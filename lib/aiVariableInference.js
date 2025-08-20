// lib/aiVariableInference.js - Claude Haiku 기반 변수 추론 전담 모듈

/**
 * 6개 기본 변수 정의
 */
const CORE_VARIABLES = {
  execution_cycle: {
    values: ['single', 'continuous', 'periodic'],
    labels: {
      single: '단발성 완료',
      continuous: '지속적 서비스', 
      periodic: '주기적 갱신'
    }
  },
  service_type: {
    values: ['manufacturing', 'service', 'consulting', 'complex'],
    labels: {
      manufacturing: '제조형 (결과물)',
      service: '용역형 (작업)',
      consulting: '자문형 (조언)',
      complex: '복합형'
    }
  },
  complexity: {
    values: ['simple', 'medium', 'complex'],
    labels: {
      simple: '단순',
      medium: '표준',
      complex: '복합'
    }
  },
  project_scale: {
    values: ['small', 'medium', 'large'],
    labels: {
      small: '소규모',
      medium: '중간규모', 
      large: '대규모'
    }
  },
  location: {
    values: ['remote', 'onsite', 'hybrid'],
    labels: {
      remote: '원격작업',
      onsite: '현장작업',
      hybrid: '혼합작업'
    }
  },
  equipment: {
    values: ['intangible', 'small', 'large'],
    labels: {
      intangible: '무형서비스',
      small: '소규모 장비',
      large: '대형/고가 장비'
    }
  }
};

/**
 * Claude Haiku로 6개 핵심 변수 추론
 */
export async function smartInferVariables(serviceDescription, contractContext = {}) {
  try {
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      console.warn('CLAUDE_API_KEY가 설정되지 않음, 기본값 사용');
      return getDefaultVariables();
    }

    const prompt = generateVariableInferencePrompt(serviceDescription, contractContext);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API 오류: ${response.status}`);
    }

    const result = await response.json();
    const content = result.content[0]?.text;

    if (!content) {
      throw new Error('Claude로부터 응답을 받지 못했습니다');
    }

    return parseClaudeVariableResponse(content);

  } catch (error) {
    console.error('변수 추론 오류:', error);
    return getDefaultVariables();
  }
}

/**
 * 변수 추론 프롬프트 생성
 */
function generateVariableInferencePrompt(serviceDescription, context) {
  const { amount, duration, industry } = context;
  
  return `한국 계약서 변수 추론 전문가로서, 다음 서비스 정보를 분석하여 6개 핵심 변수를 정확히 추론해주세요.

**서비스 정보:**
- 서비스 설명: ${serviceDescription}
- 계약 금액: ${amount ? `${amount.toLocaleString()}원` : '미정'}
- 작업 기간: ${duration || '미정'}
- 업종: ${industry || '미정'}

**추론할 6개 변수:**

1. **execution_cycle** (실행 주기)
   - single: 한 번 완료하고 끝 (로고 디자인, 웹사이트 개발 등)
   - continuous: 지속적 서비스 (유지보수, 관리 업무 등)
   - periodic: 주기적 갱신 (월간 컨설팅, 정기 청소 등)

2. **service_type** (서비스 형태)
   - manufacturing: 결과물 제작 (디자인, 개발, 제조 등)
   - service: 작업 수행 (청소, 설치, 수리 등)
   - consulting: 자문/조언 (컨설팅, 교육, 분석 등)
   - complex: 복합 서비스 (여러 형태 조합)

3. **complexity** (복잡도)
   - simple: 단순 작업 (기본 로고, 간단한 웹페이지)
   - medium: 표준 작업 (브랜딩 패키지, 일반 웹사이트)
   - complex: 복합 작업 (대규모 시스템, 종합 컨설팅)

4. **project_scale** (프로젝트 규모)
   - small: 소규모 (300만원 미만, 1개월 이내)
   - medium: 중간규모 (300만원~1000만원, 1-3개월)
   - large: 대규모 (1000만원 이상, 3개월 이상)

5. **location** (작업 장소)
   - remote: 원격 작업 (디자인, 개발, 온라인 컨설팅)
   - onsite: 현장 작업 (설치, 청소, 현장 컨설팅)
   - hybrid: 혼합 작업 (기획은 원격, 실행은 현장)

6. **equipment** (장비/자재)
   - intangible: 무형 서비스 (디자인, 컨설팅, 소프트웨어)
   - small: 소규모 장비 (기본 도구, 소량 자재)
   - large: 대형/고가 장비 (전문 기계, 고가 장비)

**응답 형식:**
JSON만 출력하세요. 설명은 제외하고 다음 형식으로만 답변:

{
  "execution_cycle": "값",
  "service_type": "값", 
  "complexity": "값",
  "project_scale": "값",
  "location": "값",
  "equipment": "값"
}`;
}

/**
 * Claude 응답 파싱
 */
function parseClaudeVariableResponse(content) {
  try {
    let jsonStr = content;
    
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
    }

    const variables = JSON.parse(jsonStr);
    const validatedVars = validateAndCleanVariables(variables);
    
    console.log('Claude 변수 추론 성공:', validatedVars);
    return validatedVars;

  } catch (error) {
    console.error('Claude 응답 파싱 실패:', error);
    return getDefaultVariables();
  }
}

/**
 * 변수 유효성 검증 및 정리
 */
function validateAndCleanVariables(variables) {
  const validated = {};
  
  Object.entries(CORE_VARIABLES).forEach(([key, definition]) => {
    const value = variables[key];
    
    if (value && definition.values.includes(value)) {
      validated[key] = value;
    } else {
      validated[key] = definition.values[0];
      console.warn(`변수 ${key}의 값 '${value}'가 유효하지 않음. 기본값 '${definition.values[0]}' 사용`);
    }
  });
  
  return validated;
}

/**
 * 기본 변수 설정
 */
function getDefaultVariables() {
  return {
    execution_cycle: 'single',
    service_type: 'manufacturing',
    complexity: 'medium',
    project_scale: 'small',
    location: 'remote',
    equipment: 'intangible'
  };
}

/**
 * 변수 조합 분석
 */
export function analyzeVariableCombination(variables) {
  let riskScore = 0;
  let complexityScore = 0;
  const recommendations = [];
  
  if (variables.project_scale === 'large') riskScore += 3;
  if (variables.complexity === 'complex') riskScore += 3;
  if (variables.equipment === 'large') riskScore += 2;
  if (variables.location === 'onsite') riskScore += 1;
  
  const complexityMap = { simple: 2, medium: 5, complex: 8 };
  const scaleMap = { small: 1, medium: 3, large: 5 };
  
  complexityScore = complexityMap[variables.complexity] + scaleMap[variables.project_scale];
  
  if (variables.equipment === 'large') {
    recommendations.push('장비 손해배상보험 가입 권장');
  }
  
  if (variables.project_scale === 'large' && variables.complexity === 'complex') {
    recommendations.push('전담 프로젝트 매니저 배정 권장');
  }
  
  if (variables.location === 'onsite') {
    recommendations.push('현장 안전 관리 조항 포함 권장');
  }

  return {
    risk_level: riskScore >= 6 ? 'high' : riskScore >= 3 ? 'medium' : 'low',
    complexity_score: Math.min(complexityScore, 10),
    recommendations,
    total_risk_score: riskScore
  };
}

/**
 * 변수 조합 검증
 */
export function validateVariableCombination(variables) {
  const errors = [];
  const warnings = [];
  
  Object.keys(CORE_VARIABLES).forEach(key => {
    if (!variables[key]) {
      errors.push(`${key} 변수가 누락되었습니다`);
    } else if (!CORE_VARIABLES[key].values.includes(variables[key])) {
      errors.push(`${key}의 값 '${variables[key]}'이 유효하지 않습니다`);
    }
  });
  
  if (variables.equipment === 'intangible' && variables.location === 'onsite') {
    warnings.push('무형 서비스는 보통 원격 작업에 적합합니다');
  }
  
  if (variables.project_scale === 'small' && variables.complexity === 'complex') {
    warnings.push('소규모 프로젝트에 복잡한 복잡도는 일반적이지 않습니다');
  }
  
  if (variables.service_type === 'consulting' && variables.equipment !== 'intangible') {
    warnings.push('컨설팅 서비스는 보통 무형 서비스입니다');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 변수 레이블 가져오기
 */
export function getVariableLabels(variables) {
  const labels = {};
  
  Object.entries(variables).forEach(([key, value]) => {
    if (CORE_VARIABLES[key] && CORE_VARIABLES[key].labels[value]) {
      labels[key] = CORE_VARIABLES[key].labels[value];
    } else {
      labels[key] = value;
    }
  });
  
  return labels;
}