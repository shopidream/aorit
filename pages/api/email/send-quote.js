// pages/api/email/send-quote.js - 견적서 발송 API
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { sendEmail } from '../../../lib/emailService';
import { generateQuoteEmailTemplate } from '../../../templates/email/quoteTemplate';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드' });
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }

  const { quoteId } = req.body;

  if (!quoteId) {
    return res.status(400).json({ error: '견적 ID가 필요합니다' });
  }

  try {
    // 견적 정보 조회
    const quote = await prisma.quote.findUnique({
      where: { 
        id: parseInt(quoteId),
        userId: user.id 
      },
      include: {
        client: true,
        service: true
      }
    });

    if (!quote) {
      return res.status(404).json({ error: '견적을 찾을 수 없습니다' });
    }

    if (!quote.client?.email) {
      return res.status(400).json({ error: '고객 이메일이 없습니다' });
    }

    // 이메일 템플릿 생성
    const emailTemplate = generateQuoteEmailTemplate(quote, user);

    // 이메일 발송
    const emailResult = await sendEmail({
      to: quote.client.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    });

    if (!emailResult.success) {
      return res.status(500).json({ 
        error: '이메일 발송에 실패했습니다',
        details: emailResult.error 
      });
    }

    // 견적 상태를 'sent'로 업데이트
    await prisma.quote.update({
      where: { id: parseInt(quoteId) },
      data: { status: 'sent' }
    });

    res.status(200).json({
      success: true,
      message: '견적서가 성공적으로 발송되었습니다',
      emailId: emailResult.messageId,
      sentTo: quote.client.email
    });

  } catch (error) {
    console.error('견적서 발송 에러:', error);
    res.status(500).json({ 
      error: '견적서 발송 중 오류가 발생했습니다',
      details: error.message 
    });
  }
}