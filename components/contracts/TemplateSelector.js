// components/contracts/TemplateSelector.js - 템플릿 선택 UI 컴포넌트
import { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { 
  CheckCircle, 
  FileText, 
  Eye, 
  Target, 
  Layers, 
  AlertTriangle, 
  Loader2,
  Settings,
  Zap
} from 'lucide-react';

const CLAUSE_CATEGORY_NAMES = {
  basic: '기본 정보',
  payment: '대금 지급', 
  service: '서비스 범위',
  delivery: '납품 조건',
  warranty: '보증 조건',
  ip_rights: '지적재산권',
  confidentiality: '기밀유지',
  liability: '책임한계',
  termination: '계약해지',
  dispute: '분쟁해결',
  other: '기타'
};

const TEMPLATE_TYPE_COLORS = {
  standard: 'bg-blue-50 border-blue-200 text-blue-800',
  flexible: 'bg-green-50 border-green-200 text-green-800'
};

export default function TemplateSelector({ 
  quoteId, 
  onTemplatesSelected, 
  onGenerateContract,
  loading = false 
}) {
  const { getAuthHeaders } = useAuthContext();
  
  const [matchResult, setMatchResult] = useState(null);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [customVariables, setCustomVariables] = useState({});
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState({});
  const [previewData, setPreviewData] = useState({});
  const [showCustomVariables, setShowCustomVariables] = useState(false);
  const [error, setError] = useState('');

  // 컴포넌트 로드 시 템플릿 매칭 실행
  useEffect(() => {
    if (quoteId) {
      findTemplates();
    }
  }, [quoteId]);

  // 템플릿 찾기
  const findTemplates = async () => {
    setLoadingMatch(true);
    setError('');
    
    try {
      const response = await fetch('/api/templates/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          action: 'find_templates',
          quoteId: parseInt(quoteId)
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMatchResult(result);
        
        // 기본적으로 모든 템플릿 선택
        const allTemplateIds = result.matches.templates.map(t => t.id);
        setSelectedTemplates(allTemplateIds);
        
        if (onTemplatesSelected) {
          onTemplatesSelected(allTemplateIds);
        }
      } else {
        setError(result.error || '템플릿 매칭에 실패했습니다');
      }
    } catch (error) {
      console.error('템플릿 매칭 오류:', error);
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoadingMatch(false);
    }
  };

  // 템플릿 선택/해제
  const handleTemplateToggle = (templateId) => {
    const newSelected = selectedTemplates.includes(templateId)
      ? selectedTemplates.filter(id => id !== templateId)
      : [...selectedTemplates, templateId];
    
    setSelectedTemplates(newSelected);
    
    if (onTemplatesSelected) {
      onTemplatesSelected(newSelected);
    }
  };

  // 조항 미리보기
  const handlePreviewClause = async (templateId) => {
    setLoadingPreview(prev => ({ ...prev, [templateId]: true }));
    
    try {
      const response = await fetch('/api/templates/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          action: 'preview_clause',
          templateId,
          quoteId: parseInt(quoteId),
          customVariables
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setPreviewData(prev => ({
          ...prev,
          [templateId]: result.preview
        }));
      }
    } catch (error) {
      console.error('미리보기 오류:', error);
    } finally {
      setLoadingPreview(prev => ({ ...prev, [templateId]: false }));
    }
  };

  // 계약서 생성
  const handleGenerateContract = async () => {
    if (selectedTemplates.length === 0) {
      setError('최소 1개 이상의 템플릿을 선택해주세요');
      return;
    }

    try {
      const response = await fetch('/api/templates/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          action: 'generate_contract',
          quoteId: parseInt(quoteId),
          selectedTemplates,
          customVariables
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (onGenerateContract) {
          onGenerateContract(result);
        }
      } else {
        setError(result.error || '계약서 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('계약서 생성 오류:', error);
      setError('네트워크 오류가 발생했습니다');
    }
  };

  // 로딩 상태
  if (loadingMatch) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="text-gray-600">견적서 분석 및 템플릿 매칭 중...</span>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="text-red-800 font-medium">오류 발생</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={findTemplates}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 매칭 결과 없음
  if (!matchResult) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">템플릿을 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 매칭 결과 요약 */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 text-purple-600 mr-2" />
          템플릿 매칭 결과
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {matchResult.matches.templates.length}
            </div>
            <div className="text-sm text-gray-600">매칭된 조항</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {matchResult.analytics.recommendedComplexity}
            </div>
            <div className="text-sm text-gray-600">추천 복잡도</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(matchResult.analytics.averageScore * 100)}%
            </div>
            <div className="text-sm text-gray-600">평균 적합도</div>
          </div>
        </div>

        {/* 분석 기준 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">분석 기준</h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {matchResult.criteria.serviceType}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {matchResult.criteria.industry}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              {matchResult.criteria.complexity}
            </span>
          </div>
        </div>
      </div>

      {/* 템플릿 목록 */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">계약서 조항 선택</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCustomVariables(!showCustomVariables)}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              <span>변수 설정</span>
            </button>
          </div>
        </div>

        {/* 사용자 정의 변수 설정 */}
        {showCustomVariables && (
          <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-800 mb-3">사용자 정의 변수</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  특별 조건
                </label>
                <input
                  type="text"
                  placeholder="예: 주말 작업 불가"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  onChange={(e) => setCustomVariables(prev => ({
                    ...prev,
                    specialCondition: e.target.value
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  추가 요구사항
                </label>
                <input
                  type="text"
                  placeholder="예: 월 1회 진행 보고"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  onChange={(e) => setCustomVariables(prev => ({
                    ...prev,
                    additionalRequirement: e.target.value
                  }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* 조항 목록 */}
        <div className="space-y-4">
          {matchResult.matches.templates.map((template) => (
            <div
              key={template.id}
              className={`border rounded-lg p-4 transition-all ${
                selectedTemplates.includes(template.id)
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedTemplates.includes(template.id)}
                      onChange={() => handleTemplateToggle(template.id)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <h4 className="font-medium text-gray-900">{template.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${TEMPLATE_TYPE_COLORS[template.type]}`}>
                      {template.type === 'standard' ? '표준' : '유연'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {CLAUSE_CATEGORY_NAMES[template.category] || template.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {template.content.substring(0, 120)}...
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>적합도: {Math.round(template.matchScore * 100)}%</span>
                    <span>사용횟수: {template.usageCount}</span>
                    <span>신뢰도: {Math.round(template.confidence * 100)}%</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePreviewClause(template.id)}
                  disabled={loadingPreview[template.id]}
                  className="flex items-center space-x-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {loadingPreview[template.id] ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span>미리보기</span>
                </button>
              </div>
              
              {/* 미리보기 내용 */}
              {previewData[template.id] && (
                <div className="mt-4 p-4 bg-white border rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-2">처리된 조항 내용</h5>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {previewData[template.id].processed}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 하단 액션 버튼 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {selectedTemplates.length}개 조항 선택됨
        </div>
        
        <button
          onClick={handleGenerateContract}
          disabled={loading || selectedTemplates.length === 0}
          className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>계약서 생성 중...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>템플릿으로 계약서 생성</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}