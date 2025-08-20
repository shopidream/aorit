const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('2025Rhrordlgo!', 10);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'cs@aorit.com',
        password: hashedPassword,
        name: '관리자',
        role: 'admin',
        emailVerified: new Date()
      }
    });
    console.log('✅ 관리자 계정 생성: cs@aorit.com');
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}
createAdmin();
