// lib/contractClauseAnalyzer.js - 하이브리드 카테고리 기반 조항 분석 시스템

import { 
    getActiveCategories, 
    mapCategoryWithFallback, 
    incrementCategoryUsage 
  } from './categoryManager.js';
  
  /**
   * 계약서 조항 분석 메인 함수
   */
  export async function analyzeContractClauses(contractText, metadata = {}) {
    try {
      console.log('🔍 계약서 조항 분석 시작...');
      
      // 1단계: 활성 카테고리 시스템 로드
      const activeCategories = await getActiveCategories();
      console.log(`📂 활성 카테고리 ${activeCategories.length}개 로드`);
      
      // 2단계: 계약서 구조적 분해
      const structuredClauses = await extractStructuredClauses(contractText);
      console.log(`📋 구조적 분해 완료: ${structuredClauses.length}개 조항 추출`);
      
      // 3단계: 하이브리드 조항 분류 (기존 카테고리 우선, GPT 확장)
      const categorizedClauses = await categorizeClausesWithHybrid(structuredClauses, activeCategories, metadata);
      console.log(`🏷️ 하이브리드 분류 완료: ${categorizedClauses.length}개 조항 분류`);
      
      // 4단계: 조항 품질 및 중요도 분석
      const analyzedClauses = await enhanceClausesWithAnalysis(categorizedClauses, metadata);
      console.log(`⚡ 조항 분석 완료: ${analyzedClauses.length}개 조항 강화`);
      
      // 5단계: 중복 제거 및 최종 정리
      const finalClauses = await deduplicateAndFinalize(analyzedClauses);
      console.log(`✅ 최종 정리 완료: ${finalClauses.length}개 고유 조항`);
      
      return {
        success: true,
        clauses: finalClauses,
        statistics: generateClauseStatistics(finalClauses),
        metadata: {
          ...metadata,
          analyzedAt: new Date(),
          originalLength: contractText.length,
          extractedClauses: finalClauses.length,
          categoriesUsed: [...new Set(finalClauses.map(c => c.category))]
        }
      };
      
    } catch (error) {
      console.error('❌ 조항 분석 오류:', error);
      return {
        success: false,
        error: error.message,
        clauses: []
      };
    }
  }
  
  /**
   * 1단계: 계약서를 구조적으로 분해 ("제N조" 패턴 전용)
   */
  async function extractStructuredClauses(contractText) {
    const clauses = [];
    
    // 텍스트 정규화
    const normalizedText = contractText
      .replace(/\r\n/g, '\n')
      .replace(/\n+/g, '\n')
      .trim();
    
    console.log(`📏 정규화 후 길이: ${normalizedText.length}자`);
    
    // "제N조" 패턴만 사용 (95% 케이스 커버)
    const articlePattern = /제\s*(\d+)\s*조\s*(?:【([^】]+)】|\(([^)]+)\)|［([^］]+)］|\s+([^\n]+))?\s*\n([\s\S]*?)(?=제\s*\d+\s*조|$)/g;
    
    const matches = [...normalizedText.matchAll(articlePattern)];
    console.log(`🔍 제N조 패턴: ${matches.length}개 매치`);
    
    if (matches.length >= 8) {
      console.log(`✅ 제N조 패턴으로 ${matches.length}개 조항 추출`);
      
      matches.forEach((match, index) => {
        const articleNumber = parseInt(match[1]);
        const title = match[2] || match[3] || match[4] || match[5] || `제${articleNumber}조`;
        const content = match[6] ? match[6].trim() : '';
        
        // 내용 길이 확인 (최소 10자)
        if (content && content.length > 10) {
          clauses.push({
            id: `article_${articleNumber}`,
            articleNumber,
            title: cleanTitle(title),
            content: content,
            originalOrder: articleNumber,
            extractionMethod: 'article_pattern'
          });
        }
      });
    } else {
      // 제목 없는 "제N조" 패턴으로 재시도
      console.log('🔄 제목 없는 패턴 재시도...');
      
      const simplePattern = /제\s*(\d+)\s*조[^\n]*\n([\s\S]*?)(?=제\s*\d+\s*조|$)/g;
      const simpleMatches = [...normalizedText.matchAll(simplePattern)];
      
      console.log(`🔍 단순 제N조 패턴: ${simpleMatches.length}개 매치`);
      
      simpleMatches.forEach((match, index) => {
        const articleNumber = parseInt(match[1]);
        const fullMatch = match[0];
        const content = match[2] ? match[2].trim() : '';
        
        // 첫 번째 줄에서 제목 추출
        const firstLine = fullMatch.split('\n')[0];
        const titleMatch = firstLine.match(/제\s*\d+\s*조\s*(.+)/);
        const title = titleMatch ? titleMatch[1].trim() : `제${articleNumber}조`;
        
        if (content && content.length > 10) {
          clauses.push({
            id: `simple_article_${articleNumber}`,
            articleNumber,
            title: cleanTitle(title),
            content: content,
            originalOrder: articleNumber,
            extractionMethod: 'simple_pattern'
          });
        }
      });
    }
    
    // 조항 번호순 정렬 및 정리
    clauses.sort((a, b) => a.articleNumber - b.articleNumber);
    
    // 중복 제거 (같은 조 번호)
    const uniqueClauses = [];
    const seenNumbers = new Set();
    
    clauses.forEach(clause => {
      if (!seenNumbers.has(clause.articleNumber)) {
        seenNumbers.add(clause.articleNumber);
        uniqueClauses.push(clause);
      }
    });
    
    console.log(`📊 최종 추출된 조항 수: ${uniqueClauses.length}개`);
    
    // 추출 결과 로깅
    if (uniqueClauses.length > 0) {
      console.log('📋 추출된 조항 목록:');
      uniqueClauses.slice(0, 5).forEach(clause => {
        console.log(`  ${clause.articleNumber}. ${clause.title} (${clause.content.length}자)`);
      });
      if (uniqueClauses.length > 5) {
        console.log(`  ... 외 ${uniqueClauses.length - 5}개`);
      }
    }
    
    return uniqueClauses;
  }
  
  /**
   * 유틸리티 함수들
   */
  function extractArticleNumber(line) {
    const matches = line.match(/(?:제\s*)?(\d+)(?:\s*조|\s*\.)?/);
    return matches ? parseInt(matches[1]) : 0;
  }
  
  function extractTitleFromLine(line) {
    // 제목 패턴 추출
    const patterns = [
      /제\s*\d+\s*조\s*(?:【([^】]+)】|\(([^)]+)\)|［([^］]+)］|\s+(.+))/,
      /\d+\s*조\s*(?:【([^】]+)】|\(([^)]+)\)|［([^］]+)］|\s+(.+))/,
      /\d+\.\s*(.+)/
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return match[1] || match[2] || match[3] || match[4] || '';
      }
    }
    
    return line.replace(/^(?:제\s*\d+\s*조|\d+\s*조|\d+\.)/, '').trim();
  }
  
  function cleanTitle(title) {
    if (!title) return '조항';
    
    // 특수문자 제거 및 정리
    let cleaned = title
      .replace(/【|】|\(|\)|［|］/g, '')
      .replace(/^\s*[:：]\s*/, '')
      .trim();
    
    // 제목이 너무 길면 자르기
    if (cleaned.length > 50) {
      cleaned = cleaned.substring(0, 50) + '...';
    }
    
    // 빈 제목 처리
    if (!cleaned || cleaned.length < 2) {
      return '조항';
    }
    
    return cleaned;
  }
  
  /**
   * 하이브리드 조항 분류 (기존 카테고리 우선 + GPT 확장)
   */
  async function categorizeClausesWithHybrid(clauses, activeCategories, metadata) {
    if (clauses.length === 0) return [];
  
    const categorizedClauses = [];
    
    // 배치 단위로 GPT 분류 실행
    const batchSize = 5;
    for (let i = 0; i < clauses.length; i += batchSize) {
      const batch = clauses.slice(i, i + batchSize);
      
      try {
        // GPT에게 기존 카테고리 정보와 함께 분류 요청
        const gptResults = await categorizeBatchWithHybridGPT(batch, activeCategories, metadata);
        
        // 각 GPT 결과를 하이브리드 매핑 처리
        for (let j = 0; j < batch.length; j++) {
          const clause = batch[j];
          const gptResult = gptResults[j];
          
          // 카테고리 매핑 (기존 우선, 없으면 제안)
          const categoryMapping = await mapCategoryWithFallback(
            gptResult.category, 
            {
              templateName: metadata.templateName,
              confidence: gptResult.confidence
            }
          );
          
          // 최종 조항 객체 생성
          const categorizedClause = {
            ...clause,
            category: categoryMapping.categoryName,
            categoryId: categoryMapping.categoryId || categoryMapping.fallbackId,
            confidence: gptResult.confidence,
            gptReasoning: gptResult.reasoning,
            mappingType: categoryMapping.type, // 'existing', 'similar', 'proposed', 'default'
            originalSuggestion: categoryMapping.originalSuggestion
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
            categoryId: 7, // 기본 카테고리 ID
            confidence: 0.3,
            mappingType: 'fallback'
          });
        });
      }
    }
    
    return categorizedClauses;
  }
  
  /**
   * 하이브리드 GPT 배치 분류
   */
  async function categorizeBatchWithHybridGPT(clauseBatch, activeCategories, metadata) {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.warn('⚠️ OPENAI_API_KEY가 설정되지 않음, 기본 분류 사용');
      return clauseBatch.map(() => ({
        category: '기타/일반',
        confidence: 0.5,
        reasoning: 'OpenAI API 키 없음'
      }));
    }
  
    const prompt = generateHybridCategorizationPrompt(clauseBatch, activeCategories, metadata);
    
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
      console.error('하이브리드 GPT 분류 실패:', error);
      return clauseBatch.map(() => ({
        category: '기타/일반',
        confidence: 0.3,
        reasoning: `GPT 오류: ${error.message}`
      }));
    }
  }
  
  /**
   * 하이브리드 GPT 분류 프롬프트 생성
   */
  function generateHybridCategorizationPrompt(clauses, activeCategories, metadata) {
    const categoryList = activeCategories
      .filter(cat => cat.level === 1) // 대분류만
      .map(cat => `- ${cat.name}: ${cat.description || ''}`)
      .join('\n');
  
    return `한국 계약서 전문가로서, 다음 조항들을 정확히 분류해주세요.
  
  **우선 사용할 기존 카테고리:**
  ${categoryList}
  
  **분류 규칙:**
  1. 위 기존 카테고리 중 가장 적합한 것을 우선 선택
  2. 기존 카테고리로 분류하기 어려운 경우에만 새 카테고리 제안
  3. 새 카테고리는 기존 체계와 일관성 유지
  
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
        "reasoning": "분류 근거",
        "isNewCategory": false
      }
    ]
  }`;
  }
  
  /**
   * 하이브리드 GPT 응답 파싱
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
          // 분류 결과가 없는 경우 기본값
          return {
            category: '기타/일반',
            confidence: 0.4,
            reasoning: 'GPT 분류 결과 누락'
          };
        }
      });
      
    } catch (error) {
      console.error('하이브리드 GPT 응답 파싱 실패:', error);
      
      // 파싱 실패 시 기본 분류
      return originalClauses.map(() => ({
        category: '기타/일반',
        confidence: 0.3,
        reasoning: `파싱 오류: ${error.message}`
      }));
    }
  }
  
  /**
   * 3단계: 조항 분석 강화
   */
  async function enhanceClausesWithAnalysis(clauses, metadata) {
    return clauses.map(clause => {
      const riskScore = calculateRiskScore(clause);
      const importance = calculateImportance(clause, riskScore);
      const tags = generateClauseTags(clause, metadata);
      
      return {
        ...clause,
        categoryName: clause.category, // 이미 카테고리명이 들어있음
        analysis: {
          riskScore,
          importance,
          legalComplexity: calculateLegalComplexity(clause),
          industryRelevance: calculateIndustryRelevance(clause, metadata.industry),
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
   * 4단계: 중복 제거 및 최종 정리
   */
  async function deduplicateAndFinalize(clauses) {
    const uniqueClauses = [];
    const processedContent = new Set();
    
    clauses.forEach(clause => {
      // 내용 기반 중복 체크
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
  
  /**
   * 유틸리티 함수들
   */
  function calculateRiskScore(clause) {
    const content = clause.content.toLowerCase();
    const highRiskKeywords = ['손해배상', '책임', '면책', '위반', '해지', '분쟁', '소송'];
    const mediumRiskKeywords = ['변경', '수정', '추가', '기준', '요구사항'];
    
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
    const complexTerms = ['준거법', '관할법원', '중재', '손해배상', '지적재산권', '면책'];
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
      'tech': ['개발', '시스템', '소프트웨어', '기술', '데이터'],
      'design': ['디자인', '창작', '저작권', '브랜드'],
      'service': ['서비스', '운영', '관리', '지원']
    };
    
    const keywords = industryKeywords[industry] || [];
    const content = clause.content.toLowerCase();
    
    let matches = 0;
    keywords.forEach(keyword => {
      if (content.includes(keyword)) matches++;
    });
    
    return Math.min(matches / Math.max(keywords.length, 1), 1.0);
  }
  
  function generateClauseTags(clause, metadata) {
    const tags = [clause.category];
    
    if (metadata.industry) tags.push(`industry_${metadata.industry}`);
    if (clause.analysis?.riskScore >= 7) tags.push('high_risk');
    if (clause.confidence >= 0.9) tags.push('high_confidence');
    
    return tags;
  }
  
  function generateContentHash(content) {
    // 간단한 해시 함수 (실제로는 crypto 모듈 사용 권장)
    return content.replace(/\s+/g, ' ').trim().substring(0, 100);
  }
  
  function generateClauseStatistics(clauses) {
    const stats = {
      total: clauses.length,
      byCategory: {},
      byImportance: {},
      averageConfidence: 0,
      averageRiskScore: 0
    };
    
    clauses.forEach(clause => {
      // 카테고리별
      stats.byCategory[clause.category] = (stats.byCategory[clause.category] || 0) + 1;
      
      // 중요도별
      const importance = clause.analysis?.importance || 'low';
      stats.byImportance[importance] = (stats.byImportance[importance] || 0) + 1;
      
      // 평균 계산
      stats.averageConfidence += clause.confidence || 0;
      stats.averageRiskScore += clause.analysis?.riskScore || 0;
    });
    
    stats.averageConfidence = stats.averageConfidence / clauses.length;
    stats.averageRiskScore = stats.averageRiskScore / clauses.length;
    
    return stats;
  }