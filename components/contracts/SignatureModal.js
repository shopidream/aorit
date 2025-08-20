import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, Badge, Alert, PageHeader, LoadingSpinner } from '../ui/DesignSystem';
import { 
  X as XIcon, 
  Edit3 as PenIcon, 
  Upload as UploadIcon, 
  Image as ImageIcon, 
  Stamp as StampIcon, 
  User as UserIcon,
  Shield as ShieldIcon,
  ArrowRight as ArrowRightIcon,
  ArrowLeft as ArrowLeftIcon,
  Trash2 as EraseIcon
} from 'lucide-react';

export default function SignatureModal({ isOpen, onClose, onSign, userProfile, signerType }) {
  const [step, setStep] = useState(1); // 1: 서명방식선택, 2: 사업자번호입력
  const [signatureType, setSignatureType] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isOpen && step === 1) {
      setupCanvas();
    }
  }, [isOpen, step]);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 200;
    ctx.strokeStyle = '#1e40af'; // 네이비 블루
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    setupCanvas();
    setSignatureData('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('이미지 크기는 2MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const selectSignatureType = (type, data = '') => {
    setSignatureType(type);
    if (type === 'canvas') {
      const canvas = canvasRef.current;
      setSignatureData(canvas.toDataURL());
    } else if (type === 'upload') {
      setSignatureData(uploadedImage);
    } else {
      setSignatureData(data);
    }
    setStep(2);
  };

  const handleBusinessNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3) + '-' + value.slice(3);
    if (value.length > 6) value = value.slice(0, 6) + '-' + value.slice(6, 11);
    setBusinessNumber(value);
  };

  const handleSign = async () => {
    const cleanNumber = businessNumber.replace(/-/g, '');
    if (cleanNumber.length !== 10) {
      alert('사업자번호 10자리를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    try {
      await onSign({
        type: signatureType,
        data: signatureData,
        businessNumber: cleanNumber
      });
      handleClose();
    } catch (error) {
      console.error('서명 처리 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSignatureType('');
    setSignatureData('');
    setBusinessNumber('');
    setUploadedImage('');
    setLoading(false);
    clearCanvas();
    onClose();
  };

  if (!isOpen) return null;

  const getSignerTitle = () => {
    return signerType === 'client' ? '발주자 서명' : '수주자 서명';
  };

  const getSignerIcon = () => {
    return signerType === 'client' ? UserIcon : ShieldIcon;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between p-8 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              {React.createElement(getSignerIcon(), { size: 28, className: "text-blue-600" })}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{getSignerTitle()}</h2>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={step === 1 ? 'primary' : 'secondary'}>
                  1. 서명 방식 선택
                </Badge>
                <ArrowRightIcon size={16} className="text-gray-400" />
                <Badge variant={step === 2 ? 'primary' : 'secondary'}>
                  2. 본인 확인
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <XIcon size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <PageHeader 
                  title="서명 방식을 선택하세요"
                  description="아래 방법 중 하나를 선택해서 서명해 주세요"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 수주자만 - 저장된 사인 */}
                {signerType === 'freelancer' && userProfile?.signatureImage && (
                  <Card 
                    className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all duration-200 active:scale-[0.98]" 
                    onClick={() => selectSignatureType('signature', userProfile.signatureImage)}
                    hover={true}
                  >
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-emerald-100 rounded-xl">
                        <PenIcon size={32} className="text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">저장된 사인 사용</h3>
                        <p className="text-sm text-gray-600 mb-4">프로필에 저장된 사인을 사용합니다</p>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <img src={userProfile.signatureImage} alt="저장된 사인" className="h-12 object-contain" />
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* 수주자만 - 저장된 도장 */}
                {signerType === 'freelancer' && userProfile?.stampImage && (
                  <Card 
                    className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                    onClick={() => selectSignatureType('stamp', userProfile.stampImage)}
                    hover={true}
                  >
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-red-100 rounded-xl">
                        <StampIcon size={32} className="text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">저장된 도장 사용</h3>
                        <p className="text-sm text-gray-600 mb-4">프로필에 저장된 도장을 사용합니다</p>
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <img src={userProfile.stampImage} alt="저장된 도장" className="h-12 object-contain" />
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* 파일 업로드 */}
                <Card className="border-2 border-gray-200">
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-amber-100 rounded-xl">
                        <UploadIcon size={32} className="text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">이미지 업로드</h3>
                        <p className="text-sm text-gray-600 mb-4">서명 이미지를 업로드하세요 (2MB 이하)</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                      />
                      
                      {uploadedImage && (
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                            <img src={uploadedImage} alt="업로드된 이미지" className="h-16 object-contain mx-auto" />
                          </div>
                          <Button 
                            onClick={() => selectSignatureType('upload')}
                            variant="primary"
                            icon={ImageIcon}
                            className="w-full"
                          >
                            이 이미지 사용
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Canvas 서명 */}
                <Card className="border-2 border-gray-200 md:col-span-2">
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-purple-100 rounded-xl">
                        <PenIcon size={32} className="text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">직접 서명하기</h3>
                        <p className="text-sm text-gray-600">마우스나 터치로 직접 서명해 주세요</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="border-2 border-gray-300 rounded-xl bg-white overflow-hidden">
                        <canvas
                          ref={canvasRef}
                          className="w-full cursor-crosshair block"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseOut={stopDrawing}
                          onTouchStart={(e) => { e.preventDefault(); startDrawing(e.touches[0]); }}
                          onTouchMove={(e) => { e.preventDefault(); draw(e.touches[0]); }}
                          onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
                        />
                      </div>
                      
                      <div className="flex gap-4">
                        <Button 
                          variant="outline" 
                          onClick={clearCanvas}
                          icon={EraseIcon}
                          className="flex-1"
                        >
                          지우기
                        </Button>
                        <Button 
                          onClick={() => selectSignatureType('canvas')}
                          variant="primary"
                          icon={PenIcon}
                          className="flex-1"
                        >
                          이 서명 사용
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="flex justify-end pt-8 border-t">
                <Button variant="outline" onClick={handleClose} size="lg">
                  취소
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <PageHeader 
                  title="본인 확인"
                  description="사업자번호를 입력하여 본인 확인을 완료하세요"
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 선택한 서명 미리보기 */}
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">선택한 서명</h3>
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-8 flex items-center justify-center min-h-[120px]">
                    <img src={signatureData} alt="선택한 서명" className="max-h-20 object-contain" />
                  </div>
                </Card>

                {/* 사업자번호 입력 */}
                <Card>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-emerald-100 rounded-xl">
                        <ShieldIcon size={24} className="text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">본인 확인</h3>
                    </div>
                    
                    <Input
                      label="사업자번호"
                      type="text"
                      maxLength={12}
                      value={businessNumber}
                      onChange={handleBusinessNumberChange}
                      placeholder="123-12-12345"
                      className="text-center text-xl py-4 font-mono tracking-wider"
                      helpText="사업자번호 10자리를 입력해주세요"
                      required
                    />

                    <Alert type="info" title="안전한 인증">
                      입력하신 사업자번호는 본인 확인 용도로만 사용되며, 안전하게 암호화되어 처리됩니다.
                    </Alert>
                  </div>
                </Card>
              </div>

              <div className="flex justify-between pt-8 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  icon={ArrowLeftIcon}
                  size="lg"
                >
                  이전 단계
                </Button>
                
                <Button 
                  onClick={handleSign}
                  disabled={businessNumber.replace(/-/g, '').length !== 10 || loading}
                  variant="primary"
                  size="lg"
                  icon={loading ? LoadingSpinner : ShieldIcon}
                >
                  {loading ? '처리 중...' : '서명 완료'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}