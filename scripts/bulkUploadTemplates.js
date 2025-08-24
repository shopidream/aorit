// scripts/bulkUploadTemplates.js - 최종 최적화된 다국가 계약서 자동 분류 업로드 시스템
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 30개국 완전 지원
const COUNTRIES = {
  // 아시아-태평양
  kr: { name: 'South Korea', flag: '🇰🇷', legalSystem: 'civil_law', language: 'ko' },
  jp: { name: 'Japan', flag: '🇯🇵', legalSystem: 'civil_law', language: 'ja' },
  tw: { name: 'Taiwan', flag: '🇹🇼', legalSystem: 'civil_law', language: 'zh-TW' },
  sg: { name: 'Singapore', flag: '🇸🇬', legalSystem: 'common_law', language: 'en' },
  hk: { name: 'Hong Kong', flag: '🇭🇰', legalSystem: 'common_law', language: 'en' },
  my: { name: 'Malaysia', flag: '🇲🇾', legalSystem: 'mixed_law', language: 'en' },
  th: { name: 'Thailand', flag: '🇹🇭', legalSystem: 'civil_law', language: 'th' },
  ph: { name: 'Philippines', flag: '🇵🇭', legalSystem: 'common_law', language: 'en' },
  in: { name: 'India', flag: '🇮🇳', legalSystem: 'common_law', language: 'en' },
  au: { name: 'Australia', flag: '🇦🇺', legalSystem: 'common_law', language: 'en' },
  nz: { name: 'New Zealand', flag: '🇳🇿', legalSystem: 'common_law', language: 'en' },

  // 북미
  us: { name: 'United States', flag: '🇺🇸', legalSystem: 'common_law', language: 'en' },
  ca: { name: 'Canada', flag: '🇨🇦', legalSystem: 'common_law', language: 'en' },
  mx: { name: 'Mexico', flag: '🇲🇽', legalSystem: 'civil_law', language: 'es' },

  // 유럽
  uk: { name: 'United Kingdom', flag: '🇬🇧', legalSystem: 'common_law', language: 'en' },
  ie: { name: 'Ireland', flag: '🇮🇪', legalSystem: 'common_law', language: 'en' },
  de: { name: 'Germany', flag: '🇩🇪', legalSystem: 'civil_law', language: 'de' },
  fr: { name: 'France', flag: '🇫🇷', legalSystem: 'civil_law', language: 'fr' },
  es: { name: 'Spain', flag: '🇪🇸', legalSystem: 'civil_law', language: 'es' },
  it: { name: 'Italy', flag: '🇮🇹', legalSystem: 'civil_law', language: 'it' },
  nl: { name: 'Netherlands', flag: '🇳🇱', legalSystem: 'civil_law', language: 'nl' },
  be: { name: 'Belgium', flag: '🇧🇪', legalSystem: 'civil_law', language: 'nl' },
  ch: { name: 'Switzerland', flag: '🇨🇭', legalSystem: 'civil_law', language: 'de' },
  se: { name: 'Sweden', flag: '🇸🇪', legalSystem: 'civil_law', language: 'sv' },
  no: { name: 'Norway', flag: '🇳🇴', legalSystem: 'civil_law', language: 'no' },
  dk: { name: 'Denmark', flag: '🇩🇰', legalSystem: 'civil_law', language: 'da' },
  fi: { name: 'Finland', flag: '🇫🇮', legalSystem: 'civil_law', language: 'fi' },
  pl: { name: 'Poland', flag: '🇵🇱', legalSystem: 'civil_law', language: 'pl' },
  ru: { name: 'Russia', flag: '🇷🇺', legalSystem: 'civil_law', language: 'ru' },

  // 중동
  ae: { name: 'UAE', flag: '🇦🇪', legalSystem: 'mixed_law', language: 'en' },

  // 남미
  br: { name: 'Brazil', flag: '🇧🇷', legalSystem: 'civil_law', language: 'pt' },

  // 아프리카
  za: { name: 'South Africa', flag: '🇿🇦', legalSystem: 'mixed_law', language: 'en' }
};

// 계약서 카테고리 (8개 - 모든 국가 공통, 원본 코드 유지)
const TEMPLATE_CATEGORIES = [
  '용역/프로젝트', '거래/구매', '제조/공급', '근로/고용', 
  '파트너십/제휴', '투자/자금', '비밀/보안', '기타/일반'
];

// 설정
const CONFIG = {
  baseUrl: 'http://localhost:3100',
  templatesBaseDir: './templates',
  processedDir: './templates/processed',
  delayBetweenUploads: 2000,
  maxRetries: 1,
  skipExisting: true
};

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🌍 최적화된 다국가 계약서 자동 분류 시스템 시작...');
  console.log(`📁 기본 폴더: ${CONFIG.templatesBaseDir}`);
  console.log(`🎯 서버: ${CONFIG.baseUrl}`);
  
  try {
    const args = parseArguments();
    
    if (!args.token) {
      showUsage();
      process.exit(1);
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY 환경변수가 필요합니다.');
      process.exit(1);
    }
    
    // processed 폴더 생성
    if (!fs.existsSync(CONFIG.processedDir)) {
      fs.mkdirSync(CONFIG.processedDir, { recursive: true });
    }
    
    // 전체 폴더 스캔
    const templateFolders = scanAllTemplateFolders();
    
    if (templateFolders.length === 0) {
      console.error('❌ contract_templates_* 폴더가 없습니다.');
      console.log('📝 예시: mkdir -p ./templates/contract_templates_kr');
      process.exit(1);
    }
    
    console.log(`\n📂 발견된 폴더: ${templateFolders.length}개`);
    templateFolders.forEach(folder => {
      const info = COUNTRIES[folder.countryCode] || { name: 'Unknown', flag: '❓' };
      console.log(`   📁 ${folder.folderName} → ${info.flag} ${info.name}`);
    });
    
    // 전체 통계
    let totalStats = {
      files: 0, success: 0, fails: 0, skipped: 0, 
      mismatches: 0, cost: 0, clauses: 0
    };
    
    // 배치 모드 확인
    if (!args.batch) {
      const estimatedFiles = templateFolders.reduce((sum, folder) => {
        const files = fs.readdirSync(folder.folderPath).filter(f => f.endsWith('.txt'));
        return sum + files.length;
      }, 0);
      
      console.log(`\n📊 예상 파일: ${estimatedFiles}개`);
      console.log(`💰 예상 AI 비용: ~$${calculateAICost(estimatedFiles).toFixed(3)}`);
      console.log(`⏱️ 예상 시간: ~${Math.ceil(estimatedFiles * CONFIG.delayBetweenUploads / 60000)}분`);
      
      if (!await confirmProceed()) {
        console.log('취소되었습니다.');
        process.exit(0);
      }
    }
    
    // 각 폴더 처리
    for (let i = 0; i < templateFolders.length; i++) {
      const folder = templateFolders[i];
      const info = COUNTRIES[folder.countryCode] || { name: 'Unknown', flag: '❓' };
      
      console.log(`\n🌍 [${i + 1}/${templateFolders.length}] ${info.flag} ${info.name} 처리중...`);
      
      const result = await processCountryFolder(folder, args.token);
      
      // 통계 집계
      Object.keys(totalStats).forEach(key => {
        totalStats[key] += (result[key] || 0);
      });
      
      console.log(`✅ ${info.name} 완료: 성공 ${result.success}, 실패 ${result.fails}, 스킵 ${result.skipped}`);
      
      if (result.mismatches > 0) {
        console.log(`⚠️ 국가 불일치: ${result.mismatches}개`);
      }
    }
    
    // 최종 결과
    showFinalResults(totalStats);
    
  } catch (error) {
    console.error('❌ 실행 오류:', error);
    process.exit(1);
  }
}

/**
 * 전체 폴더 스캔
 */
function scanAllTemplateFolders() {
  if (!fs.existsSync(CONFIG.templatesBaseDir)) {
    return [];
  }
  
  return fs.readdirSync(CONFIG.templatesBaseDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('contract_templates_'))
    .map(dirent => ({
      folderName: dirent.name,
      countryCode: dirent.name.replace('contract_templates_', ''),
      folderPath: path.join(CONFIG.templatesBaseDir, dirent.name)
    }));
}

/**
 * 국가 폴더 처리 (원본 로직 유지 + 최적화)
 */
async function processCountryFolder(folder, token) {
  const { countryCode, folderPath } = folder;
  const countryInfo = COUNTRIES[countryCode] || { 
    name: 'Unknown', flag: '❓', legalSystem: 'unknown', language: 'en' 
  };
  
  // 1. 🔍 기존 템플릿 조회 (중복 확인용 - AI 없음)
  console.log(`   🔍 기존 ${countryCode.toUpperCase()} 템플릿 확인중...`);
  const existingTemplates = await getExistingTemplateNames(token, countryCode);
  console.log(`   📋 기존: ${existingTemplates.length}개`);
  
  // 2. 📄 파일 목록 조회
  const allFiles = fs.readdirSync(folderPath)
    .filter(file => file.endsWith('.txt'))
    .sort();
  
  console.log(`   📄 전체 파일: ${allFiles.length}개`);
  
  // 3. 🚀 중복 사전 제거 (AI 실행 전에 완전 배제)
  let newFiles = [];
  let skipped = 0;
  
  if (CONFIG.skipExisting && existingTemplates.length > 0) {
    console.log(`   🔍 중복 파일 사전 제거중 (AI 미실행)...`);
    
    for (const file of allFiles) {
      const nameWithoutExt = file.replace('.txt', '');
      if (existingTemplates.includes(nameWithoutExt)) {
        skipped++;
        console.log(`      ⏭️ 스킵: ${nameWithoutExt}`);
      } else {
        newFiles.push(file);
      }
    }
    
    console.log(`   🆕 신규: ${newFiles.length}개, ⏭️ 스킵: ${skipped}개 (AI 비용 절약)`);
  } else {
    newFiles = [...allFiles];
  }
  
  if (newFiles.length === 0) {
    console.log(`   ✅ 모든 파일이 이미 업로드됨!`);
    return { 
      files: allFiles.length, success: 0, fails: 0, skipped: allFiles.length, 
      mismatches: 0, cost: 0, clauses: 0 
    };
  }
  
  // 4. 🎯 국가별 조항 카테고리 DB 조회
  console.log(`   📋 ${countryCode.toUpperCase()} 조항 카테고리 조회중...`);
  const clauseCategories = await getCountryClauseCategories(countryCode);
  console.log(`   📂 조항 카테고리: ${clauseCategories.length}개`);
  
  // 5. 신규 파일만 처리 (최적화된 AI 분석)
  let success = 0, fails = 0, mismatches = 0, totalCost = 0, totalClauses = 0;
  
  for (let i = 0; i < newFiles.length; i++) {
    const file = newFiles[i];
    const nameWithoutExt = file.replace('.txt', '');
    const filePath = path.join(folderPath, file);
    
    console.log(`\n   📋 [${i + 1}/${newFiles.length}] ${nameWithoutExt}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`      📏 크기: ${formatBytes(fs.statSync(filePath).size)}`);
      
      // 6. 🚀 최적화된 AI 분석 (국가 판별 + 계약서 카테고리만)
      console.log(`      🤖 AI 국가판별 + 계약분류중... (${countryCode.toUpperCase()})`);
      const aiResult = await optimizedAIAnalysis(nameWithoutExt, content.substring(0, 500), countryCode);
      
      totalCost += aiResult.cost;
      
      // 국가 불일치 체크 (원본 로직 유지)
      if (aiResult.detectedCountry !== countryCode) {
        mismatches++;
        console.log(`      ⚠️ 국가 불일치: 폴더=${countryCode} vs AI=${aiResult.detectedCountry} (${Math.round(aiResult.countryConfidence * 100)}%)`);
        console.log(`      📝 폴더 기준으로 업로드 진행 (원본 로직)`);
      } else {
        console.log(`      ✅ 국가 일치: ${countryCode} (${Math.round(aiResult.countryConfidence * 100)}%)`);
      }
      
      console.log(`      📂 계약 카테고리: ${aiResult.templateCategory} (${Math.round(aiResult.categoryConfidence * 100)}%)`);
      console.log(`      💰 AI 비용: ${aiResult.cost.toFixed(6)}`);
      
      // 낮은 신뢰도 체크 (원본 로직)
      if (aiResult.categoryConfidence < 0.8) {
        console.log(`      ⚠️ 낮은 신뢰도 - 검토 권장`);
      }
      
      // 7. 템플릿 업로드 (조항 분석은 서버에서 AI로 처리)
      const result = await uploadTemplate({
        name: `${nameWithoutExt} (${countryInfo.name})`,
        category: aiResult.templateCategory,
        content: content,
        countryCode: countryCode, // 폴더 기준 우선 사용
        language: countryInfo.language,
        legalSystem: countryInfo.legalSystem,
        aiVerification: aiResult,
        clauseCategories: clauseCategories, // DB에서 조회한 조항 카테고리
        token: token
      });
      
      if (result.success) {
        success++;
        totalClauses += (result.extractedClauses || 0);
        console.log(`      ✅ 업로드 성공`);
        console.log(`      🔍 추출된 조항: ${result.extractedClauses || 0}개`);
        
        // 조항 분석 결과 표시 (원본 로직 완전 유지)
        if (result.analysis) {
          console.log(`      📊 조항 분석 완료: ${result.analysis.clauseCount}개 조항 분석됨`);
          if (result.analysis.countryRisk) {
            console.log(`      ⚠️ 국가별 위험도: ${result.analysis.countryRisk}/10`);
          }
          
          // 원본에는 없었지만 80% 기준 표시 (서버에서 처리된 결과)
          if (result.analysis.successRate !== undefined) {
            const successRate = Math.round(result.analysis.successRate * 100);
            if (successRate >= 80) {
              console.log(`      🎯 조항 분류 성공률: ${successRate}% (≥80%)`);
            } else {
              console.log(`      ⚠️ 조항 분류 성공률: ${successRate}% (<80% - 검토 필요)`);
            }
          }
        }
        
        // 8. 완료된 파일 이동
        await moveToProcessed(filePath, countryCode, file);
        
      } else {
        fails++;
        console.log(`      ❌ 업로드 실패: ${result.error}`);
      }
      
    } catch (error) {
      fails++;
      console.log(`      ❌ 파일 오류: ${error.message}`);
    }
    
    console.log(`      📈 진행률: ${Math.round(((i + 1) / newFiles.length) * 100)}%`);
    
    // 딜레이
    if (i < newFiles.length - 1) {
      console.log(`      ⏳ ${CONFIG.delayBetweenUploads / 1000}초 대기중...`);
      await sleep(CONFIG.delayBetweenUploads);
    }
  }
  
  return {
    files: allFiles.length,
    success,
    fails,
    skipped, // 사전에 제거된 중복 파일 수
    mismatches,
    cost: totalCost,
    clauses: totalClauses
  };
}

/**
 * 🎯 최적화된 AI 분석 (국가 판별 + 계약 카테고리만)
 */
async function optimizedAIAnalysis(fileName, contentPreview, expectedCountry) {
  const prompt = createOptimizedPrompt(fileName, contentPreview, expectedCountry);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120, // 최적화: 더 짧은 응답
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    const cost = (data.usage.prompt_tokens * 0.25 + data.usage.completion_tokens * 2.00) / 1000000;
    
    try {
      const cleaned = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      return {
        detectedCountry: parsed.country || expectedCountry,
        countryConfidence: parsed.countryConfidence || 0.8,
        templateCategory: parsed.templateCategory || '기타/일반',
        categoryConfidence: parsed.categoryConfidence || 0.8,
        cost: cost
      };
      
    } catch (parseError) {
      console.warn(`      ⚠️ JSON 파싱 실패, 폴백 적용`);
      return fallbackAnalysis(fileName, expectedCountry);
    }
    
  } catch (error) {
    console.warn(`      ⚠️ AI 분석 실패: ${error.message}`);
    return fallbackAnalysis(fileName, expectedCountry);
  }
}

/**
 * 최적화된 프롬프트 생성 (국가 판별 + 계약 카테고리만)
 */
function createOptimizedPrompt(fileName, contentPreview, expectedCountry) {
  const countryInfo = COUNTRIES[expectedCountry] || { name: 'Unknown' };
  const allCountries = Object.keys(COUNTRIES).join('/');
  
  return `계약서 전문가로서 다음 2가지만 빠르게 분석하세요:

파일명: ${fileName}
예상 국가: ${expectedCountry} (${countryInfo.name})
내용: ${contentPreview}

다음 JSON만 응답:
{
  "country": "국가코드",
  "countryConfidence": 0.95,
  "templateCategory": "계약 카테고리",
  "categoryConfidence": 0.90
}

국가코드: ${allCountries}
계약 카테고리: ${TEMPLATE_CATEGORIES.join(', ')}`;
}

/**
 * 폴백 분석 (AI 실패시)
 */
function fallbackAnalysis(fileName, countryCode) {
  const keywords = {
    '용역/프로젝트': ['용역', '개발', 'service', 'project', 'consulting'],
    '거래/구매': ['매매', '구매', 'purchase', 'sale', 'buy'],
    '제조/공급': ['제조', '생산', 'manufacturing', 'supply'],
    '근로/고용': ['근로', '고용', 'employment', 'work'],
    '파트너십/제휴': ['제휴', 'partnership', 'alliance'],
    '투자/자금': ['투자', '대출', 'investment', 'loan'],
    '비밀/보안': ['비밀', 'confidential', 'nda'],
    '기타/일반': ['agreement', 'general', '계약']
  };

  let category = '기타/일반';
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(word => fileName.toLowerCase().includes(word.toLowerCase()))) {
      category = cat;
      break;
    }
  }

  return {
    detectedCountry: countryCode,
    countryConfidence: 0.7,
    templateCategory: category,
    categoryConfidence: 0.7,
    cost: 0
  };
}

/**
 * 🎯 국가별 조항 카테고리 DB 조회
 */
async function getCountryClauseCategories(countryCode) {
  try {
    const response = await axios.get(`${CONFIG.baseUrl}/api/admin/country-clause-categories`, {
      params: { countryCode }
    });
    
    return response.data.categories || [];
  } catch (error) {
    console.warn(`      ⚠️ ${countryCode} 조항 카테고리 조회 실패: ${error.message}`);
    
    // 폴백: 기본 카테고리 반환
    return [
      { categoryKey: 'basic', categoryName: '기본 정보' },
      { categoryKey: 'payment', categoryName: '대금 지급' },
      { categoryKey: 'service', categoryName: '서비스 범위' },
      { categoryKey: 'delivery', categoryName: '납품 조건' },
      { categoryKey: 'warranty', categoryName: '보증 조건' },
      { categoryKey: 'ip_rights', categoryName: '지적재산권' },
      { categoryKey: 'confidentiality', categoryName: '기밀유지' },
      { categoryKey: 'liability', categoryName: '책임한계' },
      { categoryKey: 'termination', categoryName: '계약해지' },
      { categoryKey: 'dispute', categoryName: '분쟁해결' },
      { categoryKey: 'other', categoryName: '기타' }
    ];
  }
}

/**
 * 템플릿 업로드 (원본 조항 분석 로직 유지)
 */
async function uploadTemplate({ name, category, content, countryCode, language, legalSystem, aiVerification, clauseCategories, token }) {
  try {
    const response = await axios.post(`${CONFIG.baseUrl}/api/admin/templates`, {
      name,
      category,
      content,
      description: `${name} - AI 자동 분류 완료`,
      countryCode, // ✅ 국가 코드 전달
      language,
      legalSystem,
      tags: [countryCode, language, legalSystem, 'ai-classified'],
      aiVerification: {
        method: 'optimized_analysis',
        detectedCountry: aiVerification.detectedCountry,
        countryMatch: aiVerification.detectedCountry === countryCode,
        countryConfidence: aiVerification.countryConfidence,
        categoryConfidence: aiVerification.categoryConfidence,
        aiCost: aiVerification.cost
      },
      // 조항 분석 활성화 (서버에서 AI로 처리)
      enableClauseAnalysis: true,
      clauseCategories: clauseCategories, // DB에서 조회한 카테고리
      // 80% 기준 유지 (원본 로직)
      clauseConfidenceThreshold: 0.8
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      success: true,
      extractedClauses: response.data.extractedClauses || 0,
      analysis: response.data.analysis,
      message: response.data.message
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}

/**
 * 기존 템플릿 이름 조회 (파일명 기반 중복 체크)
 */
async function getExistingTemplateNames(token, countryCode) {
  try {
    const response = await axios.get(`${CONFIG.baseUrl}/api/admin/templates`, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { limit: 1000, countryCode }
    });
    
    return response.data.templates.map(t => {
      const match = t.name.match(/^(.+?)\s*\(/);
      return match ? match[1].trim() : t.name;
    });
  } catch (error) {
    console.warn(`      ⚠️ 기존 템플릿 조회 실패: ${error.message}`);
    return [];
  }
}

/**
 * 완료된 파일 이동
 */
async function moveToProcessed(filePath, countryCode, fileName) {
  try {
    const processedDir = path.join(CONFIG.processedDir, `contract_templates_${countryCode}`);
    
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    
    const targetPath = path.join(processedDir, fileName);
    fs.renameSync(filePath, targetPath);
    
    console.log(`      📦 완료파일 이동: processed/${countryCode}/`);
  } catch (error) {
    console.warn(`      ⚠️ 파일 이동 실패: ${error.message}`);
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
  console.log('🌍 최적화된 다국가 계약서 자동 분류 시스템');
  console.log('사용법: node scripts/bulkUploadTemplates.js --token=TOKEN [옵션]');
  console.log('');
  console.log('옵션:');
  console.log('  --token=TOKEN    인증 토큰 (필수)');
  console.log('  --batch, -b      배치 모드');
  console.log('  --help, -h       도움말');
  console.log('');
  console.log('📂 폴더 구조:');
  console.log('  ./templates/contract_templates_kr/  🇰🇷 한국');
  console.log('  ./templates/contract_templates_us/  🇺🇸 미국');
  console.log('  ... (30개국 지원)');
  console.log('');
  console.log('🚀 최적화 기능:');
  console.log('  • AI 실행 전 중복 완전 제거 (비용 절약)');
  console.log('  • 국가 판별 + 계약 카테고리만 AI 분석');
  console.log('  • 조항 카테고리는 DB 기반 동적 조회');
  console.log('  • 조항 분석은 서버에서 AI로 처리');
  console.log('  • 80% 기준 성공/실패 분류 (원본 로직 유지)');
  console.log('  • 완료 파일 자동 이동');
  console.log('');
  console.log('📋 처리 순서:');
  console.log('  1. 파일명으로 기존 템플릿 배제 (AI 미사용)');
  console.log('  2. 첫 500자로 국가 판별 (AI)');
  console.log('  3. 파일명으로 계약 카테고리 분류 (AI)');
  console.log('  4. 조항 분석은 서버에서 처리 (AI + 80% 기준)');
}

/**
 * 진행 확인
 */
async function confirmProceed() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question('계속 진행하시겠습니까? (y/N): ', resolve);
  });
  
  rl.close();
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

/**
 * 최종 결과 출력
 */
function showFinalResults(stats) {
  console.log('\n🎉 다국가 계약서 업로드 완료!');
  console.log('==========================================');
  console.log(`📊 전체 통계:`);
  console.log(`   📄 총 파일: ${stats.files}개`);
  console.log(`   ✅ 성공: ${stats.success}개`);
  console.log(`   ❌ 실패: ${stats.fails}개`);
  console.log(`   ⏭️ 스킵: ${stats.skipped}개 (중복)`);
  console.log(`   ⚠️ 국가 불일치: ${stats.mismatches}개`);
  console.log(`   🔍 총 조항: ${stats.clauses.toLocaleString()}개`);
  console.log(`   💰 총 AI 비용: ${stats.cost.toFixed(6)}`);
  console.log(`   📈 성공률: ${stats.files > 0 ? Math.round((stats.success / stats.files) * 100) : 0}%`);
  
  if (stats.mismatches > 0) {
    console.log('\n⚠️ 국가 불일치 파일들을 검토해주세요!');
  }
  
  if (stats.clauses > 0) {
    console.log('\n🔍 조항 검토 안내:');
    console.log('1. http://localhost:3100/admin/clauses 접속');
    console.log('2. 검토 대기 조항들 승인/거부 처리');
    console.log(`3. 예상 검토 대기: ~${Math.round(stats.clauses * 0.3)}개`);
    console.log('4. 80% 미만 신뢰도 조항 우선 검토 권장');
  }
}

/**
 * AI 비용 계산 (최적화 반영)
 */
function calculateAICost(fileCount) {
  const avgInputTokens = 250; // 최적화로 대폭 감소
  const avgOutputTokens = 40;
  
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
  
  if (!args.token) {
    console.error('❌ 토큰이 필요합니다.');
    showUsage();
    process.exit(1);
  }
  
  main().catch(error => {
    console.error('❌ 스크립트 실행 오류:', error);
    process.exit(1);
  });
}