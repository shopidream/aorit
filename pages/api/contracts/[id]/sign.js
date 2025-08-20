const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드' });
  }

  const { id } = req.query;
  const { 
    signerType, 
    signatureData, 
    signatureType, 
    signerName, 
    signerEmail,
    token // 갑 서명 시 토큰 포함
  } = req.body;

  try {
    // 갑 서명인 경우 토큰 검증
    if (signerType === 'client' && token) {
      const signToken = await prisma.signToken.findUnique({
        where: { token: token }
      });

      if (!signToken) {
        return res.status(404).json({ error: '유효하지 않은 토큰입니다' });
      }

      if (new Date() > signToken.expiresAt) {
        return res.status(400).json({ error: '토큰이 만료되었습니다' });
      }

      if (signToken.isUsed) {
        return res.status(400).json({ error: '이미 사용된 토큰입니다' });
      }

      // OTP 검증 확인
      if (!signToken.otp || !signToken.otpExpiry) {
        return res.status(400).json({ error: 'OTP 검증이 필요합니다' });
      }
    }

    // 계약서 확인
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(id) },
      include: { signatures: true }
    });

    if (!contract) {
      return res.status(404).json({ error: '계약서를 찾을 수 없습니다' });
    }

    // 중복 서명 확인
    const existingSignature = contract.signatures?.find(s => s.signerType === signerType);
    if (existingSignature) {
      return res.status(400).json({ error: '이미 서명이 완료되었습니다' });
    }

    // 서명 생성
    const signature = await prisma.signature.create({
      data: {
        contractId: parseInt(id),
        signerType: signerType,
        signerName: signerName || '서명자',
        signerEmail: signerEmail || '',
        signatureData: signatureData,
        signatureType: signatureType || 'canvas'
      }
    });

    // **핵심: 갑 서명 완료 시 토큰 즉시 무효화**
    if (signerType === 'client' && token) {
      await prisma.signToken.update({
        where: { token: token },
        data: { isUsed: true }
      });
      
      console.log(`[토큰 무효화] 갑 서명 완료로 토큰 ${token} 무효화`);
    }

    // 업데이트된 계약서 반환
    const updatedContract = await prisma.contract.findUnique({
      where: { id: parseInt(id) },
      include: { 
        signatures: true,
        client: true,
        clauses: { orderBy: { order: 'asc' } }
      }
    });

    return res.status(200).json(updatedContract);

  } catch (error) {
    console.error('서명 오류:', error);
    return res.status(500).json({ 
      error: '서명 실패',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}