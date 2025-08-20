// data/clauses/KR/variableMappings.js - 변수 조합별 조항 매핑

// 6개 변수 정의
export const VARIABLES = {
    execution_cycle: ['single', 'continuous', 'periodic'],
    service_type: ['manufacturing', 'service', 'consulting', 'complex'],
    complexity: ['simple', 'medium', 'complex'],
    project_scale: ['small', 'medium', 'large'],
    location: ['remote', 'onsite', 'hybrid'],
    equipment: ['intangible', 'small', 'large']
  };
  
  // 기본 필수 조항 (모든 조합에 포함)
  export const MANDATORY_CLAUSES = [
    'contract_purpose',
    'parties', 
    'payment_basic',
    'effective_date',
    'governing_law'
  ];
  
  // 변수별 필수 조항 매핑
  export const VARIABLE_CLAUSE_MAPPING = {
    // 1. 실행주기별 조항
    execution_cycle: {
      single: ['single_completion'],
      continuous: ['continuous_service'],
      periodic: ['periodic_renewal']
    },
  
    // 2. 서비스형태별 조항
    service_type: {
      manufacturing: ['manufacturing_deliverable'],
      service: ['service_performance'],
      consulting: ['consulting_advice'],
      complex: ['complex_service']
    },
  
    // 3. 복잡도별 조항
    complexity: {
      simple: ['simple_workflow'],
      medium: ['standard_process'],
      complex: ['complex_management']
    },
  
    // 4. 프로젝트규모별 조항
    project_scale: {
      small: ['small_scale_payment'],
      medium: ['medium_scale_payment'],
      large: ['large_scale_management']
    },
  
    // 5. 장소특성별 조항
    location: {
      remote: ['remote_work'],
      onsite: ['onsite_work'],
      hybrid: ['hybrid_work']
    },
  
    // 6. 자재장비별 조항
    equipment: {
      intangible: ['intangible_service'],
      small: ['small_equipment'],
      large: ['large_equipment']
    }
  };
  
  // 조건부 조항 규칙
  export const CONDITIONAL_RULES = [
    {
      id: 'onsite_safety',
      clause: 'onsite_safety',
      conditions: [
        { variable: 'location', values: ['onsite', 'hybrid'] },
        { variable: 'equipment', values: ['small', 'large'] }
      ],
      operator: 'OR' // 조건 중 하나라도 만족하면 포함
    },
    
    {
      id: 'equipment_insurance',
      clause: 'equipment_insurance',
      conditions: [
        { variable: 'equipment', values: ['large'] }
      ],
      operator: 'AND'
    },
  
    {
      id: 'revision_limits',
      clause: 'revision_limits', 
      conditions: [
        { variable: 'service_type', values: ['manufacturing'] },
        { variable: 'complexity', values: ['medium', 'complex'] }
      ],
      operator: 'AND' // 모든 조건을 만족해야 포함
    },
  
    {
      id: 'performance_guarantee',
      clause: 'performance_guarantee',
      conditions: [
        { variable: 'project_scale', values: ['large'] },
        { variable: 'complexity', values: ['complex'] }
      ],
      operator: 'AND'
    },
  
    {
      id: 'simplified_procedure',
      clause: 'simplified_procedure',
      conditions: [
        { variable: 'project_scale', values: ['small'] },
        { variable: 'complexity', values: ['simple'] }
      ],
      operator: 'AND'
    }
  ];
  
  // 특정 조합에서 제외할 조항들
  export const EXCLUSION_RULES = [
    {
      id: 'no_complex_for_small',
      excludeClauses: ['complex_management'],
      conditions: [
        { variable: 'project_scale', values: ['small'] }
      ]
    },
    
    {
      id: 'no_equipment_for_intangible',
      excludeClauses: ['small_equipment', 'large_equipment', 'equipment_insurance'],
      conditions: [
        { variable: 'equipment', values: ['intangible'] }
      ]
    }
  ];
  
  // 변수 조합별 추천 조항 세트 (자주 사용되는 조합)
  export const PRESET_COMBINATIONS = {
    // 로고 디자인
    logo_design: {
      variables: {
        execution_cycle: 'single',
        service_type: 'manufacturing', 
        complexity: 'medium',
        project_scale: 'small',
        location: 'remote',
        equipment: 'intangible'
      },
      recommendedClauses: [
        'manufacturing_deliverable',
        'revision_limits',
        'remote_work',
        'simplified_procedure'
      ]
    },
  
    // 웹사이트 개발
    website_development: {
      variables: {
        execution_cycle: 'single',
        service_type: 'manufacturing',
        complexity: 'complex', 
        project_scale: 'medium',
        location: 'hybrid',
        equipment: 'intangible'
      },
      recommendedClauses: [
        'manufacturing_deliverable',
        'complex_management',
        'hybrid_work',
        'revision_limits'
      ]
    },
  
    // 사무실 청소
    office_cleaning: {
      variables: {
        execution_cycle: 'single',
        service_type: 'service',
        complexity: 'simple',
        project_scale: 'small', 
        location: 'onsite',
        equipment: 'small'
      },
      recommendedClauses: [
        'service_performance',
        'onsite_work',
        'onsite_safety',
        'simplified_procedure'
      ]
    },
  
    // 마케팅 컨설팅
    marketing_consulting: {
      variables: {
        execution_cycle: 'continuous',
        service_type: 'consulting',
        complexity: 'medium',
        project_scale: 'medium',
        location: 'hybrid', 
        equipment: 'intangible'
      },
      recommendedClauses: [
        'consulting_advice',
        'continuous_service',
        'hybrid_work'
      ]
    },
  
    // 건설 공사
    construction_work: {
      variables: {
        execution_cycle: 'single',
        service_type: 'service',
        complexity: 'complex',
        project_scale: 'large',
        location: 'onsite',
        equipment: 'large'
      },
      recommendedClauses: [
        'service_performance',
        'complex_management',
        'onsite_work',
        'onsite_safety',
        'equipment_insurance',
        'performance_guarantee'
      ]
    }
  };
  
  // 조항 선택 함수
  export function selectClausesForVariables(variables) {
    const selectedClauses = new Set();
    
    // 1. 기본 필수 조항 추가
    MANDATORY_CLAUSES.forEach(clause => selectedClauses.add(clause));
    
    // 2. 변수별 필수 조항 추가
    Object.entries(variables).forEach(([variableType, value]) => {
      if (VARIABLE_CLAUSE_MAPPING[variableType] && VARIABLE_CLAUSE_MAPPING[variableType][value]) {
        VARIABLE_CLAUSE_MAPPING[variableType][value].forEach(clause => selectedClauses.add(clause));
      }
    });
    
    // 3. 조건부 조항 검사
    CONDITIONAL_RULES.forEach(rule => {
      let shouldInclude = false;
      
      if (rule.operator === 'AND') {
        shouldInclude = rule.conditions.every(condition => 
          condition.values.includes(variables[condition.variable])
        );
      } else if (rule.operator === 'OR') {
        shouldInclude = rule.conditions.some(condition =>
          condition.values.includes(variables[condition.variable]) 
        );
      }
      
      if (shouldInclude) {
        selectedClauses.add(rule.clause);
      }
    });
    
    // 4. 제외 규칙 적용
    EXCLUSION_RULES.forEach(rule => {
      const shouldExclude = rule.conditions.every(condition =>
        condition.values.includes(variables[condition.variable])
      );
      
      if (shouldExclude) {
        rule.excludeClauses.forEach(clause => selectedClauses.delete(clause));
      }
    });
    
    return Array.from(selectedClauses);
  }
  
  // 프리셋 조합에서 조항 가져오기
  export function getPresetClauses(presetName) {
    const preset = PRESET_COMBINATIONS[presetName];
    if (!preset) return null;
    
    const variables = preset.variables;
    const baseClauses = selectClausesForVariables(variables);
    
    // 프리셋 추천 조항 추가
    const allClauses = new Set([...baseClauses, ...preset.recommendedClauses]);
    
    return {
      variables,
      clauses: Array.from(allClauses),
      preset: presetName
    };
  }
  
  // 변수 조합 검증
  export function validateVariableCombination(variables) {
    const errors = [];
    
    // 필수 변수 체크
    Object.keys(VARIABLES).forEach(variableType => {
      if (!variables[variableType]) {
        errors.push(`${variableType} 값이 필요합니다`);
      } else if (!VARIABLES[variableType].includes(variables[variableType])) {
        errors.push(`${variableType}의 값 '${variables[variableType]}'이 유효하지 않습니다`);
      }
    });
    
    // 논리적 모순 체크
    if (variables.equipment === 'intangible' && variables.location === 'onsite') {
      errors.push('무형 서비스는 일반적으로 원격 작업에 적합합니다');
    }
    
    if (variables.project_scale === 'small' && variables.complexity === 'complex') {
      errors.push('소규모 프로젝트에 복합 복잡도는 일반적이지 않습니다');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }