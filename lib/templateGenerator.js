// lib/templateGenerator.js - 3단계 파이프라인 템플릿 기반 계약서 생성 엔진

import { matchTemplateWithGPT } from './templateMatcher';
import { getPaymentSchedule, getTimelineFromDuration } from './contractUtils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 템플릿 기반 계약서 생성 (메인 함수)
 * 3단계 파이프라인: GPT 템플릿 매칭 → GPT 조항 선택 → Claude 조항 완성
 */
export async function generateContractFromTemplate({ contractData, selectedServices, quoteData, options }) {
  try {
    console.log('템플릿 기반 계약서 생성 시작 (3단계 파이프라인)');
    
    // 견적서 데이터 준비
    const quoteInfo = await prepareQuoteData(quoteData, contractData, selectedServices);
    console.log('견적서 데이터 준비 완료:', {
      finalAmount: quoteInfo.finalAmount,
      originalAmount: quoteInfo.originalAmount,
      discountAmount: quoteInfo.discountAmount,
      services: quoteInfo.services?.length || 0
    });
    
    // 1단계: GPT-4o-mini로 템플릿 매칭
    console.log('1단계: GPT 템플릿 매칭 시작...');
    const matchResult = await matchTemplateWithGPT(quoteInfo);
    
    if (!matchResult.success || matchResult.matches.templates.length === 0) {
      throw new Error(`템플릿 매칭 실패: ${matchResult.error || '적합한 템플릿이 없습니다'}`);
    }
    
    console.log(`1단계 완료: ${matchResult.matches.templates.length}개 템플릿 선택`);
    
    // 2단계: GPT-4o-mini로 조항 선택
    console.log('2단계: GPT 조항 선택 시작...');
    const clauseSelection = await selectClausesWithGPT(matchResult.matches.templates, quoteInfo, options);
    
    if (!clauseSelection.success || clauseSelection.selectedClauses.length === 0) {
      throw new Error(`조항 선택 실패: ${clauseSelection.error || '선택된 조항이 없습니다'}`);
    }
    
    console.log(`2단계 완료: ${clauseSelection.selectedClauses.length}개 조항 선택`);
    
    // 3단계: Claude Sonnet으로 조항 완성
    console.log('3단계: Claude 조항 완성 시작...');
    const contractCompletion = await completeClausesWithClaude(
      clauseSelection.selectedClauses, 
      quoteInfo, 
      contractData, 
      options
    );
    
    if (!contractCompletion.success) {
      throw new Error(`조항 완성 실패: ${contractCompletion.error}`);
    }
    
    console.log(`3단계 완료: ${contractCompletion.clauses.length}개 조항 완성`);
    
    // 최종 계약서 조립
    const finalContract = assembleFinalContract(
      contractCompletion.clauses,
      quoteInfo,
      contractData,
      selectedServices,
      {
        templateMatching: matchResult,
        clauseSelection: clauseSelection,
        claudeCompletion: contractCompletion
      }
    );
    
    console.log(`템플릿 기반 계약서 생성 완료: ${finalContract.clauses.length}개 조항`);
    
    return finalContract;
    
  } catch (error) {
    console.error('템플릿 기반 계약서 생성 오류:', error);
    return {
      success: false,
      error: error.message,
      userMessage: '템플릿 기반 계약서 생성에 실패했습니다. AI 맞춤 생성을 시도해보시거나, 잠시 후 다시 시도해주세요.'
    };
  }
}

/**
 * 견적서 데이터 준비 (할인금액 정확 처리)
 */
async function prepareQuoteData(quoteData, contractData, selectedServices) {
  // 1. 견적서 ID가 있으면 데이터베이스에서 조회
  if (quoteData?.quoteId || contractData?.quoteId) {
    const quoteId = quoteData?.quoteId || contractData?.quoteId;
    
    try {
      const quote = await prisma.quote.findUnique({
        where: { id: parseInt(quoteId) },
        include: { client: true }
      });
      
      if (quote) {
        const items = parseQuoteItems(quote.items);
        const metadata = parseQuoteMetadata(quote.metadata);
        
        // auto-contract.js와 동일한 구조로 통일
        const pricing = metadata.pricing || {};
        
        quoteData = {
          paymentTerms: {
            contractPercentage: paymentTerms?.contractPercentage || 0,
            progressPercentage: paymentTerms?.progressPercentage || 0,
            finalPercentage: paymentTerms?.finalPercentage || 0,
            contractTiming: paymentTerms?.contractTiming || '계약과 동시',
            progressTiming: paymentTerms?.progressTiming || '중간 납품 시',
            finalTiming: paymentTerms?.finalTiming || '검수완료시'
          },
          originalAmount: pricing.subtotal || quote.amount,
          discountedAmount: pricing.total || quote.amount, // 할인된 최종 금액
          deliveryDays: metadata.options?.deliveryDays ?? null,
          inspectionDays: metadata.options?.inspectionDays ?? null,
          pricing: pricing,
          vatExcluded: true
        };
        
        console.log('견적서 데이터 통일 (auto-contract.js 방식):', {
          originalAmount: quoteData.originalAmount,
          discountedAmount: quoteData.discountedAmount,
          dbAmount: quote.amount
        });
        
        // 지급조건 추출
        let paymentTerms = null;
        if (metadata.paymentTerms?.schedule) {
          const schedule = metadata.paymentTerms.schedule;
          paymentTerms = {
            contractPercentage: schedule.find(s => s.order === 1)?.percentage || 0,
            progressPercentage: schedule.find(s => s.order === 2)?.percentage || 0,
            finalPercentage: schedule.find(s => s.order === 3)?.percentage || 0,
            contractTiming: '계약과 동시',
            progressTiming: '중간 납품 시', 
            finalTiming: '검수완료시'
          };
        }
        
        return {
          id: quote.id,
          title: quote.title,
          amount: finalAmount, // 할인된 최종 금액 사용
          items: JSON.stringify(items),
          metadata: JSON.stringify(metadata),
          services: items.map(item => ({
            name: item.serviceName || item.name || '서비스',
            description: item.serviceDescription || item.description || '',
            price: item.totalPrice || item.unitPrice || item.price || 0,
            features: item.serviceFeatures || []
          })),
          client: quote.client,
          paymentTerms: paymentTerms,
          deliveryDays: metadata.options?.deliveryDays || 30,
          inspectionDays: metadata.options?.inspectionDays || 3,
          // 할인 관련 정보
          originalAmount: originalAmount,
          discountAmount: discountAmount,
          finalAmount: finalAmount
        };
      }
    } catch (error) {
      console.error('견적서 조회 오류:', error);
    }
  }
  
  // 2. 견적서가 없으면 contractData와 selectedServices로 구성
  const totalAmount = calculateTotalAmount(contractData, selectedServices, quoteData);
  const services = prepareServicesData(contractData, selectedServices);
  
  return {
    id: 0,
    title: contractData.serviceName || services[0]?.name || '서비스',
    amount: totalAmount,
    items: JSON.stringify(services),
    metadata: JSON.stringify({
      duration: contractData.duration || '30일',
      options: {
        deliveryDays: contractData.deliveryDays || quoteData?.deliveryDays || 30,
        inspectionDays: contractData.inspectionDays || quoteData?.inspectionDays || 3
      },
      paymentTerms: quoteData?.paymentTerms || null,
      pricing: {
        subtotal: totalAmount,
        discountAmount: 0,
        total: totalAmount
      }
    }),
    services: services,
    client: contractData.client || {
      name: contractData.clientName || '발주자',
      email: contractData.clientEmail || '',
      company: contractData.clientCompany || ''
    },
    paymentTerms: quoteData?.paymentTerms || null,
    deliveryDays: contractData.deliveryDays || quoteData?.deliveryDays || 30,
    inspectionDays: contractData.inspectionDays || quoteData?.inspectionDays || 3,
    // 할인 정보 (견적서 없는 경우)
    originalAmount: totalAmount,
    discountAmount: 0,
    finalAmount: totalAmount
  };
}

/**
 * 2단계: GPT-4o-mini로 조항 선택 (복잡도별 강화)
 */
async function selectClausesWithGPT(selectedTemplates, quoteInfo, options) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY가 설정되지 않음');
    }
    
    // 선택된 템플릿들의 모든 조항 수집
    const allClauses = [];
    selectedTemplates.forEach(template => {
      const templateClauses = template.clauses || [];
      templateClauses.forEach(clause => {
        allClauses.push({
          ...clause,
          templateId: template.id,
          templateName: template.name,
          templateCategory: template.category
        });
      });
    });
    
    console.log(`총 ${allClauses.length}개 조항에서 선택`);
    
    const prompt = createClauseSelectionPrompt(allClauses, quoteInfo, options);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.1
      })
    });
    
    if (!response.ok) {
      throw new Error(`GPT 조항 선택 실패: ${response.status}`);
    }
    
    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    const selectedClauses = parseClauseSelectionResponse(content, allClauses);
    
    return {
      success: true,
      selectedClauses: selectedClauses,
      totalAvailable: allClauses.length,
      selectionCriteria: {
        complexity: options?.complexity || 'standard',
        serviceType: quoteInfo.services?.[0]?.name || '서비스'
      }
    };
    
  } catch (error) {
    console.error('GPT 조항 선택 오류:', error);
    return {
      success: false,
      error: error.message,
      selectedClauses: []
    };
  }
}

/**
 * 3단계: Claude Sonnet으로 조항 완성
 */
async function completeClausesWithClaude(selectedClauses, quoteInfo, contractData, options) {
  try {
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      throw new Error('CLAUDE_API_KEY가 설정되지 않음');
    }
    
    const prompt = createClauseCompletionPrompt(selectedClauses, quoteInfo, contractData, options);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Claude 조항 완성 실패: ${response.status}`);
    }
    
    const result = await response.json();
    const content = result.content[0]?.text;
    
    if (!content) {
      throw new Error('Claude로부터 응답을 받지 못했습니다');
    }
    
    const completedClauses = parseClaudeCompletionResponse(content);
    
    return {
      success: true,
      clauses: completedClauses,
      originalClauseCount: selectedClauses.length,
      completedClauseCount: completedClauses.length
    };
    
  } catch (error) {
    console.error('Claude 조항 완성 오류:', error);
    return {
      success: false,
      error: error.message,
      clauses: []
    };
  }
}

/**
 * GPT 조항 선택 프롬프트 (복잡도 강화)
 */
function createClauseSelectionPrompt(allClauses, quoteInfo, options) {
  const serviceText = quoteInfo.services?.map(s => 
    `${s.name || s.serviceName || ''}: ${s.description || s.serviceDescription || ''}`
  ).join('\n') || '서비스';
  
  const clauseList = allClauses.map((clause, index) => 
    `${index + 1}. ${clause.title || clause.categoryName || `조항${index + 1}`} (출처: ${clause.templateName})`
  ).join('\n');
  
  const complexity = options?.complexity || 'standard';
  
  // 복잡도별 강화된 가이드라인
  let targetClauseCount, selectionCriteria, mandatoryInstructions;
  
  if (complexity === 'simple') {
    targetClauseCount = '6-8개';
    selectionCriteria = '핵심 필수 조항만 선택. 과도한 세부사항 제외';
    mandatoryInstructions = '반드시 8개 이하로 제한하세요. 더 적어도 좋습니다.';
  } else if (complexity === 'detailed') {
    targetClauseCount = '15-20개';
    selectionCriteria = '포괄적이고 상세한 보호 조항 포함. 리스크 관리 중시';
    mandatoryInstructions = '반드시 15개 이상 선택하세요. 상세한 보호를 위해 더 많은 조항이 필요합니다.';
  } else {
    targetClauseCount = '10-12개';
    selectionCriteria = '표준적인 계약서 수준. 필수사항과 보호조항 균형';
    mandatoryInstructions = '10-12개 범위를 엄격히 지켜주세요.';
  }
  
  return `계약서에 포함할 조항들을 선택하세요.

### 서비스 정보
${serviceText}
금액: ${(quoteInfo.finalAmount || quoteInfo.amount || 0).toLocaleString()}원
복잡도: ${complexity}

### 사용 가능한 조항 목록
${clauseList}

### 선택 기준
1. 서비스 특성에 필수적인 조항 우선
2. **목표: ${targetClauseCount} 조항 선택**
3. ${selectionCriteria}
4. 기본 필수: 계약 목적, 대금 지급, 납품/완료, 검수, 해지 조건

### ⚠️ 중요 지침
${mandatoryInstructions}

### 응답 형식
선택한 조항 번호만 JSON 배열로 응답하세요:
{"selectedNumbers": [1, 3, 5, 7, 9, 12]}`;
}

/**
 * Claude 조항 완성 프롬프트 (줄바꿈 강화)
 */
function createClauseCompletionPrompt(selectedClauses, quoteInfo, contractData, options) {
  const serviceText = quoteInfo.services?.map(s => 
    `${s.name || s.serviceName || ''}: ${s.description || s.serviceDescription || ''}`
  ).join('\n') || '서비스';
  
  const clausesToComplete = selectedClauses.map((clause, index) => 
    `${index + 1}. ${clause.title || clause.categoryName || `제${index + 1}조`}`
  ).join('\n');
  
  const paymentInfo = generatePaymentInfo(quoteInfo);
  const deliveryInfo = `납품기한: ${quoteInfo.deliveryDays || 30}일`;
  const inspectionInfo = `검수기간: ${quoteInfo.inspectionDays || 3}일`;
  
  // 복잡도별 작성 지침
  const complexity = options?.complexity || 'standard';
  let writingInstructions;
  
  if (complexity === 'simple') {
    writingInstructions = `
### 간단형 작성 지침
- 각 조항을 ①②③ 최대 3개 항목으로 간결하게 작성
- 핵심 내용만 포함, 부가 설명 최소화
- 명확하고 이해하기 쉬운 표현 사용`;
  } else if (complexity === 'detailed') {
    writingInstructions = `
### 상세형 작성 지침  
- 각 조항을 ①②③④⑤⑥ 6-8개 항목으로 상세하게 작성
- 예외 상황과 세부 조건 구체적으로 명시
- 리스크 관리 요소 적극 포함`;
  } else {
    writingInstructions = `
### 표준형 작성 지침
- 각 조항을 ①②③④ 4-5개 항목으로 적절히 작성  
- 필요한 내용과 보호 조항 균형있게 포함
- 일반적인 계약서 수준의 상세도 유지`;
  }
  
  return `한국 계약서 전문가로서 다음 조항들을 완성하세요.

### 계약 정보
서비스: ${serviceText}
고객: ${contractData.client?.name || contractData.clientName || '발주자'}
${paymentInfo}
${deliveryInfo}
${inspectionInfo}

${writingInstructions}

### 완성할 조항 목록
${clausesToComplete}

### ⚠️ 중요 작성 규칙
1. **각 조항의 ①②③ 항목들을 반드시 줄바꿈(\\n)으로 구분**
2. 실제 서비스명과 **할인된 최종 금액**을 정확히 반영
3. 한국 계약서 표준 형식 준수
4. 법적 효력이 있는 명확한 표현 사용

### 줄바꿈 예시
"content": "①첫 번째 내용\\n②두 번째 내용\\n③세 번째 내용"

### 응답 형식 (JSON만)
{
  "clauses": [
    {
      "number": 1,
      "title": "계약의 목적",
      "content": "①첫 번째 내용\\n②두 번째 내용\\n③세 번째 내용",
      "category": "basic"
    }
  ]
}

**JSON 형식만 출력하세요. 다른 설명은 포함하지 마세요.**`;
}

/**
 * 헬퍼 함수들
 */
function parseQuoteItems(itemsJson) {
  try {
    if (typeof itemsJson === 'string') {
      return JSON.parse(itemsJson);
    }
    return itemsJson || [];
  } catch (error) {
    console.error('견적서 항목 파싱 오류:', error);
    return [];
  }
}

function parseQuoteMetadata(metadataJson) {
  try {
    if (typeof metadataJson === 'string') {
      return JSON.parse(metadataJson);
    }
    return metadataJson || {};
  } catch (error) {
    console.error('견적서 메타데이터 파싱 오류:', error);
    return {};
  }
}

function calculateTotalAmount(contractData, selectedServices, quoteData) {
  // 1순위: 할인된 최종 금액
  if (quoteData?.discountedAmount !== undefined) {
    return quoteData.discountedAmount;
  }
  
  // 2순위: 견적서 금액
  if (quoteData?.amount !== undefined) {
    return quoteData.amount;
  }
  
  // 3순위: 서비스 합계
  if (selectedServices?.length > 0) {
    return selectedServices.reduce((sum, service) => 
      sum + (service.price || service.totalPrice || 0), 0
    );
  }
  
  // 4순위: 계약 데이터 금액
  return contractData.amount || 0;
}

function prepareServicesData(contractData, selectedServices) {
  if (selectedServices && selectedServices.length > 0) {
    return selectedServices.map(service => ({
      name: service.serviceName || service.name || '서비스',
      description: service.serviceDescription || service.description || '',
      price: service.price || 0
    }));
  }
  
  return [{
    name: contractData.serviceName || '서비스',
    description: contractData.serviceDescription || '',
    price: contractData.amount || 0
  }];
}

function generatePaymentInfo(quoteInfo) {
  const finalAmount = quoteInfo.discountedAmount || quoteInfo.amount || 0; // 할인된 최종 금액 사용
  
  console.log('지급조건 생성:', {
    할인된금액: quoteInfo.discountedAmount,
    원래금액: quoteInfo.originalAmount,
    사용금액: finalAmount
  });
  
  if (!quoteInfo.paymentTerms) {
    return `지급조건: 총 ${finalAmount.toLocaleString()}원, 계약 완료 후 일괄 지급`;
  }
  
  const { contractPercentage, progressPercentage, finalPercentage } = quoteInfo.paymentTerms;
  const parts = [];
  
  if (contractPercentage > 0) {
    const amount = Math.round(finalAmount * contractPercentage / 100); // 할인된 금액 기준 계산
    parts.push(`계약금 ${contractPercentage}% (${amount.toLocaleString()}원)`);
  }
  if (progressPercentage > 0) {
    const amount = Math.round(finalAmount * progressPercentage / 100); // 할인된 금액 기준 계산
    parts.push(`중도금 ${progressPercentage}% (${amount.toLocaleString()}원)`);
  }
  if (finalPercentage > 0) {
    const amount = Math.round(finalAmount * finalPercentage / 100); // 할인된 금액 기준 계산
    parts.push(`잔금 ${finalPercentage}% (${amount.toLocaleString()}원)`);
  }
  
  return parts.length > 0 ? 
    `지급조건: 총 ${finalAmount.toLocaleString()}원, ${parts.join(', ')}` : 
    `지급조건: 총 ${finalAmount.toLocaleString()}원, 계약 완료 후 일괄 지급`;
}

function parseClauseSelectionResponse(content, allClauses) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON 형식을 찾을 수 없음');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    const selectedNumbers = parsed.selectedNumbers || [];
    
    return selectedNumbers
      .filter(num => num >= 1 && num <= allClauses.length)
      .map(num => allClauses[num - 1]);
      
  } catch (error) {
    console.error('조항 선택 응답 파싱 오류:', error);
    // 기본 조항들 반환
    return allClauses.slice(0, Math.min(10, allClauses.length));
  }
}

function parseClaudeCompletionResponse(content) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON 형식을 찾을 수 없음');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    const clauses = parsed.clauses || [];
    
    // 줄바꿈 처리: \\n을 실제 줄바꿈으로 변환
    const processedClauses = clauses.map(clause => ({
      ...clause,
      content: (clause.content || '')
        .replace(/\\n/g, '\n')  // \\n → \n
        .replace(/\\\\/g, '\\') // \\\\ → \\ (이중 백슬래시 정리)
    }));
    
    console.log('Claude 조항 완성 후 줄바꿈 처리:', processedClauses.length, '개');
    
    return processedClauses;
    
  } catch (error) {
    console.error('Claude 완성 응답 파싱 오류:', error);
    return [];
  }
}

function assembleFinalContract(clauses, quoteInfo, contractData, selectedServices, pipelineResults) {
  const serviceTitle = selectedServices?.length > 1 
    ? `${selectedServices.length}개 서비스 통합 패키지`
    : selectedServices?.[0]?.serviceName || quoteInfo.services?.[0]?.name || '서비스';

  const finalAmount = quoteInfo.discountedAmount || quoteInfo.amount || 0; // 할인된 최종 금액

  return {
    success: true,
    contractInfo: {
      title: `${serviceTitle} 서비스 계약서`,
      client: quoteInfo.client || {
        name: contractData.clientName || '발주자',
        email: contractData.clientEmail || ''
      },
      provider: {
        name: contractData.provider?.name || '수행자',
        email: contractData.provider?.email || ''
      },
      project: {
        title: serviceTitle,
        services: quoteInfo.services || [],
        totalAmount: finalAmount, // 할인 적용된 최종 금액
        originalAmount: quoteInfo.originalAmount, // 할인 전 원래 금액
        discountAmount: (quoteInfo.originalAmount || 0) - finalAmount, // 할인 금액 계산
        duration: contractData.duration || '30일'
      }
    },
    clauses: clauses.map((clause, index) => ({
      ...clause,
      id: `template_clause_${index + 1}`,
      order: index + 1,
      essential: ['계약의 목적', '대금 지급', '계약 해지'].includes(clause.title)
    })),
    paymentSchedule: getPaymentSchedule(finalAmount, quoteInfo), // 할인된 금액 기준
    projectTimeline: getTimelineFromDuration(contractData.duration || '30일'),
    metadata: {
      generatedBy: 'template-pipeline-system',
      pipelineStages: {
        templateMatching: pipelineResults.templateMatching.matches.templates.length,
        clauseSelection: pipelineResults.clauseSelection.selectedClauses.length,
        claudeCompletion: pipelineResults.claudeCompletion.clauses.length
      },
      contractLength: contractData.contractLength || 'standard',
      serviceCount: selectedServices?.length || 1,
      totalAmount: finalAmount, // 할인 적용된 최종 금액
      totalClauses: clauses.length,
      riskLevel: 'medium',
      completeness: 100,
      model: 'gpt-4o-mini + claude-sonnet-4-pipeline'
    }
  };
}

export default {
  generateContractFromTemplate
};