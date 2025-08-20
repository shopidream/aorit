// lib/categoryManager.js - 하이브리드 카테고리 시스템 관리자

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 모든 활성 카테고리 조회 (계층 구조 포함)
 */
export async function getActiveCategories() {
  try {
    const categories = await prisma.clauseCategory.findMany({
      where: { isActive: true },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ],
      include: {
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      }
    });

    return categories;
  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    return [];
  }
}

/**
 * 카테고리명으로 ID 조회 (GPT 분류 결과 → DB ID 매핑)
 */
export async function getCategoryIdByName(categoryName) {
  if (!categoryName) return null;

  try {
    const category = await prisma.clauseCategory.findFirst({
      where: {
        OR: [
          { name: categoryName },
          { name: { contains: categoryName } }
        ],
        isActive: true
      }
    });

    return category?.id || null;
  } catch (error) {
    console.error('카테고리 ID 조회 실패:', error);
    return null;
  }
}

/**
 * GPT가 제안한 새 카테고리 저장
 */
export async function saveProposedCategory(proposedData) {
  const {
    name,
    description,
    sourceTemplate,
    confidence = 0.7,
    suggestedBy = 'gpt'
  } = proposedData;

  try {
    // 중복 제안 체크
    const existing = await prisma.proposedCategory.findFirst({
      where: {
        name,
        status: 'pending'
      }
    });

    if (existing) {
      console.log(`이미 제안된 카테고리: ${name}`);
      return existing;
    }

    // 새 제안 저장
    const proposed = await prisma.proposedCategory.create({
      data: {
        name,
        description,
        sourceTemplate,
        confidence,
        suggestedBy,
        status: 'pending'
      }
    });

    console.log(`새 카테고리 제안 저장: ${name} (ID: ${proposed.id})`);
    return proposed;

  } catch (error) {
    console.error('제안 카테고리 저장 실패:', error);
    return null;
  }
}

/**
 * 카테고리 매핑 (기존 우선, 없으면 제안)
 */
export async function mapCategoryWithFallback(gptCategoryName, metadata = {}) {
  if (!gptCategoryName) return null;

  // 1차: 기존 카테고리 매핑 시도
  const existingId = await getCategoryIdByName(gptCategoryName);
  if (existingId) {
    return {
      type: 'existing',
      categoryId: existingId,
      categoryName: gptCategoryName
    };
  }

  // 2차: 유사한 카테고리 찾기
  const similarCategory = await findSimilarCategory(gptCategoryName);
  if (similarCategory) {
    return {
      type: 'similar',
      categoryId: similarCategory.id,
      categoryName: similarCategory.name,
      originalSuggestion: gptCategoryName
    };
  }

  // 3차: 새 카테고리 제안
  const proposed = await saveProposedCategory({
    name: gptCategoryName,
    description: `GPT 제안 카테고리 (출처: ${metadata.templateName || '알 수 없음'})`,
    sourceTemplate: metadata.templateName,
    confidence: metadata.confidence || 0.7
  });

  if (proposed) {
    return {
      type: 'proposed',
      proposedId: proposed.id,
      categoryName: gptCategoryName,
      fallbackId: await getDefaultCategoryId() // 기타/일반으로 임시 매핑
    };
  }

  // 4차: 기본 카테고리 사용
  return {
    type: 'default',
    categoryId: await getDefaultCategoryId(),
    categoryName: '기타/일반'
  };
}

/**
 * 유사한 카테고리 찾기 (간단한 키워드 매칭)
 */
async function findSimilarCategory(targetName) {
  const keywords = extractKeywords(targetName);
  if (keywords.length === 0) return null;

  try {
    const categories = await prisma.clauseCategory.findMany({
      where: { isActive: true }
    });

    for (const category of categories) {
      const categoryKeywords = extractKeywords(category.name);
      const similarity = calculateSimilarity(keywords, categoryKeywords);
      
      if (similarity > 0.5) { // 50% 이상 유사
        return category;
      }
    }

    return null;
  } catch (error) {
    console.error('유사 카테고리 검색 실패:', error);
    return null;
  }
}

/**
 * 키워드 추출 (간단한 형태소 분석)
 */
function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^\w가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1);
}

/**
 * 유사도 계산 (Jaccard 유사도)
 */
function calculateSimilarity(keywords1, keywords2) {
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * 기본 카테고리 ID 조회 (기타/일반)
 */
async function getDefaultCategoryId() {
  try {
    const defaultCategory = await prisma.clauseCategory.findFirst({
      where: {
        name: '기타/일반',
        isActive: true
      }
    });

    return defaultCategory?.id || 7; // 기본값
  } catch (error) {
    console.error('기본 카테고리 조회 실패:', error);
    return 7;
  }
}

/**
 * 제안된 카테고리 승인 처리
 */
export async function approveProposedCategory(proposedId, adminNotes = '') {
  try {
    const proposed = await prisma.proposedCategory.findUnique({
      where: { id: proposedId }
    });

    if (!proposed || proposed.status !== 'pending') {
      throw new Error('승인할 수 없는 제안입니다.');
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 1. 정식 카테고리로 생성
      const newCategory = await tx.clauseCategory.create({
        data: {
          name: proposed.name,
          description: proposed.description,
          level: 1, // 기본적으로 대분류
          isActive: true,
          isDefault: false
        }
      });

      // 2. 제안 상태 업데이트
      await tx.proposedCategory.update({
        where: { id: proposedId },
        data: {
          status: 'approved',
          adminNotes,
          reviewedAt: new Date()
        }
      });

      return newCategory;
    });

    console.log(`카테고리 승인 완료: ${result.name} (ID: ${result.id})`);
    return result;

  } catch (error) {
    console.error('카테고리 승인 실패:', error);
    throw error;
  }
}

/**
 * 제안된 카테고리 거부 처리
 */
export async function rejectProposedCategory(proposedId, adminNotes = '') {
  try {
    const updated = await prisma.proposedCategory.update({
      where: { id: proposedId },
      data: {
        status: 'rejected',
        adminNotes,
        reviewedAt: new Date()
      }
    });

    console.log(`카테고리 거부 완료: ${updated.name}`);
    return updated;

  } catch (error) {
    console.error('카테고리 거부 실패:', error);
    throw error;
  }
}

/**
 * 카테고리 사용 횟수 증가
 */
export async function incrementCategoryUsage(categoryId) {
  if (!categoryId) return;

  try {
    await prisma.clauseCategory.update({
      where: { id: categoryId },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });
  } catch (error) {
    console.error('카테고리 사용 횟수 업데이트 실패:', error);
  }
}

/**
 * 제안 대기 중인 카테고리 목록 조회
 */
export async function getPendingProposals() {
  try {
    return await prisma.proposedCategory.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('제안 카테고리 조회 실패:', error);
    return [];
  }
}

/**
 * 카테고리 통계 조회
 */
export async function getCategoryStats() {
  try {
    const activeCount = await prisma.clauseCategory.count({
      where: { isActive: true }
    });

    const pendingCount = await prisma.proposedCategory.count({
      where: { status: 'pending' }
    });

    const mostUsed = await prisma.clauseCategory.findMany({
      where: { isActive: true },
      orderBy: { usageCount: 'desc' },
      take: 5
    });

    return {
      activeCategories: activeCount,
      pendingProposals: pendingCount,
      mostUsedCategories: mostUsed
    };
  } catch (error) {
    console.error('카테고리 통계 조회 실패:', error);
    return {
      activeCategories: 0,
      pendingProposals: 0,
      mostUsedCategories: []
    };
  }
}