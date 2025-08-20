// test-real-analysis.js - 실제 분석 함수 테스트
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

// ES 모듈을 CommonJS에서 사용하기 위한 dynamic import
async function testRealAnalysis() {
  try {
    console.log('🧪 실제 조항 분석 함수 테스트 시작...\n');
    
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
    
    // 동적으로 분석 함수 import
    const { analyzeContractClauses } = await import('./lib/contractClauseAnalyzer.js');
    
    // 실제 분석 실행
    console.log('🔄 실제 분석 함수 실행...\n');
    
    const result = await analyzeContractClauses(template.content, {
      industry: 'tech',
      category: 'tech', 
      templateName: template.name
    });
    
    if (result.success) {
      console.log('✅ 분석 성공!');
      console.log(`📊 추출된 조항 수: ${result.clauses.length}개\n`);
      
      // 조항 상세 정보
      console.log('📋 추출된 조항 목록:');
      result.clauses.forEach((clause, index) => {
        console.log(`${index + 1}. ${clause.title || clause.categoryName}`);
        console.log(`   카테고리: ${clause.category}`);
        console.log(`   신뢰도: ${Math.round((clause.confidence || 0) * 100)}%`);
        console.log(`   내용: ${clause.content.substring(0, 80)}...`);
        console.log(`   매핑 타입: ${clause.mappingType || 'N/A'}`);
        console.log('');
      });
      
      // 통계 정보
      if (result.statistics) {
        console.log('📈 분석 통계:');
        console.log(`   전체 조항: ${result.statistics.total}개`);
        console.log(`   평균 신뢰도: ${Math.round(result.statistics.averageConfidence * 100)}%`);
        console.log(`   평균 리스크: ${Math.round(result.statistics.averageRiskScore)}점`);
        
        if (result.statistics.byCategory) {
          console.log('   카테고리별:');
          Object.entries(result.statistics.byCategory).forEach(([cat, count]) => {
            console.log(`     - ${cat}: ${count}개`);
          });
        }
      }
      
    } else {
      console.log('❌ 분석 실패');
      console.log(`오류: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealAnalysis();