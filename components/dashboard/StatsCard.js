// components/dashboard/StatsCard.js - 통계 카드
import React from 'react';
import { Card } from '../ui/DesignSystem';

export default function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', // positive, negative, neutral
  icon,
  color = 'blue',
  loading = false,
  className = ""
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'text-blue-500'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'text-green-500'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      icon: 'text-purple-500'
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      icon: 'text-orange-500'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'text-red-500'
    }
  };

  const changeClasses = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  const currentColor = colorClasses[color] || colorClasses.blue;

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && (
          <div className={`p-2 rounded-lg ${currentColor.bg}`}>
            <div className={`text-xl ${currentColor.icon}`}>
              {icon}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className={`text-3xl font-bold ${currentColor.text}`}>
          {typeof value === 'number' && value > 1000 
            ? value.toLocaleString() 
            : value
          }
        </div>

        {change !== undefined && change !== null && (
          <div className="flex items-center space-x-1">
            <span className={`text-sm font-medium ${changeClasses[changeType]}`}>
              {changeType === 'positive' && '+'}
              {change}
              {typeof change === 'number' && '%'}
            </span>
            <span className="text-sm text-gray-500">
              {changeType === 'positive' ? '증가' : 
               changeType === 'negative' ? '감소' : '변동'}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}