import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../lib/auth';
import { generateBasicClauses } from '../../../lib/contractGenerator';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }

    let userId;
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }
    
    const { id } = req.query;

    if (req.method === 'GET') {
      const quote = await prisma.quote.findFirst({
        where: { 
          id: parseInt(id),
          userId: user.id 
        },
        include: { 
          client: true
        }
      });

      if (!quote) {
        return res.status(404).json({ error: '견적서를 찾을 수 없습니다' });
      }

      return res.status(200).json(quote);
    }

    if (req.method === 'PATCH') {
      const { title, status, amount, notes, metadata } = req.body;
      
      const updateData = {};
      
      if (title !== undefined) updateData.title = title;
      if (status !== undefined) updateData.status = status;
      if (amount !== undefined) updateData.amount = parseFloat(amount);
      if (notes !== undefined) updateData.notes = notes;
      if (metadata !== undefined) updateData.metadata = metadata;
      
      const quote = await prisma.quote.update({
        where: { 
          id: parseInt(id),
          userId: user.id 
        },
        data: updateData,
        include: { client: true }
      });

      // 견적 승인시 자동 계약서 생성
      if (status === 'accepted') {
        try {
          const clauses = generateBasicClauses({
            industry: 'general',
            amount: quote.amount,
            service: { title: '서비스' }
          });

          await prisma.contract.create({
            data: {
              userId: user.id,
              clientId: quote.clientId,
              quoteId: quote.id,
              status: 'pending',
              clauses: {
                create: clauses.map((clause, index) => ({
                  type: clause.type || 'general',
                  content: clause.content,
                  order: index
                }))
              }
            }
          });
        } catch (contractError) {
          console.error('계약서 생성 실패:', contractError);
        }
      }
      
      return res.status(200).json(quote);
    }

    if (req.method === 'DELETE') {
      const quote = await prisma.quote.findFirst({
        where: { 
          id: parseInt(id),
          userId: user.id 
        }
      });

      if (!quote) {
        return res.status(404).json({ error: '견적서를 찾을 수 없습니다' });
      }

      await prisma.quote.delete({
        where: { 
          id: parseInt(id)
        }
      });
      
      return res.status(200).json({ message: '견적이 삭제되었습니다' });
    }

    return res.status(405).json({ error: '허용되지 않는 메소드입니다' });
  } catch (error) {
    console.error('Quote API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  } finally {
    await prisma.$disconnect();
  }
}