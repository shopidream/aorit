// 📁 utils/adminServiceUpdater.js - 관리자 서비스 업데이트

import { storage } from './storage.js';

const ADMIN_SERVICES_KEY = 'admin_services_override';

export const adminServiceUpdater = {
  // 서비스 업데이트
  updateService: (serviceId, updatedData) => {
    try {
      const overrides = storage.load(ADMIN_SERVICES_KEY) || {};
      overrides[serviceId] = {
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      storage.save(ADMIN_SERVICES_KEY, overrides);
      return true;
    } catch {
      return false;
    }
  },

  // 서비스 추가
  addService: (newService) => {
    try {
      const overrides = storage.load(ADMIN_SERVICES_KEY) || {};
      const serviceId = `custom_${Date.now()}`;
      overrides[serviceId] = {
        ...newService,
        id: serviceId,
        createdAt: new Date().toISOString()
      };
      storage.save(ADMIN_SERVICES_KEY, overrides);
      return serviceId;
    } catch {
      return null;
    }
  },

  // 서비스 삭제
  deleteService: (serviceId) => {
    try {
      const overrides = storage.load(ADMIN_SERVICES_KEY) || {};
      delete overrides[serviceId];
      storage.save(ADMIN_SERVICES_KEY, overrides);
      return true;
    } catch {
      return false;
    }
  },

  // 오버라이드된 서비스 가져오기
  getOverrides: () => {
    return storage.load(ADMIN_SERVICES_KEY) || {};
  },

  // 서비스에 오버라이드 적용
  applyOverrides: (originalServices) => {
    const overrides = adminServiceUpdater.getOverrides();
    return originalServices.map(service => ({
      ...service,
      ...(overrides[service.id] || {})
    }));
  }
};