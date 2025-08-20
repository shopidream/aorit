// lib/clauseDatabase.js - 조항 DB 관리 시스템
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 조항 카테고리 정의
export const CLAUSE_CATEGORIES = {
  basic: '기본 정보',
  payment: '대금 지급', 
  service: '서비스 범위',
  delivery: '납품 조건',
  warranty: '보증 조건',
  ip_rights: '지적재산권',
  confidentiality: '기밀유지',
  liability: '책임한계',
  termination: '계약해지',
  dispute: '분쟁해결',
  other: '기타'
};

// 표준 조항 조회
export async function getStandardClauses(category = null, tags = []) {
  const where = {
    type: 'standard',
    isActive: true
  };
  
  if (category) {
    where.category = category;
  }
  
  if (tags.length > 0) {
    where.tags = {
      hasSome: tags
    };
  }
  
  return await prisma.contractTemplate.findMany({
    where,
    orderBy: { popularity: 'desc' }
  });
}

// 유연 조항 조회
export async function getFlexibleClauses(filters = {}) {
  const where = {
    type: 'flexible',
    isActive: true,
    ...filters
  };
  
  return await prisma.contractTemplate.findMany({
    where,
    orderBy: [
      { confidence: 'desc' },
      { usageCount: 'desc' }
    ]
  });
}

// 조항 후보 저장
export async function saveClauseCandidate(clauseData) {
  return await prisma.clauseCandidate.create({
    data: {
      title: clauseData.title,
      content: clauseData.content,
      category: clauseData.category,
      sourceContract: clauseData.sourceContract,
      confidence: clauseData.confidence || 0.5,
      tags: clauseData.tags || [],
      variables: clauseData.variables || []
    }
  });
}

// 후보를 표준으로 승격
export async function promoteToStandard(candidateId, reviewedBy) {
  const candidate = await prisma.clauseCandidate.findUnique({
    where: { id: candidateId }
  });
  
  if (!candidate) {
    throw new Error('후보 조항을 찾을 수 없습니다');
  }
  
  // 표준 조항으로 생성
  const standardClause = await prisma.contractTemplate.create({
    data: {
      title: candidate.title,
      content: candidate.content,
      category: candidate.category,
      type: 'standard',
      tags: candidate.tags,
      variables: candidate.variables,
      confidence: 1.0,
      reviewedBy,
      isActive: true,
      usageCount: 1
    }
  });
  
  // 후보에서 제거
  await prisma.clauseCandidate.delete({
    where: { id: candidateId }
  });
  
  return standardClause;
}

// 조항 사용 빈도 업데이트
export async function updateClauseUsage(clauseId) {
  return await prisma.contractTemplate.update({
    where: { id: clauseId },
    data: {
      usageCount: { increment: 1 },
      lastUsed: new Date()
    }
  });
}

// 템플릿 매칭용 조항 세트 조회
export async function getClauseSetForTemplate(templateType, industry, complexity) {
  const baseClauses = await getStandardClauses();
  
  const additionalClauses = await getFlexibleClauses({
    tags: {
      hasAny: [templateType, industry, complexity]
    }
  });
  
  return {
    standard: baseClauses,
    flexible: additionalClauses
  };
}

export default {
  getStandardClauses,
  getFlexibleClauses,
  saveClauseCandidate,
  promoteToStandard,
  updateClauseUsage,
  getClauseSetForTemplate
};