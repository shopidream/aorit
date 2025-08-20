import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  // 로컬 개발용 - 인증 스킵
  // const user = await verifyToken(req);
  // if (!user) {
  //   return res.status(401).json({ error: '인증이 필요합니다' });
  // }

  try {
    if (req.method === 'GET') {
      const contract = await prisma.contract.findUnique({
        where: { id: parseInt(id) },
        include: {
          client: true,
          quote: { include: { service: true } },
          clauses: { orderBy: { order: 'asc' } },
          signatures: { orderBy: { signedAt: 'desc' } }
        }
      });

      if (!contract) {
        return res.status(404).json({ error: '계약서를 찾을 수 없습니다' });
      }

      res.status(200).json(contract);
    } 
    else if (req.method === 'PUT') {
      const { title, amount, clauses } = req.body;

      // 계약서 업데이트
      const updatedContract = await prisma.contract.update({
        where: { id: parseInt(id) },
        data: {
          // quote 정보 업데이트는 별도 처리 필요
          ...(clauses && {
            clauses: {
              deleteMany: {},
              create: clauses.map((clause, index) => ({
                type: clause.type || 'custom',
                title: clause.title || '사용자 정의',
                content: clause.content,
                order: index + 1
              }))
            }
          })
        },
        include: {
          client: true,
          quote: { include: { service: true } },
          clauses: { orderBy: { order: 'asc' } },
          signatures: { orderBy: { signedAt: 'desc' } }
        }
      });

      res.status(200).json(updatedContract);
    } 
    else {
      res.status(405).json({ error: '허용되지 않는 메소드입니다' });
    }
  } catch (error) {
    console.error('계약서 API 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  } finally {
    await prisma.$disconnect();
  }
}