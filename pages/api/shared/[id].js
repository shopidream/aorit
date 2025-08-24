// pages/api/shared/[id].js - 공유 링크 삭제 API
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'DELETE 메소드만 지원합니다' });
  }

  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: '인증이 필요합니다' });
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: '링크 ID가 필요합니다' });
    }

    // 링크 존재 및 소유권 확인
    const sharedLink = await prisma.sharedService.findFirst({
      where: {
        id: parseInt(id),
        userId: user.id
      }
    });

    if (!sharedLink) {
      return res.status(404).json({ error: '링크를 찾을 수 없거나 권한이 없습니다' });
    }

    // 링크 삭제
    await prisma.sharedService.delete({
      where: {
        id: parseInt(id)
      }
    });

    return res.status(200).json({
      success: true,
      message: '링크가 성공적으로 삭제되었습니다'
    });

  } catch (error) {
    console.error('링크 삭제 API 오류:', error);
    return res.status(500).json({
      error: '서버 내부 오류가 발생했습니다',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}