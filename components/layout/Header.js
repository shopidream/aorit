// components/layout/Header.js - Aorit 브랜딩
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import AIUsageIndicator from '../ui/AIUsageIndicator';

// 햄버거 메뉴 아이콘 컴포넌트
const MenuIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

// 사용자 아바타 컴포넌트
const UserAvatar = ({ name, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };
  
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  
  return (
    <div className={`
      ${sizes[size]} rounded-full bg-blue-100 text-blue-600 
      flex items-center justify-center font-semibold
    `}>
      {initial}
    </div>
  );
};

export default function Header({ onMenuClick, showMenuButton = false }) {
  const { user, isAuthenticated, logout } = useAuthContext();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 왼쪽: 로고 + 메뉴 버튼 */}
          <div className="flex items-center gap-4">
            {/* 모바일 메뉴 버튼 */}
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MenuIcon size={20} className="text-gray-600" />
              </button>
            )}
            
            {/* Aorit 로고 */}
            <Link href="/" className="flex items-center">
              <div className="relative w-32 h-8">
                <Image
                  src="/images/aorit-logo.png"
                  alt="Aorit"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
          
          {/* 오른쪽: 사용자 메뉴 */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* AI 사용량 표시 */}
                <div className="hidden lg:block">
                  <AIUsageIndicator />
                </div>
                
                {/* 데스크톱 사용자 정보 */}
                <div className="hidden md:flex items-center gap-3">
                  <span className="text-sm text-gray-700">
                    안녕하세요, <span className="font-medium">{user?.name}</span>님
                  </span>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      대시보드
                    </Button>
                  </Link>
                </div>
                
                {/* 사용자 메뉴 드롭다운 */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <UserAvatar name={user?.name} size="sm" />
                    <span className="sr-only">사용자 메뉴</span>
                  </button>
                  
                  {/* 드롭다운 메뉴 */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                        <div className="text-xs text-gray-500">{user?.email}</div>
                      </div>
                      
                      <Link 
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        프로필 설정
                      </Link>
                      
                      <Link 
                        href="/dashboard"
                        className="md:hidden block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        대시보드
                      </Link>
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 로그인 전 메뉴 */
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    회원가입
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 사용자 메뉴 배경 클릭 시 닫기 */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}