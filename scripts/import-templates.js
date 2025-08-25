// scripts/import-templates.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importTemplates() {
  try {
    console.log('📥 템플릿 데이터 import 시작...');
    
    // JSON 파일 읽기
    const importPath = path.join(process.cwd(), 'templates_export.json');
    
    if (!fs.existsSync(importPath)) {
      console.error('❌ templates_export.json 파일이 없습니다!');
      return;
    }
    
    const importData = JSON.parse(fs.readFileSync(importPath, 'utf8'));
    
    console.log(`📊 Import할 데이터:`);
    console.log(`   - 계약서 템플릿: ${importData.contractTemplates?.length || 0}개`);
    console.log(`   - 조항 카테고리: ${importData.clauseCategories?.length || 0}개`);
    console.log(`   - 서비스 카테고리: ${importData.serviceCategories?.length || 0}개`);
    console.log(`   - Export 날짜: ${importData.exportDate}`);
    console.log(`   - 데이터베이스: ${importData.databaseType || 'unknown'}`);
    
    // 조항 카테고리부터 import (외래키 관계 때문에)
    if (importData.clauseCategories?.length > 0) {
      console.log('\n1️⃣ 조항 카테고리 import 중...');
      for (const category of importData.clauseCategories) {
        try {
          await prisma.clauseCategory.upsert({
            where: { id: category.id },
            update: {
              name: category.name,
              level: category.level,
              description: category.description,
              countryCode: category.countryCode,
              language: category.language,
              isActive: category.isActive,
              usageCount: category.usageCount
            },
            create: {
              id: category.id,
              name: category.name,
              level: category.level || 1,
              parentId: category.parentId,
              description: category.description,
              countryCode: category.countryCode || 'kr',
              language: category.language || 'ko',
              isActive: category.isActive !== undefined ? category.isActive : true,
              isDefault: category.isDefault || false,
              usageCount: category.usageCount || 0,
              createdAt: new Date(category.createdAt),
              updatedAt: new Date(category.updatedAt)
            }
          });
          console.log(`   ✅ ${category.name} (${category.countryCode})`);
        } catch (error) {
          console.log(`   ⚠️ ${category.name} 건너뜀: ${error.message}`);
        }
      }
    }
    
    // 계약서 템플릿 import
    if (importData.contractTemplates?.length > 0) {
      console.log('\n2️⃣ 계약서 템플릿 import 중...');
      for (const template of importData.contractTemplates) {
        try {
          // 기존 템플릿이 있는지 확인 (이름 기준)
          const existing = await prisma.contractTemplate.findFirst({
            where: { 
              name: template.name,
              countryCode: template.countryCode 
            }
          });
          
          if (existing) {
            console.log(`   ⚠️ "${template.name}" (${template.countryCode}) 이미 존재, 건너뜀`);
            continue;
          }
          
          // 사용자 ID 확인 (로컬 사용자가 서버에 없을 수 있음)
          let userId = template.userId;
          const userExists = await prisma.user.findUnique({
            where: { id: template.userId }
          });
          
          if (!userExists) {
            // 기본 admin 사용자 또는 첫 번째 사용자 찾기
            const adminUser = await prisma.user.findFirst({
              where: { role: 'admin' }
            });
            const firstUser = await prisma.user.findFirst();
            userId = adminUser?.id || firstUser?.id;
            
            if (!userId) {
              console.log(`   ❌ "${template.name}" 사용자 없음으로 건너뜀`);
              continue;
            }
          }
          
          // 템플릿 생성
          const newTemplate = await prisma.contractTemplate.create({
            data: {
              name: template.name,
              description: template.description,
              content: template.content,
              category: template.category,
              variables: template.variables,
              clauses: template.clauses,
              status: template.status || 'active',
              userId: userId,
              type: template.type,
              tags: template.tags,
              industry: template.industry,
              complexity: template.complexity,
              confidence: template.confidence || 1.0,
              usageCount: template.usageCount || 0,
              popularity: template.popularity || 0.0,
              lastUsed: template.lastUsed ? new Date(template.lastUsed) : null,
              isActive: template.isActive !== undefined ? template.isActive : true,
              countryCode: template.countryCode || 'kr',
              language: template.language || 'ko',
              legalSystem: template.legalSystem || 'civil_law',
              createdAt: new Date(template.createdAt),
              updatedAt: new Date(template.updatedAt)
            }
          });
          
          console.log(`   ✅ "${template.name}" (${template.category}) - ${template.countryCode}`);
          
        } catch (error) {
          console.log(`   ❌ "${template.name}" 실패: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 Import 완료!');
    
    // 최종 결과 확인
    const finalTemplateCount = await prisma.contractTemplate.count();
    const finalClauseCategoryCount = await prisma.clauseCategory.count();
    const finalServiceCategoryCount = await prisma.serviceCategory.count();
    
    console.log(`📊 Import 후 데이터베이스 상태:`);
    console.log(`   - 총 계약서 템플릿: ${finalTemplateCount}개`);
    console.log(`   - 총 조항 카테고리: ${finalClauseCategoryCount}개`);
    console.log(`   - 총 서비스 카테고리: ${finalServiceCategoryCount}개`);
    
  } catch (error) {
    console.error('❌ Import 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importTemplates();