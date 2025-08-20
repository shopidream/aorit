// lib/contractDatabase.js - 계약서 데이터베이스 함수들

import { PrismaClient } from '@prisma/client';

// Prisma 싱글톤 인스턴스 (개선됨)
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
}

// 계약서를 데이터베이스에 저장 (트랜잭션 적용)
export async function saveContractToDatabase(userId, contract, contractData) {
  try {
    return await prisma.$transaction(async (tx) => {
      const client = await findOrCreateClient(tx, userId, contractData.client);
      const quote = await createQuote(tx, userId, client.id, contract);
      const savedContract = await createContract(tx, userId, client.id, quote.id, contract);
      
      return { contract: savedContract, client, quote };
    });
  } catch (error) {
    console.error('데이터베이스 저장 오류:', error);
    throw new Error('계약서 저장 중 오류가 발생했습니다');
  }
}

// 클라이언트 조회 또는 생성 (트랜잭션 지원)
export async function findOrCreateClient(tx, userId, clientInfo) {
  const existing = await tx.client.findFirst({
    where: { userId, email: clientInfo.email }
  });

  if (existing) {
    return await tx.client.update({
      where: { id: existing.id },
      data: {
        name: clientInfo.name,
        company: clientInfo.company || existing.company,
        phone: clientInfo.phone || existing.phone,
        updatedAt: new Date()
      }
    });
  }

  return await tx.client.create({
    data: {
      userId,
      email: clientInfo.email,
      name: clientInfo.name,
      company: clientInfo.company || null,
      phone: clientInfo.phone || null
    }
  });
}

// 견적서 생성 (트랜잭션 지원)
export async function createQuote(tx, userId, clientId, contract) {
  const services = contract.contractInfo?.project?.services || [];
  const quoteItems = services.map(service => ({
    name: service.name || service.serviceName,
    description: service.description || service.serviceDescription || '',
    quantity: 1,
    unitPrice: service.price || 0,
    totalPrice: service.price || 0
  }));

  return await tx.quote.create({
    data: {
      userId,
      clientId,
      items: JSON.stringify(quoteItems),
      amount: contract.contractInfo?.project?.totalAmount || 0,
      status: 'approved',
      notes: null
    }
  });
}

// 계약서 생성 (트랜잭션 지원 + 배치 처리)
export async function createContract(tx, userId, clientId, quoteId, contract) {
  const contractRecord = await tx.contract.create({
    data: {
      userId,
      clientId,
      quoteId,
      status: 'draft',
      content: JSON.stringify(contract),
      metadata: JSON.stringify(contract.metadata || {})
    }
  });

  const clauses = contract.clauses || [];
  
  // 배치 처리로 성능 개선
  if (clauses.length > 0) {
    await tx.clause.createMany({
      data: clauses.map((clause, i) => ({
        contractId: contractRecord.id,
        type: clause.category || 'general',
        content: clause.content,
        title: clause.title,
        order: clause.order || (i + 1),
        riskLevel: clause.riskLevel || 'medium',
        essential: clause.essential || false
      }))
    });
  }

  return contractRecord;
}

// Prisma 연결 해제 (서버 종료 시에만 사용)
export async function disconnectPrisma() {
  await prisma.$disconnect();
}