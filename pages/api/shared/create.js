// pages/api/shared/create.js - 공유 링크 생성 API
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '../../../lib/auth';
import crypto from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: '인증이 필요합니다' });
    }

    const { serviceIds, title, description } = req.body;

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ error: '서비스를 선택해주세요' });
    }

    // 사용자 소유 서비스인지 확인
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        userId: user.id,
        isActive: true
      }
    });

    if (services.length !== serviceIds.length) {
      return res.status(403).json({ error: '유효하지 않은 서비스가 포함되어 있습니다' });
    }

    // 고유 토큰 생성
    const token = crypto.randomBytes(16).toString('hex');

    // 공유 링크 생성
    const sharedService = await prisma.sharedService.create({
      data: {
        userId: user.id,
        token,
        title: title || `${user.name}의 서비스`,
        description: description || '전문적인 서비스를 제공합니다',
        services: {
          connect: serviceIds.map(id => ({ id }))
        }
      }
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/shared/${token}`;

    return res.status(201).json({
      success: true,
      shareUrl,
      token,
      expiresAt: null
    });

  } catch (error) {
    console.error('공유 링크 생성 실패:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  } finally {
    await prisma.$disconnect();
  }
}