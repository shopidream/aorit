import { verifyToken } from '../../../lib/auth';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    console.log('=== Quotes API 호출 ===');
    
    // JWT 토큰에서 사용자 ID 가져오기
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }
    
    let userId;
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
      console.log('인증된 사용자 ID:', userId);
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
    
    console.log('사용자 확인:', user.username, '(ID:', user.id, ')');

    if (req.method === 'POST') {
      console.log('견적 생성 요청:', req.body);
      
      // AI 견적과 일반 견적 구분
      const isAIQuote = req.body.type === 'ai_generated';
      
      if (isAIQuote) {
        console.log('AI 견적 생성 시작');
        
        const quoteData = {
          userId: user.id,
          title: req.body.title || 'AI 자동 견적',
          type: 'ai_generated',
          amount: parseFloat(req.body.amount) || 0,
          status: 'draft',
          items: typeof req.body.items === 'string' ? req.body.items : JSON.stringify(req.body.items || []),
          metadata: typeof req.body.metadata === 'string' ? req.body.metadata : JSON.stringify(req.body.metadata || {})
        };
        
        console.log('생성할 견적 데이터:', quoteData);
        
        const quote = await prisma.quote.create({
          data: quoteData
        });
        
        console.log('AI 견적 생성 성공:', quote.id);
        return res.status(201).json(quote);
      } else {
        // 일반 견적 생성 - 두 가지 방식 지원
        const { clientId, clientInfo, items, pricing, options } = req.body;
        
        let finalClientId = clientId;
        
        // clientId가 없고 clientInfo가 있는 경우 (기존 방식)
        if (!clientId && clientInfo) {
          if (!clientInfo.name || !clientInfo.email) {
            return res.status(400).json({ error: '고객 이름과 이메일이 필요합니다' });
          }
          
          console.log('고객 정보 처리 시작:', clientInfo);
          
          // 기존 고객 찾기 (같은 사용자의 같은 이메일)
          let client = await prisma.client.findFirst({
            where: { 
              email: clientInfo.email,
              userId: user.id 
            }
          });
          
          if (!client) {
            // 새 고객 생성
            console.log('새 고객 생성 중...');
            client = await prisma.client.create({
              data: {
                name: clientInfo.name,
                email: clientInfo.email,
                company: clientInfo.company || '',
                phone: clientInfo.phone || '',
                userId: user.id
              }
            });
            console.log('새 고객 생성 완료:', client.id);
          } else {
            // 기존 고객 정보 업데이트 (필요시)
            console.log('기존 고객 발견, 정보 업데이트 중...');
            client = await prisma.client.update({
              where: { id: client.id },
              data: {
                name: clientInfo.name,
                company: clientInfo.company || client.company,
                phone: clientInfo.phone || client.phone
              }
            });
            console.log('고객 정보 업데이트 완료');
          }
          
          finalClientId = client.id;
        }
        
        // clientId가 있는 경우 (새로운 방식)
        if (!finalClientId) {
          return res.status(400).json({ error: 'clientId 또는 clientInfo가 필요합니다' });
        }
        
        // 견적 생성
        console.log('견적 생성 중... clientId:', finalClientId);
        const quote = await prisma.quote.create({
          data: {
            userId: user.id,
            clientId: finalClientId,
            items: JSON.stringify(items || []),
            amount: parseFloat(pricing?.total) || 0,
            status: 'pending',
            type: 'manual',
            title: `견적서`,
            metadata: JSON.stringify({
              pricing: {
                subtotal: pricing?.subtotal || 0,
                discountAmount: pricing?.discountAmount || 0,
                total: pricing?.total || 0,
                discountSettings: pricing?.discountSettings || {}
              },
              paymentTerms: {
                type: 'installment',
                schedule: [
                  { percentage: options?.paymentTerms?.contract || 50, order: 1 },
                  { percentage: options?.paymentTerms?.progress || 0, order: 2 },
                  { percentage: options?.paymentTerms?.final || 50, order: 3 }
                ].filter(item => item.percentage > 0)
              },
              options: options || {}
            })
          }
        });
        
        console.log('견적 생성 완료:', quote.id);
        
        // 생성된 견적과 고객 정보 반환
        const result = await prisma.quote.findUnique({
          where: { id: quote.id },
          include: {
            client: true
          }
        });
        
        return res.status(201).json(result);
      }
    }
    
    if (req.method === 'GET') {
      const quotes = await prisma.quote.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          client: true
        }
      });
      
      return res.status(200).json(quotes);
    }

    return res.status(405).json({ error: '허용되지 않는 메소드' });
    
  } catch (error) {
    console.error('=== Quotes API 전체 오류 ===');
    console.error('Error:', error);
    
    return res.status(500).json({ 
      error: '서버 오류',
      details: error.message,
      code: error.code
    });
  } finally {
    await prisma.$disconnect();
  }
}