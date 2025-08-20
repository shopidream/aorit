// debug-clause-extraction.js - 조항 분리 디버깅 스크립트
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugClauseExtraction() {
  try {
    console.log('🔍 조항 분리 디버깅 시작...\n');
    
    // 최근 템플릿 가져오기
    const template = await prisma.contractTemplate.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (!template) {
      console.log('❌ 템플릿을 찾을 수 없습니다.');
      return;
    }
    
    console.log(`📄 분석 대상: ${template.name}`);
    console.log(`📏 원본 길이: ${template.content.length}자`);
    console.log('📝 원본 내용 미리보기:');
    console.log(template.content.substring(0, 500) + '...\n');
    
    // 조항 분리 테스트
    await testClauseExtraction(template.content);
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testClauseExtraction(contractText) {
  console.log('🔄 조항 분리 테스트 시작...\n');
  
  // 텍스트 정규화
  const normalizedText = contractText
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, '\n')
    .trim();
  
  console.log(`📏 정규화 후 길이: ${normalizedText.length}자\n`);
  
  // 제(條) 패턴들 테스트
  const articlePatterns = [
    { name: '제N조 패턴', regex: /제\s*(\d+)\s*조[^\n]*\n([^제]*?)(?=제\s*\d+\s*조|$)/g },
    { name: '숫자. 패턴', regex: /(\d+)\.\s*([^\n]+)\n([^0-9]*?)(?=\d+\.|$)/g },
    { name: '제N항 패턴', regex: /제\s*(\d+)\s*항[^\n]*\n([^제]*?)(?=제\s*\d+\s*항|$)/g }
  ];
  
  let bestPattern = null;
  let maxMatches = 0;
  
  articlePatterns.forEach(pattern => {
    const matches = [...normalizedText.matchAll(pattern.regex)];
    console.log(`🔍 ${pattern.name}: ${matches.length}개 매치`);
    
    if (matches.length > maxMatches) {
      maxMatches = matches.length;
      bestPattern = pattern;
    }
    
    // 처음 3개 매치 상세 정보
    matches.slice(0, 3).forEach((match, index) => {
      console.log(`  매치 ${index + 1}:`);
      console.log(`    번호: ${match[1]}`);
      console.log(`    제목: ${match[2] ? match[2].trim().substring(0, 50) : 'N/A'}...`);
      console.log(`    내용: ${match[3] ? match[3].trim().substring(0, 100) : 'N/A'}...`);
    });
    console.log('');
  });
  
  if (maxMatches === 0) {
    console.log('⚠️ 패턴 매칭 실패, 문단 기반 분리 시도...\n');
    
    // 문단 기반 분리
    const paragraphs = normalizedText
      .split(/\n\s*\n/)
      .filter(p => p.trim().length > 50)
      .slice(0, 20);
    
    console.log(`📄 문단 기반 분리: ${paragraphs.length}개 문단`);
    
    paragraphs.slice(0, 5).forEach((paragraph, index) => {
      console.log(`문단 ${index + 1}:`);
      console.log(`  길이: ${paragraph.length}자`);
      console.log(`  내용: ${paragraph.substring(0, 150)}...`);
      console.log('');
    });
  } else {
    console.log(`✅ 최적 패턴: ${bestPattern.name} (${maxMatches}개 조항 추출)\n`);
  }
  
  // 실제 16개 조항이 있는지 수동 확인
  console.log('🔍 수동 패턴 확인...');
  const manualPatterns = [
    normalizedText.match(/제\s*\d+\s*조/g) || [],
    normalizedText.match(/^\d+\./gm) || [],
    normalizedText.match(/제\s*\d+\s*항/g) || []
  ];
  
  console.log(`제N조 패턴 발견: ${manualPatterns[0].length}개`);
  console.log(`숫자. 패턴 발견: ${manualPatterns[1].length}개`);
  console.log(`제N항 패턴 발견: ${manualPatterns[2].length}개`);
  
  if (manualPatterns[0].length > 0) {
    console.log('\n📋 발견된 제N조들:');
    manualPatterns[0].slice(0, 16).forEach((match, index) => {
      console.log(`  ${index + 1}. ${match}`);
    });
  }
}

debugClauseExtraction();