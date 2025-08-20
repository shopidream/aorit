// src/components/offerings/ServiceModal.js

import React from 'react';
import { formatCurrency } from '../../utils.js';
import { designSystem, getButtonStyles, getModalStyles, getBadgeStyles } from '../../styles/designSystem';

const ServiceModal = ({ 
  service, 
  isOpen, 
  onClose, 
  onToggle,
  isSelected = false 
}) => {
  if (!isOpen || !service) return null;

  const handleSelect = () => {
    if (onToggle) onToggle(service.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${getModalStyles()} max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* 헤더 */}
        <div className={`${designSystem.layout.flexRow} justify-between items-start mb-6`}>
          <div>
            <h2 className={designSystem.typography.h2}>{service.name}</h2>
            <div className={`${designSystem.layout.flexRow} items-center gap-4 mt-2`}>
              <p className={`${designSystem.typography.h4} ${designSystem.colors.primary.text}`}>
                {typeof service.price === 'number' ? `${formatCurrency(service.price)}원` : service.price}
              </p>
              {service.period && (
                <span className={getBadgeStyles('default')}>{service.period}</span>
              )}
              {service.pages && (
                <span className={getBadgeStyles('secondary')}>{service.pages}페이지</span>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 기본 정보 */}
        <div className={designSystem.layout.spacingSection}>
          <div className="mb-6">
            <h3 className={designSystem.typography.h3}>서비스 설명</h3>
            <p className={designSystem.typography.body}>{service.description}</p>
            {service.target && (
              <p className={`${designSystem.typography.bodySmall} ${designSystem.colors.neutral.textLight} mt-2`}>
                대상: {service.target}
              </p>
            )}
          </div>

          {/* 포함된 서비스들 (storePlans의 includedServices) */}
          {service.includedServices && (
            <div className="mb-6">
              <h3 className={designSystem.typography.h3}>포함된 서비스</h3>
              <div className={designSystem.layout.grid}>
                {Object.entries(service.includedServices).map(([category, items]) => (
                  <div key={category} className={`${designSystem.form.fieldset} p-4`}>
                    <h4 className={`${designSystem.typography.h4} mb-3`}>
                      {getCategoryDisplayName(category)}
                    </h4>
                    <ul className={designSystem.layout.spacingCard}>
                      {items.map((item, index) => (
                        <li key={index} className={`${designSystem.typography.bodySmall} flex items-start`}>
                          <span className="text-violet-600 mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 기본 features (additionalServices용) */}
          {service.features && (
            <div className="mb-6">
              <h3 className={designSystem.typography.h3}>포함 내용</h3>
              <ul className={designSystem.layout.spacingCard}>
                {service.features.map((feature, index) => (
                  <li key={index} className={`${designSystem.typography.body} flex items-start`}>
                    <span className="text-violet-600 mr-2">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 서비스 조건 */}
          {(service.period || service.unit || service.pages) && (
            <div className="mb-6">
              <h3 className={designSystem.typography.h3}>서비스 조건</h3>
              <div className={designSystem.layout.formGrid}>
                {service.period && (
                  <div>
                    <strong>작업 기간:</strong> {service.period}
                  </div>
                )}
                {service.unit && (
                  <div>
                    <strong>단위:</strong> {service.unit}
                  </div>
                )}
                {service.pages && (
                  <div>
                    <strong>페이지 수:</strong> {service.pages}개
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 세부사항 (details) */}
          {service.details && (
            <div className="mb-6">
              <h3 className={designSystem.typography.h3}>세부사항</h3>
              <ul className={designSystem.layout.spacingCard}>
                {service.details.map((detail, index) => (
                  <li key={index} className={`${designSystem.typography.body} flex items-start`}>
                    <span className="text-emerald-600 mr-2">→</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 산출물 (deliverables) */}
          {service.deliverables && (
            <div className="mb-6">
              <h3 className={designSystem.typography.h3}>최종 산출물</h3>
              <ul className={designSystem.layout.spacingCard}>
                {service.deliverables.map((deliverable, index) => (
                  <li key={index} className={`${designSystem.typography.body} flex items-start`}>
                    <span className="text-blue-600 mr-2">📄</span>
                    <span>{deliverable}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className={`${designSystem.layout.flexRow} justify-end gap-3 pt-6 border-t`}>
          <button onClick={onClose} className={getButtonStyles('outline')}>
            닫기
          </button>
          
          {onToggle && service.price !== '협의' && service.type !== 'hourly' && (
            <button onClick={handleSelect} className={getButtonStyles('primary')}>
              {isSelected ? '선택 해제' : '선택하기'}
            </button>
          )}
          
          {service.price === '협의' && (
            <button className={getButtonStyles('secondary')}>
              문의하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 카테고리 표시명 변환
function getCategoryDisplayName(category) {
  const categoryNames = {
    'general': '일반 설정',
    'domain': '도메인 설정',
    'policy': '정책 및 약관',
    'product': '제품 관리',
    'design': '디자인',
    'marketing': '마케팅'
  };
  
  return categoryNames[category] || category;
}

export default ServiceModal;