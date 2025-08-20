// lib/dataTypes.js - 안전한 데이터 타입 시스템

/**
 * 서비스 데이터 타입 정의 및 정규화
 */

// 기본 서비스 스키마
export const ServiceSchema = {
    id: '',
    title: '',
    description: '',
    price: 0,
    duration: '',
    image: null,
    features: [],
    deliverables: [],
    category: null,
    isActive: true,
    createdAt: null,
    updatedAt: null
  };
  
  // 카테고리 스키마
  export const CategorySchema = {
    id: '',
    name: '',
    type: 'standard'
  };
  
  /**
   * 안전한 배열 정규화
   */
  export function normalizeArray(data, defaultValue = []) {
    if (Array.isArray(data)) {
      return data.filter(item => item !== null && item !== undefined);
    }
    
    if (typeof data === 'string') {
      if (!data.trim()) return defaultValue;
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed.filter(item => item !== null && item !== undefined) : defaultValue;
      } catch {
        return defaultValue;
      }
    }
    
    return defaultValue;
  }
  
  /**
   * 안전한 텍스트 추출
   */
  export function extractText(data, fallback = '') {
    if (!data) return fallback;
    
    if (typeof data === 'string') {
      const trimmed = data.trim();
      return (trimmed && trimmed !== 'undefined' && trimmed !== 'null') ? trimmed : fallback;
    }
    
    if (typeof data === 'object' && data !== null) {
      const candidates = [data.title, data.name, data.text, data.label, data.value];
      for (const candidate of candidates) {
        const text = extractText(candidate);
        if (text && text !== fallback) return text;
      }
    }
    
    return fallback;
  }
  
  /**
   * 카테고리 정규화
   */
  export function normalizeCategory(category) {
    if (!category) {
      return { ...CategorySchema, name: '미분류' };
    }
    
    if (typeof category === 'string') {
      return { ...CategorySchema, name: category };
    }
    
    if (typeof category === 'object') {
      return {
        id: category.id || '',
        name: extractText(category.name, '미분류'),
        type: category.type || 'standard'
      };
    }
    
    return { ...CategorySchema, name: '미분류' };
  }
  
  /**
   * 서비스 데이터 완전 정규화
   */
  export function normalizeService(rawService) {
    if (!rawService || typeof rawService !== 'object') {
      return { ...ServiceSchema };
    }
    
    return {
      id: rawService.id || '',
      title: extractText(rawService.title, '제목 없음'),
      description: extractText(rawService.description, ''),
      price: parseFloat(rawService.price) || 0,
      duration: extractText(rawService.duration, ''),
      image: rawService.image || null,
      images: rawService.images || null,
      features: normalizeArray(rawService.features),
      deliverables: normalizeArray(rawService.deliverables),
      category: normalizeCategory(rawService.category),
      isActive: Boolean(rawService.isActive),
      createdAt: rawService.createdAt || null,
      updatedAt: rawService.updatedAt || null
    };
  }
  
  /**
   * 여러 서비스 정규화
   */
  export function normalizeServices(rawServices) {
    if (!Array.isArray(rawServices)) return [];
    return rawServices.map(normalizeService);
  }
  
  /**
   * 폼 데이터 정규화 (편집용)
   */
  export function normalizeFormData(rawService) {
    const normalized = normalizeService(rawService);
    
    return {
      categoryId: normalized.category?.id || '',
      title: normalized.title,
      description: normalized.description,
      price: normalized.price,
      duration: normalized.duration,
      image: normalized.image,
      features: normalized.features,
      deliverables: normalized.deliverables,
      isActive: normalized.isActive
    };
  }
  
  /**
   * 렌더링용 안전한 텍스트 리스트
   */
  export function renderTextList(items, maxItems = 3) {
    const normalizedItems = normalizeArray(items);
    const validItems = normalizedItems.map(item => extractText(item)).filter(text => text);
    
    return {
      items: validItems.slice(0, maxItems),
      hasMore: validItems.length > maxItems,
      totalCount: validItems.length
    };
  }
  
  /**
   * 가격 포맷팅
   */
  export function formatPrice(price) {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return '가격 문의';
    return `${numPrice.toLocaleString()}원`;
  }
  
  /**
   * API 응답 정규화 (수정된 버전)
   */
  export function normalizeApiResponse(response) {
    if (!response) return null;
    
    // 카테고리 배열 (서비스 포함) - categories API 응답
    if (Array.isArray(response) && response[0] && response[0].services !== undefined) {
      return response.map(category => ({
        id: category.id || '',
        name: category.name || '미분류', // 카테고리는 name 필드 사용
        type: category.type || 'standard',
        services: normalizeServices(category.services || [])
      }));
    }
    
    // 단일 서비스
    if (response.id && response.title) {
      return normalizeService(response);
    }
    
    // 서비스 배열
    if (Array.isArray(response)) {
      return normalizeServices(response);
    }
    
    return response;
  }