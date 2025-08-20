// components/catalog/ServiceCard.js - 통일된 디자인 적용  
import React from 'react';
import { Card, Badge, Button } from '../ui/DesignSystem';
import { normalizeService, formatPrice } from '../../lib/dataTypes';

export default function ServiceCard({ 
  service: rawService, 
  userRole, 
  onServiceDetail,
  onServiceEdit,
  isSelected = false,
  onClick
}) {
  // 데이터 정규화
  const service = normalizeService(rawService);
  const canEdit = ['admin', 'user', 'freelancer'].includes(userRole);

  // 이미지 처리
  const getFirstImage = () => {
    if (!service.images) return null;
    
    let images = [];
    if (typeof service.images === 'string') {
      try {
        images = JSON.parse(service.images);
      } catch {
        return service.images.trim() !== '' ? service.images : null;
      }
    } else if (Array.isArray(service.images)) {
      images = service.images;
    }
    
    return Array.isArray(images) && images.length > 0 ? images[0] : null;
  };

  const firstImage = getFirstImage();

  return (
    <Card 
      hover={true}
      selected={isSelected}
      className="h-full flex flex-col overflow-hidden"
      onClick={onClick}
    >
      {/* 이미지 영역 */}
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden -m-6 mb-4">
        {firstImage ? (
          <img 
            src={firstImage} 
            alt={service.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* 이미지 플레이스홀더 */}
        <div 
          className={`w-full h-full ${firstImage ? 'hidden' : 'flex'} items-center justify-center text-gray-400`}
        >
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium">이미지 없음</p>
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex flex-col flex-1">
        {/* 제목 */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
          {service.title}
        </h3>

        {/* 가격 */}
        <div className="mb-4">
          <div className="text-2xl font-bold text-blue-600">
            {formatPrice(service.price)}
            {service.priceUnit && (
              <span className="text-sm text-gray-500 ml-1 font-normal">/ {service.priceUnit}</span>
            )}
          </div>
        </div>

        {/* 설명 */}
        <div className="mb-6 flex-1">
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* 플랜 표시 */}
        {service.isPlan && (
          <div className="mb-4">
            <Badge variant="warning" size="sm">
              플랜 서비스
            </Badge>
          </div>
        )}

        {/* 선택 상태 표시 */}
        {isSelected && (
          <div className="mb-4">
            <Badge variant="success" size="sm">
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
              onServiceDetail?.(service, false);
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
                onServiceEdit?.(service);
              }}
            >
              편집
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}