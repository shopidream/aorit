// pages/quotes.js - 견적 관리 페이지 (탭 방식)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import QuoteForm from '../components/quotes/QuoteForm';
import QuoteCard from '../components/quotes/QuoteCard';
import { 
  Card, 
  Button, 
  Badge, 
  PageHeader, 
  EmptyState, 
  LoadingSpinner,
  DocumentIcon,
  PlusIcon,
  FloatingActionBar
} from '../components/ui/DesignSystem';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  User, 
  Building2, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';

// 모던한 Tabs 컴포넌트
const Tabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="border-b border-gray-200 mb-8">
    <nav className="-mb-px flex space-x-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`py-4 px-2 border-b-2 font-semibold text-base transition-all duration-200 ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </div>
        </button>
      ))}
    </nav>
  </div>
);

export default function QuotesPage() {
  const { getAuthHeaders, isAuthenticated, loading, user } = useAuthContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('list');
  const [quotes, setQuotes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [deletingQuote, setDeletingQuote] = useState(null);
  const [expandedClients, setExpandedClients] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage, setClientsPerPage] = useState(5);

  const userRole = user?.role || 'customer';
  const { from } = router.query;
  const isFromContracts = from === 'contracts';

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuotes();
    }
  }, [isAuthenticated, refreshKey]);

  const fetchQuotes = async () => {
    setQuotesLoading(true);
    try {
      const response = await fetch('/api/quotes', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setQuotes(data);
      } else {
        console.error('API에서 배열이 아닌 데이터를 받았습니다:', data);
        setQuotes([]);
      }
    } catch (error) {
      console.error('견적 조회 실패:', error);
      setQuotes([]);
    } finally {
      setQuotesLoading(false);
    }
  };

  // 고객별 견적서 그룹화 및 정렬
  const groupedQuotes = React.useMemo(() => {
    if (!Array.isArray(quotes)) return [];

    const groups = quotes.reduce((acc, quote) => {
      const clientKey = quote.client ? `client_${quote.client.id}` : 'no_client';
      
      if (!acc[clientKey]) {
        acc[clientKey] = {
          client: quote.client,
          quotes: [],
          totalAmount: 0,
          latestQuoteDate: null,
          hasContractCreated: false
        };
      }
      
      acc[clientKey].quotes.push(quote);
      acc[clientKey].totalAmount += quote.amount || 0;
      
      const quoteDate = new Date(quote.createdAt);
      if (!acc[clientKey].latestQuoteDate || quoteDate > acc[clientKey].latestQuoteDate) {
        acc[clientKey].latestQuoteDate = quoteDate;
      }
      
      if (quote.status === 'accepted' || quote.contracts?.length > 0) {
        acc[clientKey].hasContractCreated = true;
      }
      
      return acc;
    }, {});

    Object.values(groups).forEach(group => {
      group.quotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });

    return Object.values(groups).sort((a, b) => 
      (b.latestQuoteDate || 0) - (a.latestQuoteDate || 0)
    );
  }, [quotes]);

  const paginatedGroups = React.useMemo(() => {
    const startIndex = (currentPage - 1) * clientsPerPage;
    const endIndex = startIndex + clientsPerPage;
    return groupedQuotes.slice(startIndex, endIndex);
  }, [groupedQuotes, currentPage, clientsPerPage]);

  const totalPages = Math.ceil(groupedQuotes.length / clientsPerPage);

  useEffect(() => {
    paginatedGroups.forEach((group, index) => {
      const clientKey = group.client ? `client_${group.client.id}` : `no_client_${index}`;
      if (!group.hasContractCreated && !expandedClients.has(clientKey)) {
        setExpandedClients(prev => new Set([...prev, clientKey]));
      }
    });
  }, [paginatedGroups]);

  const handleCreateQuote = () => {
    router.push('/services');
  };

  const handleQuoteSelect = (quote) => {
    if (selectedQuote?.id === quote.id) {
      setSelectedQuote(null);
    } else {
      setSelectedQuote(quote);
    }
  };

  const handleQuoteDetail = (quote) => {
    router.push(`/quotes/${quote.id}`);
  };

  const handleQuoteEdit = async (quote) => {
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, { 
        headers: getAuthHeaders() 
      });
      const freshData = response.ok ? await response.json() : quote;
      setEditingQuote(freshData);
    } catch (error) {
      setEditingQuote(quote);
    }
    setActiveTab('edit');
  };

  const handleCreateContract = () => {
    if (!selectedQuote) return;
    router.push(`/contracts/create/clauses?quoteId=${selectedQuote.id}`);
  };

  const handleDeleteQuote = async (quoteId, quoteTitle) => {
    if (!confirm(`정말로 견적서 #${quoteId}를 삭제하시겠습니까?`)) {
      return;
    }

    setDeletingQuote(quoteId);
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setRefreshKey(prev => prev + 1);
        if (editingQuote && editingQuote.id === quoteId) {
          setEditingQuote(null);
          setActiveTab('list');
        }
        if (selectedQuote && selectedQuote.id === quoteId) {
          setSelectedQuote(null);
        }
        alert('견적서가 성공적으로 삭제되었습니다.');
      } else {
        const data = await response.json();
        alert(data.error || '견적서 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('견적서 삭제 오류:', error);
      alert('견적서 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingQuote(null);
    }
  };

  const handleQuoteUpdated = () => {
    setRefreshKey(prev => prev + 1);
    setEditingQuote(null);
    setActiveTab('list');
  };

  const toggleClientExpanded = (clientKey) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientKey)) {
        newSet.delete(clientKey);
      } else {
        newSet.add(clientKey);
      }
      return newSet;
    });
  };

  const getClientDisplayInfo = (client) => {
    if (!client) {
      return {
        name: '고객 정보 없음',
        company: '',
        email: '',
        phone: ''
      };
    }
    
    return {
      name: client.name || '이름 없음',
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || ''
    };
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { 
      id: 'list', 
      label: '견적 목록',
      icon: <DocumentIcon size={20} />
    },
    ...(editingQuote ? [{ 
      id: 'edit', 
      label: '견적 편집',
      icon: <Edit size={20} />
    }] : [])
  ];

  return (
      <div className="max-w-6xl space-y-8">
        
        {/* 페이지 헤더 */}
        <PageHeader
          title={
            <div className="flex items-center gap-3">
              <span>견적 관리</span>
              <Badge variant="info" icon={DocumentIcon}>
                {quotes.length}개
              </Badge>
            </div>
          }
          description={
            isFromContracts 
              ? '계약서 작성을 위해 견적서를 선택하세요'
              : '고객별로 정리된 견적서를 관리하세요'
          }
          action={
            <div className="flex items-center gap-3">
              {isFromContracts && (
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                  icon={ArrowLeft}
                  size="sm"
                >
                  계약서 목록으로 돌아가기
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleCreateQuote}
                icon={PlusIcon}
              >
                새 견적 작성
              </Button>
            </div>
          }
        />

        {/* 진행 상태 표시 */}
        {isFromContracts && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DocumentIcon size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">계약서 작성 진행 중</h3>
                <p className="text-blue-700 text-sm">
                  다음 단계: 견적서 선택 → 계약서 작성
                </p>
              </div>
            </div>
          </Card>
        )}

        

        {/* 탭 네비게이션 */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* 탭 콘텐츠 */}
        <div className="min-h-[400px]">
          {activeTab === 'list' && (
            <div className="space-y-8">
              
              {/* 견적서 목록 */}
              {quotesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <LoadingSpinner size="lg" />
                    <p className="text-gray-600">견적서 목록 로딩 중...</p>
                  </div>
                </div>
              ) : groupedQuotes.length === 0 ? (
                <EmptyState
                  icon={DocumentIcon}
                  title="아직 견적이 없습니다"
                  description="첫 번째 견적을 작성해보세요"
                  action={
                    <Button
                      variant="primary"
                      onClick={handleCreateQuote}
                      icon={PlusIcon}
                    >
                      견적 작성하기
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-8">
                  {/* 고객별 그룹 */}
                  <div className="space-y-12">
                    {paginatedGroups.map((group, groupIndex) => {
                      const { client, quotes: groupQuotes, hasContractCreated } = group;
                      const clientInfo = getClientDisplayInfo(client);
                      const clientKey = client ? `client_${client.id}` : `no_client_${groupIndex}`;
                      const isExpanded = expandedClients.has(clientKey);
                      const selectedInGroup = groupQuotes.find(quote => 
                        selectedQuote?.id === quote.id
                      );
                      
                      return (
                        <div key={clientKey} className="space-y-6">
                          {/* 고객 섹션 헤더 */}
                          <div className="border-b border-gray-200 pb-6">
                            <div className="flex items-center justify-between mb-4">
                              <button
                                onClick={() => toggleClientExpanded(clientKey)}
                                className="flex items-center gap-4 hover:bg-gray-50 rounded-xl p-3 -m-3 transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                                
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                  {clientInfo.company ? (
                                    <Building2 className="w-6 h-6 text-blue-600" />
                                  ) : (
                                    <User className="w-6 h-6 text-blue-600" />
                                  )}
                                </div>
                                
                                <div className="text-left">
                                  <h2 className="text-2xl font-bold text-gray-900">
                                    {clientInfo.name}
                                    {clientInfo.company && (
                                      <span className="text-gray-600 font-normal ml-2">
                                        ({clientInfo.company})
                                      </span>
                                    )}
                                  </h2>
                                  <div className="text-sm text-gray-500 space-y-1 mt-1">
                                    {clientInfo.email && <div>{clientInfo.email}</div>}
                                    {clientInfo.phone && <div>{clientInfo.phone}</div>}
                                  </div>
                                </div>
                              </button>
                              
                              <div className="flex items-center gap-3">
                                {hasContractCreated && (
                                  <Badge variant="success" size="sm">
                                    계약 완료
                                  </Badge>
                                )}
                                {selectedInGroup && (
                                  <Badge variant="primary" size="sm">
                                    선택됨
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 견적서 카드 그리드 */}
                          {isExpanded && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {groupQuotes.map((quote) => (
                                <QuoteCard
                                  key={quote.id}
                                  quote={quote}
                                  userRole={userRole}
                                  onQuoteDetail={handleQuoteDetail}
                                  onQuoteEdit={handleQuoteEdit}
                                  isSelected={selectedQuote?.id === quote.id}
                                  onClick={() => handleQuoteSelect(quote)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 하단 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
                      {/* 통계 정보 - 좌측 */}
                      <div className="text-sm text-gray-500">
                        총 {groupedQuotes.length}명의 고객, {quotes.length}개 견적서
                      </div>
                      
                      {/* 페이지네이션 - 가운데 */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          처음
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          이전
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "primary" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          다음
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          마지막
                        </Button>
                      </div>

                      {/* 페이지 크기 선택 - 우측 */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">페이지당</span>
                        <select
                          value={clientsPerPage}
                          onChange={(e) => {
                            setClientsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <option value={5}>5명</option>
                          <option value={10}>10명</option>
                          <option value={50}>50명</option>
                          <option value={100}>100명</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'edit' && editingQuote && (
            <Card>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Edit size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">견적서 편집</h2>
                      <p className="text-gray-600">견적서 #{editingQuote.id}의 정보를 수정하세요</p>
                    </div>
                  </div>
                  
                  {/* 삭제 버튼 */}
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDeleteQuote(editingQuote.id, editingQuote.title)}
                    disabled={deletingQuote === editingQuote.id}
                  >
                    {deletingQuote === editingQuote.id ? '삭제 중...' : '견적서 삭제'}
                  </Button>
                </div>
                
                <div className="mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingQuote(null);
                      setActiveTab('list');
                    }}
                    icon={ArrowLeft}
                  >
                    견적 목록으로 돌아가기
                  </Button>
                </div>
                
                <QuoteForm 
                  initialData={editingQuote}
                  onSuccess={handleQuoteUpdated}
                  isEditMode={true}
                />
              </div>
            </Card>
          )}
        </div>
        {/* 플로팅 액션바 */}
        {selectedQuote && (
          <FloatingActionBar
            actions={[
              { 
                label: '상세', 
                onClick: () => handleQuoteDetail(selectedQuote)
              },
              { 
                label: '편집', 
                onClick: () => handleQuoteEdit(selectedQuote)
              },
              { 
                label: isFromContracts ? '계약서 작성' : '계약서 작성', 
                onClick: handleCreateContract, 
                variant: 'primary' 
              }
            ]}
            onClear={() => setSelectedQuote(null)}
          />
        )}
      </div>
  );
}