// scripts/bulkUploadTemplates.js - 대량 템플릿 자동 업로드
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 매핑 데이터
const TEMPLATE_MAPPING = {
  'OEM 기본계약서': '제조/공급',
  'PFV 자산관리위탁계약서': '용역/프로젝트',
  'TV홈쇼핑거래표준계약서': '거래/구매',
  '개발용역계약서': '용역/프로젝트',
  '개인정보 수집활용 동의서': '비밀/보안',
  '개인정보처리위탁 계약서': '비밀/보안',
  '건물철거용역 표준계약서': '용역/프로젝트',
  '건설공사표준하도급계약서': '제조/공급',
  '건축물 공사감리계약서': '용역/프로젝트',
  '건축설계업종 표준하도급계약서': '용역/프로젝트',
  '검수확인서 샘플(설치장비 검사사항 및 검사방법)': '기타/일반',
  '검수확인서(상세)': '기타/일반',
  '검수확인서(일반양식)': '기타/일반',
  '게임(도급) 표준계약서': '용역/프로젝트',
  '고문위촉계약서': '용역/프로젝트',
  '공사대금 지불각서': '거래/구매',
  '공사완료확인서': '기타/일반',
  '공연예술 기술지원 표준근로계약서': '근로/고용',
  '공연예술 표준대관계약서': '용역/프로젝트',
  '공연예술기술지원 표준용역계약서': '용역/프로젝트',
  '공연예술창작계약서': '용역/프로젝트',
  '공연예술출연계약서': '근로/고용',
  '광고물제작계약서국문': '용역/프로젝트',
  '광고용건물임대계약서약식': '거래/구매',
  '그림 등 매매계약서': '거래/구매',
  '그림 사진 저작물 판매위탁계약서': '거래/구매',
  '금전소비대차 계약서': '투자/자금',
  '금형제작업종 표준하도급계약서': '제조/공급',
  '기계업종 제조 표준하도급계약서': '제조/공급',
  '납품계약서': '거래/구매',
  '노무제공 공통 표준계약서(고용노동부)': '근로/고용',
  '대리점계약서국문': '파트너십/제휴',
  '동업계약서(각자대표)': '파트너십/제휴',
  '동업계약서(혼자대표)': '파트너십/제휴',
  '디자인 서비스 계약서국문': '용역/프로젝트',
  '디자인업종(제품 시각 포장) 표준하도급계약서': '용역/프로젝트',
  '디지털콘텐츠(음악)공급 표준계약서': '거래/구매',
  '매장임대차표준계약서(아울렛 복합쇼핑몰)': '거래/구매',
  '모델(미술사진작품)계약서': '용역/프로젝트',
  '물품구매계약서': '거래/구매',
  '미술사진작품 전시(온라인전시부속합의포함)계약서': '용역/프로젝트',
  '민간건설공사 표준도급계약서': '제조/공급',
  '방염처리 표준도급계약서': '제조/공급',
  '법률자문계약서(간단)': '용역/프로젝트',
  '법률자문계약서(상세)': '용역/프로젝트',
  '보안서약서(프로젝트참여자용)': '비밀/보안',
  '부동산 매매계약서': '거래/구매',
  '부동산근저당권설정계약서': '거래/구매',
  '부동산임대차계약서': '거래/구매',
  '불용물품(차량) 매각계약서': '거래/구매',
  '비밀유지계약서': '비밀/보안',
  '상표권 양도 표준계약서': '거래/구매',
  '생활용품업종 표준대리점계약서': '파트너십/제휴',
  '선박임대차계약서(건설업체용)': '거래/구매',
  '성실시공(공공 공사) 이행각서': '기타/일반',
  '세무대리계약서국문': '용역/프로젝트',
  '소모품 구매조건부 장비(의료장비) 임대계약서': '거래/구매',
  '소방시설공사업종 표준하도급 기본계약서': '제조/공급',
  '소방시설설계 표준도급계약서': '용역/프로젝트',
  '소프트웨어 라이선스 계약서': '거래/구매',
  '소프트웨어사업표준하도급계약서국문': '용역/프로젝트',
  '수출물품 임가공계약서': '제조/공급',
  '승강기설치공사업종 표준하도급계약서': '제조/공급',
  '시설공사 계약서': '용역/프로젝트',
  '식음료업종대리점표준계약서': '파트너십/제휴',
  '약속이행각서(부동산매매대금)': '기타/일반',
  '업무제휴 협약서': '파트너십/제휴',
  '업무협약 양해각서': '파트너십/제휴',
  '영수증 양식차용금전부변제': '기타/일반',
  '영수증양식차용금일부변제': '기타/일반',
  '영화산업 근로표준계약서': '근로/고용',
  '오디오북 배타적발행권 설정계약서': '거래/구매',
  '오디오북 유통 계약서': '거래/구매',
  '오디오북 저작인접권 이용허락 계약서': '거래/구매',
  '오디오북 제작 계약서': '용역/프로젝트',
  '온라인 광고 계약서': '용역/프로젝트',
  '온라인쇼핑몰표준거래계약서(위수탁거래)': '거래/구매',
  '외국인표준근로계약서': '근로/고용',
  '웹사이트 제작계약서': '용역/프로젝트',
  '웹툰 연재계약서': '용역/프로젝트',
  '위임계약서(간단서식)': '용역/프로젝트',
  '위임장(간단서식)': '용역/프로젝트',
  '위탁가공계약서국문': '제조/공급',
  '유지보수계약서': '용역/프로젝트',
  '의류업종대리점(재판매형)표준계약서': '파트너십/제휴',
  '이러닝콘텐츠 개발용역 표준계약서': '용역/프로젝트',
  '이사용역계약서': '용역/프로젝트',
  '이행각서(채무변제)': '기타/일반',
  '인테리어공사 표준계약서': '용역/프로젝트',
  '저작물 이용계약서': '거래/구매',
  '저작재산권 독점적 이용허락 계약서': '거래/구매',
  '저작재산권 비독점적 이용허락 계약서': '거래/구매',
  '저작재산권 양도계약서': '거래/구매',
  '저작재산권 일부에 대한 양도계약서': '거래/구매',
  '전기공사표준도급계약서': '제조/공급',
  '전자출판 배타적발행권 및 출판권 설정계약서': '거래/구매',
  '전자출판 배타적발행권 설정계약서': '거래/구매',
  '정보통신공사표준도급계약서': '제조/공급',
  '정수기 임대차(렌탈) 약관 계약서': '거래/구매',
  '제약업종대리점표준계약서': '파트너십/제휴',
  '주식 양수도 계약서(개인간)': '거래/구매',
  '집단급식소위탁운영계약서': '용역/프로젝트',
  '총판대리점계약서': '파트너십/제휴',
  '출판권 설정(도서출간)계약서': '거래/구매',
  '커미션(알선중개수수료)계약서': '거래/구매',
  '커미션(판매수수료) 지급계약서': '거래/구매',
  '컨설팅계약서': '용역/프로젝트',
  '투자계약서(보통주 방식)': '투자/자금',
  '특허 및 기술도입계약서국문': '거래/구매',
  '특허권 양도계약서': '거래/구매',
  '표준 대출모집업무 위탁계약서(금융사 대출모집법인간)': '용역/프로젝트',
  '표준 대출모집업무 위탁계약서(금융사 대출상담사간)': '용역/프로젝트',
  '표준 대출모집업무 위탁계약서(대출모집법인 대출상담사간)': '용역/프로젝트',
  '표준광고출연계약서국문': '근로/고용',
  '표준근로계약서(건설일용직)': '근로/고용',
  '표준근로계약서(기간정함없음)': '근로/고용',
  '표준근로계약서(기간정함있음)': '근로/고용',
  '표준근로계약서(단시간근로자)': '근로/고용',
  '표준근로계약서(미성년자)': '근로/고용',
  '표준물품매매계약서': '거래/구매',
  '프랜차이즈(자동차정비가맹점) 표준계약서': '파트너십/제휴',
  '프랜차이즈(커피가맹점)표준계약서': '파트너십/제휴',
  '프리랜서 용역계약서': '용역/프로젝트',
  '화가(사진)작가 전속계약서': '용역/프로젝트',
  '화물자동차 운송사업 표준위수탁계약서': '거래/구매',
  '화장품대리점표준계약서': '파트너십/제휴'
};

// 설정
const CONFIG = {
  baseUrl: 'http://localhost:3100',
  contractsDir: './contract_txt',
  delayBetweenUploads: 3000, // 3초 딜레이 (AI 분석 시간 고려)
  maxRetries: 3
};

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 대량 템플릿 업로드 시작...');
  console.log(`📁 계약서 폴더: ${CONFIG.contractsDir}`);
  console.log(`🎯 서버 주소: ${CONFIG.baseUrl}`);
  
  // 토큰 확인
  const token = getTokenFromArgs();
  if (!token) {
    console.error('❌ 토큰이 필요합니다.');
    console.log('사용법: node scripts/bulkUploadTemplates.js --token=YOUR_TOKEN');
    console.log('');
    console.log('토큰 확인 방법:');
    console.log('1. 브라우저에서 http://localhost:3100/login 접속');
    console.log('2. 관리자로 로그인');
    console.log('3. 개발자도구(F12) > Application > Local Storage > token 값 복사');
    process.exit(1);
  }
  
  // 계약서 폴더 확인
  if (!fs.existsSync(CONFIG.contractsDir)) {
    console.error(`❌ 계약서 폴더를 찾을 수 없습니다: ${CONFIG.contractsDir}`);
    process.exit(1);
  }
  
  // txt 파일 목록 가져오기
  const txtFiles = fs.readdirSync(CONFIG.contractsDir)
    .filter(file => file.endsWith('.txt'))
    .sort();
  
  if (txtFiles.length === 0) {
    console.error('❌ txt 파일이 없습니다.');
    process.exit(1);
  }
  
  console.log(`📄 발견된 계약서 파일: ${txtFiles.length}개`);
  
  // 매핑되지 않은 파일 확인
  const unmappedFiles = txtFiles.filter(file => {
    const nameWithoutExt = file.replace('.txt', '');
    return !TEMPLATE_MAPPING[nameWithoutExt];
  });
  
  if (unmappedFiles.length > 0) {
    console.warn('⚠️ 매핑되지 않은 파일들:');
    unmappedFiles.forEach(file => console.warn(`   - ${file}`));
    console.log('');
  }
  
  // 매핑된 파일만 처리
  const mappedFiles = txtFiles.filter(file => {
    const nameWithoutExt = file.replace('.txt', '');
    return TEMPLATE_MAPPING[nameWithoutExt];
  });
  
  console.log(`✅ 업로드 대상 파일: ${mappedFiles.length}개`);
  console.log(`⏱️ 예상 소요 시간: ${Math.ceil(mappedFiles.length * CONFIG.delayBetweenUploads / 1000 / 60)}분`);
  console.log('');
  
  // 진행률 추적
  let successCount = 0;
  let failCount = 0;
  let totalClauses = 0;
  
  // 순차 업로드
  for (let i = 0; i < mappedFiles.length; i++) {
    const file = mappedFiles[i];
    const nameWithoutExt = file.replace('.txt', '');
    const category = TEMPLATE_MAPPING[nameWithoutExt];
    const filePath = path.join(CONFIG.contractsDir, file);
    
    console.log(`\n📋 [${i + 1}/${mappedFiles.length}] ${nameWithoutExt}`);
    console.log(`   카테고리: ${category}`);
    
    try {
      // 파일 읽기
      const content = fs.readFileSync(filePath, 'utf8');
      const fileSize = fs.statSync(filePath).size;
      
      console.log(`   파일 크기: ${formatBytes(fileSize)}`);
      console.log(`   내용 길이: ${content.length.toLocaleString()}자`);
      
      // 업로드 실행
      const result = await uploadTemplate({
        name: nameWithoutExt,
        category: category,
        content: content,
        token: token
      });
      
      if (result.success) {
        successCount++;
        totalClauses += result.extractedClauses || 0;
        
        console.log(`   ✅ 업로드 성공`);
        console.log(`   🔍 추출된 조항: ${result.extractedClauses || 0}개`);
        
        if (result.analysis) {
          console.log(`   📊 분석 완료: ${result.analysis.clauseCount}개 조항 분석됨`);
        }
      } else {
        failCount++;
        console.log(`   ❌ 업로드 실패: ${result.error}`);
      }
      
    } catch (error) {
      failCount++;
      console.log(`   ❌ 파일 처리 오류: ${error.message}`);
    }
    
    // 진행률 표시
    const progress = Math.round(((i + 1) / mappedFiles.length) * 100);
    console.log(`   📈 진행률: ${progress}% (성공: ${successCount}, 실패: ${failCount})`);
    
    // 다음 파일 전 대기 (마지막 파일 제외)
    if (i < mappedFiles.length - 1) {
      console.log(`   ⏳ ${CONFIG.delayBetweenUploads / 1000}초 대기 중... (AI 분석 시간)`);
      await sleep(CONFIG.delayBetweenUploads);
    }
  }
  
  // 최종 결과
  console.log('\n🎉 대량 업로드 완료!');
  console.log('==========================================');
  console.log(`📊 총 파일: ${mappedFiles.length}개`);
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`🏷️ 총 추출된 조항: ${totalClauses.toLocaleString()}개`);
  console.log(`📈 성공률: ${Math.round((successCount / mappedFiles.length) * 100)}%`);
  
  if (totalClauses > 0) {
    console.log('');
    console.log('🔍 조항 검토 안내:');
    console.log('1. 브라우저에서 http://localhost:3100/admin/clauses 접속');
    console.log('2. 검토 대기 조항들을 확인하고 승인/거부 처리');
    console.log(`3. 예상 검토 대기 조항: 약 ${Math.round(totalClauses * 0.3)}개 (신뢰도 85% 미만)`);
  }
  
  if (failCount > 0) {
    console.log('\n⚠️ 실패한 파일들을 다시 확인해보세요.');
  }
}

/**
 * 개별 템플릿 업로드
 */
async function uploadTemplate({ name, category, content, token }) {
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      const response = await axios.post(`${CONFIG.baseUrl}/api/admin/templates`, {
        name: name,
        category: category,
        content: content,
        description: `${name} 템플릿 (자동 업로드)`
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = response.data;
      
      return {
        success: true,
        extractedClauses: result.extractedClauses || 0,
        analysis: result.analysis,
        message: result.message
      };
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      console.log(`   ⚠️ 시도 ${attempt}/${CONFIG.maxRetries} 실패: ${errorMsg}`);
      
      if (attempt === CONFIG.maxRetries) {
        return {
          success: false,
          error: errorMsg
        };
      }
      
      // 재시도 전 짧은 대기
      await sleep(1000);
    }
  }
}

/**
 * 명령행 인수에서 토큰 추출
 */
function getTokenFromArgs() {
  const args = process.argv.slice(2);
  const tokenArg = args.find(arg => arg.startsWith('--token='));
  
  if (tokenArg) {
    return tokenArg.split('=')[1];
  }
  
  return null;
}

/**
 * 파일 크기 포맷팅
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 대기 함수
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 에러 핸들링
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('처리되지 않은 Promise 거부:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('처리되지 않은 예외:', error);
  process.exit(1);
});

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  });
}