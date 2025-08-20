// pages/contracts/create/template.js - 템플릿 기반 계약서 생성 페이지
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../../contexts/AuthContext';
import TemplateSelector from '../../../components/contracts/TemplateSelector';
import { 
  PageHeader, 
  Card, 
  Button, 
  Alert,
  LoadingSpinner,
  Badge
} from '../../../components/ui/DesignSystem';
import { 
  ArrowLeft, 
  CheckCircle, 
  FileText, 
  Zap,
  AlertTriangle 
} from 'lucide-react';

export default function TemplateContractPage() {
  const router = useRouter();
  const { user, getAuthHeaders } = useAuthContext();
  const { quoteId } = router.query;

  const [quoteData, setQuoteData] = useState(null);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (quoteId && user) {
      loadQuoteData();
    }
  }, [quoteId, user]);

  // 견적서 데이터 로드
  const loadQuoteData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const quote = await response.json();
        setQuoteData(quote);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '견적서를 찾을 수 없습니다');
      }
    } catch (error) {
      console.error('견적서 로드 오류:', error);
      setError('견적서를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 선택 핸들러
  const handleTemplatesSelected = (templateIds) => {
    setSelectedTemplates(templateIds);
  };

  // 계약서 생성 핸들러
  const handleGenerateContract = async (result) => {
    setGenerating(true);
    
    try {
      if (result.success) {
        // 생성된 계약서로 이동
        router.push(`/contracts/${result.contract.id}`);
      } else {
        setError(result.error || '계약서 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('계약서 생성 처리 오류:', error);
      setError('계약서 생성 중 오류가 발생했습니다');
    } finally {
      setGenerating(false);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <span className="text-gray-600">견적서 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // 견적서 없음
  if (!quoteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert type="error" title="견적서를 찾을 수 없습니다">
            유효한 견적서가 필요합니다. 견적서를 먼저 생성해주세요.
          </Alert>
          <div className="mt-6">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => router.push('/quotes')}
            >
              견적서 목록으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 페이지 헤더 */}
        <PageHeader
          title="템플릿 기반 계약서 생성"
          description="견적서를 분석하여 최적의 템플릿을 자동으로 매칭합니다"
          action={
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => router.back()}
            >
              이전으로
            </Button>
          }
        />

        {error && (
          <Alert type="error" className="mb-6" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* 견적서 정보 요약 */}
        <Card className="bg-white/70 backdrop-blur-sm border-white/20 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">기준 견적서</h2>
              <p className="text-gray-600">{quoteData.title || `견적서 #${quoteData.id}`}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-600">고객</p>
              <p className="text-base font-semibold text-gray-900">
                {quoteData.client?.name || '고객명 없음'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-600">금액</p>
              <p className="text-base font-semibold text-purple-600">
                {quoteData.amount?.toLocaleString() || '0'}원
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-600">상태</p>
              <Badge variant={quoteData.status === 'approved' ? 'success' : 'warning'}>
                {quoteData.status === 'approved' ? '승인됨' : '대기중'}
              </Badge>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-600">생성일</p>
              <p className="text-base font-semibold text-gray-900">
                {new Date(quoteData.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>

        {/* 템플릿 선택기 */}
        <TemplateSelector
          quoteId={quoteId}
          onTemplatesSelected={handleTemplatesSelected}
          onGenerateContract={handleGenerateContract}
          loading={generating}
        />

        {/* 진행 상태 표시 */}
        {generating && (
          <Card className="bg-white/70 backdrop-blur-sm border-white/20 mt-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <LoadingSpinner size="lg" className="mr-3" />
                  <Zap className="w-8 h-8 text-purple-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  계약서 생성 중...
                </h3>
                <p className="text-gray-600">
                  선택된 템플릿을 견적서 데이터에 맞춰 처리하고 있습니다
                </p>
                <div className="mt-4 max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>1. 템플릿 매칭</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>2. 변수 치환</span>
                    <span className="text-blue-600">진행중...</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>3. 계약서 생성</span>
                    <span className="text-gray-400">대기중</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>4. 완료</span>
                    <span className="text-gray-400">대기중</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 안내 메시지 */}
        <Card className="bg-blue-50/70 backdrop-blur-sm border-blue-200/50 mt-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">템플릿 기반 생성의 장점</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 검증된 조항으로 법적 안정성 확보</li>
                <li>• AI 생성 대비 빠른 처리 속도</li>
                <li>• 견적서 정보 자동 반영</li>
                <li>• 업종별 최적화된 템플릿 사용</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 대안 옵션 */}
        <Card className="bg-amber-50/70 backdrop-blur-sm border-amber-200/50 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">템플릿이 적합하지 않나요?</h4>
                <p className="text-sm text-amber-800">
                  특수한 요구사항이 있다면 AI 기반 계약서 생성을 이용해보세요
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/contracts/create/clauses?quoteId=${quoteId}`)}
              disabled={generating}
            >
              AI 생성으로 전환
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}