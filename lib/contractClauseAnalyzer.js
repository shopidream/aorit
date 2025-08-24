// lib/contractClauseAnalyzer.js - AI 기반 다국어 조항 구분 시스템

import { 
  getActiveCategories, 
  mapCategoryWithFallback, 
  incrementCategoryUsage 
} from './categoryManager.js';

import { 
  getCountryProfile, 
  calculateCountryRisk, 
  validateLegalTerms,
  getCountryClauseCategories 
} from './countryManager.js';

/**
 * 🌍 다국어 계약서 조항 분석 메인 함수 (AI 기반 업그레이드)
 */
export async function analyzeContractClauses(contractText, metadata = {}) {
  const countryCode = metadata.countryCode || 'kr';
  const language = metadata.language || 'ko';
  
  try {
    console.log(`🔍 계약서 조항 분석 시작 (${countryCode.toUpperCase()})...`);
    
    // 1단계: 국가별 프로파일 및 카테고리 로드
    const [countryProfile, activeCategories] = await Promise.all([
      getCountryProfile(countryCode),
      countryCode === 'kr' ? getActiveCategories() : getCountryClauseCategories(countryCode)
    ]);
    
    console.log(`📂 ${countryProfile.countryName} 프로파일 로드`);
    console.log(`📋 활성 카테고리 ${activeCategories.length}개 로드`);
    
    // 2단계: 🚀 AI 기반 다국어 조항 추출 (업그레이드)
    const structuredClauses = await extractStructuredClausesWithAI(contractText, language, countryCode);
    console.log(`📋 ${countryCode === 'kr' ? '하드코딩' : 'AI'} 추출 완료: ${structuredClauses.length}개 조항`);
    
    // 3단계: 국가별 하이브리드 조항 분류
    const categorizedClauses = await categorizeClausesWithCountry(structuredClauses, activeCategories, metadata, countryCode);
    console.log(`🏷️ 국가별 분류 완료: ${categorizedClauses.length}개 조항 분류`);
    
    // 4단계: 국가별 위험도 분석
    const riskAnalysis = await calculateCountryRisk(categorizedClauses, countryCode);
    console.log(`⚠️ 위험도 분석 완료: 전체 위험도 ${riskAnalysis.overallRisk}/10`);
    
    // 5단계: 법적 용어 검증
    const legalValidation = await validateLegalTerms(contractText, countryCode);
    console.log(`📚 법적 용어 검증: ${legalValidation.riskTermsFound.length}개 위험 용어 발견`);
    
    // 6단계: 조항 품질 및 중요도 분석
    const analyzedClauses = await enhanceClausesWithCountryAnalysis(categorizedClauses, riskAnalysis, metadata, countryCode);
    console.log(`⚡ 조항 분석 완료: ${analyzedClauses.length}개 조항 강화`);
    
    // 7단계: 중복 제거 및 최종 정리
    const finalClauses = await deduplicateAndFinalize(analyzedClauses);
    console.log(`✅ 최종 정리 완료: ${finalClauses.length}개 고유 조항`);
    
    return {
      success: true,
      clauses: finalClauses,
      countryAnalysis: {
        profile: countryProfile,
        riskAnalysis,
        legalValidation,
        countrySpecificIssues: riskAnalysis.countrySpecificIssues || [],
        extractionMethod: countryCode === 'kr' ? 'hardcoded_korean' : 'ai_multilingual'
      },
      statistics: generateClauseStatistics(finalClauses, countryCode),
      metadata: {
        ...metadata,
        countryCode,
        language,
        analyzedAt: new Date(),
        originalLength: contractText.length,
        extractedClauses: finalClauses.length,
        categoriesUsed: [...new Set(finalClauses.map(c => c.category))],
        overallRisk: riskAnalysis.overallRisk,
        extractionMethod: countryCode === 'kr' ? 'hardcoded' : 'ai_based'
      }
    };
    
  } catch (error) {
    console.error(`❌ 조항 분석 오류 (${countryCode}):`, error);
    return {
      success: false,
      error: error.message,
      clauses: [],
      countryCode,
      extractionMethod: 'failed'
    };
  }
}

/**
 * 🚀 AI 기반 다국어 조항 추출 (핵심 업그레이드)
 */
async function extractStructuredClausesWithAI(contractText, language = 'ko', countryCode = 'kr') {
  console.log(`📋 조항 추출 시작 (${countryCode.toUpperCase()}) - ${language === 'kr' ? '하드코딩' : 'AI 기반'}`);
  
  // 한국어는 기존 하드코딩 로직 유지 (빠르고 정확함)
  if (countryCode === 'kr' && language === 'ko') {
    return await extractKoreanClausesHardcoded(contractText, language);
  }
  
  // 기타 국가는 AI 기반 추출
  return await extractClausesWithAI(contractText, language, countryCode);
}

/**
 * 🇰🇷 한국어 계약서 하드코딩 추출 (기존 로직 유지)
 */
async function extractKoreanClausesHardcoded(contractText, language) {
  const clauses = [];
  
  // 텍스트 정규화
  const normalizedText = contractText
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, '\n')
    .trim();
  
  console.log(`📏 정규화 후 길이: ${normalizedText.length}자 (언어: ${language})`);
  
  // 한국어 패턴들 (기존 로직)
  const patterns = [
    {
      name: '제N조 패턴',
      regex: /제\s*(\d+)\s*조\s*(?:【([^】]+)】|\(([^)]+)\)|［([^］]+)］|\s+([^\n]+))?\s*\n([\s\S]*?)(?=제\s*\d+\s*조|$)/g
    },
    {
      name: '단순 제N조',
      regex: /제\s*(\d+)\s*조[^\n]*\n([\s\S]*?)(?=제\s*\d+\s*조|$)/g
    }
  ];
  
  let matches = [];
  let usedPattern = null;
  
  for (const pattern of patterns) {
    matches = [...normalizedText.matchAll(pattern.regex)];
    if (matches.length >= 3) {
      console.log(`✅ ${pattern.name} 패턴으로 ${matches.length}개 조항 추출`);
      usedPattern = pattern;
      break;
    }
  }
  
  if (matches.length >= 3) {
    matches.forEach((match, index) => {
      const articleNumber = parseInt(match[1]) || index + 1;
      const title = match[2] || match[3] || match[4] || match[5] || `제${articleNumber}조`;
      const content = match[6] || match[match.length - 1] || '';
      
      if (content && content.trim().length > 10) {
        clauses.push({
          id: `article_${articleNumber}`,
          articleNumber,
          title: cleanTitle(title, language),
          content: content.trim(),
          originalOrder: articleNumber,
          extractionMethod: usedPattern.name,
          language,
          countryCode: 'kr'
        });
      }
    });
  } else {
    // 패턴 매칭 실패 시 단락별 분할 (한국어)
    console.log('🔄 한국어 패턴 실패, 단락별 분할...');
    const paragraphs = normalizedText.split('\n').filter(p => p.trim().length > 20);
    
    paragraphs.forEach((paragraph, index) => {
      clauses.push({
        id: `paragraph_${index + 1}`,
        articleNumber: index + 1,
        title: `제${index + 1}조`,
        content: paragraph.trim(),
        originalOrder: index + 1,
        extractionMethod: 'korean_paragraph_split',
        language,
        countryCode: 'kr'
      });
    });
  }
  
  // 정렬 및 중복 제거
  clauses.sort((a, b) => a.articleNumber - b.articleNumber);
  const uniqueClauses = removeDuplicatesByNumber(clauses);
  
  console.log(`📊 한국어 최종 추출: ${uniqueClauses.length}개`);
  return uniqueClauses;
}

/**
 * 🌍 AI 기반 다국어 조항 추출 (신규)
 */
async function extractClausesWithAI(contractText, language, countryCode) {
  try {
    console.log(`🤖 AI 조항 추출 시작 (${countryCode.toUpperCase()})...`);
    
    const countryInfo = getCountryExtractionInfo(countryCode);
    
    // 긴 계약서는 청크 단위로 처리
    if (contractText.length > 4000) {
      return await extractLongContractWithAI(contractText, countryInfo, language, countryCode);
    } else {
      return await extractShortContractWithAI(contractText, countryInfo, language, countryCode);
    }
    
  } catch (error) {
    console.error(`❌ AI 조항 추출 실패 (${countryCode}):`, error);
    // 폴백: 단락별 분할
    return fallbackParagraphSplit(contractText, language, countryCode);
  }
}

/**
 * 짧은 계약서 AI 추출 (4000자 이하)
 */
async function extractShortContractWithAI(contractText, countryInfo, language, countryCode) {
  const prompt = generateClauseExtractionPrompt(contractText, countryInfo, language, countryCode);
  
  console.log(`   🔄 AI 조항 추출 중... (${contractText.length}자)`);
  
  const response = await callOpenAIForClauseExtraction(prompt);
  const clauses = parseAIClauseResponse(response, language, countryCode);
  
  console.log(`   ✅ AI 추출 완료: ${clauses.length}개 조항`);
  return clauses;
}

/**
 * 긴 계약서 청크 기반 AI 추출 (4000자 초과)
 */
async function extractLongContractWithAI(contractText, countryInfo, language, countryCode) {
  console.log(`   📄 긴 계약서 감지: ${contractText.length}자, 청크 처리 시작...`);
  
  const chunks = splitTextIntoChunks(contractText, 3500);
  let allClauses = [];
  
  console.log(`   📦 ${chunks.length}개 청크로 분할`);
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`   🔄 청크 ${i + 1}/${chunks.length} 처리 중...`);
    
    try {
      const prompt = generateClauseExtractionPrompt(chunks[i], countryInfo, language, countryCode, i + 1);
      const response = await callOpenAIForClauseExtraction(prompt);
      const chunkClauses = parseAIClauseResponse(response, language, countryCode, i + 1);
      
      allClauses = allClauses.concat(chunkClauses);
      console.log(`   ✅ 청크 ${i + 1}: ${chunkClauses.length}개 조항`);
      
      // API 제한 고려 (1초 대기)
      if (i < chunks.length - 1) {
        await sleep(1000);
      }
      
    } catch (error) {
      console.error(`   ❌ 청크 ${i + 1} 처리 실패:`, error);
      // 청크 실패 시 단락 분할로 처리
      const fallbackClauses = fallbackParagraphSplit(chunks[i], language, countryCode, i);
      allClauses = allClauses.concat(fallbackClauses);
    }
  }
  
  // 청크 결과 통합 및 정리
  const mergedClauses = mergeChunkClauses(allClauses);
  console.log(`   🔗 청크 통합 완료: ${mergedClauses.length}개 조항`);
  
  return mergedClauses;
}

/**
 * 국가별 조항 추출 정보
 */
function getCountryExtractionInfo(countryCode) {
  const countryInfo = {
    kr: {
      name: 'South Korea',
      patterns: ['제N조', '제N항', '별첨'],
      legalSystem: '한국 민법 및 상법',
      example: '제1조, 제2조, 제1항'
    },
    us: {
      name: 'United States', 
      patterns: ['Section X', 'Article X', 'X.X', 'RECITALS', 'WHEREAS', 'EXHIBIT'],
      legalSystem: 'US federal and state law',
      example: 'Section 1, 1.1, Article I, RECITALS'
    },
    uk: {
      name: 'United Kingdom',
      patterns: ['Clause X', 'Schedule X', 'X.X', 'RECITALS'],
      legalSystem: 'English law and GDPR',
      example: 'Clause 1, 1.1, Schedule A'
    },
    de: {
      name: 'Germany',
      patterns: ['§ X', 'Artikel X', 'Absatz X'],
      legalSystem: 'German civil law (BGB)',
      example: '§ 1, Artikel 2, Absatz 3'
    },
    fr: {
      name: 'France',
      patterns: ['Article X', 'X.X', 'Annexe X'],
      legalSystem: 'French civil law (Code civil)',
      example: 'Article 1, 1.1, Annexe A'
    },
    jp: {
      name: 'Japan',
      patterns: ['第N条', '第N項', '別紙'],
      legalSystem: '日本民法及び商法',
      example: '第1条, 第2条, 第1項'
    },
    sg: {
      name: 'Singapore',
      patterns: ['Clause X', 'Section X', 'X.X', 'Schedule X'],
      legalSystem: 'Singapore law and common law',
      example: 'Clause 1, Section 2, Schedule A'
    }
  };
  
  return countryInfo[countryCode] || countryInfo.us;
}

/**
 * AI 조항 추출 프롬프트 생성
 */
function generateClauseExtractionPrompt(contractText, countryInfo, language, countryCode, chunkNumber = null) {
  const chunkInfo = chunkNumber ? ` (Part ${chunkNumber})` : '';
  
  return `You are a ${countryInfo.name} contract law expert. Extract ALL clauses from this ${countryInfo.name} contract${chunkInfo}.

Legal System: ${countryInfo.legalSystem}
Common Patterns: ${countryInfo.patterns.join(', ')}
Example Format: ${countryInfo.example}

Contract Text:
${contractText}

IMPORTANT RULES:
1. Extract ALL sections, subsections, articles, clauses, exhibits, recitals
2. Include original numbering (1, 1.1, 4.2, Section 5, Article I, etc.)  
3. Preserve exact titles and headings
4. Include substantial content (>20 characters)
5. Handle ${countryCode.toUpperCase()} legal document structure
6. Don't skip RECITALS, WHEREAS, EXHIBITS, SCHEDULES
7. Extract meaningful clause titles from content if no heading

Return ONLY valid JSON array:
[
  {
    "title": "Services",
    "content": "Provider agrees to provide the Services...",
    "section": "1", 
    "subsection": null,
    "originalFormat": "1. Services"
  },
  {
    "title": "Provision of Services", 
    "content": "Provider shall...",
    "section": "1",
    "subsection": "1.1",
    "originalFormat": "1.1 Provision of Services"
  },
  {
    "title": "Termination",
    "content": "This Agreement can be terminated...",
    "section": "5",
    "subsection": null,
    "originalFormat": "5. TERMINATION"
  }
]`;
}

/**
 * OpenAI API 호출 (조항 추출)
 */
async function callOpenAIForClauseExtraction(prompt) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OpenAI API 키가 설정되지 않음');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 3000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API 오류: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content;
}

/**
 * AI 응답 파싱
 */
function parseAIClauseResponse(response, language, countryCode, chunkNumber = null) {
  try {
    // JSON 추출
    let jsonStr = response;
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }
    
    const parsed = JSON.parse(jsonStr);
    const clauses = [];
    
    if (Array.isArray(parsed)) {
      parsed.forEach((item, index) => {
        if (item.title && item.content && item.content.length > 10) {
          clauses.push({
            id: `${countryCode}_clause_${chunkNumber || 1}_${index + 1}`,
            articleNumber: extractArticleNumber(item.section, item.subsection) || index + 1,
            title: cleanTitle(item.title, language),
            content: item.content.trim(),
            section: item.section || null,
            subsection: item.subsection || null,
            originalFormat: item.originalFormat || item.title,
            originalOrder: index + 1,
            extractionMethod: 'ai_multilingual',
            language,
            countryCode,
            chunkNumber: chunkNumber || null
          });
        }
      });
    }
    
    return clauses;
    
  } catch (error) {
    console.error(`AI 응답 파싱 실패 (${countryCode}):`, error);
    console.log('원본 응답:', response.substring(0, 200) + '...');
    return [];
  }
}

/**
 * 텍스트 청크 분할
 */
function splitTextIntoChunks(text, maxLength = 3500) {
  const chunks = [];
  let currentChunk = '';
  const paragraphs = text.split('\n');
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += '\n' + paragraph;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * 청크 조항 통합
 */
function mergeChunkClauses(allClauses) {
  // 섹션 번호 기준으로 정렬
  allClauses.sort((a, b) => {
    if (a.section !== b.section) {
      return parseFloat(a.section || 999) - parseFloat(b.section || 999);
    }
    return parseFloat(a.subsection || 0) - parseFloat(b.subsection || 0);
  });
  
  // 중복 제거 (제목과 내용 기준)
  const uniqueClauses = [];
  const seenTitles = new Set();
  
  allClauses.forEach(clause => {
    const key = `${clause.title}_${clause.section}_${clause.subsection}`;
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      // ID 재생성
      clause.id = `merged_clause_${uniqueClauses.length + 1}`;
      clause.chunkNumber = null; // 통합 후 제거
      uniqueClauses.push(clause);
    }
  });
  
  return uniqueClauses;
}

/**
 * 폴백: 단락별 분할
 */
function fallbackParagraphSplit(contractText, language, countryCode, chunkNumber = null) {
  console.log(`🔄 폴백 실행: 단락별 분할 (${countryCode})`);
  
  const paragraphs = contractText
    .split('\n')
    .filter(p => p.trim().length > 20)
    .slice(0, 20); // 최대 20개 단락
  
  return paragraphs.map((paragraph, index) => ({
    id: `fallback_${countryCode}_${chunkNumber || 1}_${index + 1}`,
    articleNumber: index + 1,
    title: generateFallbackTitle(paragraph, language),
    content: paragraph.trim(),
    originalOrder: index + 1,
    extractionMethod: 'fallback_paragraph',
    language,
    countryCode,
    chunkNumber
  }));
}

/**
 * 유틸리티 함수들
 */
function extractArticleNumber(section, subsection) {
  if (subsection) return parseFloat(`${section}.${subsection}`);
  if (section) return parseFloat(section);
  return null;
}

function cleanTitle(title, language = 'ko') {
  if (!title) return language === 'ko' ? '조항' : 'Clause';
  
  let cleaned = title
    .replace(/【|】|\(|\)|［|］|\[|\]/g, '')
    .replace(/^\s*[:：]\s*/, '')
    .trim();
  
  if (cleaned.length > 60) {
    cleaned = cleaned.substring(0, 60) + '...';
  }
  
  if (!cleaned || cleaned.length < 2) {
    return language === 'ko' ? '조항' : 'Clause';
  }
  
  return cleaned;
}

function generateFallbackTitle(paragraph, language) {
  const firstLine = paragraph.split('\n')[0].trim();
  if (firstLine.length > 5 && firstLine.length < 100) {
    return cleanTitle(firstLine, language);
  }
  return language === 'ko' ? '조항' : 'Clause';
}

function removeDuplicatesByNumber(clauses) {
  const uniqueClauses = [];
  const seenNumbers = new Set();
  
  clauses.forEach(clause => {
    if (!seenNumbers.has(clause.articleNumber)) {
      seenNumbers.add(clause.articleNumber);
      uniqueClauses.push(clause);
    }
  });
  
  return uniqueClauses;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 통계 생성 (국가별 정보 추가)
 */
function generateClauseStatistics(clauses, countryCode) {
  const stats = {
    total: clauses.length,
    countryCode,
    extractionMethod: clauses[0]?.extractionMethod || 'unknown',
    byCategory: {},
    byImportance: {},
    averageConfidence: 0,
    averageRiskScore: 0,
    byExtractionMethod: {}
  };
  
  clauses.forEach(clause => {
    stats.byCategory[clause.category] = (stats.byCategory[clause.category] || 0) + 1;
    
    const importance = clause.analysis?.importance || 'low';
    stats.byImportance[importance] = (stats.byImportance[importance] || 0) + 1;
    
    const method = clause.extractionMethod || 'unknown';
    stats.byExtractionMethod[method] = (stats.byExtractionMethod[method] || 0) + 1;
    
    stats.averageConfidence += clause.confidence || 0;
    stats.averageRiskScore += clause.analysis?.riskScore || 0;
  });
  
  stats.averageConfidence = stats.averageConfidence / clauses.length;
  stats.averageRiskScore = stats.averageRiskScore / clauses.length;
  
  return stats;
}

// 기존 함수들 유지 (categorizeClausesWithCountry, enhanceClausesWithCountryAnalysis 등)
// ... [기존 코드 생략 - 변경사항 없음]

/**
 * 국가별 하이브리드 조항 분류 (기존 유지)
 */
async function categorizeClausesWithCountry(clauses, activeCategories, metadata, countryCode) {
  if (clauses.length === 0) return [];

  const categorizedClauses = [];
  
  // 배치 단위로 GPT 분류 실행
  const batchSize = 5;
  for (let i = 0; i < clauses.length; i += batchSize) {
    const batch = clauses.slice(i, i + batchSize);
    
    try {
      // 국가별 GPT 분류
      const gptResults = await categorizeBatchWithCountryGPT(batch, activeCategories, metadata, countryCode);
      
      // 각 GPT 결과를 하이브리드 매핑 처리
      for (let j = 0; j < batch.length; j++) {
        const clause = batch[j];
        const gptResult = gptResults[j];
        
        // 카테고리 매핑 (기존 우선, 없으면 제안)
        const categoryMapping = await mapCategoryWithFallback(
          gptResult.category, 
          {
            templateName: metadata.templateName,
            confidence: gptResult.confidence,
            countryCode
          }
        );
        
        // 최종 조항 객체 생성
        const categorizedClause = {
          ...clause,
          category: categoryMapping.categoryName,
          categoryId: categoryMapping.categoryId || categoryMapping.fallbackId,
          confidence: gptResult.confidence,
          gptReasoning: gptResult.reasoning,
          mappingType: categoryMapping.type,
          originalSuggestion: categoryMapping.originalSuggestion,
          countryCode
        };
        
        // 카테고리 사용 횟수 증가
        if (categoryMapping.categoryId) {
          await incrementCategoryUsage(categoryMapping.categoryId);
        }
        
        categorizedClauses.push(categorizedClause);
      }
      
      // API 제한을 위한 대기
      if (i + batchSize < clauses.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ 배치 ${Math.floor(i/batchSize) + 1} 분류 실패:`, error);
      
      // 실패한 경우 기본 카테고리로 처리
      batch.forEach(clause => {
        categorizedClauses.push({
          ...clause,
          category: '기타/일반',
          categoryId: 7,
          confidence: 0.3,
          mappingType: 'fallback',
          countryCode
        });
      });
    }
  }
  
  return categorizedClauses;
}

/**
 * 국가별 GPT 배치 분류 (기존 유지)
 */
async function categorizeBatchWithCountryGPT(clauseBatch, activeCategories, metadata, countryCode) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.warn('⚠️ OPENAI_API_KEY가 설정되지 않음, 기본 분류 사용');
    return clauseBatch.map(() => ({
      category: '기타/일반',
      confidence: 0.5,
      reasoning: 'OpenAI API 키 없음'
    }));
  }

  const prompt = generateCountrySpecificPrompt(clauseBatch, activeCategories, metadata, countryCode);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`GPT API 오류: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('GPT로부터 응답을 받지 못했습니다');
    }

    return parseHybridGPTResponse(content, clauseBatch);
    
  } catch (error) {
    console.error('국가별 GPT 분류 실패:', error);
    return clauseBatch.map(() => ({
      category: '기타/일반',
      confidence: 0.3,
      reasoning: `GPT 오류: ${error.message}`
    }));
  }
}

/**
 * 국가별 GPT 분류 프롬프트 생성 (기존 유지)
 */
function generateCountrySpecificPrompt(clauses, activeCategories, metadata, countryCode) {
  const countryPrompts = {
    kr: {
      expert: '한국 계약서 전문가로서',
      instruction: '한국 법률에 따라 다음 조항들을 정확히 분류해주세요.'
    },
    us: {
      expert: 'As a US contract law expert',
      instruction: 'analyze and categorize the following clauses according to US federal and state law requirements.'
    },
    uk: {
      expert: 'As a UK contract law expert',
      instruction: 'analyze and categorize the following clauses according to English law and GDPR requirements.'
    },
    de: {
      expert: 'Als deutscher Vertragsrechtsexperte',
      instruction: 'analysieren und kategorisieren Sie die folgenden Klauseln nach deutschem Recht und DSGVO-Anforderungen.'
    },
    jp: {
      expert: '日本の契約法専門家として',
      instruction: '日本の民法および商法に従って、以下の条項を正確に分類してください。'
    },
    ae: {
      expert: 'As a UAE contract law expert',
      instruction: 'analyze and categorize the following clauses according to UAE Civil Code and Sharia principles.'
    }
  };

  const prompt = countryPrompts[countryCode] || countryPrompts.us;
  
  const categoryList = activeCategories
    .filter(cat => cat.level === 1)
    .map(cat => `- ${cat.name}: ${cat.description || ''}`)
    .join('\n');

  return `${prompt.expert}, ${prompt.instruction}

**우선 사용할 기존 카테고리:**
${categoryList}

**분류 규칙:**
1. 위 기존 카테고리 중 가장 적합한 것을 우선 선택
2. ${countryCode.toUpperCase()} 법적 특성을 고려하여 분류
3. 기존 카테고리로 분류하기 어려운 경우에만 새 카테고리 제안

**업종 정보:** ${metadata.industry || '일반'}
**계약 유형:** ${metadata.category || '일반'}

**분류할 조항들:**
${clauses.map((clause, index) => `
${index + 1}. 제목: ${clause.title}
내용: ${clause.content.substring(0, 200)}...
`).join('\n')}

**응답 형식 (JSON만):**
{
"classifications": [
  {
    "index": 1,
    "category": "기존_카테고리명_또는_새_제안",
    "confidence": 0.9,
    "reasoning": "${countryCode.toUpperCase()} 법률 기준 분류 근거",
    "isNewCategory": false
  }
]
}`;
}

/**
 * 하이브리드 GPT 응답 파싱 (기존 유지)
 */
function parseHybridGPTResponse(content, originalClauses) {
  try {
    // JSON 추출
    let jsonStr = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    const classifications = parsed.classifications || [];
    
    return originalClauses.map((clause, index) => {
      const classification = classifications.find(c => c.index === index + 1);
      
      if (classification) {
        return {
          category: classification.category,
          confidence: Math.min(Math.max(classification.confidence || 0.7, 0), 1),
          reasoning: classification.reasoning,
          isNewCategory: classification.isNewCategory || false
        };
      } else {
        return {
          category: '기타/일반',
          confidence: 0.4,
          reasoning: 'GPT 분류 결과 누락'
        };
      }
    });
    
  } catch (error) {
    console.error('하이브리드 GPT 응답 파싱 실패:', error);
    
    return originalClauses.map(() => ({
      category: '기타/일반',
      confidence: 0.3,
      reasoning: `파싱 오류: ${error.message}`
    }));
  }
}

/**
 * 국가별 조항 분석 강화 (기존 유지)
 */
async function enhanceClausesWithCountryAnalysis(clauses, riskAnalysis, metadata, countryCode) {
  return clauses.map((clause, index) => {
    const clauseRisk = riskAnalysis.clauseRisks?.find(r => r.clauseId === clause.id) || {};
    const riskScore = clauseRisk.baseRisk || calculateRiskScore(clause);
    const importance = calculateImportance(clause, riskScore);
    const tags = generateCountryTags(clause, metadata, countryCode);
    
    return {
      ...clause,
      categoryName: clause.category,
      analysis: {
        riskScore,
        weightedRisk: clauseRisk.weightedRisk || riskScore,
        riskWeight: clauseRisk.weight || 0.5,
        importance,
        legalComplexity: calculateLegalComplexity(clause),
        industryRelevance: calculateIndustryRelevance(clause, metadata.industry),
        countryRecommendations: clauseRisk.recommendations || [],
        mappingInfo: {
          type: clause.mappingType,
          originalSuggestion: clause.originalSuggestion
        }
      },
      tags,
      extractedAt: new Date()
    };
  });
}

/**
 * 유틸리티 함수들 (기존 유지)
 */
function calculateRiskScore(clause) {
  const content = clause.content.toLowerCase();
  const highRiskKeywords = ['손해배상', '책임', '면책', '위반', '해지', '분쟁', '소송',
                            'liability', 'damages', 'termination', 'breach', 'dispute', 'lawsuit'];
  const mediumRiskKeywords = ['변경', '수정', '추가', '기준', '요구사항',
                              'modification', 'amendment', 'requirements', 'standards'];
  
  let score = 0;
  highRiskKeywords.forEach(keyword => {
    if (content.includes(keyword)) score += 3;
  });
  mediumRiskKeywords.forEach(keyword => {
    if (content.includes(keyword)) score += 1;
  });
  
  return Math.min(score, 10);
}

function calculateImportance(clause, riskScore) {
  if (riskScore >= 7 || clause.confidence >= 0.9) return 'high';
  if (riskScore >= 4 || clause.confidence >= 0.7) return 'medium';
  return 'low';
}

function calculateLegalComplexity(clause) {
  const complexTerms = ['준거법', '관할법원', '중재', '손해배상', '지적재산권', '면책',
                        'governing law', 'jurisdiction', 'arbitration', 'liability', 'intellectual property'];
  const content = clause.content.toLowerCase();
  
  let complexity = 0;
  complexTerms.forEach(term => {
    if (content.includes(term)) complexity++;
  });
  
  if (clause.content.length > 300) complexity++;
  
  return Math.min(complexity, 5);
}

function calculateIndustryRelevance(clause, industry) {
  if (!industry) return 0.5;
  
  const industryKeywords = {
    'tech': ['개발', '시스템', '소프트웨어', '기술', '데이터', 'development', 'software', 'technology', 'data'],
    'design': ['디자인', '창작', '저작권', '브랜드', 'design', 'creative', 'copyright', 'brand'],
    'service': ['서비스', '운영', '관리', '지원', 'service', 'operation', 'management', 'support']
  };
  
  const keywords = industryKeywords[industry] || [];
  const content = clause.content.toLowerCase();
  
  let matches = 0;
  keywords.forEach(keyword => {
    if (content.includes(keyword)) matches++;
  });
  
  return Math.min(matches / Math.max(keywords.length, 1), 1.0);
}

function generateCountryTags(clause, metadata, countryCode) {
  const tags = [clause.category, `country_${countryCode}`];
  
  if (metadata.industry) tags.push(`industry_${metadata.industry}`);
  if (clause.analysis?.riskScore >= 7) tags.push('high_risk');
  if (clause.confidence >= 0.9) tags.push('high_confidence');
  if (clause.language && clause.language !== 'ko') tags.push(`lang_${clause.language}`);
  if (clause.extractionMethod) tags.push(`extraction_${clause.extractionMethod}`);
  
  return tags;
}

function generateContentHash(content) {
  return content.replace(/\s+/g, ' ').trim().substring(0, 100);
}

/**
 * 중복 제거 및 최종 정리 (기존 유지)
 */
async function deduplicateAndFinalize(clauses) {
  const uniqueClauses = [];
  const processedContent = new Set();
  
  clauses.forEach(clause => {
    const contentHash = generateContentHash(clause.content);
    
    if (!processedContent.has(contentHash)) {
      processedContent.add(contentHash);
      uniqueClauses.push({
        ...clause,
        id: `clause_${uniqueClauses.length + 1}`,
        finalOrder: uniqueClauses.length + 1
      });
    }
  });
  
  return uniqueClauses;
}