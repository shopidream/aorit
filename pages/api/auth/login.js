import bcrypt from 'bcrypt';
import { prisma } from '../../../lib/prisma';
import { verifyPassword, generateToken } from '../../../lib/auth';

export default async function handler(req, res) {
  console.log('=== 디버깅 ===', req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드' });
  }

  const { username, password } = req.body;

  // 디버깅 로그 추가
  console.log('받은 데이터:', { username, password });

  if (!username || !password) {
    return res.status(400).json({ error: '사용자명과 비밀번호를 입력해주세요' });
  }

  try {
    // username으로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { username },
      include: { profile: true }
    });

    // 디버깅 로그 추가
    console.log('찾은 사용자:', user ? { id: user.id, username: user.username } : null);

    if (!user) {
      console.log('사용자를 찾을 수 없음');
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다' });
    }

    // 추가 디버깅
    console.log('DB 해시:', user.password);
    console.log('DB 해시 길이:', user.password.length);
    console.log('입력 비밀번호:', password);

    // 직접 bcrypt 테스트
    const testHash = bcrypt.hashSync('1234', 10);
    console.log('새 해시:', testHash);
    console.log('새 해시 검증:', await bcrypt.compare('1234', testHash));

    // 비밀번호 검증
    const passwordValid = await bcrypt.compare(password, user.password);
    console.log('비밀번호 검증 결과:', passwordValid);

    if (!passwordValid) {
      console.log('비밀번호가 일치하지 않음');
      return res.status(401).json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다' });
    }

    const token = generateToken(user.id);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
}