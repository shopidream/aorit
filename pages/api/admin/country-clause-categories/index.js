// pages/api/admin/country-clause-categories/index.js - 국가별 조항 카테고리 API
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { countryCode } = req.query;

    if (!countryCode) {
      return res.status(400).json({ error: 'countryCode parameter is required' });
    }

    console.log(`🔍 조항 카테고리 조회: ${countryCode}`);

    // 해당 국가의 조항 카테고리 조회
    const categories = await prisma.countryClauseCategory.findMany({
      where: {
        countryCode: countryCode.toLowerCase(),
        isActive: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { categoryName: 'asc' }
      ],
      select: {
        id: true,
        categoryKey: true,
        categoryName: true,
        description: true,
        riskWeight: true,
        isRequired: true,
        sortOrder: true,
        usageCount: true
      }
    });

    console.log(`📋 ${countryCode.toUpperCase()} 카테고리 ${categories.length}개 조회됨`);

    // 카테고리가 없는 경우 기본 카테고리 조회
    if (categories.length === 0) {
      console.log(`⚠️ ${countryCode} 카테고리 없음, default 카테고리 조회`);
      
      const defaultCategories = await prisma.countryClauseCategory.findMany({
        where: {
          countryCode: 'default',
          isActive: true
        },
        orderBy: [
          { sortOrder: 'asc' },
          { categoryName: 'asc' }
        ],
        select: {
          id: true,
          categoryKey: true,
          categoryName: true,
          description: true,
          riskWeight: true,
          isRequired: true,
          sortOrder: true,
          usageCount: true
        }
      });

      console.log(`📋 기본 카테고리 ${defaultCategories.length}개 반환`);

      return res.status(200).json({
        success: true,
        countryCode,
        categories: defaultCategories,
        isDefault: true,
        message: `${countryCode} 전용 카테고리 없음, 기본 카테고리 사용`
      });
    }

    return res.status(200).json({
      success: true,
      countryCode,
      categories,
      isDefault: false,
      message: `${countryCode.toUpperCase()} 조항 카테고리 ${categories.length}개 조회 완료`
    });

  } catch (error) {
    console.error('❌ 조항 카테고리 조회 오류:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}