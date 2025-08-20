// 📁 data/utils/serviceUtils.js - 서비스 관련 공통 함수들

// 단계별 서비스 그룹화 (고객 여정 기반)
export const getServicesByStage = (services) => {
    const stageMapping = {
      '쇼피파이 스토어 제작': '1️⃣ 스토어 제작',
      'Shopify 고급 기능': '2️⃣ 기능 확장',
      '마케팅 플랫폼 구축': '3️⃣ 마케팅 구축',
      '구글 SEO 향상': '3️⃣ 마케팅 구축',
      '디지털 마케팅 통합': '3️⃣ 마케팅 구축',
      'Shopify 전문 SEO': '3️⃣ 마케팅 구축',
      '외부 검색엔진 최적화': '3️⃣ 마케팅 구축',
      '월간 관리 서비스': '4️⃣ 운영/관리',
      '커스텀 서비스': '5️⃣ 커스텀 서비스'
    };
  
    const grouped = {};
    services.forEach(service => {
      const stage = stageMapping[service.category] || '5️⃣ 커스텀 서비스';
      if (!grouped[stage]) {
        grouped[stage] = [];
      }
      grouped[stage].push(service);
    });
    return grouped;
  };
  
  // 계약서 제목 자동 생성
  export const generateContractTitle = (selectedServices, allServices) => {
    const selectedIds = new Set(selectedServices);
    const hasStorePlan = allServices.some(s => s.type === 'plan' && selectedIds.has(s.id));
    const hasMarketingService = allServices.some(s => s.category === '마케팅 플랫폼 구축' && selectedIds.has(s.id));
    const hasMaintenanceService = allServices.some(s => s.type === 'maintenance' && selectedIds.has(s.id));
    
    if (hasStorePlan) {
      return "쇼피파이 스토어 제작 용역계약서";
    } else if (hasMarketingService && hasMaintenanceService) {
      return "디지털 마케팅 및 유지보수 용역계약서";
    } else if (hasMarketingService) {
      return "디지털 마케팅 인프라 구축 용역계약서";
    } else if (hasMaintenanceService) {
      return "유지보수 서비스 계약서";
    } else {
      return "용역계약서";
    }
  };
  
  // 총 금액 계산
  export const calculateTotalAmount = (selectedServices, allServices, socialLoginCount = 0, customizationHours = 0, consultingHours = 0) => {
    let total = 0;
    
    selectedServices.forEach(serviceId => {
      const service = allServices.find(s => s.id === serviceId);
      if (service && typeof service.price === 'number') {
        total += service.price;
      }
    });
  
    // 소셜로그인 (개수 기반)
    total += socialLoginCount * 500000;
  
    // 시간당 서비스
    total += customizationHours * 80000;
    total += consultingHours * 200000;
    
    return total;
  };
  
  // 서비스 설명 생성
  export const generateServiceDescription = (selectedServices, allServices) => {
    if (!selectedServices || selectedServices.length === 0) {
      return '선택된 서비스가 없습니다.';
    }
  
    let description = '';
    selectedServices.forEach(serviceId => {
      const service = allServices.find(s => s.id === serviceId);
      
      if (service) {
        description += `【${service.name}】\n`;
        description += `- 금액: ${typeof service.price === 'number' ? service.price.toLocaleString() + '원' : service.price}\n`;
        description += `- 작업기간: ${service.period || '별도 협의'}\n`;
        description += `- 설명: ${service.description}\n\n`;
      }
    });
  
    return description;
  };
  
  // 상세 작업 내용 생성
  export const generateServiceDetails = (selectedServices, allServices) => {
    let details = '';
    selectedServices.forEach(serviceId => {
      const service = allServices.find(s => s.id === serviceId);
      
      if (service && (service.details || service.includedServices)) {
        details += `【${service.name}】\n`;
        
        if (service.details) {
          service.details.forEach(detail => {
            details += `- ${detail}\n`;
          });
        }
        
        if (service.includedServices) {
          Object.entries(service.includedServices).forEach(([category, services]) => {
            details += `\n${category.toUpperCase()}:\n`;
            services.forEach(serviceItem => {
              if (typeof serviceItem === 'string') {
                details += `- ${serviceItem}\n`;
              } else {
                details += `- ${serviceItem.name}\n`;
              }
            });
          });
        }
        
        details += '\n';
      }
    });
  
    return details;
  };
  
  // 산출물 생성
  export const generateDeliverables = (selectedServices, allServices) => {
    let deliverables = '';
    selectedServices.forEach(serviceId => {
      const service = allServices.find(s => s.id === serviceId);
      
      if (service && service.deliverables) {
        deliverables += `【${service.name}】\n`;
        service.deliverables.forEach(deliverable => {
          deliverables += `- ${deliverable}\n`;
        });
        deliverables += '\n';
      }
    });
  
    return deliverables;
  };
  
  // 서비스별 금액 분석
  export const generateServiceBreakdown = (selectedServices, allServices) => {
    let breakdown = '';
    selectedServices.forEach(serviceId => {
      const service = allServices.find(s => s.id === serviceId);
      
      if (service) {
        const priceText = typeof service.price === 'number' 
          ? service.price.toLocaleString() + '원' 
          : service.price;
        breakdown += `- ${service.name}: ${priceText}\n`;
      }
    });
  
    return breakdown;
  };
  
  // 금액별 결제 구조 추천
  export const getRecommendedPaymentStructure = (totalAmount) => {
    return totalAmount >= 10000000 ? '3-stage' : '2-stage';
  };
  
  // 부가세 포함 금액 계산
  export const calculateAmountWithTax = (baseAmount) => {
    const tax = Math.round(baseAmount * 0.1);
    const totalAmount = baseAmount + tax;
    
    return { 
      baseAmount, 
      tax, 
      totalAmount 
    };
  };
  
  // 결제 단계별 금액 계산
  export const calculatePaymentSchedule = (totalAmount, paymentStructure) => {
    if (paymentStructure === '3-stage') {
      return {
        contract: Math.round(totalAmount * 0.4), // 계약금 40%
        interim: Math.round(totalAmount * 0.3),   // 중도금 30%
        final: Math.round(totalAmount * 0.3)      // 잔금 30%
      };
    } else {
      return {
        contract: Math.round(totalAmount * 0.7), // 계약금 70%
        final: Math.round(totalAmount * 0.3)     // 잔금 30%
      };
    }
  };
  
  // 서비스 유형별 필터링
  export const filterServicesByType = (services, type) => {
    return services.filter(service => service.type === type);
  };
  
  // 검색 필터링
  export const searchServices = (services, searchTerm) => {
    const term = searchTerm.toLowerCase();
    return services.filter(service => 
      service.name.toLowerCase().includes(term) ||
      service.description.toLowerCase().includes(term) ||
      service.category.toLowerCase().includes(term)
    );
  };
  
  // 서비스 데이터 유효성 검사
  export const validateServiceData = (service) => {
    const errors = [];
    
    if (!service.name?.trim()) errors.push('서비스명이 필요합니다');
    if (!service.description?.trim()) errors.push('서비스 설명이 필요합니다');
    if (!service.category?.trim()) errors.push('카테고리가 필요합니다');
    if (!service.price) errors.push('가격 정보가 필요합니다');
    if (!service.type?.trim()) errors.push('서비스 유형이 필요합니다');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };