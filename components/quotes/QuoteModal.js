import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Textarea, 
  Card, 
  Badge, 
  Alert, 
  PageHeader, 
  LoadingSpinner,
  Select
} from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import ModalWrapper from '../catalog/ModalWrapper';
import { formatPrice } from '../../lib/dataTypes';
import { 
  FileText as DocumentIcon, 
  User as UsersIcon, 
  DollarSign as TrendingUpIcon, 
  Calendar as ClockIcon, 
  MessageSquare as InfoIcon,
  Edit,
  Trash2,
  Mail,
  Printer
} from 'lucide-react';

export default function QuoteModal({ quote, isEditMode: initialEditMode, userRole, isOpen, onClose, onQuoteSaved }) {
  const { getAuthHeaders } = useAuthContext();
  const canEdit = ['admin', 'user', 'freelancer'].includes(userRole);
  
  const [editMode, setEditMode] = useState(initialEditMode || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const parseJSON = (jsonString, defaultValue = {}) => {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const quoteItems = parseJSON(quote?.items, []);
  const metadata = parseJSON(quote?.metadata, {});
  const pricing = metadata.pricing || {};
  
  const [formData, setFormData] = useState(() => ({
    title: quote?.title || '',
    status: quote?.status || 'pending',
    notes: quote?.notes || '',
    discountType: pricing.discountSettings?.type || 'none',
    discountValue: pricing.discountSettings?.value || 0,
    discountReason: pricing.discountSettings?.reason || ''
  }));

  const calculateSubtotal = () => pricing.subtotal || quoteItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    return formData.discountType === 'amount' ? formData.discountValue :
           formData.discountType === 'percent' ? subtotal * (formData.discountValue / 100) : 0;
  };

  const calculateTotal = () => calculateSubtotal() - calculateDiscount();

  const handleEditToggle = () => {
    if (editMode) {
      setFormData({
        title: quote?.title || '',
        status: quote?.status || 'pending',
        notes: quote?.notes || '',
        discountType: pricing.discountSettings?.type || 'none',
        discountValue: pricing.discountSettings?.value || 0,
        discountReason: pricing.discountSettings?.reason || ''
      });
      setError('');
    }
    setEditMode(!editMode);
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

  const handleSave = async () => {
    if (!quote?.id) {
      setError('견적서 정보가 없습니다.');
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

      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        const updatedQuote = await response.json();
        onQuoteSaved?.(updatedQuote);
        setEditMode(false);
      } else {
        const data = await response.json();
        setError(data.error || '저장 중 오류가 발생했습니다');
      }
    } catch (error) {
      setError('견적서 저장 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 견적서를 삭제하시겠습니까?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        onQuoteSaved?.();
        alert('견적서가 삭제되었습니다.');
      } else {
        const data = await response.json();
        setError(data.error || '삭제 중 오류가 발생했습니다');
      }
    } catch (error) {
      setError('견적서 삭제 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { variant: 'warning', label: '대기중' },
      sent: { variant: 'info', label: '발송됨' },
      accepted: { variant: 'success', label: '승인됨' },
      rejected: { variant: 'danger', label: '거절됨' }
    };
    const config = configs[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const currentData = editMode ? formData : quote;

  const headerActions = canEdit && (
    <div className="flex items-center gap-3">
      {editMode ? (
        <>
          <Button variant="outline" size="sm" onClick={handleEditToggle} disabled={loading}>
            취소
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading} icon={loading ? LoadingSpinner : undefined}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" size="sm" onClick={handleEditToggle} icon={Edit}>
            편집
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={loading} icon={Trash2}>
            삭제
          </Button>
        </>
      )}
    </div>
  );

  return (
    <ModalWrapper 
      isOpen={isOpen}
      onClose={onClose}
      title={editMode ? '견적서 편집' : '견적서 상세보기'}
      error={error}
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] gap-8">
        
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
                  <h3 className="text-lg font-bold text-gray-900">견적서 #{quote?.id}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClockIcon size={16} />
                      {new Date(quote?.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                    {getStatusBadge(quote?.status)}
                  </div>
                </div>
              </div>
            </Card>

            {/* 고객 정보 */}
            {quote?.client && (
              <Card className="bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <UsersIcon size={24} className="text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">고객 정보</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="text-base font-semibold text-gray-900">{quote.client.name}</div>
                  {quote.client.company && (
                    <div className="text-sm text-gray-600">{quote.client.company}</div>
                  )}
                  <div className="text-sm text-gray-600">{quote.client.email}</div>
                  {quote.client.phone && (
                    <div className="text-sm text-gray-600">{quote.client.phone}</div>
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
                
                {(editMode ? calculateDiscount() : pricing.discountAmount || 0) > 0 && (
                  <div className="flex justify-between items-center text-base text-red-600">
                    <span>할인</span>
                    <span className="font-semibold">-{formatPrice(editMode ? calculateDiscount() : pricing.discountAmount || 0)}</span>
                  </div>
                )}
                
                <div className="border-t-2 border-emerald-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">총액</span>
                    <span className="text-2xl font-bold text-emerald-700">
                      {formatPrice(editMode ? calculateTotal() : quote?.amount)}
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

        {/* 오른쪽: 편집 폼 또는 상세 정보 */}
        <div className="p-8 flex flex-col">
          {editMode ? (
            <div className="space-y-8 flex-1">
              <div>
                <PageHeader 
                  title="견적서 편집"
                  description="견적서 정보를 수정하세요"
                />
              </div>

              <div className="space-y-6">
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

                <Card className="border-2 border-amber-200 bg-amber-50">
                  <h4 className="text-lg font-bold text-gray-900 mb-6">할인 설정</h4>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">할인 유형</label>
                      <select
                        name="discountType"
                        value={formData.discountType}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value, discountValue: 0 }))}
                        className="block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
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

                <Textarea
                  label="특이사항"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="견적서 관련 특이사항을 입력하세요"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-8">
                <div>
                  <PageHeader 
                    title="견적서 정보"
                    description="견적서 상세 내용을 확인하세요"
                  />
                </div>
                
                {currentData?.title && (
                  <Card className="bg-blue-50 border-2 border-blue-200">
                    <h4 className="text-base font-bold text-gray-900 mb-3">제목</h4>
                    <p className="text-lg text-gray-900">{currentData.title}</p>
                  </Card>
                )}

                {currentData?.notes && (
                  <Card>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <InfoIcon size={20} className="text-blue-600" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">특이사항</h4>
                    </div>
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {currentData.notes}
                      </p>
                    </div>
                  </Card>
                )}
              </div>

              {/* 액션 버튼들 */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/quotes/${quote?.id}`, '_blank')}
                    icon={Printer}
                    className="w-full"
                  >
                    인쇄용 보기
                  </Button>
                  {canEdit && (
                    <Button
                      variant="primary"
                      onClick={() => alert('이메일 발송 기능 준비 중입니다.')}
                      icon={Mail}
                      className="w-full"
                    >
                      이메일 발송
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}