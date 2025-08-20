// lib/validation.js
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('비밀번호는 8자 이상이어야 합니다');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다');
  }
  
  if (!/\d/.test(password)) {
    errors.push('숫자를 포함해야 합니다');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9-+\s()]+$/;
  return phoneRegex.test(phone) && phone.length >= 10;
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateRequired = (value, fieldName = '필드') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, error: `${fieldName}는 필수입니다` };
  }
  return { isValid: true };
};

export const validateLength = (value, min = 0, max = Infinity, fieldName = '필드') => {
  const length = value ? value.toString().length : 0;
  
  if (length < min) {
    return { isValid: false, error: `${fieldName}는 최소 ${min}자 이상이어야 합니다` };
  }
  
  if (length > max) {
    return { isValid: false, error: `${fieldName}는 최대 ${max}자까지 가능합니다` };
  }
  
  return { isValid: true };
};

export const validateNumber = (value, min = -Infinity, max = Infinity, fieldName = '숫자') => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName}는 숫자여야 합니다` };
  }
  
  if (num < min) {
    return { isValid: false, error: `${fieldName}는 ${min} 이상이어야 합니다` };
  }
  
  if (num > max) {
    return { isValid: false, error: `${fieldName}는 ${max} 이하여야 합니다` };
  }
  
  return { isValid: true, value: num };
};

export const validateServiceData = (data) => {
  const errors = [];
  
  const titleValidation = validateRequired(data.title, '서비스 제목');
  if (!titleValidation.isValid) errors.push(titleValidation.error);
  
  const lengthValidation = validateLength(data.title, 1, 100, '서비스 제목');
  if (!lengthValidation.isValid) errors.push(lengthValidation.error);
  
  if (data.price) {
    const priceValidation = validateNumber(data.price, 0, 999999999, '가격');
    if (!priceValidation.isValid) errors.push(priceValidation.error);
  }
  
  if (data.description) {
    const descValidation = validateLength(data.description, 0, 1000, '설명');
    if (!descValidation.isValid) errors.push(descValidation.error);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateClientData = (data) => {
  const errors = [];
  
  const nameValidation = validateRequired(data.name, '고객명');
  if (!nameValidation.isValid) errors.push(nameValidation.error);
  
  const emailValidation = validateRequired(data.email, '이메일');
  if (!emailValidation.isValid) errors.push(emailValidation.error);
  else if (!validateEmail(data.email)) {
    errors.push('올바른 이메일 형식이 아닙니다');
  }
  
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('올바른 전화번호 형식이 아닙니다');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateQuoteData = (data) => {
  const errors = [];
  
  const clientValidation = validateRequired(data.clientId, '고객');
  if (!clientValidation.isValid) errors.push(clientValidation.error);
  
  const serviceValidation = validateRequired(data.serviceId, '서비스');
  if (!serviceValidation.isValid) errors.push(serviceValidation.error);
  
  const amountValidation = validateNumber(data.amount, 1, 999999999, '견적 금액');
  if (!amountValidation.isValid) errors.push(amountValidation.error);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateContractData = (data) => {
  const errors = [];
  
  const clientValidation = validateRequired(data.clientId, '고객');
  if (!clientValidation.isValid) errors.push(clientValidation.error);
  
  const quoteValidation = validateRequired(data.quoteId, '견적');
  if (!quoteValidation.isValid) errors.push(quoteValidation.error);
  
  if (!data.clauses || data.clauses.length === 0) {
    errors.push('계약 조항이 필요합니다');
  }
  
  if (data.industry && !['design', 'development', 'marketing', 'consulting'].includes(data.industry)) {
    errors.push('올바른 업종을 선택해주세요');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSignatureData = (data) => {
  const errors = [];
  
  const nameValidation = validateRequired(data.signerName, '서명자 이름');
  if (!nameValidation.isValid) errors.push(nameValidation.error);
  
  const emailValidation = validateRequired(data.signerEmail, '서명자 이메일');
  if (!emailValidation.isValid) errors.push(emailValidation.error);
  else if (!validateEmail(data.signerEmail)) {
    errors.push('올바른 이메일 형식이 아닙니다');
  }
  
  const typeValidation = validateRequired(data.signerType, '서명자 유형');
  if (!typeValidation.isValid) errors.push(typeValidation.error);
  else if (!['freelancer', 'client'].includes(data.signerType)) {
    errors.push('올바른 서명자 유형이 아닙니다');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>'"]/g, '')
    .substring(0, 1000);
};