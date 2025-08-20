// components/dashboard/RecentActivity.js - 최근 활동
import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';

export default function RecentActivity({ limit = 10, className = "" }) {
  const { getAuthHeaders } = useAuthContext();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // 실제로는 전용 API가 필요하지만, 여기서는 기존 데이터를 조합
      const [quotesRes, contractsRes, servicesRes] = await Promise.all([
        fetch('/api/quotes', { headers: getAuthHeaders() }),
        fetch('/api/contracts', { headers: getAuthHeaders() }),
        fetch('/api/services', { headers: getAuthHeaders() })
      ]);

      const quotes = await quotesRes.json();
      const contracts = await contractsRes.json();
      const services = await servicesRes.json();

      // 활동 데이터 조합
      const allActivities = [
        ...quotes.slice(0, 5).map(quote => ({
          id: `quote-${quote.id}`,
          type: 'quote',
          title: `견적서 생성: ${quote.client?.name}`,
          description: `${quote.service?.title} - ${quote.amount?.toLocaleString()}원`,
          timestamp: quote.createdAt,
          status: quote.status,
          link: `/quotes`
        })),
        ...contracts.slice(0, 3).map(contract => ({
          id: `contract-${contract.id}`,
          type: 'contract',
          title: `계약서 생성: ${contract.client?.name}`,
          description: `${contract.quote?.service?.title}`,
          timestamp: contract.createdAt,
          status: contract.status,
          link: `/contracts/${contract.id}`
        })),
        ...services.slice(0, 2).map(service => ({
          id: `service-${service.id}`,
          type: 'service',
          title: `서비스 등록: ${service.title}`,
          description: `${service.price?.toLocaleString()}원`,
          timestamp: service.createdAt,
          status: service.isActive ? 'active' : 'inactive',
          link: `/services`
        }))
      ];

      // 시간순 정렬
      const sortedActivities = allActivities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('최근 활동 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      quote: '📄',
      contract: '📋',
      service: '🛠️',
      payment: '💰',
      client: '👤'
    };
    return icons[type] || '📌';
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'text-gray-600',
      sent: 'text-blue-600',
      accepted: 'text-green-600',
      pending: 'text-yellow-600',
      active: 'text-green-600',
      completed: 'text-blue-600',
      inactive: 'text-gray-400'
    };
    return colors[status] || 'text-gray-600';
  };

  const getStatusText = (status) => {
    const texts = {
      draft: '초안',
      sent: '발송됨',
      accepted: '승인됨',
      pending: '대기중',
      active: '진행중',
      completed: '완료',
      inactive: '비활성'
    };
    return texts[status] || status;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">최근 활동</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">최근 활동</h3>
        <Button variant="ghost" size="sm" onClick={fetchRecentActivity}>
          새로고침
        </Button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-2xl">{getActivityIcon(activity.type)}</div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </h4>
                <span className="text-xs text-gray-500 ml-2">
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 truncate">
                {activity.description}
              </p>
              
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {getStatusText(activity.status)}
                </span>
                
                {activity.link && (
                  <Button
                    variant="ghost"
                    size="sm"
                    as="a"
                    href={activity.link}
                    className="text-xs"
                  >
                    보기
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p>최근 활동이 없습니다</p>
          </div>
        )}
      </div>
    </Card>
  );
}