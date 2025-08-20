// src/stores/estimateStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useEstimateStore = create(
  persist(
    (set, get) => ({
      // 견적 기본 정보
      estimateData: {
        id: null,
        status: 'draft', // draft, sent, approved, rejected, contracted
        createdAt: null,
        updatedAt: null,
        expiresAt: null
      },

      // 선택된 서비스들
      selectedServices: [],
      
      // 고객 정보
      customerInfo: {
        name: '',
        email: '',
        company: '',
        phone: '',
        address: '',
        requirements: ''
      },

      // 프로젝트 정보  
      projectInfo: {
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        budget: 0,
        industry: 'general',
        projectType: 'standard',
        urgency: 'normal'
      },

      // 견적 계산 결과
      calculation: {
        subtotal: 0,
        discountAmount: 0,
        discountRate: 0,
        taxAmount: 0,
        totalAmount: 0,
        paymentTerms: 'lump_sum'
      },

      // 계약 조건
      contractConditions: {
        country: 'KR',
        language: 'ko',
        paymentMethod: 'installment',
        deliveryMethod: 'digital',
        warrantyPeriod: 0,
        revisionLimit: 3
      },

      // Actions - 서비스 관리
      addService: (service) => set((state) => {
        const exists = state.selectedServices.find(s => s.id === service.id);
        if (exists) return state;
        
        const newServices = [...state.selectedServices, {
          ...service,
          quantity: 1,
          selectedAt: new Date().toISOString()
        }];
        
        return {
          selectedServices: newServices,
          calculation: get().calculateTotal(newServices)
        };
      }),

      removeService: (serviceId) => set((state) => {
        const newServices = state.selectedServices.filter(s => s.id !== serviceId);
        return {
          selectedServices: newServices,
          calculation: get().calculateTotal(newServices)
        };
      }),

      updateServiceQuantity: (serviceId, quantity) => set((state) => {
        const newServices = state.selectedServices.map(service => 
          service.id === serviceId ? { ...service, quantity: Math.max(1, quantity) } : service
        );
        
        return {
          selectedServices: newServices,
          calculation: get().calculateTotal(newServices)
        };
      }),

      updateServiceOptions: (serviceId, options) => set((state) => {
        const newServices = state.selectedServices.map(service => 
          service.id === serviceId ? { ...service, selectedOptions: options } : service
        );
        
        return {
          selectedServices: newServices,
          calculation: get().calculateTotal(newServices)
        };
      }),

      // Actions - 정보 업데이트
      setCustomerInfo: (info) => set((state) => ({
        customerInfo: { ...state.customerInfo, ...info }
      })),

      setProjectInfo: (info) => set((state) => ({
        projectInfo: { ...state.projectInfo, ...info }
      })),

      setContractConditions: (conditions) => set((state) => ({
        contractConditions: { ...state.contractConditions, ...conditions }
      })),

      // Actions - 할인 적용
      applyDiscount: (discountRate, discountAmount = 0) => set((state) => {
        const subtotal = state.calculation.subtotal;
        const finalDiscountAmount = discountAmount || (subtotal * discountRate / 100);
        const afterDiscount = subtotal - finalDiscountAmount;
        const taxAmount = afterDiscount * 0.1; // 10% VAT
        const totalAmount = afterDiscount + taxAmount;

        return {
          calculation: {
            ...state.calculation,
            discountRate,
            discountAmount: finalDiscountAmount,
            taxAmount,
            totalAmount
          }
        };
      }),

      // Actions - 견적 상태 관리
      createEstimate: () => set((state) => {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30일 후

        return {
          estimateData: {
            id: generateEstimateId(),
            status: 'draft',
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
          }
        };
      }),

      sendEstimate: () => set((state) => ({
        estimateData: {
          ...state.estimateData,
          status: 'sent',
          updatedAt: new Date().toISOString()
        }
      })),

      approveEstimate: () => set((state) => ({
        estimateData: {
          ...state.estimateData,
          status: 'approved',
          updatedAt: new Date().toISOString()
        }
      })),

      rejectEstimate: (reason = '') => set((state) => ({
        estimateData: {
          ...state.estimateData,
          status: 'rejected',
          rejectionReason: reason,
          updatedAt: new Date().toISOString()
        }
      })),

      createContract: () => set((state) => ({
        estimateData: {
          ...state.estimateData,
          status: 'contracted',
          updatedAt: new Date().toISOString()
        }
      })),

      // Utilities - 계산 함수
      calculateTotal: (services = null) => {
        const currentServices = services || get().selectedServices;
        
        const subtotal = currentServices.reduce((total, service) => {
          let serviceTotal = service.price * service.quantity;
          
          // 옵션 가격 추가
          if (service.selectedOptions) {
            const optionsTotal = service.selectedOptions.reduce((optTotal, option) => 
              optTotal + (option.price || 0), 0
            );
            serviceTotal += optionsTotal * service.quantity;
          }
          
          return total + serviceTotal;
        }, 0);

        const state = get();
        const discountAmount = state.calculation?.discountAmount || 0;
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * 0.1; // 10% VAT
        const totalAmount = afterDiscount + taxAmount;

        return {
          subtotal,
          discountAmount,
          discountRate: subtotal > 0 ? (discountAmount / subtotal * 100) : 0,
          taxAmount,
          totalAmount
        };
      },

      getServicesByCategory: () => {
        const services = get().selectedServices;
        const categories = {};
        
        services.forEach(service => {
          const category = service.category || 'other';
          if (!categories[category]) {
            categories[category] = [];
          }
          categories[category].push(service);
        });
        
        return categories;
      },

      // Actions - 초기화
      resetEstimate: () => set({
        selectedServices: [],
        customerInfo: {
          name: '',
          email: '',
          company: '',
          phone: '',
          address: '',
          requirements: ''
        },
        projectInfo: {
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          budget: 0,
          industry: 'general',
          projectType: 'standard',
          urgency: 'normal'
        },
        calculation: {
          subtotal: 0,
          discountAmount: 0,
          discountRate: 0,
          taxAmount: 0,
          totalAmount: 0,
          paymentTerms: 'lump_sum'
        },
        estimateData: {
          id: null,
          status: 'draft',
          createdAt: null,
          updatedAt: null,
          expiresAt: null
        }
      }),

      // Utilities - 검증
      validateEstimate: () => {
        const state = get();
        const errors = [];
        
        if (state.selectedServices.length === 0) {
          errors.push('선택된 서비스가 없습니다.');
        }
        
        if (!state.customerInfo.name.trim()) {
          errors.push('고객명을 입력해주세요.');
        }
        
        if (!state.customerInfo.email.trim()) {
          errors.push('고객 이메일을 입력해주세요.');
        }
        
        if (!state.projectInfo.title.trim()) {
          errors.push('프로젝트 제목을 입력해주세요.');
        }
        
        return {
          isValid: errors.length === 0,
          errors
        };
      },

      // Utilities - 견적서 데이터 export
      exportEstimateData: () => {
        const state = get();
        return {
          estimate: state.estimateData,
          customer: state.customerInfo,
          project: state.projectInfo,
          services: state.selectedServices,
          calculation: state.calculation,
          conditions: state.contractConditions,
          exportedAt: new Date().toISOString()
        };
      }
    }),
    {
      name: 'estimate-store', // localStorage key
      partialize: (state) => ({
        selectedServices: state.selectedServices,
        customerInfo: state.customerInfo,
        projectInfo: state.projectInfo,
        calculation: state.calculation,
        contractConditions: state.contractConditions,
        estimateData: state.estimateData
      })
    }
  )
);

// Helper functions
function generateEstimateId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `EST${year}${month}${day}${random}`;
}

export default useEstimateStore;