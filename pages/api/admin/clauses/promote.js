import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '../../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: '지원하지 않는 메소드입니다.' });
    }

    return await handlePost(req, res, user);
  } catch (error) {
    console.error('Clause Promote API 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

// POST: 조항 후보를 정식 승격
async function handlePost(req, res, user) {
  const { 
    candidateIds, 
    templateId, 
    category, 
    promotionType = 'auto_approval', // 'template' | 'standalone' | 'auto_approval' 추가
    reason = '',
    metadata = {} 
  } = req.body;

  if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    return res.status(400).json({ 
      error: '승격할 조항 후보 ID 목록이 필요합니다.' 
    });
  }

  const results = {
    promoted: [],
    failed: [],
    summary: {
      total: candidateIds.length,
      success: 0,
      failed: 0
    }
  };

  // 트랜잭션으로 처리
  try {
    await prisma.$transaction(async (tx) => {
      for (const candidateId of candidateIds) {
        try {
          const candidate = await tx.clauseCandidate.findUnique({
            where: { id: parseInt(candidateId) }
          });

          if (!candidate) {
            results.failed.push({
              id: candidateId,
              error: '조항 후보를 찾을 수 없습니다.'
            });
            continue;
          }

          // 자동 승인의 경우 pending 상태만 처리
          if (promotionType === 'auto_approval') {
            if (candidate.status !== 'pending') {
              results.failed.push({
                id: candidateId,
                error: '이미 처리된 조항 후보입니다.'
              });
              continue;
            }

            // 단순히 approved 상태로 변경
            const updatedCandidate = await tx.clauseCandidate.update({
              where: { id: candidate.id },
              data: {
                status: 'approved',
                reviewedAt: new Date()
              }
            });

            results.promoted.push({
              id: candidateId,
              candidate: updatedCandidate,
              action: 'auto_approved',
              message: reason || '고신뢰도 자동 승인'
            });
            
            results.summary.success++;
            continue;
          }

          // 기존 template/standalone 로직
          if (candidate.status !== 'pending') {
            results.failed.push({
              id: candidateId,
              error: '이미 처리된 조항 후보입니다.'
            });
            continue;
          }

          // 중복 확인
          const duplicateCheck = await checkForDuplicates(tx, candidate);
          
          let promotionResult;
          if (promotionType === 'template') {
            if (!templateId) {
              throw new Error('템플릿 승격의 경우 templateId가 필요합니다.');
            }
            promotionResult = await promoteToTemplate(tx, candidate, templateId, user, duplicateCheck);
          } else {
            promotionResult = await promoteToStandalone(tx, candidate, category, user, duplicateCheck);
          }
          
          results.promoted.push({
            id: candidateId,
            candidate: promotionResult.candidate,
            action: promotionResult.action,
            message: promotionResult.message
          });
          
          results.summary.success++;

        } catch (error) {
          console.error(`조항 후보 ${candidateId} 승격 실패:`, error);
          results.failed.push({
            id: candidateId,
            error: error.message
          });
          results.summary.failed++;
        }
      }
    });

    const statusCode = results.summary.failed > 0 ? 207 : 200; // 207 Multi-Status

    return res.status(statusCode).json({
      message: `${results.summary.success}개 조항 후보가 승격되었습니다.`,
      results
    });

  } catch (error) {
    console.error('조항 승격 트랜잭션 실패:', error);
    return res.status(500).json({
      error: '조항 승격 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

/**
 * 기존 템플릿에 조항 추가로 승격
 */
async function promoteToTemplate(tx, candidate, templateId, user, duplicateCheck) {
  // 템플릿 존재 확인
  const template = await tx.contractTemplate.findUnique({
    where: { id: parseInt(templateId) }
  });

  if (!template) {
    throw new Error('지정된 템플릿을 찾을 수 없습니다.');
  }

  // 기존 템플릿의 조항 목록 가져오기
  const existingClauses = JSON.parse(template.clauses || '[]');
  
  // 새로운 조항 객체 생성
  const newClause = {
    id: `promoted_${candidate.id}`,
    contractCategory: candidate.contractCategory,
    clauseCategory: candidate.clauseCategory,
    content: candidate.content,
    confidence: candidate.confidence,
    importance: getImportanceLevel(candidate),
    tags: JSON.parse(candidate.tags || '[]'),
    analysis: {
      riskScore: calculateRiskScore(candidate),
      qualityScore: calculateQualityScore(candidate),
      promotedFrom: candidate.id,
      promotedAt: new Date(),
      promotedBy: user.id,
      duplicateInfo: duplicateCheck
    }
  };

  // 조항 목록에 추가
  const updatedClauses = [...existingClauses, newClause];

  // 템플릿 업데이트
  await tx.contractTemplate.update({
    where: { id: parseInt(templateId) },
    data: {
      clauses: JSON.stringify(updatedClauses),
      updatedAt: new Date()
    }
  });

  // 조항 후보 상태 업데이트
  const updatedCandidate = await tx.clauseCandidate.update({
    where: { id: candidate.id },
    data: {
      status: 'approved',
      reviewedAt: new Date()
    }
  });

  return {
    candidate: updatedCandidate,
    action: 'added_to_template',
    message: `템플릿 "${template.name}"에 조항이 추가되었습니다.`,
    templateId: parseInt(templateId)
  };
}

/**
 * 독립 템플릿으로 승격
 */
async function promoteToStandalone(tx, candidate, category, user, duplicateCheck) {
  const templateName = `${candidate.title} - 승격된 템플릿`;
  
  // 새로운 템플릿 생성
  const newTemplate = await tx.contractTemplate.create({
    data: {
      name: templateName,
      description: `조항 후보에서 승격된 템플릿: ${candidate.sourceContract}`,
      content: generateTemplateContent(candidate),
      category: category || candidate.contractCategory,
      variables: JSON.stringify(generateStandardVariables(candidate.content)),
      clauses: JSON.stringify([{
        id: `promoted_${candidate.id}`,
        contractCategory: candidate.contractCategory,
        clauseCategory: candidate.clauseCategory,
        content: candidate.content,
        confidence: candidate.confidence,
        importance: getImportanceLevel(candidate),
        tags: JSON.parse(candidate.tags || '[]'),
        analysis: {
          riskScore: calculateRiskScore(candidate),
          qualityScore: calculateQualityScore(candidate),
          promotedFrom: candidate.id,
          promotedAt: new Date(),
          promotedBy: user.id,
          duplicateInfo: duplicateCheck
        }
      }]),
      status: 'active',
      userId: user.id,
      type: 'promoted',
      confidence: candidate.confidence
    }
  });

  // 조항 후보 상태 업데이트
  const updatedCandidate = await tx.clauseCandidate.update({
    where: { id: candidate.id },
    data: {
      status: 'approved',
      reviewedAt: new Date()
    }
  });

  return {
    candidate: updatedCandidate,
    template: newTemplate,
    action: 'created_standalone_template',
    message: `독립 템플릿 "${templateName}"이 생성되었습니다.`
  };
}

/**
 * 중복 조항 확인
 */
async function checkForDuplicates(tx, candidate) {
  // 기존 템플릿들에서 유사한 조항 찾기
  const templates = await tx.contractTemplate.findMany({
    where: {
      status: 'active',
      category: candidate.contractCategory
    },
    select: {
      id: true,
      name: true,
      clauses: true
    }
  });

  const duplicates = [];
  const similarityThreshold = 0.8;

  templates.forEach(template => {
    const clauses = JSON.parse(template.clauses || '[]');
    clauses.forEach(clause => {
      const similarity = calculateTextSimilarity(candidate.content, clause.content);
      if (similarity >= similarityThreshold) {
        duplicates.push({
          templateId: template.id,
          templateName: template.name,
          clauseId: clause.id,
          similarity: Math.round(similarity * 100)
        });
      }
    });
  });

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
    similarityThreshold: Math.round(similarityThreshold * 100)
  };
}

/**
 * 조항 품질 점수 계산
 */
function calculateQualityScore(candidate) {
  let score = 0;
  
  // 신뢰도 (40%)
  score += (candidate.confidence || 0) * 40;
  
  // 내용 길이 (20%)
  const contentLength = candidate.content?.length || 0;
  const lengthScore = Math.min(contentLength / 300, 1) * 20;
  score += lengthScore;
  
  // 변수 존재 여부 (20%)
  const variables = JSON.parse(candidate.variables || '[]');
  const hasVariables = variables.length > 0;
  score += hasVariables ? 20 : 0;
  
  // 카테고리 명확성 (20%)
  const categoryScore = candidate.contractCategory && candidate.contractCategory !== 'general' ? 20 : 10;
  score += categoryScore;

  return Math.round(score);
}

/**
 * 리스크 점수 계산
 */
function calculateRiskScore(candidate) {
  const content = candidate.content.toLowerCase();
  let riskScore = 0;
  
  // 고위험 키워드
  const highRiskKeywords = ['손해배상', '책임', '면책', '위반', '해지', '분쟁', '소송'];
  const mediumRiskKeywords = ['변경', '수정', '추가', '기준', '요구사항'];
  
  highRiskKeywords.forEach(keyword => {
    if (content.includes(keyword)) riskScore += 3;
  });
  
  mediumRiskKeywords.forEach(keyword => {
    if (content.includes(keyword)) riskScore += 1;
  });
  
  return Math.min(riskScore, 10);
}

/**
 * 중요도 레벨 계산
 */
function getImportanceLevel(candidate) {
  const riskScore = calculateRiskScore(candidate);
  const confidence = candidate.confidence || 0;
  
  if (riskScore >= 7 || confidence >= 0.9) return 'high';
  if (riskScore >= 4 || confidence >= 0.7) return 'medium';
  return 'low';
}

/**
 * 템플릿 내용 생성
 */
function generateTemplateContent(candidate) {
  return `# ${candidate.title}

## 주요 조항

${candidate.content}

---
*이 템플릿은 조항 후보에서 자동 생성되었습니다.*
*원본: ${candidate.sourceContract}*`;
}

/**
 * 표준 변수 생성
 */
function generateStandardVariables(content) {
  const variables = [];
  
  // 기본 변수들 추가
  if (content.includes('갑') || content.includes('발주자')) {
    variables.push({
      name: 'CLIENT_NAME',
      type: 'text',
      required: true,
      description: '발주자명',
      category: 'basic'
    });
  }
  
  if (content.includes('을') || content.includes('수급자')) {
    variables.push({
      name: 'PROVIDER_NAME',
      type: 'text',
      required: true,
      description: '수급자명',
      category: 'basic'
    });
  }
  
  if (content.includes('금액') || content.includes('대금')) {
    variables.push({
      name: 'CONTRACT_AMOUNT',
      type: 'number',
      required: true,
      description: '계약 금액',
      category: 'financial'
    });
  }
  
  return variables;
}

/**
 * 텍스트 유사도 계산 (Jaccard 유사도)
 */
function calculateTextSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}