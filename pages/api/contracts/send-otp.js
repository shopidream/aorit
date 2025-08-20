const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드' });
  }

  const { token, email } = req.body;

  try {
    // 토큰 검증
    const signToken = await prisma.signToken.findUnique({
      where: { token: token },
      include: { 
        contract: { 
          include: { 
            client: true,
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
      return res.status(400).json({ error: '토큰이 만료되었습니다. 새 링크를 요청하세요' });
    }

    // 이미 사용된 토큰 확인
    if (signToken.isUsed) {
      return res.status(400).json({ error: '이미 사용된 토큰입니다' });
    }

    // 갑이 이미 서명했는지 체크
    const clientSigned = signToken.contract.signatures?.some(s => s.signerType === 'client');
    if (clientSigned) {
      return res.status(400).json({ error: '이미 서명이 완료되었습니다' });
    }

    // **핵심: 입력 이메일과 계약서 저장 이메일 일치 확인**
    if (email !== signToken.email) {
      return res.status(400).json({ error: '계약서에 등록된 이메일과 일치하지 않습니다' });
    }

    // OTP 생성 (6자리 숫자)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5); // **5분 후 만료**

    // OTP 저장
    await prisma.signToken.update({
      where: { id: signToken.id },
      data: {
        otp: otp,
        otpExpiry: otpExpiry
      }
    });

    // TODO: 실제 이메일 발송 로직 추가
    console.log(`[OTP 발송] ${email} -> ${otp} (5분 유효)`);
    
    return res.status(200).json({
      success: true,
      message: 'OTP가 이메일로 발송되었습니다 (5분 유효)',
      // 개발용으로만 포함
      developmentOtp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    console.error('OTP 발송 오류:', error);
    return res.status(500).json({ 
      error: 'OTP 발송 실패',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}