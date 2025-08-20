// pages/api/portfolio/[id].js - 개별 포트폴리오 API
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

export default async function handler(req, res) {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }

  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { title, description, link, imageUrl, order } = req.body;
    
    try {
      const portfolio = await prisma.portfolio.update({
        where: { 
          id: parseInt(id),
          userId: user.id 
        },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(link !== undefined && { link }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(order !== undefined && { order })
        }
      });
      
      res.status(200).json(portfolio);
    } catch (error) {
      res.status(500).json({ error: '포트폴리오 수정 실패' });
    }
  }

  else if (req.method === 'DELETE') {
    try {
      await prisma.portfolio.delete({
        where: { 
          id: parseInt(id),
          userId: user.id 
        }
      });
      
      res.status(200).json({ message: '포트폴리오가 삭제되었습니다' });
    } catch (error) {
      res.status(500).json({ error: '포트폴리오 삭제 실패' });
    }
  }

  else {
    res.status(405).json({ error: '허용되지 않는 메소드' });
  }
}