// lib/serviceGenerator.js - 6개 변수 기반 서비스 생성 엔진

/**
 * 6개 핵심 변수 정의
 */
export const SERVICE_VARIABLES = {
    purpose: ['생산성 향상', '비용 절감', '고객 경험 개선', '규제 대응', '혁신 서비스 창출'],
    target: ['개인', '소상공인', '중견·대기업', '공공기관', '글로벌 시장'],
    format: ['SaaS', '온프레미스', '컨설팅', '교육', '제조', '복합형'],
    technology: ['AI', 'IoT', '블록체인', '데이터 분석', '로우코드', '기타'],
    revenue: ['구독형', '사용량 기반', '라이선스 판매', '일회성 판매', '광고', '혼합형'],
    operation: ['자동화', '수동 + 전문가 지원', '맞춤형', '표준형', '고보안', '저비용']
  };
  
  /**
   * 조건부 파생 변수 로직
   */
  const DERIVED_LOGIC = {
    launchStrategy: (vars) => {
      if (vars.target === '개인' && vars.purpose === '고객 경험 개선') {
        return '모바일 앱 우선 출시';
      }
      if (vars.target === '중견·대기업' && vars.technology === 'AI') {
        return '파일럿 프로젝트 + B2B 세일즈';
      }
      if (vars.target === '공공기관') {
        return '규제·보안 검증 후 단계적 확산';
      }
      return 'MVP 제작 후 시장 검증';
    },
  
    coreFeatures: (vars) => {
      if (vars.purpose === '생산성 향상' && vars.technology === 'AI') {
        return ['작업 자동화', '예측 분석', '맞춤형 리포트'];
      }
      if (vars.purpose === '비용 절감' && vars.format === '컨설팅') {
        return ['비용 구조 분석', '효율성 보고서', '개선 로드맵'];
      }
      if (vars.purpose === '혁신 서비스 창출') {
        return ['새로운 사용자 경험', '플랫폼 연동', '데이터 기반 추천'];
      }
      return ['핵심 기능 1', '핵심 기능 2', '핵심 기능 3'];
    },
  
    revenueStrategy: (vars) => {
      if (vars.revenue === '구독형') {
        return ['무료 체험 → 유료 전환', '프리미엄 기능 잠금'];
      }
      if (vars.revenue === '광고') {
        return ['타겟 광고', '제휴 마케팅'];
      }
      if (vars.revenue === '혼합형') {
        return ['기본 무료 + 부가 서비스 유료', '데이터 판매'];
      }
      return ['단순 판매', '고객 유지'];
    }
  };
  
  /**
   * 변수 조합별 필수 요소 매핑
   */
  const REQUIRED_ELEMENTS = {
    purpose: {
      '생산성 향상': ['자동화 기능', '효율성 지표', '업무 툴 연동'],
      '비용 절감': ['절감 효과 측정', '운영 최적화 가이드', '절약 보고서'],
      '고객 경험 개선': ['UX 최적화', '고객 피드백 반영', '개인화 추천'],
      '규제 대응': ['규제 준수 체크리스트', '감사 로그', '법적 보고'],
      '혁신 서비스 창출': ['신규 기능 실험', '사용자 커뮤니티', '파트너십 네트워크']
    },
    
    format: {
      'SaaS': ['클라우드 배포', '자동 업데이트', '멀티테넌트 구조'],
      '온프레미스': ['설치 매뉴얼', '보안 설정 가이드', '유지보수 계약'],
      '컨설팅': ['분석 보고서', '실행 로드맵', '교육 세션'],
      '교육': ['커리큘럼', '실습 자료', '평가 기준'],
      '제조': ['제품 사양서', '품질 보증', '유지보수 옵션'],
      '복합형': ['통합 서비스 계획', '단계별 전환', '하이브리드 지원']
    },
  
    technology: {
      'AI': ['데이터셋 확보', '모델 학습/튜닝', '예측/추천 알고리즘'],
      'IoT': ['디바이스 연결', '실시간 데이터 수집', '원격 제어'],
      '블록체인': ['스마트 계약', '거래 이력 투명성', '보안 검증'],
      '데이터 분석': ['데이터 파이프라인', '시각화 대시보드', 'KPI 모니터링'],
      '로우코드': ['드래그&드롭 빌더', '모듈 마켓플레이스', '코드 확장 기능'],
      '기타': ['핵심 기술 명시', '기술 검증', '기술 지원']
    }
  };
  
  /**
   * 업무 설명 분석 및 변수 추론
   */
  export const analyzeBusinessDescription = (description) => {
    const text = description.toLowerCase();
    
    // 목적 추론
    const purpose = 
      text.includes('효율') || text.includes('자동') ? '생산성 향상' :
      text.includes('절약') || text.includes('저렴') ? '비용 절감' :
      text.includes('고객') || text.includes('만족') ? '고객 경험 개선' :
      text.includes('규제') || text.includes('인증') ? '규제 대응' :
      '혁신 서비스 창출';
  
    // 대상 추론
    const target = 
      text.includes('개인') || text.includes('1:1') ? '개인' :
      text.includes('소상공인') || text.includes('카페') || text.includes('작은') ? '소상공인' :
      text.includes('대기업') || text.includes('기업') ? '중견·대기업' :
      text.includes('공공') || text.includes('정부') ? '공공기관' :
      '개인';
  
    // 형태 추론
    const format = 
      text.includes('앱') || text.includes('온라인') || text.includes('웹') ? 'SaaS' :
      text.includes('컨설팅') || text.includes('조언') ? '컨설팅' :
      text.includes('교육') || text.includes('과외') || text.includes('강의') ? '교육' :
      text.includes('제작') || text.includes('생산') ? '제조' :
      '컨설팅';
  
    // 기술 추론
    const technology = 
      text.includes('ai') || text.includes('인공지능') ? 'AI' :
      text.includes('iot') || text.includes('센서') ? 'IoT' :
      text.includes('블록체인') || text.includes('암호화') ? '블록체인' :
      text.includes('분석') || text.includes('데이터') ? '데이터 분석' :
      '기타';
  
    // 수익모델 추론
    const revenue = 
      text.includes('월') || text.includes('구독') ? '구독형' :
      text.includes('사용량') || text.includes('건당') ? '사용량 기반' :
      text.includes('라이선스') ? '라이선스 판매' :
      '일회성 판매';
  
    // 운영 추론
    const operation = 
      text.includes('자동') ? '자동화' :
      text.includes('맞춤') || text.includes('개인화') ? '맞춤형' :
      text.includes('표준') ? '표준형' :
      text.includes('보안') ? '고보안' :
      text.includes('저렴') || text.includes('경제적') ? '저비용' :
      '수동 + 전문가 지원';
  
    return { purpose, target, format, technology, revenue, operation };
  };
  
  /**
   * 변수 기반 서비스 생성
   */
  export const generateServices = (variables, count = 5) => {
    const services = [];
    const variations = generateVariations(variables, count);
  
    variations.forEach((vars, index) => {
      const service = {
        id: `generated_${Date.now()}_${index}`,
        title: generateServiceTitle(vars),
        description: generateServiceDescription(vars),
        category: vars.format,
        features: DERIVED_LOGIC.coreFeatures(vars),
        launchStrategy: DERIVED_LOGIC.launchStrategy(vars),
        revenueStrategy: DERIVED_LOGIC.revenueStrategy(vars),
        requiredElements: getRequiredElements(vars),
        variables: vars,
        estimatedPrice: 0, // priceCalculator에서 계산
        metadata: {
          generated: true,
          createdAt: new Date().toISOString(),
          confidence: calculateConfidence(vars)
        }
      };
  
      services.push(service);
    });
  
    return services;
  };
  
  /**
   * 변수 조합 변형 생성
   */
  const generateVariations = (baseVars, count) => {
    const variations = [baseVars]; // 기본 조합
    
    // 추가 변형 생성
    for (let i = 1; i < count; i++) {
      const variation = { ...baseVars };
      
      // 각 변형마다 1-2개 변수 조정
      const varsToChange = ['purpose', 'target', 'format'];
      const changeVar = varsToChange[i % varsToChange.length];
      
      const options = SERVICE_VARIABLES[changeVar];
      const currentIndex = options.indexOf(variation[changeVar]);
      const newIndex = (currentIndex + i) % options.length;
      variation[changeVar] = options[newIndex];
      
      variations.push(variation);
    }
    
    return variations;
  };
  
  /**
   * 서비스 제목 생성
   */
  const generateServiceTitle = (vars) => {
    const prefixes = {
      '생산성 향상': '효율적인',
      '비용 절감': '경제적인',
      '고객 경험 개선': '맞춤형',
      '규제 대응': '안전한',
      '혁신 서비스 창출': '혁신적인'
    };
  
    const formats = {
      'SaaS': '클라우드 서비스',
      '컨설팅': '컨설팅',
      '교육': '교육 프로그램',
      '제조': '제품',
      '온프레미스': '설치형 솔루션',
      '복합형': '통합 솔루션'
    };
  
    const prefix = prefixes[vars.purpose] || '';
    const format = formats[vars.format] || '서비스';
    
    return `${prefix} ${vars.target} 대상 ${format}`;
  };
  
  /**
   * 서비스 설명 생성
   */
  const generateServiceDescription = (vars) => {
    const templates = {
      'SaaS': `${vars.target}을 위한 ${vars.technology} 기반 클라우드 서비스로, ${vars.purpose}을 목표로 합니다.`,
      '컨설팅': `${vars.target}의 ${vars.purpose}을 위한 전문 컨설팅 서비스를 제공합니다.`,
      '교육': `${vars.target}을 대상으로 한 ${vars.technology} 관련 교육 프로그램입니다.`,
      '제조': `${vars.target}의 ${vars.purpose}을 위한 ${vars.technology} 기반 제품을 제공합니다.`
    };
  
    return templates[vars.format] || `${vars.target}을 위한 ${vars.purpose} 서비스입니다.`;
  };
  
  /**
   * 필수 요소 조합
   */
  const getRequiredElements = (vars) => {
    const elements = new Set();
    
    // 목적별 필수 요소
    REQUIRED_ELEMENTS.purpose[vars.purpose]?.forEach(el => elements.add(el));
    
    // 형태별 필수 요소
    REQUIRED_ELEMENTS.format[vars.format]?.forEach(el => elements.add(el));
    
    // 기술별 필수 요소
    REQUIRED_ELEMENTS.technology[vars.technology]?.forEach(el => elements.add(el));
    
    return Array.from(elements);
  };
  
  /**
   * 신뢰도 계산
   */
  const calculateConfidence = (vars) => {
    let score = 0.5; // 기본 점수
    
    // 명확한 조합일수록 높은 점수
    if (vars.purpose === '생산성 향상' && vars.technology === 'AI') score += 0.2;
    if (vars.target === '개인' && vars.format === 'SaaS') score += 0.1;
    if (vars.revenue === '구독형' && vars.format === 'SaaS') score += 0.1;
    
    return Math.min(1.0, score);
  };