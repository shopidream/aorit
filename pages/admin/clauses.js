// pages/admin/clauses.js - 조항 관리 시스템 (정리된 버전)
import { useState, useEffect, useCallback } from 'react';

import { useAuthContext } from '../../contexts/AuthContext';
import { 
  Card, 
  Button, 
  Badge, 
  LoadingSpinner,
  EmptyState
} from '../../components/ui/DesignSystem';
import { 
  CheckCircle, 
  XCircle, 
  Eye,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  FileText,
  Shield,
  Plus
} from 'lucide-react';

// 계약서 대분류 (확장 가능)
const CONTRACT_CATEGORIES = [
  '용역/프로젝트',
  '거래/구매', 
  '비밀/보안',
  '근로/고용',
  '투자/자금',
  '파트너십/제휴',
  '기타/일반'
];

// 조항 기능별 분류
const CLAUSE_CATEGORIES = [
  '계약의 목적',
  '대금 지급 조건', 
  '비밀유지 의무',
  '계약 해지 조건',
  '손해배상 제한',
  '지적재산권 귀속',
  '하자보증 기간',
  '근로시간 및 휴게',
  '투자금 회수 조건',
  '수익 분배 조건',
  '업무 범위 정의',
  '납품 및 검수',
  '일정 관리',
  '변경 관리', 
  '품질 기준',
  '책임 분담',
  '불가항력',
  '준거법 및 관할',
  '기타 조항'
];

const STATUS_OPTIONS = {
  all: '전체',
  pending: '검토 대기',
  approved: '승인됨',
  rejected: '거부됨'
};

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function ClausesPage() {
  const { user } = useAuthContext();
  
  // 데이터 상태
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [minConfidence, setMinConfidence] = useState(0.5);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;
  
  // UI 상태
  const [clauseCategoryChanges, setClauseCategoryChanges] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());
  
  // 모달 상태
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showNewContractCategoryModal, setShowNewContractCategoryModal] = useState(false);
  const [showNewClauseCategoryModal, setShowNewClauseCategoryModal] = useState(false);
  const [newContractCategoryName, setNewContractCategoryName] = useState('');
  const [newClauseCategoryName, setNewClauseCategoryName] = useState('');

  // 자동 승인 처리 상태
  const [autoApprovalProcessed, setAutoApprovalProcessed] = useState(false);

  // API 호출
  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        ...(selectedCategory && { contractCategory: selectedCategory }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        minConfidence,
        sortBy,
        order,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm })
      });

      const response = await fetch(`/api/admin/clauses/candidates?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates || []);
        setStats(data.stats || {});
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('조항 후보 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, selectedStatus, minConfidence, sortBy, order, debouncedSearchTerm]);

  // 자동 승인 처리
  useEffect(() => {
    const autoApprove = async () => {
      if (autoApprovalProcessed) return;
      
      const autoApprovalCandidates = candidates.filter(c => 
        c.confidence >= 0.85 && c.status === 'pending'
      );
      
      if (autoApprovalCandidates.length > 0) {
        try {
          const token = localStorage.getItem('token');
          const candidateIds = autoApprovalCandidates.map(c => c.id);
          
          const response = await fetch('/api/admin/clauses/promote', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              candidateIds,
              promotionType: 'auto_approval',
              reason: '고신뢰도 자동 승인 (85% 이상)'
            })
          });
          
          if (response.ok) {
            setAutoApprovalProcessed(true);
            fetchCandidates();
          }
        } catch (error) {
          console.error('자동 승인 오류:', error);
        }
      }
    };

    if (candidates.length > 0 && !autoApprovalProcessed) {
      autoApprove();
    }
  }, [candidates.length, autoApprovalProcessed, fetchCandidates]);

  // 데이터 로드
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // 페이지 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedStatus, minConfidence, debouncedSearchTerm]);

  // AI 추천 조항 카테고리
  const getRecommendedClauseCategory = useCallback((candidate) => {
    const content = candidate.content.toLowerCase();
    const title = candidate.title.toLowerCase();
    
    // 제목 우선 분석
    if (title.includes('목적')) return '계약의 목적';
    if (title.includes('대금') || title.includes('지급')) return '대금 지급 조건';
    if (title.includes('비밀') || title.includes('보안')) return '비밀유지 의무';
    if (title.includes('해지')) return '계약 해지 조건';
    if (title.includes('손해') || title.includes('배상')) return '손해배상 제한';
    if (title.includes('지적재산') || title.includes('저작권')) return '지적재산권 귀속';
    if (title.includes('하자') || title.includes('보증')) return '하자보증 기간';
    if (title.includes('근로') || title.includes('근무')) return '근로시간 및 휴게';
    if (title.includes('투자') || title.includes('회수')) return '투자금 회수 조건';
    if (title.includes('수익') || title.includes('분배')) return '수익 분배 조건';
    
    // 내용 분석
    if (content.includes('목적')) return '계약의 목적';
    if (content.includes('대금') || content.includes('지급')) return '대금 지급 조건';
    if (content.includes('비밀') || content.includes('누설')) return '비밀유지 의무';
    if (content.includes('해지') || content.includes('위반')) return '계약 해지 조건';
    if (content.includes('손해') || content.includes('배상')) return '손해배상 제한';
    
    // 기존 DB 값 확인
    if (candidate.clauseCategory && CLAUSE_CATEGORIES.includes(candidate.clauseCategory)) {
      return candidate.clauseCategory;
    }
    
    return '기타 조항';
  }, []);

  // 이벤트 핸들러
  const handleClauseCategoryChange = (candidateId, newCategory) => {
    if (newCategory === 'NEW_CLAUSE') {
      setShowNewClauseCategoryModal(true);
      return;
    }
    
    if (newCategory) {
      setClauseCategoryChanges(prev => ({ ...prev, [candidateId]: newCategory }));
      setSelectedItems(prev => new Set([...prev, candidateId]));
    } else {
      setClauseCategoryChanges(prev => {
        const updated = { ...prev };
        delete updated[candidateId];
        return updated;
      });
      setSelectedItems(prev => {
        const updated = new Set(prev);
        updated.delete(candidateId);
        return updated;
      });
    }
  };

  const handleAddNewContractCategory = () => {
    if (!newContractCategoryName.trim()) return;
    
    CONTRACT_CATEGORIES.push(newContractCategoryName.trim());
    setNewContractCategoryName('');
    setShowNewContractCategoryModal(false);
    alert('새 계약서 카테고리가 추가되었습니다!');
  };

  const handleAddNewClauseCategory = () => {
    if (!newClauseCategoryName.trim()) return;
    
    CLAUSE_CATEGORIES.push(newClauseCategoryName.trim());
    setNewClauseCategoryName('');
    setShowNewClauseCategoryModal(false);
    alert('새 조항 카테고리가 추가되었습니다!');
  };

  const handleBulkApprove = async () => {
    const selectedCandidates = Array.from(selectedItems);
    if (selectedCandidates.length === 0) {
      alert('승인할 조항을 선택해주세요.');
      return;
    }

    if (!confirm(`선택된 ${selectedCandidates.length}개 조항을 승인하시겠습니까?`)) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      
      // 카테고리 수정
      for (const candidateId of selectedCandidates) {
        const newClauseCategory = clauseCategoryChanges[candidateId];
        if (newClauseCategory) {
          await fetch(`/api/admin/clauses/candidates/${candidateId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              clauseCategory: newClauseCategory,
              reviewNote: `조항 카테고리 수정 후 승인: ${newClauseCategory}`
            })
          });
        }
      }
      
      // 일괄 승인
      const response = await fetch('/api/admin/clauses/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          candidateIds: selectedCandidates,
          promotionType: 'auto_approval'
        })
      });

      if (response.ok) {
        alert(`${selectedCandidates.length}개 조항이 승인되었습니다!`);
        setSelectedItems(new Set());
        setClauseCategoryChanges({});
        fetchCandidates();
      } else {
        const error = await response.json();
        alert(`승인 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('일괄 승인 오류:', error);
      alert('승인 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectCandidate = async (candidateId) => {
    const reason = prompt('거부 사유를 입력해주세요:');
    if (!reason) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/clauses/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          candidateIds: [candidateId],
          reason,
          rejectionCategory: 'manual_review'
        })
      });

      if (response.ok) {
        alert('조항이 거부되었습니다.');
        fetchCandidates();
      }
    } catch (error) {
      console.error('거부 오류:', error);
      alert('거부 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePreviewCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setShowPreviewModal(true);
  };

  if (loading && candidates.length === 0) {
    return (

        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">로딩 중...</span>
        </div>

    );
  }

  return (

      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-600" />
              조항 검토
            </h1>
            <p className="text-gray-600 mt-1">AI가 분석한 조항 후보들을 검토하고 승인할 수 있습니다.</p>
          </div>
          
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedItems.size}개 선택됨</span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkApprove}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                선택 조항 승인
              </Button>
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 후보</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">검토 대기</p>
                <p className="text-2xl font-bold text-orange-600">{stats.byStatus?.pending || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">고신뢰도</p>
                <p className="text-2xl font-bold text-green-600">{stats.highConfidence || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">평균 신뢰도</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((stats.averageConfidence || 0) * 100)}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* 필터 */}
        <Card>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="조항 제목 또는 내용 검색..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">계약서 카테고리</label>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">모든 계약서 카테고리</option>
                    {CONTRACT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewContractCategoryModal(true)}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    title="새 계약서 카테고리 추가"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(STATUS_OPTIONS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최소 신뢰도: {Math.round(minConfidence * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 조항 목록 */}
        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">조항을 불러오는 중...</span>
            </div>
          </Card>
        ) : candidates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="조항 후보가 없습니다"
            description="현재 검토할 조항 후보가 없습니다."
          />
        ) : (
          <Card>
            <div className="p-4">
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedItems.has(candidate.id) ? 'bg-blue-50 border-blue-200' : 
                      candidate.confidence < 0.85 ? 'bg-yellow-50 border-yellow-200' :
                      'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">{candidate.title}</h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{candidate.content}</p>
                            
                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                              <Badge variant="outline">{candidate.contractCategory}</Badge>
                              {candidate.clauseCategory && candidate.clauseCategory !== candidate.contractCategory && (
                                <Badge variant="secondary">{candidate.clauseCategory}</Badge>
                              )}
                              <span>신뢰도: {Math.round(candidate.confidence * 100)}%</span>
                              <span>{new Date(candidate.createdAt).toLocaleDateString()}</span>
                              <Badge variant={
                                candidate.status === 'pending' ? 'warning' :
                                candidate.status === 'approved' ? 'success' : 'destructive'
                              }>
                                {STATUS_OPTIONS[candidate.status]}
                              </Badge>
                              {candidate.confidence < 0.85 && candidate.status === 'pending' && (
                                <Badge variant="warning" className="text-xs">검토필요</Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          {candidate.status === 'pending' && (
                            <>
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">조항 카테고리:</label>
                                <select
                                  value={clauseCategoryChanges[candidate.id] || getRecommendedClauseCategory(candidate)}
                                  onChange={(e) => handleClauseCategoryChange(candidate.id, e.target.value)}
                                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                  {CLAUSE_CATEGORIES.map((category) => (
                                    <option key={category} value={category}>{category}</option>
                                  ))}
                                  <option value="NEW_CLAUSE">+ 새 조항 카테고리 추가</option>
                                </select>
                                {!clauseCategoryChanges[candidate.id] && (
                                  <Badge variant="info" className="text-xs">AI추천</Badge>
                                )}
                              </div>
                              
                              {selectedItems.has(candidate.id) && (
                                <Badge variant="success" className="text-xs">선택됨</Badge>
                              )}
                            </>
                          )}

                          <div className="flex items-center gap-1 ml-auto">
                            <button
                              onClick={() => handlePreviewCandidate(candidate)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              title="미리보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {candidate.status === 'pending' && (
                              <button
                                onClick={() => handleRejectCandidate(candidate.id)}
                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                                title="거부"
                                disabled={processing}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    이전
                  </Button>
                  
                  <span className="text-sm text-gray-600">{currentPage} / {totalPages}</span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    다음
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 계약서 카테고리 추가 모달 */}
        {showNewContractCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">새 계약서 카테고리 추가</h2>
                <button
                  onClick={() => setShowNewContractCategoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">계약서 카테고리 이름</label>
                  <input
                    type="text"
                    value={newContractCategoryName}
                    onChange={(e) => setNewContractCategoryName(e.target.value)}
                    placeholder="예: 제조/공급, 라이선스 등"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowNewContractCategoryModal(false)}>
                    취소
                  </Button>
                  <Button onClick={handleAddNewContractCategory} disabled={!newContractCategoryName.trim()}>
                    추가
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 조항 카테고리 추가 모달 */}
        {showNewClauseCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">새 조항 카테고리 추가</h2>
                <button
                  onClick={() => setShowNewClauseCategoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">조항 카테고리 이름</label>
                  <input
                    type="text"
                    value={newClauseCategoryName}
                    onChange={(e) => setNewClauseCategoryName(e.target.value)}
                    placeholder="예: 라이선스 조건, 데이터 처리 등"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowNewClauseCategoryModal(false)}>
                    취소
                  </Button>
                  <Button onClick={handleAddNewClauseCategory} disabled={!newClauseCategoryName.trim()}>
                    추가
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 미리보기 모달 */}
        {showPreviewModal && selectedCandidate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">조항 후보 상세</h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{selectedCandidate.title}</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge>{selectedCandidate.contractCategory}</Badge>
                    {selectedCandidate.clauseCategory && (
                      <Badge variant="secondary">{selectedCandidate.clauseCategory}</Badge>
                    )}
                    <span className="text-sm text-gray-600">
                      신뢰도: {Math.round(selectedCandidate.confidence * 100)}%
                    </span>
                    <span className="text-sm text-gray-600">
                      출처: {selectedCandidate.sourceContract}
                    </span>
                    <Badge variant={
                      selectedCandidate.status === 'pending' ? 'warning' :
                      selectedCandidate.status === 'approved' ? 'success' : 'destructive'
                    }>
                      {STATUS_OPTIONS[selectedCandidate.status]}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">조항 내용</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {selectedCandidate.content}
                    </pre>
                  </div>
                </div>
                
                {selectedCandidate.tags && selectedCandidate.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">태그</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                    닫기
                  </Button>
                  {selectedCandidate.status === 'pending' && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleRejectCandidate(selectedCandidate.id);
                        setShowPreviewModal(false);
                      }}
                      disabled={processing}
                    >
                      거부
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

  );
}