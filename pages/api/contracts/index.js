import { verifyToken } from '../../../lib/auth';
import { validateContractData } from '../../../lib/contractGenerator';

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
      const contracts = await prisma.contract.findMany({
        where: { userId: user.id },
        include: { 
          client: true, 
          quote: {
            include: { service: true }
          },
          clauses: { orderBy: { order: 'asc' } },
          signatures: { orderBy: { signedAt: 'desc' } }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return res.status(200).json(contracts);
    }

    if (req.method === 'POST') {
      const { contractData, selectedClauses, variables, quoteId } = req.body;
      
      console.log('계약 생성 요청:', { 
        contractData: contractData?.serviceName, 
        clauseCount: selectedClauses?.length, 
        variables 
      });

      // 데이터 검증
      const validation = validateContractData({
        client: contractData?.client,
        provider: contractData?.provider,
        serviceName: contractData?.serviceName,
        amount: contractData?.amount
      });

      if (!validation.isValid) {
        return res.status(400).json({ 
          error: '계약 데이터 검증 실패',
          details: validation.errors 
        });
      }

      // 선택된 조항들이 없으면 오류
      if (!selectedClauses || !Array.isArray(selectedClauses) || selectedClauses.length === 0) {
        return res.status(400).json({ 
          error: '선택된 조항이 없습니다'
        });
      }

      // 계약서 제목 생성
      const contractTitle = generateContractTitle(contractData);

      // DB에 저장할 데이터 준비 - AI가 생성한 조항들을 그대로 사용
      const contractToSave = {
        userId: user.id,
        title: contractTitle,
        clientId: await getOrCreateClientId(contractData.client, user.id),
        type: 'auto_generated',
        status: 'draft',
        content: JSON.stringify({
          contractData: contractData,
          clauses: selectedClauses,  // AI가 생성한 조항들을 그대로 저장
          variables: variables || {}
        }),
        metadata: JSON.stringify({
          variables: variables || {},
          clauseCount: selectedClauses.length,
          generatedAt: new Date().toISOString(),
          aiGenerated: true
        })
      };

      // quoteId가 있으면 추가
      if (quoteId) {
        const quoteExists = await prisma.quote.findUnique({
          where: { id: parseInt(quoteId) }
        });

        if (quoteExists) {
          contractToSave.quoteId = parseInt(quoteId);
          contractToSave.amount = quoteExists.amount; // 견적서 금액도 저장
        }
      }

      // 금액이 없으면 contractData에서 가져오기
      if (!contractToSave.amount) {
        contractToSave.amount = contractData?.amount || 0;
      }

      // 계약서 생성
      const contract = await prisma.contract.create({
        data: contractToSave,
        include: { 
          client: true, 
          quote: true
        }
      });

      // AI가 생성한 조항들을 DB에 저장
      if (selectedClauses.length > 0) {
        const clausesToCreate = selectedClauses.map((clause, index) => ({
          contractId: contract.id,
          title: clause.title || `제${index + 1}조`,
          type: clause.category || 'general',
          content: clause.content || '',
          order: clause.order || index,
          essential: clause.essential || false
        }));

        await prisma.clause.createMany({
          data: clausesToCreate
        });
      }
      
      console.log('계약 생성 성공:', contract.id, '- 조항 수:', selectedClauses.length);
      
      return res.status(201).json({
        id: contract.id,
        title: contract.title,
        status: contract.status,
        createdAt: contract.createdAt,
        client: contract.client,
        quote: contract.quote,
        clauseCount: selectedClauses.length
      });
    }

    return res.status(405).json({ error: '허용되지 않는 메서드' });

  } catch (error) {
    console.error('계약 API 오류:', error);
    return res.status(500).json({ 
      error: '계약 처리 실패',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function getOrCreateClientId(clientData, userId) {
  if (!clientData?.name) {
    throw new Error('고객 이름이 필요합니다');
  }

  // 기존 고객 찾기 (이름과 이메일로)
  let client = await prisma.client.findFirst({
    where: {
      userId: userId,
      OR: [
        { email: clientData.email },
        { name: clientData.name }
      ]
    }
  });

  // 없으면 생성
  if (!client) {
    client = await prisma.client.create({
      data: {
        userId: userId,
        name: clientData.name,
        email: clientData.email || '',
        phone: clientData.phone || '',
        company: clientData.company || ''
      }
    });
  }

  return client.id;
}

function generateContractTitle(contractData) {
  const serviceName = contractData?.serviceName || '서비스';
  
  if (serviceName.includes('패키지') || serviceName.includes('통합')) {
    return `${serviceName} 제공 계약서`;
  }
  
  return `${serviceName} 서비스 제공 계약서`;
}