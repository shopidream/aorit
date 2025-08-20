// lib/contractAnalyzer.js - AI 조항 분석 시스템
import { CLAUSE_CATEGORIES } from './clauseDatabase.js';

// OpenAI API 호출
async function callOpenAI(prompt, maxTokens = 2000) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다');
  }
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.1
    })
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API 오류: ${response.status}`);
  }
  
  const result = await response.json();
  return result.choices[0]?.message?.content;
}

// 조항 카테고리 분류
export async function categorizeClause(clauseTitle, clauseContent) {
  const prompt = `다음 계약서 조항을 분석하여 카테고리를 분류해주세요.

조항 제목: ${clauseTitle}
조항 내용: ${clauseContent.substring(0, 300)}...

가능한 카테고리:
${Object.entries(CLAUSE_CATEGORIES).map(([key, name]) => `- ${key}: ${name}`).join('\n')}

다음 JSON 형식으로만 응답하세요:
{
  "category": "카테고리키",
  "confidence": 0.95,
  "reason": "분류 이유",
  "tags": ["태그1", "태그2"],
  "variables": ["변수1", "변수2"]
}`;

  try {
    const response = await callOpenAI(prompt, 500);
    return JSON.parse(response);
  } catch (error) {
    console.error('조항 분류 오류:', error);
    return {
      category: 'other',
      confidence: 0.3,
      reason: '자동 분류 실패',
      tags: [],
      variables: []
    };
  }
}

// 조항 중복도 검사
export async function checkDuplication(newClause, existingClauses) {
  if (existingClauses.length === 0) {
    return { isDuplicate: false, similarity: 0, similarClause: null };
  }
  
  const prompt = `새로운 조항과 기존 조항들 간의 유사도를 분석해주세요.

새로운 조항:
제목: ${newClause.title}
내용: ${newClause.content.substring(0, 200)}...

기존 조항들:
${existingClauses.slice(0, 5).map((clause, idx) => 
  `${idx + 1}. ${clause.title}: ${clause.content.substring(0, 100)}...`
).join('\n')}

JSON 형식으로 응답:
{
  "maxSimilarity": 0.85,
  "mostSimilarIndex": 2,
  "isDuplicate": true,
  "analysis": "분석 결과"
}`;

  try {
    const response = await callOpenAI(prompt, 300);
    const result = JSON.parse(response);
    
    return {
      isDuplicate: result.maxSimilarity > 0.8,
      similarity: result.maxSimilarity,
      similarClause: result.mostSimilarIndex >= 0 ? existingClauses[result.mostSimilarIndex] : null,
      analysis: result.analysis
    };
  } catch (error) {
    console.error('중복도 검사 오류:', error);
    return { isDuplicate: false, similarity: 0, similarClause: null };
  }
}

// 조항 타입 결정 (standard vs flexible)
export async function determineClauseType(clause, analysisData) {
  const prompt = `계약서 조항을 분석하여 표준 조항인지 유연 조항인지 판단해주세요.

조항 정보:
- 제목: ${clause.title}
- 카테고리: ${analysisData.category}
- 내용: ${clause.content.substring(0, 300)}...

판단 기준:
- 표준 조항: 대부분의 계약서에서 동일하게 사용되는 조항
- 유연 조항: 업종, 프로젝트별로 내용이 달라지는 조항

JSON 응답:
{
  "type": "standard",
  "confidence": 0.9,
  "reason": "판단 근거",
  "recommendation": "권고사항"
}`;

  try {
    const response = await callOpenAI(prompt, 300);
    return JSON.parse(response);
  } catch (error) {
    console.error('조항 타입 결정 오류:', error);
    return {
      type: 'flexible',
      confidence: 0.5,
      reason: '자동 판단 실패',
      recommendation: '수동 검토 필요'
    };
  }
}

// 변수 추출 (템플릿화를 위한)
export async function extractVariables(clauseContent) {
  const prompt = `다음 조항에서 동적으로 변경 가능한 변수들을 추출해주세요.

조항 내용: ${clauseContent}

추출할 변수 유형:
- 금액 (예: 1,000,000원)
- 날짜 (예: 2025년 1월 1일)
- 기간 (예: 30일, 3개월)
- 회사명, 인명
- 기타 프로젝트별 변경 요소

JSON 응답:
{
  "variables": [
    {
      "name": "contractAmount",
      "value": "1,000,000원",
      "type": "amount",
      "position": "조항 내 위치"
    }
  ],
  "templateContent": "변수가 {{contractAmount}}로 치환된 템플릿 내용"
}`;

  try {
    const response = await callOpenAI(prompt, 800);
    return JSON.parse(response);
  } catch (error) {
    console.error('변수 추출 오류:', error);
    return {
      variables: [],
      templateContent: clauseContent
    };
  }
}

// 메인 분석 함수
export async function analyzeClause(clause, existingClauses = []) {
  try {
    console.log(`조항 분석 시작: ${clause.title}`);
    
    // 1. 카테고리 분류
    const categoryResult = await categorizeClause(clause.title, clause.content);
    
    // 2. 중복도 검사
    const duplicationResult = await checkDuplication(clause, existingClauses);
    
    // 3. 조항 타입 결정
    const typeResult = await determineClauseType(clause, categoryResult);
    
    // 4. 변수 추출
    const variableResult = await extractVariables(clause.content);
    
    const analysis = {
      clause: {
        ...clause,
        category: categoryResult.category,
        type: typeResult.type,
        tags: categoryResult.tags,
        variables: variableResult.variables,
        templateContent: variableResult.templateContent
      },
      analysis: {
        categoryConfidence: categoryResult.confidence,
        typeConfidence: typeResult.confidence,
        isDuplicate: duplicationResult.isDuplicate,
        similarity: duplicationResult.similarity,
        similarClause: duplicationResult.similarClause,
        recommendation: typeResult.recommendation,
        processingTime: Date.now()
      }
    };
    
    console.log(`조항 분석 완료: ${clause.title} -> ${categoryResult.category} (${typeResult.type})`);
    
    return {
      success: true,
      ...analysis
    };
    
  } catch (error) {
    console.error('조항 분석 실패:', error);
    return {
      success: false,
      error: error.message,
      clause
    };
  }
}

// 문서 전체 분석
export async function analyzeDocument(document, existingClauses = []) {
  const results = [];
  
  console.log(`문서 분석 시작: ${document.filename} (${document.clauses.length}개 조항)`);
  
  for (let i = 0; i < document.clauses.length; i++) {
    const clause = document.clauses[i];
    
    try {
      const analysis = await analyzeClause(clause, existingClauses);
      results.push(analysis);
      
      // API 호출 간격 조절
      if (i < document.clauses.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`조항 ${i + 1} 분석 실패:`, error);
      results.push({
        success: false,
        error: error.message,
        clause
      });
    }
  }
  
  const summary = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    categories: {}
  };
  
  // 카테고리별 집계
  results.filter(r => r.success).forEach(result => {
    const category = result.clause.category;
    summary.categories[category] = (summary.categories[category] || 0) + 1;
  });
  
  console.log(`문서 분석 완료:`, summary);
  
  return {
    document,
    results,
    summary
  };
}

export default {
  analyzeClause,
  analyzeDocument,
  categorizeClause,
  checkDuplication,
  determineClauseType,
  extractVariables
};