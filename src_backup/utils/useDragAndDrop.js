// 📁 utils/useDragAndDrop.js - 드래그앤드롭 훅

import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { orderManager } from './orderManager.js';

export const useDragAndDrop = (initialServices, stageKey) => {
  const [services, setServices] = useState(() => 
    orderManager.sortServices(initialServices, stageKey)
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = services.findIndex(service => service.id === active.id);
    const newIndex = services.findIndex(service => service.id === over.id);

    const newServices = arrayMove(services, oldIndex, newIndex);
    const newOrder = newServices.map(service => service.id);
    
    orderManager.setOrder(stageKey, newOrder);
    setServices(newServices);
  }, [services, stageKey]);

  const updateServices = useCallback((newServices) => {
    const sortedServices = orderManager.sortServices(newServices, stageKey);
    setServices(sortedServices);
  }, [stageKey]);

  const resetOrder = useCallback(() => {
    orderManager.setOrder(stageKey, []);
    setServices(initialServices);
  }, [initialServices, stageKey]);

  return {
    services,
    handleDragEnd,
    updateServices,
    resetOrder
  };
};