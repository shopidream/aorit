// pages/api/clients/[id].js - 고객 수정/삭제 API (Soft Delete)
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // JWT 토큰에서 사용자 ID 가져오기 (index.js와 동일한 방식)
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

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    const { id } = req.query;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return res.status(400).json({ error: '유효하지 않은 고객 ID입니다.' });
    }

    // 고객 존재 및 권한 확인
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: user.id,
        deleted: false  // 삭제되지 않은 고객만
      }
    });

    if (!existingClient) {
      return res.status(404).json({ error: '고객을 찾을 수 없습니다.' });
    }

    if (req.method === 'GET') {
      // 고객 조회
      return res.status(200).json(existingClient);
    }

    if (req.method === 'PUT') {
      // 고객 수정
      const {
        name,
        email,
        phone,
        company,
        position,
        serviceCategory,
        serviceDescription,
        websiteUrl,
        memo,
        businessNumber,
        companyAddress,
        companyPhone
      } = req.body;

      // 필수 필드 검증
      if (!name || !email) {
        return res.status(400).json({ error: '이름과 이메일은 필수입니다.' });
      }

      // 이메일 중복 확인 (본인 제외)
      const emailExists = await prisma.client.findFirst({
        where: {
          email,
          userId: user.id,
          deleted: false,
          NOT: { id: clientId }
        }
      });

      if (emailExists) {
        return res.status(400).json({ error: '이미 등록된 이메일입니다.' });
      }

      const updatedClient = await prisma.client.update({
        where: { id: clientId },
        data: {
          name,
          email,
          phone,
          company,
          position,
          serviceCategory,
          serviceDescription,
          websiteUrl,
          memo,
          businessNumber,
          companyAddress,
          companyPhone
        }
      });

      return res.status(200).json(updatedClient);
    }

    if (req.method === 'DELETE') {
      // Soft Delete 처리
      
      // 관련 데이터 확인
      const relatedQuotes = await prisma.quote.count({
        where: { clientId: clientId }
      });
      
      const relatedContracts = await prisma.contract.count({
        where: { clientId: clientId }
      });

      // Soft Delete 실행
      const deletedClient = await prisma.client.update({
        where: { id: clientId },
        data: {
          deleted: true,
          deletedAt: new Date()
        }
      });

      return res.status(200).json({
        message: '고객이 성공적으로 삭제되었습니다.',
        relatedData: {
          quotes: relatedQuotes,
          contracts: relatedContracts
        },
        deletedClient
      });
    }

    return res.status(405).json({ error: '지원하지 않는 메소드입니다.' });

  } catch (error) {
    console.error('클라이언트 API 오류:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: '이미 등록된 고객입니다' });
    }
    
    return res.status(500).json({ 
      error: '고객 처리 실패',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}