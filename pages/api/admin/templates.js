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

// GET: 템플릿 목록 조회
async function handleGet(req, res) {
  const { page = 1, limit = 10, category, status } = req.query;
  
  const where = {};
  if (category) where.category = category;
  if (status) where.status = status;
  
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

// POST: 새 템플릿 생성 (자동 조항 추출 수정)
async function handlePost(req, res, user) {
  const { 
    name, 
    category, 
    description, 
    content
  } = req.body;

  if (!name || !category || !content) {
    return res.status(400).json({ 
      error: '템플릿 이름, 카테고리, 내용은 필수입니다.' 
    });
  }

  try {
    console.log('템플릿 생성 시작:', { name, category });
    
    let clauseCandidates = [];
    let analysisResult = null;
    
    // 항상 조항 추출 실행 (extractClauses 조건 제거)
    try {
      console.log('조항 분석 시작...');
      
      analysisResult = await analyzeContractClauses(content, {
        industry: category,
        complexity: 'medium',
        templateName: name,
        category
      });

      if (analysisResult.success) {
        console.log(`분석 성공: ${analysisResult.clauses.length}개 조항 발견`);
        
        clauseCandidates = await saveClauseCandidates(
          analysisResult.clauses, 
          name, 
          category,
          user.id
        );
        
        console.log(`조항 후보 저장 완료: ${clauseCandidates.length}개`);
      } else {
        console.log('조항 분석 실패:', analysisResult.error);
      }
    } catch (error) {
      console.error('조항 분석 오류:', error);
      // 분석 실패해도 템플릿은 생성
    }

    // 템플릿 생성
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
        tags: analysisResult?.success ? JSON.stringify(generateTemplateTags(analysisResult, category)) : '[]'
      }
    });

    console.log('템플릿 생성 완료:', template.id);

    return res.status(201).json({
      template,
      extractedClauses: clauseCandidates.length,
      analysis: analysisResult?.success ? {
        clauseCount: analysisResult.clauses.length,
        statistics: analysisResult.statistics
      } : null,
      message: clauseCandidates.length > 0 
        ? `템플릿이 생성되고 ${clauseCandidates.length}개 조항이 조항검토에 추가되었습니다.`
        : '템플릿이 생성되었습니다.'
    });

  } catch (error) {
    console.error('템플릿 생성 오류:', error);
    return res.status(500).json({
      error: '템플릿 생성 중 오류 발생',
      details: error.message
    });
  }
}

// PUT: 템플릿 수정
async function handlePut(req, res) {
  const { id } = req.query;
  const updateData = req.body;

  if (!id) {
    return res.status(400).json({ error: '템플릿 ID가 필요합니다.' });
  }

  try {
    // 내용이 변경되면 재분석
    if (updateData.content) {
      console.log('템플릿 재분석 시작:', id);
      
      const analysisResult = await analyzeContractClauses(updateData.content, {
        industry: updateData.industry,
        complexity: updateData.complexity,
        templateName: updateData.name
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

// DELETE: 템플릿 삭제
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
 * 조항 후보 저장 함수 (스키마 호환)
 */
async function saveClauseCandidates(clauses, templateName, category, userId) {
  const candidates = [];
  
  for (const clause of clauses) {
    try {
      const clauseCategory = getRecommendedClauseCategory(clause);
      
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
          status: (clause.confidence || 0.8) >= 0.85 ? 'approved' : 'pending'
        }
      });
      
      candidates.push(candidate);
      console.log(`조항 후보 생성: ${candidate.title} (신뢰도: ${candidate.confidence})`);
      
    } catch (error) {
      console.error('조항 후보 저장 오류:', error);
    }
  }
  
  return candidates;
}

/**
 * 조항 카테고리 추천
 */
function getRecommendedClauseCategory(clause) {
  const content = clause.content.toLowerCase();
  const categoryName = (clause.categoryName || '').toLowerCase();
  
  if (categoryName.includes('목적') || content.includes('목적')) return '계약의 목적';
  if (categoryName.includes('대금') || content.includes('대금') || content.includes('지급')) return '대금 지급 조건';
  if (categoryName.includes('비밀') || content.includes('비밀')) return '비밀유지 의무';
  if (categoryName.includes('해지') || content.includes('해지')) return '계약 해지 조건';
  if (categoryName.includes('손해') || content.includes('손해')) return '손해배상 제한';
  if (categoryName.includes('지적재산') || content.includes('지적재산')) return '지적재산권 귀속';
  if (categoryName.includes('하자') || content.includes('하자')) return '하자보증 기간';
  if (categoryName.includes('근로') || content.includes('근로시간')) return '근로시간 및 휴게';
  if (categoryName.includes('투자') || content.includes('투자금')) return '투자금 회수 조건';
  if (categoryName.includes('수익') || content.includes('분배')) return '수익 분배 조건';
  
  return '기타 조항';
}

/**
 * 표준 변수 추출
 */
function extractStandardVariables(content) {
  const variables = [];
  
  // 기본 당사자 정보
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
  
  // 금액 관련
  if (content.includes('금액') || content.includes('대금') || content.includes('원')) {
    variables.push({
      name: 'CONTRACT_AMOUNT',
      type: 'number',
      required: true,
      description: '계약 금액',
      category: 'financial'
    });
  }
  
  // 날짜 관련
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

/**
 * 조항에서 변수 추출
 */
function extractClauseVariables(clauseContent) {
  const variables = [];
  
  // 빈칸이나 밑줄 패턴 찾기
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

/**
 * 변수 타입 추론
 */
function inferVariableType(pattern) {
  if (pattern.includes('원')) return 'currency';
  if (pattern.includes('일') || pattern.includes('개월')) return 'duration';
  if (pattern.includes('___')) return 'text';
  return 'text';
}

/**
 * 변수 컨텍스트 추출
 */
function getVariableContext(content, pattern) {
  const index = content.indexOf(pattern);
  const start = Math.max(0, index - 20);
  const end = Math.min(content.length, index + pattern.length + 20);
  return content.substring(start, end);
}

/**
 * 템플릿 신뢰도 계산
 */
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

/**
 * 템플릿 태그 생성
 */
function generateTemplateTags(analysisResult, category) {
  const tags = [category];
  
  if (analysisResult.clauses.length >= 15) tags.push('comprehensive');
  else if (analysisResult.clauses.length >= 8) tags.push('standard');
  else tags.push('basic');
  
  return tags;
}

/**
 * JSON 파싱 헬퍼 함수들
 */
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