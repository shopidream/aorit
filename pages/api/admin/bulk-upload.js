// pages/api/admin/bulk-upload.js - 웹에서 bulkUploadTemplates 실행 API
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // JWT 토큰 검증
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증이 필요합니다' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다' });
    }

    const { method } = req;

    switch (method) {
      case 'GET':
        // 템플릿 폴더 현황 조회
        const folderStats = await getTemplateFolderStats();
        return res.status(200).json({
          success: true,
          folderStats,
          openaiApiKey: process.env.OPENAI_API_KEY ? '설정됨' : '설정 안됨'
        });

      case 'POST':
        // bulkUploadTemplates.js 실행
        const { batch } = req.body;
        
        if (!process.env.OPENAI_API_KEY) {
          return res.status(400).json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다' });
        }

        // 토큰을 포함하여 스크립트 실행
        const result = await executeBulkUpload(token, batch);
        return res.status(200).json(result);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: '지원하지 않는 메소드입니다' });
    }

  } catch (error) {
    console.error('❌ Bulk Upload API 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다',
      details: error.message 
    });
  }
}

/**
 * 템플릿 폴더 현황 조회
 */
async function getTemplateFolderStats() {
  const templatesBaseDir = './templates';
  
  if (!fs.existsSync(templatesBaseDir)) {
    return { folders: [], totalFiles: 0, message: 'templates 폴더가 없습니다' };
  }

  const folders = fs.readdirSync(templatesBaseDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('contract_templates_'))
    .map(dirent => {
      const folderPath = path.join(templatesBaseDir, dirent.name);
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.txt'));
      const countryCode = dirent.name.replace('contract_templates_', '');
      
      return {
        folderName: dirent.name,
        countryCode,
        fileCount: files.length,
        folderPath
      };
    });

  const totalFiles = folders.reduce((sum, folder) => sum + folder.fileCount, 0);

  return {
    folders,
    totalFiles,
    message: folders.length === 0 ? 'contract_templates_* 폴더가 없습니다' : null
  };
}

/**
 * bulkUploadTemplates.js 스크립트 실행
 */
async function executeBulkUpload(token, batch = false) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'bulkUploadTemplates.js');
    
    // 스크립트 존재 확인
    if (!fs.existsSync(scriptPath)) {
      return reject(new Error('bulkUploadTemplates.js 파일이 없습니다'));
    }

    const args = [
      scriptPath,
      `--token=${token}`
    ];

    if (batch) {
      args.push('--batch');
    }

    const childProcess = spawn('node', args, {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env }
    });

    let output = '';
    let error = '';

    childProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    childProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        // 성공적으로 완료
        const results = parseUploadResults(output);
        resolve({
          success: true,
          message: 'Bulk upload 완료',
          output,
          results
        });
      } else {
        // 오류 발생
        reject(new Error(`스크립트 실행 오류 (exit code: ${code})\n${error}\n${output}`));
      }
    });

    childProcess.on('error', (err) => {
      reject(new Error(`프로세스 실행 오류: ${err.message}`));
    });

    // 타임아웃 설정 (30분)
    setTimeout(() => {
      childProcess.kill('SIGTERM');
      reject(new Error('스크립트 실행 타임아웃 (30분 초과)'));
    }, 30 * 60 * 1000);
  });
}

/**
 * 업로드 결과 파싱
 */
function parseUploadResults(output) {
  const results = {
    totalFiles: 0,
    successCount: 0,
    failCount: 0,
    skippedCount: 0,
    mismatchCount: 0,
    totalCost: 0,
    totalClauses: 0,
    countries: []
  };

  try {
    // 정규표현식으로 결과 추출
    const totalFilesMatch = output.match(/총 파일:\s*(\d+)개/);
    if (totalFilesMatch) results.totalFiles = parseInt(totalFilesMatch[1]);

    const successMatch = output.match(/성공:\s*(\d+)개/);
    if (successMatch) results.successCount = parseInt(successMatch[1]);

    const failMatch = output.match(/실패:\s*(\d+)개/);
    if (failMatch) results.failCount = parseInt(failMatch[1]);

    const skippedMatch = output.match(/스킵:\s*(\d+)개/);
    if (skippedMatch) results.skippedCount = parseInt(skippedMatch[1]);

    const costMatch = output.match(/총 AI 비용:\s*([\d.]+)/);
    if (costMatch) results.totalCost = parseFloat(costMatch[1]);

    const clausesMatch = output.match(/총 조항:\s*([\d,]+)개/);
    if (clausesMatch) {
      results.totalClauses = parseInt(clausesMatch[1].replace(/,/g, ''));
    }

    // 국가별 결과 추출
    const countryMatches = output.match(/🌍 \[(\d+)\/(\d+)\] (.+?) 처리중\.\.\./g);
    if (countryMatches) {
      countryMatches.forEach(match => {
        const countryMatch = match.match(/🌍 \[(\d+)\/(\d+)\] (.+?) 처리중\.\.\./);
        if (countryMatch) {
          results.countries.push(countryMatch[3]);
        }
      });
    }

  } catch (error) {
    console.warn('결과 파싱 실패:', error);
  }

  return results;
}