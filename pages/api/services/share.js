// pages/api/services/share.js - 서비스 공유 API
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '../../../lib/auth';
import crypto from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    const user = await getCurrentUser(req);
    
    if (!user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, user);
      case 'POST':
        return await handlePost(req, res, user);
      case 'DELETE':
        return await handleDelete(req, res, user);
      default:
        return res.status(405).json({ error: '지원하지 않는 메소드입니다.' });
    }
  } catch (error) {
    console.error('Share API 오류:', error);
    return res.status(500).json({ 
      error: '서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

// GET: 공유 링크 목록 조회
async function handleGet(req, res, user) {
  try {
    const sharedLinks = await prisma.sharedService.findMany({
      where: { userId: user.id },
      include: {
        services: {
          include: {
            category: true
          }
        },
        _count: {
          select: { services: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 응답 데이터 포맷팅
    const formattedLinks = sharedLinks.map(link => ({
      id: link.id,
      title: link.title,
      description: link.description,
      token: link.token,
      type: link.services.length === 1 ? 'single' : 'collection',
      serviceCount: link.services.length,
      viewCount: link.viewCount,
      isActive: link.isActive && (!link.expiryDate || new Date(link.expiryDate) > new Date()),
      hasPassword: !!link.password,
      expiryDate: link.expiryDate,
      createdAt: link.createdAt,
      services: link.services.map(service => ({
        id: service.id,
        title: service.title,
        price: service.price,
        category: service.category?.name
      }))
    }));

    return res.status(200).json(formattedLinks);
  } catch (error) {
    console.error('공유 링크 조회 오류:', error);
    return res.status(500).json({ error: '공유 링크 조회에 실패했습니다.' });
  }
}

// POST: 새 공유 링크 생성
async function handlePost(req, res, user) {
  const {
    type,
    selectedServices,
    title,
    description,
    thumbnailImage,
    expiryDate,
    password,
    customSlug
  } = req.body;

  // 유효성 검사
  if (!selectedServices || selectedServices.length === 0) {
    return res.status(400).json({ error: '공유할 서비스를 선택해주세요.' });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: '페이지 제목을 입력해주세요.' });
  }

  // 선택된 서비스들이 사용자 소유인지 확인
  const userServices = await prisma.service.findMany({
    where: {
      id: { in: selectedServices },
      userId: user.id
    }
  });

  if (userServices.length !== selectedServices.length) {
    return res.status(403).json({ error: '권한이 없는 서비스가 포함되어 있습니다.' });
  }

  try {
    // 토큰 생성
    let token;
    let isTokenUnique = false;
    
    // 커스텀 슬러그가 있으면 사용, 없으면 랜덤 토큰
    if (customSlug && customSlug.trim()) {
      const slugPattern = /^[a-zA-Z0-9-]+$/;
      if (!slugPattern.test(customSlug)) {
        return res.status(400).json({ error: '커스텀 URL은 영문, 숫자, 하이픈만 사용 가능합니다.' });
      }
      
      token = customSlug.trim().toLowerCase();
      
      // 중복 확인
      const existingLink = await prisma.sharedService.findUnique({
        where: { token }
      });
      
      if (existingLink) {
        return res.status(400).json({ error: '이미 사용 중인 URL입니다.' });
      }
      
      isTokenUnique = true;
    } else {
      // 랜덤 토큰 생성 (중복될 때까지 반복)
      while (!isTokenUnique) {
        token = crypto.randomBytes(16).toString('hex');
        const existingLink = await prisma.sharedService.findUnique({
          where: { token }
        });
        if (!existingLink) {
          isTokenUnique = true;
        }
      }
    }

    // 비밀번호 해시화
    let hashedPassword = null;
    if (password && password.trim()) {
      hashedPassword = crypto.createHash('sha256').update(password.trim()).digest('hex');
    }

    // 만료일 처리
    let parsedExpiryDate = null;
    if (expiryDate) {
      parsedExpiryDate = new Date(expiryDate);
      if (parsedExpiryDate <= new Date()) {
        return res.status(400).json({ error: '만료일은 현재 시간보다 늦어야 합니다.' });
      }
    }

    // 공유 링크 생성
    const sharedLink = await prisma.sharedService.create({
      data: {
        userId: user.id,
        token,
        title: title.trim(),
        description: description?.trim() || null,
        thumbnailImage: thumbnailImage?.trim() || null,
        password: hashedPassword,
        expiryDate: parsedExpiryDate,
        viewCount: 0,
        isActive: true,
        ogTitle: title.trim(),
        ogDescription: description?.trim() || `${user.name}의 ${title.trim()}`,
        ogImage: thumbnailImage?.trim() || null,
        services: {
          connect: selectedServices.map(id => ({ id: parseInt(id) }))
        }
      },
      include: {
        services: {
          include: {
            category: true
          }
        }
      }
    });

    return res.status(201).json({
      message: '공유 링크가 생성되었습니다.',
      link: {
        id: sharedLink.id,
        token: sharedLink.token,
        url: `/share/${sharedLink.token}`,
        title: sharedLink.title,
        serviceCount: sharedLink.services.length
      }
    });

  } catch (error) {
    console.error('공유 링크 생성 오류:', error);
    return res.status(500).json({ error: '공유 링크 생성에 실패했습니다.' });
  }
}

// DELETE: 공유 링크 삭제
async function handleDelete(req, res, user) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: '링크 ID가 필요합니다.' });
  }

  try {
    // 권한 확인
    const sharedLink = await prisma.sharedService.findFirst({
      where: {
        id: parseInt(id),
        userId: user.id
      }
    });

    if (!sharedLink) {
      return res.status(404).json({ error: '공유 링크를 찾을 수 없습니다.' });
    }

    // 삭제
    await prisma.sharedService.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({ message: '공유 링크가 삭제되었습니다.' });

  } catch (error) {
    console.error('공유 링크 삭제 오류:', error);
    return res.status(500).json({ error: '공유 링크 삭제에 실패했습니다.' });
  }
}