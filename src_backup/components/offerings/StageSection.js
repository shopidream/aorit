// src/components/offerings/StageSection.js

import React from 'react';
import { designSystem } from '../../styles/designSystem';
import ServiceCard from './ServiceCard';

const StageSection = ({ 
  title, 
  services = [], 
  selectedServices = [], 
  onToggle,
  onViewDetail,
  socialLoginCount,
  onSocialLoginChange,
  isAdmin = false,
  onServiceUpdate,
  isCollapsible = false,
  defaultExpanded = true 
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  if (services.length === 0) return null;

  return (
    <div className="mb-12">
      {/* 섹션 헤더 */}
      <div 
        className={`${designSystem.layout.flexRow} justify-between items-center mb-6 ${
          isCollapsible ? 'cursor-pointer' : ''
        }`}
        onClick={isCollapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <h2 className={designSystem.typography.h2}>{title}</h2>
        
        <div className={designSystem.layout.flexRow}>
          <span className={designSystem.typography.bodySmall}>
            {services.length}개 서비스
          </span>
          
          {isCollapsible && (
            <span className="ml-2 text-gray-500">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
        </div>
      </div>

      {/* 서비스 목록 */}
      {isExpanded && (
        <div className={`${designSystem.layout.grid} md:grid-cols-2 lg:grid-cols-3`}>
          {services.map(service => {
            const isSelected = selectedServices.some(selected => selected.id === service.id);
            
            return (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={isSelected}
                onToggle={onToggle}
                onViewDetail={onViewDetail}
                socialLoginCount={socialLoginCount}
                onSocialLoginChange={onSocialLoginChange}
                isAdmin={isAdmin}
                onServiceUpdate={onServiceUpdate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StageSection;