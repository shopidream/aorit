// prisma/seed-clause-candidates.js - 새 스키마 호환 버전
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BASE_CLAUSE_CANDIDATES = [
  {
    title: '계약의 목적',
    content: '본 계약은 갑이 을에게 서비스를 의뢰하고, 을은 갑에게 해당 서비스를 제공함을 목적으로 한다.',
    contractCategory: '용역/프로젝트',    // 계약서 대분류
    clauseCategory: '계약의 목적',        // 조항 기능 분류
    sourceContract: '개발용역계약서.pdf',
    confidence: 0.92,
    status: 'pending',
    needsReview: true,
    tags: JSON.stringify(['계약목적', '기본조항']),
    variables: JSON.stringify(['CLIENT_NAME', 'PROVIDER_NAME', 'SERVICE_NAME'])
  },
  {
    title: '대금 지급 조건',
    content: '계약 대금은 총 금액의 50%를 계약 체결 후 지급하고, 나머지 50%는 서비스 완료 후 지급한다.',
    contractCategory: '거래/구매',
    clauseCategory: '대금 지급 조건',
    sourceContract: '개발용역계약서.pdf',
    confidence: 0.88,
    status: 'pending',
    needsReview: false,
    tags: JSON.stringify(['대금지급', '결제조건', '분할지급']),
    variables: JSON.stringify(['TOTAL_AMOUNT', 'PAYMENT_SCHEDULE', 'DOWN_PAYMENT'])
  },
  {
    title: '비밀유지 의무',
    content: '을은 본 계약 수행 과정에서 알게 된 갑의 영업비밀을 제3자에게 누설하지 않을 의무를 진다.',
    contractCategory: '비밀/보안',
    clauseCategory: '비밀유지 의무',
    sourceContract: '개발용역계약서.pdf',
    confidence: 0.95,
    status: 'pending',
    needsReview: false,
    tags: JSON.stringify(['비밀유지', 'NDA', '정보보호']),
    variables: JSON.stringify(['CONFIDENTIAL_INFO', 'DISCLOSURE_PERIOD'])
  },
  {
    title: '계약 해지 조건',
    content: '일방 당사자가 계약을 위반하고 상당한 기간 내에 시정하지 않을 경우, 상대방은 계약을 해지할 수 있다.',
    contractCategory: '기타/일반',
    clauseCategory: '계약 해지 조건',
    sourceContract: '개발용역계약서.pdf',
    confidence: 0.85,
    status: 'pending',
    needsReview: true,
    tags: JSON.stringify(['계약해지', '계약위반', '통지']),
    variables: JSON.stringify(['NOTICE_PERIOD', 'TERMINATION_DATE'])
  },
  {
    title: '손해배상 제한',
    content: '계약 위반으로 인한 손해배상은 계약금액의 10%를 초과할 수 없다.',
    contractCategory: '기타/일반',
    clauseCategory: '손해배상 제한',
    sourceContract: '서비스계약서.pdf',
    confidence: 0.78,
    status: 'approved',
    needsReview: false,
    tags: JSON.stringify(['손해배상', '책임제한']),
    variables: JSON.stringify(['CONTRACT_AMOUNT', 'DAMAGE_LIMIT'])
  },
  {
    title: '지적재산권 귀속',
    content: '본 계약으로 생성된 모든 결과물의 지적재산권은 갑에게 귀속된다.',
    contractCategory: '용역/프로젝트',
    clauseCategory: '지적재산권 귀속',
    sourceContract: '개발용역계약서.pdf',
    confidence: 0.90,
    status: 'approved',
    needsReview: false,
    tags: JSON.stringify(['지적재산권', '저작권', '결과물']),
    variables: JSON.stringify(['IP_OWNER', 'DELIVERABLES'])
  },
  {
    title: '하자보증 기간',
    content: '을은 납품 완료 후 6개월간 하자보증 의무를 지며, 하자 발견 시 무상으로 수정한다.',
    contractCategory: '용역/프로젝트',
    clauseCategory: '하자보증 기간',
    sourceContract: '개발용역계약서.pdf',
    confidence: 0.87,
    status: 'rejected',
    needsReview: false,
    tags: JSON.stringify(['하자보증', '품질보증', 'A/S']),
    variables: JSON.stringify(['WARRANTY_PERIOD', 'DEFECT_SCOPE'])
  },
  {
    title: '근로시간 및 휴게',
    content: '근로자의 근무시간은 주 40시간을 원칙으로 하며, 연장근무 시 별도 수당을 지급한다.',
    contractCategory: '근로/고용',
    clauseCategory: '근로시간 및 휴게',
    sourceContract: '근로계약서.pdf',
    confidence: 0.93,
    status: 'pending',
    needsReview: true,
    tags: JSON.stringify(['근로조건', '근무시간', '수당']),
    variables: JSON.stringify(['WORK_HOURS', 'OVERTIME_RATE'])
  },
  {
    title: '투자금 회수 조건',
    content: '투자자는 투자일로부터 3년 후 투자원금과 연 5%의 수익을 회수할 수 있다.',
    contractCategory: '투자/자금',
    clauseCategory: '투자금 회수 조건',
    sourceContract: '투자계약서.pdf',
    confidence: 0.91,
    status: 'approved',
    needsReview: false,
    tags: JSON.stringify(['투자회수', '수익률', '투자기간']),
    variables: JSON.stringify(['INVESTMENT_AMOUNT', 'RETURN_RATE', 'INVESTMENT_PERIOD'])
  },
  {
    title: '파트너십 수익 분배',
    content: '공동사업으로 발생한 수익은 각 파트너의 출자비율에 따라 분배한다.',
    contractCategory: '파트너십/제휴',
    clauseCategory: '수익 분배 조건',
    sourceContract: 'MOU.pdf',
    confidence: 0.86,
    status: 'approved',
    needsReview: false,
    tags: JSON.stringify(['수익분배', '출자비율', '공동사업']),
    variables: JSON.stringify(['PROFIT_RATIO', 'INVESTMENT_RATIO'])
  }
];

async function seedClauseCandidates() {
  try {
    console.log('🌱 조항 후보 데이터 시드 시작...');
    
    // 기존 데이터 확인
    const existingCount = await prisma.clauseCandidate.count();
    console.log(`📊 기존 조항 후보: ${existingCount}개`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const clauseData of BASE_CLAUSE_CANDIDATES) {
      try {
        // 중복 확인 (제목 기준)
        const existing = await prisma.clauseCandidate.findFirst({
          where: { title: clauseData.title }
        });
        
        if (existing) {
          console.log(`⏭️ "${clauseData.title}" 이미 존재`);
          skippedCount++;
          continue;
        }
        
        const created = await prisma.clauseCandidate.create({
          data: clauseData
        });
        
        console.log(`✅ "${clauseData.title}" 생성됨 (ID: ${created.id}, 상태: ${created.status})`);
        createdCount++;
        
      } catch (error) {
        console.error(`❌ "${clauseData.title}" 생성 실패:`, error.message);
      }
    }
    
    console.log(`\n📊 완료: 새로 생성 ${createdCount}개, 기존 유지 ${skippedCount}개`);
    
    // 최종 상태 확인
    const finalStats = await prisma.clauseCandidate.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    console.log('\n📈 상태별 통계:');
    finalStats.forEach(stat => {
      console.log(`  - ${stat.status}: ${stat._count.id}개`);
    });
    
    // 계약서 카테고리별 통계 (contractCategory)
    const contractCategoryStats = await prisma.clauseCandidate.groupBy({
      by: ['contractCategory'],
      _count: { id: true }
    });
    
    console.log('\n📂 계약서 카테고리별 통계:');
    contractCategoryStats.forEach(stat => {
      console.log(`  - ${stat.contractCategory}: ${stat._count.id}개`);
    });
    
    // 조항 기능별 통계 (clauseCategory)
    const clauseCategoryStats = await prisma.clauseCandidate.groupBy({
      by: ['clauseCategory'],
      _count: { id: true },
      where: {
        clauseCategory: { not: null }
      }
    });
    
    console.log('\n⚙️ 조항 기능별 통계:');
    clauseCategoryStats.forEach(stat => {
      console.log(`  - ${stat.clauseCategory}: ${stat._count.id}개`);
    });
    
  } catch (error) {
    console.error('❌ 시드 오류:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedClauseCandidates()
  .then(() => {
    console.log('🎉 조항 후보 시드 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 시드 실패:', error);
    process.exit(1);
  });