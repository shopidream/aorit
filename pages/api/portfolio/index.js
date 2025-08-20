// pages/api/portfolio/index.js - 포트폴리오 API
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

export default async function handler(req, res) {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }

  if (req.method === 'GET') {
    try {
      const portfolio = await prisma.portfolio.findMany({
        where: { userId: user.id },
        orderBy: { order: 'asc' }
      });
      
      res.status(200).json(portfolio);
    } catch (error) {
      res.status(500).json({ error: '포트폴리오 조회 실패' });
    }
  }

  else if (req.method === 'POST') {
    const { title, description, link, imageUrl } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: '제목은 필수입니다' });
    }

    try {
      // 마지막 순서 조회
      const lastItem = await prisma.portfolio.findFirst({
        where: { userId: user.id },
        orderBy: { order: 'desc' }
      });

      const portfolio = await prisma.portfolio.create({
        data: {
          userId: user.id,
          title,
          description,
          link,
          imageUrl,
          order: (lastItem?.order || 0) + 1
        }
      });
      
      res.status(201).json(portfolio);
    } catch (error) {
      res.status(500).json({ error: '포트폴리오 등록 실패' });
    }
  }

  else {
    res.status(405).json({ error: '허용되지 않는 메소드' });
  }
}