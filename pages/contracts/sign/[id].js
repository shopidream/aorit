import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SignatureModal from '../../../components/contracts/SignatureModal';
import { Button, Alert, LoadingSpinner } from '../../../components/ui/DesignSystem';

export default function ClientSignPage() {
  const router = useRouter();
  const { id, token } = router.query;
  
  const [step, setStep] = useState('email'); // 'email' -> 'otp' -> 'contract'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [contractContent, setContractContent] = useState(null);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (id && token) {
      // 토큰이 있으면 이메일 입력 단계부터 시작
      setStep('email');
    } else {
      setError('유효하지 않은 서명 링크입니다.');
    }
  }, [id, token]);

  // 이메일 입력 후 OTP 발송
  const handleSendOtp = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contracts/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email })
      });

      const result = await response.json();

      if (response.ok) {
        setStep('otp');
        setOtpSent(true);
        // 개발용 OTP 표시
        if (result.developmentOtp) {
          alert(`개발용 OTP: ${result.developmentOtp}`);
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('OTP 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // OTP 검증
  const handleVerifyOtp = async () => {
    if (!otp) {
      setError('OTP를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/contracts/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, otp })
      });

      const result = await response.json();

      if (response.ok) {
        setContract(result.contract);
        
        // 계약서 내용 파싱
        try {
          if (result.contract.content) {
            const parsedContent = JSON.parse(result.contract.content);
            setContractContent(parsedContent);
          }
        } catch (parseError) {
          console.error('계약서 내용 파싱 오류:', parseError);
        }

        setStep('contract');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('OTP 검증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 서명 완료
  const handleSign = async (signatureInfo) => {
    try {
      const response = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerType: 'client',
          signatureData: signatureInfo.data,
          signatureType: signatureInfo.type,
          signerName: signatureInfo.name || contract.client?.name,
          signerEmail: email,
          token: token // 토큰 무효화용
        })
      });

      if (response.ok) {
        setShowSignatureModal(false);
        alert('서명이 완료되었습니다! 계약이 성사되었습니다.');
        // 서명 완료 후 계약서 새로고침
        const updatedContract = await response.json();
        setContract(updatedContract);
      } else {
        const data = await response.json();
        alert('서명 실패: ' + data.error);
      }
    } catch (error) {
      alert('서명 중 오류가 발생했습니다.');
    }
  };

  const hasSignature = (type) => {
    return contract?.signatures?.some(s => s.signerType === type);
  };

  const generateContractNumber = () => {
    if (!contract) return '';
    const year = new Date().getFullYear();
    const yearSuffix = String(year).slice(-2);
    return `CT${yearSuffix}${String(contract.id).padStart(4, '0')}`;
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
      provider: {}
    };
  };

  return (
      <div className="max-w-4xl mx-auto bg-white p-8">
        
        {/* 이메일 입력 단계 */}
        {step === 'email' && (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">갑(발주자) 서명 인증</h1>
            <div className="max-w-md mx-auto">
              <p className="text-gray-600 mb-6">
                계약서에 등록된 이메일 주소를 입력하여 본인 인증을 진행해주세요.
              </p>
              
              {error && (
                <Alert type="error" className="mb-4">{error}</Alert>
              )}
              
              <div className="mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소 입력"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              
              <Button 
                onClick={handleSendOtp}
                disabled={loading || !email}
                className="w-full"
              >
                {loading ? '발송 중...' : 'OTP 발송'}
              </Button>
              
              <p className="text-xs text-gray-500 mt-4">
                입력한 이메일로 6자리 인증번호가 발송됩니다 (5분 유효)
              </p>
            </div>
          </div>
        )}

        {/* OTP 입력 단계 */}
        {step === 'otp' && (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">OTP 인증</h1>
            <div className="max-w-md mx-auto">
              <p className="text-gray-600 mb-6">
                <strong>{email}</strong>으로 발송된 6자리 인증번호를 입력해주세요.
              </p>
              
              {error && (
                <Alert type="error" className="mb-4">{error}</Alert>
              )}
              
              <div className="mb-4">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6자리 인증번호"
                  className="w-full px-4 py-3 text-center text-2xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 tracking-widest"
                  disabled={loading}
                  maxLength={6}
                />
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => setStep('email')}
                  disabled={loading}
                  className="flex-1"
                >
                  이메일 재입력
                </Button>
                <Button 
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="flex-1"
                >
                  {loading ? '확인 중...' : '인증 확인'}
                </Button>
              </div>
              
              <Button 
                variant="outline"
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full mt-3 text-sm"
              >
                OTP 재발송
              </Button>
              
              <p className="text-xs text-gray-500 mt-4">
                OTP는 5분 후 만료됩니다. 받지 못하셨다면 재발송을 클릭하세요.
              </p>
            </div>
          </div>
        )}

        {/* 계약서 보기 및 서명 단계 */}
        {step === 'contract' && contract && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-green-600 mb-2">✓ 인증 완료</h1>
              <p className="text-gray-600">계약서를 확인하고 서명해주세요.</p>
            </div>

            <div className="bg-white border-2 border-gray-300 min-h-[297mm]">
              <div className="text-center py-12 border-b-2 border-gray-800">
                <h1 className="text-4xl font-bold mb-4">{contract.title}</h1>
                <p className="text-lg text-gray-600">Service Agreement</p>
                <div className="mt-4 text-sm text-gray-500">
                  계약번호: {generateContractNumber()}
                </div>
              </div>

              {/* 계약 당사자 정보 */}
              <div className="grid grid-cols-2 gap-16 p-12 border-b border-gray-300">
                <div>
                  <h3 className="text-xl font-bold mb-6 pb-2 border-b-2 border-gray-800">갑 (발주자)</h3>
                  <div className="space-y-3 text-lg">
                    <div><span className="font-semibold">성명:</span> {getContractData().client?.name || contract.client?.name}</div>
                    {(getContractData().client?.company || contract.client?.company) && (
                      <div><span className="font-semibold">회사명:</span> {getContractData().client?.company || contract.client?.company}</div>
                    )}
                    <div><span className="font-semibold">이메일:</span> {email}</div>
                    {(getContractData().client?.phone || contract.client?.phone) && (
                      <div><span className="font-semibold">연락처:</span> {getContractData().client?.phone || contract.client?.phone}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-6 pb-2 border-b-2 border-gray-800">을 (수행자)</h3>
                  <div className="space-y-3 text-lg">
                    <div><span className="font-semibold">성명:</span> {getContractData().provider?.name || '수행자'}</div>
                    <div><span className="font-semibold">이메일:</span> {getContractData().provider?.email || '이메일'}</div>
                    <div><span className="font-semibold">연락처:</span> {getContractData().provider?.phone || '연락처'}</div>
                  </div>
                </div>
              </div>

              {/* 계약 내용 */}
              <div className="px-12 py-8 border-b border-gray-300">
                <h3 className="text-xl font-bold mb-6">계약 내용</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid grid-cols-3 gap-8 text-center">
                    <div>
                      <div className="text-gray-600 mb-2">서비스명</div>
                      <div className="font-bold text-lg">{getContractData().serviceName}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-2">계약금액</div>
                      <div className="font-bold text-xl text-blue-600">{getContractData().amount?.toLocaleString()}원</div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-2">계약일자</div>
                      <div className="font-bold">{new Date(contract.createdAt).toLocaleDateString('ko-KR')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 계약 조항 */}
              <div className="px-12 py-8 border-b border-gray-300">
                <h3 className="text-xl font-bold mb-8">계약 조항</h3>
                <div className="space-y-8">
                  {getContractClauses()?.map((clause, index) => (
                    <div key={clause.id || index}>
                      <h4 className="text-lg font-bold mb-4 border-l-4 border-purple-500 pl-3">
                        제 {index + 1} 조 ({clause.title || '조항'})
                        {clause.essential && (
                          <span className="ml-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">필수</span>
                        )}
                      </h4>
                      <p className="text-lg leading-relaxed pl-8 whitespace-pre-line">{clause.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 서명란 */}
              <div className="px-12 py-12">
                <h3 className="text-xl font-bold mb-8 text-center">서명</h3>
                <div className="grid grid-cols-2 gap-16">
                  <div className="text-center">
                    <h4 className="text-lg font-bold mb-8">갑 (발주자)</h4>
                    {hasSignature('client') ? (
                      <div className="border-2 border-green-500 p-4 rounded bg-green-50">
                        <div className="text-green-600 text-2xl mb-3">✓ 서명 완료</div>
                        <div className="text-sm text-gray-600">
                          서명일: {new Date(contract.signatures?.find(s => s.signerType === 'client')?.signedAt).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-blue-300 border-dashed p-8 rounded bg-blue-50">
                        <div className="text-blue-600 text-xl mb-4">서명 대기중</div>
                        <Button 
                          onClick={() => setShowSignatureModal(true)} 
                          className="bg-blue-600 text-white"
                          size="lg"
                        >
                          서명하기
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <h4 className="text-lg font-bold mb-8">을 (수행자)</h4>
                    {hasSignature('freelancer') ? (
                      <div className="border-2 border-green-500 p-4 rounded bg-green-50">
                        <div className="text-green-600 text-2xl mb-3">✓ 서명 완료</div>
                        <div className="text-sm text-gray-600">
                          서명일: {new Date(contract.signatures?.find(s => s.signerType === 'freelancer')?.signedAt).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-gray-300 border-dashed p-8 rounded">
                        <div className="text-gray-400 text-xl mb-4">서명 대기중</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <SignatureModal
                isOpen={showSignatureModal}
                onClose={() => setShowSignatureModal(false)}
                onSign={handleSign}
                signerType="client"
              />

            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center mt-8">
            <LoadingSpinner />
          </div>
        )}
      </div>
  );
}