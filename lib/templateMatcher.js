// lib/templateMatcher.js - 견적서→템플릿 매칭 알고리즘 (ContractTemplate 테이블 직접 조회)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 서비스 유형 분석
export function analyzeServiceType(services) {
  if (!services || services.length === 0) return 'general';
  
  const allText = services.map(s => 
    `${s.serviceName || s.name || ''} ${s.serviceDescription || s.description || ''}`.toLowerCase()
  ).join(' ');
  
  // 키워드 기반 분류
  const patterns = {
    development: ['개발', '웹사이트', '앱', '쇼피파이', 'shopify', '코딩', '프로그래밍', 'api'],
    design: ['디자인', '로고', '브랜딩', 'ui', 'ux', '그래픽', '일러스트', '포토샵'],
    marketing: ['마케팅', '광고', 'sns', '소셜', '인스타그램', '페이스북', '블로그', 'seo'],
    content: ['콘텐츠', '글쓰기', '번역', '영상', '촬영', '편집', '카피'],
    consulting: ['컨설팅', '자문', '분석', '전략', '기획', '연구', '조사'],
    education: ['교육', '강의', '수업', '트레이닝', '워크샵', '세미나'],
    maintenance: ['유지보수', '관리', '운영', '업데이트', '수정', '개선']
  };
  
  for (const [type, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      return type;
    }
  }
  
  return 'general';
}

// 업종 추론
export function inferIndustry(services, clientData) {
  const serviceType = analyzeServiceType(services);
  const clientInfo = clientData?.company || clientData?.serviceCategory || '';
  
  // 클라이언트 정보 기반 업종 추론
  const industryPatterns = {
    retail: ['쇼핑몰', '온라인스토어', '이커머스', '판매', '소매'],
    restaurant: ['음식점', '카페', '레스토랑', '요식업', '배달'],
    beauty: ['미용', '뷰티', '헤어', '네일', '에스테틱', '스킨케어'],
    fitness: ['헬스', '피트니스', '요가', '필라테스', '운동'],
    education: ['학원', '교육', '어학', '과외', '학습'],
    medical: ['병원', '의료', '치과', '한의원', '약국'],
    finance: ['금융', '보험', '투자', '대출', '부동산'],
    technology: ['IT', '테크', '소프트웨어', '앱', '개발']
  };
  
  const combinedText = `${serviceType} ${clientInfo}`.toLowerCase();
  
  for (const [industry, keywords] of Object.entries(industryPatterns)) {
    if (keywords.some(keyword => combinedText.includes(keyword))) {
      return industry;
    }
  }
  
  // 서비스 타입을 기본 업종으로 매핑
  const serviceToIndustry = {
    development: 'technology',
    design: 'creative',
    marketing: 'marketing',
    consulting: 'business'
  };
  
  return serviceToIndustry[serviceType] || 'general';
}

// 복잡도 계산
export function calculateComplexity(services, amount, duration) {
  let score = 0;
  
  // 서비스 개수
  const serviceCount = services?.length || 1;
  if (serviceCount >= 5) score += 3;
  else if (serviceCount >= 3) score += 2;
  else score += 1;
  
  // 금액 기준
  if (amount >= 50000000) score += 4;      // 5천만원 이상
  else if (amount >= 10000000) score += 3; // 1천만원 이상  
  else if (amount >= 3000000) score += 2;  // 300만원 이상
  else score += 1;
  
  // 기간 기준
  const durationDays = parseDuration(duration);
  if (durationDays >= 180) score += 3;     // 6개월 이상
  else if (durationDays >= 60) score += 2; // 2개월 이상
  else score += 1;
  
  // 서비스 복잡도
  const hasComplexServices = services?.some(service => {
    const description = service.serviceDescription || service.description || '';
    return description.length > 100 || 
           description.includes('커스텀') || 
           description.includes('맞춤') ||
           description.includes('고급');
  });
  
  if (hasComplexServices) score += 2;
  
  // 점수를 복잡도로 변환
  if (score >= 10) return 'complex';
  if (score >= 6) return 'standard';
  return 'simple';
}

// 기간 파싱 (일수로 변환)
function parseDuration(duration) {
  if (!duration) return 30;
  
  const durationStr = duration.toLowerCase();
  
  if (durationStr.includes('일')) {
    const match = durationStr.match(/(\d+)일/);
    return match ? parseInt(match[1]) : 30;
  }
  
  if (durationStr.includes('주')) {
    const match = durationStr.match(/(\d+)주/);
    return match ? parseInt(match[1]) * 7 : 30;
  }
  
  if (durationStr.includes('개월') || durationStr.includes('월')) {
    const match = durationStr.match(/(\d+)(개월|월)/);
    return match ? parseInt(match[1]) * 30 : 30;
  }
  
  return 30;
}

// GPT-4o-mini를 사용한 스마트 템플릿 매칭 (1단계)
export async function matchTemplateWithGPT(quoteData) {
  try {
    console.log('GPT 템플릿 매칭 시작:', quoteData.title || '서비스');
    
    // 견적서 데이터 분석
    const services = parseServices(quoteData);
    const metadata = parseMetadata(quoteData);
    
    const criteria = {
      serviceType: analyzeServiceType(services),
      industry: inferIndustry(services, quoteData.client),
      complexity: calculateComplexity(services, quoteData.amount || 0, metadata.duration),
      amount: quoteData.amount || 0,
      additionalTags: []
    };
    
    console.log('분석된 기준:', criteria);
    
    // ContractTemplate 테이블에서 모든 활성 템플릿 조회
    const allTemplates = await prisma.contractTemplate.findMany({
      where: {
        isActive: true,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        content: true,
        variables: true,
        clauses: true,
        tags: true,
        industry: true,
        complexity: true,
        popularity: true
      },
      orderBy: [
        { popularity: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    console.log(`데이터베이스에서 ${allTemplates.length}개 템플릿 조회`);
    
    if (allTemplates.length === 0) {
      throw new Error('활성 템플릿이 없습니다');
    }
    
    // GPT-4o-mini로 가장 적합한 템플릿 3개 선택
    const selectedTemplateIds = await selectBestTemplatesWithGPT(services, criteria, allTemplates);
    
    const selectedTemplates = allTemplates.filter(template => 
      selectedTemplateIds.includes(template.id)
    );
    
    console.log(`GPT가 선택한 템플릿: ${selectedTemplates.length}개`);
    selectedTemplates.forEach(t => console.log(`- ${t.name} (${t.category})`));
    
    const result = {
      success: true,
      criteria,
      matches: {
        total: allTemplates.length,
        selected: selectedTemplates.length,
        templates: selectedTemplates.map(template => ({
          id: template.id,
          name: template.name,
          category: template.category,
          description: template.description,
          clauses: parseClausesFromTemplate(template),
          variables: parseVariablesFromTemplate(template),
          matchScore: 0.9 // GPT가 선택했으므로 높은 점수
        }))
      },
      analytics: {
        topCategories: [...new Set(selectedTemplates.map(t => t.category))],
        averageScore: 0.9,
        recommendedComplexity: criteria.complexity
      }
    };
    
    console.log(`템플릿 매칭 완료: ${selectedTemplates.length}개 템플릿 선택`);
    
    return result;
    
  } catch (error) {
    console.error('GPT 템플릿 매칭 오류:', error);
    return {
      success: false,
      error: error.message,
      criteria: null,
      matches: { total: 0, selected: 0, templates: [] }
    };
  }
}

// GPT-4o-mini로 최적 템플릿 선택
async function selectBestTemplatesWithGPT(services, criteria, allTemplates) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn('OpenAI API 키가 없어 기본 선택 사용');
      return allTemplates.slice(0, 3).map(t => t.id);
    }
    
    const prompt = createTemplateSelectionPrompt(services, criteria, allTemplates);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.1
      })
    });
    
    if (!response.ok) {
      throw new Error('GPT 템플릿 선택 실패');
    }
    
    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    const selectedIds = parseGPTSelectionResponse(content);
    
    if (selectedIds.length === 0) {
      console.warn('GPT 선택 실패, 기본 템플릿 사용');
      return allTemplates.slice(0, 3).map(t => t.id);
    }
    
    return selectedIds;
    
  } catch (error) {
    console.error('GPT 템플릿 선택 오류:', error);
    return allTemplates.slice(0, 3).map(t => t.id);
  }
}

// GPT 템플릿 선택 프롬프트
function createTemplateSelectionPrompt(services, criteria, templates) {
  const serviceText = services.map(s => 
    `${s.name || s.serviceName || ''}: ${s.description || s.serviceDescription || ''}`
  ).join('\n');
  
  const templateList = templates.map(t => 
    `ID: ${t.id}, 이름: "${t.name}", 카테고리: ${t.category}`
  ).join('\n');
  
  return `서비스 정보를 분석하여 가장 적합한 계약서 템플릿 3개를 선택하세요.

### 서비스 정보
${serviceText}

금액: ${criteria.amount?.toLocaleString() || '미정'}원
업종: ${criteria.industry}
서비스타입: ${criteria.serviceType}
복잡도: ${criteria.complexity}

### 사용 가능한 템플릿 목록
${templateList}

### 선택 기준
1. 서비스 유형과 템플릿 이름의 유사성
2. 업종별 적합성
3. 금액 규모에 따른 복잡도

### 응답 형식
다음 JSON 형식으로만 응답하세요:
{"selectedIds": [1, 5, 12]}

3개 템플릿의 ID만 배열로 반환하세요.`;
}

// GPT 응답 파싱
function parseGPTSelectionResponse(content) {
  try {
    // JSON 추출
    let jsonStr = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    
    const parsed = JSON.parse(jsonStr);
    return parsed.selectedIds || [];
    
  } catch (error) {
    console.error('GPT 선택 응답 파싱 오류:', error);
    return [];
  }
}

// 헬퍼 함수들
function parseServices(quoteData) {
  try {
    if (quoteData.items && typeof quoteData.items === 'string') {
      return JSON.parse(quoteData.items);
    }
    return quoteData.items || [];
  } catch (error) {
    console.error('서비스 파싱 오류:', error);
    return [];
  }
}

function parseMetadata(quoteData) {
  try {
    if (quoteData.metadata && typeof quoteData.metadata === 'string') {
      return JSON.parse(quoteData.metadata);
    }
    return quoteData.metadata || {};
  } catch (error) {
    console.error('메타데이터 파싱 오류:', error);
    return {};
  }
}

function parseClausesFromTemplate(template) {
  try {
    if (template.clauses && typeof template.clauses === 'string') {
      return JSON.parse(template.clauses);
    }
    return template.clauses || [];
  } catch (error) {
    console.error('조항 파싱 오류:', error);
    return [];
  }
}

function parseVariablesFromTemplate(template) {
  try {
    if (template.variables && typeof template.variables === 'string') {
      return JSON.parse(template.variables);
    }
    return template.variables || [];
  } catch (error) {
    console.error('변수 파싱 오류:', error);
    return [];
  }
}

// 기존 함수와의 호환성 유지
export async function matchTemplate(quoteData) {
  return await matchTemplateWithGPT(quoteData);
}

// 사용 로그 기록
export async function logTemplateUsage(quoteId, contractId, matchResult, userFeedback = null) {
  try {
    if (matchResult.matches && matchResult.matches.templates) {
      const updatePromises = matchResult.matches.templates.map(template => 
        prisma.contractTemplate.update({
          where: { id: template.id },
          data: { 
            popularity: { increment: 1 },
            updatedAt: new Date()
          }
        })
      );
      await Promise.all(updatePromises);
    }
    
    console.log('템플릿 사용 로그 기록 완료');
    
  } catch (error) {
    console.error('사용 로그 기록 오류:', error);
  }
}

export default {
  matchTemplate,
  matchTemplateWithGPT,
  analyzeServiceType,
  inferIndustry,
  calculateComplexity,
  logTemplateUsage
};