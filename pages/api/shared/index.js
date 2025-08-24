// pages/api/shared/index.js - 공유 링크 히스토리 조회 API
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: '인증이 필요합니다' });
    }

    // 사용자의 공유 링크 목록 조회
    const sharedServices = await prisma.sharedService.findMany({
      where: {
        userId: user.id
      },
      include: {
        services: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: {
            services: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 응답 데이터 가공
    const formattedLinks = sharedServices.map(link => ({
      id: link.id,
      token: link.token,
      title: link.title,
      description: link.description,
      shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/shared/${link.token}`,
      serviceCount: link._count.services,
      services: link.services,
      createdAt: link.createdAt,
      isActive: link.isActive
    }));

    return res.status(200).json({
      success: true,
      links: formattedLinks
    });

  } catch (error) {
    console.error('공유 링크 조회 실패:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  } finally {
    await prisma.$disconnect();
  }
}