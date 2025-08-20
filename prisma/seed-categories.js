// prisma/seed-categories.js - 기본 카테고리 시드 데이터
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BASE_CATEGORIES = [
  {
    name: '거래/구매',
    description: '물건·서비스 사고팔 때 사용하는 계약',
    level: 1,
    isDefault: true
  },
  {
    name: '용역/프로젝트', 
    description: '프리랜서, 외주, 협업 등 작업 계약',
    level: 1,
    isDefault: true
  },
  {
    name: '근로/고용',
    description: '사람을 고용하거나 채용할 때 사용',
    level: 1,
    isDefault: true
  },
  {
    name: '투자/자금',
    description: '돈 빌려주거나 투자받을 때 사용',
    level: 1,
    isDefault: true
  },
  {
    name: '파트너십/제휴',
    description: '공동사업, 협업, 합작 등',
    level: 1,
    isDefault: true
  },
  {
    name: '비밀/보안',
    description: '정보 보호 관련 계약',
    level: 1,
    isDefault: true
  },
  {
    name: '기타/일반',
    description: '임대차, 양도, 간단 합의 등',
    level: 1,
    isDefault: true
  }
];

async function seedCategories() {
  try {
    console.log('🌱 기본 카테고리 시드 시작...');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const category of BASE_CATEGORIES) {
      try {
        const existing = await prisma.clauseCategory.findUnique({
          where: { name: category.name }
        });
        
        if (existing) {
          console.log(`⏭️ "${category.name}" 이미 존재`);
          skippedCount++;
          continue;
        }
        
        const created = await prisma.clauseCategory.create({
          data: category
        });
        
        console.log(`✅ "${category.name}" 생성됨 (ID: ${created.id})`);
        createdCount++;
        
      } catch (error) {
        console.error(`❌ "${category.name}" 생성 실패:`, error.message);
      }
    }
    
    console.log(`\n📊 완료: 새로 생성 ${createdCount}개, 기존 유지 ${skippedCount}개`);
    
  } catch (error) {
    console.error('❌ 시드 오류:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCategories()
  .then(() => {
    console.log('🎉 카테고리 시드 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 시드 실패:', error);
    process.exit(1);
  });