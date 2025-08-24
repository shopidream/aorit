// pages/api/contracts/normalize.js - 계약서 정규화 API

import { getCurrentUser } from '../../../lib/auth';
import { normalizeContract } from '../../../lib/contractNormalizer';
import { analyzeContractClauses } from '../../../lib/contractClauseAnalyzer';
import { checkAIUsageLimit, incrementAIUsage } from '../../../lib/aiUsageLimit';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 메소드만 지원합니다' });
  }

  try {
    // 인증 확인
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: '인증이 필요합니다' });
    }

    // AI 사용량 제한 체크
    try {
      const usageInfo = await checkAIUsageLimit(user.id);
      console.log(`AI 계약서 검토 - 사용 가능: ${usageInfo.remaining}/${usageInfo.limit}`);
    } catch (error) {
      return res.status(429).json({ 
        error: error.message,
        code: 'AI_USAGE_LIMIT_EXCEEDED'
      });
    }
    const { content, options = {} } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: '계약서 내용이 필요합니다' });
    }

    if (content.length < 50) {
      return res.status(400).json({ error: '계약서 내용이 너무 짧습니다 (최소 50자)' });
    }

    if (content.length > 50000) {
      return res.status(400).json({ error: '계약서 내용이 너무 깁니다 (최대 50,000자)' });
    }

    console.log(`계약서 정규화 시작: ${content.length}자`);

    // 1단계: 형식 정리 (빠른 응답)
    const normalizeResult = await normalizeContract(content, {
      preserveOriginal: true,
      minConfidence: options.minConfidence || 0.3,
      ...options
    });

    if (!normalizeResult.success) {
      return res.status(400).json({
        error: '계약서 정규화 실패',
        details: normalizeResult.error
      });
    }

    console.log(`정규화 완료: ${normalizeResult.normalized.clauses.length}개 조항`);

    // 2단계: AI 분석 (선택적, 백그라운드에서 수행 가능)
    let aiAnalysis = null;
    if (options.includeAiAnalysis !== false) {
      try {
        console.log('AI 분석 시작...');
        
        const analysisResult = await analyzeContractClauses(content, {
          industry: options.industry || 'general',
          complexity: 'medium',
          templateName: options.templateName || '업로드된 계약서',
          category: options.category || 'general',
          countryCode: options.countryCode || 'kr',
          language: options.language || 'ko',
          confidenceThreshold: options.confidenceThreshold || 0.7
        });

        if (analysisResult.success) {
          aiAnalysis = {
            success: true,
            clauses: analysisResult.clauses || [],
            statistics: analysisResult.statistics || {},
            risks: extractRiskFactors(analysisResult.clauses || []),
            missingClauses: identifyMissingClauses(normalizeResult.normalized.clauses),
            recommendations: generateDetailedRecommendations(normalizeResult.normalized.clauses, analysisResult.clauses || [])
          };
          
          console.log(`AI 분석 완료: ${aiAnalysis.clauses.length}개 조항 분석`);
        } else {
          console.log('AI 분석 실패, 기본 분석으로 대체');
          aiAnalysis = {
            success: false,
            error: analysisResult.error,
            fallback: generateBasicAnalysis(normalizeResult.normalized.clauses)
          };
        }
      } catch (error) {
        console.error('AI 분석 오류:', error);
        aiAnalysis = {
          success: false,
          error: error.message,
          fallback: generateBasicAnalysis(normalizeResult.normalized.clauses)
        };
      }
    }

    // AI 사용량 증가
    await incrementAIUsage(user.id);

    return res.status(200).json({
      success: true,
      normalized: normalizeResult.normalized,
      validation: normalizeResult.validation,
      recommendations: normalizeResult.recommendations,
      aiAnalysis,
      metadata: {
        userId: user.id,
        processedAt: new Date().toISOString(),
        originalLength: content.length,
        extractedClauses: normalizeResult.normalized.clauses.length,
        overallConfidence: normalizeResult.normalized.metadata.confidence,
        processingTime: Date.now() - normalizeResult.normalized.metadata.processingTime
      }
    });

  } catch (error) {
    console.error('계약서 정규화 API 오류:', error);
    return res.status(500).json({
      error: '서버 내부 오류가 발생했습니다',
      details: error.message
    });
  }
}

/**
 * 위험 요소 추출
 */
function extractRiskFactors(aiClauses) {
  const riskFactors = {
    high: [],
    medium: [],
    low: []
  };

  const highRiskKeywords = [
    '환불 불가', '취소 불가', '독점권', '영구 독점', '전권', 
    '무제한 책임', '일방적', '즉시 해지', '통보 없이'
  ];

  const mediumRiskKeywords = [
    '위약금', '지체상금', '손해배상', '하자보증', '별도 협의', 
    '추가 비용', '관련 법령', '준거법'
  ];

  aiClauses.forEach((clause, index) => {
    const content = clause.content?.toLowerCase() || '';
    const title = clause.categoryName?.toLowerCase() || '';
    const combinedText = content + ' ' + title;

    let riskLevel = 'low';
    let reasons = [];

    // 고위험 체크
    highRiskKeywords.forEach(keyword => {
      if (combinedText.includes(keyword.toLowerCase())) {
        riskLevel = 'high';
        reasons.push(`분쟁 위험: "${keyword}" 표현 사용`);
      }
    });

    // 중위험 체크 (고위험이 아닌 경우만)
    if (riskLevel !== 'high') {
      mediumRiskKeywords.forEach(keyword => {
        if (combinedText.includes(keyword.toLowerCase())) {
          riskLevel = 'medium';
          reasons.push(`주의 필요: "${keyword}" 조건 확인`);
        }
      });
    }

    if (reasons.length > 0) {
      riskFactors[riskLevel].push({
        clauseIndex: index,
        title: clause.categoryName || `조항 ${index + 1}`,
        content: clause.content || '',
        reasons,
        confidence: clause.confidence || 0.5
      });
    }
  });

  return riskFactors;
}

/**
 * 누락된 필수 조항 식별
 */
function identifyMissingClauses(normalizedClauses) {
  const essentialClauses = {
    '계약의 목적': ['목적', '본 계약'],
    '계약 금액': ['대금', '금액', '용역대금', '서비스 대가'],
    '계약 기간': ['기간', '계약기간', '용역기간'],
    '납품 조건': ['납품', '완성', '인도', '제공'],
    '지급 조건': ['지급', '결제', '입금'],
    '지적재산권': ['저작권', '지적재산', '소유권'],
    '비밀유지': ['비밀', '기밀', '보안'],
    '계약 해지': ['해지', '해약', '종료'],
    '손해배상': ['손해', '배상', '책임', '위약'],
    '분쟁해결': ['분쟁', '중재', '관할', '법원']
  };

  const missing = [];

  Object.entries(essentialClauses).forEach(([clauseType, keywords]) => {
    const hasClause = normalizedClauses.some(clause => 
      keywords.some(keyword => 
        clause.title.toLowerCase().includes(keyword.toLowerCase()) || 
        clause.content.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (!hasClause) {
      missing.push({
        type: clauseType,
        keywords,
        importance: getClauseImportance(clauseType),
        suggestedContent: getSuggestedClauseContent(clauseType)
      });
    }
  });

  return missing.sort((a, b) => b.importance - a.importance);
}

/**
 * 조항 중요도 평가
 */
function getClauseImportance(clauseType) {
  const importanceMap = {
    '계약의 목적': 10,
    '계약 금액': 10,
    '지급 조건': 9,
    '계약 기간': 8,
    '납품 조건': 8,
    '계약 해지': 7,
    '손해배상': 6,
    '지적재산권': 6,
    '비밀유지': 5,
    '분쟁해결': 4
  };

  return importanceMap[clauseType] || 3;
}

/**
 * 제안 조항 내용 생성
 */
function getSuggestedClauseContent(clauseType) {
  const suggestions = {
    '계약의 목적': '본 계약은 갑이 을에게 [서비스명]을 의뢰하고, 을이 이를 성실히 수행함을 목적으로 한다.',
    '계약 금액': '본 계약의 총 금액은 금 [금액]원으로 한다.',
    '지급 조건': '갑은 을에게 계약 완료 후 30일 이내에 계약금액을 지급한다.',
    '계약 기간': '본 계약의 이행 기간은 계약 체결일로부터 [기간]일로 한다.',
    '납품 조건': '을은 약정된 기일 내에 완성된 결과물을 갑에게 납품한다.',
    '계약 해지': '양 당사자는 상대방이 계약상 의무를 위반한 경우 7일의 최고기간을 정하여 계약을 해지할 수 있다.',
    '손해배상': '당사자 일방의 귀책사유로 인한 손해는 그 당사자가 배상한다.',
    '지적재산권': '본 계약으로 인해 생성된 결과물의 지적재산권은 [당사자]에게 귀속한다.',
    '비밀유지': '양 당사자는 본 계약 이행 중 알게 된 상대방의 기밀정보를 보호한다.',
    '분쟁해결': '본 계약으로 인한 분쟁은 [관할법원]을 전속관할로 한다.'
  };

  return suggestions[clauseType] || '해당 조항의 내용을 추가하세요.';
}

/**
 * 상세 권장사항 생성
 */
function generateDetailedRecommendations(normalizedClauses, aiClauses) {
  const recommendations = [];

  // 1. 조항 수 관련
  if (normalizedClauses.length < 5) {
    recommendations.push({
      type: 'warning',
      category: 'structure',
      title: '조항 부족',
      message: '계약서의 조항이 부족합니다. 필수 조항들을 추가하는 것을 권장합니다.',
      priority: 'high',
      action: 'add_clauses'
    });
  }

  // 2. 신뢰도 관련
  const lowConfidenceClauses = normalizedClauses.filter(c => c.confidence < 0.6);
  if (lowConfidenceClauses.length > 0) {
    recommendations.push({
      type: 'warning',
      category: 'quality',
      title: '인식 품질 저하',
      message: `${lowConfidenceClauses.length}개 조항의 인식 신뢰도가 낮습니다. 해당 조항들을 수동으로 검토해주세요.`,
      priority: 'medium',
      action: 'manual_review',
      affected: lowConfidenceClauses.map(c => c.number)
    });
  }

  // 3. AI 분석 결과 기반 권장사항
  if (aiClauses && aiClauses.length > 0) {
    const highRiskClauses = aiClauses.filter(c => 
      c.content && (
        c.content.includes('환불 불가') || 
        c.content.includes('독점권') || 
        c.content.includes('일방적')
      )
    );

    if (highRiskClauses.length > 0) {
      recommendations.push({
        type: 'error',
        category: 'risk',
        title: '고위험 조항 발견',
        message: '분쟁 위험이 높은 조항들이 발견되었습니다. AI 검토를 통해 개선안을 확인하세요.',
        priority: 'high',
        action: 'ai_review',
        affected: highRiskClauses.length
      });
    }
  }

  // 4. 구조적 개선 제안
  const duplicateTitles = findDuplicateTitles(normalizedClauses);
  if (duplicateTitles.length > 0) {
    recommendations.push({
      type: 'info',
      category: 'structure',
      title: '중복 제목',
      message: '중복된 조항 제목이 있습니다. 구분을 위해 제목을 수정하는 것을 권장합니다.',
      priority: 'low',
      action: 'rename_clauses',
      affected: duplicateTitles
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * 기본 분석 생성 (AI 분석 실패시 대체)
 */
function generateBasicAnalysis(normalizedClauses) {
  return {
    clauseCount: normalizedClauses.length,
    avgConfidence: normalizedClauses.reduce((sum, c) => sum + c.confidence, 0) / normalizedClauses.length,
    essentialCount: normalizedClauses.filter(c => c.essential).length,
    riskLevel: 'unknown',
    completeness: Math.min((normalizedClauses.length / 10) * 100, 100),
    recommendations: [
      {
        type: 'info',
        message: 'AI 분석을 사용할 수 없습니다. 수동 검토를 권장합니다.',
        priority: 'medium'
      }
    ]
  };
}

/**
 * 중복 제목 찾기
 */
function findDuplicateTitles(clauses) {
  const titleCounts = {};
  const duplicates = [];

  clauses.forEach(clause => {
    const title = clause.title.toLowerCase();
    titleCounts[title] = (titleCounts[title] || 0) + 1;
  });

  Object.entries(titleCounts).forEach(([title, count]) => {
    if (count > 1) {
      duplicates.push(title);
    }
  });

  return duplicates;
}