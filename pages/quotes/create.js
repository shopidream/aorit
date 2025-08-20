import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button, Card, Badge } from '../../components/ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';

export default function CreateQuote() {
  const router = useRouter();
  const { getAuthHeaders } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [clientData, setClientData] = useState(null);
  const [discountSettings, setDiscountSettings] = useState({ type: 'none', value: 0, reason: '' });
  const [quoteOptions, setQuoteOptions] = useState({
    paymentTerms: { 
      contract: 50, 
      progress: 0, 
      final: 50,
      contractTiming: 'contract',
      progressTiming: 'delivery',
      finalTiming: 'inspection'
    },
    deliveryDays: 30,
    inspectionDays: 7
  });

  useEffect(() => {
    if (!router.isReady) return;

    const { services, client } = router.query;
    
    if (!services || !client) {
      router.push('/services');
      return;
    }

    const serviceIds = services.split(',').map(id => {
      const parsed = parseInt(id);
      return isNaN(parsed) ? id : parsed;
    });
    const clientId = parseInt(client);
    
    const fetchData = async () => {
      try {
        const servicesResponse = await fetch('/api/services', {
          headers: getAuthHeaders()
        });
        
        if (!servicesResponse.ok) {
          throw new Error('서비스 데이터를 불러올 수 없습니다');
        }
        
        const allServices = await servicesResponse.json();
        const selectedServices = [];
        const missingServiceIds = [];
        
        serviceIds.forEach(serviceId => {
          const foundService = allServices.find(service => 
            service.id === serviceId || String(service.id) === String(serviceId)
          );
          
          if (foundService) {
            selectedServices.push(foundService);
          } else {
            missingServiceIds.push(serviceId);
          }
        });
        
        if (missingServiceIds.length > 0) {
          setError(`일부 서비스(ID: ${missingServiceIds.join(', ')})를 찾을 수 없어 제외되었습니다.`);
        }
        
        if (selectedServices.length === 0) {
          setError('선택된 서비스를 찾을 수 없습니다. 서비스 목록으로 돌아갑니다.');
          setTimeout(() => router.push('/services'), 3000);
          return;
        }
        
        const quoteItems = selectedServices.map(service => ({
          serviceId: service.id,
          service: service,
          quantity: 1,
          selectedOptions: [],
          totalPrice: service.price || 0
        }));
        
        setItems(quoteItems);

        const clientsResponse = await fetch('/api/clients', {
          headers: getAuthHeaders()
        });
        
        if (clientsResponse.ok) {
          const allClients = await clientsResponse.json();
          const selectedClient = allClients.find(c => c.id === clientId);
          
          if (selectedClient) {
            setClientData(selectedClient);
          } else {
            setError('선택된 고객을 찾을 수 없습니다.');
          }
        }
        
      } catch (error) {
        console.error('데이터 조회 오류:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };

    fetchData();
  }, [router.isReady, router.query, getAuthHeaders]);

  const updateItemQuantity = (serviceId, quantity) => {
    setItems(prev => quantity <= 0 
      ? prev.filter(item => item.serviceId !== serviceId)
      : prev.map(item => item.serviceId === serviceId ? { ...item, quantity } : item)
    );
  };

  const calculateSubtotal = () => items.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    return discountSettings.type === 'amount' ? discountSettings.value :
           discountSettings.type === 'percent' ? subtotal * (discountSettings.value / 100) : 0;
  };

  const handlePaymentTermsChange = (type, value) => {
    const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    
    setQuoteOptions(prev => {
      let newTerms = { ...prev.paymentTerms };
      
      if (type === 'contract') {
        newTerms.contract = numValue;
        const remaining = 100 - numValue;
        if (newTerms.progress > remaining) {
          newTerms.progress = remaining;
          newTerms.final = 0;
        } else {
          newTerms.final = remaining - newTerms.progress;
        }
      } else if (type === 'progress') {
        newTerms.progress = numValue;
        const remaining = 100 - numValue;
        if (newTerms.contract > remaining) {
          newTerms.contract = remaining;
          newTerms.final = 0;
        } else {
          newTerms.final = remaining - newTerms.contract;
        }
      } else if (type === 'final') {
        newTerms.final = numValue;
        const remaining = 100 - numValue;
        if (newTerms.contract > remaining) {
          newTerms.contract = remaining;
          newTerms.progress = 0;
        } else {
          newTerms.progress = remaining - newTerms.contract;
        }
      }
      
      return {
        ...prev,
        paymentTerms: newTerms
      };
    });
  };

  const handleSubmitQuote = async () => {
    setLoading(true);
    setError('');

    try {
      const { client } = router.query;
      const clientId = parseInt(client);
      
      const quoteData = {
        clientId: clientId,
        items: items.map(item => ({
          serviceId: item.serviceId,
          serviceName: item.service.title,
          serviceDescription: item.service.description || '',
          serviceFeatures: (() => {
            try {
              return item.service.features ? JSON.parse(item.service.features) : [];
            } catch (e) {
              return item.service.features || [];
            }
          })(),
          quantity: item.quantity,
          selectedOptions: item.selectedOptions || [],
          unitPrice: item.totalPrice,
          totalPrice: item.totalPrice * item.quantity
        })),
        pricing: {
          subtotal: calculateSubtotal(),
          discountAmount: calculateDiscount(),
          total: calculateSubtotal() - calculateDiscount(),
          discountSettings: discountSettings
        },
        options: quoteOptions
      };

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(quoteData)
      });

      if (response.ok) {
        const createdQuote = await response.json();
        router.push(`/quotes/${createdQuote.id}?created=true`);
      } else {
        const data = await response.json();
        setError(data.error || '견적 요청 실패');
      }
    } catch (error) {
      setError('견적 요청 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    const { client, services } = router.query;
    if (client && services) {
      router.push(`/services?from=clients&client=${client}`);
    } else {
      router.push('/services');
    }
  };

  const formatClientInfo = (client) => {
    const parts = [];
    if (client.company) parts.push(client.company);
    if (client.name) parts.push(client.name);
    if (client.phone) parts.push(client.phone);
    if (client.email) parts.push(client.email);
    return parts.join(' | ');
  };

  return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button 
            onClick={handleGoBack}
            className="text-gray-600 hover:text-gray-800 mb-4 flex items-center"
          >
            ← 뒤로 가기
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">견적서 생성</h1>
            {clientData && (
              <p className="text-lg text-gray-600 mt-2">
                고객: {formatClientInfo(clientData)}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">선택된 서비스</h2>
            
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                선택된 서비스가 없습니다
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.serviceId} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{item.service.title}</h3>
                        <Badge variant="secondary" className="mt-2">
                          {item.service.category?.name || '서비스'}
                        </Badge>
                        
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          {item.service.description && (
                            <p className="text-gray-700 mb-2">{item.service.description}</p>
                          )}
                          {item.service.features && (
                            <div className="mt-2">
                              {(() => {
                                try {
                                  let features = [];
                                  
                                  if (typeof item.service.features === 'string') {
                                    features = JSON.parse(item.service.features);
                                  } else if (Array.isArray(item.service.features)) {
                                    features = item.service.features;
                                  }
                                  
                                  if (!Array.isArray(features)) return null;
                                  
                                  const featureList = features.map(feature => {
                                    if (typeof feature === 'string') {
                                      return feature;
                                    } else if (typeof feature === 'object' && feature.title) {
                                      return feature.title;
                                    } else if (typeof feature === 'object' && feature.name) {
                                      return feature.name;
                                    }
                                    return String(feature);
                                  });
                                  
                                  const displayFeatures = featureList.slice(0, 3);
                                  const remainingCount = Math.max(0, featureList.length - 3);
                                  
                                  return (
                                    <div>
                                      {displayFeatures.map((feature, index) => (
                                        <div key={index} className="flex items-center text-gray-600 mb-1">
                                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                                          {feature}
                                        </div>
                                      ))}
                                      {remainingCount > 0 && (
                                        <div className="flex items-center text-gray-500 text-xs mt-1">
                                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                                          +{remainingCount}개 기능
                                        </div>
                                      )}
                                    </div>
                                  );
                                } catch (e) {
                                  return null;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateItemQuantity(item.serviceId, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(item.serviceId, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {(item.totalPrice * item.quantity).toLocaleString()}원
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.totalPrice.toLocaleString()}원 × {item.quantity}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => updateItemQuantity(item.serviceId, 0)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <Card className="p-6">
              <div className="space-y-6">
              <div>
                  {/* 데스크톱 레이아웃 */}
                  <div className="hidden md:block">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">계약금 (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={quoteOptions.paymentTerms.contract}
                          onChange={(e) => handlePaymentTermsChange('contract', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">중도금 (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={quoteOptions.paymentTerms.progress}
                          onChange={(e) => handlePaymentTermsChange('progress', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">잔금 (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={quoteOptions.paymentTerms.final}
                          onChange={(e) => handlePaymentTermsChange('final', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">계약금 지급일</label>
                        <select
                          value={quoteOptions.paymentTerms.contractTiming || 'contract'}
                          onChange={(e) => setQuoteOptions(prev => ({
                            ...prev,
                            paymentTerms: { ...prev.paymentTerms, contractTiming: e.target.value }
                          }))}
                          disabled={quoteOptions.paymentTerms.contract === 0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="contract">계약과 동시</option>
                          <option value="custom">사용자 지정</option>
                        </select>
                        {quoteOptions.paymentTerms.contractTiming === 'custom' && (
                          <input
                            type="text"
                            value={quoteOptions.paymentTerms.contractCustom || ''}
                            onChange={(e) => setQuoteOptions(prev => ({
                              ...prev,
                              paymentTerms: { ...prev.paymentTerms, contractCustom: e.target.value }
                            }))}
                            placeholder="지급 조건 입력"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">중도금 지급일</label>
                        <select
                          value={quoteOptions.paymentTerms.progressTiming || 'delivery'}
                          onChange={(e) => setQuoteOptions(prev => ({
                            ...prev,
                            paymentTerms: { ...prev.paymentTerms, progressTiming: e.target.value }
                          }))}
                          disabled={quoteOptions.paymentTerms.progress === 0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="delivery">중간 납품 시</option>
                          <option value="custom">사용자 지정</option>
                        </select>
                        {quoteOptions.paymentTerms.progressTiming === 'custom' && (
                          <input
                            type="text"
                            value={quoteOptions.paymentTerms.progressCustom || ''}
                            onChange={(e) => setQuoteOptions(prev => ({
                              ...prev,
                              paymentTerms: { ...prev.paymentTerms, progressCustom: e.target.value }
                            }))}
                            placeholder="지급 조건 입력"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">잔금 지급일</label>
                        <select
                          value={quoteOptions.paymentTerms.finalTiming || 'inspection'}
                          onChange={(e) => setQuoteOptions(prev => ({
                            ...prev,
                            paymentTerms: { ...prev.paymentTerms, finalTiming: e.target.value }
                          }))}
                          disabled={quoteOptions.paymentTerms.final === 0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="inspection">검수완료시</option>
                          <option value="custom">사용자 지정</option>
                        </select>
                        {quoteOptions.paymentTerms.finalTiming === 'custom' && (
                          <input
                            type="text"
                            value={quoteOptions.paymentTerms.finalCustom || ''}
                            onChange={(e) => setQuoteOptions(prev => ({
                              ...prev,
                              paymentTerms: { ...prev.paymentTerms, finalCustom: e.target.value }
                            }))}
                            placeholder="지급 조건 입력"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 모바일 레이아웃 */}
                  <div className="md:hidden space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">계약금 (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={quoteOptions.paymentTerms.contract}
                        onChange={(e) => handlePaymentTermsChange('contract', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">계약금 지급일</label>
                      <select
                        value={quoteOptions.paymentTerms.contractTiming || 'contract'}
                        onChange={(e) => setQuoteOptions(prev => ({
                          ...prev,
                          paymentTerms: { ...prev.paymentTerms, contractTiming: e.target.value }
                        }))}
                        disabled={quoteOptions.paymentTerms.contract === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="contract">계약과 동시</option>
                        <option value="custom">사용자 지정</option>
                      </select>
                      {quoteOptions.paymentTerms.contractTiming === 'custom' && (
                        <input
                          type="text"
                          value={quoteOptions.paymentTerms.contractCustom || ''}
                          onChange={(e) => setQuoteOptions(prev => ({
                            ...prev,
                            paymentTerms: { ...prev.paymentTerms, contractCustom: e.target.value }
                          }))}
                          placeholder="지급 조건 입력"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">중도금 (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={quoteOptions.paymentTerms.progress}
                        onChange={(e) => handlePaymentTermsChange('progress', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">중도금 지급일</label>
                      <select
                        value={quoteOptions.paymentTerms.progressTiming || 'delivery'}
                        onChange={(e) => setQuoteOptions(prev => ({
                          ...prev,
                          paymentTerms: { ...prev.paymentTerms, progressTiming: e.target.value }
                        }))}
                        disabled={quoteOptions.paymentTerms.progress === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="delivery">중간 납품 시</option>
                        <option value="custom">사용자 지정</option>
                      </select>
                      {quoteOptions.paymentTerms.progressTiming === 'custom' && (
                        <input
                          type="text"
                          value={quoteOptions.paymentTerms.progressCustom || ''}
                          onChange={(e) => setQuoteOptions(prev => ({
                            ...prev,
                            paymentTerms: { ...prev.paymentTerms, progressCustom: e.target.value }
                          }))}
                          placeholder="지급 조건 입력"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">잔금 (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={quoteOptions.paymentTerms.final}
                        onChange={(e) => handlePaymentTermsChange('final', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">잔금 지급일</label>
                      <select
                        value={quoteOptions.paymentTerms.finalTiming || 'inspection'}
                        onChange={(e) => setQuoteOptions(prev => ({
                          ...prev,
                          paymentTerms: { ...prev.paymentTerms, finalTiming: e.target.value }
                        }))}
                        disabled={quoteOptions.paymentTerms.final === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="inspection">검수완료시</option>
                        <option value="custom">사용자 지정</option>
                      </select>
                      {quoteOptions.paymentTerms.finalTiming === 'custom' && (
                        <input
                          type="text"
                          value={quoteOptions.paymentTerms.finalCustom || ''}
                          onChange={(e) => setQuoteOptions(prev => ({
                            ...prev,
                            paymentTerms: { ...prev.paymentTerms, finalCustom: e.target.value }
                          }))}
                          placeholder="지급 조건 입력"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">납품기한 (일)</label>
                      <input
                        type="number"
                        min="0"
                        value={quoteOptions.deliveryDays}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setQuoteOptions(prev => ({ ...prev, deliveryDays: isNaN(value) ? 0 : value }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">검수기간 (일)</label>
                      <input
                        type="number"
                        min="0"
                        value={quoteOptions.inspectionDays}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setQuoteOptions(prev => ({ ...prev, inspectionDays: isNaN(value) ? 0 : value }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">할인설정</label>
                      <select
                        value={discountSettings.type}
                        onChange={(e) => setDiscountSettings(prev => ({ ...prev, type: e.target.value, value: 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">할인 없음</option>
                        <option value="amount">금액 할인</option>
                        <option value="percent">퍼센트 할인</option>
                      </select>
                    </div>
                    
                    {discountSettings.type !== 'none' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            할인 {discountSettings.type === 'amount' ? '금액' : '비율'}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={discountSettings.value}
                              onChange={(e) => setDiscountSettings(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                              placeholder={discountSettings.type === 'amount' ? '100000' : '10'}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="absolute right-3 top-2 text-gray-500 text-sm">
                              {discountSettings.type === 'amount' ? '원' : '%'}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">할인 사유</label>
                          <input
                            type="text"
                            value={discountSettings.reason}
                            onChange={(e) => setDiscountSettings(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="예: 신규고객 할인"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-8">
                <div className="flex justify-between">
                  <span>소계</span>
                  <span className="font-medium">{calculateSubtotal().toLocaleString()}원</span>
                </div>
                
                {calculateDiscount() > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      할인
                      {discountSettings.reason && ` (${discountSettings.reason})`}
                    </span>
                    <span className="font-medium">-{Math.floor(calculateDiscount()).toLocaleString()}원</span>
                  </div>
                )}
                
                <div className="border-t pt-3 flex justify-between text-xl font-bold">
                  <span>총 견적 금액</span>
                  <span>{(calculateSubtotal() - calculateDiscount()).toLocaleString()}원 (부가세별도)</span>
                </div>
              </div>
            </Card>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitQuote}
              disabled={items.length === 0 || loading}
              size="lg"
              className="px-12"
            >
              {loading ? '견적서 생성 중...' : '견적서 생성하기'}
            </Button>
          </div>
        </div>
      </div>
  );
}