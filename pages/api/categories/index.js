import { verifyToken } from '../../../lib/auth';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // JWT 토큰에서 사용자 ID 가져오기
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }

    let userId;
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
      console.log('카테고리 API - 인증된 사용자 ID:', userId);
    } catch (error) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    if (req.method === 'GET') {
      // 실제 DB에서 카테고리 가져오기 (서비스 개수 포함)
      const categories = await prisma.serviceCategory.findMany({
        where: { userId: user.id },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
          order: true,
          contractTitle: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              services: true
            }
          }
        }
      });

      console.log('카테고리 API - 찾은 카테고리 개수:', categories.length);
      
      return res.status(200).json(categories);
    }

    if (req.method === 'POST') {
      const { id, name, type, contractTitle } = req.body;
      
      if (!id || !name || !type) {
        return res.status(400).json({ error: '필수 필드가 누락되었습니다' });
      }

      // 새 카테고리 생성
      const newCategory = await prisma.serviceCategory.create({
        data: {
          id: id,
          userId: user.id,
          name: name,
          type: type,
          contractTitle: contractTitle || `${name} 서비스 계약서`,
          order: 0, // 기본값
          isActive: true
        }
      });

      return res.status(201).json(newCategory);
    }

    if (req.method === 'DELETE') {
      const { categoryId } = req.body;
      
      if (!categoryId) {
        return res.status(400).json({ error: '카테고리 ID가 필요합니다' });
      }

      // 카테고리에 속한 서비스 개수 확인
      const serviceCount = await prisma.service.count({
        where: {
          categoryId: categoryId,
          userId: user.id
        }
      });

      if (serviceCount > 0) {
        return res.status(400).json({ 
          error: `이 카테고리에 ${serviceCount}개의 서비스가 있어 삭제할 수 없습니다. 먼저 서비스를 다른 카테고리로 이동하거나 삭제해주세요.`,
          serviceCount: serviceCount
        });
      }

      // 카테고리 삭제 (해당 사용자 소유인지 확인)
      const deletedCategory = await prisma.serviceCategory.deleteMany({
        where: {
          id: categoryId,
          userId: user.id
        }
      });

      if (deletedCategory.count === 0) {
        return res.status(404).json({ error: '카테고리를 찾을 수 없습니다' });
      }

      return res.status(200).json({ success: true, message: '카테고리가 삭제되었습니다' });
    }

    return res.status(405).json({ error: '허용되지 않은 메서드입니다' });

  } catch (error) {
    console.error('카테고리 API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  } finally {
    await prisma.$disconnect();
  }
}