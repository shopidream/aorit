import bcrypt from 'bcrypt';
import { prisma } from '../../../lib/prisma';
import { generateToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드' });
  }

  const { email, username, password, isNextAuth } = req.body;
  const loginEmail = email || username; // email 또는 username 둘 다 지원

  // NextAuth 세션을 JWT로 변환하는 경우
  if (isNextAuth && loginEmail) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: loginEmail },
        include: { profile: true }
      });

      if (!user) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
      }

      const token = generateToken(user.id);
      
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profile: user.profile
        }
      });
    } catch (error) {
      console.error('NextAuth JWT 변환 오류:', error);
      return res.status(500).json({ error: '서버 오류가 발생했습니다' });
    }
  }

  // 기존 email/password 로그인
  if (!loginEmail || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: loginEmail },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    if (!user.password) {
      return res.status(401).json({ error: '비밀번호가 설정되지 않은 계정입니다' });
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });
    }

    const token = generateToken(user.id);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  } finally {
    await prisma.$disconnect();
  }
}