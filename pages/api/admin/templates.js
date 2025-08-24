// pages/api/admin/templates.js - 다국어 지원 수정

import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '../../../lib/auth';
import { analyzeContractClauses } from '../../../lib/contractClauseAnalyzer';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res, user);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: '지원하지 않는 메소드입니다.' });
    }
  } catch (error) {
    console.error('Templates API 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

// GET: 템플릿 목록 조회 (다국어 지원 추가)
async function handleGet(req, res) {
  const { page = 1, limit = 10, category, status, countryCode } = req.query;
  
  const where = {};
  if (category) where.category = category;
  if (status) where.status = status;
  if (countryCode) where.countryCode = countryCode; // 🆕 국가별 필터링
  
  const templates = await prisma.contractTemplate.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          contracts: true
        }
      }
    },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
    orderBy: { createdAt: 'desc' }
  });

  const total = await prisma.contractTemplate.count({ where });
  
  // 조항 정보 파싱
  const templatesWithClauses = templates.map(template => ({
    ...template,
    clauses: parseClausesFromJson(template.clauses),
    variables: parseVariablesFromJson(template.variables),
    clauseCount: parseClausesFromJson(template.clauses)?.length || 0
  }));
  
  return res.status(200).json({
    templates: templatesWithClauses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}

// POST: 새 템플릿 생성 (다국어 조항 분석 지원)
async function handlePost(req, res, user) {
  const { 
    name, 
    category, 
    description, 
    content,
    // 🆕 다국어 필드들
    countryCode = 'kr',
    language = 'ko',
    legalSystem = 'civil_law',
    enableClauseAnalysis = true,
    clauseCategories = [],
    clauseConfidenceThreshold = 0.8,
    aiVerification
  } = req.body;

  if (!name || !category || !content) {
    return res.status(400).json({ 
      error: '템플릿 이름, 카테고리, 내용은 필수입니다.' 
    });
  }

  try {
    console.log('템플릿 생성 시작:', { name, category, countryCode });
    
    let clauseCandidates = [];
    let analysisResult = null;
    
    // 🆕 다국어 조항 분석
    if (enableClauseAnalysis) {
      try {
        console.log(`조항 분석 시작... (${countryCode.toUpperCase()})`);
        
        analysisResult = await analyzeContractClauses(content, {
          industry: category,
          complexity: 'medium',
          templateName: name,
          category,
          // 🆕 국가 정보 전달
          countryCode: countryCode,
          language: language,
          legalSystem: legalSystem,
          clauseCategories: clauseCategories,
          confidenceThreshold: clauseConfidenceThreshold
        });

        if (analysisResult.success) {
          console.log(`${countryCode.toUpperCase()} 분석 성공: ${analysisResult.clauses.length}개 조항 발견`);
          
          clauseCandidates = await saveClauseCandidates(
            analysisResult.clauses, 
            name, 
            category,
            countryCode, // 🆕 국가 코드 전달
            user.id
          );
          
          console.log(`조항 후보 저장 완료: ${clauseCandidates.length}개`);
        } else {
          console.log(`${countryCode.toUpperCase()} 조항 분석 실패:`, analysisResult.error);
        }
      } catch (error) {
        console.error('조항 분석 오류:', error);
        // 분석 실패해도 템플릿은 생성
      }
    }

    // 🆕 다국어 템플릿 생성
    const template = await prisma.contractTemplate.create({
      data: {
        name,
        category,
        description: description || `${name} 템플릿`,
        content,
        variables: JSON.stringify(extractStandardVariables(content)),
        clauses: analysisResult?.success ? JSON.stringify(analysisResult.clauses) : '[]',
        industry: category,
        complexity: 'medium',
        status: 'active',
        confidence: analysisResult?.success ? calculateTemplateConfidence(analysisResult) : 0.8,
        userId: user.id,
        type: analysisResult?.success ? 'clause_analyzed' : 'manual',
        tags: JSON.stringify(generateTemplateTags(analysisResult, category, countryCode)),
        // 🆕 다국어 필드들
        countryCode: countryCode,
        language: language,
        legalSystem: legalSystem
      }
    });

    console.log(`${countryCode.toUpperCase()} 템플릿 생성 완료:`, template.id);

    // 🆕 80% 기준 성공률 계산
    let successRate = null;
    if (analysisResult?.success && analysisResult.clauses.length > 0) {
      const highConfidenceClauses = analysisResult.clauses.filter(
        clause => (clause.confidence || 0) >= clauseConfidenceThreshold
      );
      successRate = highConfidenceClauses.length / analysisResult.clauses.length;
    }

    return res.status(201).json({
      template,
      extractedClauses: clauseCandidates.length,
      analysis: analysisResult?.success ? {
        clauseCount: analysisResult.clauses.length,
        statistics: analysisResult.statistics,
        successRate: successRate, // 🆕 80% 기준 성공률
        countryRisk: analysisResult.countryRisk || calculateCountryRisk(countryCode, analysisResult.clauses)
      } : null,
      message: clauseCandidates.length > 0 
        ? `${countryCode.toUpperCase()} 템플릿이 생성되고 ${clauseCandidates.length}개 조항이 조항검토에 추가되었습니다.`
        : `${countryCode.toUpperCase()} 템플릿이 생성되었습니다.`
    });

  } catch (error) {
    console.error('템플릿 생성 오류:', error);
    return res.status(500).json({
      error: '템플릿 생성 중 오류 발생',
      details: error.message
    });
  }
}

// PUT: 템플릿 수정 (다국어 지원)
async function handlePut(req, res) {
  const { id } = req.query;
  const updateData = req.body;

  if (!id) {
    return res.status(400).json({ error: '템플릿 ID가 필요합니다.' });
  }

  try {
    // 내용이 변경되면 재분석 (다국어 지원)
    if (updateData.content) {
      console.log('템플릿 재분석 시작:', id);
      
      const analysisResult = await analyzeContractClauses(updateData.content, {
        industry: updateData.industry,
        complexity: updateData.complexity,
        templateName: updateData.name,
        // 🆕 국가 정보 전달
        countryCode: updateData.countryCode || 'kr',
        language: updateData.language || 'ko',
        legalSystem: updateData.legalSystem || 'civil_law'
      });

      if (analysisResult.success) {
        updateData.clauses = JSON.stringify(analysisResult.clauses);
        updateData.variables = JSON.stringify(extractStandardVariables(updateData.content));
        updateData.confidence = calculateTemplateConfidence(analysisResult);
      }
    }

    const template = await prisma.contractTemplate.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return res.status(200).json(template);

  } catch (error) {
    console.error('템플릿 수정 오류:', error);
    return res.status(500).json({
      error: '템플릿 수정 중 오류 발생',
      details: error.message
    });
  }
}

// DELETE: 템플릿 삭제 (기존과 동일)
async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: '템플릿 ID가 필요합니다.' });
  }

  try {
    // 사용 중인 템플릿인지 확인
    const contractCount = await prisma.contract.count({
      where: { templateId: parseInt(id) }
    });

    if (contractCount > 0) {
      return res.status(400).json({ 
        error: `이 템플릿을 사용하는 계약서가 ${contractCount}개 있어서 삭제할 수 없습니다.` 
      });
    }

    await prisma.contractTemplate.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({ 
      message: '템플릿이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('템플릿 삭제 오류:', error);
    return res.status(500).json({
      error: '템플릿 삭제 중 오류 발생',
      details: error.message
    });
  }
}

/**
 * 🆕 다국어 조항 후보 저장 함수
 */
async function saveClauseCandidates(clauses, templateName, category, countryCode, userId) {
  const candidates = [];
  
  for (const clause of clauses) {
    try {
      const clauseCategory = getRecommendedClauseCategory(clause, countryCode);
      
      const candidate = await prisma.clauseCandidate.create({
        data: {
          title: clause.categoryName || clauseCategory,
          content: clause.content,
          contractCategory: category,
          clauseCategory: clauseCategory,
          sourceContract: `템플릿_${templateName}`,
          confidence: clause.confidence || 0.8,
          tags: JSON.stringify(clause.tags || []),
          variables: JSON.stringify(extractClauseVariables(clause.content)),
          needsReview: (clause.confidence || 0.8) < 0.85,
          status: (clause.confidence || 0.8) >= 0.85 ? 'approved' : 'pending',
          // 🆕 다국어 필드
          countryCode: countryCode,
          language: getLanguageFromCountryCode(countryCode)
        }
      });
      
      candidates.push(candidate);
      console.log(`${countryCode.toUpperCase()} 조항 후보 생성: ${candidate.title} (신뢰도: ${candidate.confidence})`);
      
    } catch (error) {
      console.error('조항 후보 저장 오류:', error);
    }
  }
  
  return candidates;
}

/**
 * 🆕 국가별 조항 카테고리 추천
 */
function getRecommendedClauseCategory(clause, countryCode = 'kr') {
  const content = clause.content.toLowerCase();
  const categoryName = (clause.categoryName || '').toLowerCase();
  
  if (countryCode === 'kr') {
    // 한국 조항 카테고리
    if (categoryName.includes('목적') || content.includes('목적')) return '기본 정보';
    if (categoryName.includes('대금') || content.includes('대금') || content.includes('지급')) return '대금 지급';
    if (categoryName.includes('비밀') || content.includes('비밀')) return '기밀유지';
    if (categoryName.includes('해지') || content.includes('해지')) return '계약해지';
    if (categoryName.includes('손해') || content.includes('손해')) return '책임한계';
    if (categoryName.includes('지적재산') || content.includes('지적재산')) return '지적재산권';
    if (categoryName.includes('하자') || content.includes('하자')) return '보증 조건';
    if (categoryName.includes('납품') || content.includes('납품')) return '납품 조건';
    if (categoryName.includes('서비스') || content.includes('서비스')) return '서비스 범위';
    if (categoryName.includes('분쟁') || content.includes('분쟁')) return '분쟁해결';
    return '기타';
  } else if (countryCode === 'us') {
    // 미국 조항 카테고리
    if (content.includes('payment') || content.includes('fee')) return 'Payment Terms';
    if (content.includes('confidential') || content.includes('nda')) return 'Confidentiality';
    if (content.includes('liability') || content.includes('damages')) return 'Limitation of Liability';
    if (content.includes('indemnif')) return 'Indemnification';
    if (content.includes('termination') || content.includes('terminate')) return 'Termination';
    if (content.includes('intellectual property') || content.includes('copyright')) return 'Intellectual Property';
    if (content.includes('warranty') || content.includes('guarantee')) return 'Warranties';
    if (content.includes('delivery') || content.includes('performance')) return 'Delivery Terms';
    if (content.includes('dispute') || content.includes('arbitration')) return 'Dispute Resolution';
    if (content.includes('governing law')) return 'Governing Law';
    if (content.includes('compliance') || content.includes('regulatory')) return 'Regulatory Compliance';
    return 'Other Provisions';
  } else {
    // 기타 국가 (영어 기본)
    if (content.includes('payment')) return 'Payment Terms';
    if (content.includes('confidential')) return 'Confidentiality';
    if (content.includes('liability')) return 'Liability Limitation';
    if (content.includes('termination')) return 'Termination';
    if (content.includes('intellectual property')) return 'Intellectual Property';
    if (content.includes('warranty')) return 'Warranty';
    if (content.includes('delivery')) return 'Delivery Terms';
    if (content.includes('dispute')) return 'Dispute Resolution';
    return 'Other Provisions';
  }
}

/**
 * 🆕 국가별 위험도 계산
 */
function calculateCountryRisk(countryCode, clauses) {
  let riskScore = 5; // 기본 위험도
  
  // 국가별 기본 위험도
  const countryRiskMap = {
    'kr': 3, 'us': 4, 'de': 3, 'fr': 3, 'jp': 2,
    'sg': 4, 'hk': 4, 'uk': 4, 'au': 4, 'ca': 4,
    'mx': 6, 'br': 6, 'ru': 7, 'ae': 5, 'za': 6
  };
  
  riskScore = countryRiskMap[countryCode] || 5;
  
  // 조항별 위험도 추가
  if (clauses && clauses.length > 0) {
    const highRiskKeywords = ['liability', '책임', 'indemnify', '배상', 'penalty', '위약금'];
    const hasHighRiskClauses = clauses.some(clause => 
      highRiskKeywords.some(keyword => 
        clause.content.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (hasHighRiskClauses) riskScore += 1;
    if (clauses.length < 5) riskScore += 1; // 조항이 적으면 위험도 증가
  }
  
  return Math.min(riskScore, 10);
}

/**
 * 🆕 국가 코드에서 언어 추출
 */
function getLanguageFromCountryCode(countryCode) {
  const languageMap = {
    'kr': 'ko', 'jp': 'ja', 'de': 'de', 'fr': 'fr', 'es': 'es',
    'it': 'it', 'nl': 'nl', 'pl': 'pl', 'ru': 'ru', 'br': 'pt',
    'tw': 'zh-TW', 'th': 'th'
  };
  
  return languageMap[countryCode] || 'en';
}

/**
 * 🆕 다국어 템플릿 태그 생성
 */
function generateTemplateTags(analysisResult, category, countryCode) {
  const tags = [category, countryCode];
  
  if (analysisResult?.success) {
    const clauseCount = analysisResult.clauses.length;
    if (clauseCount >= 15) tags.push('comprehensive');
    else if (clauseCount >= 8) tags.push('standard');
    else tags.push('basic');
    
    tags.push('ai-analyzed');
  }
  
  return tags;
}

// 기존 헬퍼 함수들 (변경 없음)
function extractStandardVariables(content) {
  const variables = [];
  
  if (content.includes('갑') || content.includes('발주자') || content.includes('CLIENT')) {
    variables.push({
      name: 'CLIENT_NAME',
      type: 'text',
      required: true,
      description: '발주자명 (갑)',
      category: 'basic'
    });
  }
  
  if (content.includes('을') || content.includes('수급자') || content.includes('PROVIDER')) {
    variables.push({
      name: 'PROVIDER_NAME',
      type: 'text',
      required: true,
      description: '수급자명 (을)',
      category: 'basic'
    });
  }
  
  if (content.includes('금액') || content.includes('대금') || content.includes('원')) {
    variables.push({
      name: 'CONTRACT_AMOUNT',
      type: 'number',
      required: true,
      description: '계약 금액',
      category: 'financial'
    });
  }
  
  if (content.includes('기간') || content.includes('날짜') || content.includes('납기')) {
    variables.push({
      name: 'START_DATE',
      type: 'date',
      required: true,
      description: '계약 시작일',
      category: 'schedule'
    });
    
    variables.push({
      name: 'END_DATE',
      type: 'date',
      required: true,
      description: '계약 종료일',
      category: 'schedule'
    });
  }
  
  return variables;
}

function extractClauseVariables(clauseContent) {
  const variables = [];
  
  const blankPatterns = [
    /___+/g,
    /\s+원/g,
    /\d+일/g,
    /\d+개월/g
  ];
  
  blankPatterns.forEach(pattern => {
    const matches = clauseContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        variables.push({
          pattern: match,
          type: inferVariableType(match),
          context: getVariableContext(clauseContent, match)
        });
      });
    }
  });
  
  return variables;
}

function inferVariableType(pattern) {
  if (pattern.includes('원')) return 'currency';
  if (pattern.includes('일') || pattern.includes('개월')) return 'duration';
  if (pattern.includes('___')) return 'text';
  return 'text';
}

function getVariableContext(content, pattern) {
  const index = content.indexOf(pattern);
  const start = Math.max(0, index - 20);
  const end = Math.min(content.length, index + pattern.length + 20);
  return content.substring(start, end);
}

function calculateTemplateConfidence(analysisResult) {
  if (!analysisResult.success) return 0.3;
  
  const clauseCount = analysisResult.clauses.length;
  const avgConfidence = analysisResult.clauses.reduce((sum, clause) => 
    sum + (clause.confidence || 0.5), 0) / clauseCount;
  
  let confidence = avgConfidence;
  
  if (clauseCount >= 10) confidence += 0.1;
  if (clauseCount >= 20) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

function parseClausesFromJson(clausesJson) {
  try {
    return clausesJson ? JSON.parse(clausesJson) : [];
  } catch (error) {
    console.error('조항 JSON 파싱 오류:', error);
    return [];
  }
}

function parseVariablesFromJson(variablesJson) {
  try {
    return variablesJson ? JSON.parse(variablesJson) : [];
  } catch (error) {
    console.error('변수 JSON 파싱 오류:', error);
    return [];
  }
}