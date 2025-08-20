import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, X } from 'lucide-react'; // 이 줄 추가

import { Button } from '../../components/ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';

export default function QuoteDetailPage() {
  const router = useRouter();
  const { id, created } = router.query;
  const { getAuthHeaders, isAuthenticated, loading } = useAuthContext();
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' }); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); 


  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchQuote();
      fetchUserProfile();
    }
  }, [id, isAuthenticated]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const profileData = await response.json();
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error('프로필 조회 실패:', error);
    }
  };

  // Toast 표시 함수 추가
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };
  

  // 사업자번호 포맷팅 함수
  const formatBusinessNumber = (number) => {
    if (!number) return '';
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length !== 10) return cleaned;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  };

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuote(data);
        setUser(data.user || { name: '업체명', email: 'contact@company.com' });
      } else {
        setError('견적서를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('견적서 조회 실패:', error);
      setError('견적서 조회 중 오류가 발생했습니다.');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await fetch('/api/email/send-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ quoteId: quote.id })
      });

      if (response.ok) {
        showToast('견적서가 성공적으로 발송되었습니다!', 'success');
        fetchQuote();
      } else {
        const data = await response.json();
        showToast(`발송 실패: ${data.error}`, 'error');
      }
    } catch (error) {
      showToast('발송 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
  
      if (response.ok) {
        showToast('견적서가 삭제되었습니다.', 'success');
        setShowDeleteConfirm(false); // 모달 닫기
        setTimeout(() => {
          router.push('/quotes');
        }, 1000);
      } else {
        const data = await response.json();
        showToast(`삭제 실패: ${data.error}`, 'error');
      }
    } catch (error) {
      showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  if (loading || quoteLoading) {
    return (

        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">견적서를 불러오는 중...</p>
          </div>
        </div>

    );
  }

  if (!isAuthenticated) return null;

  if (error || !quote) {
    return (

        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h1 className="text-2xl font-bold text-red-800 mb-4">견적서를 찾을 수 없습니다</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/quotes')} variant="outline">
              견적 목록으로 돌아가기
            </Button>
          </div>
        </div>

    );
  }

  const parseJSON = (jsonString, defaultValue = []) => {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (e) {
      console.error('JSON 파싱 오류:', e);
      return defaultValue;
    }
  };

  const quoteItems = parseJSON(quote.items, []);
  const metadata = parseJSON(quote.metadata, {});
  const quoteOptions = metadata.options || {};

  const formatCurrency = (amount) => amount ? amount.toLocaleString() : '0';
  const getTotalAmount = () => quoteItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  
  const calculateDiscount = () => {
    const pricing = metadata.pricing || {};
    return pricing.discountAmount || 0;
  };
  
  const getSubtotal = () => {
    const pricing = metadata.pricing || {};
    return pricing.subtotal || getTotalAmount();
  };

  const formatPaymentTerms = () => {
    try {
      const metadata = typeof quote.metadata === 'string' ? JSON.parse(quote.metadata) : quote.metadata;
      const paymentTerms = metadata?.paymentTerms;
      
      if (paymentTerms?.type === 'installment' && paymentTerms?.schedule) {
        const validPayments = paymentTerms.schedule.filter(p => p.percentage > 0);
        
        if (validPayments.length === 1) {
          return '일시불';
        }
        
        const terms = validPayments
          .sort((a, b) => a.order - b.order)
          .map((payment, index) => {
            if (index === 0) return `계약금 ${payment.percentage}%`;
            if (index === validPayments.length - 1) return `잔금 ${payment.percentage}%`;
            return `중도금 ${payment.percentage}%`;
          });
        
        return terms.join(', ');
      }
      
      // 백업: 기존 quoteOptions에서 읽기
      const options = quoteOptions;
      const terms = [];
      
      if (options?.contractPercentage > 0) {
        terms.push(`계약금 ${options.contractPercentage}%`);
      }
      if (options?.progressPercentage > 0) {
        terms.push(`중도금 ${options.progressPercentage}%`);
      }
      if (options?.finalPercentage > 0) {
        terms.push(`잔금 ${options.finalPercentage}%`);
      }
      
      return terms.length > 0 ? terms.join(', ') : '일시불';
    } catch (error) {
      console.error('지불조건 파싱 오류:', error);
      return '일시불';
    }
  };
  const formatDeadlines = () => {
    const deliveryText = quoteOptions.deliveryDays > 0 ? `납기 ${quoteOptions.deliveryDays}일` : '즉시납품';
    const inspectionText = quoteOptions.inspectionDays > 0 ? `검수 ${quoteOptions.inspectionDays}일` : '즉시검수';
    return `${deliveryText} / ${inspectionText}`;
  };

  return (
    <div className="max-w-5xl mx-auto bg-white">
      <style jsx global>{`
        @media print {
          /* 모든 요소 숨김 */
          body * {
            visibility: hidden !important;
          }
          
          /* 견적서만 표시 */
          .print-section, .print-section * {
            visibility: visible !important;
          }
          
          /* 견적서를 페이지 전체에 배치 */
          .print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          
          /* 헤더, 사이드바, 네비게이션 완전 숨김 */
          header, nav, .sidebar, .header, .navigation {
            display: none !important;
            visibility: hidden !important;
          }
          
          
          /* Float 문제 해결을 위한 CSS Grid 적용 */
          .supplier-info-container {
            display: grid !important;
            grid-template-columns: 350px 450px !important;
            gap: 10px !important;
            margin-bottom: 18px !important;
          }
          
          .supplier-left, .supplier-right {
            float: none !important;
            width: auto !important;
            padding: 0 2px !important;
          }
          
          /* 테이블 강제 스타일 */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          
          /* clearfix 비활성화 */
          .clearfix {
            display: none !important;
          }
        }
        
        /* 기본 화면용 스타일 */
        .supplier-info-container {
          display: block;
          margin-bottom: 18px;
        }
        
        .supplier-left {
          float: left;
          width: 350px;
          padding: 0 2px;
        }
        
        .supplier-right {
          float: right;
          width: 450px;
          padding: 0 2px;
        }
        
        .clearfix {
          clear: both;
        }
      `}</style>
      
      <div className="max-w-5xl mx-auto bg-white">
        {/* 생성 완료 메시지 */}
        {created === 'true' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg print:hidden">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  견적서가 성공적으로 생성되었습니다. 총 {formatCurrency(quote.amount)}원의 견적서입니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-between items-center mb-8 print:hidden">
          <Button variant="outline" onClick={() => router.push('/quotes')}>← 견적 목록</Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.print()}>인쇄</Button>
            <Button variant="outline" onClick={handleSendEmail}>발송</Button>
            <Button variant="error" onClick={() => setShowDeleteConfirm(true)}>삭제</Button>
          </div>
        </div>

        {/* 견적서 본문 */}
        <div className="print-section" style={{ width: '810px', margin: '0 auto', padding: '23px 0' }}>
          {/* 헤더 */}
          <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#343434', margin: '0' }}>
              견적서
            </h1>
            {userProfile?.logo && (
              <div style={{ position: 'absolute', top: '0', right: '0' }}>
                <img src={userProfile.logo} style={{ maxHeight: '50px' }} alt="로고" />
              </div>
            )}
          </div>

          <div>
            {/* 공급받는사람과 공급자 정보 - 수정된 레이아웃 */}
            <div className="supplier-info-container">
              {/* 공급받으시는 분 */}
              <div className="supplier-left">
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  borderSpacing: '0', 
                  textAlign: 'left', 
                  border: '1px solid #edeeef', 
                  borderTop: '2px solid #474747' 
                }}>
                  <colgroup>
                    <col width="90px" />
                    <col width="" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th colSpan="2" style={{ 
                        padding: '8px 5px', 
                        fontSize: '15px', 
                        fontWeight: '500', 
                        color: '#000', 
                        borderBottom: '1px solid #edeeef', 
                        textAlign: 'left' 
                      }}>
                        공급 받으시는 분
                      </th>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        견적일
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef' 
                      }}>
                        {new Date(quote.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        상호/담당자
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef' 
                      }}>
                        {quote.client?.company ? `${quote.client.company} ` : ''}{quote.client?.name}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        견적금액
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef' 
                      }}>
                        <span style={{ color: '#222', fontSize: '18px', fontWeight: '700', letterSpacing: '-1px' }}>
                          {formatCurrency(quote.amount)}
                        </span>원
                        <span style={{ color: '#e71f19' }}>(부가세 별도)</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        결제조건
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef' 
                      }}>
                        {formatPaymentTerms()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        납기/검수
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef' 
                      }}>
                        {formatDeadlines()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 공급자 */}
               <div className="supplier-right">
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  borderSpacing: '0', 
                  textAlign: 'left', 
                  border: '1px solid #edeeef', 
                  borderTop: '2px solid #474747' 
                }}>
                  <colgroup>
                    <col width="80px" />
                    <col width="130px" />
                    <col width="50px" />
                    <col width="140px" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th colSpan="4" style={{ 
                        padding: '8px 5px', 
                        fontSize: '15px', 
                        fontWeight: '500', 
                        color: '#000', 
                        borderBottom: '1px solid #edeeef', 
                        textAlign: 'left' 
                      }}>
                        공급자
                      </th>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        사업자번호
                      </td>
                      <td colSpan="3" style={{ 
                        position: 'relative',
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef' 
                      }}>
                        {formatBusinessNumber(userProfile?.businessNumber) || ''}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        상호
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef' 
                      }}>
                        {userProfile?.companyName || userProfile?.name || user?.name || ''}
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        대표
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        verticalAlign: 'middle',
                        position: 'relative'
                      }}>
                        <span>{userProfile?.ceoName || userProfile?.contactName || userProfile?.name || user?.name || ''}</span>
                        {userProfile?.stampImage ? (
                          <img 
                            src={userProfile.stampImage} 
                            style={{ 
                              width: '60px', 
                              height: '60px', 
                              objectFit: 'contain',
                              position: 'absolute',
                              right: '5px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              zIndex: 10
                            }} 
                            alt="도장" 
                          />
                        ) : (
                          <span style={{ marginLeft: '10px', fontSize: '11px', color: '#999' }}>(인)</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        주소
                      </td>
                      <td colSpan="3" style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef' 
                      }}>
                        {userProfile?.companyAddress || ''}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        업태
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef' 
                      }}>
                        {userProfile?.businessType || '서비스업'}
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        종목
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef' 
                      }}>
                        {userProfile?.businessItem || 'IT서비스'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        대표전화
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef' 
                      }}>
                        {userProfile?.companyPhone || userProfile?.contactPhone || ''}
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef',
                        background: 'linear-gradient(to right, transparent 90%, #ddd 95%)'
                      }}>
                        FAX
                      </td>
                      <td style={{ 
                        padding: '5px 10px', 
                        color: '#737373', 
                        fontSize: '13px', 
                        textAlign: 'left', 
                        borderBottom: '1px solid #edeeef' 
                      }}>
                        {userProfile?.companyFax || ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
                </div>
            </div>
            <div className="clearfix"></div>

            <div style={{ clear: 'both' }}>
              <div>
                {/* 상품 목록 테이블 */}
                <table style={{ 
                  borderCollapse: 'collapse', 
                  borderSpacing: '0', 
                  textAlign: 'left', 
                  borderTop: '2px solid #474747',
                  width: '100%'
                }}>
                  <colgroup>
                    <col width="50px" />
                    <col width="100px" />
                    <col width="" />
                    <col width="130px" />
                    <col width="50px" />
                    <col width="130px" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ 
                        color: '#6b6b6b', 
                        textAlign: 'center', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        padding: '15px 0', 
                        borderBottom: '1px solid #bebebe' 
                      }}>
                        번호
                      </th>
                      <th style={{ 
                        color: '#6b6b6b', 
                        textAlign: 'center', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        padding: '15px 0', 
                        borderBottom: '1px solid #bebebe' 
                      }}>
                        분류
                      </th>
                      <th style={{ 
                        color: '#6b6b6b', 
                        textAlign: 'center', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        padding: '15px 0', 
                        borderBottom: '1px solid #bebebe' 
                      }}>
                        제품명
                      </th>
                      <th style={{ 
                        color: '#6b6b6b', 
                        textAlign: 'center', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        padding: '15px 0', 
                        borderBottom: '1px solid #bebebe' 
                      }}>
                        판매가
                      </th>
                      <th style={{ 
                        color: '#6b6b6b', 
                        textAlign: 'center', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        padding: '15px 0', 
                        borderBottom: '1px solid #bebebe' 
                      }}>
                        수량
                      </th>
                      <th style={{ 
                        color: '#6b6b6b', 
                        textAlign: 'center', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        padding: '15px 0', 
                        borderBottom: '1px solid #bebebe' 
                      }}>
                        합계
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteItems.map((item, index) => (
                      <tr key={index}>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '13px', 
                          borderBottom: '1px solid #edeeef', 
                          textAlign: 'center' 
                        }}>
                          {index + 1}
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '13px', 
                          borderBottom: '1px solid #edeeef', 
                          textAlign: 'center' 
                        }}>
                          서비스
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '13px', 
                          borderBottom: '1px solid #edeeef', 
                          textAlign: 'left' 
                        }}>
                          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>
                            {item.serviceName}
                          </div>
                          {item.serviceDescription && (
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '3px', lineHeight: '1.4' }}>
                              * {item.serviceDescription}
                            </div>
                          )}
                          {item.serviceFeatures && item.serviceFeatures.length > 0 && (
                            <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.3' }}>
                              {item.serviceFeatures.map((feature, fIndex) => (
                                <div key={fIndex} style={{ marginBottom: '1px' }}>
                                  • {typeof feature === 'string' ? feature : feature.title || feature.name || feature}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '13px', 
                          borderBottom: '1px solid #edeeef', 
                          textAlign: 'center' 
                        }}>
                          {formatCurrency(item.unitPrice)}원
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '13px', 
                          borderBottom: '1px solid #edeeef', 
                          textAlign: 'center' 
                        }}>
                          {item.quantity}
                        </td>
                        <td style={{ 
                          padding: '12px 10px', 
                          fontSize: '13px', 
                          borderBottom: '1px solid #edeeef', 
                          textAlign: 'center' 
                        }}>
                          {formatCurrency(item.totalPrice)}원
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 총 주문 금액 */}
                <div style={{ textAlign: 'right', margin: '18px 0', color: '#222' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ marginRight: '34px', fontSize: '13px', color: '#666' }}>소계</span>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>
                      {formatCurrency(getSubtotal())}원
                    </span>
                  </div>
                  
                  {calculateDiscount() > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ marginRight: '34px', fontSize: '13px', color: '#e71f19' }}>
                        할인금액
                        {(() => {
                          const pricing = metadata.pricing || {};
                          const discountSettings = pricing.discountSettings || {};
                          if (discountSettings.reason) {
                            return ` (${discountSettings.reason})`;
                          }
                          return '';
                        })()}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: '500', color: '#e71f19' }}>
                        -{formatCurrency(calculateDiscount())}원
                      </span>
                    </div>
                  )}
                  
                  <div style={{ borderTop: '1px solid #ddd', paddingTop: '8px' }}>
                    <span style={{ marginRight: '34px', fontSize: '14px', fontWeight: '500' }}>총 주문 금액</span>
                    <span style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-1px' }}>
                      {formatCurrency(quote.amount)}원
                    </span>
                  </div>
                </div>

                <ul style={{ padding: '0', margin: '20px 0', listStyle: 'none', fontSize: '12px', color: '#666' }}>
                  <li>* 상기 견적서는 부가가치세 별도입니다.</li>
                  <li>* 견적서 유효기간: {quoteOptions.validityDays || 30}일</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

{/* Toast 알림 추가 */}
{toast.show && (
       <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
         toast.type === 'success' 
           ? 'bg-green-500 text-white' 
           : 'bg-red-500 text-white'
       }`}>
         <div className="flex items-center">
           {toast.type === 'success' ? (
             <CheckCircle className="w-5 h-5 mr-2" />
           ) : (
             <X className="w-5 h-5 mr-2" />
           )}
           {toast.message}
         </div>
       </div>
     )}

     {/* 삭제 확인 모달 */}
     {showDeleteConfirm && (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
         <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
           <h3 className="text-lg font-bold text-gray-900 mb-4">견적서 삭제</h3>
           <p className="text-gray-600 mb-6">이 견적서를 정말 삭제하시겠습니까?<br />삭제된 견적서는 복구할 수 없습니다.</p>
           <div className="flex gap-3 justify-end">
             <button
               onClick={() => setShowDeleteConfirm(false)}
               className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
             >
               취소
             </button>
             <button
               onClick={handleDelete}
               className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
             >
               삭제
             </button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
}