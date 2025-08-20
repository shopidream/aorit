import { verifyToken } from '../../../../lib/auth';
import crypto from 'crypto';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드' });
  }

  const { id } = req.query;

  try {
    // JWT 토큰 확인 (수행자만 토큰 생성 가능)
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    if (!authToken) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }

    const decoded = verifyToken(authToken);
    const userId = decoded.userId;

    // 계약서 확인 (본인 계약서인지 체크)
    const contract = await prisma.contract.findFirst({
      where: { 
        id: parseInt(id),
        userId: userId 
      },
      include: { 
        client: true,
        signatures: true
      }
    });

    if (!contract) {
      return res.status(404).json({ error: '계약서를 찾을 수 없습니다' });
    }

    // **핵심: 을 서명 완료 여부 체크**
    const freelancerSigned = contract.signatures?.some(s => s.signerType === 'freelancer');
    if (!freelancerSigned) {
      return res.status(400).json({ error: '을(수행자)이 먼저 서명해야 갑 서명 링크를 생성할 수 있습니다' });
    }

    // 갑이 이미 서명했는지 체크
    const clientSigned = contract.signatures?.some(s => s.signerType === 'client');
    if (clientSigned) {
      return res.status(400).json({ error: '갑이 이미 서명을 완료했습니다' });
    }

    // 갑 이메일 확인
    const clientEmail = contract.client?.email;
    if (!clientEmail) {
      return res.status(400).json({ error: '갑의 이메일 정보가 없습니다' });
    }

    // 기존 토큰 무효화 (갑용만)
    await prisma.signToken.updateMany({
      where: {
        contractId: parseInt(id),
        signerType: 'client',
        isUsed: false
      },
      data: { isUsed: true }
    });

    // 새 토큰 생성
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24시간 후 만료

    const signToken = await prisma.signToken.create({
      data: {
        contractId: parseInt(id),
        token: token,
        signerType: 'client',
        email: clientEmail,
        expiresAt: expiresAt
      }
    });

    // 서명 링크 생성
    const baseUrl = req.headers.origin || 'http://localhost:3000';
    const signLink = `${baseUrl}/contracts/sign/${id}?token=${token}`;

    return res.status(200).json({
      success: true,
      signLink: signLink,
      expiresAt: expiresAt,
      clientEmail: clientEmail
    });

  } catch (error) {
    console.error('서명 토큰 생성 오류:', error);
    return res.status(500).json({ 
      error: '토큰 생성 실패',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}