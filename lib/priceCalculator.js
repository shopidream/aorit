// lib/priceCalculator.js - 룩업 테이블 기반 가격 계산

/**
 * 업종별 기본 가격표 (만원 단위)
 */
const PRICE_TABLE = {
    웹개발: {
      기본: 200,
      중급: 500,
      고급: 1000,
      enterprise: 2000
    },
    
    디자인: {
      로고: 30,
      브랜딩: 150,
      웹디자인: 300,
      앱디자인: 400
    },
    
    마케팅: {
      SNS관리: 80,
      광고운영: 200,
      콘텐츠제작: 150,
      종합마케팅: 500
    },
    
    컨설팅: {
      경영진단: 300,
      전략수립: 500,
      프로세스개선: 400,
      디지털전환: 800
    },
    
    교육: {
      개인과외: 40,
      그룹교육: 60,
      기업교육: 200,
      온라인강의: 100
    },
    
    청소: {
      아파트: 15,
      사무실: 25,
      상가: 20,
      입주청소: 30
    },
    
    수리: {
      전기: 8,
      배관: 12,
      타일: 15,
      도배: 20
    },
    
    제조: {
      소량생산: 100,
      중량생산: 300,
      대량생산: 800,
      맞춤제작: 200
    }
  };
  
  /**
   * 규모별 배수
   */
  const SCALE_MULTIPLIER = {
    소규모: 1.0,
    중간: 1.5,
    대규모: 2.5,
    enterprise: 4.0
  };
  
  /**
   * 지역별 배수
   */
  const REGION_MULTIPLIER = {
    서울: 1.3,
    경기: 1.1,
    광역시: 1.0,
    기타: 0.8
  };
  
  /**
   * 기술 복잡도 배수
   */
  const TECH_MULTIPLIER = {
    'AI': 2.0,
    'IoT': 1.8,
    '블록체인': 2.2,
    '데이터 분석': 1.6,
    '로우코드': 1.3,
    '기타': 1.0
  };
  
  /**
   * 서비스 변수를 업종으로 매핑
   */
  const mapToIndustry = (variables) => {
    const { format, technology, purpose, operation } = variables;
    
    // 물리적 서비스 우선 판별
    if (format === '용역') {
      if (purpose === '고객 경험 개선' || operation === '저비용') {
        return '청소';
      }
      return '수리';
    }
    
    if (format === '온프레미스') {
      if (operation === '저비용' || purpose === '고객 경험 개선') {
        return '청소';
      }
      return '수리';
    }
    
    if (format === 'SaaS' || (technology === 'AI' && purpose === '생산성 향상')) {
      return '웹개발';
    }
    
    if (format === '교육') {
      return '교육';
    }
    
    if (format === '컨설팅') {
      return '컨설팅';
    }
    
    if (format === '제조') {
      return '제조';
    }
    
    if (purpose === '고객 경험 개선' && technology === '기타') {
      return '디자인';
    }
    
    if (purpose === '고객 경험 개선' && format === 'SaaS') {
      return '마케팅';
    }
    
    // 기본값
    return '컨설팅';
  };
  
  /**
   * 복잡도 레벨 결정
   */
  const getComplexityLevel = (variables) => {
    const { technology, target, operation } = variables;
    
    if (technology === 'AI' || technology === '블록체인') {
      return '고급';
    }
    
    if (target === '중견·대기업' || target === '공공기관') {
      return operation === '고보안' ? 'enterprise' : '중급';
    }
    
    if (operation === '맞춤형') {
      return '중급';
    }
    
    return '기본';
  };
  
  /**
   * 규모 결정
   */
  const getProjectScale = (variables) => {
    const { target, revenue, operation } = variables;
    
    if (target === '공공기관' || revenue === '혼합형') {
      return 'enterprise';
    }
    
    if (target === '중견·대기업' || operation === '고보안') {
      return '대규모';
    }
    
    if (target === '소상공인') {
      return '중간';
    }
    
    return '소규모';
  };
  
  /**
   * 메인 가격 계산 함수
   */
  export const calculateServicePrice = (variables, description = '') => {
    try {
      // 1. 업종 매핑
      const industry = mapToIndustry(variables);
      
      // 2. 복잡도 레벨
      const complexity = getComplexityLevel(variables);
      
      // 3. 프로젝트 규모
      const scale = getProjectScale(variables);
      
      // 4. 기본 가격 조회
      const basePrice = PRICE_TABLE[industry]?.[complexity] || PRICE_TABLE.컨설팅.기본;
      
      // 5. 배수 적용
      const scaleMult = SCALE_MULTIPLIER[scale] || 1.0;
      const techMult = TECH_MULTIPLIER[variables.technology] || 1.0;
      const regionMult = getRegionMultiplier(description);
      
      // 6. 최종 가격 계산 (만원 → 원)
      const finalPrice = Math.round(basePrice * scaleMult * techMult * regionMult) * 10000;
      
      return {
        price: finalPrice,
        breakdown: {
          industry,
          complexity,
          scale,
          basePrice: basePrice * 10000,
          multipliers: {
            scale: scaleMult,
            technology: techMult,
            region: regionMult
          }
        },
        metadata: {
          calculatedAt: new Date().toISOString(),
          method: 'lookup_table',
          variables
        }
      };
      
    } catch (error) {
      console.error('가격 계산 오류:', error);
      
      // Fallback 가격
      return {
        price: 500000, // 기본 50만원
        breakdown: {
          industry: '기타',
          complexity: '기본',
          scale: '소규모',
          basePrice: 500000,
          multipliers: { scale: 1.0, technology: 1.0, region: 1.0 }
        },
        metadata: {
          calculatedAt: new Date().toISOString(),
          method: 'fallback',
          error: error.message
        }
      };
    }
  };
  
  /**
   * 지역 배수 추출
   */
  const getRegionMultiplier = (description) => {
    const text = description.toLowerCase();
    
    if (text.includes('서울') || text.includes('강남') || text.includes('종로')) {
      return REGION_MULTIPLIER.서울;
    }
    
    if (text.includes('경기') || text.includes('인천') || text.includes('수원')) {
      return REGION_MULTIPLIER.경기;
    }
    
    if (text.includes('부산') || text.includes('대구') || text.includes('광주') || text.includes('대전')) {
      return REGION_MULTIPLIER.광역시;
    }
    
    return REGION_MULTIPLIER.기타;
  };
  
  /**
   * 가격 범위 제안
   */
  export const suggestPriceRange = (variables, description = '') => {
    const result = calculateServicePrice(variables, description);
    const basePrice = result.price;
    
    return {
      min: Math.round(basePrice * 0.7),
      recommended: basePrice,
      max: Math.round(basePrice * 1.4),
      premium: Math.round(basePrice * 2.0)
    };
  };
  
  /**
   * 업종별 가격 비교
   */
  export const compareIndustryPrices = (variables) => {
    const comparisons = {};
    
    Object.keys(PRICE_TABLE).forEach(industry => {
      const levels = Object.keys(PRICE_TABLE[industry]);
      comparisons[industry] = {};
      
      levels.forEach(level => {
        comparisons[industry][level] = PRICE_TABLE[industry][level] * 10000;
      });
    });
    
    return comparisons;
  };
  
  /**
   * 가격 검증
   */
  export const validatePrice = (price, variables) => {
    const suggested = calculateServicePrice(variables);
    const deviation = Math.abs(price - suggested.price) / suggested.price;
    
    return {
      isReasonable: deviation < 0.5, // 50% 이내
      suggestion: suggested.price,
      deviation: Math.round(deviation * 100),
      message: deviation > 0.5 
        ? `시장가 대비 ${deviation > 0 ? '높음' : '낮음'} (권장: ${suggested.price.toLocaleString()}원)`
        : '적정 가격대입니다'
    };
  };