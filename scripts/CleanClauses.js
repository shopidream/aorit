// scripts/CleanClauses.js - 국가별 계약서 조항 데이터 선택 삭제
require('dotenv').config();

// Prisma 클라이언트 초기화
let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient({
    log: ['error', 'warn']
  });
} catch (error) {
  console.error('❌ Prisma 클라이언트 초기화 실패:', error);
  console.log('💡 Prisma가 설치되어 있는지 확인하세요: npm install @prisma/client');
  console.log('💡 Prisma 생성: npx prisma generate');
  process.exit(1);
}

// 30개국 지원
const COUNTRIES = {
  // 아시아-태평양
  kr: { name: '한국', flag: '🇰🇷', legalSystem: 'civil_law', language: 'ko' },
  jp: { name: '일본', flag: '🇯🇵', legalSystem: 'civil_law', language: 'ja' },
  tw: { name: '대만', flag: '🇹🇼', legalSystem: 'civil_law', language: 'zh-TW' },
  sg: { name: '싱가포르', flag: '🇸🇬', legalSystem: 'common_law', language: 'en' },
  hk: { name: '홍콩', flag: '🇭🇰', legalSystem: 'common_law', language: 'en' },
  my: { name: '말레이시아', flag: '🇲🇾', legalSystem: 'mixed_law', language: 'en' },
  th: { name: '태국', flag: '🇹🇭', legalSystem: 'civil_law', language: 'th' },
  ph: { name: '필리핀', flag: '🇵🇭', legalSystem: 'common_law', language: 'en' },
  in: { name: '인도', flag: '🇮🇳', legalSystem: 'common_law', language: 'en' },
  au: { name: '호주', flag: '🇦🇺', legalSystem: 'common_law', language: 'en' },
  nz: { name: '뉴질랜드', flag: '🇳🇿', legalSystem: 'common_law', language: 'en' },

  // 북미
  us: { name: '미국', flag: '🇺🇸', legalSystem: 'common_law', language: 'en' },
  ca: { name: '캐나다', flag: '🇨🇦', legalSystem: 'common_law', language: 'en' },
  mx: { name: '멕시코', flag: '🇲🇽', legalSystem: 'civil_law', language: 'es' },

  // 유럽
  uk: { name: '영국', flag: '🇬🇧', legalSystem: 'common_law', language: 'en' },
  ie: { name: '아일랜드', flag: '🇮🇪', legalSystem: 'common_law', language: 'en' },
  de: { name: '독일', flag: '🇩🇪', legalSystem: 'civil_law', language: 'de' },
  fr: { name: '프랑스', flag: '🇫🇷', legalSystem: 'civil_law', language: 'fr' },
  es: { name: '스페인', flag: '🇪🇸', legalSystem: 'civil_law', language: 'es' },
  it: { name: '이탈리아', flag: '🇮🇹', legalSystem: 'civil_law', language: 'it' },
  nl: { name: '네덜란드', flag: '🇳🇱', legalSystem: 'civil_law', language: 'nl' },
  be: { name: '벨기에', flag: '🇧🇪', legalSystem: 'civil_law', language: 'nl' },
  ch: { name: '스위스', flag: '🇨🇭', legalSystem: 'civil_law', language: 'de' },
  se: { name: '스웨덴', flag: '🇸🇪', legalSystem: 'civil_law', language: 'sv' },
  no: { name: '노르웨이', flag: '🇳🇴', legalSystem: 'civil_law', language: 'no' },
  dk: { name: '덴마크', flag: '🇩🇰', legalSystem: 'civil_law', language: 'da' },
  fi: { name: '핀란드', flag: '🇫🇮', legalSystem: 'civil_law', language: 'fi' },
  pl: { name: '폴란드', flag: '🇵🇱', legalSystem: 'civil_law', language: 'pl' },
  ru: { name: '러시아', flag: '🇷🇺', legalSystem: 'civil_law', language: 'ru' },

  // 중동
  ae: { name: 'UAE', flag: '🇦🇪', legalSystem: 'mixed_law', language: 'en' },

  // 남미
  br: { name: '브라질', flag: '🇧🇷', legalSystem: 'civil_law', language: 'pt' },

  // 아프리카
  za: { name: '남아공', flag: '🇿🇦', legalSystem: 'mixed_law', language: 'en' }
};

/**
 * 메인 함수 - 국가별 계약서 데이터 삭제
 */
async function main() {
  console.log('🧹 국가별 계약서 조항 데이터 선택 삭제 시스템');
  console.log('===============================================');
  
  // 데이터베이스 연결 테스트
  try {
    await prisma.$connect();
    console.log('✅ 데이터베이스 연결 성공\n');
  } catch (connectError) {
    console.error('❌ 데이터베이스 연결 실패:', connectError);
    console.log('💡 DATABASE_URL 확인:', process.env.DATABASE_URL ? '설정됨' : '설정 안됨');
    throw connectError;
  }
  
  try {
    const args = parseArguments();
    
    if (args.help) {
      showUsage();
      return;
    }
    
    // 1. 기존 템플릿 현황 조회
    const countryStats = await getCountryTemplateStats();
    
    if (Object.keys(countryStats).length === 0) {
      console.log('📋 삭제할 템플릿이 없습니다.');
      return;
    }
    
    // 2. 국가별 현황 출력
    displayCountryStats(countryStats);
    
    // 3. 삭제할 국가 선택
    let selectedCountries;
    if (args.countries && args.countries.length > 0) {
      // 명령행 인수로 국가 지정
      selectedCountries = args.countries;
      console.log(`\n🎯 지정된 국가: ${selectedCountries.map(c => `${COUNTRIES[c]?.flag} ${c}`).join(', ')}`);
    } else if (args.batch) {
      console.log('❌ 배치 모드에서는 --countries 옵션이 필요합니다.');
      showUsage();
      return;
    } else {
      // 대화형 선택
      selectedCountries = await selectCountriesInteractive(countryStats);
    }
    
    if (!selectedCountries || selectedCountries.length === 0) {
      console.log('❌ 선택된 국가가 없습니다.');
      return;
    }
    
    // 4. 선택된 국가 유효성 검사
    const validCountries = selectedCountries.filter(country => {
      if (!COUNTRIES[country]) {
        console.warn(`⚠️ 알 수 없는 국가 코드: ${country}`);
        return false;
      }
      if (!countryStats[country]) {
        console.warn(`⚠️ 템플릿이 없는 국가: ${country}`);
        return false;
      }
      return true;
    });
    
    if (validCountries.length === 0) {
      console.log('❌ 유효한 국가가 선택되지 않았습니다.');
      return;
    }
    
    // 5. 삭제 확인 및 실행
    await cleanSelectedCountries(validCountries, countryStats, args.batch);
    
  } catch (error) {
    console.error('❌ 실행 오류:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 국가별 템플릿 통계 조회
 */
async function getCountryTemplateStats() {
  console.log('📊 국가별 템플릿 현황 조회 중...');
  
  try {
    // 각 모델에서 전체 데이터 조회 후 필터링
    const [templates, candidates, sources] = await Promise.all([
      prisma.contractTemplate.findMany({
        select: {
          countryCode: true
        }
      }),
      prisma.clauseCandidate.findMany({
        select: {
          countryCode: true
        }
      }),
      prisma.sourceContract.findMany({
        select: {
          countryCode: true
        }
      })
    ]);
    
    // 수동으로 그룹화 (null 값 제외)
    const stats = {};
    
    // 템플릿 카운트
    templates.forEach(template => {
      const code = template.countryCode;
      if (code && code.trim() !== '') { // null과 빈 문자열 체크
        if (!stats[code]) stats[code] = {};
        stats[code].templates = (stats[code].templates || 0) + 1;
      }
    });
    
    // 조항 후보 카운트
    candidates.forEach(candidate => {
      const code = candidate.countryCode;
      if (code && code.trim() !== '') { // null과 빈 문자열 체크
        if (!stats[code]) stats[code] = {};
        stats[code].candidates = (stats[code].candidates || 0) + 1;
      }
    });
    
    // 원본 계약서 카운트
    sources.forEach(source => {
      const code = source.countryCode;
      if (code && code.trim() !== '') { // null과 빈 문자열 체크
        if (!stats[code]) stats[code] = {};
        stats[code].sources = (stats[code].sources || 0) + 1;
      }
    });
    
    return stats;
    
  } catch (error) {
    console.error('❌ 통계 조회 오류:', error);
    // 빈 통계 반환
    return {};
  }
}

/**
 * 국가별 현황 출력
 */
function displayCountryStats(countryStats) {
  console.log('📈 국가별 템플릿 현황:');
  console.log('====================');
  
  const sortedCountries = Object.keys(countryStats).sort((a, b) => {
    const aTotal = (countryStats[a].templates || 0) + (countryStats[a].candidates || 0) + (countryStats[a].sources || 0);
    const bTotal = (countryStats[b].templates || 0) + (countryStats[b].candidates || 0) + (countryStats[b].sources || 0);
    return bTotal - aTotal;
  });
  
  sortedCountries.forEach(countryCode => {
    const stat = countryStats[countryCode];
    const country = COUNTRIES[countryCode] || { name: countryCode.toUpperCase(), flag: '❓' };
    
    const templates = stat.templates || 0;
    const candidates = stat.candidates || 0;
    const sources = stat.sources || 0;
    const total = templates + candidates + sources;
    
    console.log(`${country.flag} ${country.name} (${countryCode})`);
    console.log(`   📋 템플릿: ${templates}개`);
    console.log(`   📝 조항 후보: ${candidates}개`);
    console.log(`   📄 원본 계약서: ${sources}개`);
    console.log(`   📊 총계: ${total}개\n`);
  });
}

/**
 * 대화형 국가 선택
 */
async function selectCountriesInteractive(countryStats) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('🎯 삭제할 국가를 선택하세요:');
  console.log('');
  console.log('옵션:');
  console.log('  • 특정 국가: kr,us,uk (쉼표로 구분)');
  console.log('  • 영어권 국가: english');
  console.log('  • 모든 국가: all');
  console.log('  • 취소: cancel 또는 빈 입력');
  console.log('');
  
  const answer = await new Promise(resolve => {
    rl.question('선택: ', resolve);
  });
  
  rl.close();
  
  if (!answer || answer.toLowerCase() === 'cancel') {
    return null;
  }
  
  if (answer.toLowerCase() === 'all') {
    return Object.keys(countryStats);
  }
  
  if (answer.toLowerCase() === 'english') {
    const englishCountries = ['us', 'uk', 'ca', 'au', 'nz', 'ie', 'sg', 'hk', 'my', 'ph', 'in', 'za', 'ae'];
    return englishCountries.filter(country => countryStats[country]);
  }
  
  // 쉼표로 구분된 국가 목록
  return answer.split(',')
    .map(country => country.trim().toLowerCase())
    .filter(country => country.length > 0);
}

/**
 * 선택된 국가들의 데이터 삭제
 */
async function cleanSelectedCountries(selectedCountries, countryStats, isBatch = false) {
  console.log('\n🎯 삭제 대상 확인:');
  console.log('==================');
  
  let totalTemplates = 0, totalCandidates = 0, totalSources = 0;
  
  selectedCountries.forEach(countryCode => {
    const stat = countryStats[countryCode];
    const country = COUNTRIES[countryCode];
    
    const templates = stat.templates || 0;
    const candidates = stat.candidates || 0;
    const sources = stat.sources || 0;
    
    console.log(`${country.flag} ${country.name} (${countryCode})`);
    console.log(`   📋 템플릿: ${templates}개`);
    console.log(`   📝 조항 후보: ${candidates}개`);
    console.log(`   📄 원본 계약서: ${sources}개`);
    
    totalTemplates += templates;
    totalCandidates += candidates;
    totalSources += sources;
  });
  
  console.log('\n📊 삭제 예정 총계:');
  console.log(`   📋 템플릿: ${totalTemplates}개`);
  console.log(`   📝 조항 후보: ${totalCandidates}개`);
  console.log(`   📄 원본 계약서: ${totalSources}개`);
  console.log(`   🗑️ 총 ${totalTemplates + totalCandidates + totalSources}개 데이터`);
  
  // 배치 모드가 아니면 확인 요청
  if (!isBatch) {
    const confirmed = await askFinalConfirmation(selectedCountries);
    if (!confirmed) {
      console.log('❌ 삭제가 취소되었습니다.');
      return;
    }
  }
  
  console.log('\n🚀 삭제 작업 시작...');
  
  // 트랜잭션으로 안전하게 삭제
  await prisma.$transaction(async (tx) => {
    // 1. 조항 후보 삭제
    console.log('   📝 조항 후보 삭제 중...');
    const deletedCandidates = await tx.clauseCandidate.deleteMany({
      where: { countryCode: { in: selectedCountries } }
    });
    console.log(`      ✅ ${deletedCandidates.count}개 삭제`);
    
    // 2. 원본 계약서 삭제
    console.log('   📄 원본 계약서 삭제 중...');
    const deletedSources = await tx.sourceContract.deleteMany({
      where: { countryCode: { in: selectedCountries } }
    });
    console.log(`      ✅ ${deletedSources.count}개 삭제`);
    
    // 3. 템플릿 참조 정리
    console.log('   🔗 템플릿 참조 정리 중...');
    const templateIds = await tx.contractTemplate.findMany({
      where: { countryCode: { in: selectedCountries } },
      select: { id: true }
    });
    
    const templateIdList = templateIds.map(t => t.id);
    
    if (templateIdList.length > 0) {
      const contractsUsing = await tx.contract.findMany({
        where: { templateId: { in: templateIdList } },
        select: { id: true, title: true }
      });
      
      if (contractsUsing.length > 0) {
        console.log(`      ⚠️ 영향받는 계약서: ${contractsUsing.length}개`);
        
        await tx.contract.updateMany({
          where: { templateId: { in: templateIdList } },
          data: { templateId: null }
        });
        console.log(`      ✅ 계약서 참조 제거됨 (계약서 보존)`);
      }
    }
    
    // 4. 템플릿 삭제
    console.log('   📋 템플릿 삭제 중...');
    const deletedTemplates = await tx.contractTemplate.deleteMany({
      where: { countryCode: { in: selectedCountries } }
    });
    console.log(`      ✅ ${deletedTemplates.count}개 삭제`);
  });
  
  // 최종 현황 확인
  console.log('\n📊 삭제 완료 - 현재 현황:');
  const finalStats = await getCountryTemplateStats();
  
  console.log(`✅ ${selectedCountries.length}개 국가 데이터 삭제 완료!`);
  console.log(`📋 남은 국가: ${Object.keys(finalStats).length}개`);
  
  if (Object.keys(finalStats).length > 0) {
    console.log('\n🔄 남은 국가들:');
    Object.keys(finalStats).forEach(countryCode => {
      const country = COUNTRIES[countryCode] || { name: countryCode, flag: '❓' };
      const total = (finalStats[countryCode].templates || 0) + 
                   (finalStats[countryCode].candidates || 0) + 
                   (finalStats[countryCode].sources || 0);
      console.log(`   ${country.flag} ${country.name}: ${total}개 데이터`);
    });
  }
  
  console.log('\n🚀 다음 단계:');
  console.log('1. 업그레이드된 AI 시스템으로 재업로드');
  console.log('2. node scripts/bulkUploadTemplates.js --token=YOUR_TOKEN');
  console.log('3. http://localhost:3100/admin/clauses에서 결과 확인');
}

/**
 * 최종 확인
 */
async function askFinalConfirmation(selectedCountries) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const countryNames = selectedCountries.map(code => 
    `${COUNTRIES[code]?.flag} ${COUNTRIES[code]?.name || code}`
  ).join(', ');
  
  const answer = await new Promise(resolve => {
    rl.question(`\n⚠️ 정말로 다음 국가들의 모든 데이터를 삭제하시겠습니까?\n${countryNames}\n\n입력 (DELETE): `, resolve);
  });
  
  rl.close();
  return answer === 'DELETE';
}

/**
 * 명령행 인수 파싱
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const result = { countries: [] };
  
  args.forEach(arg => {
    if (arg.startsWith('--countries=')) {
      result.countries = arg.split('=')[1].split(',').map(c => c.trim().toLowerCase());
    } else if (arg === '--batch' || arg === '-b') {
      result.batch = true;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  });
  
  return result;
}

/**
 * 사용법 출력
 */
function showUsage() {
  console.log('🧹 국가별 계약서 조항 데이터 선택 삭제 시스템');
  console.log('');
  console.log('사용법:');
  console.log('  node scripts/CleanClauses.js                           # 대화형 모드');
  console.log('  node scripts/CleanClauses.js --countries=kr,us,uk      # 특정 국가들');
  console.log('  node scripts/CleanClauses.js --countries=kr --batch    # 배치 모드');
  console.log('  node scripts/CleanClauses.js --help                    # 도움말');
  console.log('');
  console.log('옵션:');
  console.log('  --countries=LIST  삭제할 국가 코드들 (쉼표로 구분)');
  console.log('  --batch, -b       확인없이 즉시 실행');
  console.log('  --help, -h        도움말 출력');
  console.log('');
  console.log('🌍 지원 국가 코드:');
  Object.entries(COUNTRIES).forEach(([code, info]) => {
    console.log(`  ${info.flag} ${code.padEnd(3)} : ${info.name}`);
  });
  console.log('');
  console.log('📝 예시:');
  console.log('  node scripts/CleanClauses.js --countries=us,uk,ca      # 북미/영국만 삭제');
  console.log('  node scripts/CleanClauses.js --countries=kr            # 한국만 삭제');
  console.log('');
  console.log('⚠️ 주의사항:');
  console.log('  • 삭제된 데이터는 복구할 수 없습니다');
  console.log('  • 계약서는 보존되지만 템플릿 참조가 제거됩니다');
  console.log('  • 배치 모드에서는 반드시 --countries 옵션이 필요합니다');
}

/**
 * 에러 핸들링
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 처리되지 않은 Promise 거부:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ 처리되지 않은 예외:', error);
  process.exit(1);
});

// 메인 실행
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  });
}