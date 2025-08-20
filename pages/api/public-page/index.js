// pages/api/public-page/index.js - 공개 페이지 API
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

export default async function handler(req, res) {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }

  if (req.method === 'GET') {
    try {
      const publicPage = await prisma.publicPage.findUnique({
        where: { userId: user.id }
      });
      
      res.status(200).json(publicPage);
    } catch (error) {
      res.status(500).json({ error: '공개 페이지 조회 실패' });
    }
  }

  else if (req.method === 'PATCH') {
    const { slug, theme, isActive } = req.body;
    
    if (!slug) {
      return res.status(400).json({ error: '페이지 주소는 필수입니다' });
    }

    // slug 유효성 검사
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({ 
        error: '페이지 주소는 소문자, 숫자, 하이픈만 사용할 수 있습니다' 
      });
    }

    try {
      // 다른 사용자가 같은 slug를 사용하는지 확인
      const existingPage = await prisma.publicPage.findUnique({
        where: { slug }
      });

      if (existingPage && existingPage.userId !== user.id) {
        return res.status(400).json({ 
          error: '이미 사용 중인 페이지 주소입니다' 
        });
      }

      const publicPage = await prisma.publicPage.upsert({
        where: { userId: user.id },
        update: {
          slug,
          theme: theme || 'default',
          isActive: isActive !== undefined ? isActive : true
        },
        create: {
          userId: user.id,
          slug,
          theme: theme || 'default',
          isActive: isActive !== undefined ? isActive : true
        }
      });
      
      res.status(200).json(publicPage);
    } catch (error) {
      console.error('공개 페이지 저장 에러:', error);
      res.status(500).json({ error: '공개 페이지 저장 실패' });
    }
  }

  else {
    res.status(405).json({ error: '허용되지 않는 메소드' });
  }
}