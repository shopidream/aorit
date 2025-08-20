// src/components/offerings/ServiceCard.js

import React, { useState } from 'react';
import { formatCurrency } from '../../utils.js';
import { designSystem, getCardStyles, getButtonStyles, getBadgeStyles } from '../../styles/designSystem.js';

const ServiceCard = ({ 
  service = {}, 
  isSelected = false, 
  onToggle = () => {}, 
  onViewDetail = () => {}, 
  socialLoginCount = 0, 
  onSocialLoginChange = () => {},
  isAdmin = false,
  onServiceUpdate = () => {}
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: service.name || '',
    description: service.description || '',
    price: service.price || '',
    period: service.period || ''
  });

  if (!service.id || !service.name) {
    return null;
  }

  const handleDoubleClick = () => {
    if (isAdmin) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (onServiceUpdate) {
      onServiceUpdate(service.id, editData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      period: service.period || ''
    });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleCardClick = () => {
    if (!isAdmin && service.type !== 'social_login' && service.price !== '협의' && service.type !== 'hourly') {
      onToggle(service.id);
    }
  };

  const cardStyles = getCardStyles(service.type, isSelected);
  
  const getPriceColor = () => {
    if (service.price === '협의') return 'text-amber-600';
    if (service.type === 'maintenance') return 'text-emerald-600';
    return designSystem.colors.primary.text;
  };

  if (isEditing) {
    return (
      <div className={`${designSystem.layout.spacingCard} bg-blue-50 border-2 border-blue-300 ${designSystem.radius.card} ${designSystem.shadows.card}`}>
        <div className={designSystem.layout.spacingCard}>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`${designSystem.form.input} ${designSystem.typography.h5}`}
            placeholder="서비스명"
          />
          <textarea
            value={editData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`${designSystem.form.textarea} ${designSystem.typography.bodySmall}`}
            rows={2}
            placeholder="서비스 설명"
          />
          <div className={designSystem.layout.formGrid}>
            <input
              type="text"
              value={editData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              className={designSystem.form.input}
              placeholder="가격"
            />
            <input
              type="text"
              value={editData.period}
              onChange={(e) => handleInputChange('period', e.target.value)}
              className={designSystem.form.input}
              placeholder="기간"
            />
          </div>
          <div className={`${designSystem.layout.flexRow} gap-2`}>
            <button onClick={handleSave} className={getButtonStyles('primary', 'sm')}>
              저장
            </button>
            <button onClick={handleCancel} className={getButtonStyles('outline', 'sm')}>
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${designSystem.layout.spacingCard} ${cardStyles} cursor-pointer ${designSystem.transitions.base}`} 
      onClick={handleCardClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className={`${designSystem.layout.flexRow} justify-between items-start mb-4`}>
        <div className="flex items-start flex-1 min-w-0">
          {!isAdmin && service.type !== 'social_login' && service.price !== '협의' && service.type !== 'hourly' && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(service.id)}
              className={`mt-1 mr-3 ${designSystem.form.checkbox}`}
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className={`${designSystem.typography.h4} mb-2`}>
              {service.name}
            </h4>
            <p className={`${designSystem.typography.bodySmall} ${designSystem.colors.neutral.textLight} mb-3 line-clamp-2`}>
              {service.description}
            </p>
            <div className={`${designSystem.layout.flexRow} justify-between items-center`}>
              <p className={`${designSystem.typography.body} font-bold ${getPriceColor()}`}>
                {typeof service.price === 'number' ? `${formatCurrency(service.price)}원` : service.price}
                {service.unit && ` /${service.unit}`}
              </p>
              {service.period && (
                <span className={getBadgeStyles('default')}>
                  {service.period}
                </span>
              )}
            </div>
          </div>
        </div>

        {!isAdmin && service.type === 'social_login' && (
          <div className={`ml-3 ${designSystem.layout.flexRow} ${designSystem.glass.light} border ${designSystem.radius.input} ${designSystem.shadows.card}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSocialLoginChange(-1);
              }}
              disabled={socialLoginCount === 0}
              className={`px-3 py-2 ${designSystem.colors.neutral.text} hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed`}
            >
              −
            </button>
            <span className={`px-4 py-2 ${designSystem.typography.bodySmall} font-semibold text-gray-800 min-w-[2rem] text-center`}>
              {socialLoginCount}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSocialLoginChange(1);
              }}
              disabled={socialLoginCount === 4}
              className={`px-3 py-2 ${designSystem.colors.neutral.text} hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed`}
            >
              +
            </button>
          </div>
        )}

        {(service.details || service.deliverables || service.includedServices) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail(service);
            }}
            className={`ml-3 ${getButtonStyles('primary', 'sm')}`}
          >
            상세보기
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className={`${designSystem.layout.flexRow} justify-end gap-2 mt-3`}>
          {service.price === '협의' && (
            <button className={getButtonStyles('secondary', 'sm')}>
              문의하기
            </button>
          )}
          {service.type === 'hourly' && (
            <span className={getBadgeStyles('secondary')}>
              아래에서 설정
            </span>
          )}
        </div>
      )}

      <div className={`mt-4 pt-3 border-t ${designSystem.colors.neutral.border}`}>
        <span className={getBadgeStyles(
          service.type === 'maintenance' ? 'maintenance' : 
          service.type === 'plan' ? 'premium' : 'default'
        )}>
          {service.category}
        </span>
      </div>
    </div>
  );
};

export default ServiceCard;