const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAdmin() {
  try {
    const admin = await prisma.user.update({
      where: { username: 'admin' },
      data: { email: 'cs@aorit.com' }
    });
    console.log('✅ 관리자 이메일 업데이트: cs@aorit.com');
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}
updateAdmin();
