import { prisma } from './prisma';

export async function checkAIUsageLimit(userId) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) throw new Error('사용자를 찾을 수 없습니다');

  // 새 달이면 사용량 초기화
  if (user.aiUsageMonth !== thisMonth) {
    user = await prisma.user.update({
      where: { id: userId },
      data: { 
        aiUsageCount: 0, 
        aiUsageMonth: thisMonth 
      }
    });
  }

  // 사용량 제한 체크
  if (user.aiUsageCount >= user.aiLimit) {
    throw new Error(`이번 달 AI 사용량 ${user.aiLimit}회를 모두 사용했습니다. 다음 달 1일에 초기화됩니다.`);
  }

  return {
    canUse: true,
    remaining: user.aiLimit - user.aiUsageCount,
    limit: user.aiLimit,
    used: user.aiUsageCount
  };
}

export async function incrementAIUsage(userId) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  await prisma.user.update({
    where: { id: userId },
    data: { 
      aiUsageCount: { increment: 1 },
      aiUsageMonth: thisMonth
    }
  });
}

export async function getAIUsageInfo(userId) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return null;

  // 새 달이면 초기화된 정보 반환
  if (user.aiUsageMonth !== thisMonth) {
    return {
      used: 0,
      remaining: user.aiLimit,
      limit: user.aiLimit,
      plan: user.aiPlan
    };
  }

  return {
    used: user.aiUsageCount,
    remaining: user.aiLimit - user.aiUsageCount,
    limit: user.aiLimit,
    plan: user.aiPlan
  };
}