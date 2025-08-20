// pages/api/email/send-contract.js
import { prisma } from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { sendContractEmail } from '../../../lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드' });
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }

  const { contractId } = req.body;

  if (!contractId) {
    return res.status(400).json({ error: '계약 ID가 필요합니다' });
  }

  try {
    const contract = await prisma.contract.findUnique({
      where: { 
        id: parseInt(contractId),
        userId: user.id 
      },
      include: {
        client: true,
        quote: { include: { service: true } },
        clauses: { orderBy: { order: 'asc' } },
        signatures: true
      }
    });

    if (!contract) {
      return res.status(404).json({ error: '계약서를 찾을 수 없습니다' });
    }

    if (!contract.client?.email) {
      return res.status(400).json({ error: '고객 이메일이 없습니다' });
    }

    const clientSigned = contract.signatures.some(sig => sig.signerType === 'client');
    if (clientSigned) {
      return res.status(400).json({ error: '고객이 이미 서명한 계약서입니다' });
    }

    const emailResult = await sendContractEmail(contract, contract.client.email);

    if (!emailResult.success) {
      return res.status(500).json({ 
        error: '이메일 발송에 실패했습니다',
        details: emailResult.error 
      });
    }

    res.status(200).json({
      success: true,
      message: '계약서가 성공적으로 발송되었습니다',
      emailId: emailResult.messageId,
      sentTo: contract.client.email,
      contractUrl: `${process.env.NEXTAUTH_URL}/contracts/${contractId}`
    });

  } catch (error) {
    console.error('계약서 발송 에러:', error);
    res.status(500).json({ 
      error: '계약서 발송 중 오류가 발생했습니다',
      details: error.message 
    });
  }
}