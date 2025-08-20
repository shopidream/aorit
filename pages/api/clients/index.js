// pages/api/clients/index.js - 고객 관리 API (Soft Delete 지원)
import { verifyToken } from '../../../lib/auth';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // JWT 토큰에서 사용자 ID 가져오기
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

    if (req.method === 'GET') {
      // Soft Delete 필터링: 삭제되지 않은 고객만 조회
      const clients = await prisma.client.findMany({
        where: { 
          userId: user.id,
          deleted: false  // Soft Delete 필터링 추가
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return res.status(200).json(clients);
    }

    if (req.method === 'POST') {
      const { 
        // 담당자 정보 (필수)
        name,
        phone, 
        email,
        
        // 회사 정보
        company,
        businessNumber,
        companyAddress,
        companyPhone,
        websiteUrl,
        
        // 기타 (기존 필드들도 유지)
        position,
        serviceCategory,
        serviceDescription,
        memo 
      } = req.body;

      // 필수 필드 검증
      if (!name || !phone || !email) {
        return res.status(400).json({ 
          error: '담당자명, 담당자 전화번호, 담당자 이메일은 필수입니다' 
        });
      }
      
      const client = await prisma.client.create({
        data: {
          userId: user.id,
          
          // 담당자 정보 (필수)
          name,
          phone,
          email,
          
          // 회사 정보
          company: company || null,
          businessNumber: businessNumber || null,
          companyAddress: companyAddress || null,
          companyPhone: companyPhone || null,
          websiteUrl: websiteUrl || null,
          
          // 기타 (기존 필드들 유지 - 하위 호환성)
          position: position || null,
          serviceCategory: serviceCategory || null,
          serviceDescription: serviceDescription || null,
          memo: memo || null
          
          // deleted, deletedAt은 기본값(false, null)으로 자동 설정
        }
      });
      
      return res.status(201).json(client);
    }

    return res.status(405).json({ error: '허용되지 않는 메소드' });

  } catch (error) {
    console.error('Clients API 오류:', error);
    
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