import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '../../../../lib/auth';

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
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: '지원하지 않는 메소드입니다.' });
    }
  } catch (error) {
    console.error('Clause Candidates API 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

// GET: 조항 후보 목록 조회
async function handleGet(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    contractCategory,  // category → contractCategory 변경
    clauseCategory,    // 새로 추가
    status = 'pending',
    minConfidence = 0.5,
    sortBy = 'createdAt',
    order = 'desc',
    search
  } = req.query;
  
  const where = {};
  
  // 상태 필터
  if (status && status !== 'all') {
    where.status = status;
  }
  
  // 계약서 카테고리 필터
  if (contractCategory && contractCategory !== 'all') {
    where.contractCategory = contractCategory;
  }
  
  // 조항 카테고리 필터
  if (clauseCategory && clauseCategory !== 'all') {
    where.clauseCategory = clauseCategory;
  }
  
  // 신뢰도 필터
  if (minConfidence) {
    where.confidence = {
      gte: parseFloat(minConfidence)
    };
  }
  
  // 검색 필터
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
      { sourceContract: { contains: search } }
    ];
  }

  // 정렬 옵션
  const orderBy = {};
  if (sortBy === 'confidence') {
    orderBy.confidence = order;
  } else if (sortBy === 'createdAt') {
    orderBy.createdAt = order;
  } else if (sortBy === 'title') {
    orderBy.title = order;
  } else {
    orderBy.createdAt = 'desc';
  }

  const candidates = await prisma.clauseCandidate.findMany({
    where,
    select: {
      id: true,
      title: true,
      content: true,
      contractCategory: true,  // 새 필드
      clauseCategory: true,    // 새 필드
      confidence: true,
      status: true,
      needsReview: true,
      sourceContract: true,
      tags: true,
      variables: true,
      createdAt: true,
      reviewedAt: true
    },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
    orderBy
  });

  const total = await prisma.clauseCandidate.count({ where });

  // 통계 정보 생성
  const stats = await getClauseCandidateStats();
  
  // 데이터 가공
  const processedCandidates = candidates.map(candidate => ({
    ...candidate,
    preview: candidate.content.length > 150 
      ? candidate.content.substring(0, 150) + '...' 
      : candidate.content,
    tags: parseJsonField(candidate.tags),
    variables: parseJsonField(candidate.variables),
    riskLevel: calculateRiskLevel(candidate),
    recommendation: generateRecommendation(candidate),
    timeAgo: getTimeAgo(candidate.createdAt)
  }));
  
  return res.status(200).json({
    candidates: processedCandidates,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    },
    stats
  });
}

// PUT: 조항 후보 수정 (검토 결과 업데이트)
async function handlePut(req, res) {
  const { id } = req.query;
  const { 
    status, 
    needsReview, 
    title, 
    content, 
    contractCategory,  // 새 필드
    clauseCategory,    // 새 필드
    reviewNote 
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: '조항 후보 ID가 필요합니다.' });
  }

  try {
    const updateData = {};
    
    if (status) updateData.status = status;
    if (needsReview !== undefined) updateData.needsReview = needsReview;
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (contractCategory) updateData.contractCategory = contractCategory;
    if (clauseCategory) updateData.clauseCategory = clauseCategory;
    
    // 검토 완료 시 검토 시간 업데이트
    if (status && status !== 'pending') {
      updateData.reviewedAt = new Date();
    }

    const candidate = await prisma.clauseCandidate.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // 검토 로그 생성 (필요시)
    if (reviewNote) {
      await logReviewAction(parseInt(id), status, reviewNote);
    }

    return res.status(200).json({
      message: '조항 후보가 업데이트되었습니다.',
      candidate
    });

  } catch (error) {
    console.error('조항 후보 업데이트 오류:', error);
    return res.status(500).json({
      error: '업데이트 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// DELETE: 조항 후보 삭제
async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: '조항 후보 ID가 필요합니다.' });
  }

  try {
    const candidate = await prisma.clauseCandidate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!candidate) {
      return res.status(404).json({ error: '조항 후보를 찾을 수 없습니다.' });
    }

    await prisma.clauseCandidate.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({
      message: '조항 후보가 삭제되었습니다.',
      deletedId: parseInt(id)
    });

  } catch (error) {
    console.error('조항 후보 삭제 오류:', error);
    return res.status(500).json({
      error: '삭제 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

/**
 * 조항 후보 통계 생성
 */
async function getClauseCandidateStats() {
  const totalCandidates = await prisma.clauseCandidate.count();

  const statusCounts = await prisma.clauseCandidate.groupBy({
    by: ['status'],
    _count: {
      id: true
    }
  });

  const contractCategoryCounts = await prisma.clauseCandidate.groupBy({
    by: ['contractCategory'],
    _count: {
      id: true
    }
  });

  const clauseCategoryCounts = await prisma.clauseCandidate.groupBy({
    by: ['clauseCategory'],
    _count: {
      id: true
    },
    where: {
      clauseCategory: { not: null }
    }
  });

  const highConfidenceCandidates = await prisma.clauseCandidate.count({
    where: { 
      confidence: { gte: 0.8 }
    }
  });

  const autoApprovalCandidates = await prisma.clauseCandidate.count({
    where: { 
      confidence: { gte: 0.85 },
      status: 'pending',
      needsReview: false
    }
  });

  const needsReviewCount = await prisma.clauseCandidate.count({
    where: { needsReview: true }
  });

  const avgConfidence = await prisma.clauseCandidate.aggregate({
    _avg: {
      confidence: true
    }
  });

  // 최근 7일간 생성된 후보
  const recentCandidates = await prisma.clauseCandidate.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  });

  return {
    total: totalCandidates,
    byStatus: statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {}),
    byContractCategory: contractCategoryCounts.reduce((acc, item) => {
      acc[item.contractCategory] = item._count.id;
      return acc;
    }, {}),
    byClauseCategory: clauseCategoryCounts.reduce((acc, item) => {
      acc[item.clauseCategory] = item._count.id;
      return acc;
    }, {}),
    highConfidence: highConfidenceCandidates,
    autoApprovalReady: autoApprovalCandidates,
    needsReview: needsReviewCount,
    averageConfidence: avgConfidence._avg.confidence || 0,
    recentlyAdded: recentCandidates
  };
}

/**
 * 위험도 계산
 */
function calculateRiskLevel(candidate) {
  const confidence = candidate.confidence || 0;
  const needsReview = candidate.needsReview;
  
  // 검토 필요 플래그가 있으면 고위험
  if (needsReview) return 'high';
  
  // 신뢰도 기반 위험도
  if (confidence >= 0.85) return 'low';
  if (confidence >= 0.65) return 'medium';
  
  return 'high';
}

/**
 * 추천사항 생성
 */
function generateRecommendation(candidate) {
  const confidence = candidate.confidence || 0;
  const riskLevel = calculateRiskLevel(candidate);
  const needsReview = candidate.needsReview;
  
  if (riskLevel === 'low' && !needsReview && confidence >= 0.85) {
    return {
      action: 'auto_approve',
      reason: '고신뢰도 자동 승인 가능',
      priority: 'high',
      color: 'green'
    };
  }
  
  if (riskLevel === 'medium' && confidence >= 0.7) {
    return {
      action: 'review',
      reason: '적절한 신뢰도이나 추가 검토 권장',
      priority: 'medium',
      color: 'yellow'
    };
  }
  
  if (needsReview || confidence < 0.6) {
    return {
      action: 'reject',
      reason: '낮은 신뢰도 또는 검토 필요',
      priority: 'high',
      color: 'red'
    };
  }
  
  return {
    action: 'review',
    reason: '추가 분석 필요',
    priority: 'medium',
    color: 'gray'
  };
}

/**
 * JSON 필드 파싱 헬퍼
 */
function parseJsonField(jsonString) {
  try {
    return jsonString ? JSON.parse(jsonString) : [];
  } catch (error) {
    console.error('JSON 파싱 오류:', error);
    return [];
  }
}

/**
 * 시간 경과 계산
 */
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return '방금 전';
}

/**
 * 검토 액션 로그 (추후 확장용)
 */
async function logReviewAction(candidateId, action, note) {
  // 필요시 별도 로그 테이블에 기록
  console.log(`조항 후보 ${candidateId}: ${action} - ${note}`);
}