import { 
    PRESET_COMBINATIONS,
    selectClausesForVariables,
    getPresetClauses,
    validateVariableCombination
  } from '../data/clauses/KR/variableMappings.js';
  
  import { ALL_CLAUSES } from '../data/clauses/KR/variableBased.js';
  
  export const VARIABLES = {
    execution_cycle: {
      values: ['single', 'continuous', 'periodic'],
      labels: {
        single: '단발성',
        continuous: '지속성', 
        periodic: '주기성'
      }
    },
    service_type: {
      values: ['manufacturing', 'service', 'consulting', 'complex'],
      labels: {
        manufacturing: '제조형',
        service: '용역형',
        consulting: '자문형',
        complex: '복합형'
      }
    },
    complexity: {
      values: ['simple', 'medium', 'complex'],
      labels: {
        simple: '단순',
        medium: '중간',
        complex: '복합'
      }
    },
    project_scale: {
      values: ['small', 'medium', 'large'],
      labels: {
        small: '소규모',
        medium: '중간',
        large: '대규모'
      }
    },
    location: {
      values: ['remote', 'onsite', 'hybrid'],
      labels: {
        remote: '원격',
        onsite: '현장',
        hybrid: '혼합'
      }
    },
    equipment: {
      values: ['intangible', 'small', 'large'],
      labels: {
        intangible: '무형',
        small: '소규모',
        large: '대형·고가'
      }
    }
  };
  
  export function selectClausesByVariables(variables, options = {}) {
    try {
      const validation = validateVariableCombination(variables);
      if (!validation.isValid) {
        console.warn('변수 조합 경고:', validation.errors);
      }
  
      const selectedClauseIds = selectClausesForVariables(variables);
      
      const clauses = selectedClauseIds
        .map(id => ALL_CLAUSES[id])
        .filter(clause => clause != null)
        .sort((a, b) => (a.order || 999) - (b.order || 999));
  
      const finalClauses = applyOptions(clauses, options);
  
      return {
        success: true,
        clauses: finalClauses,
        metadata: {
          selectedCount: finalClauses.length,
          variables,
          validation,
          appliedOptions: options
        }
      };
  
    } catch (error) {
      console.error('조항 선택 오류:', error);
      return {
        success: false,
        error: error.message,
        clauses: getFailsafeClauses()
      };
    }
  }
  
  export function selectClausesByPreset(presetName, customVariables = {}) {
    try {
      const presetData = getPresetClauses(presetName);
      if (!presetData) {
        throw new Error(`프리셋 '${presetName}'을 찾을 수 없습니다`);
      }
  
      const finalVariables = { ...presetData.variables, ...customVariables };
      
      return selectClausesByVariables(finalVariables, {
        preset: presetName,
        recommended: presetData.clauses
      });
  
    } catch (error) {
      console.error('프리셋 조항 선택 오류:', error);
      return {
        success: false,
        error: error.message,
        clauses: getFailsafeClauses()
      };
    }
  }
  
  export function smartInferVariables(serviceDescription, projectInfo = {}) {
    const serviceInferred = inferVariablesFromService(serviceDescription);
    const scaleInferred = inferScaleFromProject(projectInfo.amount, projectInfo.duration);
    
    const combined = { ...serviceInferred, ...scaleInferred };
    
    if (combined.project_scale === 'small' && combined.complexity === 'complex') {
      combined.complexity = 'medium';
    }
    
    if (combined.service_type === 'consulting' && combined.location === 'onsite') {
      combined.location = 'hybrid';
    }
  
    // 파생변수 계산
    const derivedVars = calculateDerivedVariables(combined, projectInfo);
    
    return { ...combined, ...derivedVars };
  }
  
  function calculateDerivedVariables(variables, projectInfo) {
    const derived = {};
    
    // 지급방식 자동 결정
    if (variables.execution_cycle === 'single' && variables.project_scale === 'large') {
      derived.paymentMethod = 'split_three';
      derived.paymentSchedule = '착수 30% + 중간 40% + 완료 30%';
    } else if (variables.project_scale === 'small') {
      derived.paymentMethod = 'completion';
      derived.paymentSchedule = '완료 후 일괄 지급';
    } else {
      derived.paymentMethod = 'split_two';
      derived.paymentSchedule = '착수 50% + 완료 50%';
    }
    
    // 위험도 자동 계산
    let riskScore = 0;
    if (variables.location === 'onsite') riskScore += 2;
    if (variables.equipment === 'large') riskScore += 3;
    if (variables.project_scale === 'large') riskScore += 1;
    if (variables.complexity === 'complex') riskScore += 1;
    
    derived.riskLevel = riskScore >= 5 ? 'high' : riskScore >= 3 ? 'medium' : 'low';
    
    // 성과측정방식 결정
    if (variables.project_scale === 'small' && variables.complexity === 'simple') {
      derived.evaluationMethod = 'completion_check';
    } else if (variables.project_scale === 'medium' && variables.complexity === 'medium') {
      derived.evaluationMethod = 'client_approval';
    } else {
      derived.evaluationMethod = 'formal_evaluation';
    }
    
    // 수정범위 결정
    if (variables.service_type === 'service' && variables.complexity === 'simple') {
      derived.revisionLimit = 'none';
      derived.maxRevisions = '0';
    } else if (variables.service_type === 'manufacturing' && variables.complexity === 'medium') {
      derived.revisionLimit = 'limited';
      derived.maxRevisions = '2';
    } else if (variables.service_type === 'consulting') {
      derived.revisionLimit = 'negotiable';
      derived.maxRevisions = '협의';
    } else {
      derived.revisionLimit = 'standard';
      derived.maxRevisions = '3';
    }
    
    // 보험 요구사항
    derived.insuranceRequired = (variables.equipment === 'large' || variables.project_scale === 'large') ? 'yes' : 'no';
    
    // 연체료율
    const amount = projectInfo.amount || 0;
    if (amount >= 10000000) {
      derived.penaltyRate = '15';
    } else if (amount >= 3000000) {
      derived.penaltyRate = '12';
    } else {
      derived.penaltyRate = '10';
    }
    
    // 출장비 정책
    if (variables.location === 'onsite') {
      derived.travelPolicy = 'full_coverage';
    } else if (variables.location === 'hybrid') {
      derived.travelPolicy = 'partial_coverage';
    } else {
      derived.travelPolicy = 'none';
    }
    
    return derived;
  }
  
  function inferVariablesFromService(serviceDescription) {
    const description = serviceDescription.toLowerCase();
    const inferred = {};
  
    if (description.includes('정기') || description.includes('월간') || description.includes('주간')) {
      inferred.execution_cycle = 'periodic';
    } else if (description.includes('지속') || description.includes('계속') || description.includes('유지')) {
      inferred.execution_cycle = 'continuous';
    } else {
      inferred.execution_cycle = 'single';
    }
  
    if (description.includes('로고') || description.includes('디자인') || description.includes('웹사이트') || description.includes('개발')) {
      inferred.service_type = 'manufacturing';
    } else if (description.includes('청소') || description.includes('공사') || description.includes('설치') || description.includes('철거')) {
      inferred.service_type = 'service';
    } else if (description.includes('컨설팅') || description.includes('자문') || description.includes('상담')) {
      inferred.service_type = 'consulting';
    } else if (description.includes('종합') || description.includes('복합')) {
      inferred.service_type = 'complex';
    } else {
      inferred.service_type = 'service';
    }
  
    if (description.includes('간단') || description.includes('기본') || description.includes('단순')) {
      inferred.complexity = 'simple';
    } else if (description.includes('복잡') || description.includes('전문') || description.includes('고급')) {
      inferred.complexity = 'complex';
    } else {
      inferred.complexity = 'medium';
    }
  
    if (description.includes('현장') || description.includes('방문') || description.includes('출장')) {
      inferred.location = 'onsite';
    } else if (description.includes('온라인') || description.includes('원격') || description.includes('비대면')) {
      inferred.location = 'remote';
    } else {
      inferred.location = 'hybrid';
    }
  
    if (description.includes('장비') || description.includes('기계') || description.includes('차량')) {
      inferred.equipment = 'large';
    } else if (description.includes('도구') || description.includes('자재')) {
      inferred.equipment = 'small';
    } else {
      inferred.equipment = 'intangible';
    }
  
    return inferred;
  }
  
  function inferScaleFromProject(amount, duration) {
    const inferred = {};
  
    if (amount >= 10000000) {
      inferred.project_scale = 'large';
    } else if (amount >= 3000000) {
      inferred.project_scale = 'medium';
    } else {
      inferred.project_scale = 'small';
    }
  
    if (duration) {
      const days = parseDurationToDays(duration);
      if (days >= 90) {
        inferred.complexity = 'complex';
      } else if (days >= 30) {
        inferred.complexity = 'medium';
      } else {
        inferred.complexity = 'simple';
      }
    }
  
    return inferred;
  }
  
  function applyOptions(clauses, options) {
    let result = [...clauses];
  
    if (options.essentialOnly) {
      result = result.filter(clause => clause.essential);
    }
  
    if (options.excludeIds?.length) {
      result = result.filter(clause => !options.excludeIds.includes(clause.id));
    }
  
    if (options.includeIds?.length) {
      const additionalClauses = options.includeIds
        .map(id => ALL_CLAUSES[id])
        .filter(clause => clause && !result.find(c => c.id === clause.id));
      result.push(...additionalClauses);
    }
  
    if (options.maxClauses && result.length > options.maxClauses) {
      const essential = result.filter(c => c.essential);
      const optional = result.filter(c => !c.essential)
        .slice(0, options.maxClauses - essential.length);
      result = [...essential, ...optional];
    }
  
    return result.sort((a, b) => (a.order || 999) - (b.order || 999));
  }
  
  function getFailsafeClauses() {
    return [
      {
        id: 'failsafe_purpose',
        title: '계약 목적',
        content: '본 계약은 발주자와 수행자 간의 서비스 제공을 목적으로 한다.',
        essential: true,
        order: 1
      },
      {
        id: 'failsafe_payment',
        title: '대금 지급',
        content: '계약 금액은 {totalAmount}원이며, 완료 후 지급한다.',
        essential: true,
        order: 2
      },
      {
        id: 'failsafe_completion',
        title: '계약 완료',
        content: '모든 업무 완료 시 계약이 종료된다.',
        essential: true,
        order: 3
      }
    ];
  }
  
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
  
  export function getAllVariableOptions() {
    const options = {};
    
    Object.entries(VARIABLES).forEach(([type, config]) => {
      options[type] = config.values.map(value => ({
        value,
        label: config.labels[value] || value
      }));
    });
    
    return options;
  }
  
  export function analyzeVariableCombination(variables) {
    const analysis = {
      risk_level: 'medium',
      complexity_score: 0,
      recommendations: [],
      warnings: []
    };
  
    if (variables.project_scale === 'large') analysis.complexity_score += 3;
    if (variables.complexity === 'complex') analysis.complexity_score += 2;
    if (variables.equipment === 'large') analysis.complexity_score += 2;
    if (variables.location === 'onsite') analysis.complexity_score += 1;
  
    if (analysis.complexity_score >= 6) {
      analysis.risk_level = 'high';
    } else if (analysis.complexity_score <= 2) {
      analysis.risk_level = 'low';
    }
  
    if (variables.location === 'onsite' && variables.equipment === 'large') {
      analysis.recommendations.push('현장 안전 관리 강화 필요');
    }
    
    if (variables.project_scale === 'large' && variables.complexity === 'complex') {
      analysis.recommendations.push('단계별 관리 체계 구축 권장');
    }
  
    if (variables.service_type === 'manufacturing' && variables.complexity === 'simple') {
      analysis.recommendations.push('품질 보증 조항 간소화 가능');
    }
  
    return analysis;
  }