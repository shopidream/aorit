import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { Badge } from './DesignSystem';
import { Bot, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AIUsageIndicator({ className = '' }) {
  const { getAuthHeaders } = useAuthContext();
  const [usageInfo, setUsageInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageInfo();
  }, []);

  const fetchUsageInfo = async () => {
    try {
      const response = await fetch('/api/ai/usage-info', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsageInfo(data);
      }
    } catch (error) {
      console.error('AI 사용량 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usageInfo) return null;

  const { used, remaining, limit, plan } = usageInfo;
  const percentage = (used / limit) * 100;
  
  const getStatusColor = () => {
    if (remaining === 0) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStatusIcon = () => {
    if (remaining === 0) return AlertTriangle;
    if (percentage >= 80) return AlertTriangle;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Bot size={16} className="text-gray-600" />
      
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-gray-700">
          AI 사용량
        </span>
        <Badge 
          variant={remaining === 0 ? 'danger' : percentage >= 80 ? 'warning' : 'success'}
          size="sm"
          icon={StatusIcon}
        >
          {remaining}/{limit}
        </Badge>
      </div>

      {/* 진행바 */}
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}