// lib/fileHandler.js - 파일 처리 유틸리티
import path from 'path';
import { promises as fs } from 'fs';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'text/plain'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const validateFile = (file, allowedTypes = ALLOWED_IMAGE_TYPES, maxSize = MAX_FILE_SIZE) => {
  const errors = [];

  if (!file) {
    errors.push('파일이 선택되지 않았습니다');
    return { isValid: false, errors };
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`지원하지 않는 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    errors.push(`파일 크기가 너무 큽니다. 최대 크기: ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const generateFileName = (originalName, userId) => {
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  
  return `${userId}_${timestamp}_${baseName}${ext}`;
};

export const ensureUploadDir = async (userId) => {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', userId.toString());
  
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  
  return uploadDir;
};

export const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('파일 삭제 실패:', error);
    return false;
  }
};

export const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  } catch {
    return { exists: false };
  }
};

export const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = img;
      
      // 비율 유지하면서 크기 조정
      let newWidth = width;
      let newHeight = height;
      
      if (width > maxWidth) {
        newWidth = maxWidth;
        newHeight = (height * maxWidth) / width;
      }
      
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = (newWidth * maxHeight) / newHeight;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      canvas.toBlob(resolve, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};