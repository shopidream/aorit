import { verifyToken } from '../../../lib/auth';
import { getAIUsageInfo } from '../../../lib/aiUsageLimit';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET 메소드만 지원합니다' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }

    const decoded = verifyToken(token);
    const usageInfo = await getAIUsageInfo(decoded.userId);

    if (!usageInfo) {
      return res.status(404).json({ error: '사용자 정보를 찾을 수 없습니다' });
    }

    return res.status(200).json(usageInfo);

  } catch (error) {
    console.error('AI 사용량 조회 오류:', error);
    return res.status(500).json({
      error: '서버 내부 오류',
      details: error.message
    });
  }
}