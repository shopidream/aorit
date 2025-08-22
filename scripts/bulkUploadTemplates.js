// scripts/bulkUploadTemplates.js - AI 분류 기반 대량 템플릿 자동 업로드
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 언어 정보
const LANGUAGES = {
  kr: { name: '한국어', flag: '🇰🇷' },
  en: { name: 'English', flag: '🇺🇸' },
  es: { name: 'Español', flag: '🇪🇸' },
  de: { name: 'Deutsch', flag: '🇩🇪' }
};

// 설정
const CONFIG = {
  baseUrl: 'http://localhost:3100',
  templatesBaseDir: './templates',
  delayBetweenUploads: 3000, // 3초 딜레이 (AI 분석 시간 고려)
  maxRetries: 3,
  skipExisting: true // 기존 업로드된 템플릿 제외
};

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 AI 기반 다국어 템플릿 대량 업로드 시작...');
  console.log(`📁 템플릿 기본 폴더: ${CONFIG.templatesBaseDir}`);
  console.log(`🎯 서버 주소: ${CONFIG.baseUrl}`);
  
  try {
    // 명령행 인수 파싱
    const args = parseArguments();
    
    if (!args.token) {
      showUsage();
      process.exit(1);
    }

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY 환경변수가 설정되지 않았습니다.');
      process.exit(1);
    }
    
    // 언어 선택
    const selectedLang = args.language || await selectLanguage();
    const contractsDir = path.join(CONFIG.templatesBaseDir, `contract_templates_${selectedLang}`);
    
    // 템플릿 폴더 확인
    if (!fs.existsSync(contractsDir)) {
      console.error(`❌ 템플릿 폴더를 찾을 수 없습니다: ${contractsDir}`);
      console.log(`\n📝 폴더 생성 방법:`);
      console.log(`mkdir -p ${contractsDir}`);
      process.exit(1);
    }
    
    const langInfo = LANGUAGES[selectedLang];
    
    console.log(`\n🌍 선택된 언어: ${langInfo.flag} ${langInfo.name}`);
    console.log(`📂 템플릿 폴더: ${contractsDir}`);
    
    // 기존 업로드된 템플릿 목록 가져오기
    let existingTemplates = [];
    if (CONFIG.skipExisting) {
      console.log(`\n🔍 기존 업로드된 템플릿 확인 중...`);
      existingTemplates = await getExistingTemplateNames(args.token);
      console.log(`📋 기존 템플릿: ${existingTemplates.length}개`);
    }
    
    // txt 파일 목록 가져오기
    const allFiles = fs.readdirSync(contractsDir)
      .filter(file => file.endsWith('.txt'))
      .sort();
    
    console.log(`📄 발견된 템플릿 파일: ${allFiles.length}개`);
    
    // 중복 제외 필터링
    let filteredFiles = allFiles;
    if (CONFIG.skipExisting && existingTemplates.length > 0) {
      filteredFiles = allFiles.filter(file => {
        const nameWithoutExt = file.replace('.txt', '');
        const isExisting = existingTemplates.some(existing => 
          existing === nameWithoutExt || existing.startsWith(nameWithoutExt)
        );
        return !isExisting;
      });
      
      console.log(`🆕 신규 파일: ${filteredFiles.length}개`);
      console.log(`⏭️ 제외된 파일: ${allFiles.length - filteredFiles.length}개 (이미 업로드됨)`);
    }
    
    if (filteredFiles.length === 0) {
      console.log(`\n✅ 모든 파일이 이미 업로드되었습니다!`);
      console.log(`💡 새 템플릿 파일을 ${contractsDir}에 추가하세요.`);
      return;
    }
    
    console.log(`\n✅ 업로드 대상 파일: ${filteredFiles.length}개`);
    console.log(`💰 예상 AI 분류 비용: 약 $${calculateAICost(filteredFiles.length).toFixed(3)}`);
    console.log(`⏱️ 예상 소요시간: ${Math.ceil(filteredFiles.length * CONFIG.delayBetweenUploads / 1000 / 60)}분`);
    console.log('');
    
    // 확인 요청 (배치 모드가 아닌 경우)
    if (!args.batch) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('계속 진행하시겠습니까? (y/N): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('업로드가 취소되었습니다.');
        process.exit(0);
      }
    }
    
    // 진행률 추적
    let successCount = 0;
    let failCount = 0;
    let totalClauses = 0;
    let totalAICost = 0;
    
    // 순차 업로드
    for (let i = 0; i < filteredFiles.length; i++) {
      const file = filteredFiles[i];
      const nameWithoutExt = file.replace('.txt', '');
      const filePath = path.join(contractsDir, file);
      
      console.log(`\n📋 [${i + 1}/${filteredFiles.length}] ${nameWithoutExt}`);
      console.log(`   🌍 언어: ${langInfo.flag} ${langInfo.name}`);
      
      try {
        // 파일 읽기
        const content = fs.readFileSync(filePath, 'utf8');
        const fileSize = fs.statSync(filePath).size;
        
        console.log(`   📏 파일 크기: ${formatBytes(fileSize)}`);
        console.log(`   📝 내용 길이: ${content.length.toLocaleString()}자`);
        
        // AI로 카테고리 분류
        console.log(`   🤖 AI 카테고리 분류 중...`);
        const categoryResult = await classifyTemplateWithAI(nameWithoutExt, selectedLang);
        
        console.log(`   📂 AI 분류 결과: ${categoryResult.category} (신뢰도: ${Math.round(categoryResult.confidence * 100)}%)`);
        console.log(`   💡 분류 이유: ${categoryResult.reason}`);
        console.log(`   💰 분류 비용: $${categoryResult.cost.toFixed(6)}`);
        
        totalAICost += categoryResult.cost;
        
        // 신뢰도가 낮으면 경고
        if (categoryResult.confidence < 0.8) {
          console.log(`   ⚠️ 낮은 신뢰도 - 검토 권장`);
        }
        
        // 업로드 실행
        const result = await uploadTemplate({
          name: `${nameWithoutExt} (${langInfo.name})`,
          category: categoryResult.category,
          content: content,
          language: selectedLang,
          classification: categoryResult,
          token: args.token
        });
        
        if (result.success) {
          successCount++;
          totalClauses += result.extractedClauses || 0;
          
          console.log(`   ✅ 업로드 성공`);
          console.log(`   🔍 추출된 조항: ${result.extractedClauses || 0}개`);
          
          if (result.analysis) {
            console.log(`   📊 조항 분석 완료: ${result.analysis.clauseCount}개 조항 분석됨`);
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
      const progress = Math.round(((i + 1) / filteredFiles.length) * 100);
      console.log(`   📈 진행률: ${progress}% (성공: ${successCount}, 실패: ${failCount})`);
      
      // 다음 파일 전 대기 (마지막 파일 제외)
      if (i < filteredFiles.length - 1) {
        console.log(`   ⏳ ${CONFIG.delayBetweenUploads / 1000}초 대기 중... (AI 분석 시간)`);
        await sleep(CONFIG.delayBetweenUploads);
      }
    }
    
    // 최종 결과
    console.log('\n🎉 대량 업로드 완료!');
    console.log('==========================================');
    console.log(`🌍 언어: ${langInfo.flag} ${langInfo.name}`);
    console.log(`📊 총 파일: ${filteredFiles.length}개`);
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`🏷️ 총 추출된 조항: ${totalClauses.toLocaleString()}개`);
    console.log(`💰 총 AI 분류 비용: $${totalAICost.toFixed(6)}`);
    console.log(`📈 성공률: ${Math.round((successCount / filteredFiles.length) * 100)}%`);
    
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
    
  } catch (error) {
    console.error('❌ 실행 오류:', error);
    throw error;
  }
}

/**
 * AI로 템플릿 카테고리 분류
 */
async function classifyTemplateWithAI(fileName, language) {
  const prompt = createCategoryPrompt(fileName, language);
  
  try {
    console.log(`     🔄 GPT-4o-mini로 분류 중...`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ 
          role: 'user', 
          content: prompt 
        }],
        max_tokens: 200,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // 토큰 사용량 및 비용 계산
    const inputTokens = data.usage.prompt_tokens;
    const outputTokens = data.usage.completion_tokens;
    const cost = (inputTokens * 0.25 / 1000000) + (outputTokens * 2.00 / 1000000);
    
    // JSON 파싱
    let parsed;
    try {
      const cleanContent = content.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      throw new Error(`JSON 파싱 실패: ${parseError.message}`);
    }
    
    return {
      category: parsed.category,
      confidence: parsed.confidence || 0.5,
      reason: parsed.reason || '',
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      cost: cost
    };
    
  } catch (error) {
    console.error(`     ❌ AI 분류 오류: ${error.message}`);
    
    // 폴백: 키워드 기반 분류
    return fallbackCategorization(fileName);
  }
}

/**
 * 언어별 카테고리 분류 프롬프트 생성
 */
function createCategoryPrompt(fileName, language) {
  if (language === 'kr') {
    return `다음 한국어 계약서 파일명을 분석하여 가장 적절한 카테고리를 선택하세요.

사용 가능한 카테고리 (정확히 이 중 하나만 선택)와 정의:
- 용역/프로젝트: 특정 업무, 서비스, 프로젝트 수행을 위한 계약 (예: 개발용역, 공연예술용역)
- 거래/구매: 제품, 물품, 재료, 콘텐츠 등의 매매 및 구매 관련 계약 (예: 물품구매계약서, 오디오북 유통 계약서)
- 제조/공급: 제품, 부품, 장비 등의 제작, 제조, 공급과 관련된 계약 (예: 건설공사 도급계약, 금형제작 계약)
- 근로/고용: 고용, 근로, 인력 제공 관련 계약 (예: 표준근로계약서, 공연예술출연계약서)
- 파트너십/제휴: 공동사업, 협력, 대리점, 프랜차이즈 등의 제휴 관련 계약
- 투자/자금: 자금조달, 투자, 금융 거래 관련 계약
- 비밀/보안: 비밀유지, 개인정보, 보안 관련 계약
- 기타/일반: 위의 어느 범주에도 속하지 않는 일반 계약서 (예: 각종 확인서, 각서)

계약서 파일명: ${fileName}

다음 JSON 형식으로만 응답하세요:
{
  "category": "선택된 카테고리",
  "confidence": 0.95,
  "reason": "분류 이유 (한 문장)"
}`;
  } else if (language === 'en') {
    return `Analyze the following English contract filename and select the most appropriate category.

Available categories (select exactly one):
- Service/Project: Contracts for specific services, work, or project execution
- Trade/Purchase: Contracts for buying/selling products, materials, or content
- Manufacturing/Supply: Contracts for production, manufacturing, or supply
- Employment/Labor: Employment, labor, or workforce contracts
- Partnership/Alliance: Joint ventures, partnerships, franchises, or alliances
- Investment/Finance: Investment, funding, or financial contracts
- Confidentiality/Security: Confidentiality, privacy, or security contracts
- General/Others: General contracts not fitting above categories

Contract filename: ${fileName}

Respond only in this JSON format:
{
  "category": "selected category",
  "confidence": 0.95,
  "reason": "classification reason (one sentence)"
}`;
  }
  
  // 기타 언어는 영어로 기본 처리
  return createCategoryPrompt(fileName, 'en');
}

/**
 * 폴백 카테고리 분류 (키워드 기반)
 */
function fallbackCategorization(fileName) {
  const keywords = {
    '용역/프로젝트': ['용역', '개발', '제작', '컨설팅', '디자인', '설계', '감리'],
    '거래/구매': ['매매', '구매', '임대', '렌탈', '공급', '유통'],
    '제조/공급': ['제조', '생산', '하도급', '납품', '건설', '공사'],
    '근로/고용': ['근로', '고용', '출연', '광고', '위촉'],
    '파트너십/제휴': ['대리점', '프랜차이즈', '동업', '제휴', '협약'],
    '투자/자금': ['투자', '대출', '자금', '대차'],
    '비밀/보안': ['비밀', '보안', '개인정보'],
    '기타/일반': ['각서', '확인서', '영수증']
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => fileName.includes(word))) {
      return {
        category,
        confidence: 0.7,
        reason: `파일명 키워드 매칭: ${words.find(w => fileName.includes(w))}`,
        inputTokens: 0,
        outputTokens: 0,
        cost: 0
      };
    }
  }

  return {
    category: '기타/일반',
    confidence: 0.5,
    reason: '기본 카테고리',
    inputTokens: 0,
    outputTokens: 0,
    cost: 0
  };
}

/**
 * 기존 업로드된 템플릿 이름 가져오기
 */
async function getExistingTemplateNames(token) {
  try {
    const response = await axios.get(`${CONFIG.baseUrl}/api/admin/templates`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        limit: 1000 // 충분히 큰 수로 모든 템플릿 조회
      }
    });
    
    return response.data.templates.map(t => {
      // "템플릿명 (한국어)" 형태에서 템플릿명만 추출
      const match = t.name.match(/^(.+?)\s*\(/);
      return match ? match[1].trim() : t.name;
    });
  } catch (error) {
    console.warn(`⚠️ 기존 템플릿 목록 조회 실패: ${error.message}`);
    return [];
  }
}

/**
 * 개별 템플릿 업로드
 */
async function uploadTemplate({ name, category, content, language, classification, token }) {
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      const response = await axios.post(`${CONFIG.baseUrl}/api/admin/templates`, {
        name: name,
        category: category,
        content: content,
        description: `${name} 템플릿 (AI 자동 분류)`,
        language: language,
        tags: [language, 'ai-classified', `confidence-${Math.round(classification.confidence * 100)}`],
        classification: {
          method: 'ai_automatic',
          confidence: classification.confidence,
          reason: classification.reason,
          aiCost: classification.cost
        }
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
      console.log(`     ⚠️ 업로드 시도 ${attempt}/${CONFIG.maxRetries} 실패: ${errorMsg}`);
      
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
 * 명령행 인수 파싱
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const result = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--token=')) {
      result.token = arg.split('=')[1];
    } else if (arg.startsWith('--lang=') || arg.startsWith('--language=')) {
      result.language = arg.split('=')[1];
    } else if (arg === '--batch' || arg === '-b') {
      result.batch = true;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  });
  
  return result;
}

/**
 * 언어 선택 (대화형)
 */
async function selectLanguage() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\n🌍 사용 가능한 언어:');
  Object.entries(LANGUAGES).forEach(([code, info]) => {
    console.log(`   ${code}: ${info.flag} ${info.name}`);
  });
  
  const answer = await new Promise(resolve => {
    rl.question('\n언어 코드를 입력하세요 (kr/en/es/de): ', resolve);
  });
  
  rl.close();
  
  if (!LANGUAGES[answer]) {
    console.error('❌ 유효하지 않은 언어 코드입니다.');
    process.exit(1);
  }
  
  return answer;
}

/**
 * 사용법 출력
 */
function showUsage() {
  console.log('사용법:');
  console.log('  node scripts/bulkUploadTemplates.js --token=YOUR_TOKEN [옵션]');
  console.log('');
  console.log('필수 옵션:');
  console.log('  --token=TOKEN        인증 토큰');
  console.log('');
  console.log('선택 옵션:');
  console.log('  --lang=LANG         언어 코드 (kr/en/es/de, 기본값: 대화형 선택)');
  console.log('  --batch, -b         배치 모드 (확인 없이 진행)');
  console.log('  --help, -h          도움말 출력');
  console.log('');
  console.log('예시:');
  console.log('  node scripts/bulkUploadTemplates.js --token=abc123 --lang=kr');
  console.log('  node scripts/bulkUploadTemplates.js --token=abc123 --batch');
  console.log('');
  console.log('토큰 확인 방법:');
  console.log('1. 브라우저에서 http://localhost:3100/login 접속');
  console.log('2. 관리자로 로그인');
  console.log('3. 개발자도구(F12) > Application > Local Storage > token 값 복사');
}

/**
 * AI 분류 비용 계산
 */
function calculateAICost(fileCount) {
  const avgInputTokens = 300;  // 파일명 + 프롬프트
  const avgOutputTokens = 50;  // 간단한 JSON 응답
  
  const inputCost = (fileCount * avgInputTokens * 0.25) / 1000000;
  const outputCost = (fileCount * avgOutputTokens * 2.00) / 1000000;
  
  return inputCost + outputCost;
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
  const args = parseArguments();
  
  if (args.help) {
    showUsage();
    process.exit(0);
  }
  
  main().catch(error => {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  });
}