const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // 기존 관리자 계정 확인
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'cs@shopidream.com' }
    });

    if (existingAdmin) {
      console.log('✅ 관리자 계정이 이미 존재합니다: cs@shopidream.com');
      return;
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash('1234', 10);

    // 관리자 계정 생성
    const admin = await prisma.user.create({
      data: {
        email: 'cs@shopidream.com',
        password: hashedPassword,
        name: 'Administrator',
        role: 'admin',
        emailVerified: new Date()
      }
    });

    console.log('✅ 관리자 계정 생성 완료!');
    console.log('📧 이메일: cs@shopidream.com');
    console.log('🔑 비밀번호: 1234');
    console.log('⚠️  보안을 위해 로그인 후 비밀번호를 변경하세요.');

  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();