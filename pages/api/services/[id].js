import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../../../lib/auth';

const prisma = new PrismaClient();

// 안전한 Boolean 변환
function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return false;
}

// 안전한 Number 변환
function toNumber(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

// 안전한 String 변환
function toString(value, defaultValue = '') {
  if (value === null || value === undefined) return defaultValue;
  return String(value);
}

// 안전한 Array 변환
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
    
    const { id } = req.query;
    
    // AI 생성 서비스 (임시 ID)인 경우 새로 생성
    if (typeof id === 'string' && id.startsWith('ai_')) {
      if (req.method === 'PUT' || req.method === 'PATCH') {
        // AI 서비스를 새 서비스로 저장
        const { 
          categoryId, 
          title, 
          description, 
          price, 
          duration,
          images,
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
            categoryId: toString(categoryId),
            title: toString(title),
            description: toString(description),
            price: toNumber(price),
            duration: toString(duration),
            images: toString(images),
            features: features ? JSON.stringify(toArray(features)) : null,
            deliverables: deliverables ? JSON.stringify(toArray(deliverables)) : null,
            planLevel: toString(planLevel) || null,
            isPlan: toBoolean(isPlan),
            isActive: toBoolean(isActive),
            order: (maxOrder?.order || 0) + 1
          },
          include: {
            category: {
              select: { id: true, name: true, type: true }
            }
          }
        });

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
      
      return res.status(404).json({ error: 'AI 생성 서비스는 조회할 수 없습니다' });
    }

    const serviceId = parseInt(id);
    if (isNaN(serviceId)) {
      return res.status(400).json({ error: '유효하지 않은 서비스 ID입니다' });
    }

    if (req.method === 'GET') {
      const service = await prisma.service.findFirst({
        where: { 
          id: serviceId,
          userId: user.id 
        },
        include: {
          category: {
            select: { id: true, name: true, type: true }
          }
        }
      });
    
      if (!service) {
        return res.status(404).json({ error: '서비스를 찾을 수 없습니다' });
      }

      // 응답 데이터 정규화
      const normalizedService = {
        ...service,
        isPlan: toBoolean(service.isPlan),
        isActive: toBoolean(service.isActive),
        price: toNumber(service.price),
        features: toArray(service.features),
        deliverables: toArray(service.deliverables)
      };

      return res.status(200).json(normalizedService);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { 
        categoryId,
        title, 
        description, 
        price, 
        duration,
        images,
        features,
        deliverables,
        planLevel,
        isPlan,
        isActive
      } = req.body;
      
      const existingService = await prisma.service.findFirst({
        where: { 
          id: serviceId,
          userId: user.id 
        }
      });

      if (!existingService) {
        return res.status(404).json({ error: '서비스를 찾을 수 없습니다' });
      }

      // 카테고리 유효성 검사
      if (categoryId && categoryId !== existingService.categoryId) {
        const category = await prisma.serviceCategory.findFirst({
          where: { 
            id: categoryId,
            userId: user.id 
          }
        });

        if (!category) {
          return res.status(400).json({ error: '존재하지 않는 카테고리입니다' });
        }
      }

      // 업데이트 데이터 안전하게 구성
      const updateData = {};
      
      if (categoryId !== undefined) updateData.categoryId = toString(categoryId);
      if (title !== undefined) updateData.title = toString(title);
      if (description !== undefined) updateData.description = toString(description);
      if (price !== undefined) updateData.price = toNumber(price);
      if (duration !== undefined) updateData.duration = toString(duration);
      if (images !== undefined) updateData.images = toString(images);
      if (features !== undefined) updateData.features = JSON.stringify(toArray(features));
      if (deliverables !== undefined) updateData.deliverables = JSON.stringify(toArray(deliverables));
      if (planLevel !== undefined) updateData.planLevel = toString(planLevel) || null;
      
      // Boolean 필드 안전 처리
      if (isPlan !== undefined) updateData.isPlan = toBoolean(isPlan);
      if (isActive !== undefined) updateData.isActive = toBoolean(isActive);

      const service = await prisma.service.update({
        where: { 
          id: serviceId
        },
        data: updateData,
        include: {
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
      
      return res.status(200).json(normalizedService);
    }

    if (req.method === 'DELETE') {
      const service = await prisma.service.findFirst({
        where: { 
          id: serviceId,
          userId: user.id 
        }
      });

      if (!service) {
        return res.status(404).json({ error: '서비스를 찾을 수 없습니다' });
      }

      // 서비스에 연결된 이미지 파일들 삭제
      if (service.images) {
        try {
          const fs = require('fs');
          const path = require('path');
          
          const images = toArray(service.images);
          
          for (const imagePath of images) {
            if (imagePath && typeof imagePath === 'string') {
              // URL에서 실제 파일 경로 추출 (/uploads/... -> public/uploads/...)
              const cleanPath = imagePath.replace(/^\//, ''); // 앞의 / 제거
              const fullPath = path.join(process.cwd(), 'public', cleanPath);
              
              // 파일이 존재하면 삭제
              if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log('이미지 파일 삭제:', fullPath);
              }
            }
          }
        } catch (error) {
          console.error('이미지 파일 삭제 중 오류:', error);
          // 이미지 삭제 실패해도 서비스는 삭제 진행
        }
      }

      await prisma.service.delete({
        where: { 
          id: serviceId
        }
      });
      
      return res.status(200).json({ message: '서비스가 삭제되었습니다' });
    }

    return res.status(405).json({ error: '허용되지 않는 메소드입니다' });
  } catch (error) {
    console.error('Service API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다' });
  } finally {
    await prisma.$disconnect();
  }
}