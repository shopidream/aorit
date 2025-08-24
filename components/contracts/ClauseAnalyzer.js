import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, Lightbulb, Eye, EyeOff, RefreshCw } from 'lucide-react';

// 위험도 분석 엔진
const analyzeClauseRisk = (clause) => {
  const content = clause.content?.toLowerCase() || '';
  const title = clause.title?.toLowerCase() || '';
  
  // 고위험 키워드
  const highRiskKeywords = [
    '환불 불가', '환불하지', '취소 불가', '취소할 수 없', 
    '독점권', '영구 독점', '전권', '모든 권리',
    '무제한 책임', '손해배상', '위약금', '지체상금',
    '일방적', '즉시 해지', '통보 없이', '사전 통지 없이'
  ];
  
  // 중위험 키워드
  const mediumRiskKeywords = [
    '30일 이내', '지연시', '하자보증', '품질보증',
    '수정 요청', '재작업', '추가 비용', '별도 협의',
    '관련 법령', '준거법', '관할 법원'
  ];
  
  // 안정 키워드
  const safeKeywords = [
    '상호 협의', '합리적', '통상적', '업계 관행',
    '쌍방 합의', '서면 통지', '사전 협의'
  ];
  
  let riskScore = 0;
  let riskReasons = [];
  
  // 고위험 키워드 체크
  highRiskKeywords.forEach(keyword => {
    if (content.includes(keyword) || title.includes(keyword)) {
      riskScore += 3;
      riskReasons.push(`분쟁 위험: "${keyword}" 표현 사용`);
    }
  });
  
  // 중위험 키워드 체크
  mediumRiskKeywords.forEach(keyword => {
    if (content.includes(keyword) || title.includes(keyword)) {
      riskScore += 1;
      riskReasons.push(`주의 필요: "${keyword}" 조건 확인 권장`);
    }
  });
  
  // 안전 키워드는 위험도를 낮춤
  safeKeywords.forEach(keyword => {
    if (content.includes(keyword) || title.includes(keyword)) {
      riskScore = Math.max(0, riskScore - 1);
    }
  });
  
  // 특별 케이스: 결제 조항
  if (title.includes('대금') || title.includes('결제') || title.includes('지급')) {
    if (content.includes('선급') || content.includes('계약금 100%')) {
      riskScore += 2;
      riskReasons.push('결제 위험: 선급금 비율이 높음');
    }
  }
  
  // 특별 케이스: 저작권 조항
  if (title.includes('저작권') || title.includes('소유권')) {
    if (content.includes('독점') || content.includes('전권')) {
      riskScore += 2;
      riskReasons.push('권리 위험: 창작자 권리 제한 가능성');
    }
  }
  
  // 위험도 결정
  let riskLevel = 'safe';
  if (riskScore >= 5) riskLevel = 'high';
  else if (riskScore >= 2) riskLevel = 'medium';
  
  return {
    level: riskLevel,
    score: riskScore,
    reasons: riskReasons,
    suggestions: generateSuggestions(clause, riskLevel, riskReasons)
  };
};

// 수정 제안 생성
const generateSuggestions = (clause, riskLevel, reasons) => {
  const suggestions = [];
  const content = clause.content?.toLowerCase() || '';
  const title = clause.title?.toLowerCase() || '';
  
  if (riskLevel === 'high') {
    if (content.includes('환불 불가') || content.includes('취소 불가')) {
      suggestions.push({
        type: 'replacement',
        original: '환불 불가',
        suggested: '정당한 사유 없는 단순 변심의 경우 환불 제한',
        reason: '완전 환불 불가보다는 조건부 환불 정책이 분쟁 위험을 줄입니다.'
      });
    }
    
    if (content.includes('독점권') || content.includes('전권')) {
      suggestions.push({
        type: 'addition',
        suggested: '단, 제작자는 포트폴리오 목적의 활용 권리를 보유한다.',
        reason: '창작자의 포트폴리오 권리를 보장하여 합리적 균형을 맞춥니다.'
      });
    }
    
    if (content.includes('일방적') || content.includes('통보 없이')) {
      suggestions.push({
        type: 'replacement',
        original: '일방적으로',
        suggested: '7일 전 서면 통지 후',
        reason: '상호 충분한 협의 시간을 보장하여 분쟁을 예방합니다.'
      });
    }
  }
  
  if (riskLevel === 'medium') {
    if (title.includes('하자보증') || title.includes('품질보증')) {
      suggestions.push({
        type: 'clarification',
        suggested: '하자의 범위와 보증 기간을 명확히 정의 권장',
        reason: '모호한 표현보다는 구체적 기준이 분쟁 방지에 도움됩니다.'
      });
    }
    
    if (content.includes('별도 협의') || content.includes('추가 비용')) {
      suggestions.push({
        type: 'clarification',
        suggested: '추가 비용 산정 기준과 협의 절차를 사전 명시 권장',
        reason: '비용 산정 기준을 미리 정해두면 나중에 분쟁을 방지할 수 있습니다.'
      });
    }
  }
  
  return suggestions;
};

// 조항별 실무 설명 생성
const generatePlainExplanation = (clause) => {
  const title = clause.title?.toLowerCase() || '';
  const content = clause.content || '';
  
  if (title.includes('목적')) {
    return {
      meaning: '이 계약이 무엇을 위한 것인지 정의하는 조항입니다.',
      impact: '계약의 전체적인 범위와 목표를 명확히 하여 양측의 이해를 일치시킵니다.',
      attention: '서비스 범위가 너무 모호하게 작성되지 않았는지 확인하세요.'
    };
  }
  
  if (title.includes('대금') || title.includes('결제') || title.includes('지급')) {
    return {
      meaning: '서비스 대가와 지급 방법, 시기를 정하는 조항입니다.',
      impact: '언제, 얼마를, 어떻게 받을지 결정하는 가장 중요한 조항 중 하나입니다.',
      attention: '선급금 비율이 너무 높거나, 지급 조건이 애매하지 않은지 검토하세요.'
    };
  }
  
  if (title.includes('완료') || title.includes('종료')) {
    return {
      meaning: '언제 계약이 끝나는지, 완료 기준이 무엇인지 정하는 조항입니다.',
      impact: '프로젝트 완료 시점과 인수 기준을 명확히 하여 무한 수정을 방지합니다.',
      attention: '완료 기준이 구체적인지, 승인 절차가 명확한지 확인하세요.'
    };
  }
  
  if (title.includes('저작권') || title.includes('소유권')) {
    return {
      meaning: '만들어진 결과물의 소유권과 사용권을 누가 가지는지 정하는 조항입니다.',
      impact: '향후 결과물을 누가 어떻게 사용할 수 있는지를 결정하는 중요한 조항입니다.',
      attention: '창작자의 포트폴리오 사용권이나 2차 활용권도 고려해보세요.'
    };
  }
  
  if (title.includes('해지')) {
    return {
      meaning: '계약을 중도에 끝낼 수 있는 조건과 절차를 정하는 조항입니다.',
      impact: '예상치 못한 상황에서 계약을 정리하는 방법을 미리 정해둡니다.',
      attention: '해지 조건이 일방적이지 않은지, 손해 배상 범위가 합리적인지 확인하세요.'
    };
  }
  
  if (title.includes('하자') || title.includes('보증')) {
    return {
      meaning: '완성된 결과물에 문제가 있을 때 어떻게 처리할지 정하는 조항입니다.',
      impact: '서비스 품질에 대한 최소한의 보장과 문제 해결 방법을 제시합니다.',
      attention: '하자의 범위와 보증 기간이 현실적으로 가능한 수준인지 검토하세요.'
    };
  }
  
  // 기본 설명
  return {
    meaning: '이 조항은 계약 당사자 간의 권리와 의무를 정의합니다.',
    impact: '계약 이행 과정에서 발생할 수 있는 상황들에 대한 기준을 제시합니다.',
    attention: '조항 내용이 실제 업무 환경과 맞는지, 실현 가능한지 검토해보세요.'
  };
};

const ClauseAnalyzer = ({ clauses = [], onClauseUpdate }) => {
  const [analyses, setAnalyses] = useState({});
  const [expandedAnalyses, setExpandedAnalyses] = useState(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 조항 분석 수행
  useEffect(() => {
    if (clauses.length > 0) {
      setIsAnalyzing(true);
      const newAnalyses = {};
      
      clauses.forEach((clause, index) => {
        const riskAnalysis = analyzeClauseRisk(clause);
        const explanation = generatePlainExplanation(clause);
        
        newAnalyses[clause.id || index] = {
          risk: riskAnalysis,
          explanation: explanation
        };
      });
      
      setAnalyses(newAnalyses);
      setIsAnalyzing(false);
      
      // 고위험 조항들은 자동으로 펼쳐서 표시
      const highRiskClauses = clauses.filter((clause, index) => {
        const analysis = newAnalyses[clause.id || index];
        return analysis?.risk.level === 'high';
      });
      
      if (highRiskClauses.length > 0) {
        setExpandedAnalyses(new Set(highRiskClauses.map(c => c.id)));
      }
    }
  }, [clauses]);

  const toggleAnalysisExpansion = (clauseId) => {
    setExpandedAnalyses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clauseId)) {
        newSet.delete(clauseId);
      } else {
        newSet.add(clauseId);
      }
      return newSet;
    });
  };

  const applySuggestion = (clauseIndex, suggestion) => {
    const updatedClauses = [...clauses];
    const clause = updatedClauses[clauseIndex];
    
    if (suggestion.type === 'replacement' && suggestion.original && suggestion.suggested) {
      clause.content = clause.content.replace(suggestion.original, suggestion.suggested);
    } else if (suggestion.type === 'addition' && suggestion.suggested) {
      clause.content = clause.content + ' ' + suggestion.suggested;
    }
    
    onClauseUpdate?.(updatedClauses);
  };

  const getRiskBadge = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: AlertTriangle,
          text: '고위험'
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: Info,
          text: '중위험'
        };
      default:
        return {
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: CheckCircle,
          text: '안전'
        };
    }
  };

  if (clauses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-medium text-gray-900">AI 조항 검토</h3>
          {isAnalyzing && (
            <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
          )}
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>고위험 {Object.values(analyses).filter(a => a.risk?.level === 'high').length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>중위험 {Object.values(analyses).filter(a => a.risk?.level === 'medium').length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>안전 {Object.values(analyses).filter(a => a.risk?.level === 'safe').length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {clauses.map((clause, index) => {
          const clauseId = clause.id || index;
          const analysis = analyses[clauseId];
          const isExpanded = expandedAnalyses.has(clauseId);
          
          if (!analysis) return null;
          
          const riskBadge = getRiskBadge(analysis.risk.level);
          const RiskIcon = riskBadge.icon;
          
          return (
            <div key={clauseId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    제{index + 1}조
                  </span>
                  <h4 className="font-medium text-gray-900">{clause.title}</h4>
                  
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded border text-xs font-medium ${riskBadge.color}`}>
                    <RiskIcon className="w-3 h-3" />
                    <span>{riskBadge.text}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleAnalysisExpansion(clauseId)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {isExpanded && (
                <div className="space-y-4">
                  {/* 조항 설명 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">조항 해석</h5>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="font-medium">의미:</span> {analysis.explanation.meaning}</p>
                      <p><span className="font-medium">영향:</span> {analysis.explanation.impact}</p>
                      <p><span className="font-medium">주의사항:</span> {analysis.explanation.attention}</p>
                    </div>
                  </div>
                  
                  {/* 위험 요소 */}
                  {analysis.risk.reasons.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h5 className="font-medium text-yellow-900 mb-2">발견된 위험 요소</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                        {analysis.risk.reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* AI 수정 제안 */}
                  {analysis.risk.suggestions.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-3">AI 수정 제안</h5>
                      <div className="space-y-3">
                        {analysis.risk.suggestions.map((suggestion, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {suggestion.original && (
                                  <div className="mb-2">
                                    <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">변경 전</span>
                                    <p className="text-sm text-gray-600 mt-1">"{suggestion.original}"</p>
                                  </div>
                                )}
                                <div className="mb-2">
                                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                    {suggestion.type === 'replacement' ? '변경 후' : '추가 제안'}
                                  </span>
                                  <p className="text-sm text-gray-900 mt-1 font-medium">"{suggestion.suggested}"</p>
                                </div>
                                <p className="text-xs text-gray-600">{suggestion.reason}</p>
                              </div>
                              
                              {(suggestion.type === 'replacement' || suggestion.type === 'addition') && (
                                <button
                                  onClick={() => applySuggestion(index, suggestion)}
                                  className="ml-3 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  적용
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* 전체 요약 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">전체 계약서 검토 요약</h4>
          <div className="text-sm text-gray-700">
            <p>
              총 {clauses.length}개 조항 중 
              <span className="text-red-600 font-medium"> {Object.values(analyses).filter(a => a.risk?.level === 'high').length}개 고위험</span>, 
              <span className="text-yellow-600 font-medium"> {Object.values(analyses).filter(a => a.risk?.level === 'medium').length}개 중위험</span>, 
              <span className="text-green-600 font-medium"> {Object.values(analyses).filter(a => a.risk?.level === 'safe').length}개 안전</span> 조항이 발견되었습니다.
            </p>
            {Object.values(analyses).some(a => a.risk?.level === 'high') && (
              <p className="mt-2 text-red-700">
                ⚠️ 고위험 조항들을 우선적으로 검토하고 수정을 고려해보세요.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClauseAnalyzer;