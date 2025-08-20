// components/ui/StampUpload.js - 도장 업로드 컴포넌트

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, CheckCircle, X, AlertTriangle, Minus, Plus } from 'lucide-react';
import { cropStampImage, validateStampImage, resizeStampToLegalSize, getStampSizeInfo } from '../../lib/stampCropUtils';

const StampUpload = ({ currentStamp, onStampChange, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState(currentStamp || null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stampSize, setStampSize] = useState(60); // 기본 18mm 법인도장 크기
  const [originalCroppedImage, setOriginalCroppedImage] = useState(null);
  const fileInputRef = useRef(null);

  const sizeInfo = getStampSizeInfo();

  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(message);
      setSuccess('');
      setTimeout(() => setError(''), 5000);
    }
  };

  const processStampImage = async (file) => {
    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('파일 크기가 5MB를 초과합니다.');
      }

      // 파일 형식 체크
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.');
      }

      // 도장 이미지 검증
      const validation = await validateStampImage(file);
      
      if (!validation.isValid) {
        throw new Error(validation.suggestions.join(' '));
      }

      // 자동 크롭핑 처리 (기본 크기로)
      const croppedImage = await cropStampImage(file, stampSize);
      setOriginalCroppedImage(croppedImage);
      
      // 법인 도장 크기로 조절
      const resizedResult = await resizeStampToLegalSize(croppedImage, stampSize);
      
      // 미리보기 설정
      setPreviewImage(resizedResult.dataURL);
      
      // 부모 컴포넌트에 결과 전달
      if (onStampChange) {
        onStampChange(resizedResult.dataURL);
      }
      
      showMessage(`도장이 성공적으로 처리되었습니다! (${resizedResult.mmSize}mm ${resizedResult.category})`, 'success');
      
    } catch (error) {
      console.error('도장 처리 오류:', error);
      showMessage(error.message, 'error');
      setPreviewImage(currentStamp);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSizeChange = async (newSize) => {
    if (!originalCroppedImage) return;
    
    setStampSize(newSize);
    setIsProcessing(true);

    try {
      const resizedResult = await resizeStampToLegalSize(originalCroppedImage, newSize);
      setPreviewImage(resizedResult.dataURL);
      
      if (onStampChange) {
        onStampChange(resizedResult.dataURL);
      }
      
      showMessage(`도장 크기가 ${resizedResult.mmSize}mm (${resizedResult.category})로 조정되었습니다.`, 'success');
    } catch (error) {
      showMessage('크기 조절 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCurrentSizeInfo = () => {
    const currentInfo = sizeInfo.sizes.find(s => s.px === stampSize);
    return currentInfo || { px: stampSize, mm: Math.round((stampSize / 60) * 18), name: '사용자 설정' };
  };

  const handleFileSelect = (file) => {
    if (file) {
      processStampImage(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeStamp = () => {
    setPreviewImage(null);
    setOriginalCroppedImage(null);
    if (onStampChange) {
      onStampChange(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 업로드 영역 */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">도장 이미지 처리 중...</p>
            <p className="text-xs text-gray-500 mt-1">자동 크롭핑 및 최적화 진행 중</p>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-1">
              도장 이미지를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG 지원 • 최대 5MB • 자동 크롭핑 + 법인도장 크기 적용
            </p>
          </div>
        )}
      </div>

      {/* 도장 크기 조절 */}
      {previewImage && originalCroppedImage && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">📏 도장 크기 조절</h4>
          
          {/* 크기 슬라이더 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">크기</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSizeChange(Math.max(sizeInfo.minSize, stampSize - 5))}
                  disabled={stampSize <= sizeInfo.minSize || isProcessing}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-20 text-center text-sm font-medium">
                  {getCurrentSizeInfo().px}px
                </span>
                <button
                  onClick={() => handleSizeChange(Math.min(sizeInfo.maxSize, stampSize + 5))}
                  disabled={stampSize >= sizeInfo.maxSize || isProcessing}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 범위 슬라이더 */}
            <input
              type="range"
              min={sizeInfo.minSize}
              max={sizeInfo.maxSize}
              step="5"
              value={stampSize}
              onChange={(e) => handleSizeChange(parseInt(e.target.value))}
              disabled={isProcessing}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            
            {/* 크기 정보 */}
            <div className="flex justify-between text-xs text-gray-500">
              <span>개인 도장 (40px)</span>
              <span className="font-medium text-blue-600">
                {getCurrentSizeInfo().mm}mm • {getCurrentSizeInfo().name}
                {getCurrentSizeInfo().recommended && ' ⭐'}
              </span>
              <span>대형 법인 (80px)</span>
            </div>

            {/* 빠른 선택 버튼들 */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {sizeInfo.sizes.filter(s => [40, 50, 60, 70].includes(s.px)).map((size) => (
                <button
                  key={size.px}
                  onClick={() => handleSizeChange(size.px)}
                  disabled={isProcessing}
                  className={`text-xs p-2 rounded border transition-colors ${
                    stampSize === size.px
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  {size.mm}mm
                  {size.recommended && <div className="text-yellow-300">⭐</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 미리보기 */}
      {previewImage && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={previewImage}
                alt="도장 미리보기"
                className="border border-gray-200 rounded bg-white"
                style={{ 
                  width: `${stampSize}px`, 
                  height: `${stampSize}px`,
                  objectFit: 'contain'
                }}
              />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getCurrentSizeInfo().name} ({getCurrentSizeInfo().mm}mm)
              </p>
              <p className="text-xs text-gray-500">
                {stampSize}px • 자동 크롭핑 및 최적화 적용됨
              </p>
              {getCurrentSizeInfo().recommended && (
                <p className="text-xs text-blue-600">⭐ 가장 일반적인 법인도장 크기</p>
              )}
            </div>
          </div>
          <button
            onClick={removeStamp}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="도장 제거"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 성공 메시지 */}
      {success && (
        <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 도움말 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>💡 법인 도장 크기 가이드:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li><strong>60px (18mm)</strong>: 가장 일반적인 법인도장 크기 ⭐</li>
          <li><strong>40-50px</strong>: 개인 도장 또는 소형 법인</li>
          <li><strong>65-80px</strong>: 대기업용 대형 법인 도장</li>
          <li>휴대폰으로 촬영한 도장도 자동으로 적정 크기로 조절됩니다</li>
        </ul>
      </div>
    </div>
  );
};

export default StampUpload;