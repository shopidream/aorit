// components/layout/Sidebar.js - 관리자 메뉴 추가
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../contexts/AuthContext';
import { 
  HomeIcon, 
  BriefcaseIcon, 
  UsersIcon, 
  DocumentIcon, 
  ContractIcon, 
  SettingsIcon,
  XIcon
} from '../ui/DesignSystem';
import { 
  FileText, 
  CheckCircle, 
  Shield,
  BarChart3
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, isMobile }) {
  const router = useRouter();
  const { user } = useAuthContext();

  const menuItems = [
    { href: '/dashboard', label: '대시보드', icon: HomeIcon },
    { href: '/services', label: '서비스 관리', icon: BriefcaseIcon },
    { href: '/clients', label: '고객 관리', icon: UsersIcon },
    { href: '/quotes', label: '견적 관리', icon: DocumentIcon },
    { href: '/contracts', label: '계약 관리', icon: ContractIcon },
    { href: '/profile', label: '프로필', icon: SettingsIcon },
    { href: '/public-page', label: '공개 페이지', icon: SettingsIcon }
  ];

  // 관리자 메뉴
  const adminMenuItems = [
    { href: '/admin/templates', label: '템플릿 관리', icon: FileText },
    { href: '/admin/clauses', label: '조항 검토', icon: CheckCircle },
    { href: '/admin/usage-stats', label: '사용량 통계', icon: BarChart3 }
  ];

  const handleNavClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      {/* 사이드바 - 원래 너비 유지 */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 shadow-lg lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:block
        ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : ''}
        ${isMobile ? 'top-16 h-[calc(100vh-4rem)]' : 'top-16 min-h-[calc(100vh-4rem)]'}
        flex flex-col
      `}>
        
        {/* 모바일 헤더 */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">메뉴</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <XIcon size={20} className="text-gray-500" />
            </button>
          </div>
        )}
        
        {/* 네비게이션 메뉴 */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* 일반 메뉴 */}
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = router.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <IconComponent 
                  size={20} 
                  className={isActive ? 'text-blue-600' : 'text-gray-500'} 
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          {/* 관리자 메뉴 */}
          {user?.role === 'admin' && (
            <>
              <div className="pt-4 pb-2">
                <div className="flex items-center gap-2 px-4 py-2">
                  <Shield size={16} className="text-red-600" />
                  <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                    관리자
                  </span>
                </div>
              </div>
              
              {adminMenuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = router.pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-red-50 text-red-700 border-2 border-red-200' 
                        : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                      }
                    `}
                  >
                    <IconComponent 
                      size={20} 
                      className={isActive ? 'text-red-600' : 'text-gray-500'} 
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        
        {/* 하단 영역 */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="text-xs text-gray-500 text-center">
            Aorit v1.0
            {user?.role === 'admin' && (
              <div className="text-xs text-red-500 mt-1 font-medium">
                관리자 모드
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}