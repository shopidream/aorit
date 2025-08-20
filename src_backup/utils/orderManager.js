// 📁 utils/orderManager.js - 서비스 순서 관리

const STORAGE_KEY = 'service_order';

export const orderManager = {
  // 순서 불러오기
  getOrder: (stageKey) => {
    try {
      const orders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return orders[stageKey] || [];
    } catch {
      return [];
    }
  },

  // 순서 저장하기
  setOrder: (stageKey, serviceIds) => {
    try {
      const orders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      orders[stageKey] = serviceIds;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      return true;
    } catch {
      return false;
    }
  },

  // 서비스 순서 적용
  sortServices: (services, stageKey) => {
    const savedOrder = orderManager.getOrder(stageKey);
    if (savedOrder.length === 0) return services;

    const ordered = [];
    const remaining = [...services];

    // 저장된 순서대로 먼저 추가
    savedOrder.forEach(id => {
      const index = remaining.findIndex(s => s.id === id);
      if (index !== -1) {
        ordered.push(remaining.splice(index, 1)[0]);
      }
    });

    // 나머지 서비스들 추가
    return [...ordered, ...remaining];
  },

  // 순서 변경
  reorderServices: (services, stageKey, startIndex, endIndex) => {
    const result = Array.from(services);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    const newOrder = result.map(service => service.id);
    orderManager.setOrder(stageKey, newOrder);
    
    return result;
  },

  // 전체 순서 초기화
  resetAllOrders: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};