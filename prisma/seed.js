// prisma/seed.js - username 필드 제거 버전
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 shopidream 카테고리 기반 서비스 데이터 마이그레이션 시작...');

  // 1. admin 사용자 생성 (email: cs@shopidream.com, password: 1234)
  const hashedPassword = '$2b$10$tJJ2fRTYjjlNqgwrJhJ9FehYyLbok4XQ9yKOT7paCQCXtvb8P10C2'; // 1234의 해시
  
  // 기존 admin 사용자 삭제 후 재생성
  await prisma.user.deleteMany({
    where: {
      email: 'cs@shopidream.com'
    }
  });

  const user = await prisma.user.create({
    data: {
      email: 'cs@shopidream.com',
      password: hashedPassword,
      name: 'Shopidream',
      role: 'admin'
    }
  });

  console.log('✅ 사용자 생성:', user.email, '(ID:', user.id, ')');

  // 2. 프로필 생성 (새 스키마에 맞게 수정)
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      // 기본 정보
      bio: 'Shopify 전문 개발팀입니다. 온라인 쇼핑몰 구축부터 마케팅까지 원스톱 서비스를 제공합니다.',
      website: 'https://shopidream.com',
      phone: '02-1666-4125',
      address: '경기도 성남시 분당구 동판교로 52번길 9-4, 101',
      
      // 담당자 정보
      contactName: '고객지원팀',
      contactPhone: '02-1666-4125',
      contactEmail: 'cs@shopidream.com',
      
      // 회사 정보 (새 스키마 필드들)
      companyName: '펫돌(주)',
      ceoName: '이주용',
      businessNumber: '144-81-24257',
      companyPhone: '02-1666-4125',
      companyEmail: 'cs@shopidream.com',
      companyAddress: '경기도 성남시 분당구 동판교로 52번길 9-4, 101',
      businessType: '서비스업',
      businessItem: '전자상거래 플랫폼 개발',
      
      // 계좌 정보
      bankName: '기업은행',
      accountNumber: '990-016700-01-018',
      accountHolder: '펫돌(주)'
    }
  });

  console.log('✅ 프로필 생성 완료');

  // 3. 공개 페이지 생성
  await prisma.publicPage.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      slug: 'shopidream',
      theme: 'professional',
      isActive: true
    }
  });

  // 4. 기존 데이터 삭제
  await prisma.service.deleteMany({ where: { userId: user.id } });
  await prisma.serviceCategory.deleteMany({ where: { userId: user.id } });

  console.log('✅ 기존 데이터 삭제 완료');

  // 5. 서비스 카테고리 생성
  const categories = [
    {
      id: 'store-creation',
      name: '쇼피파이 스토어 제작',
      type: 'plan',
      order: 1,
      contractTitle: '쇼피파이 스토어 제작 계약서'
    },
    {
      id: 'shopify-advanced',
      name: 'Shopify 고급 기능',
      type: 'standard', 
      order: 2,
      contractTitle: 'Shopify 고급 기능 구축 계약서'
    },
    {
      id: 'seo-optimization',
      name: '구글 SEO 향상',
      type: 'standard',
      order: 3,
      contractTitle: 'SEO 최적화 서비스 계약서'
    },
    {
      id: 'marketing-platform',
      name: '마케팅 플랫폼 구축',
      type: 'standard',
      order: 4,
      contractTitle: '마케팅 플랫폼 구축 계약서'
    },
    {
      id: 'maintenance',
      name: '월간 관리 서비스', 
      type: 'standard',
      order: 5,
      contractTitle: '월간 관리 서비스 계약서'
    },
    {
      id: 'custom-services',
      name: '커스텀 서비스',
      type: 'standard',
      order: 6,
      contractTitle: '커스텀 개발 계약서'
    }
  ];

  for (const category of categories) {
    await prisma.serviceCategory.create({
      data: {
        id: category.id,
        userId: user.id,
        name: category.name,
        type: category.type,
        order: category.order,
        contractTitle: category.contractTitle
      }
    });
  }

  console.log('✅ 서비스 카테고리 생성 완료');

  // 6. 기본 조항 카테고리 생성 (새로 추가)
  await prisma.clauseCategory.deleteMany({}); // 기존 데이터 삭제
  
  const clauseCategories = [
    { name: '용역/프로젝트', level: 1, isDefault: true },
    { name: '거래/구매', level: 1, isDefault: true },
    { name: '비밀/보안', level: 1, isDefault: true },
    { name: '근로/고용', level: 1, isDefault: true },
    { name: '투자/자금', level: 1, isDefault: true },
    { name: '파트너십/제휴', level: 1, isDefault: true },
    { name: '기타/일반', level: 1, isDefault: true }
  ];

  for (const category of clauseCategories) {
    await prisma.clauseCategory.create({
      data: category
    });
  }

  console.log('✅ 조항 카테고리 생성 완료');

  console.log('🎉 shopidream 데이터 마이그레이션 완료!');
  console.log('📧 로그인 정보: email=cs@shopidream.com, password=1234');
  console.log(`👤 사용자 ID: ${user.id}`);
}

main()
  .catch((e) => {
    console.error('❌ 마이그레이션 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });