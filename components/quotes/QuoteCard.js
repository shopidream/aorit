// components/quotes/QuoteCard.js - 통일된 디자인 적용
import React from 'react';
import { Card, Badge, Button } from '../ui/DesignSystem';
import { ClockIcon } from '../ui/DesignSystem';
import { formatPrice } from '../../lib/dataTypes';

export default function QuoteCard({ 
  quote, 
  userRole, 
  onQuoteDetail,
  onQuoteEdit,
  isSelected = false,
  onClick
}) {
  const canEdit = ['admin', 'user', 'freelancer'].includes(userRole);

  // 안전한 JSON 파싱
  const parseJSON = (jsonString, defaultValue = []) => {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const quoteItems = parseJSON(quote.items, []);
  
  // 상태별 설정 - 통일된 색상 체계
  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'sent': return 'info';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'sent': return '발송됨';
      case 'accepted': return '승인됨';
      case 'rejected': return '거절됨';
      default: return status;
    }
  };

  return (
    <Card 
      hover={true}
      selected={isSelected}
      className="h-full flex flex-col"
      onClick={onClick}
    >
      {/* 헤더 - 견적서 번호와 금액 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          견적서 #{quote.id}
        </h3>
        <div className="text-2xl font-bold text-blue-600">
          {formatPrice(quote.amount)}
        </div>
      </div>

      {/* 고객 정보 */}
      <div className="mb-4">
        <div className="text-base font-medium text-gray-800">
          {quote.client?.name || '정보 없음'}
          {quote.client?.company && (
            <span className="text-gray-500 font-normal"> ({quote.client.company})</span>
          )}
        </div>
      </div>

      {/* 포함 서비스 */}
      {quoteItems.length > 0 && (
        <div className="mb-6 flex-1">
          <ul className="space-y-2">
            {quoteItems.slice(0, 2).map((item, index) => (
              <li key={index} className="flex items-start text-sm">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <span className="text-gray-700 font-medium line-clamp-1">
                  {item.serviceName || item.title || '서비스명 없음'}
                </span>
              </li>
            ))}
            
            {quoteItems.length > 2 && (
              <li className="text-sm text-gray-500 pl-5">
                +{quoteItems.length - 2}개 서비스 더
              </li>
            )}
          </ul>
        </div>
      )}

      {/* 상태 및 날짜 */}
      <div className="flex items-center justify-between mb-6">
        <Badge 
          variant={getStatusVariant(quote.status)}
          size="sm"
        >
          {getStatusLabel(quote.status)}
        </Badge>
        
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <ClockIcon size={14} />
          {new Date(quote.createdAt).toLocaleDateString('ko-KR')}
        </div>
      </div>

      {/* 선택 상태 표시 */}
      {isSelected && (
        <div className="mb-4">
          <Badge variant="primary" size="sm">
            선택됨
          </Badge>
        </div>
      )}

      {/* 하단 버튼 영역 */}
      <div className="flex gap-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onQuoteDetail?.(quote);
          }}
        >
          상세보기
        </Button>
        
        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onQuoteEdit?.(quote);
            }}
          >
            편집
          </Button>
        )}
      </div>
    </Card>
  );
}