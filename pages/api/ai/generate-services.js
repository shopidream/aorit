// pages/api/ai/generate-services.js - GPT-4o mini 기반 4개 서비스 생성 API

import { analyzeBusinessDescription, generateServices } from '../../../lib/serviceGenerator';
import { calculateServicePrice } from '../../../lib/priceCalculator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessDescription, step = 'full' } = req.body;

    if (!businessDescription?.trim()) {
      return res.status(400).json({ 
        error: 'businessDescription 필드가 필요합니다' 
      });
    }

    // 1단계: GPT-4o mini로 변수 분석 및 4개 서비스 생성
    let result;
    try {
      result = await enhanceServicesWithAI(businessDescription);
    } catch (aiError) {
      console.error('GPT 생성 실패, fallback 사용:', aiError);
      // Fallback: 기본 변수로 룰 기반 생성
      const fallbackVariables = {
        purpose: '고객 경험 개선',
        target: '개인', 
        format: '컨설팅',
        technology: '기타',
        revenue: '일회성 판매',
        operation: '수동 + 전문가 지원'
      };
      result = {
        variables: fallbackVariables,
        services: generateServices(fallbackVariables, 4)
      };
    }

    // 2단계: 정확히 3개 서비스 보장
    let finalServices = result.services || [];
    
    // 3개보다 적으면 기본 서비스로 채움
    if (finalServices.length < 3) {
      const additionalServices = generateDefaultServices(businessDescription, 3 - finalServices.length);
      finalServices = [...finalServices, ...additionalServices];
    }
    
    // 3개보다 많으면 자름
    if (finalServices.length > 3) {
      finalServices = finalServices.slice(0, 3);
    }

    // 3단계: 서비스에 가격 정보 추가
    const servicesWithPricing = finalServices.map((service, index) => ({
      ...service,
      id: service.id || `service_${Date.now()}_${index}`,
      estimatedPrice: service.estimatedPrice || service.price || 100000,
      priceRange: {
        min: Math.round((service.estimatedPrice || service.price || 100000) * 0.7),
        max: Math.round((service.estimatedPrice || service.price || 100000) * 1.3)
      },
      images: service.images || [],
      isActive: true,
      isPlan: false
    }));

    return res.status(200).json({
      success: true,
      variables: result.variables,
      classification: result.variables,
      industry: result.industry || '전문 서비스',
      suggestedServices: servicesWithPricing,
      services: servicesWithPricing, // 랜딩페이지 호환성
      recommendation: {
        message: generateRecommendation(result.variables, servicesWithPricing),
        confidence: calculateOverallConfidence(servicesWithPricing)
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        serviceCount: servicesWithPricing.length,
        method: 'ai_primary'
      }
    });

  } catch (error) {
    console.error('서비스 생성 오류:', error);
    return res.status(500).json({
      error: '서비스 생성 중 오류가 발생했습니다',
      details: error.message
    });
  }
}

/**
 * GPT-4o mini로 4개 서비스 생성
 */
async function enhanceServicesWithAI(description) {
  const prompt = createAnalysisPrompt(description);
  
  try {
    console.log('GPT-4o mini 3개 서비스 생성 요청');
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 한국의 다양한 업종을 분석하고 서비스 기획안을 작성하는 전문가입니다. 반드시 유효한 JSON 형식으로만 응답하세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.7
      })
    });

    const bodyText = await response.text();
    console.log('OpenAI status:', response.status);

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status} ${bodyText}`);
    }

    const data = JSON.parse(bodyText);
    let content = data.choices[0].message.content;
    
    // ```json 래퍼 제거
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/, '').replace(/```\s*$/, '').trim();
    }
    
    const aiResult = JSON.parse(content);
    
    return {
      variables: aiResult.variables,
      industry: aiResult.industry,
      services: aiResult.services.map((service, index) => ({
        id: `ai_${Date.now()}_${index}`,
        title: service.title,
        description: service.description,
        category: aiResult.variables.format,
        categoryId: getCategoryId(aiResult.variables.format),
        features: service.features || [],
        launchStrategy: service.launchStrategy,
        price: service.estimatedPrice || service.price || 100000,
        estimatedPrice: service.estimatedPrice || service.price || 100000,
        duration: service.duration || '협의',
        variables: aiResult.variables,
        images: [],
        isActive: true,
        isPlan: false,
        metadata: {
          generated: true,
          aiEnhanced: true,
          createdAt: new Date().toISOString(),
          confidence: service.confidence || 0.8
        }
      }))
    };

  } catch (error) {
    console.error('GPT 분석 실패:', error);
    throw error;
  }
}

/**
 * AI 분석 프롬프트 생성 - 4개 서비스 요청
 */
function createAnalysisPrompt(description) {
  return `아래 "업무 설명"을 바탕으로, 주어진 6개 핵심 변수를 먼저 분류한 뒤, 현실적이고 시장성이 있는 서비스 3가지를 제안하세요.

[핵심 변수 정의]
- purpose: 생산성 향상 / 비용 절감 / 고객 경험 개선 / 규제 대응 / 혁신 서비스 창출
- target: 개인 / 소상공인 / 중견·대기업 / 공공기관 / 글로벌 시장
- format: SaaS / 온프레미스 / 컨설팅 / 교육(온라인) / 교육(현장) / 공연·행사 / 제조 / 용역 / 복합형
- technology: AI / IoT / 블록체인 / 데이터 분석 / 로우코드 / 악기 / 전통 기술 / 없음
- revenue: 구독형 / 사용량 기반 / 라이선스 판매 / 일회성 판매 / 광고 / 혼합형
- operation: 자동화 / 수동+전문가 / 맞춤형 / 표준형 / 고보안 / 저비용

[분류 가이드라인]
1. 오프라인/현장 서비스는 format을 "교육(현장)", "용역", "공연·행사" 등으로 분류
2. 기술이 필요 없는 전통적 서비스는 technology를 "없음" 또는 관련 도구명(예: "악기")으로 표기
3. "가르쳐요", "레슨", "과외" → 교육(현장)으로 우선 분류
4. "시공", "청소", "수리" → 용역으로 분류
5. 무조건 IT/AI로 치우치지 말고 실제 업무 내용에 맞게 분류

[업무 설명]
"${description}"

[출력 지침]
1. 먼저 입력 설명에 맞춰 6개 변수 값을 추론
2. 해당 변수 조합에 맞는 조건부 전략과 필수 요소를 반영
3. 한국 시장에서 실제로 제공되는 유사 서비스 기준으로 정확히 3가지 제안
4. 각 서비스는 접근 방식이 서로 달라야 함 (예: 기본형, 프리미엄형, 특화형)
5. 업종을 정확히 판단하여 industry 필드에 명시
6. 각 서비스의 현실적인 가격을 estimatedPrice에 원 단위로 제시
7. duration은 구체적으로 (예: "3-4시간", "1주일", "2-3주")

반드시 아래 JSON 형식으로만 응답하세요:
{
  "variables": {
    "purpose": "...",
    "target": "...",
    "format": "...",
    "technology": "...",
    "revenue": "...",
    "operation": "..."
  },
  "industry": "교육/청소/수리/디자인/웹개발/마케팅/컨설팅 중 하나",
  "services": [
    {
      "title": "서비스명",
      "description": "2~3문장 구체 설명",
      "features": ["기능1", "기능2", "기능3"],
      "launchStrategy": "마케팅 전략",
      "estimatedPrice": 500000,
      "duration": "1-2주",
      "confidence": 0.9
    },
    {
      "title": "서비스명 2",
      "description": "2~3문장 구체 설명",
      "features": ["기능1", "기능2", "기능3"],
      "launchStrategy": "마케팅 전략",
      "estimatedPrice": 300000,
      "duration": "3-5일",
      "confidence": 0.8
    },
    {
      "title": "서비스명 3",
      "description": "2~3문장 구체 설명",
      "features": ["기능1", "기능2", "기능3"],
      "launchStrategy": "마케팅 전략",
      "estimatedPrice": 800000,
      "duration": "2-3주",
      "confidence": 0.9
    }
  ]
}`;
}

/**
 * 기본 서비스 생성 (부족할 때 사용)
 */
function generateDefaultServices(description, count) {
  const defaultServices = [];
  const basePrice = 100000;
  
  for (let i = 0; i < count; i++) {
    defaultServices.push({
      id: `default_${Date.now()}_${i}`,
      title: `맞춤 서비스 ${i + 1}`,
      description: `${description}와 관련된 전문 서비스입니다. 고객 맞춤형으로 제공됩니다.`,
      category: '전문 서비스',
      categoryId: 'others',
      features: ['전문 상담', '맞춤 서비스', '품질 보장', '애프터 서비스'],
      launchStrategy: '온라인 마케팅',
      price: basePrice * (i + 1),
      estimatedPrice: basePrice * (i + 1),
      duration: '1-2주',
      variables: {
        purpose: '고객 경험 개선',
        target: '개인',
        format: '컨설팅',
        technology: '없음',
        revenue: '일회성 판매',
        operation: '수동+전문가'
      },
      images: [],
      isActive: true,
      isPlan: false,
      metadata: {
        generated: true,
        aiEnhanced: false,
        createdAt: new Date().toISOString(),
        confidence: 0.6
      }
    });
  }
  
  return defaultServices;
}

/**
 * 카테고리 ID 매핑
 */
function getCategoryId(format) {
  const mapping = {
    '청소': 'cleaning',
    '용역': 'cleaning',
    '교육(현장)': 'education',
    '교육(온라인)': 'education',
    '컨설팅': 'consulting',
    '디자인': 'design',
    'SaaS': 'development',
    '웹개발': 'development',
    '마케팅': 'marketing'
  };
  
  return mapping[format] || 'others';
}

/**
 * 업종명 매핑
 */
function mapIndustryName(variables) {
  const mapping = {
    'SaaS': 'IT/소프트웨어',
    '컨설팅': '경영 컨설팅',
    '교육': '교육/트레이닝',
    '제조': '제조업',
    '온프레미스': 'IT/솔루션',
    '복합형': '통합 서비스'
  };
  
  return mapping[variables.format] || '전문 서비스';
}

/**
 * 추천 메시지 생성
 */
function generateRecommendation(variables, services) {
  const messages = {
    '개인': '개인 대상 서비스는 사용성과 접근성이 중요합니다.',
    '소상공인': '소상공인에게는 비용 효율성과 즉시 활용 가능한 서비스가 좋습니다.',
    '중견·대기업': '기업 대상으로는 확장성과 보안을 고려한 서비스를 권장합니다.',
    '공공기관': '공공기관은 규제 준수와 투명성이 핵심입니다.'
  };

  const baseMessage = messages[variables.target] || '맞춤형 서비스 제안입니다.';
  const serviceCount = services.length;
  
  return `${baseMessage} 총 ${serviceCount}개의 서비스를 제안했습니다. 가장 적합한 서비스를 선택하거나 수정하여 사용하세요.`;
}

/**
 * 전체 신뢰도 계산
 */
function calculateOverallConfidence(services) {
  if (!services.length) return 0.5;
  
  const avgConfidence = services.reduce((sum, service) => {
    return sum + (service.metadata.confidence || 0.5);
  }, 0) / services.length;
  
  return Math.round(avgConfidence * 100) / 100;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};