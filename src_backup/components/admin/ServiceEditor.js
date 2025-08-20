import React, { useState, useEffect } from 'react';
import { designSystem, getModalStyles, getButtonStyles, getInputStyles, getBadgeStyles } from '../../styles/designSystem.js';

const ServiceEditor = ({ service, onSave, onCancel, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    period: '',
    category: '',
    type: 'service',
    unit: '',
    details: [],
    deliverables: [],
    includedServices: {},
    media: { images: [], videos: [] }
  });

  const [newDetail, setNewDetail] = useState('');
  const [newDeliverable, setNewDeliverable] = useState('');
  const [includedServicesInput, setIncludedServicesInput] = useState('');
  const [selectedIncludedCategory, setSelectedIncludedCategory] = useState('general');
  const [errors, setErrors] = useState({});

  // 서비스 유형 옵션
  const serviceTypes = [
    { value: 'service', label: '일반 서비스' },
    { value: 'plan', label: '플랜' },
    { value: 'maintenance', label: '유지보수' },
    { value: 'addon', label: '추가 기능' },
    { value: 'hourly', label: '시간당 서비스' },
    { value: 'custom', label: '커스텀' },
    { value: 'social_login', label: '소셜 로그인' }
  ];

  // 포함 서비스 카테고리 (플랜용)
  const includedServiceCategories = [
    { value: 'general', label: '일반 설정' },
    { value: 'domain', label: '도메인 설정' },
    { value: 'policy', label: '정책 및 정보' },
    { value: 'product', label: '제품 관리' },
    { value: 'design', label: '디자인' },
    { value: 'marketing', label: '마케팅' }
  ];

  // 초기 데이터 설정
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        price: service.price || '',
        period: service.period || '',
        category: service.category || '',
        type: service.type || 'service',
        unit: service.unit || '',
        details: service.details || [],
        deliverables: service.deliverables || [],
        includedServices: service.includedServices || {},
        media: service.media || { images: [], videos: [] }
      });
    }
  }, [service]);

  // 입력 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // 상세 내용 추가
  const addDetail = () => {
    if (newDetail.trim()) {
      setFormData(prev => ({
        ...prev,
        details: [...prev.details, newDetail.trim()]
      }));
      setNewDetail('');
    }
  };

  // 상세 내용 제거
  const removeDetail = (index) => {
    setFormData(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  // 산출물 추가
  const addDeliverable = () => {
    if (newDeliverable.trim()) {
      setFormData(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, newDeliverable.trim()]
      }));
      setNewDeliverable('');
    }
  };

  // 산출물 제거
  const removeDeliverable = (index) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  // 포함 서비스 추가
  const addIncludedService = () => {
    if (includedServicesInput.trim()) {
      setFormData(prev => ({
        ...prev,
        includedServices: {
          ...prev.includedServices,
          [selectedIncludedCategory]: [
            ...(prev.includedServices[selectedIncludedCategory] || []),
            includedServicesInput.trim()
          ]
        }
      }));
      setIncludedServicesInput('');
    }
  };

  // 포함 서비스 제거
  const removeIncludedService = (category, index) => {
    setFormData(prev => ({
      ...prev,
      includedServices: {
        ...prev.includedServices,
        [category]: prev.includedServices[category].filter((_, i) => i !== index)
      }
    }));
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = '서비스명을 입력해주세요';
    if (!formData.description.trim()) newErrors.description = '설명을 입력해주세요';
    if (!formData.category.trim()) newErrors.category = '카테고리를 선택해주세요';
    if (!formData.price) newErrors.price = '가격을 입력해주세요';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장 핸들러
  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  // 백드롭 클릭 핸들러
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${designSystem.transitions.base}`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`${getModalStyles()} max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={`sticky top-0 ${designSystem.glass.strong} border-b border-white/20 p-6 flex justify-between items-center`}>
          <h2 className="text-xl font-bold text-gray-900">
            {service ? '서비스 편집' : '새 서비스 추가'}
          </h2>
          <button
            onClick={onCancel}
            className={`${designSystem.colors.neutral.textLight} hover:text-gray-800 p-2 hover:bg-gray-100 ${designSystem.radius.button} ${designSystem.transitions.fast}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className={`${designSystem.gradients.card} border ${designSystem.colors.neutral.border} ${designSystem.radius.card} p-6`}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    서비스명 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`${getInputStyles()} ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="서비스명을 입력하세요"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    서비스 유형 *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={getInputStyles()}
                  >
                    {serviceTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    list="categories"
                    className={`${getInputStyles()} ${errors.category ? 'border-red-500' : ''}`}
                    placeholder="카테고리를 입력하거나 선택하세요"
                  />
                  <datalist id="categories">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    가격 *
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`${getInputStyles()} ${errors.price ? 'border-red-500' : ''}`}
                    placeholder="숫자 또는 '협의'"
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    단위 (선택)
                  </label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className={getInputStyles()}
                    placeholder="월, 시간, 개 등"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    기간 (선택)
                  </label>
                  <input
                    type="text"
                    name="period"
                    value={formData.period}
                    onChange={handleInputChange}
                    className={getInputStyles()}
                    placeholder="1~2주, 협의 등"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  설명 *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className={`${getInputStyles()} ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="서비스에 대한 상세 설명을 입력하세요"
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
            </div>

            {/* 상세 내용 */}
            <div className={`${designSystem.gradients.card} border ${designSystem.colors.neutral.border} ${designSystem.radius.card} p-6`}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">상세 내용</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newDetail}
                  onChange={(e) => setNewDetail(e.target.value)}
                  className={`${getInputStyles()} flex-1`}
                  placeholder="상세 내용 추가..."
                  onKeyPress={(e) => e.key === 'Enter' && addDetail()}
                />
                <button
                  onClick={addDetail}
                  className={getButtonStyles('primary', 'md')}
                >
                  추가
                </button>
              </div>
              <div className="space-y-2">
                {formData.details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="flex-1 text-sm">{detail}</span>
                    <button
                      onClick={() => removeDetail(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 산출물 */}
            <div className={`${designSystem.gradients.card} border ${designSystem.colors.neutral.border} ${designSystem.radius.card} p-6`}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">산출물</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newDeliverable}
                  onChange={(e) => setNewDeliverable(e.target.value)}
                  className={`${getInputStyles()} flex-1`}
                  placeholder="산출물 추가..."
                  onKeyPress={(e) => e.key === 'Enter' && addDeliverable()}
                />
                <button
                  onClick={addDeliverable}
                  className={getButtonStyles('secondary', 'md')}
                >
                  추가
                </button>
              </div>
              <div className="space-y-2">
                {formData.deliverables.map((deliverable, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
                    <span className="flex-1 text-sm">{deliverable}</span>
                    <button
                      onClick={() => removeDeliverable(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 포함 서비스 (플랜 타입일 때만) */}
            {formData.type === 'plan' && (
              <div className={`${designSystem.gradients.card} border ${designSystem.colors.neutral.border} ${designSystem.radius.card} p-6`}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">포함 서비스 (플랜용)</h3>
                <div className="flex gap-2 mb-4">
                  <select
                    value={selectedIncludedCategory}
                    onChange={(e) => setSelectedIncludedCategory(e.target.value)}
                    className={getInputStyles()}
                  >
                    {includedServiceCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={includedServicesInput}
                    onChange={(e) => setIncludedServicesInput(e.target.value)}
                    className={`${getInputStyles()} flex-1`}
                    placeholder="포함 서비스 추가..."
                    onKeyPress={(e) => e.key === 'Enter' && addIncludedService()}
                  />
                  <button
                    onClick={addIncludedService}
                    className={getButtonStyles('outline', 'md')}
                  >
                    추가
                  </button>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(formData.includedServices).map(([category, services]) => (
                    services.length > 0 && (
                      <div key={category} className="p-4 bg-violet-50 rounded-lg">
                        <h4 className="font-semibold text-violet-800 mb-2">
                          {includedServiceCategories.find(c => c.value === category)?.label || category}
                        </h4>
                        <div className="space-y-2">
                          {services.map((service, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-white rounded">
                              <span className="flex-1 text-sm">{service}</span>
                              <button
                                onClick={() => removeIncludedService(category, index)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className={`sticky bottom-0 ${designSystem.glass.strong} border-t border-white/20 p-6 flex justify-end gap-3`}>
          <button
            onClick={onCancel}
            className={getButtonStyles('outline', 'md')}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className={getButtonStyles('primary', 'md')}
          >
            {service ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceEditor;