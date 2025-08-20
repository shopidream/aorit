// lib/koreanFormUtils.js - 한국 폼 검증 및 포맷팅 유틸리티

// 한국 휴대폰 번호 포맷팅 (010-0000-0000)
export const formatKoreanMobile = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };
  
  // 한국 일반전화 번호 포맷팅 (02-0000-0000, 031-000-0000, 070-0000-0000 등)
  export const formatKoreanPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    
    // 02로 시작하는 경우 (서울)
    if (numbers.startsWith('02')) {
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }
    
    // 070으로 시작하는 경우 (인터넷전화)
    if (numbers.startsWith('070')) {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
    
    // 050X로 시작하는 경우 (인터넷전화: 0503, 0504, 0505, 0506 등)
    if (numbers.startsWith('050')) {
      if (numbers.length <= 4) return numbers;
      
      // 11자리: 0505-000-0000
      if (numbers.length <= 7) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
      if (numbers.length === 11) return `${numbers.slice(0, 4)}-${numbers.slice(4, 7)}-${numbers.slice(7, 11)}`;
      
      // 12자리: 0500-0000-0000
      if (numbers.length <= 8) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
      return `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}-${numbers.slice(8, 12)}`;
    }
    
    // 기타 지역번호 (031, 032, 051, 052 등)
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };
  
  // 사업자번호 포맷팅 (000-00-00000)
  export const formatBusinessNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };
  
  // 웹사이트 URL 실시간 자동 포맷팅
  export const formatWebsiteUrl = (value) => {
    if (!value || !value.trim()) return '';
    
    const trimmed = value.trim();
    
    // 이미 http:// 또는 https://로 시작하면 그대로 반환
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    // 문자가 있으면 https:// 자동 추가
    if (trimmed.length > 0) {
      return `https://${trimmed}`;
    }
    
    return '';
  };
  
  // 웹사이트 URL에서 https:// 제거 (사용자가 편집할 때)
  export const stripHttpsPrefix = (value) => {
    if (!value) return '';
    return value.replace(/^https?:\/\//, '');
  };
  
  // 한국 전화번호 검증
  export const validateKoreanPhone = (phone) => {
    const numbers = phone.replace(/\D/g, '');
    
    // 휴대폰 (010, 011, 016, 017, 018, 019)
    const mobilePattern = /^(010|011|016|017|018|019)\d{7,8}$/;
    
    // 일반전화 (02 + 7-8자리, 기타지역 3자리 + 6-7자리)
    const landlinePattern = /^(02\d{7,8}|0[3-9]\d{1,2}\d{6,7})$/;
    
    // 인터넷전화 (070 + 8자리, 050X + 7-8자리)
    const internetPattern = /^(070\d{8}|050[3-9]\d{7,8})$/;
    
    return mobilePattern.test(numbers) || landlinePattern.test(numbers) || internetPattern.test(numbers);
  };
  
  // 사업자번호 검증 (10자리)
  export const validateBusinessNumber = (businessNumber) => {
    const numbers = businessNumber.replace(/\D/g, '');
    return numbers.length === 10;
  };
  
  // 이메일 검증 (@ 있고, . 있어야 함)
  export const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };
  
  // 검증 메시지 (한국어)
  export const getValidationMessage = (field, value) => {
    switch (field) {
      case 'phone':
        if (!value) return '';
        if (!validateKoreanPhone(value)) {
          return '올바른 전화번호 형식이 아닙니다. (예: 010-0000-0000, 02-0000-0000, 0505-000-0000)';
        }
        break;
      case 'email':
        if (!value) return '';
        if (!validateEmail(value)) {
          return '올바른 이메일 형식이 아닙니다. (예: example@company.com)';
        }
        break;
      case 'businessNumber':
        if (!value) return '';
        if (!validateBusinessNumber(value)) {
          return '올바른 사업자번호 형식이 아닙니다. (10자리 숫자)';
        }
        break;
      default:
        return '';
    }
    return '';
  };
  
  // 전화번호 타입 감지 및 포맷팅
  export const autoFormatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    
    // 휴대폰 번호로 판단되는 경우
    if (numbers.startsWith('010') || numbers.startsWith('011') || 
        numbers.startsWith('016') || numbers.startsWith('017') || 
        numbers.startsWith('018') || numbers.startsWith('019')) {
      return formatKoreanMobile(value);
    }
    
    // 일반전화, 인터넷전화로 판단되는 경우
    return formatKoreanPhone(value);
  };