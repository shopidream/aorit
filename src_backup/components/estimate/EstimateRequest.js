// src/components/estimate/EstimateRequest.js

import React, { useState, useEffect } from 'react';
import useEstimateStore from '../../stores/estimateStore';
import { 
  designSystem, 
  getButtonStyles, 
  getServiceCardStyles, 
  getFormFieldStyles,
  getEstimateStepStyles 
} from '../../styles/designSystem';

const EstimateRequest = ({ availableServices, onEstimateComplete }) => {
  const {
    selectedServices,
    customerInfo,
    projectInfo,
    calculation,
    addService,
    removeService,
    updateServiceQuantity,
    setCustomerInfo,
    setProjectInfo,
    applyDiscount,
    validateEstimate,
    createEstimate,
    exportEstimateData
  } = useEstimateStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 1, title: '서비스 선택', description: '필요한 서비스를 선택해주세요' },
    { id: 2, title: '고객 정보', description: '고객 정보를 입력해주세요' },
    { id: 3, title: '프로젝트 정보', description: '프로젝트 세부사항을 입력해주세요' },
    { id: 4, title: '견적 확인', description: '견적 내용을 확인해주세요' }
  ];

  useEffect(() => {
    // calculation이 변경될 때마다 상태 업데이트
  }, [calculation]);

  const handleServiceSelection = (service) => {
    const isSelected = selectedServices.find(s => s.id === service.id);
    if (isSelected) {
      removeService(service.id);
    } else {
      addService(service);
    }
  };

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo({ [field]: value });
  };

  const handleProjectInfoChange = (field, value) => {
    setProjectInfo({ [field]: value });
  };

  const validateCurrentStep = () => {
    const errors = [];
    
    switch (currentStep) {
      case 1:
        if (selectedServices.length === 0) {
          errors.push('최소 하나의 서비스를 선택해주세요.');
        }
        break;
      case 2:
        if (!customerInfo.name.trim()) errors.push('고객명을 입력해주세요.');
        if (!customerInfo.email.trim()) errors.push('이메일을 입력해주세요.');
        if (!customerInfo.phone.trim()) errors.push('연락처를 입력해주세요.');
        break;
      case 3:
        if (!projectInfo.title.trim()) errors.push('프로젝트 제목을 입력해주세요.');
        if (!projectInfo.startDate) errors.push('시작일을 선택해주세요.');
        if (!projectInfo.endDate) errors.push('완료일을 선택해주세요.');
        break;
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmitEstimate = async () => {
    const validation = validateEstimate();
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      createEstimate();
      const estimateData = exportEstimateData();
      
      if (onEstimateComplete) {
        onEstimateComplete(estimateData);
      }
      
      alert('견적서가 성공적으로 생성되었습니다!');
      
    } catch (error) {
      console.error('견적서 생성 중 오류:', error);
      alert('견적서 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ServiceSelectionStep 
          availableServices={availableServices}
          selectedServices={selectedServices}
          onServiceToggle={handleServiceSelection}
          onQuantityChange={updateServiceQuantity}
        />;
      case 2:
        return <CustomerInfoStep 
          customerInfo={customerInfo}
          onChange={handleCustomerInfoChange}
        />;
      case 3:
        return <ProjectInfoStep 
          projectInfo={projectInfo}
          onChange={handleProjectInfoChange}
        />;
      case 4:
        return <EstimateReviewStep 
          selectedServices={selectedServices}
          customerInfo={customerInfo}
          projectInfo={projectInfo}
          calculation={calculation}
          onApplyDiscount={applyDiscount}
        />;
      default:
        return null;
    }
  };

  return (
    <div className={designSystem.layout.container}>
      {/* Progress Bar */}
      <div className={`${designSystem.layout.spacingSection} mb-8`}>
        <div className={designSystem.layout.flexRow}>
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;
            
            return (
              <div 
                key={step.id}
                className={`${designSystem.layout.flexRow} flex-1`}
              >
                <div className={getEstimateStepStyles(isActive, isComplete)}>
                  {step.id}
                </div>
                <div className={designSystem.layout.flexCol}>
                  <div className={`${designSystem.typography.h5} ${
                    isActive ? designSystem.estimate.progressStepActive : 
                    isComplete ? designSystem.estimate.progressStepComplete : 
                    designSystem.colors.neutral.textLight
                  }`}>
                    {step.title}
                  </div>
                  <div className={designSystem.typography.bodySmall}>
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Messages */}
      {validationErrors.length > 0 && (
        <div className={`${designSystem.colors.status.error} p-4 rounded-lg mb-6`}>
          {validationErrors.map((error, index) => (
            <div key={index} className={designSystem.typography.error}>
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Step Content */}
      <div className={designSystem.layout.spacingSection}>
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className={`${designSystem.layout.flexRow} justify-between mt-8`}>
        {currentStep > 1 ? (
          <button 
            type="button" 
            onClick={handlePrevStep}
            className={getButtonStyles('outline')}
          >
            이전
          </button>
        ) : (
          <div></div>
        )}
        
        {currentStep < 4 ? (
          <button 
            type="button" 
            onClick={handleNextStep}
            className={getButtonStyles('primary')}
          >
            다음
          </button>
        ) : (
          <button 
            type="button" 
            onClick={handleSubmitEstimate}
            disabled={isSubmitting}
            className={getButtonStyles('primary')}
          >
            {isSubmitting ? '생성 중...' : '견적서 생성'}
          </button>
        )}
      </div>
    </div>
  );
};

// 서비스 선택 스텝
const ServiceSelectionStep = ({ availableServices, selectedServices, onServiceToggle, onQuantityChange }) => {
  const groupedServices = availableServices.reduce((groups, service) => {
    const category = service.category || 'other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(service);
    return groups;
  }, {});

  return (
    <div className={designSystem.layout.spacingSection}>
      <h3 className={designSystem.typography.h3}>서비스를 선택해주세요</h3>
      
      {Object.entries(groupedServices).map(([category, services]) => (
        <div key={category} className={designSystem.layout.spacingSection}>
          <h4 className={designSystem.typography.h4}>{category}</h4>
          <div className={designSystem.layout.grid}>
            {services.map((service) => {
              const selectedService = selectedServices.find(s => s.id === service.id);
              const isSelected = !!selectedService;
              
              return (
                <div 
                  key={service.id} 
                  className={`${getServiceCardStyles(isSelected)} ${designSystem.layout.spacingCard} cursor-pointer`}
                  onClick={() => onServiceToggle(service)}
                >
                  <div className={`${designSystem.layout.flexRow} justify-between mb-4`}>
                    <h5 className={designSystem.typography.h5}>{service.name}</h5>
                    <div className={designSystem.typography.h5}>
                      {new Intl.NumberFormat('ko-KR').format(service.price)}원
                    </div>
                  </div>
                  
                  <div className={`${designSystem.typography.body} mb-4`}>
                    {service.description}
                  </div>
                  
                  {service.features && (
                    <div className="mb-4">
                      {service.features.map((feature, index) => (
                        <div key={index} className={designSystem.typography.bodySmall}>
                          • {feature}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isSelected && (
                    <div className={designSystem.layout.flexRow} onClick={(e) => e.stopPropagation()}>
                      <label className={designSystem.form.label}>수량:</label>
                      <input
                        type="number"
                        min="1"
                        value={selectedService.quantity}
                        onChange={(e) => onQuantityChange(service.id, parseInt(e.target.value))}
                        className={getFormFieldStyles()}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// 고객 정보 스텝
const CustomerInfoStep = ({ customerInfo, onChange }) => {
  return (
    <div className={designSystem.layout.spacingSection}>
      <h3 className={designSystem.typography.h3}>고객 정보를 입력해주세요</h3>
      
      <div className={designSystem.layout.formGrid}>
        <div className={designSystem.form.group}>
          <label className={designSystem.form.label}>고객명 *</label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="고객 이름을 입력하세요"
            className={getFormFieldStyles()}
            required
          />
        </div>
        
        <div className={designSystem.form.group}>
          <label className={designSystem.form.label}>이메일 *</label>
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="customer@email.com"
            className={getFormFieldStyles()}
            required
          />
        </div>
        
        <div className={designSystem.form.group}>
          <label className={designSystem.form.label}>연락처 *</label>
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="010-1234-5678"
            className={getFormFieldStyles()}
            required
          />
        </div>
        
        <div className={designSystem.form.group}>
          <label className={designSystem.form.label}>회사명</label>
          <input
            type="text"
            value={customerInfo.company}
            onChange={(e) => onChange('company', e.target.value)}
            placeholder="회사명 (선택사항)"
            className={getFormFieldStyles()}
          />
        </div>
        
        <div className={`${designSystem.form.group} md:col-span-2`}>
          <label className={designSystem.form.label}>주소</label>
          <input
            type="text"
            value={customerInfo.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="주소 (선택사항)"
            className={getFormFieldStyles()}
          />
        </div>
        
        <div className={`${designSystem.form.group} md:col-span-2`}>
          <label className={designSystem.form.label}>특별 요구사항</label>
          <textarea
            value={customerInfo.requirements}
            onChange={(e) => onChange('requirements', e.target.value)}
            placeholder="추가 요구사항이나 특별한 지시사항을 입력하세요"
            rows="4"
            className={designSystem.form.textarea}
          />
        </div>
      </div>
    </div>
  );
};

// 프로젝트 정보 스텝
const ProjectInfoStep = ({ projectInfo, onChange }) => {
  return (
    <div className={designSystem.layout.spacingSection}>
      <h3 className={designSystem.typography.h3}>프로젝트 정보를 입력해주세요</h3>
      
      <div className={designSystem.layout.formGrid}>
        <div className={`${designSystem.form.group} md:col-span-2`}>
          <label className={designSystem.form.label}>프로젝트 제목 *</label>
          <input
            type="text"
            value={projectInfo.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="프로젝트 제목을 입력하세요"
            className={getFormFieldStyles()}
            required
          />
        </div>
        
        <div className={`${designSystem.form.group} md:col-span-2`}>
          <label className={designSystem.form.label}>프로젝트 설명</label>
          <textarea
            value={projectInfo.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="프로젝트에 대한 상세한 설명을 입력하세요"
            rows="4"
            className={designSystem.form.textarea}
          />
        </div>
        
        <div className={designSystem.form.group}>
          <label className={designSystem.form.label}>시작일 *</label>
          <input
            type="date"
            value={projectInfo.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
            className={getFormFieldStyles()}
            required
          />
        </div>
        
        <div className={designSystem.form.group}>
          <label className={designSystem.form.label}>완료일 *</label>
          <input
            type="date"
            value={projectInfo.endDate}
            onChange={(e) => onChange('endDate', e.target.value)}
            className={getFormFieldStyles()}
            required
          />
        </div>
        
        <div className={designSystem.form.group}>
          <label className={designSystem.form.label}>예상 예산</label>
          <input
            type="number"
            value={projectInfo.budget}
            onChange={(e) => onChange('budget', parseInt(e.target.value) || 0)}
            placeholder="예상 예산 (원)"
            className={getFormFieldStyles()}
          />
        </div>
        
        <div className={designSystem.form.group}>
          <label className={designSystem.form.label}>업종</label>
          <select
            value={projectInfo.industry}
            onChange={(e) => onChange('industry', e.target.value)}
            className={designSystem.form.select}
          >
            <option value="general">일반</option>
            <option value="design">디자인</option>
            <option value="software">소프트웨어</option>
            <option value="marketing">마케팅</option>
            <option value="manufacturing">제조업</option>
            <option value="retail">소매업</option>
            <option value="consulting">컨설팅</option>
          </select>
        </div>
        
        <div className={designSystem.form.group}>
          <label className={designSystem.form.label}>프로젝트 유형</label>
          <select
            value={projectInfo.projectType}
            onChange={(e) => onChange('projectType', e.target.value)}
            className={designSystem.form.select}
          >
            <option value="standard">표준</option>
            <option value="custom">맞춤형</option>
            <option value="rush">긴급</option>
            <option value="maintenance">유지보수</option>
          </select>
        </div>
        
        <div className={designSystem.form.group}>
          <label className={designSystem.form.label}>긴급도</label>
          <select
            value={projectInfo.urgency}
            onChange={(e) => onChange('urgency', e.target.value)}
            className={designSystem.form.select}
          >
            <option value="low">낮음</option>
            <option value="normal">보통</option>
            <option value="high">높음</option>
            <option value="urgent">긴급</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// 견적 검토 스텝
const EstimateReviewStep = ({ selectedServices, customerInfo, projectInfo, calculation, onApplyDiscount }) => {
  const [discountRate, setDiscountRate] = useState(0);

  const handleApplyDiscount = () => {
    onApplyDiscount(discountRate);
  };

  return (
    <div className={designSystem.layout.spacingSection}>
      <h3 className={designSystem.typography.h3}>견적 내용을 확인해주세요</h3>
      
      {/* 고객 정보 요약 */}
      <div className={`${designSystem.form.fieldset} mb-8`}>
        <h4 className={designSystem.typography.h4}>고객 정보</h4>
        <div className={designSystem.layout.formGrid}>
          <div><strong>고객명:</strong> {customerInfo.name}</div>
          <div><strong>이메일:</strong> {customerInfo.email}</div>
          <div><strong>연락처:</strong> {customerInfo.phone}</div>
          {customerInfo.company && <div><strong>회사:</strong> {customerInfo.company}</div>}
        </div>
      </div>
      
      {/* 프로젝트 정보 요약 */}
      <div className={`${designSystem.form.fieldset} mb-8`}>
        <h4 className={designSystem.typography.h4}>프로젝트 정보</h4>
        <div className={designSystem.layout.formGrid}>
          <div><strong>제목:</strong> {projectInfo.title}</div>
          <div><strong>시작일:</strong> {projectInfo.startDate}</div>
          <div><strong>완료일:</strong> {projectInfo.endDate}</div>
          <div><strong>업종:</strong> {projectInfo.industry}</div>
        </div>
      </div>
      
      {/* 선택된 서비스 목록 */}
      <div className={`${designSystem.form.fieldset} mb-8`}>
        <h4 className={designSystem.typography.h4}>선택된 서비스</h4>
        <div className={designSystem.layout.spacingSection}>
          {selectedServices.map((service) => (
            <div key={service.id} className={`${designSystem.layout.flexRow} justify-between p-4 bg-gray-50 rounded-lg`}>
              <div>
                <div className={designSystem.typography.h5}>{service.name}</div>
                <div className={designSystem.typography.bodySmall}>
                  수량: {service.quantity} × {new Intl.NumberFormat('ko-KR').format(service.price)}원
                </div>
              </div>
              <div className={designSystem.typography.h5}>
                {new Intl.NumberFormat('ko-KR').format(service.price * service.quantity)}원
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 할인 적용 */}
      <div className={`${designSystem.form.fieldset} mb-8`}>
        <h4 className={designSystem.typography.h4}>할인 적용</h4>
        <div className={designSystem.layout.flexRow}>
          <input
            type="number"
            min="0"
            max="100"
            value={discountRate}
            onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
            placeholder="할인율 (%)"
            className={getFormFieldStyles()}
          />
          <button 
            type="button" 
            onClick={handleApplyDiscount} 
            className={getButtonStyles('secondary')}
          >
            할인 적용
          </button>
        </div>
      </div>
      
      {/* 최종 계산 */}
      <div className={designSystem.form.fieldset}>
        <h4 className={designSystem.typography.h4}>견적 총액</h4>
        <div className={designSystem.layout.spacingCard}>
          <div className={`${designSystem.layout.flexRow} justify-between py-2`}>
            <span className={designSystem.typography.body}>소계:</span>
            <span className={designSystem.typography.body}>
              {new Intl.NumberFormat('ko-KR').format(calculation.subtotal)}원
            </span>
          </div>
          {calculation.discountAmount > 0 && (
            <div className={`${designSystem.layout.flexRow} justify-between py-2 text-red-600`}>
              <span>할인 ({calculation.discountRate.toFixed(1)}%):</span>
              <span>-{new Intl.NumberFormat('ko-KR').format(calculation.discountAmount)}원</span>
            </div>
          )}
          <div className={`${designSystem.layout.flexRow} justify-between py-2`}>
            <span className={designSystem.typography.body}>부가세 (10%):</span>
            <span className={designSystem.typography.body}>
              {new Intl.NumberFormat('ko-KR').format(calculation.taxAmount)}원
            </span>
          </div>
          <div className={`${designSystem.layout.flexRow} justify-between py-4 border-t border-gray-200`}>
            <span className={designSystem.typography.h4}>총 금액:</span>
            <span className={designSystem.typography.h4}>
              {new Intl.NumberFormat('ko-KR').format(calculation.totalAmount)}원
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateRequest;