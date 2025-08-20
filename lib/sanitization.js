// lib/sanitization.js - 데이터 정제
export const sanitizeHtml = (html) => {
    if (typeof html !== 'string') return '';
    
    // 허용된 태그와 속성 정의
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'];
    const allowedAttributes = [];
    
    // 기본 HTML 태그 제거 (허용된 태그 제외)
    let sanitized = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^<>]*>/gi, (match, tag) => {
      return allowedTags.includes(tag.toLowerCase()) ? match : '';
    });
    
    // 스크립트 태그 완전 제거
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // 이벤트 핸들러 제거
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // javascript: 프로토콜 제거
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    return sanitized.trim();
  };
  
  export const sanitizeText = (text) => {
    if (typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/[<>'"&]/g, (char) => {
        const entityMap = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entityMap[char];
      })
      .substring(0, 10000); // 최대 길이 제한
  };
  
  export const sanitizeEmail = (email) => {
    if (typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@.-]/g, '')
      .substring(0, 254); // 이메일 최대 길이
  };
  
  export const sanitizePhone = (phone) => {
    if (typeof phone !== 'string') return '';
    
    return phone
      .replace(/[^0-9-+() ]/g, '')
      .trim()
      .substring(0, 20);
  };
  
  export const sanitizeUrl = (url) => {
    if (typeof url !== 'string') return '';
    
    // 프로토콜이 없으면 https 추가
    if (url && !url.match(/^https?:\/\//)) {
      url = 'https://' + url;
    }
    
    try {
      const parsed = new URL(url);
      // 허용된 프로토콜만
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return '';
      }
      return parsed.toString();
    } catch {
      return '';
    }
  };
  
  export const sanitizeSlug = (slug) => {
    if (typeof slug !== 'string') return '';
    
    return slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  };
  
  export const sanitizeNumber = (value, min = -Infinity, max = Infinity) => {
    const num = parseFloat(value);
    
    if (isNaN(num)) return null;
    
    return Math.min(Math.max(num, min), max);
  };
  
  export const sanitizeObject = (obj, schema) => {
    if (!obj || typeof obj !== 'object') return {};
    
    const sanitized = {};
    
    Object.keys(schema).forEach(key => {
      if (obj[key] !== undefined) {
        const rule = schema[key];
        let value = obj[key];
        
        switch (rule.type) {
          case 'string':
            value = sanitizeText(value);
            if (rule.maxLength) {
              value = value.substring(0, rule.maxLength);
            }
            break;
            
          case 'email':
            value = sanitizeEmail(value);
            break;
            
          case 'phone':
            value = sanitizePhone(value);
            break;
            
          case 'url':
            value = sanitizeUrl(value);
            break;
            
          case 'number':
            value = sanitizeNumber(value, rule.min, rule.max);
            break;
            
          case 'slug':
            value = sanitizeSlug(value);
            break;
            
          case 'html':
            value = sanitizeHtml(value);
            break;
            
          case 'boolean':
            value = Boolean(value);
            break;
            
          default:
            value = sanitizeText(value);
        }
        
        if (value !== null && value !== '') {
          sanitized[key] = value;
        }
      }
    });
    
    return sanitized;
  };
  
  // 자주 사용되는 스키마들
  export const schemas = {
    user: {
      name: { type: 'string', maxLength: 100 },
      email: { type: 'email' },
      password: { type: 'string', maxLength: 200 }
    },
    
    service: {
      title: { type: 'string', maxLength: 200 },
      description: { type: 'string', maxLength: 2000 },
      price: { type: 'number', min: 0, max: 999999999 },
      category: { type: 'string', maxLength: 50 },
      duration: { type: 'string', maxLength: 100 }
    },
    
    client: {
      name: { type: 'string', maxLength: 100 },
      email: { type: 'email' },
      phone: { type: 'phone' },
      company: { type: 'string', maxLength: 200 }
    },
    
    profile: {
      bio: { type: 'string', maxLength: 1000 },
      website: { type: 'url' },
      youtube: { type: 'url' },
      phone: { type: 'phone' },
      address: { type: 'string', maxLength: 500 }
    },
    
    publicPage: {
      slug: { type: 'slug' },
      theme: { type: 'string', maxLength: 50 },
      isActive: { type: 'boolean' }
    }
  };
  
  export const sanitizeUserInput = (data) => sanitizeObject(data, schemas.user);
  export const sanitizeServiceInput = (data) => sanitizeObject(data, schemas.service);
  export const sanitizeClientInput = (data) => sanitizeObject(data, schemas.client);
  export const sanitizeProfileInput = (data) => sanitizeObject(data, schemas.profile);
  export const sanitizePublicPageInput = (data) => sanitizeObject(data, schemas.publicPage);