// debug-candidates.js - 조항 후보 디버깅 스크립트
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCandidates() {
  try {
    console.log('🔍 조항 후보 디버깅 시작...\n');
    
    // 1. 총 조항 후보 수
    const totalCount = await prisma.clauseCandidate.count();
    console.log(`📊 총 조항 후보: ${totalCount}개`);
    
    if (totalCount === 0) {
      console.log('❌ 조항 후보가 없습니다. 템플릿 분석이 실패했을 수 있습니다.');
      return;
    }
    
    // 2. 상태별 분포
    const statusCounts = await prisma.clauseCandidate.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    console.log('\n📈 상태별 분포:');
    statusCounts.forEach(item => {
      console.log(`- ${item.status}: ${item._count.id}개`);
    });
    
    // 3. 카테고리별 분포
    const categoryCounts = await prisma.clauseCandidate.groupBy({
      by: ['category'],
      _count: { id: true }
    });
    
    console.log('\n🏷️ 카테고리별 분포:');
    categoryCounts.forEach(item => {
      console.log(`- ${item.category}: ${item._count.id}개`);
    });
    
    // 4. 최근 5개 조항 상세
    const recentCandidates = await prisma.clauseCandidate.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        confidence: true,
        needsReview: true,
        createdAt: true
      }
    });
    
    console.log('\n📋 최근 조항 후보 5개:');
    recentCandidates.forEach((candidate, index) => {
      console.log(`${index + 1}. ID: ${candidate.id}`);
      console.log(`   제목: ${candidate.title}`);
      console.log(`   카테고리: ${candidate.category}`);
      console.log(`   상태: ${candidate.status}`);
      console.log(`   신뢰도: ${Math.round(candidate.confidence * 100)}%`);
      console.log(`   검토필요: ${candidate.needsReview ? 'Yes' : 'No'}`);
      console.log(`   생성: ${candidate.createdAt.toLocaleString()}`);
      console.log('');
    });
    
    // 5. 카테고리 시스템 확인
    const categoryCount = await prisma.clauseCategory.count();
    console.log(`🗂️ 등록된 카테고리: ${categoryCount}개`);
    
    if (categoryCount > 0) {
      const categories = await prisma.clauseCategory.findMany({
        select: { id: true, name: true, isActive: true, usageCount: true }
      });
      
      console.log('\n📂 카테고리 목록:');
      categories.forEach(cat => {
        console.log(`- ${cat.name} (ID: ${cat.id}, 사용: ${cat.usageCount}회, 활성: ${cat.isActive})`);
      });
    }
    
    // 6. 제안된 카테고리 확인
    const proposedCount = await prisma.proposedCategory.count();
    if (proposedCount > 0) {
      console.log(`\n💡 제안된 새 카테고리: ${proposedCount}개`);
      
      const proposed = await prisma.proposedCategory.findMany({
        select: { id: true, name: true, status: true, suggestedBy: true }
      });
      
      proposed.forEach(prop => {
        console.log(`- ${prop.name} (상태: ${prop.status}, 제안자: ${prop.suggestedBy})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCandidates();