// components/catalog/ServiceCard.js - 통일 UX: 체크박스=선택, 카드=상세페이지
import React from 'react';
import { Card, Badge } from '../ui/DesignSystem';
import { normalizeService, formatPrice } from '../../lib/dataTypes';

export default function ServiceCard({ 
  service: rawService, 
  userRole, 
  onServiceDetail,
  isSelected = false,
  onSelect,
  showCheckbox = false
}) {
  const service = normalizeService(rawService);

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

  // 체크박스 클릭 → 선택 토글
  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(service);
    }
  };

  // 카드 클릭 → 상세페이지
  const handleCardClick = (e) => {
    if (!e || !e.target) return;
    
    // 선택 모드가 활성화되어 있으면 선택, 아니면 상세페이지
    if (showCheckbox && onSelect) {
      onSelect(service);
    } else if (onServiceDetail) {
      onServiceDetail(service);
    }
  };

  const firstImage = getFirstImage();

  return (
    <div
      className="h-full cursor-pointer"
      onClick={handleCardClick}
    >
      <Card 
        hover={true}
        selected={isSelected}
        className="h-full flex flex-col overflow-hidden transition-all duration-200 active:scale-[0.98]"
      >
      {/* 체크박스 제거 */}


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
        <div className="mb-4 flex-1">
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* 뱃지들 */}
        <div className="flex flex-wrap gap-2 mt-auto">
          {service.isPlan && (
            <Badge variant="warning" size="sm">
              플랜 서비스
            </Badge>
          )}
          
          {isSelected && (
            <Badge variant="success" size="sm">
              선택됨
            </Badge>
          )}

          {!service.isActive && (
            <Badge variant="secondary" size="sm">
              비활성
            </Badge>
          )}
        </div>
      </div>
    </Card>
    </div>
  );
}