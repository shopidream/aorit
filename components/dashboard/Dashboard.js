import React, { useState, useEffect } from 'react';
import { 
  Card, 
  StatsCard,
  QuickActionCard,
  PageHeader,
  EmptyState,
  LoadingSpinner,
  Alert,
  Badge,
  formatCurrency,
  SettingsIcon,
  DocumentIcon,
  CalculatorIcon,
  UsersIcon,
  TrendingUpIcon,
  ContractIcon,
  ClockIcon
} from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { Bot, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { user, getAuthHeaders } = useAuthContext();
  const router = useRouter();
  const [stats, setStats] = useState({
    services: 0,
    quotes: 0,
    contracts: 0,
    revenue: 0
  });
  const [aiUsageInfo, setAiUsageInfo] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const responses = await Promise.allSettled([
        fetch('/api/services', { headers: getAuthHeaders() }),
        fetch('/api/quotes', { headers: getAuthHeaders() }),
        fetch('/api/contracts', { headers: getAuthHeaders() }),
        fetch('/api/ai/usage-info', { headers: getAuthHeaders() })
      ]);

      const [servicesRes, quotesRes, contractsRes, aiUsageRes] = responses;
      
      const services = servicesRes.status === 'fulfilled' && servicesRes.value.ok 
        ? await servicesRes.value.json() : [];
      const quotes = quotesRes.status === 'fulfilled' && quotesRes.value.ok 
        ? await quotesRes.value.json() : [];
      const contracts = contractsRes.status === 'fulfilled' && contractsRes.value.ok 
        ? await contractsRes.value.json() : [];
      const aiUsage = aiUsageRes.status === 'fulfilled' && aiUsageRes.value.ok 
        ? await aiUsageRes.value.json() : null;

      const acceptedQuotes = quotes.filter(q => q.status === 'accepted');
      const revenue = acceptedQuotes.reduce((sum, q) => sum + (q.amount || 0), 0);

      setStats({
        services: services.length || 0,
        quotes: quotes.length || 0,
        contracts: contracts.length || 0,
        revenue
      });

      setAiUsageInfo(aiUsage);

      // 최근 활동 생성
      const activities = [
        ...quotes.slice(-5).map(q => ({
          type: 'quote',
          title: `견적서 #${q.id}`,
          description: q.client?.name || '고객 정보 없음',
          date: q.createdAt,
          status: q.status,
          amount: q.amount
        })),
        ...contracts.slice(-5).map(c => ({
          type: 'contract',
          title: `계약서 #${c.id}`,
          description: c.client?.name || '발주자 정보 없음',
          date: c.createdAt,
          status: c.status,
          amount: c.amount
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

      setRecentActivity(activities);
    } catch (error) {
      console.error('대시보드 데이터 조회 실패:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { 
      title: '새 서비스 등록', 
      description: '제공 서비스를 등록하세요',
      path: '/services', 
      icon: SettingsIcon,
      variant: 'default'
    },
    { 
      title: '견적서 작성', 
      description: '고객에게 견적서를 보내세요',
      path: '/clients?from=services', 
      icon: CalculatorIcon,
      variant: 'success'
    },
    { 
      title: '계약서 생성', 
      description: '견적서에서 계약서 생성',
      path: '/quotes?from=contracts', 
      icon: ContractIcon,
      variant: 'warning'
    },
    { 
      title: '고객 관리', 
      description: '고객 정보를 관리하세요',
      path: '/clients', 
      icon: UsersIcon,
      variant: 'default'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', label: '대기중' },
      accepted: { variant: 'success', label: '수락됨' },
      rejected: { variant: 'danger', label: '거절됨' },
      completed: { variant: 'success', label: '완료됨' },
      draft: { variant: 'secondary', label: '임시저장' },
      active: { variant: 'info', label: '진행중' }
    };
    
    const config = statusConfig[status] || { variant: 'secondary', label: status };
    return { ...config };
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">대시보드를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <PageHeader
        title={`안녕하세요, ${user?.name}님`}
        description="비즈니스 현황을 확인하고 관리하세요"
      />

      {/* 오류 메시지 */}
      {error && (
        <Alert type="error" title="오류 발생">
          {error}
        </Alert>
      )}

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatsCard
          title="등록된 서비스"
          value={stats.services}
          icon={SettingsIcon}
          variant="default"
          trend={stats.services > 0 ? { isPositive: true, value: "운영중" } : null}
        />
        <StatsCard
          title="작성된 견적서"
          value={stats.quotes}
          icon={CalculatorIcon}
          variant="success"
          trend={stats.quotes > 0 ? { isPositive: true, value: "활성" } : null}
        />
        <StatsCard
          title="진행중 계약"
          value={stats.contracts}
          icon={ContractIcon}
          variant="warning"
          trend={stats.contracts > 0 ? { isPositive: true, value: "진행중" } : null}
        />
        <StatsCard
          title="예상 매출"
          value={formatCurrency(stats.revenue)}
          icon={TrendingUpIcon}
          variant="danger"
          trend={stats.revenue > 0 ? { isPositive: true, value: "증가" } : null}
        />
        {/* AI 사용량 카드 */}
        <StatsCard
          title="AI 사용량"
          value={aiUsageInfo ? `${aiUsageInfo.remaining}/${aiUsageInfo.limit}` : '-/-'}
          icon={Bot}
          variant={
            !aiUsageInfo ? "default" :
            aiUsageInfo.remaining === 0 ? "danger" :
            aiUsageInfo.remaining <= 5 ? "warning" : "info"
          }
          trend={
            aiUsageInfo && aiUsageInfo.remaining > 0 
              ? { isPositive: true, value: `${Math.round((aiUsageInfo.remaining / aiUsageInfo.limit) * 100)}% 남음` }
              : aiUsageInfo && aiUsageInfo.remaining === 0
              ? { isPositive: false, value: "한도 초과" }
              : null
          }
        />
      </div>

      {/* AI 사용량 상세 정보 */}
      {aiUsageInfo && (
        <Card className="p-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Bot size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">AI 사용량 현황</h3>
              <p className="text-gray-600">이번 달 AI 기능 사용 현황입니다</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 사용량 진행바 */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">이번 달 사용량</span>
                <span className="text-sm font-bold text-purple-600">
                  {aiUsageInfo.used}/{aiUsageInfo.limit}회 사용
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    aiUsageInfo.remaining === 0 ? 'bg-red-500' :
                    aiUsageInfo.used / aiUsageInfo.limit >= 0.8 ? 'bg-amber-500' :
                    'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min((aiUsageInfo.used / aiUsageInfo.limit) * 100, 100)}%` }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{aiUsageInfo.used}</div>
                  <div className="text-xs text-gray-500">사용한 횟수</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{aiUsageInfo.remaining}</div>
                  <div className="text-xs text-gray-500">남은 횟수</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{aiUsageInfo.limit}</div>
                  <div className="text-xs text-gray-500">월 한도</div>
                </div>
              </div>
            </div>
            
            {/* 상태 및 안내 */}
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${
                aiUsageInfo.remaining === 0 
                  ? 'bg-red-50 border-red-200' 
                  : aiUsageInfo.remaining <= 5 
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {aiUsageInfo.remaining === 0 ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : aiUsageInfo.remaining <= 5 ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  )}
                  <span className={`font-medium ${
                    aiUsageInfo.remaining === 0 ? 'text-red-800' :
                    aiUsageInfo.remaining <= 5 ? 'text-amber-800' : 'text-emerald-800'
                  }`}>
                    {aiUsageInfo.remaining === 0 ? '사용량 초과' :
                     aiUsageInfo.remaining <= 5 ? '사용량 부족' : '사용 가능'}
                  </span>
                </div>
                <p className={`text-sm ${
                  aiUsageInfo.remaining === 0 ? 'text-red-700' :
                  aiUsageInfo.remaining <= 5 ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {aiUsageInfo.remaining === 0 
                    ? '이번 달 AI 사용량을 모두 소진했습니다. 다음 달 1일에 초기화됩니다.'
                    : aiUsageInfo.remaining <= 5
                    ? `${aiUsageInfo.remaining}회만 더 사용할 수 있습니다. 신중히 사용하세요.`
                    : `AI 기능을 자유롭게 사용하실 수 있습니다.`
                  }
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">초기화 일정</span>
                </div>
                <p className="text-xs text-blue-700">
                  다음 달 1일에 사용량이 {aiUsageInfo.limit}회로 초기화됩니다
                </p>
              </div>
              
              <div className="text-xs text-gray-500">
                <strong>AI 기능:</strong> 계약서 생성, 계약서 검토, 서비스 추천
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 메인 컨텐츠 영역 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* 빠른 작업 */}
        <div className="xl:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">빠른 작업</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <QuickActionCard
                  key={index}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  variant={action.variant}
                  onClick={() => router.push(action.path)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* 최근 활동 */}
        <div className="xl:col-span-1">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">최근 활동</h2>
              <ClockIcon size={20} className="text-gray-400" />
            </div>
            
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const statusBadge = getStatusBadge(activity.status);
                  
                  return (
                    <div key={index} className="group">
                      <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                           onClick={() => router.push(activity.type === 'quote' ? '/quotes' : '/contracts')}>
                        
                        {/* 아이콘 */}
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                          {activity.type === 'quote' ? (
                            <CalculatorIcon size={16} className="text-blue-600" />
                          ) : (
                            <ContractIcon size={16} className="text-blue-600" />
                          )}
                        </div>
                        
                        {/* 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {activity.title}
                            </p>
                            <Badge 
                              variant={statusBadge.variant} 
                              size="sm"
                            >
                              {statusBadge.label}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-1">
                            {activity.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {new Date(activity.date).toLocaleDateString('ko-KR')}
                            </p>
                            {activity.amount && (
                              <p className="text-xs font-medium text-blue-600">
                                {activity.amount.toLocaleString()}원
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* 더보기 링크 */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={() => router.push('/quotes')}
                    className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    모든 활동 보기 →
                  </button>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={DocumentIcon}
                title="활동 내역이 없습니다"
                description="견적서나 계약서를 작성하면 여기에 표시됩니다"
                className="py-8"
              />
            )}
          </Card>
        </div>
      </div>
      
      {/* 추가 정보 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 이번 달 성과 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">이번 달 성과</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">새 견적서</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.quotes}개
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">계약 성사</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.contracts}건
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">예상 매출</span>
              <span className="text-sm font-semibold text-blue-600">
                {formatCurrency(stats.revenue)}
              </span>
            </div>
          </div>
        </Card>
        
        {/* 할 일 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">다음에 할 일</h3>
          <div className="space-y-3">
            {stats.services === 0 && (
              <div className="flex items-center gap-3 p-2 bg-amber-50 rounded-lg">
                <SettingsIcon size={16} className="text-amber-600" />
                <span className="text-sm text-amber-800">첫 서비스를 등록해보세요</span>
              </div>
            )}
            {stats.quotes === 0 && stats.services > 0 && (
              <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                <CalculatorIcon size={16} className="text-blue-600" />
                <span className="text-sm text-blue-800">첫 견적서를 작성해보세요</span>
              </div>
            )}
            {stats.quotes > 0 && stats.contracts === 0 && (
              <div className="flex items-center gap-3 p-2 bg-emerald-50 rounded-lg">
                <ContractIcon size={16} className="text-emerald-600" />
                <span className="text-sm text-emerald-800">견적서를 계약서로 전환해보세요</span>
              </div>
            )}
            {stats.services > 0 && stats.quotes > 0 && stats.contracts > 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">모든 기본 설정이 완료되었습니다! 🎉</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}