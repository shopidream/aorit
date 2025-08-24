// pages/api/onboarding/complete.js
import { prisma } from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { completed, completedAt } = req.body;

    // 사용자 프로필에 온보딩 완료 상태 업데이트
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingCompleted: completed || true,
        onboardingCompletedAt: completedAt ? new Date(completedAt) : new Date()
      }
    });

    // 온보딩 후 데모 데이터 정리 (선택사항)
    await cleanupDemoData(session.user.id);

    return res.status(200).json({ 
      success: true,
      message: '온보딩이 완료되었습니다.',
      user: {
        id: user.id,
        onboardingCompleted: user.onboardingCompleted,
        onboardingCompletedAt: user.onboardingCompletedAt
      }
    });

  } catch (error) {
    console.error('Onboarding completion error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function cleanupDemoData(userId) {
  try {
    // 데모 데이터 삭제 (isDemo: true인 데이터들)
    await prisma.contract.deleteMany({
      where: { userId, isDemo: true }
    });

    await prisma.quote.deleteMany({
      where: { userId, isDemo: true }
    });

    await prisma.client.deleteMany({
      where: { userId, isDemo: true }
    });

    await prisma.service.deleteMany({
      where: { userId, isDemo: true }
    });

    console.log(`Demo data cleaned up for user ${userId}`);
  } catch (error) {
    console.error('Demo data cleanup error:', error);
    // 정리 실패해도 온보딩 완료는 성공으로 처리
  }
}