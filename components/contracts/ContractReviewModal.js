// components/contracts/ContractReviewModal.js - 업로드된 계약서 검토 모달 (AI 검토 기능 추가)

import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Plus,
  Download,
  Save,
  Lightbulb,
  Shield,
  Clock,
  Brain,
  Zap,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const ContractReviewModal = ({ 
  isOpen, 
  onClose, 
  contractContent, 
  onSave,
  options = {} 
}) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: 정리된 버전, 2: AI 검토
  const [normalizedData, setNormalizedData] = useState(null);
  const [aiReviewData, setAiReviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [expandedClauses, setExpandedClauses] = useState(new Set());
  const [editingClause, setEditingClause] = useState(null);
  const [modifiedClauses, setModifiedClauses] = useState([]);
  const [showMissingClauses, setShowMissingClauses] = useState(false);

  // 모달이 열릴 때 정규화 시작
  useEffect(() => {
    if (isOpen && contractContent) {
      handleNormalization();
    }
  }, [isOpen, contractContent]);

  // 모든 조항을 기본적으로 펼쳐진 상태로 설정
  useEffect(() => {
    if (normalizedData?.normalized?.clauses) {
      const allIds = new Set(normalizedData.normalized.clauses.map((_, index) => index));
      setExpandedClauses(allIds);
    }
  }, [normalizedData]);

  const handleNormalization = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/contracts/normalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: contractContent,
          options: {
            includeAiAnalysis: true,
            industry: options.industry || 'general',
            category: options.category || 'general',
            countryCode: options.countryCode || 'kr',
            ...options
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '정규화 처리 실패');
      }

      const data = await response.json();
      setNormalizedData(data);
      setModifiedClauses([...data.normalized.clauses]);

    } catch (error) {
      console.error('정규화 오류:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // AI 상세 검토 시작
  const handleAiAnalysis = async () => {
    if (!modifiedClauses.length) return;

    setAiAnalyzing(true);
    try {
      console.log('GPT-4 + Claude Sonnet AI 검토 시작...');
      
      const aiResults = await performDetailedAiAnalysis(modifiedClauses);
      setAiReviewData(aiResults);
      
    } catch (error) {
      console.error('AI 검토 실패:', error);
      setError(`AI 검토 실패: ${error.message}`);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // GPT-4 + Claude Sonnet 협업 분석
  const performDetailedAiAnalysis = async (clauses) => {
    const results = [];
    
    // 배치 처리 (3개씩)
    for (let i = 0; i < clauses.length; i += 3) {
      const batch = clauses.slice(i, i + 3);
      
      const batchPromises = batch.map(async (clause, index) => {
        console.log(`조항 ${i + index + 1} 검토 중: ${clause.title}`);
        
        const [gptRiskAnalysis, claudeImprovements] = await Promise.all([
          analyzeClauseWithGPT(clause),
          generateImprovementsWithClaude(clause)
        ]);

        return {
          clauseId: clause.id,
          clauseNumber: clause.number,
          clauseTitle: clause.title,
          originalContent: clause.content,
          
          // GPT-4 위험도 분석
          riskLevel: gptRiskAnalysis.riskLevel,
          riskAnalysis: gptRiskAnalysis.analysis,
          legalIssues: gptRiskAnalysis.issues,
          recommendations: gptRiskAnalysis.recommendations,
          
          // Claude Sonnet 개선안
          improvements: claudeImprovements.suggestions,
          alternativeWording: claudeImprovements.alternatives,
          enhancedClause: claudeImprovements.enhanced,
          
          // 종합 평가
          overallScore: calculateClauseScore(gptRiskAnalysis, claudeImprovements),
          actionRequired: determineAction(gptRiskAnalysis.riskLevel)
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // API 호출 간격 조절
      if (i + 3 < clauses.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return {
      success: true,
      results,
      overallAssessment: generateOverallAssessment(results),
      processingTime: Date.now()
    };
  };

  // GPT-4로 위험도 분석
  const analyzeClauseWithGPT = async (clause) => {
    try {
      const prompt = `다음 계약서 조항의 법적 위험도를 분석하고 개선 방향을 제시하세요.

조항 정보:
제목: ${clause.title}
내용: ${clause.content}

분석 요청:
1. 법적 위험도 (1-10점, 10이 가장 위험)
2. 구체적인 법적 이슈나 문제점 식별
3. 위험 요소에 대한 설명
4. 개선 방향 권장사항

JSON 형식으로 응답:
{
  "riskLevel": 1-10,
  "analysis": {
    "summary": "위험도 요약",
    "keyRisks": ["위험요소1", "위험요소2"]
  },
  "issues": [
    {
      "issue": "문제점",
      "severity": "high/medium/low",
      "explanation": "설명"
    }
  ],
  "recommendations": [
    {
      "type": "modify/add/delete",
      "priority": "high/medium/low", 
      "description": "개선 권장사항"
    }
  ]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY || localStorage.getItem('openai_key')}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: '당신은 한국의 계약서 법무 검토 전문가입니다. 정확하고 실용적인 법적 분석을 제공하세요.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`GPT API 오류: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // 파싱 실패시 기본 구조
      return {
        riskLevel: 5,
        analysis: { summary: "분석 파싱 실패", keyRisks: ["확인 필요"] },
        issues: [],
        recommendations: []
      };

    } catch (error) {
      console.error('GPT 분석 실패:', error);
      return {
        riskLevel: 5,
        analysis: { summary: `분석 실패: ${error.message}`, keyRisks: ["오류 발생"] },
        issues: [],
        recommendations: []
      };
    }
  };

  // Claude Sonnet으로 개선안 생성
  const generateImprovementsWithClaude = async (clause) => {
    try {
      const prompt = `다음 계약서 조항을 개선하고 대체 문구를 제안하세요.

조항 정보:
제목: ${clause.title}
내용: ${clause.content}

요청사항:
1. 더 명확하고 법적으로 안전한 개선된 조항 작성
2. 핵심 문구별 대체 표현 제안
3. 실무에서 바로 사용 가능한 수준으로 작성
4. 한국 법률 환경에 적합하게 조정

JSON 형식으로 응답:
{
  "enhanced": "개선된 전체 조항 내용",
  "suggestions": [
    {
      "aspect": "개선 영역",
      "current": "현재 문제점",
      "improved": "개선된 내용"
    }
  ],
  "alternatives": [
    {
      "original": "원래 표현",
      "suggested": "개선된 표현",
      "reason": "개선 이유"
    }
  ]
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_CLAUDE_API_KEY || localStorage.getItem('claude_key'),
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2500,
          temperature: 0.3,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API 오류: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // 파싱 실패시 기본 구조
      return {
        enhanced: clause.content,
        suggestions: [{ aspect: "파싱 실패", current: "확인 필요", improved: "수동 검토 필요" }],
        alternatives: []
      };

    } catch (error) {
      console.error('Claude 개선안 생성 실패:', error);
      return {
        enhanced: clause.content,
        suggestions: [{ aspect: "생성 실패", current: error.message, improved: "수동 작성 필요" }],
        alternatives: []
      };
    }
  };

  const calculateClauseScore = (gptAnalysis, claudeImprovements) => {
    const riskScore = Math.max(0, 100 - (gptAnalysis.riskLevel * 10));
    const improvementScore = claudeImprovements.suggestions.length > 0 ? 80 : 40;
    return Math.round((riskScore + improvementScore) / 2);
  };

  const determineAction = (riskLevel) => {
    if (riskLevel >= 8) return 'urgent';
    if (riskLevel >= 6) return 'recommended'; 
    if (riskLevel >= 4) return 'optional';
    return 'none';
  };

  const generateOverallAssessment = (results) => {
    const avgRisk = results.reduce((sum, r) => sum + r.riskLevel, 0) / results.length;
    const highRiskCount = results.filter(r => r.riskLevel >= 7).length;
    
    return {
      averageRiskLevel: Math.round(avgRisk * 10) / 10,
      highRiskClauses: highRiskCount,
      overallStatus: avgRisk <= 3 ? 'excellent' : avgRisk <= 5 ? 'good' : avgRisk <= 7 ? 'needs_attention' : 'high_risk'
    };
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

  const addMissingClause = (missingClause) => {
    const newClause = {
      id: `added_${Date.now()}`,
      number: modifiedClauses.length + 1,
      title: missingClause.type,
      content: missingClause.suggestedContent,
      essential: true,
      confidence: 1.0,
      type: 'added',
      original: '',
      order: modifiedClauses.length + 1
    };
    
    setModifiedClauses([...modifiedClauses, newClause]);
  };

  const removeClause = (index) => {
    const updated = modifiedClauses.filter((_, i) => i !== index);
    const reordered = updated.map((clause, i) => ({ ...clause, number: i + 1, order: i + 1 }));
    setModifiedClauses(reordered);
  };

  const handleSave = async () => {
    const finalData = {
      original: contractContent,
      normalized: {
        ...normalizedData.normalized,
        clauses: modifiedClauses
      },
      aiAnalysis: normalizedData.aiAnalysis,
      aiReview: aiReviewData,
      metadata: {
        ...normalizedData.metadata,
        userModified: true,
        finalClauseCount: modifiedClauses.length,
        aiReviewed: !!aiReviewData,
        modifiedAt: new Date().toISOString(),
        // 업로드 모드 정보 강화
        isUploadedContract: true,
        originalClauseCount: modifiedClauses.length,
        uploadedMetadata: {
          originalLength: contractContent.length,
          extractedClauses: modifiedClauses.length,
          preserveAllClauses: true // 모든 조항 보존 플래그
        }
      },
      // 추가: 계약 데이터 레벨에서도 업로드 정보 전달
      contractData: {
        isUploadedContract: true,
        originalClauseCount: modifiedClauses.length,
        originalClauses: modifiedClauses,
        metadata: {
          isUploadedContract: true,
          originalClauseCount: modifiedClauses.length
        }
      }
    };
  
    console.log('🚀 ContractReviewModal에서 전달하는 데이터:', {
      isUploadedContract: finalData.contractData.isUploadedContract,
      originalClauseCount: finalData.contractData.originalClauseCount,
      clauseCount: modifiedClauses.length
    });
  
    await onSave(finalData);
    onClose();
  };

  const getRiskBadge = (clause, aiReview = null) => {
    // AI 검토 결과가 있으면 우선 사용
    if (aiReview) {
      const riskLevel = aiReview.riskLevel;
      if (riskLevel >= 8) {
        return { color: 'bg-red-100 text-red-700 border-red-300', text: '고위험', icon: AlertTriangle };
      } else if (riskLevel >= 6) {
        return { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', text: '주의', icon: Info };
      } else if (riskLevel >= 4) {
        return { color: 'bg-blue-100 text-blue-700 border-blue-300', text: '보통', icon: Info };
      } else {
        return { color: 'bg-green-100 text-green-700 border-green-300', text: '안전', icon: CheckCircle };
      }
    }

    // 기본 키워드 기반 분석
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
      return { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', text: '주의', icon: Info };
    } else {
      return { color: 'bg-green-100 text-green-700 border-green-300', text: '안전', icon: CheckCircle };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <FileText className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                계약서 AI 검토 시스템
              </h2>
              <p className="text-sm text-gray-600">
                GPT-4 위험도 분석 + Claude Sonnet 개선안 생성
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 단계 표시 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentStep(1)}
                className={`px-3 py-1 text-sm rounded-full ${
                  currentStep === 1 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                1. 구조화
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!normalizedData}
                className={`px-3 py-1 text-sm rounded-full ${
                  currentStep === 2 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                2. AI 검토
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">GPT-4o-mini로 계약서를 구조화하고 있습니다...</p>
            </div>
          </div>
        )}

        {/* 오류 상태 */}
        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">처리 실패</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button
                onClick={handleNormalization}
                className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        {!loading && !error && normalizedData && (
          <>
            <div className="flex-1 overflow-y-auto">
              {currentStep === 1 && (
                <div className="p-6 space-y-6">
                  {/* 요약 정보 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {normalizedData.normalized.clauses.length}
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
                          {normalizedData.normalized.clauses.filter(c => c.essential).length}
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
                  </div>

                  {/* AI 검토 실행 버튼 */}
                  {!aiReviewData && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Brain className="w-8 h-8 text-purple-600" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">AI 상세 검토</h3>
                            <p className="text-sm text-gray-600">
                              GPT-4로 위험도 분석 + Claude Sonnet으로 개선안 생성
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleAiAnalysis}
                          disabled={aiAnalyzing}
                          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                          {aiAnalyzing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>AI 분석 중...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              <span>AI 검토 시작</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 권장사항 */}
                  {normalizedData.recommendations && normalizedData.recommendations.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900">기본 권장사항</h3>
                      {normalizedData.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-l-4 ${
                            rec.type === 'error' 
                              ? 'bg-red-50 border-red-400' 
                              : rec.type === 'warning'
                              ? 'bg-yellow-50 border-yellow-400'
                              : 'bg-blue-50 border-blue-400'
                          }`}
                        >
                          <p className="text-sm text-gray-700">{rec.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 누락된 조항 */}
                  {normalizedData.aiAnalysis?.missingClauses && normalizedData.aiAnalysis.missingClauses.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Plus className="w-5 h-5 text-yellow-600" />
                          <h4 className="font-medium text-yellow-800">누락된 필수 조항</h4>
                        </div>
                        <button
                          onClick={() => setShowMissingClauses(!showMissingClauses)}
                          className="text-yellow-600 hover:text-yellow-800"
                        >
                          {showMissingClauses ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {showMissingClauses && (
                        <div className="space-y-2">
                          {normalizedData.aiAnalysis.missingClauses.slice(0, 5).map((missing, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{missing.type}</p>
                                <p className="text-sm text-gray-600 truncate">{missing.suggestedContent}</p>
                              </div>
                              <button
                                onClick={() => addMissingClause(missing)}
                                className="ml-3 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                              >
                                추가
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 정리된 조항 목록 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">정리된 조항 (원본 보존)</h3>
                      <div className="text-sm text-gray-500">
                        총 {modifiedClauses.length}개 조항
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Info className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-blue-800">
                          <strong>원본 내용 보존:</strong> 업로드하신 계약서의 내용을 그대로 유지했습니다. 
                          AI 검토 결과에 따라 수정을 원하시면 직접 편집하세요.
                        </p>
                      </div>
                    </div>
                    
                    {modifiedClauses.map((clause, index) => {
                      const isExpanded = expandedClauses.has(index);
                      const aiReview = aiReviewData?.results?.find(r => r.clauseNumber === clause.number);
                      const riskBadge = getRiskBadge(clause, aiReview);
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
                                  {aiReview && (
                                    <span className="ml-1 text-xs">({aiReview.riskLevel}/10)</span>
                                  )}
                                </div>
                                
                                {clause.essential && (
                                  <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                                    필수
                                  </span>
                                )}
                                
                                {clause.type === 'added' && (
                                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                                    추가됨
                                  </span>
                                )}
                                
                                <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                  {clause.type === 'formal' ? '정형조항' : 
                                   clause.type === 'numbered' ? '번호조항' :
                                   clause.type === 'added' ? '추가조항' : '추론조항'}
                                </span>

                                {aiReview && (
                                  <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                                    AI 검토완료
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
                                
                                {/* AI 검토 결과 표시 */}
                                {aiReview && (
                                  <div className="mt-4 space-y-3">
                                    {/* GPT 위험도 분석 */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                        <h5 className="font-medium text-red-900">GPT-4 위험도 분석</h5>
                                        <span className="text-sm text-red-700">({aiReview.riskLevel}/10점)</span>
                                      </div>
                                      <p className="text-sm text-red-800 mb-2">{aiReview.riskAnalysis?.summary}</p>
                                      {aiReview.riskAnalysis?.keyRisks && (
                                        <ul className="text-sm text-red-700 list-disc list-inside">
                                          {aiReview.riskAnalysis.keyRisks.map((risk, i) => (
                                            <li key={i}>{risk}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>

                                    {/* Claude 개선안 */}
                                    {aiReview.improvements && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <Lightbulb className="w-4 h-4 text-blue-600" />
                                          <h5 className="font-medium text-blue-900">Claude Sonnet 개선안</h5>
                                        </div>
                                        {aiReview.improvements.map((improvement, i) => (
                                          <div key={i} className="text-sm text-blue-800 mb-2">
                                            <span className="font-medium">{improvement.aspect}:</span> {improvement.improved}
                                          </div>
                                        ))}
                                        {aiReview.enhancedClause && (
                                          <div className="mt-2 p-2 bg-white rounded border">
                                            <p className="text-xs text-blue-600 mb-1">개선된 조항:</p>
                                            <p className="text-sm text-gray-900">{aiReview.enhancedClause}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* 대체 문구 제안 */}
                                    {aiReview.alternativeWording && aiReview.alternativeWording.length > 0 && (
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <h5 className="font-medium text-green-900 mb-2">대체 문구 제안</h5>
                                        {aiReview.alternativeWording.map((alt, i) => (
                                          <div key={i} className="text-sm text-green-800 mb-2">
                                            <div className="flex items-start space-x-2">
                                              <span className="font-medium">원문:</span>
                                              <span className="line-through">{alt.original}</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                              <span className="font-medium">개선:</span>
                                              <span className="font-semibold">{alt.suggested}</span>
                                            </div>
                                            <p className="text-xs text-green-600 mt-1">{alt.reason}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                  <span>구조화 신뢰도: {Math.round((clause.confidence || 0) * 100)}%</span>
                                  <div className="flex items-center space-x-2">
                                    <span>원본길이: {clause.original?.length || clause.content?.length || 0}자</span>
                                    <span>•</span>
                                    <span>유형: {clause.type}</span>
                                    {aiReview && (
                                      <>
                                        <span>•</span>
                                        <span>점수: {aiReview.overallScore}/100</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="p-6">
                  {!aiReviewData ? (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">AI 검토를 시작하세요</h3>
                      <p className="text-gray-600 mb-6">
                        1단계에서 "AI 검토 시작" 버튼을 클릭하여<br/>
                        GPT-4 위험도 분석과 Claude Sonnet 개선안을 받아보세요
                      </p>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        1단계로 돌아가기
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* 종합 분석 결과 */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <TrendingUp className="w-6 h-6 text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-900">AI 종합 분석 결과</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {aiReviewData.overallAssessment.averageRiskLevel}/10
                            </div>
                            <div className="text-sm text-gray-600">평균 위험도</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {aiReviewData.overallAssessment.highRiskClauses}
                            </div>
                            <div className="text-sm text-gray-600">고위험 조항</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${
                              aiReviewData.overallAssessment.overallStatus === 'excellent' ? 'text-green-600' :
                              aiReviewData.overallAssessment.overallStatus === 'good' ? 'text-blue-600' :
                              aiReviewData.overallAssessment.overallStatus === 'needs_attention' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {aiReviewData.overallAssessment.overallStatus === 'excellent' ? '우수' :
                               aiReviewData.overallAssessment.overallStatus === 'good' ? '양호' :
                               aiReviewData.overallAssessment.overallStatus === 'needs_attention' ? '주의' : '위험'}
                            </div>
                            <div className="text-sm text-gray-600">전체 상태</div>
                          </div>
                        </div>
                      </div>

                      {/* AI 검토 완료 안내 */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <p className="text-sm text-green-800">
                            <strong>AI 검토 완료:</strong> 모든 조항에 대해 GPT-4 위험도 분석과 Claude Sonnet 개선안이 생성되었습니다. 
                            1단계에서 각 조항을 클릭하여 상세 결과를 확인하고 편집하세요.
                          </p>
                        </div>
                      </div>

                      {/* 조항별 요약 */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium text-gray-900">조항별 AI 분석 요약</h3>
                        {aiReviewData.results.map((result, index) => {
                          const riskColor = result.riskLevel >= 8 ? 'text-red-600' :
                                           result.riskLevel >= 6 ? 'text-yellow-600' :
                                           result.riskLevel >= 4 ? 'text-blue-600' : 'text-green-600';
                          
                          return (
                            <div key={result.clauseId} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-purple-600">제{result.clauseNumber}조</span>
                                <span className="font-medium text-gray-900">{result.clauseTitle}</span>
                                <span className={`text-sm font-medium ${riskColor}`}>
                                  위험도 {result.riskLevel}/10
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">점수: {result.overallScore}/100</span>
                                <button
                                  onClick={() => {
                                    setCurrentStep(1);
                                    toggleClause(index);
                                  }}
                                  className="text-purple-600 hover:text-purple-800 text-sm"
                                >
                                  상세보기
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>구조화: {normalizedData.metadata.processingTime}ms</span>
                  </div>
                  {aiReviewData && (
                    <div className="flex items-center space-x-1">
                      <Brain className="w-4 h-4" />
                      <span>AI 검토: 완료</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4" />
                    <span>신뢰도: {Math.round(normalizedData.normalized.metadata.confidence * 100)}%</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>검토 완료 - 계약서 생성</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContractReviewModal;