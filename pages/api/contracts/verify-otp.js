const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드' });
  }

  const { token, otp } = req.body;

  try {
    // 토큰 검증
    const signToken = await prisma.signToken.findUnique({
      where: { token: token },
      include: { 
        contract: { 
          include: { 
            client: true,
            clauses: { orderBy: { order: 'asc' } },
            signatures: true
          } 
        } 
      }
    });

    if (!signToken) {
      return res.status(404).json({ error: '유효하지 않은 토큰입니다' });
    }

    // 토큰 만료 확인 (24시간)
    if (new Date() > signToken.expiresAt) {
      return res.status(400).json({ error: '토큰이 만료되었습니다' });
    }

    // 이미 사용된 토큰 확인
    if (signToken.isUsed) {
      return res.status(400).json({ error: '이미 사용된 토큰입니다' });
    }

    // OTP 확인
    if (!signToken.otp) {
      return res.status(400).json({ error: 'OTP가 발송되지 않았습니다' });
    }

    // OTP 만료 확인 (5분)
    if (new Date() > signToken.otpExpiry) {
      return res.status(400).json({ error: 'OTP가 만료되었습니다 (5분). 새로 요청해주세요' });
    }

    // OTP 일치 확인
    if (signToken.otp !== otp) {
      return res.status(400).json({ error: '잘못된 OTP입니다' });
    }

    // OTP 검증 성공 - 계약서 정보 반환
    return res.status(200).json({
      success: true,
      verified: true,
      contract: signToken.contract,
      token: token, // 서명 시 필요
      message: 'OTP 검증 완료. 서명을 진행하세요.'
    });

  } catch (error) {
    console.error('OTP 검증 오류:', error);
    return res.status(500).json({ 
      error: 'OTP 검증 실패',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}