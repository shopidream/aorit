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
    console.error('Clause Reject API 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

// POST: 조항 후보 거부 또는 삭제
async function handlePost(req, res, user) {
  const { 
    candidateIds, 
    reason = '', 
    deleteCompletely = false,
    rejectionCategory = 'other',
    blockSimilar = false // 유사한 조항도 자동 차단할지 여부
  } = req.body;

  if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    return res.status(400).json({ 
      error: '거부할 조항 후보 ID 목록이 필요합니다.' 
    });
  }

  if (!reason.trim() && !deleteCompletely) {
    return res.status(400).json({
      error: '거부 사유를 입력해주세요.'
    });
  }

  const results = {
    rejected: [],
    failed: [],
    blocked: [], // 유사한 조항들이 차단된 경우
    summary: {
      total: candidateIds.length,
      success: 0,
      failed: 0,
      blocked: 0
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

          if (candidate.status !== 'pending') {
            results.failed.push({
              id: candidateId,
              error: '이미 처리된 조항 후보입니다.',
              currentStatus: candidate.status
            });
            continue;
          }

          // 조항 후보 거부/삭제 처리
          const rejectionResult = await rejectClauseCandidate(
            tx, 
            candidate, 
            reason, 
            deleteCompletely, 
            rejectionCategory,
            user
          );
          
          results.rejected.push({
            id: candidateId,
            candidate: rejectionResult.candidate,
            action: rejectionResult.action,
            message: rejectionResult.message
          });
          
          results.summary.success++;

          // 유사한 조항들도 자동 차단하는 경우
          if (blockSimilar && !deleteCompletely) {
            const blockedSimilar = await blockSimilarCandidates(
              tx, 
              candidate, 
              reason, 
              user
            );
            
            if (blockedSimilar.length > 0) {
              results.blocked.push(...blockedSimilar);
              results.summary.blocked += blockedSimilar.length;
            }
          }

        } catch (error) {
          console.error(`조항 후보 ${candidateId} 거부 실패:`, error);
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
      message: `${results.summary.success}개 조항 후보가 처리되었습니다.`,
      results
    });

  } catch (error) {
    console.error('조항 거부 트랜잭션 실패:', error);
    return res.status(500).json({
      error: '조항 거부 처리 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

/**
 * 조항 후보 거부/삭제 로직
 */
async function rejectClauseCandidate(tx, candidate, reason, deleteCompletely, rejectionCategory, user) {
  if (deleteCompletely) {
    // 완전 삭제
    await tx.clauseCandidate.delete({
      where: { id: candidate.id }
    });
    
    // 삭제 로그 기록
    await logClauseRejection(candidate.id, 'deleted', reason, candidate, user);
    
    return { 
      candidate: { 
        id: candidate.id, 
        status: 'deleted',
        deletedAt: new Date()
      },
      action: 'deleted',
      message: '조항 후보가 완전히 삭제되었습니다.'
    };
  } else {
    // 거부 상태로 변경
    const rejectedCandidate = await tx.clauseCandidate.update({
      where: { id: candidate.id },
      data: {
        status: 'rejected',
        needsReview: false,
        reviewedAt: new Date()
      }
    });

    // 거부 정보를 별도 테이블에 저장 (향후 학습용)
    await saveRejectionInfo(tx, candidate, reason, rejectionCategory, user);

    // 거부 로그 기록
    await logClauseRejection(candidate.id, 'rejected', reason, rejectedCandidate, user);

    return {
      candidate: rejectedCandidate,
      action: 'rejected',
      message: '조항 후보가 거부되었습니다.'
    };
  }
}

/**
 * 유사한 조항 후보들 자동 차단
 */
async function blockSimilarCandidates(tx, rejectedCandidate, reason, user) {
  const similarCandidates = await tx.clauseCandidate.findMany({
    where: {
      id: { not: rejectedCandidate.id },
      status: 'pending',
      category: rejectedCandidate.category
    }
  });

  const blocked = [];
  const similarityThreshold = 0.75;

  for (const candidate of similarCandidates) {
    const similarity = calculateTextSimilarity(
      rejectedCandidate.content, 
      candidate.content
    );

    if (similarity >= similarityThreshold) {
      const blockedCandidate = await tx.clauseCandidate.update({
        where: { id: candidate.id },
        data: {
          status: 'rejected',
          needsReview: false,
          reviewedAt: new Date()
        }
      });

      // 자동 차단 정보 저장
      await saveRejectionInfo(
        tx, 
        candidate, 
        `자동 차단: 거부된 조항과 ${Math.round(similarity * 100)}% 유사`, 
        'auto_blocked',
        user
      );

      blocked.push({
        id: candidate.id,
        title: candidate.title,
        similarity: Math.round(similarity * 100),
        reason: '유사성으로 인한 자동 차단'
      });
    }
  }

  return blocked;
}

/**
 * 거부 정보를 별도로 저장 (학습 및 통계용)
 */
async function saveRejectionInfo(tx, candidate, reason, category, user) {
  // 실제 구현에서는 별도의 RejectionLog 테이블을 만들어 사용
  // 현재는 콘솔 로그로만 처리
  const rejectionInfo = {
    candidateId: candidate.id,
    title: candidate.title,
    category: candidate.category,
    confidence: candidate.confidence,
    sourceContract: candidate.sourceContract,
    reason: reason,
    rejectionCategory: category,
    rejectedBy: user.id,
    rejectedAt: new Date(),
    metadata: {
      contentLength: candidate.content.length,
      hasVariables: candidate.variables ? JSON.parse(candidate.variables).length > 0 : false,
      originalTags: candidate.tags ? JSON.parse(candidate.tags) : []
    }
  };

  console.log('거부 정보 저장:', rejectionInfo);
  
  // 향후 확장: RejectionLog 테이블에 저장
  // await tx.rejectionLog.create({ data: rejectionInfo });
}

/**
 * 거부 사유 자동 분류
 */
function categorizeRejectionReason(reason) {
  const reasonLower = reason.toLowerCase();
  
  const categories = {
    legal_issue: ['법적', '위법', '불법', 'illegal', 'legal'],
    duplicate: ['중복', '중복된', 'duplicate', '같은', '동일'],
    quality_issue: ['품질', '낮은', 'quality', '부정확', '오류'],
    relevance_issue: ['관련성', '무관한', 'irrelevant', '적합하지'],
    format_issue: ['형식', '포맷', 'format', '구조'],
    content_issue: ['내용', '부적절', 'inappropriate', '불완전'],
    confidence_low: ['신뢰도', '확신', 'confidence', '불확실'],
    auto_blocked: ['자동', 'auto', '유사성']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => reasonLower.includes(keyword))) {
      return category;
    }
  }
  
  return 'other';
}

/**
 * 거부 로그 기록
 */
async function logClauseRejection(candidateId, action, reason, candidateData, user) {
  const logEntry = {
    candidateId,
    action, // 'rejected' 또는 'deleted'
    reason,
    rejectedAt: new Date(),
    rejectedBy: user.id,
    metadata: {
      originalCategory: candidateData.category,
      originalConfidence: candidateData.confidence,
      sourceContract: candidateData.sourceContract,
      rejectionCategory: categorizeRejectionReason(reason),
      contentPreview: candidateData.content?.substring(0, 100) + '...'
    }
  };

  console.log(`조항 후보 ${action} 완료: ${candidateId}`, logEntry);
  
  // 거부 통계 업데이트
  await updateRejectionStats(logEntry);
}

/**
 * 거부 통계 업데이트
 */
async function updateRejectionStats(logEntry) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const stats = {
      date: today,
      action: logEntry.action,
      category: logEntry.metadata.rejectionCategory,
      originalCategory: logEntry.metadata.originalCategory,
      confidence: logEntry.metadata.originalConfidence,
      source: logEntry.metadata.sourceContract
    };
    
    // 실제 구현에서는 별도 통계 테이블에 저장
    console.log('거부 통계 업데이트:', stats);
    
    // 향후 확장: 일별/월별 거부 통계 관리
    // await updateDailyRejectionStats(stats);
    
  } catch (error) {
    console.error('거부 통계 업데이트 실패:', error);
  }
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

/**
 * 거부 패턴 분석 (향후 AI 학습용)
 */
function analyzeRejectionPattern(candidate, reason) {
  return {
    contentLength: candidate.content.length,
    confidence: candidate.confidence,
    category: candidate.category,
    hasVariables: candidate.variables ? JSON.parse(candidate.variables).length > 0 : false,
    sourceType: candidate.sourceContract?.includes('template') ? 'template' : 'upload',
    reasonPattern: categorizeRejectionReason(reason),
    keywordDensity: calculateKeywordDensity(candidate.content)
  };
}

/**
 * 키워드 밀도 계산
 */
function calculateKeywordDensity(content) {
  const legalKeywords = ['계약', '조항', '책임', '의무', '권리', '손해', '배상'];
  const words = content.toLowerCase().split(/\s+/);
  const keywordCount = words.filter(word => 
    legalKeywords.some(keyword => word.includes(keyword))
  ).length;
  
  return words.length > 0 ? keywordCount / words.length : 0;
}