// components/catalog/PlanSection.js
import React from 'react';
import ServiceCard from './ServiceCard';

export default function PlanSection({ 
  title, 
  description, 
  services, 
  userRole, 
  onServiceDetail, 
  onRequestQuote 
}) {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      {/* 섹션 헤더 */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
        <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full"></div>
      </div>

      {/* 서비스 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            userRole={userRole}
            onServiceDetail={onServiceDetail} // 추가: 상세보기 함수 전달
            onRequestQuote={onRequestQuote}
            onEdit={(service) => onServiceDetail(service, true)} // 편집 모드로 상세보기 호출
          />
        ))}
      </div>
    </section>
  );
}