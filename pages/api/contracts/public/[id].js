const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드' });
  }

  const { id } = req.query;

  try {
    // 인증 없이 계약서 조회 (공개 API)
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(id) },
      include: { 
        client: true,
        clauses: { orderBy: { order: 'asc' } },
        signatures: { orderBy: { signedAt: 'desc' } }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: '계약서를 찾을 수 없습니다' });
    }

    // 민감한 정보 제거 (필요에 따라 조정)
    const publicContract = {
      ...contract,
      // userId는 숨김
      userId: undefined,
      // 클라이언트 정보에서 민감한 정보 제거
      client: {
        ...contract.client,
        businessNumber: undefined, // 사업자번호 숨김
        memo: undefined // 메모 숨김
      }
    };

    return res.status(200).json(publicContract);

  } catch (error) {
    console.error('공개 계약서 조회 오류:', error);
    return res.status(500).json({ 
      error: '계약서 조회 실패',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}