import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../../../lib/emailService';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contractId } = req.body;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        client: true,
        signatures: true
      }
    });

    if (!contract) {
      return res.status(404).json({ error: '계약서를 찾을 수 없습니다' });
    }

    const hasClientSigned = contract.signatures.some(s => s.signerType === 'client');
    const hasFreelancerSigned = contract.signatures.some(s => s.signerType === 'freelancer');

    let recipientEmail, subject, message;

    if (hasClientSigned && !hasFreelancerSigned) {
      recipientEmail = 'cs@aorat.com';
      subject = '계약서 서명 요청';
      message = `발주자가 계약서에 서명했습니다. 계약을 완료하려면 서명해주세요.`;
    } else if (hasFreelancerSigned && !hasClientSigned) {
      recipientEmail = contract.client.email;
      subject = '계약서 서명 요청';
      message = `수주자가 계약서에 서명했습니다. 계약을 완료하려면 서명해주세요.`;
    }

    if (recipientEmail) {
      await sendEmail({
        to: recipientEmail,
        subject,
        text: message,
        html: `
          <h2>계약서 서명 알림</h2>
          <p>${message}</p>
          <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/contracts/${contractId}">계약서 보기</a></p>
        `
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('알림 발송 실패:', error);
    res.status(500).json({ error: '알림 발송에 실패했습니다' });
  }
}