// pages/api/admin/usage-overview.js - 사용량 통계 API (username 제거)
import { verifyToken } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // JWT 토큰에서 사용자 ID 가져오기
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // 사용자 정보 조회 및 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 전체 통계 조회
    const [
      totalUsers,
      totalServices,
      totalQuotes,
      totalContracts,
      usersWithActivity
    ] = await Promise.all([
      // 총 회원수
      prisma.user.count(),
      
      // 총 서비스수
      prisma.service.count(),
      
      // 총 견적서수
      prisma.quote.count(),
      
      // 총 계약서수
      prisma.contract.count(),
      
      // 활동이 있는 사용자 (서비스, 견적서, 계약서 중 하나라도 있는 사용자)
      prisma.user.count({
        where: {
          OR: [
            { services: { some: {} } },
            { quotes: { some: {} } },
            { contracts: { some: {} } }
          ]
        }
      })
    ]);

    // 평균 계산
    const avgServicesPerUser = totalUsers > 0 ? totalServices / totalUsers : 0;
    const avgQuotesPerUser = totalUsers > 0 ? totalQuotes / totalUsers : 0;
    const avgContractsPerUser = totalUsers > 0 ? totalContracts / totalUsers : 0;

    // 모든 사용자와 그들의 사용량 조회
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        services: {
          select: { id: true }
        },
        quotes: {
          select: { id: true }
        },
        contracts: {
          select: { id: true }
        }
      }
    });

    // 중사용자 필터링 (서비스 15개 이상 또는 견적서 30개 이상 또는 계약서 15개 이상)
    const heavyUsers = allUsers.filter(user => {
      const servicesCount = user.services.length;
      const quotesCount = user.quotes.length;
      const contractsCount = user.contracts.length;
      
      return servicesCount >= 15 || quotesCount >= 30 || contractsCount >= 15;
    });

    // 중사용자 데이터 변환 및 정렬
    const heavyUsersFormatted = heavyUsers
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        servicesCount: user.services.length,
        quotesCount: user.quotes.length,
        contractsCount: user.contracts.length
      }))
      .sort((a, b) => {
        // 총 사용량 기준으로 정렬
        const totalA = a.servicesCount + a.quotesCount + a.contractsCount;
        const totalB = b.servicesCount + b.quotesCount + b.contractsCount;
        return totalB - totalA;
      });

    // 통계 데이터
    const stats = {
      totalUsers,
      activeUsers: usersWithActivity,
      totalServices,
      totalQuotes,
      totalContracts,
      avgServicesPerUser,
      avgQuotesPerUser,
      avgContractsPerUser
    };

    res.status(200).json({
      success: true,
      stats,
      heavyUsers: heavyUsersFormatted
    });

  } catch (error) {
    console.error('Usage overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}