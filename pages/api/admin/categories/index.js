// pages/api/admin/categories/index.js - 조항 카테고리 관리 API
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '../../../../lib/auth';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const user = await getCurrentUser(req);
    
    // 관리자 권한 확인 (일반 사용자도 읽기는 가능)
    if (req.method !== 'GET' && (!user || user.role !== 'admin')) {
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res, user);
      case 'PUT':
        return await handlePut(req, res, user);
      case 'DELETE':
        return await handleDelete(req, res, user);
      default:
        return res.status(405).json({ error: '지원하지 않는 메소드입니다.' });
    }
  } catch (error) {
    console.error('Categories API 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}

// GET: 조항 카테고리 목록 조회
async function handleGet(req, res) {
  const { 
    level,
    parentId,
    includeInactive = false,
    includeStats = false 
  } = req.query;

  const where = {};
  
  // 레벨 필터
  if (level) {
    where.level = parseInt(level);
  }
  
  // 부모 카테고리 필터
  if (parentId) {
    where.parentId = parseInt(parentId);
  } else if (parentId === 'null') {
    where.parentId = null;
  }
  
  // 활성 상태 필터
  if (!includeInactive) {
    where.isActive = true;
  }

  try {
    const select = {
      id: true,
      name: true,
      level: true,
      parentId: true,
      description: true,
      isActive: true,
      isDefault: true,
      usageCount: true,
      createdAt: true,
      updatedAt: true
    };

    // 통계 포함 시 자식 카테고리 개수도 조회
    if (includeStats === 'true') {
      select._count = {
        select: {
          children: true
        }
      };
    }

    const categories = await prisma.clauseCategory.findMany({
      where,
      select,
      orderBy: [
        { level: 'asc' },
        { usageCount: 'desc' },
        { name: 'asc' }
      ]
    });

    // 계층 구조로 변환 (level 1만 요청된 경우)
    let result = categories;
    if (level === '1') {
      result = categories.map(category => ({
        ...category,
        // 자식 카테고리도 함께 로드
        children: categories.filter(c => c.parentId === category.id)
      }));
    }

    // 전체 통계
    const stats = includeStats === 'true' ? {
      totalCategories: await prisma.clauseCategory.count(),
      activeCategories: await prisma.clauseCategory.count({ where: { isActive: true } }),
      defaultCategories: await prisma.clauseCategory.count({ where: { isDefault: true } }),
      totalUsage: categories.reduce((sum, cat) => sum + (cat.usageCount || 0), 0)
    } : null;

    return res.status(200).json({
      categories: result,
      stats,
      total: categories.length
    });

  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    return res.status(500).json({ 
      error: '카테고리 조회에 실패했습니다.',
      details: error.message 
    });
  }
}

// POST: 새 카테고리 생성
async function handlePost(req, res, user) {
  const { 
    name, 
    description, 
    level = 1, 
    parentId,
    isDefault = false 
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: '카테고리 이름이 필요합니다.' });
  }

  try {
    // 중복 이름 검사
    const existingCategory = await prisma.clauseCategory.findUnique({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      return res.status(400).json({ 
        error: '이미 존재하는 카테고리 이름입니다.',
        existing: existingCategory 
      });
    }

    // 부모 카테고리 존재 확인 (level 2인 경우)
    if (level === 2 && parentId) {
      const parentCategory = await prisma.clauseCategory.findUnique({
        where: { id: parseInt(parentId) }
      });

      if (!parentCategory) {
        return res.status(400).json({ error: '부모 카테고리를 찾을 수 없습니다.' });
      }

      if (parentCategory.level !== 1) {
        return res.status(400).json({ error: '부모 카테고리는 1레벨이어야 합니다.' });
      }
    }

    const newCategory = await prisma.clauseCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        level: parseInt(level),
        parentId: parentId ? parseInt(parentId) : null,
        isDefault,
        isActive: true,
        usageCount: 0
      }
    });

    return res.status(201).json({
      message: '카테고리가 생성되었습니다.',
      category: newCategory
    });

  } catch (error) {
    console.error('카테고리 생성 오류:', error);
    return res.status(500).json({ 
      error: '카테고리 생성에 실패했습니다.',
      details: error.message 
    });
  }
}

// PUT: 카테고리 수정
async function handlePut(req, res, user) {
  const { id, name, description, isActive, parentId } = req.body;

  if (!id) {
    return res.status(400).json({ error: '카테고리 ID가 필요합니다.' });
  }

  try {
    const existingCategory = await prisma.clauseCategory.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: '카테고리를 찾을 수 없습니다.' });
    }

    // 기본 카테고리는 이름 변경 제한
    if (existingCategory.isDefault && name && name !== existingCategory.name) {
      return res.status(400).json({ 
        error: '기본 카테고리의 이름은 변경할 수 없습니다.' 
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (parentId !== undefined) updateData.parentId = parentId ? parseInt(parentId) : null;
    
    updateData.updatedAt = new Date();

    const updatedCategory = await prisma.clauseCategory.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return res.status(200).json({
      message: '카테고리가 업데이트되었습니다.',
      category: updatedCategory
    });

  } catch (error) {
    console.error('카테고리 수정 오류:', error);
    return res.status(500).json({ 
      error: '카테고리 수정에 실패했습니다.',
      details: error.message 
    });
  }
}

// DELETE: 카테고리 삭제
async function handleDelete(req, res, user) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: '카테고리 ID가 필요합니다.' });
  }

  try {
    const existingCategory = await prisma.clauseCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        children: true
      }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: '카테고리를 찾을 수 없습니다.' });
    }

    // 기본 카테고리 삭제 방지
    if (existingCategory.isDefault) {
      return res.status(400).json({ 
        error: '기본 카테고리는 삭제할 수 없습니다.' 
      });
    }

    // 자식 카테고리가 있는 경우 삭제 방지
    if (existingCategory.children && existingCategory.children.length > 0) {
      return res.status(400).json({ 
        error: `이 카테고리에 ${existingCategory.children.length}개의 하위 카테고리가 있어 삭제할 수 없습니다.`,
        children: existingCategory.children.length
      });
    }

    // 사용 중인 카테고리인지 확인 (ClauseCandidate, ContractTemplate 등에서 사용)
    const usageCount = await checkCategoryUsage(parseInt(id));
    if (usageCount > 0) {
      return res.status(400).json({ 
        error: `이 카테고리가 ${usageCount}개의 조항에서 사용 중이어 삭제할 수 없습니다.`,
        usageCount
      });
    }

    await prisma.clauseCategory.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({
      message: '카테고리가 삭제되었습니다.',
      deletedId: parseInt(id)
    });

  } catch (error) {
    console.error('카테고리 삭제 오류:', error);
    return res.status(500).json({ 
      error: '카테고리 삭제에 실패했습니다.',
      details: error.message 
    });
  }
}

// 카테고리 사용량 확인 헬퍼 함수
async function checkCategoryUsage(categoryId) {
  try {
    const [candidateCount, templateCount] = await Promise.all([
      prisma.clauseCandidate.count({
        where: { category: categoryId.toString() }
      }),
      prisma.contractTemplate.count({
        where: { category: categoryId.toString() }
      })
    ]);

    return candidateCount + templateCount;
  } catch (error) {
    console.error('카테고리 사용량 확인 오류:', error);
    return 0;
  }
}