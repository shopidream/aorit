import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import formidable from 'formidable';
import { verifyToken } from '../../lib/auth';

export const config = {
  api: {
    bodyParser: false, // FormData 처리를 위해 비활성화
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드' });
  }

  // 인증 확인
  const token = req.headers.authorization?.replace('Bearer ', '');
  let userId = 1; // 기본값

  if (token) {
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
    } catch (error) {
      // 토큰이 유효하지 않아도 기본 사용자로 처리
      console.log('토큰 검증 실패, 기본 사용자 사용');
    }
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다' });
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: '이미지 파일만 업로드 가능합니다' });
    }

    // 업로드 디렉토리 생성
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', userId.toString());
    await mkdir(uploadDir, { recursive: true });

    // 파일명 생성
    const timestamp = Date.now();
    const ext = path.extname(file.originalFilename || '');
    const baseName = path.basename(file.originalFilename || 'file', ext);
    const newFilename = `${timestamp}_${baseName}${ext}`;
    const filePath = path.join(uploadDir, newFilename);

    // 파일 복사
    const fs = require('fs');
    await fs.promises.copyFile(file.filepath, filePath);

    // 웹 접근 가능한 URL 생성
    const fileUrl = `/uploads/${userId}/${newFilename}`;

    console.log('파일 업로드 완료:', {
      originalName: file.originalFilename,
      newFilename,
      fileUrl,
      size: file.size
    });

    res.status(200).json({
      success: true,
      filename: newFilename,
      url: fileUrl,
      filePath: fileUrl, // ServiceModal에서 사용하는 필드
      size: file.size
    });

  } catch (error) {
    console.error('파일 업로드 에러:', error);
    res.status(500).json({ error: '파일 업로드 중 오류가 발생했습니다' });
  }
}