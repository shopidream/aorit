import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, X } from 'lucide-react';
import SignatureModal from '../../components/contracts/SignatureModal';
import TypographyEditor from '../../components/contracts/TypographyEditor';
import { Button, Badge, Input, Textarea, Alert, LoadingSpinner } from '../../components/ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';

export default function ContractDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { getAuthHeaders, isAuthenticated } = useAuthContext();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentSignerType, setCurrentSignerType] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [contractContent, setContractContent] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [typographyStyle, setTypographyStyle] = useState({
    titleFont: 'Noto Sans KR, sans-serif',
    contentFont: 'Noto Sans KR, sans-serif',
    titleSize: 16,
    contentSize: 14,
    lineHeight: 1.6
  });

  useEffect(() => {
    if (id && isAuthenticated) {
      fetchContract();
      fetchUserProfile();
    } else if (id && !isAuthenticated) {
      router.push('/login');
    }
  }, [id, isAuthenticated]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleTypographyChange = (newStyle) => {
    setTypographyStyle(newStyle);
  };

  const fetchContract = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contracts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContract(data);
        
        let parsedContent = null;
        try {
          if (data.content) {
            parsedContent = JSON.parse(data.content);
            setContractContent(parsedContent);
          }
        } catch (error) {
          console.error('계약서 내용 파싱 오류:', error);
        }

        setEditData({
          title: data.title || '',
          amount: parsedContent?.contractData?.amount || data.amount || 0,
          clauses: parsedContent?.clauses || data.clauses || [],
          contractDate: new Date(data.createdAt).toISOString().split('T')[0]
        });
      } else {
        if (response.status === 401) {
          setError('로그인이 필요합니다');
          router.push('/login');
        } else {
          setError('계약서를 찾을 수 없습니다');
        }
      }
    } catch (error) {
      console.error('계약서 조회 오류:', error);
      setError('계약서 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('프로필 조회 실패:', error);
    }
  };

  const freelancerSigned = contract?.signatures?.some(s => s.signerType === 'freelancer');
  const clientSigned = contract?.signatures?.some(s => s.signerType === 'client');
  const isContractSigned = linkGenerated || clientSigned;

  const generateSecureClientSignLink = async () => {
    if (!freelancerSigned) {
      showToast('을(수행자)이 먼저 서명해야 갑 서명 링크를 생성할 수 있습니다.', 'error');
      return null;
    }

    try {
      const response = await fetch(`/api/contracts/${contract.id}/generate-sign-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.ok) {
        const result = await response.json();
        setLinkGenerated(true);
        return result.signLink;
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('서명 링크 생성 오류:', error);
      showToast('링크 생성 실패: ' + error.message, 'error');
      return null;
    }
  };

  const handleEdit = () => {
    if (linkGenerated) {
      showToast('갑 서명링크 생성 후에는 계약서를 편집할 수 없습니다.', 'error');
      return;
    }
    if (clientSigned) {
      showToast('갑(발주자)이 서명한 후에는 계약서를 편집할 수 없습니다.', 'error');
      return;
    }
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        const updatedContract = await response.json();
        setContract(updatedContract);
        setEditMode(false);
        showToast('계약서가 성공적으로 저장되었습니다!', 'success');
      } else {
        const data = await response.json();
        showToast(`저장 실패: ${data.error}`, 'error');
      }
    } catch (error) {
      showToast('저장 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/contracts/${contract.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        showToast('계약서가 삭제되었습니다.', 'success');
        setShowDeleteConfirm(false);
        setTimeout(() => {
          router.push('/contracts');
        }, 1000);
      } else {
        const data = await response.json();
        showToast(`삭제 실패: ${data.error}`, 'error');
      }
    } catch (error) {
      showToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSign = async (signatureInfo) => {
    try {
      const response = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signerType: currentSignerType,
          signatureData: signatureInfo.data,
          signatureType: signatureInfo.type,
          verificationCode: signatureInfo.businessNumber
        })
      });

      if (response.ok) {
        const updatedContract = await response.json();
        setContract(updatedContract);
        showToast('서명이 완료되었습니다!', 'success');
      } else {
        const data = await response.json();
        showToast('서명 실패: ' + data.error, 'error');
      }
    } catch (error) {
      showToast('서명 중 오류가 발생했습니다.', 'error');
    }
  };

  const openSignatureModal = (signerType) => {
    setCurrentSignerType(signerType);
    setShowSignatureModal(true);
  };

  const generateContractNumber = () => {
    const year = new Date().getFullYear();
    const yearSuffix = String(year).slice(-2);
    return `CT${yearSuffix}${String(contract.id).padStart(4, '0')}`;
  };

  const hasSignature = (type) => {
    return contract.signatures?.some(s => s.signerType === type);
  };

  const getContractClauses = () => {
    if (contractContent?.clauses && Array.isArray(contractContent.clauses)) {
      return contractContent.clauses;
    }
    return contract?.clauses || [];
  };

  const getContractData = () => {
    if (contractContent?.contractData) {
      return contractContent.contractData;
    }
    return {
      serviceName: contract?.title || '서비스',
      amount: contract?.amount || 0,
      client: contract?.client || {},
      provider: userProfile || {}
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Alert type="error">{error}</Alert>
        <Button onClick={() => router.push('/contracts')} className="mt-4">
          계약 목록으로 돌아가기
        </Button>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold text-red-800 mb-4">계약서를 찾을 수 없습니다</h1>
        <Button onClick={() => router.push('/contracts')} variant="outline">
          계약 목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const clauses = getContractClauses();
  const contractData = getContractData();

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .contract-print-area,
          .contract-print-area * {
            visibility: visible;
          }
          .contract-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="max-w-5xl mx-auto bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 print-hidden gap-4">
          <Button variant="outline" onClick={() => router.push('/contracts')}>
            ← 계약 목록
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)} className="w-full sm:w-auto">취소</Button>
                <Button onClick={handleSave} className="w-full sm:w-auto">저장</Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleEdit}
                  disabled={isContractSigned}
                  className={`w-full sm:w-auto ${isContractSigned ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {linkGenerated ? '편집 불가 (링크 생성됨)' : clientSigned ? '편집 불가 (갑 서명 완료)' : '편집'}
                </Button>
                <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto">인쇄</Button>
                <Button onClick={async () => {
                  try {
                    const response = await fetch('/api/email/send-contract', {
                      method: 'POST',
                      headers: { 
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                      },
                      body: JSON.stringify({ contractId: contract.id })
                    });
                    
                    if (response.ok) {
                      showToast('계약서가 성공적으로 발송되었습니다!', 'success');
                    } else {
                      const data = await response.json();
                      showToast(`발송 실패: ${data.error}`, 'error');
                    }
                  } catch (error) {
                    showToast('발송 중 오류가 발생했습니다.', 'error');
                  }
                }} className="w-full sm:w-auto">발송</Button>
                <Button variant="error" onClick={() => setShowDeleteConfirm(true)} className="w-full sm:w-auto">삭제</Button>
              </>
            )}
          </div>
        </div>

        {editMode && (
          <div className="mb-6 print-hidden">
            <TypographyEditor 
              onStyleChange={handleTypographyChange}
              currentStyle={typographyStyle}
            />
          </div>
        )}

        <div 
          className="contract-print-area bg-white border-2 border-gray-300 min-h-[297mm] p-8"
          style={{
            '--contract-title-font': typographyStyle.titleFont,
            '--contract-content-font': typographyStyle.contentFont,
            '--contract-title-size': `${typographyStyle.titleSize}px`,
            '--contract-content-size': `${typographyStyle.contentSize}px`,
            '--contract-line-height': typographyStyle.lineHeight
          }}
        >
          <div className="text-center py-12 border-b-2 border-gray-800">
            <h1 className="text-4xl font-bold mb-4">{contract.title}</h1>
            <p className="text-lg text-gray-600">Service Agreement</p>
            <div className="mt-4 text-sm text-gray-500">
              계약번호: {generateContractNumber()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 py-12 border-b border-gray-300">
            <div>
              <h3 className="text-xl font-bold mb-6 pb-2 border-b-2 border-gray-800">갑 (발주자)</h3>
              <div className="space-y-3 text-lg">
                <div><span className="font-semibold">성명:</span> {contractData.client?.name || contract.client?.name}</div>
                {(contractData.client?.company || contract.client?.company) && (
                  <div><span className="font-semibold">회사명:</span> {contractData.client?.company || contract.client?.company}</div>
                )}
                <div><span className="font-semibold">이메일:</span> {contractData.client?.email || contract.client?.email}</div>
                {(contractData.client?.phone || contract.client?.phone) && (
                  <div><span className="font-semibold">연락처:</span> {contractData.client?.phone || contract.client?.phone}</div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 pb-2 border-b-2 border-gray-800">을 (수행자)</h3>
              <div className="space-y-3 text-lg">
                <div><span className="font-semibold">성명:</span> {contractData.provider?.name || userProfile?.companyName || userProfile?.contactName || '수행자'}</div>
                <div><span className="font-semibold">사업자등록번호:</span> {userProfile?.businessNumber || '사업자번호'}</div>
                <div><span className="font-semibold">이메일:</span> {contractData.provider?.email || userProfile?.companyEmail || userProfile?.contactEmail || '이메일'}</div>
                <div><span className="font-semibold">연락처:</span> {contractData.provider?.phone || userProfile?.companyPhone || userProfile?.contactPhone || '연락처'}</div>
                <div><span className="font-semibold">주소:</span> {userProfile?.companyAddress || '주소'}</div>
              </div>
            </div>
          </div>

          <div className="py-8 border-b border-gray-300">
            <h3 className="text-xl font-bold mb-6">계약 내용</h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-gray-600 mb-2">서비스명</div>
                  {editMode ? (
                    <Input value={editData.title} onChange={(e) => setEditData({...editData, title: e.target.value})} className="text-center" />
                  ) : (
                    <div className="font-bold text-lg">{contractData.serviceName}</div>
                  )}
                </div>
                <div>
                  <div className="text-gray-600 mb-2">계약금액</div>
                  {editMode ? (
                    <Input type="number" value={editData.amount} onChange={(e) => setEditData({...editData, amount: parseInt(e.target.value)})} className="text-center" />
                  ) : (
                    <div className="font-bold text-xl text-blue-600">{contractData.amount?.toLocaleString()}원</div>
                  )}
                </div>
                <div>
                  <div className="text-gray-600 mb-2">계약일자</div>
                  {editMode ? (
                    <Input type="date" value={editData.contractDate} onChange={(e) => setEditData({...editData, contractDate: e.target.value})} className="text-center" />
                  ) : (
                    <div className="font-bold">{new Date(contract.createdAt).toLocaleDateString('ko-KR')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="py-8 border-b border-gray-300">
            <h3 className="text-xl font-bold mb-8">계약 조항</h3>
            <div className="space-y-8">
              {(editMode ? editData.clauses : clauses)?.map((clause, index) => (
                <div key={clause.id || index}>
                  <h4 
                    className="font-bold mb-4 border-l-4 border-purple-500 pl-3"
                    style={{
                      fontFamily: `var(--contract-title-font)`,
                      fontSize: `var(--contract-title-size)`,
                      lineHeight: `var(--contract-line-height)`
                    }}
                  >
                    제 {index + 1} 조 ({clause.title || '조항'})
                    {clause.essential && (
                      <span className="ml-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">필수</span>
                    )}
                  </h4>
                  {editMode ? (
                    <Textarea 
                      value={clause.content} 
                      onChange={(e) => {
                        const newClauses = [...editData.clauses];
                        newClauses[index].content = e.target.value;
                        setEditData({...editData, clauses: newClauses});
                      }} 
                      rows={4} 
                      className="w-full p-4 border border-gray-300 rounded" 
                    />
                  ) : (
                    <p 
                      className="pl-8 whitespace-pre-line"
                      style={{
                        fontFamily: `var(--contract-content-font)`,
                        fontSize: `var(--contract-content-size)`,
                        lineHeight: `var(--contract-line-height)`
                      }}
                    >
                      {clause.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="py-12">
            <h3 className="text-xl font-bold mb-8 text-center">서명</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
              <div className="text-center">
                <h4 className="text-lg font-bold mb-8">갑 (발주자)</h4>
                {hasSignature('client') ? (
                  <div className="border-2 border-green-500 p-4 rounded bg-green-50">
                    {(() => {
                      const clientSignature = contract.signatures?.find(s => s.signerType === 'client');
                      const stampSize = userProfile?.stampSize || 60;
                      const signatureSize = clientSignature?.signatureType === 'stamp' ? stampSize : Math.round(stampSize * 1.8);
                      
                      return clientSignature?.signatureData ? (
                        <img 
                          src={clientSignature.signatureData} 
                          alt="발주자 서명" 
                          className="mx-auto object-contain mb-3"
                          style={{ 
                            width: clientSignature?.signatureType === 'stamp' 
                              ? `${stampSize}px` 
                              : `${signatureSize}px`,
                            height: clientSignature?.signatureType === 'stamp' 
                              ? `${stampSize}px` 
                              : `${Math.round(stampSize * 0.8)}px`,
                            maxWidth: '100%'
                          }}
                          onError={(e) => {
                            console.log('이미지 로드 실패:', clientSignature.signatureData);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-green-600 text-2xl mb-3">✓</div>
                      );
                    })()}
                    <div className="text-sm text-gray-600 text-center">
                      서명일: {new Date(contract.signatures?.find(s => s.signerType === 'client')?.signedAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-gray-300 border-dashed p-6 md:p-8 rounded">
                    <div className="text-gray-400 text-xl mb-4">서명란</div>
                    <div className="text-gray-500 text-sm mb-4">
                      <p>갑(발주자) 전용 링크로만 서명 가능</p>
                    </div>
                    {freelancerSigned ? (
                      linkGenerated ? (
                        <div className="text-center">
                          <div className="text-green-600 text-sm mb-2">✅ 서명 링크가 생성되었습니다</div>
                          <p className="text-xs text-gray-500">발주자에게 링크를 전달하세요</p>
                        </div>
                      ) : (
                        <Button 
                          onClick={async () => {
                            const link = await generateSecureClientSignLink();
                            if (link) {
                              navigator.clipboard.writeText(link);
                              showToast('갑(발주자) 보안 서명 링크가 복사되었습니다!\n• 24시간 후 만료\n• 이메일 인증 필요\n• 1회 사용 후 무효화', 'success');
                            }
                          }}
                          className="w-full"
                        >
                          보안 서명 링크 생성
                          <div className="text-xs opacity-90 mt-1">24시간 유효 • 1회용</div>
                        </Button>
                      )
                    ) : (
                      <div className="text-center">
                        <p className="text-xs text-gray-400 bg-gray-100 rounded px-3 py-2">
                          을 서명 완료 후 생성 가능
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <h4 className="text-lg font-bold mb-8">을 (수행자)</h4>
                {hasSignature('freelancer') ? (
                  <div className="border-2 border-green-500 p-4 rounded bg-green-50">
                    {(() => {
                      const freelancerSignature = contract.signatures?.find(s => s.signerType === 'freelancer');
                      const stampSize = userProfile?.stampSize || 60;
                      const signatureSize = freelancerSignature?.signatureType === 'stamp' ? stampSize : Math.round(stampSize * 1.8);
                      
                      return freelancerSignature?.signatureData ? (
                        <img 
                          src={freelancerSignature.signatureData} 
                          alt="수행자 서명" 
                          className="mx-auto object-contain mb-3"
                          style={{ 
                            width: freelancerSignature?.signatureType === 'stamp' 
                              ? `${stampSize}px` 
                              : `${signatureSize}px`,
                            height: freelancerSignature?.signatureType === 'stamp' 
                              ? `${stampSize}px` 
                              : `${Math.round(stampSize * 0.8)}px`,
                            maxWidth: '100%'
                          }}
                          onError={(e) => {
                            console.log('이미지 로드 실패:', freelancerSignature.signatureData);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-green-600 text-2xl mb-3">✓</div>
                      );
                    })()}
                    <div className="text-sm text-gray-600 text-center">
                      서명일: {new Date(contract.signatures?.find(s => s.signerType === 'freelancer')?.signedAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-gray-300 border-dashed p-8 rounded">
                    <div className="text-gray-400 text-xl mb-4">서명란</div>
                    <Button onClick={() => openSignatureModal('freelancer')} className="bg-blue-600 text-white print:hidden">
                      서명하기
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSign={handleSign}
          userProfile={currentSignerType === 'freelancer' ? userProfile : null}
          signerType={currentSignerType}
        />

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
              <div className="whitespace-pre-line">{toast.message}</div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">계약서 삭제</h3>
              <p className="text-gray-600 mb-6">이 계약서를 정말 삭제하시겠습니까?<br />삭제된 계약서는 복구할 수 없습니다.</p>
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
    </>
  );
}