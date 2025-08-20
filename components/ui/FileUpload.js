// components/ui/FileUpload.js - 파일 업로드 컴포넌트
import React, { useState, useRef } from 'react';
import { Button, Alert } from './DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';

export default function FileUpload({ 
  onUpload, 
  accept = "image/*", 
  maxSize = 5 * 1024 * 1024, // 5MB
  className = "",
  children 
}) {
  const { getAuthHeaders } = useAuthContext();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // 파일 크기 체크
    if (file.size > maxSize) {
      setError(`파일 크기는 ${Math.round(maxSize / 1024 / 1024)}MB 이하여야 합니다`);
      return;
    }

    setUploading(true);

    try {
      // 파일을 Base64로 변환
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 서버에 업로드
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          file: base64,
          filename: file.name,
          type: file.type
        })
      });

      const data = await response.json();

      if (data.success) {
        onUpload?.(data);
      } else {
        setError(data.error || '업로드에 실패했습니다');
      }
    } catch (error) {
      console.error('업로드 에러:', error);
      setError('업로드 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={className}>
      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {children ? (
        <div onClick={handleFileSelect} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={handleFileSelect}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? '업로드 중...' : '파일 선택'}
        </Button>
      )}
    </div>
  );
}