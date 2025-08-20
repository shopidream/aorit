// test-clause-analysis.js - 조항 분석 과정 완전 테스트
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testClauseAnalysis() {
  try {
    console.log('🧪 조항 분석 과정 완전 테스트 시작...\n');
    
    // 최근 템플릿 가져오기
    const template = await prisma.contractTemplate.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (!template) {
      console.log('❌ 템플릿을 찾을 수 없습니다.');
      return;
    }
    
    console.log(`📄 분석 대상: ${template.name}`);
    console.log(`📏 원본 길이: ${template.content.length}자\n`);
    
    // 단계별 테스트
    await step1_ExtractClauses(template.content);
    await step2_TestGPTAPI();
    await step3_TestCategoryMapping();
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 1단계: 조항 추출 테스트
async function step1_ExtractClauses(contractText) {
  console.log('📋 1단계: 조항 추출 테스트\n');
  
  const normalizedText = contractText
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, '\n')
    .trim();
  
  // 제(條) 패턴으로 분리
  const articlePatterns = [
    /제\s*(\d+)\s*조[^\n]*\n([^제]*?)(?=제\s*\d+\s*조|$)/g,
    /(\d+)\.\s*([^\n]+)\n([^0-9]*?)(?=\d+\.|$)/g,
    /제\s*(\d+)\s*항[^\n]*\n([^제]*?)(?=제\s*\d+\s*항|$)/g
  ];
  
  let extractedClauses = [];
  let foundArticles = false;
  
  for (const pattern of articlePatterns) {
    const matches = [...normalizedText.matchAll(pattern)];
    
    if (matches.length > 0) {
      console.log(`✅ 패턴 매칭 성공: ${matches.length}개 조항 발견`);
      
      matches.forEach((match, index) => {
        const articleNumber = match[1];
        const title = match[2] ? match[2].trim() : '';
        const content = match[3] ? match[3].trim() : match[2] ? match[2].trim() : '';
        
        if (content && content.length > 20) {
          extractedClauses.push({
            id: `article_${articleNumber || index + 1}`,
            articleNumber: parseInt(articleNumber) || index + 1,
            title: title || `제${articleNumber || index + 1}조`,
            content: content,
            originalOrder: index + 1,
            extractionMethod: 'pattern_matching'
          });
        }
      });
      
      foundArticles = true;
      break;
    }
  }
  
  if (!foundArticles) {
    console.log('⚠️ 패턴 매칭 실패, 문단 기반 분리');
    // 문단 기반 분리 로직은 생략
  }
  
  console.log(`📊 추출된 조항 수: ${extractedClauses.length}개\n`);
  
  // 처음 5개 조항 상세 정보
  console.log('📋 추출된 조항 상세 (처음 5개):');
  extractedClauses.slice(0, 5).forEach((clause, index) => {
    console.log(`${index + 1}. ${clause.title}`);
    console.log(`   내용: ${clause.content.substring(0, 100)}...`);
    console.log(`   길이: ${clause.content.length}자`);
    console.log('');
  });
  
  return extractedClauses;
}

// 2단계: GPT API 테스트
async function step2_TestGPTAPI() {
  console.log('🤖 2단계: GPT API 연결 테스트\n');
  
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    console.log('❌ OPENAI_API_KEY가 설정되지 않음');
    return false;
  }
  
  console.log('✅ OpenAI API 키 확인됨');
  console.log(`🔑 API 키: ${openaiApiKey.substring(0, 10)}...${openaiApiKey.slice(-10)}\n`);
  
  // 간단한 테스트 요청
  try {
    const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: '안녕하세요. 연결 테스트입니다.'
        }],
        max_tokens: 50
      })
    });
    
    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log('✅ GPT API 연결 성공');
      console.log(`📝 테스트 응답: ${result.choices[0]?.message?.content}\n`);
      return true;
    } else {
      console.log(`❌ GPT API 오류: ${testResponse.status}`);
      const errorText = await testResponse.text();
      console.log(`오류 내용: ${errorText}\n`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ GPT API 연결 실패: ${error.message}\n`);
    return false;
  }
}

// 3단계: 카테고리 매핑 테스트
async function step3_TestCategoryMapping() {
  console.log('🏷️ 3단계: 카테고리 시스템 테스트\n');
  
  try {
    const categories = await prisma.clauseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📂 활성 카테고리: ${categories.length}개`);
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (ID: ${cat.id}, 사용: ${cat.usageCount}회)`);
    });
    
    // 카테고리 매핑 테스트
    console.log('\n🔍 카테고리 매핑 테스트:');
    const testCategories = ['계약의 목적', '대금지급', '기타사항'];
    
    for (const testCat of testCategories) {
      const category = await prisma.clauseCategory.findFirst({
        where: {
          OR: [
            { name: testCat },
            { name: { contains: testCat } }
          ],
          isActive: true
        }
      });
      
      if (category) {
        console.log(`  ✅ "${testCat}" → "${category.name}" (ID: ${category.id})`);
      } else {
        console.log(`  ❌ "${testCat}" → 매핑 실패`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ 카테고리 시스템 오류: ${error.message}\n`);
    return false;
  }
}

testClauseAnalysis();