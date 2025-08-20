// pages/api/share/verify.js - 비밀번호 검증 API
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: '토큰과 비밀번호가 필요합니다.' });
    }

    // 공유 서비스 조회
    const sharedService = await prisma.sharedService.findUnique({
      where: { token },
      select: {
        id: true,
        password: true,
        isActive: true,
        expiryDate: true
      }
    });

    if (!sharedService) {
      return res.status(404).json({ error: '공유 링크를 찾을 수 없습니다.' });
    }

    // 활성 상태 확인
    if (!sharedService.isActive) {
      return res.status(404).json({ error: '비활성화된 공유 링크입니다.' });
    }

    // 만료일 확인
    if (sharedService.expiryDate && new Date() > sharedService.expiryDate) {
      return res.status(404).json({ error: '만료된 공유 링크입니다.' });
    }

    // 비밀번호 확인
    if (!sharedService.password) {
      return res.status(400).json({ error: '비밀번호가 설정되지 않은 공유 링크입니다.' });
    }

    const isValidPassword = await bcrypt.compare(password, sharedService.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: '잘못된 비밀번호입니다.' });
    }

    // 비밀번호 검증 성공
    return res.status(200).json({ 
      success: true,
      message: '비밀번호가 확인되었습니다.' 
    });

  } catch (error) {
    console.error('Password verification error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    await prisma.$disconnect();
  }
}