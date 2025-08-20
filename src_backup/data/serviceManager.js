import { storePlans } from './services/storePlans.js';
import { marketingServices } from './services/marketingServices.js';
import { maintenanceServices } from './services/maintenanceServices.js';
import { additionalServices } from './services/additionalServices.js';
import {
  getServicesByStage,
  generateContractTitle,
  calculateTotalAmount,
  calculateAmountWithTax,
  getRecommendedPaymentStructure
} from './utils/serviceUtils.js';

const serviceManager = {
  _baseServices: [
    ...storePlans,
    ...marketingServices,
    ...maintenanceServices,
    ...additionalServices
  ],

  get services() {
    const overrides = this.getOverrides();
    return this._baseServices.map(service => ({
      ...service,
      ...(overrides[service.id] || {})
    }));
  },

  getOverrides() {
    try {
      return JSON.parse(localStorage.getItem('admin_services_override') || '{}');
    } catch {
      return {};
    }
  },

  updateService(serviceId, updatedData) {
    try {
      const overrides = this.getOverrides();
      overrides[serviceId] = {
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('admin_services_override', JSON.stringify(overrides));
      return true;
    } catch {
      return false;
    }
  },

  getServicesByStage() {
    return getServicesByStage(this.services);
  },

  generateContractTitle(selectedServices = []) {
    return generateContractTitle(selectedServices, this.services);
  },

  calculateTotalAmount(selectedServices = [], socialLoginCount = 0, customizationHours = 0, consultingHours = 0) {
    const baseAmount = calculateTotalAmount(selectedServices, this.services, socialLoginCount, customizationHours, consultingHours);
    return calculateAmountWithTax(baseAmount).totalAmount;
  },

  calculateAmountBreakdown(selectedServices = [], socialLoginCount = 0, customizationHours = 0, consultingHours = 0) {
    const baseAmount = calculateTotalAmount(selectedServices, this.services, socialLoginCount, customizationHours, consultingHours);
    return calculateAmountWithTax(baseAmount);
  },

  getRecommendedPaymentStructure(selectedServices = [], socialLoginCount = 0, customizationHours = 0, consultingHours = 0) {
    const totalAmount = this.calculateTotalAmount(selectedServices, socialLoginCount, customizationHours, consultingHours);
    return getRecommendedPaymentStructure(totalAmount);
  },

  generateServiceDescription(selectedServices = []) {
    const services = selectedServices.map(id => this.services.find(s => s.id === id)).filter(Boolean);
    return services.map(service => `• ${service.name}: ${service.description}`).join('\n');
  },

  generateServiceDetails(selectedServices = []) {
    const services = selectedServices.map(id => this.services.find(s => s.id === id)).filter(Boolean);
    const details = [];
    services.forEach(service => {
      if (service.details) details.push(...service.details);
    });
    return details;
  },

  generateDeliverables(selectedServices = []) {
    const services = selectedServices.map(id => this.services.find(s => s.id === id)).filter(Boolean);
    const deliverables = [];
    services.forEach(service => {
      if (service.deliverables) deliverables.push(...service.deliverables);
    });
    return deliverables;
  },

  generateServiceBreakdown(selectedServices = []) {
    const services = selectedServices.map(id => this.services.find(s => s.id === id)).filter(Boolean);
    return services.map(service => ({
      name: service.name,
      price: service.price,
      description: service.description
    }));
  }
};

export default serviceManager;