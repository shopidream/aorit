// components/contracts/SignaturePanel.js
import React, { useState } from 'react';
import { Button, Input, Alert, Card } from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';

export default function SignaturePanel({ contract, onSignature }) {
  const { user, getAuthHeaders } = useAuthContext();
  const [signerName, setSignerName] = useState(user?.name || '');
  const [signerEmail, setSignerEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasFreelancerSigned = contract.signatures?.some(s => s.signerType === 'freelancer');
  const hasClientSigned = contract.signatures?.some(s => s.signerType === 'client');
  const isFreelancer = user?.role === 'freelancer' || user?.email === 'cs@shopidream.com';

  const handleSign = async () => {
    if (!signerName || !signerEmail) {
      setError('이름과 이메일을 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          signerType: isFreelancer ? 'freelancer' : 'client',
          signerName,
          signerEmail,
          signatureData: `${signerName}_${Date.now()}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        onSignature?.(data);
        
        // 서명 완료 후 상대방에게 알림 (실제로는 이메일 발송)
        if (!hasFreelancerSigned || !hasClientSigned) {
          console.log('상대방에게 서명 완료 알림 발송');
        }
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      setError('서명 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const canSign = () => {
    if (isFreelancer) {
      return !hasFreelancerSigned;
    } else {
      return !hasClientSigned;
    }
  };

  const getSignatureStatus = () => {
    if (hasFreelancerSigned && hasClientSigned) {
      return { 
        text: '✅ 양방 서명 완료 - 계약 확정!', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '🎉'
      };
    } else if (hasFreelancerSigned) {
      return { 
        text: '⏳ 수주자 서명 완료 - 발주자 서명 대기중', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '📝'
      };
    } else if (hasClientSigned) {
      return { 
        text: '⏳ 발주자 서명 완료 - 수주자 서명 대기중', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '📝'
      };
    } else {
      return { 
        text: '📋 서명 대기중', 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '⏰'
      };
    }
  };

  const status = getSignatureStatus();

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-center">✍️ 전자서명</h3>
      
      <div className={`p-4 rounded-lg mb-6 text-center border-2 ${status.color}`}>
        <div className="text-2xl mb-2">{status.icon}</div>
        <p className="font-medium">{status.text}</p>
      </div>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      {canSign() ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              <strong>서명 전 확인사항:</strong>
            </p>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• 계약 내용을 모두 확인했습니다</li>
              <li>• 프로젝트 범위와 금액에 동의합니다</li>
              <li>• 계약 조건을 이해하고 준수하겠습니다</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Input
              placeholder="서명자 이름"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              required
            />
            
            <Input
              type="email"
              placeholder="서명자 이메일"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              required
            />
          </div>
          
          <Button
            onClick={handleSign}
            disabled={loading || !signerName || !signerEmail}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3"
          >
            {loading ? '서명 중...' : '🖊️ 전자서명 하기'}
          </Button>
          
          <p className="text-xs text-gray-500 text-center">
            서명 시 법적 효력을 갖는 계약에 동의하는 것으로 간주됩니다
          </p>
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-gray-600 font-medium">서명을 완료했습니다</p>
          <p className="text-sm text-gray-500">
            {isFreelancer ? '발주자의 서명을 기다리고 있습니다' : '수주자의 서명을 기다리고 있습니다'}
          </p>
        </div>
      )}

      {/* 서명 이력 */}
      {contract.signatures?.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-3 text-center">📋 서명 이력</h4>
          <div className="space-y-3">
            {contract.signatures.map((signature) => (
              <div key={signature.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{signature.signerName}</p>
                  <p className="text-sm text-gray-600">
                    {signature.signerType === 'freelancer' ? '수주자' : '발주자'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(signature.signedAt).toLocaleDateString('ko-KR')}
                  </p>
                  <p className="text-xs text-green-600">✓ 서명완료</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}