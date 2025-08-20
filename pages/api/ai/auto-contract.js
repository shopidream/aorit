// pages/api/ai/auto-contract.js - GPT+Claude 협업 및 템플릿 기반 계약서 생성 시스템

import { verifyToken } from '../../../lib/auth';
import { 
  CONTRACT_LENGTH_OPTIONS,
  getRecommendedLength,
  validateInputData,
  calculateMetrics,
  prepareLegalData,
  getTimelineFromDuration,
  getPaymentSchedule,
  parseGPTStructureResponse,
  parseClaudeDetailResponse,
  analyzeServiceComplexity
} from '../../../lib/contractUtils';
import { 
  saveContractToDatabase,
  disconnectPrisma 
} from '../../../lib/contractDatabase';
import { generateContractFromTemplate } from '../../../lib/templateGenerator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Next.js API 라우트 메인 핸들러
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }

    let userId;
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const { 
      contractData, 
      selectedServices = [], 
      options = {},
      contractLength = null,
      quoteId = null,
      generation_type = 'ai' // 새로 추가: 'ai' | 'template'
    } = req.body;

    if (!contractData) {
      return res.status(400).json({ 
        error: '계약 데이터가 필요합니다',
        required: ['contractData']
      });
    }

    const validation = validateInputData(contractData, selectedServices);
    if (!validation.isValid) {
      return res.status(400).json({
        error: '입력 데이터 검증 실패',
        details: validation.errors
      });
    }

    // 견적서 데이터 가져오기 (지급조건 및 납기일 동기화용)
    let quoteData = null;
    if (quoteId) {
      try {
        const quote = await prisma.quote.findFirst({
          where: { id: parseInt(quoteId), userId: userId }
        });
        
        if (quote && quote.metadata) {
          const metadata = JSON.parse(quote.metadata);
          const paymentTerms = metadata.paymentTerms || {};
          const pricing = metadata.pricing || {};
          
          // paymentTerms.schedule에서 실제 지급조건 추출
          let contractPercentage = 0, progressPercentage = 0, finalPercentage = 0;
          let contractTiming = '계약과 동시', progressTiming = '중간 납품 시', finalTiming = '검수완료시';
          
          if (paymentTerms.schedule && Array.isArray(paymentTerms.schedule)) {
            paymentTerms.schedule.forEach(item => {
              if (item.order === 1) contractPercentage = item.percentage;
              else if (item.order === 2) progressPercentage = item.percentage;
              else if (item.order === 3) finalPercentage = item.percentage;
            });
          }
          
          // 지급 조건 텍스트 추출
          if (options.paymentTerms) {
            if (options.paymentTerms.contractTiming === 'custom' && options.paymentTerms.contractCustom) {
              contractTiming = options.paymentTerms.contractCustom;
            } else if (options.paymentTerms.contractTiming === 'contract') {
              contractTiming = '계약과 동시';
            }
            
            if (options.paymentTerms.progressTiming === 'custom' && options.paymentTerms.progressCustom) {
              progressTiming = options.paymentTerms.progressCustom;
            } else if (options.paymentTerms.progressTiming === 'delivery') {
              progressTiming = '중간 납품 시';
            }
            
            if (options.paymentTerms.finalTiming === 'custom' && options.paymentTerms.finalCustom) {
              finalTiming = options.paymentTerms.finalCustom;
            } else if (options.paymentTerms.finalTiming === 'inspection') {
              finalTiming = '검수완료시';
            }
          }
          
          quoteData = {
            paymentTerms: {
              contractPercentage,
              progressPercentage,
              finalPercentage,
              contractTiming,
              progressTiming,
              finalTiming
            },
            originalAmount: pricing.subtotal || quote.amount,
            discountedAmount: pricing.total || quote.amount,
            deliveryDays: metadata.options?.deliveryDays ?? null,
            inspectionDays: metadata.options?.inspectionDays ?? null,
            pricing: metadata.pricing || null,
            vatExcluded: true
          };
          
          console.log('견적서 동기화 데이터:', JSON.stringify(quoteData, null, 2));
        }
      } catch (error) {
        console.error('견적서 데이터 조회 오류:', error);
      }
    }

    // totalAmount 계산 (quoteData 초기화 후)
    const totalAmount = quoteData?.discountedAmount || (selectedServices.length > 0
      ? selectedServices.reduce((sum, s) => sum + (s.price || 0), 0)
      : contractData.amount);

    // 계약서 길이 자동 추천 또는 사용자 선택 적용
    const recommendedLength = getRecommendedLength(contractData, selectedServices, totalAmount);
    const finalLength = contractLength || recommendedLength;
    
    if (!CONTRACT_LENGTH_OPTIONS[finalLength]) {
      return res.status(400).json({ 
        error: '유효하지 않은 계약서 길이 옵션',
        validOptions: Object.keys(CONTRACT_LENGTH_OPTIONS)
      });
    }

    const startTime = Date.now();
    let contract;

    // 생성 방식 선택
    if (generation_type === 'template') {
      console.log('템플릿 기반 계약서 생성 시작...');
      
      contract = await generateContractFromTemplate({
        contractData,
        selectedServices,
        quoteData,
        options: {
          ...options,
          contractLength: finalLength,
          lengthOption: CONTRACT_LENGTH_OPTIONS[finalLength]
        }
      });
      
    } else {
      console.log('AI 협업 계약서 생성 시작...');
      
      contract = await generateCollaborativeContract({
        contractData,
        selectedServices,
        quoteData,
        options: {
          ...options,
          contractLength: finalLength,
          lengthOption: CONTRACT_LENGTH_OPTIONS[finalLength]
        }
      });
    }

    if (!contract.success) {
      return res.status(500).json({
        error: '계약서 생성 실패',
        details: contract.error,
        fallback: contract.fallback || null
      });
    }

    const finalContract = {
      ...contract,
      metadata: {
        ...(contract.metadata || {}),
        contractLength: finalLength,
        recommendedLength,
        lengthOption: CONTRACT_LENGTH_OPTIONS[finalLength],
        processingTime: Date.now() - startTime,
        apiGenerated: true,
        userId: user.id,
        totalServices: selectedServices.length,
        serviceComplexity: analyzeServiceComplexity(selectedServices),
        model: generation_type === 'template' 
          ? 'template-system' 
          : 'gpt-4o-mini + claude-sonnet-4-collaboration',
        quoteSync: quoteData ? true : false,
        generationType: generation_type
      }
    };

    if (options.saveToDatabase !== false) {
      const savedContract = await saveContractToDatabase(user.id, finalContract, contractData);
      return res.status(201).json({
        success: true,
        contract: finalContract,
        savedContract,
        metrics: calculateMetrics(finalContract, startTime)
      });
    }

    return res.status(200).json({
      success: true,
      contract: finalContract,
      metrics: calculateMetrics(finalContract, startTime)
    });

  } catch (error) {
    console.error('계약서 생성 오류:', error);
    return res.status(500).json({
      error: '서버 내부 오류',
      details: error.message
    });
  } finally {
    await disconnectPrisma();
  }
}

// GPT+Claude 협업 계약서 생성 (기존 로직 유지)
async function generateCollaborativeContract({ contractData, selectedServices, quoteData, options }) {
  try {
    const totalAmount = selectedServices.length > 0
      ? selectedServices.reduce((sum, s) => sum + (s.price || 0), 0)
      : contractData.amount;

    const lengthOption = options.lengthOption || CONTRACT_LENGTH_OPTIONS.standard;

    // 법적 기준 데이터 준비 (견적서 지급조건 포함)
    const legalData = prepareLegalData(contractData, selectedServices, totalAmount, quoteData);
    
    console.log(`1단계: GPT로 계약서 구조 설계 시작... (${lengthOption.name})`);
    
    // 1단계: GPT로 계약서 구조 설계
    const contractStructure = await designContractStructureWithGPT({
      contractData,
      selectedServices,
      totalAmount,
      legalData,
      lengthOption,
      quoteData
    });

    if (!contractStructure.success) {
      throw new Error(`GPT 구조 설계 실패: ${contractStructure.error}`);
    }

    console.log('🔍 GPT 구조 설계 결과 확인:');
    console.log('- 조항 개수:', contractStructure.structure?.clauseStructure?.length || 0);
    console.log('- 조항 목록:', contractStructure.structure?.clauseStructure?.map(c => c.title) || []);

    console.log(`2단계: Claude로 세부 조항 작성 시작... (${lengthOption.name})`);

    // 2단계: Claude로 세부 조항 작성
    const detailedContract = await writeDetailedClausesWithClaude({
      structure: contractStructure.structure,
      contractData,
      selectedServices,
      legalData,
      lengthOption,
      quoteData,
      totalAmount
    });

    if (!detailedContract.success) {
      throw new Error(`Claude 세부 작성 실패: ${detailedContract.error}`);
    }

    console.log('🔍 Claude 작성 결과 확인:');
    console.log('- 생성된 조항 개수:', detailedContract.clauses?.length || 0);
    console.log('- 생성된 조항 목록:', detailedContract.clauses?.map(c => c.title) || []);

    const serviceTitle = selectedServices.length > 1 
      ? `${selectedServices.length}개 서비스 통합 패키지`
      : selectedServices[0]?.serviceName || contractData.serviceName;

    const contractInfo = {
      title: `${serviceTitle} 서비스 계약서`,
      client: {
        name: contractData.client?.name || '발주자',
        email: contractData.client?.email || '',
        phone: contractData.client?.phone || '',
        company: contractData.client?.company || ''
      },
      provider: {
        name: contractData.provider?.name || '수행자',
        email: contractData.provider?.email || '',
        phone: contractData.provider?.phone || ''
      },
      project: {
        services: selectedServices.length > 0 ? selectedServices : [{
          name: contractData.serviceName,
          description: contractData.serviceDescription,
          price: contractData.amount
        }],
        totalAmount,
        duration: contractData.duration || '30일'
      }
    };

    return {
      success: true,
      contractInfo,
      clauses: detailedContract.clauses,
      paymentSchedule: getPaymentSchedule(totalAmount, quoteData),
      projectTimeline: getTimelineFromDuration(contractData.duration),
      metadata: {
        generatedBy: 'gpt-4o-mini + claude-sonnet-4-collaboration',
        contractLength: options.contractLength,
        lengthOption: lengthOption,
        serviceCount: selectedServices.length || 1,
        totalAmount,
        totalClauses: detailedContract.clauses.length,
        riskLevel: 'medium',
        completeness: 100,
        gptAnalysis: contractStructure.analysis,
        claudeAnalysis: detailedContract.analysis,
        quoteIntegration: quoteData ? {
          paymentSync: true,
          deliverySync: quoteData.deliveryDays >= 0,
          inspectionSync: quoteData.inspectionDays >= 0,
          vatExcluded: quoteData.vatExcluded
        } : null
      }
    };

  } catch (error) {
    console.error('GPT+Claude 협업 계약서 생성 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 1단계: GPT로 계약서 구조 설계 (기존 함수 유지)
async function designContractStructureWithGPT({ contractData, selectedServices, totalAmount, legalData, lengthOption, quoteData }) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY가 설정되지 않음');
    }

    const prompt = createGPTStructurePrompt({ contractData, selectedServices, totalAmount, legalData, lengthOption, quoteData });
    
    console.log('GPT 프롬프트 길이:', prompt.length);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 4000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GPT API 오류 응답:', errorText);
      throw new Error(`OpenAI API 오류: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    console.log('GPT 응답 길이:', content?.length || 0);
    console.log('GPT 응답 첫 100자:', content?.substring(0, 100) || 'No content');

    if (!content) {
      throw new Error('GPT로부터 응답을 받지 못했습니다');
    }

    return parseGPTStructureResponse(content);

  } catch (error) {
    console.error('GPT 구조 설계 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// GPT 구조 설계 프롬프트 (기존 함수 유지)
function createGPTStructurePrompt({ contractData, selectedServices, totalAmount, legalData, lengthOption, quoteData }) {
  const servicesText = selectedServices && selectedServices.length > 0
    ? selectedServices.map((s, i) =>
        `${i + 1}. ${s?.serviceName || ''} (${s?.price ? s.price.toLocaleString() + '원' : '가격 미정'})\n   ${s?.serviceDescription || ''}`
      ).join('\n\n')
    : `${contractData?.serviceName || ''}: ${contractData?.serviceDescription || ''}`;

  const lengthInstruction = {
    simple: '간소하고 핵심적인 조항만 포함. 복잡한 관리 절차 생략.',
    standard: '일반적인 계약서 수준의 조항 포함.',
    detailed: '견적서의 각 세부항목을 구체적으로 반영. 포괄적 보호 조항 포함.'
  }[lengthOption.detailLevel] || '일반적인 계약서 수준의 조항 포함.';

  // 견적서 동기화 정보 추가
  const paymentInfo = quoteData && quoteData.paymentTerms
    ? generatePaymentInfoWithTiming(quoteData.paymentTerms, totalAmount)
    : `지급조건: 서비스 완료 후 일괄 지급`;

  const deliveryInfo = `납품기한: 계약일로부터 ${quoteData?.deliveryDays || 0}일${(quoteData?.deliveryDays || 0) === 0 ? '(당일)' : (quoteData?.deliveryDays || 0) === 1 ? '(익일)' : ''}`;
    
  const inspectionInfo = `검수기간: ${quoteData?.inspectionDays || 0}일${(quoteData?.inspectionDays || 0) === 0 ? '(즉시)' : ''}`;

  console.log('📅 납기/검수 디버깅:', {
    deliveryDays: quoteData?.deliveryDays,
    inspectionDays: quoteData?.inspectionDays,
    deliveryInfo,
    inspectionInfo
  });

  return `당신은 한국 계약서 기획 전문가입니다.
아래 견적서·계약 정보를 분석하여 계약서 구조(조항 목록과 각 조항의 핵심요점)만 JSON으로 설계하세요.
출력은 반드시 유효한 JSON 하나만 반환하십시오. 설명 문구는 절대 포함하지 마십시오.
만약 처리 불가 시 {"error":"사유"} 형태만 출력하세요.

=== 계약서 길이 설정 ===
길이 옵션: ${lengthOption.name} (${lengthOption.description})
상세도: ${lengthOption.detailLevel}
조항 구성 지침: ${lengthInstruction}

=== 입력(요약) ===
견적 / 서비스:
${servicesText}

계약정보:
- 발주자: ${legalData?.clientName || ''}
- 수행자: ${legalData?.providerName || ''}
- 총 금액: ${legalData?.totalAmount || totalAmount || 0}원 (부가세 별도)
- 계약 기간: ${legalData?.startDate || ''} ~ ${legalData?.endDate || ''}
- ${paymentInfo}
- ${deliveryInfo}
- ${inspectionInfo}
- 연체료율: ${legalData?.penaltyRate ?? ''}
- 통지기간: ${legalData?.noticePeriod ?? ''}
- 관할법원: ${legalData?.jurisdiction ?? ''}

=== 역할 ===
계약서 구조 설계자:
1) 서비스 특성을 분석해서 필수 포함 조항만 선별하세요.
   - 서비스가 원격이면 현장 안전·출장비 관련 조항 제외
   - 서비스가 무형이면 장비 관리·보험 제외
   - 제조/물리 서비스면 납품물·검수·품질조항 포함
2) 반드시 포함할 항목:
   - 계약 목적, 계약금액 및 지급조건(견적서 조건 반영), 서비스별 납품물 및 완료기준, 검수/인수(견적서 기간 반영), 지식재산권(해당 시), 하자보수, 수정 범위, 손해배상, 분쟁해결(관할법원)
3) ${lengthOption.name} 수준에 맞는 조항 개수 조절:
   ${lengthOption.detailLevel === 'minimal' ? '- 최소 필수 조항만 포함 (8-12개)' :
     lengthOption.detailLevel === 'comprehensive' ? '- 포괄적이고 상세한 조항 포함 (18-25개)' :
     '- 표준적인 조항 구성 (12-18개)'}
4) 출력 스키마(엄격 준수):
{
  "analysis": "서비스 특성 및 ${lengthOption.name} 적용 요약(한 줄)",
  "serviceType": "원격|현장|혼합, 창작물/물리",
  "contractLength": "${lengthOption.detailLevel}",
  "clauseStructure": [
    {
      "number": 1,
      "title": "계약 목적",
      "summary": "핵심 요점 1-2줄",
      "essential": true,
      "category": "basic|service|payment|legal|delivery|warranty|other"
    }
  ]
}

출력은 이 JSON 스키마를 정확히 따르세요. JSON 외 텍스트 금지.`;
}

// 2단계: Claude로 세부 조항 작성 (기존 함수 유지)
async function writeDetailedClausesWithClaude({ structure, contractData, selectedServices, legalData, lengthOption, quoteData, totalAmount }) {
  try {
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    if (!claudeApiKey) {
      throw new Error('CLAUDE_API_KEY가 설정되지 않음');
    }

    const prompt = createClaudeDetailPrompt({ structure, contractData, selectedServices, legalData, lengthOption, quoteData, totalAmount });
    console.log('💰 금액 디버깅:', {
      quoteDiscounted: quoteData?.discountedAmount,
      totalAmount: totalAmount,
      contractAmount: Math.round((quoteData?.discountedAmount || totalAmount) * (quoteData?.paymentTerms?.contractPercentage || 0) / 100)
    });
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 64000,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API 오류 응답:', errorText);
      throw new Error(`Claude API 오류: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('🛠️ Claude API 전체 응답:', JSON.stringify(result, null, 2));
    const content = result.content[0]?.text;

    console.log('Claude 원본 응답 길이:', content?.length || 0);
    console.log('Claude 응답 첫 300자:', content?.substring(0, 300) || 'No content');
    console.log('Claude 응답 마지막 300자:', content?.substring(content.length - 300) || 'No content');

    if (!content) {
      throw new Error('Claude로부터 응답을 받지 못했습니다');
    }

    const parseResult = parseClaudeDetailResponse(content);
    console.log('🔍 Claude 파싱 결과 확인:');
    console.log('- 파싱 성공:', parseResult.success);
    console.log('- 파싱된 조항 개수:', parseResult.clauses?.length || 0);
    
    return parseResult;

  } catch (error) {
    console.error('Claude 세부 작성 오류:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Claude 세부 작성 프롬프트 (기존 함수 유지)
function createClaudeDetailPrompt({ structure, contractData, selectedServices, legalData, lengthOption, quoteData, totalAmount }) {
  const servicesText = selectedServices && selectedServices.length > 0
    ? selectedServices.map((s, i) =>
        `${i + 1}. ${s?.serviceName || ''} (${s?.price ? s.price.toLocaleString() + '원' : '가격 미정'})`
      ).join(', ')
    : `${contractData?.serviceName || ''}`;
  
  // deliveryInfo와 inspectionInfo 정의
  const deliveryInfo = quoteData?.deliveryDays !== null && quoteData?.deliveryDays !== undefined 
    ? `납품기한: ${quoteData.deliveryDays}일${quoteData.deliveryDays === 0 ? '(당일)' : quoteData.deliveryDays === 1 ? '(익일)' : ''}`
    : '납품기한: 0일(당일)';
    
  const inspectionInfo = quoteData?.inspectionDays !== null && quoteData?.inspectionDays !== undefined
    ? `검수기간: ${quoteData.inspectionDays}일${quoteData.inspectionDays === 0 ? '(즉시)' : ''}`
    : '검수기간: 0일(즉시)';  

  const clauseCount = structure?.clauseStructure?.length || 0;
  const detailInstructions = {
    minimal: {
      instruction: '각 조항은 핵심 내용만 간결하게 작성하세요.',
      clauseFormat: '① ② 최대 3개 항목으로 간결하게'
    },
    standard: {
      instruction: '일반적인 계약서 수준으로 작성하세요.',
      clauseFormat: '① ② ③ ④ 적절한 수준의 세부 항목 포함'
    },
    comprehensive: {
      instruction: '견적서의 각 세부항목을 구체적으로 언급하고, 포괄적인 보호 조항을 포함하세요.',
      clauseFormat: '① ② ③ ④ ⑤ ⑥ 상세한 세부 항목과 조건 명시'
    }
  }[lengthOption.detailLevel] || {};

  // 결제 조건 정보 (견적서 반영)
  const paymentDetails = legalData.paymentFromQuote
    ? `견적서에서 설정된 지급조건을 정확히 반영하세요: 계약금 ${legalData.downPaymentRate}%, 중도금 ${legalData.middlePaymentRate}%, 잔금 ${legalData.finalPaymentRate}%`
    : `기본 지급조건 적용: 계약금 ${legalData.downPaymentRate}%, 중도금 ${legalData.middlePaymentRate}%, 잔금 ${legalData.finalPaymentRate}%`;

  // 납기 및 검수 정보
  const deliveryDetails = legalData.deliveryInfo && legalData.inspectionInfo
    ? `견적서 납기/검수 조건: ${legalData.deliveryInfo}, ${legalData.inspectionInfo}`
    : '납기 및 검수 조건: 별도 협의';

  return `당신은 한국의 계약서 전문 변호사입니다.
GPT가 설계한 ${clauseCount}개 조항 구조를 모두 완성하세요.

=== 절대 지켜야 할 규칙 ===
1. 반드시 ${clauseCount}개 조항을 모두 작성하세요 (5개가 아닌 ${clauseCount}개!)
2. 각 조항마다 ①②③④⑤ 형태로 세부 항목을 여러 개 작성하세요
3. ${lengthOption.name} 수준이므로 각 조항을 상세히 작성하세요
4. 반드시 순수 JSON 형식만 출력하고, 설명이나 따옴표, 마크다운, 코드 블록, 다른 텍스트는 절대 포함하지 마십시오.

=== 서비스 정보 ===
서비스: ${servicesText}
총 금액: ${legalData?.totalAmount || '미정'}원 (부가세 별도)
${paymentDetails}
${deliveryDetails}

=== 절대 준수 사항 - 견적서 조건 ===
**총 계약금액:** ${formatAmountWithKorean(quoteData?.discountedAmount || totalAmount)}
**지급조건 (정확히 이 조건들을 사용하세요):**
${quoteData?.paymentTerms?.contractPercentage > 0 ? `- 계약금: ${quoteData.paymentTerms.contractPercentage}% ${formatAmountWithKorean(Math.round((quoteData?.discountedAmount || totalAmount) * quoteData.paymentTerms.contractPercentage / 100))} - ${quoteData.paymentTerms.contractTiming}` : ''}
${quoteData?.paymentTerms?.progressPercentage > 0 ? `- 중도금: ${quoteData.paymentTerms.progressPercentage}% ${formatAmountWithKorean(Math.round((quoteData?.discountedAmount || totalAmount) * quoteData.paymentTerms.progressPercentage / 100))} - ${quoteData.paymentTerms.progressTiming}` : ''}
${quoteData?.paymentTerms?.finalPercentage > 0 ? `- 잔금: ${quoteData.paymentTerms.finalPercentage}% ${formatAmountWithKorean(Math.round((quoteData?.discountedAmount || totalAmount) * quoteData.paymentTerms.finalPercentage / 100))} - ${quoteData.paymentTerms.finalTiming}` : ''}
**납품:** ${deliveryInfo}
**검수:** ${inspectionInfo}

이 조건들을 정확히 반영하고 절대 임의로 변경하지 마세요.

=== 작성해야 할 ${clauseCount}개 조항 구조 ===
${structure?.clauseStructure?.map((clause, index) => 
  `${index + 1}. ${clause.title} (${clause.category})`
).join('\n') || ''}

=== 조항 작성 예시 ===
"content": "①계약기간은 2025년 1월 1일부터 2025년 3월 31일까지로 한다. ②서비스 완료 기준은 모든 기능 구현 및 고객 승인으로 한다. ③지연 시 사전 협의를 통해 연장할 수 있다."

=== 출력 JSON 형식 ===
{
  "analysis": "작성 완료",
  "contractLength": "${lengthOption.detailLevel}",
  "clauses": [
    ${structure?.clauseStructure?.map((clause, index) => 
      `{
      "number": ${index + 1},
      "title": "${clause.title}",
      "content": "①... ②... ③...",
      "essential": ${clause.essential || false},
      "category": "${clause.category}"
    }`
    ).join(',\n    ') || ''}
  ]
}

반드시 위 ${clauseCount}개 조항을 모두 완성하고, 각 조항에 ①②③ 세부 항목을 포함하세요.`;
}

// 지급조건과 타이밍을 포함한 텍스트 생성 (기존 함수 유지)
function generatePaymentInfoWithTiming(paymentTerms, totalAmount) {
  const { contractPercentage, progressPercentage, finalPercentage, contractTiming, progressTiming, finalTiming } = paymentTerms;
  
  if (contractPercentage === 0 && progressPercentage === 0 && finalPercentage === 0) {
    return '지급조건: 서비스 완료 후 일괄 지급';
  }
  
  const parts = [];
  if (contractPercentage > 0) {
    const amount = Math.round(totalAmount * contractPercentage / 100);
    parts.push(`계약금 ${contractPercentage}% (${amount.toLocaleString()}원, ${contractTiming})`);
  }
  if (progressPercentage > 0) {
    const amount = Math.round(totalAmount * progressPercentage / 100);
    parts.push(`중도금 ${progressPercentage}% (${amount.toLocaleString()}원, ${progressTiming})`);
  }
  if (finalPercentage > 0) {
    const amount = Math.round(totalAmount * finalPercentage / 100);
    parts.push(`잔금 ${finalPercentage}% (${amount.toLocaleString()}원, ${finalTiming})`);
  }
  
  return `견적서 지급조건: ${parts.join(', ')}`;
}

function formatAmountWithKorean(amount) {
  return `${amount.toLocaleString()}원(${convertToKoreanMoney(amount)}, 부가세별도)`;
}

function convertToKoreanMoney(amount) {
  const units = ['', '만', '억', '조'];
  const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  
  if (amount === 0) return '영원';
  
  let result = '';
  let unitIndex = 0;
  
  while (amount > 0) {
    const segment = amount % 10000;
    if (segment > 0) {
      let segmentStr = '';
      
      const thousands = Math.floor(segment / 1000);
      const hundreds = Math.floor((segment % 1000) / 100);
      const tens = Math.floor((segment % 100) / 10);
      const ones = segment % 10;
      
      if (thousands > 0) segmentStr += digits[thousands] + '천';
      if (hundreds > 0) segmentStr += digits[hundreds] + '백';
      if (tens > 0) segmentStr += digits[tens] + '십';
      if (ones > 0) segmentStr += digits[ones];
      
      result = segmentStr + units[unitIndex] + result;
    }
    
    amount = Math.floor(amount / 10000);
    unitIndex++;
  }
  
  return result + '원';
}