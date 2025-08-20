// components/clients/ClientCard.js - 상세 정보 포함한 풍부한 카드
import React from 'react';
import { Card, Badge, Button } from '../ui/DesignSystem';
import { Building2, Mail, Phone, Calendar, Globe, MapPin, CreditCard } from 'lucide-react';

export default function ClientCard({ 
  client, 
  onClientDetail,
  onClientEdit,
  isSelected = false,
  onClick
}) {
  
  const handleCardClick = () => {
    console.log('ClientCard 내부 클릭:', client.name, client.id);
    onClick?.(client);
  };

  const handlePhoneClick = (phoneNumber, e) => {
    e.stopPropagation();
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber.replace(/[^0-9]/g, '')}`;
    }
  };
  
  return (
    <Card 
      hover={true}
      selected={isSelected}
      className="h-full flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
      {/* 헤더 - 담당자명 (가장 크고 굵게) */}
      <div className="mb-3">
        <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">
          {client.name}
        </h3>
      </div>

      {/* 담당자 전화번호 (두 번째로 중요) */}
      {client.phone && (
        <div className="mb-3">
          <button
            onClick={(e) => handlePhoneClick(client.phone, e)}
            className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            {client.phone}
          </button>
        </div>
      )}

      {/* 담당자 이메일 (세 번째로 중요) */}
      <div className="mb-5">
        <a 
          href={`mailto:${client.email}`}
          className="text-base text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {client.email}
        </a>
      </div>

      {/* 서비스 카테고리 */}
      {client.serviceCategory && (
        <div className="mb-5">
          <Badge variant="primary" size="sm">
            {client.serviceCategory}
          </Badge>
        </div>
      )}

      {/* 회사 정보 (참고용 - 작은 폰트) */}
      <div className="mb-6 flex-1">
        <div className="space-y-2 text-sm text-gray-600">
          
          {/* 회사명과 직책 */}
          {client.company && (
            <div className="flex items-center gap-2">
              <Building2 size={12} className="text-gray-400 flex-shrink-0" />
              <span className="line-clamp-1">
                {client.company}
                {client.position && ` · ${client.position}`}
              </span>
            </div>
          )}

          {/* 회사 전화번호 */}
          {client.companyPhone && (
            <div className="flex items-center gap-2">
              <Phone size={12} className="text-gray-400 flex-shrink-0" />
              <button
                onClick={(e) => handlePhoneClick(client.companyPhone, e)}
                className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
              >
                {client.companyPhone}
              </button>
              <span className="text-xs text-gray-400">회사</span>
            </div>
          )}

          {/* 사업자번호 */}
          {client.businessNumber && (
            <div className="flex items-center gap-2">
              <CreditCard size={12} className="text-gray-400 flex-shrink-0" />
              <span>{client.businessNumber}</span>
            </div>
          )}

          {/* 회사 주소 */}
          {client.companyAddress && (
            <div className="flex items-start gap-2">
              <MapPin size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2 leading-relaxed">
                {client.companyAddress}
              </span>
            </div>
          )}
          
          {/* 웹사이트 */}
          {client.websiteUrl && (
            <div className="flex items-center gap-2">
              <Globe size={12} className="text-gray-400 flex-shrink-0" />
              <a 
                href={client.websiteUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800 hover:underline truncate text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                웹사이트
              </a>
            </div>
          )}
        </div>

        {/* 서비스 설명 */}
        {client.serviceDescription && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-xs font-medium text-blue-800 mb-1">서비스 요청</h4>
            <p className="text-sm text-blue-700 line-clamp-3 leading-relaxed">
              {client.serviceDescription}
            </p>
          </div>
        )}

        {/* 메모 */}
        {client.memo && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="text-xs font-medium text-amber-800 mb-1">메모</h4>
            <p className="text-sm text-amber-700 line-clamp-2 leading-relaxed">
              {client.memo}
            </p>
          </div>
        )}
      </div>

      {/* 등록일과 선택 상태 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar size={12} />
          <span>{new Date(client.createdAt).toLocaleDateString('ko-KR')}</span>
        </div>
        
        {/* 선택 상태 표시 */}
        {isSelected && (
          <Badge variant="success" size="sm">
            선택됨
          </Badge>
        )}
      </div>

      {/* 하단 버튼 영역 - 편집만 */}
      <div className="mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onClientEdit?.(client);
          }}
        >
          편집
        </Button>
      </div>
    </Card>
  );
}