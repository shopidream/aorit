// pages/contracts/upload.js - 기존 파일을 이 코드로 완전 교체하세요

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../contexts/AuthContext';
import { 
  PageHeader,
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Alert,
  LoadingSpinner,
  Badge
} from '../../components/ui/DesignSystem';
import { 
  FileText, 
  Upload, 
  AlertTriangle, 
  Plus, 
  X, 
  Lightbulb,
  CheckCircle,
  ArrowLeft,
  Bot,
  Sparkles,
  Eye,
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react';

// 계약서 카테고리
const CONTRACT_CATEGORIES = [
  { value: '용역/프로젝트', label: '용역/프로젝트' },
  { value: '파트너십/제휴', label: '파트너십/제휴' },
  { value: '거래/구매', label: '거래/구매' },
  { value: '제조/공급', label: '제조/공급' },
  { value: '근로/고용', label: '근로/고용' },
  { value: '비밀/보안', label: '비밀/보안' },
  { value: '투자/자금', label: '투자/자금' },
  { value: '기타/일반', label: '기타/일반' }
];

export default function ContractUploadPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  
  // 업로드 상태
  const [contractContent, setContractContent] = useState('');
  const [contractName, setContractName] = useState('');
  const [contractCategory, setContractCategory] = useState('');
  const [error, setError] = useState('');
  
  // AI 처리 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: 입력, 1: 정규화, 2: 검토완료
  const [normalizedData, setNormalizedData] = useState(null);
  const [modifiedClauses, setModifiedClauses] = useState([]);
  const [expandedClauses, setExpandedClauses] = useState(new Set());
  const [editingClause, setEditingClause] = useState(null);

  const handleUploadAndReview = async () => {
    if (!contractContent.trim() || !contractName.trim()) {
      setError('계약서 이름과 내용을 입력해주세요.');
      return;
    }

    if (contractContent.length < 50) {
      setError('계약서 내용이 너무 짧습니다. (최소 50자)');
      return;
    }

    if (contractContent.length > 50000) {
      setError('계약서 내용이 너무 깁니다. (최대 50,000자)');
      return;
    }

    setError('');
    setIsProcessing(true);
    setCurrentStep(1);

    try {
      // 1단계: 계약서 정규화 (AI 사용량 체크는 normalize API에서 처리)
      const normalizeResponse = await fetch('/api/contracts/normalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: contractContent,
          options: {
            includeAiAnalysis: true,
            industry: contractCategory || 'general',
            category: contractCategory || 'general',
            countryCode: 'kr'
          }
        })
      });

      if (!normalizeResponse.ok) {
        const errorData = await normalizeResponse.json();
        throw new Error(errorData.error || '정규화 처리 실패');
      }

      const normalizedResult = await normalizeResponse.json();
console.log('🔍 normalizedResult.normalized.clauses.length:', normalizedResult.normalized.clauses.length);
setNormalizedData(normalizedResult);
setModifiedClauses([...normalizedResult.normalized.clauses]);
      
      // 모든 조항 펼치기
      const allIds = new Set(normalizedResult.normalized.clauses.map((_, index) => index));
      setExpandedClauses(allIds);
      
      setCurrentStep(2);
      console.log(`✅ 정규화 완료: ${normalizedResult.normalized.clauses.length}개 조항 추출`);
      
    } catch (error) {
      console.error('계약서 처리 오류:', error);
      setError(error.message);
      setCurrentStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveContract = async () => {
    setIsProcessing(true);

    console.log('🔍 modifiedClauses.length:', modifiedClauses.length);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
  contractData: {
            serviceName: contractName,
            serviceDescription: '업로드된 계약서',
            client: {
              name: '고객명',
              email: '',
              phone: '',
              company: ''
            },
            provider: {
              name: user?.name || 'AORIT',
              email: user?.email || 'cs@aorit.com',
              phone: user?.profile?.phone || '02-1234-5678'
            },
            // 업로드 모드 정보 추가
            isUploadedContract: true,
            originalClauseCount: modifiedClauses.length,
            originalClauses: modifiedClauses
          },
          selectedClauses: modifiedClauses,
          variables: null,
          contractLength: 'custom',
          lengthOption: {
            name: '업로드형',
            description: '사용자 업로드 계약서',
            detailLevel: 'custom'
          },
          metadata: {
            ...normalizedData.metadata,
            uploadedContract: true,
            originalContent: contractContent,
            isUploadedContract: true,
            originalClauseCount: modifiedClauses.length
          }
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ 계약서 저장 완료: ${modifiedClauses.length}개 조항`);
        router.push(`/contracts/${result.id}`);
      } else {
        setError(result.error || '계약서 저장에 실패했습니다.');
      }
    } catch (error) {
      setError('계약서 저장 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleClause = (index) => {
    setExpandedClauses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleEditClause = (index, field, value) => {
    const updated = [...modifiedClauses];
    updated[index] = { ...updated[index], [field]: value };
    setModifiedClauses(updated);
  };

  const removeClause = (index) => {
    const updated = modifiedClauses.filter((_, i) => i !== index);
    const reordered = updated.map((clause, i) => ({ ...clause, number: i + 1, order: i + 1 }));
    setModifiedClauses(reordered);
  };

  const getRiskBadge = (clause) => {
    const content = clause.content?.toLowerCase() || '';
    const title = clause.title?.toLowerCase() || '';
    const combinedText = content + ' ' + title;

    const highRiskKeywords = ['환불 불가', '취소 불가', '독점권', '일방적', '즉시 해지'];
    const mediumRiskKeywords = ['하자보증', '별도 협의', '추가 비용', '위약금'];

    const hasHighRisk = highRiskKeywords.some(keyword => combinedText.includes(keyword));
    const hasMediumRisk = mediumRiskKeywords.some(keyword => combinedText.includes(keyword));

    if (hasHighRisk) {
      return { color: 'bg-red-100 text-red-700 border-red-300', text: '고위험', icon: AlertTriangle };
    } else if (hasMediumRisk) {
      return { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', text: '주의', icon: AlertTriangle };
    } else {
      return { color: 'bg-green-100 text-green-700 border-green-300', text: '안전', icon: CheckCircle };
    }
  };

  const getCharacterCount = () => {
    const count = contractContent.length;
    let color = 'text-gray-500';
    
    if (count > 40000) color = 'text-red-600';
    else if (count > 30000) color = 'text-amber-600';
    else if (count > 50) color = 'text-emerald-600';
    
    return { count, color };
  };

  const charInfo = getCharacterCount();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>이전으로</span>
          </button>
          
          <PageHeader
            title="계약서 업로드 및 검토"
            description="기존 계약서를 업로드하여 AI 분석과 개선 제안을 받아보세요"
          />
        </div>

        {/* 진행 단계 표시 */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-medium">업로드</span>
            </div>
            <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'} rounded`}></div>
            <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {isProcessing && currentStep === 1 ? <RefreshCw className="w-4 h-4 animate-spin" /> : '2'}
              </div>
              <span className="font-medium">AI 분석</span>
            </div>
            <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'} rounded`}></div>
            <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="font-medium">저장</span>
            </div>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <Alert type="error" className="mb-6" dismissible onDismiss={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* 1단계: 업로드 폼 */}
        {currentStep === 0 && (
          <Card>
            <div className="space-y-6">
              
 
              
              {/* 계약서 정보 입력 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="계약서 이름"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  placeholder="예: 웹사이트 개발 용역계약서"
                  required
                  icon={FileText}

                />

                <Select
                  label="계약서 카테고리 (선택사항)"
                  value={contractCategory}
                  onChange={(e) => setContractCategory(e.target.value)}
                  placeholder="계약서 종류를 선택하세요"
                  helpText="카테고리를 선택하면 더 정확한 분석이 가능합니다"
                >
                  {CONTRACT_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* 계약서 내용 입력 */}
              <div className="space-y-3">
                <Textarea
                  label="계약서 내용"
                  value={contractContent}
                  onChange={(e) => setContractContent(e.target.value)}
                  placeholder="기존 계약서 내용을 그대로 붙여넣어 주세요.

예시:

제 1 조 (계약의 목적)
본 계약은 갑이 을에게 웹사이트 개발을 의뢰하고, 을은 이를 수행함을 목적으로 한다.

제 2 조 (계약 금액 및 지급방법)  
본 계약의 총 금액은 금 3,000,000원정으로 한다.

..."
                  rows={15}
                  required
                  className="font-mono text-sm"
                />
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    AI가 자동으로 조항을 분석하고 위험도를 평가합니다
                  </span>
                  <span className={`font-medium ${charInfo.color}`}>
                    {charInfo.count.toLocaleString()} / 50,000자
                  </span>
                </div>
                
                {/* 진행 바 */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      charInfo.count > 40000 ? 'bg-red-500' :
                      charInfo.count > 30000 ? 'bg-amber-500' :
                      charInfo.count > 50 ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${Math.min(100, (charInfo.count / 50000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isProcessing}
                >
                  취소
                </Button>
                
                <Button
                  onClick={handleUploadAndReview}
                  disabled={isProcessing || !contractContent.trim() || !contractName.trim() || charInfo.count < 50}
                  icon={Upload}
                  iconPosition="left"
                >
                  AI 검토 시작
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* 2단계: AI 분석 중 */}
        {currentStep === 1 && (
          <Card>
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI가 계약서를 분석하고 있습니다</h3>
              <p className="text-gray-600">잠시만 기다려주세요. 조항별로 정리하고 위험도를 분석하고 있습니다.</p>
            </div>
          </Card>
        )}

        {/* 3단계: 검토 완료 */}
        {currentStep === 2 && normalizedData && (
          <div className="space-y-6">
            {/* 요약 정보 */}
            <Card>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {modifiedClauses.length}
                  </div>
                  <div className="text-sm text-gray-600">추출된 조항</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(normalizedData.normalized.metadata.confidence * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">구조화 신뢰도</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {modifiedClauses.filter(c => c.essential).length}
                  </div>
                  <div className="text-sm text-gray-600">필수 조항</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {normalizedData.validation?.score || 0}
                  </div>
                  <div className="text-sm text-gray-600">품질 점수</div>
                </div>
              </div>
            </Card>

            {/* 정리된 조항 목록 */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">정리된 조항</h3>
                <div className="text-sm text-gray-500">
                  총 {modifiedClauses.length}개 조항
                </div>
              </div>
              
              <div className="space-y-4">
                {modifiedClauses.map((clause, index) => {
                  const isExpanded = expandedClauses.has(index);
                  const riskBadge = getRiskBadge(clause);
                  const RiskIcon = riskBadge.icon;
                  
                  return (
                    <div key={clause.id || index} className="border border-gray-200 rounded-lg">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                              제{clause.number}조
                            </span>
                            
                            {editingClause === index ? (
                              <input
                                type="text"
                                value={clause.title}
                                onChange={(e) => handleEditClause(index, 'title', e.target.value)}
                                onBlur={() => setEditingClause(null)}
                                onKeyPress={(e) => e.key === 'Enter' && setEditingClause(null)}
                                className="font-medium text-gray-900 bg-transparent border-b border-purple-300 focus:outline-none focus:border-purple-500"
                                autoFocus
                              />
                            ) : (
                              <h4 
                                className="font-medium text-gray-900 cursor-pointer hover:text-purple-600"
                                onClick={() => setEditingClause(index)}
                              >
                                {clause.title}
                              </h4>
                            )}
                            
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded border text-xs font-medium ${riskBadge.color}`}>
                              <RiskIcon className="w-3 h-3" />
                              <span>{riskBadge.text}</span>
                            </div>
                            
                            {clause.essential && (
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                                필수
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleClause(index)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            
                            <button
                              onClick={() => removeClause(index)}
                              className="text-red-400 hover:text-red-600"
                              title="조항 삭제"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="mt-4">
                            <textarea
                              value={clause.content}
                              onChange={(e) => handleEditClause(index, 'content', e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                              rows={4}
                              placeholder="조항 내용을 입력하세요..."
                            />
                            
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                              <span>구조화 신뢰도: {Math.round((clause.confidence || 0) * 100)}%</span>
                              <span>원본길이: {clause.original?.length || clause.content?.length || 0}자</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 저장 버튼 */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(0);
                  setNormalizedData(null);
                  setModifiedClauses([]);
                }}
                disabled={isProcessing}
              >
                다시 업로드
              </Button>
              
              <Button
                onClick={handleSaveContract}
                disabled={isProcessing}
                icon={Save}
                iconPosition="left"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    저장 중...
                  </>
                ) : (
                  '계약서 저장'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}