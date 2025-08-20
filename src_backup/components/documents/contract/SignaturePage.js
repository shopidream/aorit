import React, { useState, useRef, useEffect } from 'react';
import { storage, validateSignature, formatDate } from '../../../utils.js';

const SignaturePage = ({ contractId, onSignatureComplete }) => {
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showContract, setShowContract] = useState(true);
  
  const canvasRef = useRef(null);

  // 계약서 로드
  useEffect(() => {
    if (contractId) {
      loadContract(contractId);
    } else {
      setError('계약서 ID가 없습니다.');
      setIsLoading(false);
    }
  }, [contractId]);

  // Canvas 설정
  useEffect(() => {
    if (contract) {
      setupCanvas();
    }
  }, [contract]);

  const loadContract = (id) => {
    try {
      const contractData = storage.load(`contract_${id}`);
      if (!contractData) {
        setError('계약서를 찾을 수 없습니다.');
        setIsLoading(false);
        return;
      }
      setContract(contractData);
      setIsLoading(false);
    } catch (err) {
      setError('계약서 로드 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setHasSignature(false);
  };

  const saveSignature = async () => {
    if (!hasSignature) {
      alert('서명을 먼저 해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL('image/png');
      
      if (!validateSignature(signatureData)) {
        throw new Error('올바르지 않은 서명 데이터입니다.');
      }

      const updatedContract = {
        ...contract,
        clientSignature: signatureData,
        clientSignedAt: new Date(),
        status: 'client_signed'
      };

      storage.save(`contract_${contractId}`, updatedContract);
      
      if (onSignatureComplete) {
        onSignatureComplete(updatedContract);
      }

      alert('서명이 완료되었습니다!');
      
    } catch (err) {
      alert(`서명 저장 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const printContract = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">계약서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">오류 발생</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b no-print">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">계약서 서명</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowContract(!showContract)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {showContract ? '계약서 접기' : '계약서 보기'}
              </button>
              <button
                onClick={printContract}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                인쇄
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* 계약서 내용 */}
        {showContract && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 contract-content">
            <div 
              className="whitespace-pre-line text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: contract.content.replace(/\n/g, '<br>') }}
            />
          </div>
        )}

        {/* 서명 섹션 */}
        <div className="bg-white rounded-lg shadow-lg p-6 signature-section">
          <h2 className="text-lg font-bold text-gray-800 mb-4">고객 서명</h2>
          
          {/* 고객 정보 확인 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">서명자 정보 확인</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">회사명:</span>
                <span className="ml-2 font-medium">{contract.formData.clientCompany}</span>
              </div>
              <div>
                <span className="text-gray-600">대표자:</span>
                <span className="ml-2 font-medium">{contract.formData.clientRepresentative}</span>
              </div>
              <div>
                <span className="text-gray-600">연락처:</span>
                <span className="ml-2">{contract.formData.clientPhone}</span>
              </div>
              <div>
                <span className="text-gray-600">이메일:</span>
                <span className="ml-2">{contract.formData.clientEmail}</span>
              </div>
            </div>
          </div>

          {/* 서명 동의 */}
          <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">⚠️ 서명 전 확인사항</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 계약서 내용을 충분히 검토하였습니다.</li>
              <li>• 계약 조건에 동의합니다.</li>
              <li>• 서명 후에는 계약이 체결됩니다.</li>
            </ul>
          </div>

          {/* 서명 패드 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              아래 박스에 서명해 주세요
            </label>
            <div className="border-2 border-gray-300 rounded-lg bg-white" style={{ width: '100%', height: '200px' }}>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startDrawing(e);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  draw(e);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopDrawing();
                }}
              />
            </div>
          </div>

          {/* 서명 액션 버튼 */}
          <div className="flex gap-4">
            <button
              onClick={clearSignature}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              다시 서명
            </button>
            <button
              onClick={saveSignature}
              disabled={!hasSignature || isSaving}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '저장 중...' : '서명 완료'}
            </button>
          </div>

          {/* 서명 일시 */}
          <div className="mt-4 text-center text-sm text-gray-500">
            서명 일시: {formatDate(new Date())}
          </div>
        </div>

        {/* 기존 서명 확인 */}
        {contract.clientSignature && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">✅ 서명 완료</h3>
            <p className="text-sm text-green-700">
              서명 완료일: {formatDate(new Date(contract.clientSignedAt))}
            </p>
            <div className="mt-2">
              <img 
                src={contract.clientSignature} 
                alt="고객 서명"
                className="border border-gray-300 rounded bg-white"
                style={{ maxWidth: '200px', maxHeight: '100px' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignaturePage;