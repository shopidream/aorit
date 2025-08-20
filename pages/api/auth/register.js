// pages/api/auth/register.js - 회원가입 API
import { prisma } from '../../../lib/prisma';
import { hashPassword, generateToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드' });
  }

  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: '모든 필드를 입력해주세요' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: '이미 존재하는 이메일입니다' });
    }

    const hashedPassword = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        profile: {
          create: {}
        },
        publicPage: {
          create: {
            slug: email.split('@')[0],
            theme: 'default'
          }
        }
      },
      include: { profile: true }
    });

    const token = generateToken(user.id);

    res.status(201).json({
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
    console.error('회원가입 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}