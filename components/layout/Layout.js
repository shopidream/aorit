// components/layout/Layout.js - 고정 헤더/사이드바 완전 반응형 레이아웃
import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuthContext } from '../../contexts/AuthContext';

export default function Layout({ children, showSidebar = true }) {
  const { isAuthenticated } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1025);
      // 데스크톱에서는 자동으로 사이드바 열기
      if (window.innerWidth >= 1025) {
        setSidebarOpen(false); // 데스크톱에서는 overlay 모드 불필요
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 사이드바 토글
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 고정 헤더 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header 
          onMenuClick={toggleSidebar}
          showMenuButton={isAuthenticated && showSidebar}
        />
      </div>
      
      {/* 메인 레이아웃 - 헤더 높이만큼 상단 여백 */}
      <div className="flex pt-16"> {/* pt-16 = 64px 헤더 높이 */}
        {/* 고정 사이드바 */}
        {isAuthenticated && showSidebar && (
          <div className="fixed top-16 left-0 bottom-0 z-40">
            <Sidebar 
              isOpen={sidebarOpen}
              onClose={closeSidebar}
              isMobile={isMobile}
            />
          </div>
        )}
        
        {/* 모바일 오버레이 */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
            onClick={closeSidebar}
          />
        )}
        
        {/* 메인 컨텐츠 - 사이드바 너비만큼 좌측 여백 */}
        <main className={`
          flex-1 min-h-[calc(100vh-4rem)]
          ${isAuthenticated && showSidebar && !isMobile ? 'lg:ml-64' : ''}
        `}>
          {/* 컨테이너 - 좌측 정렬로 변경하고 적절한 여백 */}
          <div className={`
            ${isAuthenticated && showSidebar && !isMobile 
              ? 'pl-6 pr-4 sm:pl-8 sm:pr-6 lg:pl-10 lg:pr-8' 
              : 'px-4 sm:px-6 lg:px-8'
            } 
            py-4 sm:py-6 lg:py-8 
            max-w-none
          `}>
            {/* 최대 너비 제한 (너무 넓어지지 않도록) */}
            <div className="max-w-6xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}