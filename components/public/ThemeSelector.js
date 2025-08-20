// components/public/ThemeSelector.js - 테마 선택기
import React, { useState } from 'react';
import { Card, Button } from '../ui/DesignSystem';

export default function ThemeSelector({ currentTheme = 'default', onThemeChange }) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  const themes = [
    {
      id: 'default',
      name: '기본',
      colors: ['bg-white', 'bg-blue-50', 'bg-blue-500'],
      description: '깔끔하고 전문적인 기본 테마'
    },
    {
      id: 'professional',
      name: '프로페셔널',
      colors: ['bg-gray-900', 'bg-gray-100', 'bg-purple-600'],
      description: '비즈니스에 적합한 세련된 테마'
    },
    {
      id: 'creative',
      name: '크리에이티브',
      colors: ['bg-gradient-to-r', 'from-pink-400', 'to-purple-500'],
      description: '창의적이고 독특한 디자인 테마'
    },
    {
      id: 'minimal',
      name: '미니멀',
      colors: ['bg-white', 'bg-gray-50', 'bg-black'],
      description: '단순하고 깔끔한 미니멀 테마'
    }
  ];

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    onThemeChange?.(themeId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">테마 선택</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {themes.map((theme) => (
          <Card 
            key={theme.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedTheme === theme.id 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleThemeSelect(theme.id)}
          >
            <div className="flex items-center space-x-3 mb-3">
              {theme.colors.map((color, index) => (
                <div
                  key={index}
                  className={`w-6 h-6 rounded-full ${color}`}
                />
              ))}
            </div>
            
            <h4 className="font-medium mb-1">{theme.name}</h4>
            <p className="text-sm text-gray-600">{theme.description}</p>
            
            {selectedTheme === theme.id && (
              <div className="mt-2">
                <span className="text-xs text-primary font-medium">선택됨</span>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      <div className="mt-6">
        <Button 
          onClick={() => onThemeChange?.(selectedTheme)}
          className="w-full"
        >
          테마 적용
        </Button>
      </div>
    </div>
  );
}