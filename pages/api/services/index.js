import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../lib/auth';

const prisma = new PrismaClient();

// 안전한 변환 함수들
function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return false;
}

function toNumber(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

function toString(value, defaultValue = '') {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

function toArray(value, defaultValue = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

export default async function handler(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다' });
    }

    let userId;
    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    if (req.method === 'GET') {
      const services = await prisma.service.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          duration: true,
          images: true, // image 대신 images
          features: true,
          images: true, // image 대신 images
          features: true,
          deliverables: true,
          planLevel: true,
          isPlan: true,
          isActive: true,
          categoryId: true,
          createdAt: true,
          category: {
            select: { id: true, name: true, type: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // 응답 데이터 정규화
      const normalizedServices = services.map(service => ({
        ...service,
        isPlan: toBoolean(service.isPlan),
        isActive: toBoolean(service.isActive),
        price: toNumber(service.price),
        features: toArray(service.features),
        deliverables: toArray(service.deliverables)
      }));
      
      return res.status(200).json(normalizedServices);
    }

    if (req.method === 'POST') {
      const { 
        categoryId, 
        title, 
        description, 
        price, 
        duration,
        images, // image 대신 images
        features,
        deliverables,
        planLevel,
        isPlan,
        isActive = true
      } = req.body;
      
      if (!categoryId || !title || !description) {
        return res.status(400).json({ error: '필수 필드가 누락되었습니다' });
      }

      const category = await prisma.serviceCategory.findFirst({
        where: { 
          id: categoryId,
          userId: user.id 
        }
      });

      if (!category) {
        return res.status(400).json({ error: '존재하지 않는 카테고리입니다' });
      }

      const maxOrder = await prisma.service.findFirst({
        where: { 
          categoryId: categoryId,
          userId: user.id 
        },
        orderBy: { order: 'desc' },
        select: { order: true }
      });

      const service = await prisma.service.create({
        data: {
          userId: user.id,
          categoryId,
          title: toString(title),
          description: toString(description),
          price: toNumber(price),
          duration: toString(duration),
          images: toString(images), // image 대신 images
          features: features ? JSON.stringify(toArray(features)) : null,
          deliverables: deliverables ? JSON.stringify(toArray(deliverables)) : null,
          planLevel: toString(planLevel) || null,
          isPlan: toBoolean(isPlan),
          isActive: toBoolean(isActive),
          order: (maxOrder?.order || 0) + 1
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          duration: true,
          images: true, // image 대신 images
          features: true,
          deliverables: true,
          planLevel: true,
          isPlan: true,
          isActive: true,
          categoryId: true,
          createdAt: true,
          category: {
            select: { id: true, name: true, type: true }
          }
        }
      });

      // 응답 데이터 정규화
      const normalizedService = {
        ...service,
        isPlan: toBoolean(service.isPlan),
        isActive: toBoolean(service.isActive),
        price: toNumber(service.price),
        features: toArray(service.features),
        deliverables: toArray(service.deliverables)
      };
      
      return res.status(201).json(normalizedService);
    }

    return res.status(405).json({ error: '허용되지 않는 메소드입니다' });
  } catch (error) {
    console.error('Services API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  } finally {
    await prisma.$disconnect();
  }
}