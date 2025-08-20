// components/contracts/TypographyEditor.js - 계약서 폰트/크기 편집기

import React, { useState, useEffect } from 'react';
import { Type, Minus, Plus, RotateCcw } from 'lucide-react';

const TypographyEditor = ({ onStyleChange, currentStyle = null }) => {
  // 기본 설정
  const defaultStyle = {
    titleFont: 'Noto Sans KR, sans-serif',
    contentFont: 'Noto Sans KR, sans-serif',
    titleSize: 16,
    contentSize: 14,
    lineHeight: 1.6
  };

  // 폰트 옵션
  const fontOptions = [
    { name: '나눔고딕', value: 'Nanum Gothic, sans-serif', description: '깔끔한 고딕체' },
    { name: '맑은 고딕', value: 'Malgun Gothic, sans-serif', description: '한국어 최적화' },
    { name: 'Noto Sans KR', value: 'Noto Sans KR, sans-serif', description: '모던한 고딕체' },
    { name: 'Noto Serif KR', value: 'Noto Serif KR, serif', description: '공식 문서용 명조체' },
    { name: 'IBM Plex Sans KR', value: 'IBM Plex Sans KR, sans-serif', description: '세련된 느낌' },
    { name: '기본 시스템 폰트', value: 'system-ui, -apple-system, sans-serif', description: '시스템 기본' }
  ];

  // 현재 스타일 상태
  const [style, setStyle] = useState(currentStyle || defaultStyle);
  const [isExpanded, setIsExpanded] = useState(false);

  // 사용자 설정 로드
  useEffect(() => {
    const savedStyle = localStorage.getItem('contractTypographyStyle');
    if (savedStyle) {
      try {
        const parsedStyle = JSON.parse(savedStyle);
        setStyle({ ...defaultStyle, ...parsedStyle });
      } catch (error) {
        console.error('저장된 폰트 설정 로드 실패:', error);
      }
    }
  }, []);

  // 스타일 변경 핸들러
  const handleStyleChange = (newStyle) => {
    const updatedStyle = { ...style, ...newStyle };
    setStyle(updatedStyle);
    
    // 부모 컴포넌트에 전달
    if (onStyleChange) {
      onStyleChange(updatedStyle);
    }
    
    // 로컬 스토리지에 저장
    localStorage.setItem('contractTypographyStyle', JSON.stringify(updatedStyle));
  };

  // 크기 조절 핸들러
  const adjustSize = (type, delta) => {
    const currentSize = style[type];
    const newSize = Math.max(10, Math.min(24, currentSize + delta));
    handleStyleChange({ [type]: newSize });
  };

  // 기본값으로 리셋
  const resetToDefault = () => {
    setStyle(defaultStyle);
    if (onStyleChange) {
      onStyleChange(defaultStyle);
    }
    localStorage.removeItem('contractTypographyStyle');
  };

  // CSS 스타일 생성
  const generateCSS = () => {
    return {
      '--contract-title-font': style.titleFont,
      '--contract-content-font': style.contentFont,
      '--contract-title-size': `${style.titleSize}px`,
      '--contract-content-size': `${style.contentSize}px`,
      '--contract-line-height': style.lineHeight
    };
  };

  // 부모 컴포넌트에 CSS 변수 전달
  useEffect(() => {
    if (onStyleChange) {
      onStyleChange(style);
    }
  }, [style]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* 헤더 */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Type className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-900">글꼴 및 크기 설정</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {style.titleSize}px / {style.contentSize}px
          </span>
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* 설정 패널 */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-6">
          {/* 제목 폰트 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              조 제목 폰트
            </label>
            <select
              value={style.titleFont}
              onChange={(e) => handleStyleChange({ titleFont: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name} - {font.description}
                </option>
              ))}
            </select>
            
            {/* 제목 크기 조절 */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-gray-600">크기</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => adjustSize('titleSize', -1)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium">
                  {style.titleSize}px
                </span>
                <button
                  onClick={() => adjustSize('titleSize', 1)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* 제목 미리보기 */}
            <div 
              className="mt-2 p-2 bg-gray-50 rounded border"
              style={{ 
                fontFamily: style.titleFont, 
                fontSize: `${style.titleSize}px`,
                fontWeight: 'bold'
              }}
            >
              제 1 조 (계약의 목적)
            </div>
          </div>

          {/* 내용 폰트 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              조 내용 폰트
            </label>
            <select
              value={style.contentFont}
              onChange={(e) => handleStyleChange({ contentFont: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name} - {font.description}
                </option>
              ))}
            </select>
            
            {/* 내용 크기 조절 */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-gray-600">크기</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => adjustSize('contentSize', -1)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-medium">
                  {style.contentSize}px
                </span>
                <button
                  onClick={() => adjustSize('contentSize', 1)}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* 내용 미리보기 */}
            <div 
              className="mt-2 p-2 bg-gray-50 rounded border"
              style={{ 
                fontFamily: style.contentFont, 
                fontSize: `${style.contentSize}px`,
                lineHeight: style.lineHeight
              }}
            >
              갑과 을은 다음과 같이 서비스 제공에 관한 계약을 체결한다. 본 계약에서 정하지 아니한 사항은 관련 법령 및 상관례에 따른다.
            </div>
          </div>

          {/* 줄 간격 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              줄 간격
            </label>
            <div className="flex items-center space-x-4">
              {[1.4, 1.5, 1.6, 1.8, 2.0].map((height) => (
                <button
                  key={height}
                  onClick={() => handleStyleChange({ lineHeight: height })}
                  className={`px-3 py-1 text-sm rounded ${
                    style.lineHeight === height
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {height}
                </button>
              ))}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              onClick={resetToDefault}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <RotateCcw className="w-4 h-4" />
              <span>기본값으로 리셋</span>
            </button>
            
            <div className="text-xs text-gray-500">
              설정이 자동으로 저장됩니다
            </div>
          </div>

          {/* 추천 조합 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 추천 조합</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleStyleChange({
                  titleFont: 'Noto Serif KR, serif',
                  contentFont: 'Noto Serif KR, serif',
                  titleSize: 16,
                  contentSize: 14
                })}
                className="text-left p-2 bg-white rounded border hover:bg-gray-50"
              >
                <div className="font-medium">공식 문서</div>
                <div className="text-gray-600">명조체 16px/14px</div>
              </button>
              <button
                onClick={() => handleStyleChange({
                  titleFont: 'Noto Sans KR, sans-serif',
                  contentFont: 'Noto Sans KR, sans-serif',
                  titleSize: 15,
                  contentSize: 13
                })}
                className="text-left p-2 bg-white rounded border hover:bg-gray-50"
              >
                <div className="font-medium">모던 스타일</div>
                <div className="text-gray-600">고딕체 15px/13px</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypographyEditor;