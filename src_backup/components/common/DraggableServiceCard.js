// src/components/common/DraggableServiceCard.js

import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { designSystem } from '../../styles/designSystem.js';
import ServiceCard from '../offerings/ServiceCard.js';

const DraggableServiceCard = ({ 
  service, 
  index, 
  isSelected, 
  onToggle, 
  onViewDetail, 
  socialLoginCount, 
  onSocialLoginChange,
  isAdmin = false,
  onServiceUpdate,
  isDragDisabled = false
}) => {
  return (
    <Draggable 
      draggableId={service.id} 
      index={index} 
      isDragDisabled={isDragDisabled}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`${designSystem.transitions.base} ${
            snapshot.isDragging ? 'rotate-2 scale-105 z-50' : ''
          }`}
          style={{
            ...provided.draggableProps.style,
            ...(snapshot.isDragging && {
              background: 'white',
              borderRadius: '12px',
              boxShadow: designSystem.shadows.floating
            })
          }}
        >
          <ServiceCard
            service={service}
            isSelected={isSelected}
            onToggle={onToggle}
            onViewDetail={onViewDetail}
            socialLoginCount={socialLoginCount}
            onSocialLoginChange={onSocialLoginChange}
            isAdmin={isAdmin}
            onServiceUpdate={onServiceUpdate}
          />
          
          {/* 드래그 핸들 */}
          {!isDragDisabled && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className={`w-6 h-6 ${designSystem.glass.medium} ${designSystem.radius.button} flex items-center justify-center cursor-grab active:cursor-grabbing`}>
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM7 8a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM7 14a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"/>
                </svg>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default DraggableServiceCard;