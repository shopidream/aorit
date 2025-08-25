// scripts/export-templates.js
const fs = require('fs');
const path = require('path');

// Prisma 클라이언트를 더 안전하게 초기화
let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
} catch (error) {
  console.error('❌ Prisma 클라이언트 초기화 실패:', error.message);
  process.exit(1);
}

async function exportTemplates() {
  try {
    console.log('📤 템플릿 데이터 export 시작...');
    
    // 데이터베이스 연결 테스트
    console.log('🔗 데이터베이스 연결 테스트 중...');
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 계약서 템플릿 데이터 가져오기
    console.log('📋 계약서 템플릿 데이터 조회 중...');
    const contractTemplates = await prisma.contractTemplate.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    console.log(`✅ ${contractTemplates.length}개 계약서 템플릿 발견`);
    
    // 조항 카테고리 데이터도 가져오기
    console.log('🏷️ 조항 카테고리 데이터 조회 중...');
    const clauseCategories = await prisma.clauseCategory.findMany();
    console.log(`✅ ${clauseCategories.length}개 조항 카테고리 발견`);
    
    // 서비스 카테고리도 가져오기
    console.log('🎯 서비스 카테고리 데이터 조회 중...');
    const serviceCategories = await prisma.serviceCategory.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    console.log(`✅ ${serviceCategories.length}개 서비스 카테고리 발견`);
    
    // export할 데이터 구조
    const exportData = {
      contractTemplates: contractTemplates,
      clauseCategories: clauseCategories,
      serviceCategories: serviceCategories,
      exportDate: new Date().toISOString(),
      exportSource: 'local-development',
      databaseType: 'mysql'
    };
    
    // JSON 파일로 저장
    const exportPath = path.join(process.cwd(), 'templates_export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`🎉 Export 완료!`);
    console.log(`📁 파일 위치: ${exportPath}`);
    console.log(`📊 Export 요약:`);
    console.log(`   - 계약서 템플릿: ${contractTemplates.length}개`);
    console.log(`   - 조항 카테고리: ${clauseCategories.length}개`);
    console.log(`   - 서비스 카테고리: ${serviceCategories.length}개`);
    
    // 각 템플릿별 세부 정보 출력
    contractTemplates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.name} (${template.category}) - ${template.countryCode}`);
    });
    
  } catch (error) {
    console.error('❌ Export 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportTemplates();