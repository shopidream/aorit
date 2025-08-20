// pages/api/admin/batch-process.js - 120개 계약서 일괄 처리 API
import { verifyToken } from '../../../lib/auth';
import { parseDocument } from '../../../lib/documentParser';
import { analyzeDocument } from '../../../lib/contractAnalyzer';
import { saveClauseCandidate } from '../../../lib/clauseDatabase';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 관리자 권한 확인
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다' });
    }

    const { action, files } = req.body;

    switch (action) {
      case 'upload_contracts':
        return await handleContractUpload(files, user.id, res);
      
      case 'process_batch':
        return await handleBatchProcess(req.body.contractIds, res);
      
      case 'get_status':
        return await handleGetStatus(res);
      
      default:
        return res.status(400).json({ error: '유효하지 않은 액션입니다' });
    }

  } catch (error) {
    console.error('일괄 처리 API 오류:', error);
    return res.status(500).json({
      error: '서버 오류',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}

// 계약서 파일 업로드 처리
async function handleContractUpload(files, userId, res) {
  if (!files || files.length === 0) {
    return res.status(400).json({ error: '업로드할 파일이 없습니다' });
  }

  const results = [];

  for (const file of files) {
    try {
      // 기존 계약서 중복 확인
      const existing = await prisma.sourceContract.findFirst({
        where: { filename: file.filename }
      });

      if (existing) {
        results.push({
          filename: file.filename,
          status: 'skipped',
          reason: '이미 존재하는 파일'
        });
        continue;
      }

      // 문서 파싱
      const parseResult = await parseDocument(file.buffer, file.filename);
      
      if (!parseResult.success) {
        results.push({
          filename: file.filename,
          status: 'failed',
          reason: parseResult.error
        });
        continue;
      }

      // DB에 원본 계약서 저장
      const sourceContract = await prisma.sourceContract.create({
        data: {
          filename: file.filename,
          title: parseResult.document.metadata.title || file.filename,
          fullText: parseResult.document.fullText,
          metadata: JSON.stringify(parseResult.document.metadata),
          clauseCount: parseResult.document.clauses.length,
          uploadedBy: userId,
          status: 'uploaded'
        }
      });

      results.push({
        filename: file.filename,
        status: 'uploaded',
        contractId: sourceContract.id,
        clauseCount: parseResult.document.clauses.length
      });

    } catch (error) {
      console.error(`파일 ${file.filename} 업로드 오류:`, error);
      results.push({
        filename: file.filename,
        status: 'error',
        reason: error.message
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: `${files.length}개 파일 처리 완료`,
    results,
    summary: {
      total: files.length,
      uploaded: results.filter(r => r.status === 'uploaded').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length
    }
  });
}

// 일괄 분석 처리
async function handleBatchProcess(contractIds, res) {
  if (!contractIds || contractIds.length === 0) {
    return res.status(400).json({ error: '처리할 계약서 ID가 없습니다' });
  }

  const results = [];
  let totalClauses = 0;
  let savedClauses = 0;

  // 기존 조항들 조회 (중복 검사용)
  const existingClauses = await prisma.contractTemplate.findMany({
    select: { title: true, content: true, category: true }
  });

  for (const contractId of contractIds) {
    try {
      // 원본 계약서 조회
      const sourceContract = await prisma.sourceContract.findUnique({
        where: { id: contractId }
      });

      if (!sourceContract) {
        results.push({
          contractId,
          status: 'not_found',
          message: '계약서를 찾을 수 없습니다'
        });
        continue;
      }

      // 이미 처리된 경우 스킵
      if (sourceContract.status === 'processed') {
        results.push({
          contractId,
          status: 'already_processed',
          message: '이미 처리된 계약서입니다'
        });
        continue;
      }

      // 문서 재파싱
      const metadata = JSON.parse(sourceContract.metadata || '{}');
      const document = {
        filename: sourceContract.filename,
        fullText: sourceContract.fullText,
        clauses: [], // 다시 파싱 필요
        metadata
      };

      // 조항 분석 실행
      const analysisResult = await analyzeDocument(document, existingClauses);
      totalClauses += analysisResult.results.length;

      // 분석된 조항들을 후보로 저장
      const savedClauseIds = [];
      
      for (const result of analysisResult.results) {
        if (result.success && !result.analysis.isDuplicate) {
          try {
            const candidate = await saveClauseCandidate({
              title: result.clause.title,
              content: result.clause.templateContent || result.clause.content,
              category: result.clause.category,
              sourceContract: sourceContract.filename,
              confidence: result.analysis.categoryConfidence,
              tags: result.clause.tags || [],
              variables: result.clause.variables || []
            });
            
            savedClauseIds.push(candidate.id);
            savedClauses++;
          } catch (error) {
            console.error('조항 저장 오류:', error);
          }
        }
      }

      // 계약서 상태 업데이트
      await prisma.sourceContract.update({
        where: { id: contractId },
        data: {
          status: 'processed',
          processedAt: new Date(),
          analysisResult: JSON.stringify(analysisResult.summary)
        }
      });

      results.push({
        contractId,
        status: 'processed',
        filename: sourceContract.filename,
        totalClauses: analysisResult.results.length,
        savedClauses: savedClauseIds.length,
        duplicates: analysisResult.results.filter(r => r.