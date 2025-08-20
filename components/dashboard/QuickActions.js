// components/dashboard/QuickActions.js - 빠른 작업
import React from 'react';
import { Card, Button } from '../ui/DesignSystem';
import { useRouter } from 'next/router';

export default function QuickActions({ className = "" }) {
  const router = useRouter();

  const actions = [
    {
      id: 'new-service',
      title: '새 서비스 등록',
      description: '제공할 서비스를 등록하세요',
      icon: '🛠️',
      color: 'bg-blue-50 text-blue-600',
      action: () => router.push('/services?tab=create')
    },
    {
      id: 'new-client',
      title: '고객 등록',
      description: '새로운 고객을 등록하세요',
      icon: '👤',
      color: 'bg-green-50 text-green-600',
      action: () => router.push('/clients?tab=create')
    },
    {
      id: 'new-quote',
      title: '견적 생성',
      description: '고객에게 견적서를 보내세요',
      icon: '📄',
      color: 'bg-purple-50 text-purple-600',
      action: () => router.push('/quotes?tab=create')
    },
    {
      id: 'view-contracts',
      title: '계약 관리',
      description: '진행 중인 계약을 확인하세요',
      icon: '📋',
      color: 'bg-orange-50 text-orange-600',
      action: () => router.push('/contracts')
    },
    {
      id: 'edit-profile',
      title: '프로필 수정',
      description: '프로필 정보를 업데이트하세요',
      icon: '⚙️',
      color: 'bg-gray-50 text-gray-600',
      action: () => router.push('/profile')
    },
    {
      id: 'public-page',
      title: '공개 페이지',
      description: '고객용 페이지를 관리하세요',
      icon: '🌐',
      color: 'bg-indigo-50 text-indigo-600',
      action: () => router.push('/public-page')
    }
  ];

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">빠른 작업</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all duration-200 group"
          >
            <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <span className="text-xl">{action.icon}</span>
            </div>
            
            <h4 className="font-medium text-gray-900 mb-1 group-hover:text-primary transition-colors">
              {action.title}
            </h4>
            
            <p className="text-sm text-gray-600">
              {action.description}
            </p>
          </button>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            더 많은 기능이 필요하신가요?
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/help')}
          >
            도움말
          </Button>
        </div>
      </div>
    </Card>
  );
}