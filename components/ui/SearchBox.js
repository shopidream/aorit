// components/ui/SearchBox.js - 검색박스
import React, { useState, useEffect } from 'react';
import { Input } from './DesignSystem';

export default function SearchBox({ 
  value = '', 
  onChange, 
  placeholder = "검색...",
  delay = 300,
  className = ""
}) {
  const [inputValue, setInputValue] = useState(value);

  // 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange?.(inputValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [inputValue, delay, onChange]);

  // 외부에서 value가 변경될 때 동기화
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleClear = () => {
    setInputValue('');
    onChange?.('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}