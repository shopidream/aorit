import React, { useState } from 'react';
import { 
  Button, 
  Textarea, 
  Card, 
  Alert, 
  PageHeader, 
  LoadingSpinner,
  SparklesIcon as Sparkles,
  SearchIcon as Search,
  XIcon as X,
  InfoIcon as Info 
} from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';

export default function AIServiceModal({ isOpen, onClose, onServicesGenerated }) {
  const { getAuthHeaders } = useAuthContext();
  const [businessDescription, setBusinessDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!businessDescription.trim()) {
      setError('업무 설명을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          businessDescription
        })
      });

      if (response.ok) {
        const result = await response.json();
        onServicesGenerated(result);
        handleClose();
      } else {
        const data = await response.json();
        setError(data.error || 'AI 분석에 실패했습니다');
      }
    } catch (error) {
      setError('AI 분석 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setBusinessDescription('');
    setError('');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl" padding="none">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between p-8 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Sparkles size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">AI 서비스 등록</h2>
              <p className="text-lg text-gray-600 mt-1">인공지능이 맞춤 서비스를 생성해드립니다</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={loading}
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* 에러 메시지 */}
          {error && (
            <Alert type="error" title="오류 발생">
              {error}
            </Alert>
          )}

          {/* 안내 섹션 */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">어떤 일을 하시나요?</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  친구에게 말하듯 자세히 적어주시면, 알맞는 서비스를 생성해드립니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <div className="font-semibold text-blue-700 mb-1">청소 서비스 예시</div>
                    <div className="text-gray-600">신축 아파트 입주청소를 해요. 화장실, 주방, 거실을 깔끔하게...</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <div className="font-semibold text-blue-700 mb-1">과외 서비스 예시</div>
                    <div className="text-gray-600">중학생 수학 과외를 해요. 1:1로 개인 맞춤 지도하고...</div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <div className="font-semibold text-blue-700 mb-1">디자인 서비스 예시</div>
                    <div className="text-gray-600">작은 카페 로고 디자인을 해요. 심플하고 세련되게...</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 입력 영역 */}
          <div className="space-y-6">
            <Textarea
              label="업무 설명"
              placeholder={`예시:
• 신축 아파트 입주청소를 해요. 화장실, 주방, 거실을 
  깔끔하게 청소하고 30만원 정도 받습니다.
• 중학생 수학 과외를 해요. 1:1로 개인 맞춤 지도하고
  월 40만원씩 받습니다.
• 작은 카페 로고 디자인을 해요. 심플하고 세련되게 
  만들어서 15만원에 제공합니다.`}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              rows={8}
              className="font-mono text-base leading-relaxed"
              helpText="구체적으로 작성할수록 더 정확한 서비스가 생성됩니다"
              required
            />
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
              size="lg"
              className="w-full sm:w-auto"
            >
              취소
            </Button>
            <Button 
  onClick={handleAnalyze}
  disabled={!businessDescription.trim() || loading}
  variant="primary"
  size="lg"
  className="w-full sm:w-auto min-w-[200px]"
>
  {loading ? (
    <div className="flex items-center gap-3">
      <LoadingSpinner size="sm" color="white" />
      <span>AI가 분석 중...</span>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <Search size={20} />
      <span>서비스 생성하기</span>
    </div>
  )}
</Button>
          </div>

          {/* 추가 안내 */}
          <Card className="bg-gray-50 border border-gray-200">
            <div className="flex items-start gap-3">
              <Sparkles size={20} className="text-purple-600 mt-1 flex-shrink-0" />
              <div className="text-sm text-gray-600 leading-relaxed">
                <strong className="text-gray-900">AI 서비스 생성 과정:</strong>
                <br />
                1. 입력하신 업무 설명을 분석합니다
                <br />
                2. 적합한 서비스 카테고리를 자동 분류합니다
                <br />
                3. 가격, 기간, 주요 기능을 추천합니다
                <br />
                4. 생성된 서비스를 검토 후 저장하실 수 있습니다
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}