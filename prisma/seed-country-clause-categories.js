// prisma/seed-country-clause-categories.js - 국가별 조항 카테고리 시드 데이터
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 국가별 조항 카테고리 정의
const COUNTRY_CLAUSE_CATEGORIES = {
  // 한국 조항 카테고리 (기존 clauseDatabase.js 기준)
  kr: [
    { key: 'basic', name: '기본 정보', description: '계약의 기본적인 정보 및 정의', sortOrder: 1, isRequired: true },
    { key: 'payment', name: '대금 지급', description: '대금 지급 조건 및 방법', sortOrder: 2, riskWeight: 2.0, isRequired: true },
    { key: 'service', name: '서비스 범위', description: '제공할 서비스의 범위 및 내용', sortOrder: 3, isRequired: true },
    { key: 'delivery', name: '납품 조건', description: '납품 일정, 장소, 방법 등', sortOrder: 4, riskWeight: 1.5 },
    { key: 'warranty', name: '보증 조건', description: '품질보증 및 하자담보 관련', sortOrder: 5, riskWeight: 1.8 },
    { key: 'ip_rights', name: '지적재산권', description: '지적재산권 귀속 및 보호', sortOrder: 6, riskWeight: 2.5 },
    { key: 'confidentiality', name: '기밀유지', description: '비밀유지 의무 및 범위', sortOrder: 7, riskWeight: 2.2 },
    { key: 'liability', name: '책임한계', description: '손해배상 및 책임 제한', sortOrder: 8, riskWeight: 3.0 },
    { key: 'termination', name: '계약해지', description: '계약 해지 사유 및 절차', sortOrder: 9, riskWeight: 2.8 },
    { key: 'dispute', name: '분쟁해결', description: '분쟁 발생 시 해결 방법', sortOrder: 10, riskWeight: 2.3 },
    { key: 'other', name: '기타', description: '기타 특별 조항', sortOrder: 11 }
  ],

  // 미국 조항 카테고리 (Common Law 기준)
  us: [
    { key: 'basic', name: 'Basic Information', description: 'Fundamental contract information and definitions', sortOrder: 1, isRequired: true },
    { key: 'payment', name: 'Payment Terms', description: 'Payment conditions and methods', sortOrder: 2, riskWeight: 2.0, isRequired: true },
    { key: 'service', name: 'Scope of Services', description: 'Description of services to be provided', sortOrder: 3, isRequired: true },
    { key: 'delivery', name: 'Delivery Terms', description: 'Delivery schedule, location, and methods', sortOrder: 4, riskWeight: 1.5 },
    { key: 'warranty', name: 'Warranties', description: 'Warranties and representations', sortOrder: 5, riskWeight: 1.8 },
    { key: 'ip_rights', name: 'Intellectual Property', description: 'Intellectual property rights and ownership', sortOrder: 6, riskWeight: 2.5 },
    { key: 'confidentiality', name: 'Confidentiality', description: 'Non-disclosure obligations', sortOrder: 7, riskWeight: 2.2 },
    { key: 'liability', name: 'Limitation of Liability', description: 'Liability limitations and damages', sortOrder: 8, riskWeight: 3.0 },
    { key: 'indemnification', name: 'Indemnification', description: 'Indemnification obligations', sortOrder: 9, riskWeight: 2.9 },
    { key: 'termination', name: 'Termination', description: 'Contract termination provisions', sortOrder: 10, riskWeight: 2.8 },
    { key: 'dispute', name: 'Dispute Resolution', description: 'Dispute resolution mechanisms', sortOrder: 11, riskWeight: 2.3 },
    { key: 'governing_law', name: 'Governing Law', description: 'Applicable law and jurisdiction', sortOrder: 12, riskWeight: 2.1 },
    { key: 'compliance', name: 'Regulatory Compliance', description: 'Regulatory compliance requirements', sortOrder: 13, riskWeight: 2.4 },
    { key: 'other', name: 'Other Provisions', description: 'Miscellaneous provisions', sortOrder: 14 }
  ],

  // 독일 조항 카테고리 (Civil Law 기준)
  de: [
    { key: 'basic', name: 'Grundlegende Informationen', description: 'Grundlegende Vertragsinformationen', sortOrder: 1, isRequired: true },
    { key: 'payment', name: 'Zahlungsbedingungen', description: 'Zahlungskonditionen und -methoden', sortOrder: 2, riskWeight: 2.0, isRequired: true },
    { key: 'service', name: 'Leistungsumfang', description: 'Beschreibung der zu erbringenden Leistungen', sortOrder: 3, isRequired: true },
    { key: 'delivery', name: 'Lieferbedingungen', description: 'Liefertermine und -bedingungen', sortOrder: 4, riskWeight: 1.5 },
    { key: 'warranty', name: 'Gewährleistung', description: 'Gewährleistungsbestimmungen', sortOrder: 5, riskWeight: 1.8 },
    { key: 'ip_rights', name: 'Geistiges Eigentum', description: 'Rechte an geistigem Eigentum', sortOrder: 6, riskWeight: 2.5 },
    { key: 'confidentiality', name: 'Vertraulichkeit', description: 'Vertraulichkeitsbestimmungen', sortOrder: 7, riskWeight: 2.2 },
    { key: 'liability', name: 'Haftungsbeschränkung', description: 'Haftungsbeschränkungen', sortOrder: 8, riskWeight: 3.0 },
    { key: 'termination', name: 'Kündigung', description: 'Kündigungsbestimmungen', sortOrder: 9, riskWeight: 2.8 },
    { key: 'dispute', name: 'Streitbeilegung', description: 'Streitbeilegungsverfahren', sortOrder: 10, riskWeight: 2.3 },
    { key: 'governing_law', name: 'Anwendbares Recht', description: 'Anwendbares Recht und Gerichtsstand', sortOrder: 11, riskWeight: 2.1 },
    { key: 'other', name: 'Sonstige Bestimmungen', description: 'Sonstige Vertragsbestimmungen', sortOrder: 12 }
  ],

  // 프랑스 조항 카테고리
  fr: [
    { key: 'basic', name: 'Informations de base', description: 'Informations contractuelles fondamentales', sortOrder: 1, isRequired: true },
    { key: 'payment', name: 'Conditions de paiement', description: 'Conditions et méthodes de paiement', sortOrder: 2, riskWeight: 2.0, isRequired: true },
    { key: 'service', name: 'Étendue des services', description: 'Description des services à fournir', sortOrder: 3, isRequired: true },
    { key: 'delivery', name: 'Conditions de livraison', description: 'Calendrier et conditions de livraison', sortOrder: 4, riskWeight: 1.5 },
    { key: 'warranty', name: 'Garanties', description: 'Garanties et représentations', sortOrder: 5, riskWeight: 1.8 },
    { key: 'ip_rights', name: 'Propriété intellectuelle', description: 'Droits de propriété intellectuelle', sortOrder: 6, riskWeight: 2.5 },
    { key: 'confidentiality', name: 'Confidentialité', description: 'Obligations de confidentialité', sortOrder: 7, riskWeight: 2.2 },
    { key: 'liability', name: 'Limitation de responsabilité', description: 'Limitations de responsabilité', sortOrder: 8, riskWeight: 3.0 },
    { key: 'termination', name: 'Résiliation', description: 'Conditions de résiliation', sortOrder: 9, riskWeight: 2.8 },
    { key: 'dispute', name: 'Résolution des conflits', description: 'Mécanismes de résolution des conflits', sortOrder: 10, riskWeight: 2.3 },
    { key: 'governing_law', name: 'Droit applicable', description: 'Droit applicable et juridiction', sortOrder: 11, riskWeight: 2.1 },
    { key: 'other', name: 'Autres dispositions', description: 'Dispositions diverses', sortOrder: 12 }
  ],

  // 일본 조항 카테고리
  jp: [
    { key: 'basic', name: '基本情報', description: '契約の基本的な情報および定義', sortOrder: 1, isRequired: true },
    { key: 'payment', name: '支払条件', description: '支払い条件および方法', sortOrder: 2, riskWeight: 2.0, isRequired: true },
    { key: 'service', name: 'サービス範囲', description: '提供するサービスの範囲', sortOrder: 3, isRequired: true },
    { key: 'delivery', name: '納期条件', description: '納期および納品条件', sortOrder: 4, riskWeight: 1.5 },
    { key: 'warranty', name: '保証条件', description: '品質保証および瑕疵担保', sortOrder: 5, riskWeight: 1.8 },
    { key: 'ip_rights', name: '知的財産権', description: '知的財産権の帰属および保護', sortOrder: 6, riskWeight: 2.5 },
    { key: 'confidentiality', name: '機密保持', description: '秘密保持義務および範囲', sortOrder: 7, riskWeight: 2.2 },
    { key: 'liability', name: '責任制限', description: '損害賠償および責任制限', sortOrder: 8, riskWeight: 3.0 },
    { key: 'termination', name: '契約解除', description: '契約解除事由および手続き', sortOrder: 9, riskWeight: 2.8 },
    { key: 'dispute', name: '紛争解決', description: '紛争発生時の解決方法', sortOrder: 10, riskWeight: 2.3 },
    { key: 'governing_law', name: '準拠法', description: '準拠法および管轄', sortOrder: 11, riskWeight: 2.1 },
    { key: 'other', name: 'その他', description: 'その他の特別条項', sortOrder: 12 }
  ],

  // 기본 카테고리 (나머지 25개국용)
  default: [
    { key: 'basic', name: 'Basic Information', description: 'Basic contract information and definitions', sortOrder: 1, isRequired: true },
    { key: 'payment', name: 'Payment Terms', description: 'Payment conditions and methods', sortOrder: 2, riskWeight: 2.0, isRequired: true },
    { key: 'service', name: 'Service Scope', description: 'Scope of services to be provided', sortOrder: 3, isRequired: true },
    { key: 'delivery', name: 'Delivery Terms', description: 'Delivery conditions and timeline', sortOrder: 4, riskWeight: 1.5 },
    { key: 'warranty', name: 'Warranty', description: 'Warranty and guarantee provisions', sortOrder: 5, riskWeight: 1.8 },
    { key: 'ip_rights', name: 'Intellectual Property', description: 'Intellectual property rights', sortOrder: 6, riskWeight: 2.5 },
    { key: 'confidentiality', name: 'Confidentiality', description: 'Confidentiality obligations', sortOrder: 7, riskWeight: 2.2 },
    { key: 'liability', name: 'Liability Limitation', description: 'Liability limitations and damages', sortOrder: 8, riskWeight: 3.0 },
    { key: 'termination', name: 'Termination', description: 'Contract termination provisions', sortOrder: 9, riskWeight: 2.8 },
    { key: 'dispute', name: 'Dispute Resolution', description: 'Dispute resolution mechanisms', sortOrder: 10, riskWeight: 2.3 },
    { key: 'other', name: 'Other Provisions', description: 'Miscellaneous provisions', sortOrder: 11 }
  ]
};

// 30개국 지원 국가 목록
const SUPPORTED_COUNTRIES = [
  'kr', 'jp', 'tw', 'sg', 'hk', 'my', 'th', 'ph', 'in', 'au', 'nz',  // 아시아-태평양
  'us', 'ca', 'mx',  // 북미
  'uk', 'ie', 'de', 'fr', 'es', 'it', 'nl', 'be', 'ch', 'se', 'no', 'dk', 'fi', 'pl', 'ru',  // 유럽
  'ae',  // 중동
  'br',  // 남미
  'za'   // 아프리카
];

/**
 * 국가별 조항 카테고리 시드 데이터 생성
 */
async function seedCountryClauseCategories() {
  console.log('🌍 국가별 조항 카테고리 시드 데이터 생성 시작...');

  try {
    // 기존 데이터 정리 (선택사항)
    const existingCount = await prisma.countryClauseCategory.count();
    if (existingCount > 0) {
      console.log(`⚠️ 기존 ${existingCount}개 카테고리 발견. 삭제 후 재생성합니다.`);
      await prisma.countryClauseCategory.deleteMany();
    }

    let totalInserted = 0;

    // 각 국가별로 조항 카테고리 생성
    for (const countryCode of SUPPORTED_COUNTRIES) {
      console.log(`📍 ${countryCode.toUpperCase()} 카테고리 생성 중...`);
      
      // 해당 국가의 전용 카테고리가 있으면 사용, 없으면 default 사용
      const categories = COUNTRY_CLAUSE_CATEGORIES[countryCode] || COUNTRY_CLAUSE_CATEGORIES.default;
      
      for (const category of categories) {
        await prisma.countryClauseCategory.create({
          data: {
            countryCode: countryCode,
            categoryKey: category.key,
            categoryName: category.name,
            description: category.description || null,
            sortOrder: category.sortOrder || 0,
            riskWeight: category.riskWeight || 1.0,
            isRequired: category.isRequired || false,
            isActive: true,
            usageCount: 0
          }
        });
        totalInserted++;
      }
      
      console.log(`   ✅ ${categories.length}개 카테고리 생성 완료`);
    }

    console.log(`\n🎉 시드 완료!`);
    console.log(`📊 총 ${SUPPORTED_COUNTRIES.length}개국 x 평균 ${Math.round(totalInserted / SUPPORTED_COUNTRIES.length)}개 = ${totalInserted}개 카테고리 생성`);
    
    // 통계 출력
    const stats = await prisma.countryClauseCategory.groupBy({
      by: ['countryCode'],
      _count: { id: true }
    });
    
    console.log('\n📈 국가별 카테고리 수:');
    stats.forEach(stat => {
      console.log(`   ${stat.countryCode.toUpperCase()}: ${stat._count.id}개`);
    });

  } catch (error) {
    console.error('❌ 시드 생성 오류:', error);
    throw error;
  }
}

/**
 * 특정 국가의 카테고리 조회 (테스트용)
 */
async function testGetCategories(countryCode = 'kr') {
  console.log(`\n🔍 ${countryCode.toUpperCase()} 카테고리 테스트 조회:`);
  
  const categories = await prisma.countryClauseCategory.findMany({
    where: { 
      countryCode: countryCode,
      isActive: true
    },
    orderBy: { sortOrder: 'asc' }
  });
  
  categories.forEach(cat => {
    const required = cat.isRequired ? ' (필수)' : '';
    const risk = cat.riskWeight > 1 ? ` [위험도:${cat.riskWeight}]` : '';
    console.log(`   ${cat.sortOrder}. ${cat.categoryName}${required}${risk}`);
  });
  
  return categories;
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    await seedCountryClauseCategories();
    await testGetCategories('kr'); // 한국 카테고리 테스트
    await testGetCategories('us'); // 미국 카테고리 테스트
  } catch (error) {
    console.error('실행 오류:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 직접 실행시
if (require.main === module) {
  main();
}

module.exports = {
  seedCountryClauseCategories,
  testGetCategories,
  COUNTRY_CLAUSE_CATEGORIES,
  SUPPORTED_COUNTRIES
};