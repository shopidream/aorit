// lib/contractUtils.js - 계약서 유틸리티 함수들

// 계약서 길이 옵션 정의
export const CONTRACT_LENGTH_OPTIONS = {
    simple: {
      name: '간단형',
      description: '필수 조항만 간략히 (-30%)',
      detailLevel: 'minimal',
      clauseMultiplier: 0.7,
      itemDetailLevel: 'summary'
    },
    standard: {
      name: '표준형', 
      description: '일반적인 상세도 (기본)',
      detailLevel: 'standard',
      clauseMultiplier: 1.0,
      itemDetailLevel: 'standard'
    },
    detailed: {
      name: '상세형',
      description: '견적 세부항목별 구체적 기술 (+50%)',
      detailLevel: 'comprehensive',
      clauseMultiplier: 1.5,
      itemDetailLevel: 'detailed'
    }
  };
  
  // 지급 조건 계산 (견적서 설정 우선, 없으면 금액 기준)
  export function getPaymentSchedule(amount, quoteData = null) {
    console.log('=== getPaymentSchedule 호출 ===');
    console.log('amount:', amount);
    console.log('quoteData:', JSON.stringify(quoteData, null, 2));
    
    // 견적서에 지급조건이 설정되어 있으면 우선 사용
    if (quoteData?.paymentTerms) {
      const { contractPercentage, progressPercentage, finalPercentage } = quoteData.paymentTerms;
      console.log('견적서 지급조건 사용:', { contractPercentage, progressPercentage, finalPercentage });
      
      return {
        downRate: contractPercentage || 0,
        middleRate: progressPercentage || 0, 
        finalRate: finalPercentage || 0,
        downAmount: Math.round(amount * (contractPercentage || 0) / 100),
        middleAmount: Math.round(amount * (progressPercentage || 0) / 100),
        finalAmount: Math.round(amount * (finalPercentage || 0) / 100),
        isFromQuote: true
      };
    }
    
    // 견적서 지급조건이 없으면 금액 기준으로 자동 계산
    let downRate, middleRate, finalRate;
    
    if (amount < 1000000) {
      downRate = 0; middleRate = 0; finalRate = 100;
    } else if (amount < 5000000) {
      downRate = 30; middleRate = 0; finalRate = 70;
    } else {
      downRate = 30; middleRate = 40; finalRate = 30;
    }
    
    console.log('기본 지급조건 사용:', { downRate, middleRate, finalRate });
    
    return {
      downRate, middleRate, finalRate,
      downAmount: Math.round(amount * downRate / 100),
      middleAmount: Math.round(amount * middleRate / 100),
      finalAmount: Math.round(amount * finalRate / 100),
      isFromQuote: false
    };
  }
  
  // 기존 함수명 호환성 유지 (deprecate 예정)
  export function getPaymentScheduleFromAmount(amount) {
    return getPaymentSchedule(amount);
  }
  
  // 클라이언트 정보 기반 관할법원 결정
  export function getJurisdiction(clientInfo) {
    if (!clientInfo) return '서울중앙지방법원';
    
    const info = String(clientInfo).toLowerCase();
    if (info.includes('서울')) return '서울중앙지방법원';
    if (info.includes('부산')) return '부산지방법원';
    if (info.includes('대구')) return '대구지방법원';
    if (info.includes('인천')) return '인천지방법원';
    if (info.includes('광주')) return '광주지방법원';
    if (info.includes('대전')) return '대전지방법원';
    if (info.includes('울산')) return '울산지방법원';
    if (info.includes('수원') || info.includes('경기')) return '수원지방법원';
    
    return '서울중앙지방법원';
  }
  
  // 금액 기반 통지기간 결정
  export function getNoticePeriod(amount) {
    if (amount >= 10000000) return '30일';
    if (amount >= 3000000) return '14일';
    return '7일';
  }
  
  // 금액 기반 연체료율 결정
  export function getPenaltyRate(amount) {
    if (amount >= 10000000) return '15%';
    if (amount >= 3000000) return '12%';
    return '10%';
  }
  
  // 기간 문자열을 일수로 변환
  export function parseDurationToDays(duration) {
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
  
  // 프로젝트 시작일과 종료일 계산
  export function calculateProjectDates(startDate, duration) {
    const start = startDate ? new Date(startDate) : new Date();
    const totalDays = parseDurationToDays(duration || '30일');
    
    const end = new Date(start);
    end.setDate(end.getDate() + totalDays);
    
    return {
      startDate: start.toLocaleDateString('ko-KR'),
      endDate: end.toLocaleDateString('ko-KR')
    };
  }
  
  // 서비스 복잡도 분석
  export function analyzeServiceComplexity(selectedServices) {
    if (!selectedServices || selectedServices.length === 0) return 'simple';
    
    const totalServices = selectedServices.length;
    const hasComplexServices = selectedServices.some(service => 
      service.serviceDescription && service.serviceDescription.length > 100
    );
    const hasMultiplePhases = selectedServices.some(service =>
      service.serviceDescription && (
        service.serviceDescription.includes('단계') ||
        service.serviceDescription.includes('phase') ||
        service.serviceDescription.includes('월간') ||
        service.serviceDescription.includes('정기')
      )
    );
    
    if (totalServices >= 5 || hasComplexServices || hasMultiplePhases) return 'complex';
    if (totalServices >= 3) return 'medium';
    return 'simple';
  }
  
  // 계약서 길이 자동 추천
  export function getRecommendedLength(contractData, selectedServices, totalAmount) {
    const serviceComplexity = analyzeServiceComplexity(selectedServices);
    const serviceCount = selectedServices?.length || 1;
    
    let score = 0;
    
    // 금액 기준
    if (totalAmount >= 50000000) score += 4;
    else if (totalAmount >= 10000000) score += 3;
    else if (totalAmount >= 3000000) score += 2;
    else score += 1;
    
    // 서비스 복잡도
    if (serviceComplexity === 'complex') score += 3;
    else if (serviceComplexity === 'medium') score += 2;
    else score += 1;
    
    // 서비스 개수
    if (serviceCount >= 5) score += 2;
    else if (serviceCount >= 3) score += 1;
    
    // 기간
    const duration = parseDurationToDays(contractData.duration);
    if (duration >= 180) score += 2;
    else if (duration >= 90) score += 1;
    
    if (score >= 9) return 'detailed';
    if (score >= 6) return 'standard'; 
    return 'simple';
  }
  
  // 법적 기준 데이터 준비 (견적서 지급조건 반영)
  export function prepareLegalData(contractData, selectedServices, totalAmount, quoteData = null) {
    console.log('=== prepareLegalData 호출 ===');
    console.log('quoteData:', JSON.stringify(quoteData, null, 2));
    
    const payment = getPaymentSchedule(totalAmount, quoteData);
    const dates = calculateProjectDates(new Date(), contractData.duration);
    
    // 견적서에서 납기일과 검수일 추출
    let deliveryInfo = '';
    let inspectionInfo = '';
    
    if (quoteData?.deliveryDays !== undefined || quoteData?.inspectionDays !== undefined) {
      const deliveryDays = quoteData.deliveryDays || 0;
      const inspectionDays = quoteData.inspectionDays || 0;
      
      deliveryInfo = deliveryDays > 0 ? `납품기한 ${deliveryDays}일` : '즉시 납품';
      inspectionInfo = inspectionDays > 0 ? `검수기간 ${inspectionDays}일` : '즉시 검수';
    }
    
    console.log('결제 조건 정보:', payment);
    console.log('납품/검수 정보:', { deliveryInfo, inspectionInfo });
    
    return {
      totalAmount: totalAmount.toLocaleString(),
      downPaymentRate: payment.downRate,
      downPaymentAmount: payment.downAmount.toLocaleString(),
      middlePaymentRate: payment.middleRate,
      middlePaymentAmount: payment.middleAmount.toLocaleString(),
      finalPaymentRate: payment.finalRate,
      finalPaymentAmount: payment.finalAmount.toLocaleString(),
      startDate: dates.startDate,
      endDate: dates.endDate,
      duration: contractData.duration || '30일',
      noticePeriod: getNoticePeriod(totalAmount),
      penaltyRate: getPenaltyRate(totalAmount),
      jurisdiction: getJurisdiction(contractData.client?.company || contractData.client?.name),
      clientName: contractData.client?.name || '발주자',
      providerName: contractData.provider?.name || '수행자',
      providerEmail: contractData.provider?.email || '',
      providerPhone: contractData.provider?.phone || '',
      // 견적서 동기화 정보 추가
      deliveryInfo,
      inspectionInfo,
      deliveryDays: quoteData?.deliveryDays || 0,
      inspectionDays: quoteData?.inspectionDays || 0,
      paymentFromQuote: payment.isFromQuote,
      vatExcluded: true // 견적서에서 "부가세 별도" 정보
    };
  }
  
  // 기간에 따른 프로젝트 타임라인 생성
  export function getTimelineFromDuration(duration) {
    const days = parseDurationToDays(duration || '30일');
    
    const milestones = [];
    if (days <= 14) {
      milestones.push({ phase: '전체 작업', duration: '전체 기간' });
    } else if (days <= 30) {
      milestones.push(
        { phase: '기획 및 설계', duration: '1주' },
        { phase: '개발/제작', duration: '2-3주' },
        { phase: '검토 및 수정', duration: '마지막 주' }
      );
    } else {
      milestones.push(
        { phase: '기획 및 설계', duration: '첫 2주' },
        { phase: '1차 개발/제작', duration: '3-6주' },
        { phase: '중간 검토', duration: '1주' },
        { phase: '2차 개발/제작', duration: '2-4주' },
        { phase: '최종 검토 및 완성', duration: '마지막 2주' }
      );
    }
    
    return { milestones, totalDuration: duration };
  }
  
  // 입력 데이터 검증
  export function validateInputData(contractData, selectedServices) {
    const errors = [];
  
    if (!contractData.client?.name?.trim()) {
      errors.push('고객명이 필요합니다');
    }
    if (!contractData.provider?.name?.trim()) {
      errors.push('수행자명이 필요합니다');
    }
  
    if (selectedServices.length === 0) {
      if (!contractData.serviceName?.trim()) {
        errors.push('서비스명이 필요합니다');
      }
      if (!contractData.amount || contractData.amount <= 0) {
        errors.push('유효한 계약 금액이 필요합니다');
      }
    }
  
    return { isValid: errors.length === 0, errors };
  }
  
  // 계약서 메트릭 계산
  export function calculateMetrics(contract, startTime) {
    return {
      totalClauses: contract.clauses?.length || 0,
      serviceCount: contract.metadata?.serviceCount || 1,
      riskLevel: contract.metadata?.riskLevel || 'medium',
      contractLength: contract.metadata?.contractLength || 'standard',
      processingTime: Date.now() - startTime,
      model: 'gpt-4o-mini + claude-sonnet-4-collaboration'
    };
  }
  
  // 조항 내용 줄바꿈 처리 함수
  export function formatClauseContent(content) {
    if (!content) return '';
    
    console.log('formatClauseContent 호출됨 - 원본:', content.substring(0, 100));
    
    // ①②③④⑤ 형태를 기준으로 줄바꿈 처리
    const formatted = content
      .replace(/(①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩)/g, '\n$1')
      .replace(/^\n\n/, '') // 맨 앞 줄바꿈 제거
      .trim();
      
    console.log('formatClauseContent 결과:', formatted.substring(0, 100));
    return formatted;
  }
  
  // GPT 구조 응답 파싱
  export function parseGPTStructureResponse(content) {
    try {
      let jsonStr = content;
      
      // ```json ``` 코드 블록에서 추출
      const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/;
      const jsonMatch = content.match(codeBlockRegex);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        // JSON 객체만 추출
        const objRegex = /\{[\s\S]*\}/;
        const objMatch = content.match(objRegex);
        if (objMatch) {
          jsonStr = objMatch[0];
        }
      }
  
      const gptResult = JSON.parse(jsonStr);
      
      if (!gptResult.clauseStructure || !Array.isArray(gptResult.clauseStructure)) {
        throw new Error('조항 구조가 배열 형식이 아닙니다');
      }
  
      console.log('GPT 구조 설계 성공:', gptResult.clauseStructure.length, '개 조항');
      return {
        success: true,
        structure: gptResult,
        analysis: gptResult.analysis || 'GPT 구조 설계 완료'
      };
  
    } catch (error) {
      console.error('GPT 구조 파싱 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Claude 세부 응답 파싱 (개선됨)
  export function parseClaudeDetailResponse(content) {
    console.log('🔍 parseClaudeDetailResponse 시작');
    console.log('- 입력 content 길이:', content?.length || 0);
    
    try {
      let jsonStr = content.trim();
      
      console.log('- 원본 첫 50자:', JSON.stringify(jsonStr.substring(0, 50)));
      
      // 1차: 코드 블록 마크다운 제거 (개선됨)
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      
      console.log('- 코드블록 제거 후 첫 50자:', JSON.stringify(jsonStr.substring(0, 50)));
      
      // 2차: ```json ``` 코드 블록에서 추출 (보완)
      const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
      const jsonMatch = jsonStr.match(codeBlockRegex);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
        console.log('- 정규식으로 재추출됨');
      }
      
      // 3차: JSON 객체만 추출
      if (!jsonStr.trim().startsWith('{')) {
        const objRegex = /\{[\s\S]*\}/;
        const objMatch = jsonStr.match(objRegex);
        if (objMatch) {
          jsonStr = objMatch[0];
          console.log('- JSON 객체 패턴으로 추출됨');
        }
      }
  
      console.log('- 최종 처리된 JSON 첫 50자:', JSON.stringify(jsonStr.substring(0, 50)));
      console.log('- 추출된 JSON 길이:', jsonStr.length);
  
      // JSON 정리 (간소화됨)
      jsonStr = cleanJsonString(jsonStr);
  
      let claudeResult;
      try {
        claudeResult = JSON.parse(jsonStr);
        console.log('- JSON 파싱 성공');
      } catch (parseError) {
        console.error('JSON 파싱 1차 실패, 복구 시도:', parseError.message);
        console.log('- 복구 전 JSON 첫 200자:', jsonStr.substring(0, 200));
        
        // JSON 복구 시도
        const repairedJson = repairJsonString(jsonStr);
        console.log('- 복구 후 JSON 첫 200자:', repairedJson.substring(0, 200));
        claudeResult = JSON.parse(repairedJson);
        console.log('- JSON 복구 후 파싱 성공');
      }
      
      if (!claudeResult.clauses || !Array.isArray(claudeResult.clauses)) {
        throw new Error('조항이 배열 형식이 아닙니다');
      }
  
      console.log('- Claude 응답에서 조항 개수:', claudeResult.clauses.length);
  
      const processedClauses = claudeResult.clauses.map((clause, index) => {
        console.log(`🔍 조항 ${index + 1} 처리 중:`, clause.title);
        const formatted = formatClauseContent(clause.content || '');
        return {
          id: `collaborative_clause_${index + 1}`,
          title: clause.title || `제${index + 1}조`,
          content: formatted,
          essential: clause.essential || false,
          category: clause.category || 'general',
          order: clause.number || (index + 1),
          riskLevel: 'medium'
        };
      });
  
      console.log('Claude 세부 작성 성공:', processedClauses.length, '개 조항');
      return {
        success: true,
        clauses: processedClauses,
        analysis: claudeResult.analysis || 'Claude 세부 작성 완료'
      };
  
    } catch (error) {
      console.error('Claude 세부 파싱 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // JSON 문자열 정리 함수 (간소화됨)
  function cleanJsonString(jsonStr) {
    return jsonStr
      .trim()
      // 불완전한 JSON 끝부분 처리만
      .replace(/,\s*$/, '') // 마지막 쉼표 제거
      .replace(/,(\s*[}\]])/g, '$1'); // 불필요한 쉼표 제거
  }
  
  // JSON 복구 함수 (기존과 동일)
  function repairJsonString(jsonStr) {
    try {
      // 기본 정리
      let repaired = cleanJsonString(jsonStr);
      
      // 배열이 열려있지만 닫히지 않은 경우 감지
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      
      // 괄호 불균형 수정
      if (openBrackets > closeBrackets) {
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          repaired += ']';
        }
      }
      
      if (openBraces > closeBraces) {
        for (let i = 0; i < openBraces - closeBraces; i++) {
          repaired += '}';
        }
      }
      
      // 마지막 객체가 불완전한 경우 제거
      const lastCommaIndex = repaired.lastIndexOf(',');
      const lastBraceIndex = repaired.lastIndexOf('}');
      if (lastCommaIndex > lastBraceIndex) {
        // 마지막 쉼표 이후 불완전한 부분 제거
        repaired = repaired.substring(0, lastCommaIndex);
        // 배열/객체 닫기
        if (openBrackets > closeBrackets) repaired += ']';
        if (openBraces > closeBraces) repaired += '}';
      }
      
      console.log('JSON 복구 시도 완료');
      return repaired;
      
    } catch (error) {
      console.error('JSON 복구 실패:', error);
      // 최후의 수단: 기본 템플릿 반환
      return JSON.stringify({
        analysis: "JSON 파싱 오류로 인한 기본 템플릿",
        contractLength: "standard",
        clauses: [
          {
            number: 1,
            title: "계약 목적",
            content: "①본 계약은 서비스 제공에 관한 사항을 정함을 목적으로 한다.",
            essential: true,
            category: "basic"
          },
          {
            number: 2,
            title: "계약 조건",
            content: "①계약 조건은 별도 협의하여 정한다.",
            essential: true,
            category: "basic"
          }
        ],
        meta: { model: "claude-contract-v1", version: "1.0", contractLength: "standard" }
      });
    }
  }