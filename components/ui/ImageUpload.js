// components/ui/ImageUpload.js - 이미지 업로드 컴포넌트
import React, { useState } from 'react';
import FileUpload from './FileUpload';
import { Button } from './DesignSystem';

export default function ImageUpload({ 
  currentImage, 
  onImageChange, 
  width = 200, 
  height = 200,
  className = "" 
}) {
  const [imageUrl, setImageUrl] = useState(currentImage || '');

  const handleUpload = (uploadData) => {
    setImageUrl(uploadData.url);
    onImageChange?.(uploadData.url);
  };

  const handleRemove = () => {
    setImageUrl('');
    onImageChange?.('');
  };

  return (
    <div className={`text-center ${className}`}>
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg mx-auto mb-4 overflow-hidden"
        style={{ width, height }}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="업로드된 이미지" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm">이미지를 업로드하세요</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        <FileUpload
          onUpload={handleUpload}
          accept="image/*"
          maxSize={2 * 1024 * 1024} // 2MB
        >
          <Button variant="outline" size="sm">
            {imageUrl ? '변경' : '업로드'}
          </Button>
        </FileUpload>
        
        {imageUrl && (
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            삭제
          </Button>
        )}
      </div>
    </div>
  );
}