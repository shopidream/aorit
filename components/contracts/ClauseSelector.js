import { useState, useEffect } from 'react';
import { CheckCircle, Settings, FileText, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import ClauseAnalyzer from './ClauseAnalyzer';

export default function ClauseSelector({ 
  contractData, 
  contractLength = 'simple',
  lengthOption = null,
  selectedClauses = [],
  onClausesChange, 
  onVariablesChange,
  hideAnalysis = false // 조항분석 숨김 옵션
}) {
  const [clauses, setClauses] = useState(selectedClauses);
  const [expandedClauses, setExpandedClauses] = useState(new Set());
  const [editMode, setEditMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setClauses(selectedClauses);
  }, [selectedClauses]);

  // 모든 조항을 기본적으로 펼쳐진 상태로 설정
  useEffect(() => {
    if (clauses.length > 0) {
      const allClauseIds = new Set(clauses.map((clause, index) => clause.id || index));
      setExpandedClauses(allClauseIds);
    }
  }, [clauses]);

  const toggleClauseExpansion = (clauseId) => {
    setExpandedClauses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clauseId)) {
        newSet.delete(clauseId);
      } else {
        newSet.add(clauseId);
      }
      return newSet;
    });
  };

  const handleClauseEdit = (index, field, value) => {
    const updatedClauses = [...clauses];
    updatedClauses[index] = { ...updatedClauses[index], [field]: value };
    setClauses(updatedClauses);
    onClausesChange?.(updatedClauses);
  };

  const addNewClause = () => {
    const newClause = {
      id: `custom_${Date.now()}`,
      title: '새 조항',
      content: '조항 내용을 입력하세요.',
      essential: false,
      order: clauses.length
    };
    const updatedClauses = [...clauses, newClause];
    setClauses(updatedClauses);
    onClausesChange?.(updatedClauses);
  };

  const removeClause = (index) => {
    const updatedClauses = clauses.filter((_, i) => i !== index);
    setClauses(updatedClauses);
    onClausesChange?.(updatedClauses);
  };

  const moveClause = (index, direction) => {
    const updatedClauses = [...clauses];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < updatedClauses.length) {
      [updatedClauses[index], updatedClauses[newIndex]] = [updatedClauses[newIndex], updatedClauses[index]];
      setClauses(updatedClauses);
      onClausesChange?.(updatedClauses);
    }
  };

  // 위험도에 따른 조항 뱃지 색상 결정
  const getClauseRiskBadge = (clause) => {
    const content = clause.content?.toLowerCase() || '';
    const title = clause.title?.toLowerCase() || '';
    
    // 간단한 위험도 평가 (ClauseAnalyzer와 동일한 로직 일부)
    const highRiskKeywords = ['환불 불가', '취소 불가', '독점권', '일방적', '즉시 해지'];
    const mediumRiskKeywords = ['하자보증', '별도 협의', '추가 비용'];
    
    const hasHighRisk = highRiskKeywords.some(keyword => content.includes(keyword) || title.includes(keyword));
    const hasMediumRisk = mediumRiskKeywords.some(keyword => content.includes(keyword) || title.includes(keyword));
    
    if (hasHighRisk) {
      return { color: 'bg-red-100 text-red-700 border-red-300', text: '고위험' };
    } else if (hasMediumRisk) {
      return { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', text: '주의' };
    } else {
      return { color: 'bg-green-100 text-green-700 border-green-300', text: '안전' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* AI 조항 검토 - hideAnalysis가 false일 때만 표시 */}
      {!hideAnalysis && clauses.length > 0 && (
        <ClauseAnalyzer 
          clauses={clauses}
          onClauseUpdate={(updatedClauses) => {
            setClauses(updatedClauses);
            onClausesChange?.(updatedClauses);
          }}
        />
      )}
      
      {/* 선택된 조항 목록 */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-900">
              선택된 조항 ({clauses.length}개)
            </h3>
            {lengthOption && (
              <div className="text-sm text-gray-600">
                · {lengthOption.name} 수준
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>{editMode ? '편집 완료' : '편집'}</span>
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>미리보기</span>
            </button>
          </div>
        </div>

        {clauses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>계약서를 생성하면 조항이 여기에 표시됩니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {editMode && (
              <button
                onClick={addNewClause}
                className="w-full p-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 flex items-center justify-center space-x-2"
              >
                <span>+ 새 조항 추가</span>
              </button>
            )}
            
            {clauses.map((clause, index) => {
              const clauseKey = clause.id || index;
              const isExpanded = expandedClauses.has(clauseKey);
              const riskBadge = getClauseRiskBadge(clause);
              
              return (
                <div key={clauseKey} className="border border-gray-200 rounded-lg p-4">
                  {editMode ? (
                    // 편집 모드
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={clause.title || ''}
                          onChange={(e) => handleClauseEdit(index, 'title', e.target.value)}
                          className="text-lg font-medium bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none flex-1"
                          placeholder="조항 제목"
                        />
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => moveClause(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveClause(index, 'down')}
                            disabled={index === clauses.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeClause(index)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      
                      <textarea
                        value={clause.content || ''}
                        onChange={(e) => handleClauseEdit(index, 'content', e.target.value)}
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                        placeholder="조항 내용을 입력하세요..."
                      />
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={clause.essential || false}
                          onChange={(e) => handleClauseEdit(index, 'essential', e.target.checked)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-600">필수 조항</span>
                      </label>
                    </div>
                  ) : (
                    // 보기 모드
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                            제{index + 1}조
                          </span>
                          <h4 className="font-medium text-gray-900">{clause.title}</h4>
                          
                          {/* 위험도 뱃지 */}
                          <span className={`text-xs px-2 py-1 rounded border font-medium ${riskBadge.color}`}>
                            {riskBadge.text}
                          </span>
                          
                          {clause.essential && (
                            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                              필수
                            </span>
                          )}
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                            AI
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {isExpanded ? (
                            <p className="whitespace-pre-line leading-relaxed">
                              {clause.content}
                            </p>
                          ) : (
                            <p className="line-clamp-2">
                              {clause.content?.substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleClauseExpansion(clauseKey)}
                        className="ml-4 text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{clauses.length}</div>
            <div className="text-sm text-gray-600">총 조항</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {clauses.filter(c => c.essential).length}
            </div>
            <div className="text-sm text-gray-600">필수 조항</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {contractData.services?.length || 1}
            </div>
            <div className="text-sm text-gray-600">서비스 수</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {lengthOption?.name || 'SIMPLE'}
            </div>
            <div className="text-sm text-gray-600">상세도</div>
          </div>
        </div>
      </div>

      {/* 미리보기 모달 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold">계약서 미리보기</h3>
                {lengthOption && (
                  <span className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    {lengthOption.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-white border border-gray-300 min-h-[600px]">
                {/* 계약서 헤더 */}
                <div className="text-center py-8 border-b-2 border-gray-800">
                  <h1 className="text-3xl font-bold mb-4">{contractData?.serviceName || '서비스'} 제공 계약서</h1>
                  <p className="text-lg text-gray-600">Service Agreement</p>
                  {lengthOption && (
                    <p className="text-sm text-gray-500 mt-2">
                      {lengthOption.name} · {clauses.length}개 조항
                    </p>
                  )}
                </div>

                {/* 계약 당사자 */}
                <div className="grid grid-cols-2 gap-12 p-8 border-b border-gray-300">
                  <div>
                    <h3 className="text-lg font-bold mb-4 pb-2 border-b-2 border-gray-800">갑 (발주자)</h3>
                    <div className="space-y-2">
                      <div><span className="font-semibold">성명:</span> {contractData?.client?.name || '발주자'}</div>
                      <div><span className="font-semibold">이메일:</span> {contractData?.client?.email || ''}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold mb-4 pb-2 border-b-2 border-gray-800">을 (수행자)</h3>
                    <div className="space-y-2">
                      <div><span className="font-semibold">성명:</span> {contractData?.provider?.name || '수행자'}</div>
                      <div><span className="font-semibold">이메일:</span> {contractData?.provider?.email || ''}</div>
                    </div>
                  </div>
                </div>

                {/* 계약 내용 */}
                <div className="p-8 border-b border-gray-300">
                  <h3 className="text-lg font-bold mb-4">계약 내용</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {contractData?.amount?.toLocaleString() || '0'}원
                    </div>
                    <div className="text-sm text-gray-600 mt-1">계약 금액</div>
                  </div>
                </div>

                {/* 계약 조항 */}
                <div className="p-8">
                  <h3 className="text-lg font-bold mb-6">계약 조항</h3>
                  <div className="space-y-6">
                    {clauses.map((clause, index) => {
                      const riskBadge = getClauseRiskBadge(clause);
                      return (
                        <div key={clause.id || index}>
                          <h4 className="text-lg font-bold mb-3 border-l-4 border-purple-500 pl-3 flex items-center">
                            제 {index + 1} 조 ({clause.title || '조항'})
                            <span className={`ml-3 text-xs px-2 py-1 rounded border font-medium ${riskBadge.color}`}>
                              {riskBadge.text}
                            </span>
                            {clause.essential && (
                              <span className="ml-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">필수</span>
                            )}
                          </h4>
                          <p className="text-gray-700 leading-relaxed pl-6 whitespace-pre-line">
                            {clause.content || '조항 내용이 없습니다.'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}