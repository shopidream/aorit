import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: '지원하지 않는 메소드입니다.' });
    }

    const { type = 'overview', period = '30d' } = req.query;

    switch (type) {
      case 'overview':
        return await getOverviewStats(req, res, period);
      case 'templates':
        return await getTemplateStats(req, res, period);
      case 'clauses':
        return await getClauseStats(req, res, period);
      case 'contracts':
        return await getContractStats(req, res, period);
      case 'performance':
        return await getPerformanceStats(req, res, period);
      default:
        return res.status(400).json({ error: '지원하지 않는 통계 타입입니다.' });
    }
  } catch (error) {
    console.error('Statistics API 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

// 전체 개요 통계
async function getOverviewStats(req, res, period) {
  const dateFilter = getDateFilter(period);

  const [
    templateStats,
    clauseStats,
    contractStats,
    userStats
  ] = await Promise.all([
    getTemplateOverview(dateFilter),
    getClauseOverview(dateFilter),
    getContractOverview(dateFilter),
    getUserOverview(dateFilter)
  ]);

  return res.status(200).json({
    period,
    templates: templateStats,
    clauses: clauseStats,
    contracts: contractStats,
    users: userStats,
    generatedAt: new Date()
  });
}

// 템플릿 통계
async function getTemplateStats(req, res, period) {
  const dateFilter = getDateFilter(period);

  const stats = await Promise.all([
    // 템플릿 사용 빈도
    prisma.contractTemplate.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        _count: {
          select: {
            contracts: true
          }
        }
      },
      orderBy: {
        contracts: {
          _count: 'desc'
        }
      },
      take: 10
    }),

    // 카테고리별 템플릿 분포
    prisma.contractTemplate.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    }),

    // 최근 생성된 템플릿
    prisma.contractTemplate.findMany({
      where: dateFilter,
      select: {
        id: true,
        name: true,
        category: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })
  ]);

  return res.status(200).json({
    period,
    mostUsed: stats[0],
    categoryDistribution: stats[1],
    recentlyCreated: stats[2],
    generatedAt: new Date()
  });
}

// 조항 통계
async function getClauseStats(req, res, period) {
  const dateFilter = getDateFilter(period);

  const stats = await Promise.all([
    // 조항 상태별 분포
    prisma.clause.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    }),

    // 카테고리별 조항 분포
    prisma.clause.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    }),

    // 후보 조항 중 고신뢰도
    prisma.clause.count({
      where: {
        status: 'candidate',
        confidence: {
          gte: 0.8
        }
      }
    }),

    // 최근 승진된 조항
    prisma.clause.findMany({
      where: {
        status: 'active',
        reviewedAt: dateFilter.createdAt
      },
      select: {
        id: true,
        category: true,
        confidence: true,
        reviewedAt: true
      },
      orderBy: {
        reviewedAt: 'desc'
      },
      take: 10
    })
  ]);

  return res.status(200).json({
    period,
    statusDistribution: stats[0],
    categoryDistribution: stats[1],
    highConfidenceCandidates: stats[2],
    recentlyPromoted: stats[3],
    generatedAt: new Date()
  });
}

// 계약서 통계
async function getContractStats(req, res, period) {
  const dateFilter = getDateFilter(period);

  const stats = await Promise.all([
    // 계약서 생성 추세
    prisma.contract.groupBy({
      by: ['createdAt'],
      where: dateFilter,
      _count: {
        id: true
      }
    }),

    // 상태별 계약서 분포
    prisma.contract.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    }),

    // 템플릿 vs AI 생성 비율
    prisma.contract.groupBy({
      by: ['templateId'],
      _count: {
        id: true
      }
    }),

    // 서명 완료율
    prisma.contract.aggregate({
      _count: {
        id: true
      },
      where: {
        status: 'signed'
      }
    })
  ]);

  const aiGenerated = stats[2].find(item => item.templateId === null)?._count.id || 0;
  const templateGenerated = stats[2].reduce((sum, item) => {
    return item.templateId ? sum + item._count.id : sum;
  }, 0);

  return res.status(200).json({
    period,
    creationTrend: stats[0],
    statusDistribution: stats[1],
    generationMethod: {
      ai: aiGenerated,
      template: templateGenerated,
      total: aiGenerated + templateGenerated
    },
    signedCount: stats[3]._count.id,
    generatedAt: new Date()
  });
}

// 성능 통계
async function getPerformanceStats(req, res, period) {
  const dateFilter = getDateFilter(period);

  // AI 생성 성능 분석
  const aiContracts = await prisma.contract.findMany({
    where: {
      ...dateFilter,
      templateId: null // AI 생성
    },
    select: {
      id: true,
      createdAt: true,
      metadata: true
    }
  });

  // 템플릿 생성 성능 분석
  const templateContracts = await prisma.contract.findMany({
    where: {
      ...dateFilter,
      templateId: {
        not: null
      }
    },
    select: {
      id: true,
      createdAt: true,
      templateId: true,
      metadata: true
    }
  });

  // 평균 생성 시간 계산
  const avgAiTime = calculateAverageProcessingTime(aiContracts);
  const avgTemplateTime = calculateAverageProcessingTime(templateContracts);

  return res.status(200).json({
    period,
    aiGeneration: {
      count: aiContracts.length,
      averageTime: avgAiTime,
      successRate: calculateSuccessRate(aiContracts)
    },
    templateGeneration: {
      count: templateContracts.length,
      averageTime: avgTemplateTime,
      successRate: calculateSuccessRate(templateContracts)
    },
    comparison: {
      speedImprovement: avgAiTime > 0 ? ((avgAiTime - avgTemplateTime) / avgAiTime * 100) : 0,
      preferredMethod: templateContracts.length > aiContracts.length ? 'template' : 'ai'
    },
    generatedAt: new Date()
  });
}

// 유틸리티 함수들
function getDateFilter(period) {
  const now = new Date();
  let startDate;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return {
    createdAt: {
      gte: startDate
    }
  };
}

async function getTemplateOverview(dateFilter) {
  const [total, active, recentlyCreated] = await Promise.all([
    prisma.contractTemplate.count(),
    prisma.contractTemplate.count({ where: { status: 'active' } }),
    prisma.contractTemplate.count({ where: dateFilter })
  ]);

  return { total, active, recentlyCreated };
}

async function getClauseOverview(dateFilter) {
  const [total, candidates, active, rejected] = await Promise.all([
    prisma.clause.count(),
    prisma.clause.count({ where: { status: 'candidate' } }),
    prisma.clause.count({ where: { status: 'active' } }),
    prisma.clause.count({ where: { status: 'rejected' } })
  ]);

  return { total, candidates, active, rejected };
}

async function getContractOverview(dateFilter) {
  const [total, recent, signed] = await Promise.all([
    prisma.contract.count(),
    prisma.contract.count({ where: dateFilter }),
    prisma.contract.count({ where: { status: 'signed' } })
  ]);

  return { total, recent, signed };
}

async function getUserOverview(dateFilter) {
  const [total, recent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: dateFilter })
  ]);

  return { total, recent };
}

function calculateAverageProcessingTime(contracts) {
  if (contracts.length === 0) return 0;

  const times = contracts
    .map(contract => contract.metadata?.processingTime)
    .filter(time => time && typeof time === 'number');

  if (times.length === 0) return 0;

  return times.reduce((sum, time) => sum + time, 0) / times.length;
}

function calculateSuccessRate(contracts) {
  if (contracts.length === 0) return 0;

  const successful = contracts.filter(contract => 
    !contract.metadata?.error && contract.metadata?.status !== 'failed'
  ).length;

  return (successful / contracts.length) * 100;
}