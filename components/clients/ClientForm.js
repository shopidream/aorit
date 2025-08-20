// components/clients/ClientForm.js - 고객 등록/편집 폼 (편집 모드 지원)
import React, { useState, useEffect } from 'react';
import { Button, Input, Textarea, Card, Alert } from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  autoFormatPhone,
  formatBusinessNumber,
  formatWebsiteUrl,
  stripHttpsPrefix,
  validateKoreanPhone,
  validateBusinessNumber,
  validateEmail,
  getValidationMessage
} from '../../lib/koreanFormUtils';

export default function ClientForm({ onSuccess, initialData = null, isEditMode = false }) {
  const { getAuthHeaders } = useAuthContext();
  const [formData, setFormData] = useState({
    // 담당자 정보 (필수)
    name: '',
    phone: '',
    email: '',
    
    // 회사 정보
    company: '',
    businessNumber: '',
    companyAddress: '',
    companyPhone: '',
    websiteUrl: '',
    
    // 기타
    memo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // 편집 모드일 때 초기 데이터 설정
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        company: initialData.company || '',
        businessNumber: initialData.businessNumber || '',
        companyAddress: initialData.companyAddress || '',
        companyPhone: initialData.companyPhone || '',
        websiteUrl: initialData.websiteUrl || '',
        memo: initialData.memo || ''
      });
    }
  }, [isEditMode, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // 필수 필드 검증
    const newFieldErrors = {};
    
    if (!formData.name) {
      newFieldErrors.name = '담당자명은 필수입니다.';
    }
    
    if (!formData.phone) {
      newFieldErrors.phone = '담당자 전화번호는 필수입니다.';
    } else if (!validateKoreanPhone(formData.phone)) {
      newFieldErrors.phone = getValidationMessage('phone', formData.phone);
    }
    
    if (!formData.email) {
      newFieldErrors.email = '담당자 이메일은 필수입니다.';
    } else if (!validateEmail(formData.email)) {
      newFieldErrors.email = getValidationMessage('email', formData.email);
    }

    // 선택 필드 검증
    if (formData.companyPhone && !validateKoreanPhone(formData.companyPhone)) {
      newFieldErrors.companyPhone = getValidationMessage('phone', formData.companyPhone);
    }
    
    if (formData.businessNumber && !validateBusinessNumber(formData.businessNumber)) {
      newFieldErrors.businessNumber = getValidationMessage('businessNumber', formData.businessNumber);
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError('입력한 정보를 다시 확인해주세요.');
      setLoading(false);
      return;
    }

    try {
      // 최종 제출 시 웹사이트 URL 확인
      const submissionData = {
        ...formData,
        websiteUrl: formData.websiteUrl ? formatWebsiteUrl(formData.websiteUrl) : ''
      };

      // 편집 모드와 생성 모드에 따른 API 호출
      const url = isEditMode ? `/api/clients/${initialData.id}` : '/api/clients';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess?.(data);
        
        // 생성 모드일 때만 폼 초기화
        if (!isEditMode) {
          setFormData({
            name: '',
            phone: '',
            email: '',
            company: '',
            businessNumber: '',
            companyAddress: '',
            companyPhone: '',
            websiteUrl: '',
            memo: ''
          });
        }
        setFieldErrors({});
      } else {
        setError(data.error || `고객 ${isEditMode ? '수정' : '등록'}에 실패했습니다.`);
      }
    } catch (error) {
      setError(`고객 ${isEditMode ? '수정' : '등록'} 중 오류가 발생했습니다`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // 실시간 포맷팅
    switch (name) {
      case 'phone':
      case 'companyPhone':
        formattedValue = autoFormatPhone(value);
        break;
      case 'businessNumber':
        formattedValue = formatBusinessNumber(value);
        break;
      case 'websiteUrl':
        // 웹사이트 URL 실시간 포맷팅
        formattedValue = formatWebsiteUrl(value);
        break;
      default:
        formattedValue = value;
    }

    setFormData({ ...formData, [name]: formattedValue });

    // 실시간 검증 (에러 클리어)
    if (fieldErrors[name]) {
      const newFieldErrors = { ...fieldErrors };
      delete newFieldErrors[name];
      setFieldErrors(newFieldErrors);
    }
  };

  const handleWebsiteFocus = (e) => {
    // 웹사이트 필드에 포커스할 때 https:// 제거해서 편집하기 쉽게
    const value = e.target.value;
    if (value.startsWith('https://')) {
      const cleanValue = stripHttpsPrefix(value);
      setFormData({ ...formData, websiteUrl: cleanValue });
    }
  };

  const handleWebsiteBlur = (e) => {
    // 웹사이트 필드에서 포커스 아웃할 때 https:// 자동 추가
    const value = e.target.value;
    if (value && !value.startsWith('http')) {
      const formattedValue = formatWebsiteUrl(value);
      setFormData({ ...formData, websiteUrl: formattedValue });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // 포커스 아웃 시 검증
    if (value) {
      const errorMessage = getValidationMessage(name, value);
      if (errorMessage) {
        setFieldErrors(prev => ({ ...prev, [name]: errorMessage }));
      }
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert type="error">{error}</Alert>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 담당자 정보 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">담당자 정보</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="name"
                label="담당자명"
                placeholder="홍길동"
                value={formData.name}
                onChange={handleChange}
                required
                error={!!fieldErrors.name}
                helpText={fieldErrors.name}
              />
              
              <Input
                name="phone"
                label="담당자 전화번호"
                placeholder="010-0000-0000"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                error={!!fieldErrors.phone}
                helpText={fieldErrors.phone || "휴대폰: 010-0000-0000, 일반전화: 02-0000-0000, 인터넷전화: 0505-000-0000"}
              />
            </div>
            
            <Input
              name="email"
              type="email"
              label="담당자 이메일"
              placeholder="example@company.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              error={!!fieldErrors.email}
              helpText={fieldErrors.email}
            />
          </div>
        </Card>

        {/* 회사 정보 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">회사 정보</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="company"
                label="회사명"
                placeholder="주식회사 예시"
                value={formData.company}
                onChange={handleChange}
              />
              
              <Input
                name="businessNumber"
                label="사업자번호"
                placeholder="000-00-00000"
                value={formData.businessNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!fieldErrors.businessNumber}
                helpText={fieldErrors.businessNumber || "10자리 숫자 (자동으로 하이픈 추가)"}
              />
            </div>
            
            <Input
              name="companyAddress"
              label="회사주소"
              placeholder="서울특별시 강남구 테헤란로 123"
              value={formData.companyAddress}
              onChange={handleChange}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="companyPhone"
                label="회사 전화번호"
                placeholder="02-0000-0000"
                value={formData.companyPhone}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!fieldErrors.companyPhone}
                helpText={fieldErrors.companyPhone}
              />
              
              <Input
                name="websiteUrl"
                label="웹사이트 주소"
                placeholder="company.com"
                value={formData.websiteUrl}
                onChange={handleChange}
                onFocus={handleWebsiteFocus}
                onBlur={handleWebsiteBlur}
              />
            </div>
          </div>
        </Card>

        {/* 메모 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">메모</h3>
          <Textarea
            name="memo"
            label="추가 정보"
            placeholder="고객에 대한 추가 정보나 특이사항을 입력하세요..."
            value={formData.memo}
            onChange={handleChange}
            rows={4}
          />
        </Card>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={loading}
            size="lg"
            className="min-w-32"
          >
            {loading 
              ? `${isEditMode ? '수정' : '등록'} 중...` 
              : `고객 ${isEditMode ? '수정' : '등록'}`
            }
          </Button>
        </div>
      </form>
    </div>
  );
}