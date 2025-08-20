import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Textarea, 
  Card, 
  Alert, 
  Badge,
  Select
} from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import { formatPrice } from '../../lib/dataTypes';
import { 
  FileText as DocumentIcon, 
  User as UsersIcon, 
  DollarSign as TrendingUpIcon, 
  Calendar as ClockIcon, 
  MessageSquare as InfoIcon
} from 'lucide-react';

export default function QuoteForm({ onSuccess, initialData = null, isEditMode = false }) {
  const { getAuthHeaders } = useAuthContext();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 안전한 JSON 파싱
  const parseJSON = (jsonString, defaultValue = {}) => {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const quoteItems = parseJSON(initialData?.items, []);
  const metadata = parseJSON(initialData?.metadata, {});
  const pricing = metadata.pricing || {};
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    status: initialData?.status || 'pending',
    notes: initialData?.notes || '',
    discountType: pricing.discountSettings?.type || 'none',
    discountValue: pricing.discountSettings?.value || 0,
    discountReason: pricing.discountSettings?.reason || ''
  });

  // 편집 모드일 때 초기 데이터 설정
  useEffect(() => {
    if (isEditMode && initialData) {
      const items = parseJSON(initialData.items, []);
      const meta = parseJSON(initialData.metadata, {});
      const pricingData = meta.pricing || {};
      
      setFormData({
        title: initialData.title || '',
        status: initialData.status || 'pending',
        notes: initialData.notes || '',
        discountType: pricingData.discountSettings?.type || 'none',
        discountValue: pricingData.discountSettings?.value || 0,
        discountReason: pricingData.discountSettings?.reason || ''
      });
    }
  }, [isEditMode, initialData]);

  const calculateSubtotal = () => {
    return pricing.subtotal || quoteItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (formData.discountType === 'amount') {
      return formData.discountValue;
    } else if (formData.discountType === 'percent') {
      return subtotal * (formData.discountValue / 100);
    }
    return 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // 할인 유형 변경 시 할인 값 초기화
    if (name === 'discountType') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        discountValue: 0
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseFloat(value) || 0 : value 
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      setError('견적서 제목은 필수입니다.');
      return;
    }

    if (!isEditMode || !initialData?.id) {
      setError('편집 모드에서만 사용 가능합니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newDiscount = calculateDiscount();
      const newTotal = calculateTotal();
      
      const updatedMetadata = {
        ...metadata,
        pricing: {
          ...pricing,
          subtotal: calculateSubtotal(),
          discountAmount: newDiscount,
          total: newTotal,
          discountSettings: {
            type: formData.discountType,
            value: formData.discountValue,
            reason: formData.discountReason
          }
        }
      };

      const updatedData = {
        title: formData.title,
        status: formData.status,
        notes: formData.notes,
        amount: newTotal,
        metadata: JSON.stringify(updatedMetadata)
      };

      const response = await fetch(`/api/quotes/${initialData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess?.(data);
        
        // 편집 모드가 아닐 때만 폼 초기화 (현재는 편집만 지원)
        if (!isEditMode) {
          setFormData({
            title: '',
            status: 'pending',
            notes: '',
            discountType: 'none',
            discountValue: 0,
            discountReason: ''
          });
        }
      } else {
        setError(data.error || '저장 중 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('견적서 저장 오류:', error);
      setError('견적서 저장 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'sent': return '발송됨';
      case 'accepted': return '승인됨';
      case 'rejected': return '거절됨';
      default: return status;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* 왼쪽: 견적서 요약 */}
      <div className="bg-gray-50 p-8 rounded-2xl">
        <div className="space-y-8">
          
          {/* 견적서 기본 정보 */}
          <Card className="bg-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <DocumentIcon size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">견적서 #{initialData?.id}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ClockIcon size={16} />
                    {initialData?.createdAt && new Date(initialData.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                  <Badge variant={
                    formData.status === 'pending' ? 'warning' :
                    formData.status === 'sent' ? 'info' :
                    formData.status === 'accepted' ? 'success' :
                    formData.status === 'rejected' ? 'danger' : 'secondary'
                  }>
                    {getStatusLabel(formData.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* 고객 정보 */}
          {initialData?.client && (
            <Card className="bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <UsersIcon size={24} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">고객 정보</h3>
              </div>
              
              <div className="space-y-3">
                <div className="text-base font-semibold text-gray-900">{initialData.client.name}</div>
                {initialData.client.company && (
                  <div className="text-sm text-gray-600">{initialData.client.company}</div>
                )}
                <div className="text-sm text-gray-600">{initialData.client.email}</div>
                {initialData.client.phone && (
                  <div className="text-sm text-gray-600">{initialData.client.phone}</div>
                )}
              </div>
            </Card>
          )}

          {/* 견적 금액 */}
          <Card className="bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <TrendingUpIcon size={24} className="text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">견적 금액</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-base">
                <span className="text-gray-700">소계</span>
                <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
              </div>
              
              {calculateDiscount() > 0 && (
                <div className="flex justify-between items-center text-base text-red-600">
                  <span>할인</span>
                  <span className="font-semibold">-{formatPrice(calculateDiscount())}</span>
                </div>
              )}
              
              <div className="border-t-2 border-emerald-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">총액</span>
                  <span className="text-2xl font-bold text-emerald-700">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">부가세 별도</div>
              </div>
            </div>
          </Card>

          {/* 포함 서비스 */}
          {quoteItems.length > 0 && (
            <Card className="bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-6">포함 서비스</h3>
              <div className="space-y-4">
                {quoteItems.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-xl">
                    <div className="font-semibold text-gray-900 mb-2">{item.serviceName}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">수량: {item.quantity}</span>
                      <span className="font-semibold text-emerald-600">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 오른쪽: 편집 폼 */}
      <div className="space-y-6">
        {error && <Alert type="error">{error}</Alert>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
            <div className="space-y-4">
              <Input
                label="견적서 제목"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="견적서 제목을 입력하세요"
                required
              />

              <Select
                label="상태"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="pending">대기중</option>
                <option value="sent">발송됨</option>
                <option value="accepted">승인됨</option>
                <option value="rejected">거절됨</option>
              </Select>
            </div>
          </Card>

          {/* 할인 설정 */}
          <Card className="p-6 border-2 border-amber-200 bg-amber-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">할인 설정</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">할인 유형</label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 text-base border border-gray-200 bg-gray-50 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:outline-none transition-all duration-200 hover:border-gray-300"
                >
                  <option value="none">할인 없음</option>
                  <option value="amount">금액 할인</option>
                  <option value="percent">퍼센트 할인</option>
                </select>
              </div>
              
              {formData.discountType !== 'none' && (
                <>
                  <div className="relative">
                    <Input
                      label={`할인 ${formData.discountType === 'amount' ? '금액' : '비율'}`}
                      name="discountValue"
                      type="number"
                      value={formData.discountValue}
                      onChange={handleChange}
                      placeholder={formData.discountType === 'amount' ? '100000' : '10'}
                      className="pr-12"
                    />
                    <span className="absolute right-4 top-[2.75rem] transform -translate-y-1/2 text-gray-500 text-base font-medium pointer-events-none">
                      {formData.discountType === 'amount' ? '원' : '%'}
                    </span>
                  </div>
                  
                  <Input
                    label="할인 사유"
                    name="discountReason"
                    value={formData.discountReason}
                    onChange={handleChange}
                    placeholder="예: 신규고객 할인"
                  />
                </>
              )}
            </div>
          </Card>

          {/* 특이사항 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">특이사항</h3>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="견적서 관련 특이사항을 입력하세요"
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
              {loading ? '저장 중...' : '견적서 저장'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}