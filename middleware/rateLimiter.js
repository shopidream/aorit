// middleware/rateLimiter.js - API 호출 제한
class RateLimiter {
    constructor() {
      this.requests = new Map();
      this.cleanup();
    }
  
    // 정기적으로 오래된 요청 기록 정리
    cleanup() {
      setInterval(() => {
        const now = Date.now();
        for (const [key, data] of this.requests.entries()) {
          if (now - data.resetTime > 60000) { // 1분 후 정리
            this.requests.delete(key);
          }
        }
      }, 60000); // 1분마다 실행
    }
  
    // IP별 요청 제한 확인
    checkLimit(ip, limit = 100, windowMs = 60000) {
      const now = Date.now();
      const key = `${ip}`;
      
      if (!this.requests.has(key)) {
        this.requests.set(key, {
          count: 1,
          resetTime: now + windowMs
        });
        return { allowed: true, remaining: limit - 1 };
      }
  
      const data = this.requests.get(key);
      
      // 시간 윈도우가 리셋되었는지 확인
      if (now > data.resetTime) {
        this.requests.set(key, {
          count: 1,
          resetTime: now + windowMs
        });
        return { allowed: true, remaining: limit - 1 };
      }
  
      // 제한 확인
      if (data.count >= limit) {
        return { 
          allowed: false, 
          remaining: 0,
          resetTime: data.resetTime
        };
      }
  
      // 요청 카운트 증가
      data.count++;
      return { 
        allowed: true, 
        remaining: limit - data.count
      };
    }
  
    // 사용자별 요청 제한 (로그인한 사용자)
    checkUserLimit(userId, limit = 1000, windowMs = 60000) {
      return this.checkLimit(`user:${userId}`, limit, windowMs);
    }
  
    // API 엔드포인트별 제한
    checkEndpointLimit(ip, endpoint, limit = 50, windowMs = 60000) {
      return this.checkLimit(`${ip}:${endpoint}`, limit, windowMs);
    }
  }
  
  const rateLimiter = new RateLimiter();
  
  // 일반 API 요청 제한 미들웨어
  export const apiRateLimit = (limit = 100, windowMs = 60000) => {
    return (req, res, next) => {
      const ip = getClientIP(req);
      const result = rateLimiter.checkLimit(ip, limit, windowMs);
  
      // 응답 헤더 추가
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      
      if (result.resetTime) {
        res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
      }
  
      if (!result.allowed) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        });
      }
  
      next();
    };
  };
  
  // 인증 API 요청 제한 (더 엄격)
  export const authRateLimit = (req, res, next) => {
    const ip = getClientIP(req);
    const result = rateLimiter.checkLimit(ip, 10, 900000); // 15분에 10회
  
    res.setHeader('X-RateLimit-Limit', 10);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
  
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too Many Authentication Attempts',
        message: '인증 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      });
    }
  
    next();
  };
  
  // 이메일 발송 제한
  export const emailRateLimit = (req, res, next) => {
    const ip = getClientIP(req);
    const result = rateLimiter.checkEndpointLimit(ip, 'email', 5, 300000); // 5분에 5회
  
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Email Rate Limit Exceeded',
        message: '이메일 발송 한도를 초과했습니다. 5분 후 다시 시도해주세요.'
      });
    }
  
    next();
  };
  
  // 파일 업로드 제한
  export const uploadRateLimit = (req, res, next) => {
    const ip = getClientIP(req);
    const result = rateLimiter.checkEndpointLimit(ip, 'upload', 20, 3600000); // 1시간에 20회
  
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Upload Rate Limit Exceeded',
        message: '파일 업로드 한도를 초과했습니다. 1시간 후 다시 시도해주세요.'
      });
    }
  
    next();
  };
  
  // 사용자별 요청 제한 미들웨어
  export const userRateLimit = (limit = 1000, windowMs = 3600000) => {
    return (req, res, next) => {
      const userId = req.user?.id;
      
      if (!userId) {
        return next(); // 로그인하지 않은 사용자는 IP 기반 제한 사용
      }
  
      const result = rateLimiter.checkUserLimit(userId, limit, windowMs);
  
      if (!result.allowed) {
        return res.status(429).json({
          error: 'User Rate Limit Exceeded',
          message: '사용자별 요청 한도를 초과했습니다.'
        });
      }
  
      next();
    };
  };
  
  // 클라이언트 IP 주소 추출
  const getClientIP = (req) => {
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      '127.0.0.1'
    );
  };
  
  // Next.js API 라우트에서 사용할 수 있는 래퍼
  export const withRateLimit = (handler, options = {}) => {
    const { limit = 100, windowMs = 60000, type = 'api' } = options;
    
    return async (req, res) => {
      // 개발 환경에서는 rate limiting 비활성화
      if (process.env.NODE_ENV === 'development') {
        return handler(req, res);
      }
  
      const ip = getClientIP(req);
      let result;
  
      switch (type) {
        case 'auth':
          result = rateLimiter.checkLimit(ip, 10, 900000);
          break;
        case 'email':
          result = rateLimiter.checkEndpointLimit(ip, 'email', 5, 300000);
          break;
        case 'upload':
          result = rateLimiter.checkEndpointLimit(ip, 'upload', 20, 3600000);
          break;
        default:
          result = rateLimiter.checkLimit(ip, limit, windowMs);
      }
  
      if (!result.allowed) {
        return res.status(429).json({
          error: 'Rate Limit Exceeded',
          message: '요청 한도를 초과했습니다.',
          retryAfter: result.resetTime ? Math.ceil((result.resetTime - Date.now()) / 1000) : 60
        });
      }
  
      return handler(req, res);
    };
  };
  
  export default rateLimiter;