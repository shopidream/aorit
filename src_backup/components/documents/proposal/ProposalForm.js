// src/components/documents/proposal/ProposalForm.js

import React, { useState, useEffect } from 'react';
import { 
  designSystem, 
  getButtonStyles, 
  getFormFieldStyles 
} from '../../../styles/designSystem';

const ProposalForm = ({ 
  initialData = {},
  onSubmit,
  onSave,
  selectedServices = [],
  isEditing = false,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    // 발주자 정보
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    clientAddress: '',
    
    // 프로젝트 정보
    projectTitle: '',
    projectDescription: '',
    projectStartDate: '',
    projectEndDate: '',
    
    // 계약 조건
    paymentTerms: 'installment',
    revisionLimit: 3,
    deliveryMethod: 'digital',
    warrantyPeriod: 30,
    specialRequirements: '',
    
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [calculation, setCalculation] = useState({
    subtotal: 0,
    tax: 0,
    total: 0
  });

  useEffect(() => {
    calculateTotal();
  }, [selectedServices]);

  const calculateTotal = () => {
    const subtotal = selectedServices.reduce((sum, service) => {
      return sum + (service.price * (service.quantity || 1));
    }, 0);
    
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    
    setCalculation({ subtotal, tax, total });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // 필수 필드 검증
    if (!formData.clientName?.trim()) newErrors.clientName = '고객명을 입력해주세요.';
    if (!formData.clientEmail?.trim()) newErrors.clientEmail = '이메일을 입력해주세요.';
    if (!formData.clientPhone?.trim()) newErrors.clientPhone = '연락처를 입력해주세요.';
    if (!formData.projectTitle?.trim()) newErrors.projectTitle = '프로젝트 제목을 입력해주세요.';
    if (!formData.projectStartDate) newErrors.projectStartDate = '시작일을 선택해주세요.';
    if (!formData.projectEndDate) newErrors.projectEndDate = '완료일을 선택해주세요.';
    
    // 이메일 형식 검증
    if (formData.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = '올바른 이메일 형식을 입력해주세요.';
    }
    
    // 서비스 선택 검증
    if (selectedServices.length === 0) {
      newErrors.services = '최소 하나의 서비스를 선택해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const proposalData = {
        ...formData,
        services: selectedServices,
        calculation,
        createdAt: new Date().toISOString()
      };
      
      if (onSubmit) {
        onSubmit(proposalData);
      }
    }
  };

  const handleSave = () => {
    const proposalData = {
      ...formData,
      services: selectedServices,
      calculation,
      updatedAt: new Date().toISOString()
    };
    
    if (onSave) {
      onSave(proposalData);
    }
  };

  return (
    <div className={designSystem.layout.container}>
      <div className={`${designSystem.form.fieldset} mb-8`}>
        <h2 className={`${designSystem.typography.h2} mb-6`}>
          {isEditing ? '제안서 수정' : '제안서 작성'}
        </h2>
        
        <form onSubmit={handleSubmit} className={designSystem.layout.spacingSection}>
          {/* 발주자 정보 */}
          <fieldset className={designSystem.form.fieldset}>
            <legend className={designSystem.form.legend}>발주자 정보</legend>
            
            <div className={designSystem.layout.formGrid}>
              <div className={designSystem.form.group}>
                <label className={designSystem.form.label}>고객명 *</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="(주)회사이름"
                  className={getFormFieldStyles(errors.clientName)}
                />
                {errors.clientName && (
                  <p className={designSystem.form.error}>{errors.clientName}</p>
                )}
              </div>
              
              <div className={designSystem.form.group}>
                <label className={designSystem.form.label}>이메일 *</label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  placeholder="client@company.com"
                  className={getFormFieldStyles(errors.clientEmail)}
                />
                {errors.clientEmail && (
                  <p className={designSystem.form.error}>{errors.clientEmail}</p>
                )}
              </div>
              
              <div className={designSystem.form.group}>
                <label className={designSystem.form.label}>연락처 *</label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                  placeholder="010-1234-5678"
                  className={getFormFieldStyles(errors.clientPhone)}
                />
                {errors.clientPhone && (
                  <p className={designSystem.form.error}>{errors.clientPhone}</p>
                )}
              </div>
              
              <div className={designSystem.form.group}>
                <label className={designSystem.form.label}>회사명</label>
                <input
                  type="text"
                  value={formData.clientCompany}
                  onChange={(e) => handleInputChange('clientCompany', e.target.value)}
                  placeholder="회사명 (선택사항)"
                  className={designSystem.form.input}
                />
              </div>
            </div>
          </fieldset>

          {/* 프로젝트 정보 */}
          <fieldset className={designSystem.form.fieldset}>
            <legend className={designSystem.form.legend}>프로젝트 정보</legend>
            
            <div className={designSystem.layout.formGrid}>
              <div className={`${designSystem.form.group} md:col-span-2`}>
                <label className={designSystem.form.label}>프로젝트 제목 *</label>
                <input
                  type="text"
                  value={formData.projectTitle}
                  onChange={(e) => handleInputChange('projectTitle', e.target.value)}
                  placeholder="프로젝트 제목을 입력하세요"
                  className={getFormFieldStyles(errors.projectTitle)}
                />
                {errors.projectTitle && (
                  <p className={designSystem.form.error}>{errors.projectTitle}</p>
                )}
              </div>
              
              <div className={designSystem.form.group}>
                <label className={designSystem.form.label}>시작일 *</label>
                <input
                  type="date"
                  value={formData.projectStartDate}
                  onChange={(e) => handleInputChange('projectStartDate', e.target.value)}
                  className={getFormFieldStyles(errors.projectStartDate)}
                />
                {errors.projectStartDate && (
                  <p className={designSystem.form.error}>{errors.projectStartDate}</p>
                )}
              </div>
              
              <div className={designSystem.form.group}>
                <label className={designSystem.form.label}>완료일 *</label>
                <input
                  type="date"
                  value={formData.projectEndDate}
                  onChange={(e) => handleInputChange('projectEndDate', e.target.value)}
                  className={getFormFieldStyles(errors.projectEndDate)}
                />
                {errors.projectEndDate && (
                  <p className={designSystem.form.error}>{errors.projectEndDate}</p>
                )}
              </div>
              
              <div className={`${designSystem.form.group} md:col-span-2`}>
                <label className={designSystem.form.label}>프로젝트 설명</label>
                <textarea
                  value={formData.projectDescription}
                  onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                  placeholder="프로젝트에 대한 상세한 설명을 입력하세요"
                  rows="3"
                  className={designSystem.form.textarea}
                />
              </div>
            </div>
          </fieldset>

          {/* 선택된 서비스 */}
          <fieldset className={designSystem.form.fieldset}>
            <legend className={designSystem.form.legend}>선택된 서비스</legend>
            
            {errors.services && (
              <p className={`${designSystem.form.error} mb-4`}>{errors.services}</p>
            )}
            
            {selectedServices.length > 0 ? (
              <div className={designSystem.layout.spacingCard}>
                {selectedServices.map((service, index) => (
                  <div key={service.id || index} className={`${designSystem.layout.flexRow} justify-between items-center p-4 bg-gray-50 rounded-lg`}>
                    <div>
                      <h4 className={designSystem.typography.h5}>{service.name}</h4>
                      <p className={designSystem.typography.bodySmall}>{service.description}</p>
                    </div>
                    <div className={`${designSystem.typography.h5} ${designSystem.colors.primary.text}`}>
                      {new Intl.NumberFormat('ko-KR').format(service.price)}원
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${designSystem.layout.flexCol} items-center py-8 text-gray-500`}>
                <div className="text-4xl mb-2">📋</div>
                <p className={designSystem.typography.body}>선택된 서비스가 없습니다.</p>
              </div>
            )}
          </fieldset>

          {/* 계약 조건 */}
          <fieldset className={designSystem.form.fieldset}>
            <legend className={designSystem.form.legend}>계약 조건</legend>
            
            <div className={designSystem.layout.formGrid}>
              <div className={designSystem.form.group}>
                <label className={designSystem.form.label}>지급 방식</label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                  className={designSystem.form.select}
                >
                  <option value="lump_sum">일괄 지급</option>
                  <option value="installment">분할 지급</option>
                </select>
              </div>
              
              <div className={designSystem.form.group}>
                <label className={designSystem.form.label}>수정 횟수</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.revisionLimit}
                  onChange={(e) => handleInputChange('revisionLimit', parseInt(e.target.value))}
                  className={designSystem.form.input}
                />
              </div>
              
              <div className={designSystem.form.group}>
                <label className={designSystem.form.label}>납품 방식</label>
                <select
                  value={formData.deliveryMethod}
                  onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                  className={designSystem.form.select}
                >
                  <option value="digital">디지털 파일</option>
                  <option value="physical">실물 배송</option>
                  <option value="both">디지털 + 실물</option>
                </select>
              </div>
              
              <div className={designSystem.form.group}>
                <label className={designSystem.form.label}>보증 기간 (일)</label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={formData.warrantyPeriod}
                  onChange={(e) => handleInputChange('warrantyPeriod', parseInt(e.target.value))}
                  className={designSystem.form.input}
                />
              </div>
              
              <div className={`${designSystem.form.group} md:col-span-2`}>
                <label className={designSystem.form.label}>특별 요구사항</label>
                <textarea
                  value={formData.specialRequirements}
                  onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                  placeholder="추가 요구사항이나 특별한 조건을 입력하세요"
                  rows="3"
                  className={designSystem.form.textarea}
                />
              </div>
            </div>
          </fieldset>

          {/* 견적 총액 */}
          <fieldset className={designSystem.form.fieldset}>
            <legend className={designSystem.form.legend}>견적 총액</legend>
            
            <div className={`${designSystem.layout.spacingCard} bg-gray-50 rounded-lg`}>
              <div className={`${designSystem.layout.flexRow} justify-between py-3 border-b border-gray-200`}>
                <span className={designSystem.typography.body}>서비스 소계:</span>
                <span className={designSystem.typography.h5}>
                  {new Intl.NumberFormat('ko-KR').format(calculation.subtotal)}원
                </span>
              </div>
              
              <div className={`${designSystem.layout.flexRow} justify-between py-3 border-b border-gray-200`}>
                <span className={designSystem.typography.body}>부가세 (10%):</span>
                <span className={designSystem.typography.h5}>
                  {new Intl.NumberFormat('ko-KR').format(calculation.tax)}원
                </span>
              </div>
              
              <div className={`${designSystem.layout.flexRow} justify-between py-4`}>
                <span className={`${designSystem.typography.h4} text-gray-900`}>총 금액:</span>
                <span className={`${designSystem.typography.h3} ${designSystem.colors.primary.text}`}>
                  {new Intl.NumberFormat('ko-KR').format(calculation.total)}원
                </span>
              </div>
            </div>
          </fieldset>

          {/* 폼 액션 버튼 */}
          <div className={`${designSystem.layout.flexRow} justify-between items-center pt-8 border-t border-gray-200`}>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className={getButtonStyles('outline')}
            >
              임시 저장
            </button>
            
            <div className={`${designSystem.layout.flexRow} gap-3`}>
              <button
                type="button"
                onClick={() => window.history.back()}
                disabled={isLoading}
                className={getButtonStyles('ghost')}
              >
                취소
              </button>
              
              <button
                type="submit"
                disabled={isLoading || selectedServices.length === 0}
                className={getButtonStyles('primary', 'lg')}
              >
                {isLoading ? (
                  <div className={designSystem.layout.flexRow}>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    처리 중...
                  </div>
                ) : (
                  isEditing ? '수정 완료' : '제안서 생성'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalForm;