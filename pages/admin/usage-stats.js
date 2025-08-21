// pages/admin/usage-stats.js - 관리자 사용량 통계
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { 
  Card, 
  StatsCard, 
  LoadingSpinner, 
  Alert,
  Badge,
  PageHeader,
  UsersIcon,
  DocumentIcon,
  ContractIcon,
  BriefcaseIcon,
  TrendingUpIcon,
  AlertTriangleIcon
} from '../../components/ui/DesignSystem';

export default function AdminUsageStatsPage() {
  const { user, getAuthHeaders } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [heavyUsers, setHeavyUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    fetchUsageStats();
  }, [user, router]);

  const fetchUsageStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/usage-overview', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('통계를 불러오는데 실패했습니다');
      }

      const data = await response.json();
      setStats(data.stats);
      setHeavyUsers(data.heavyUsers);
    } catch (error) {
      console.error('사용량 통계 조회 실패:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getUsageLevel = (count, type) => {
    const thresholds = {
      services: { low: 5, medium: 15, high: 30 },
      quotes: { low: 10, medium: 30, high: 50 },
      contracts: { low: 5, medium: 15, high: 25 }
    };
    
    const threshold = thresholds[type] || thresholds.services;
    
    if (count >= threshold.high) return { level: 'high', label: '많음', color: 'red' };
    if (count >= threshold.medium) return { level: 'medium', label: '보통', color: 'yellow' };
    if (count >= threshold.low) return { level: 'low', label: '적음', color: 'green' };
    return { level: 'minimal', label: '최소', color: 'gray' };
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600">사용량 통계를 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="space-y-8">
          <PageHeader
            title="사용량 통계"
            description="시스템 전체 사용량 및 사용자별 활동 현황"
          />
          <Alert type="error" title="오류 발생">
            {error}
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* 페이지 헤더 */}
        <PageHeader
          title="사용량 통계"
          description="시스템 전체 사용량 및 사용자별 활동 현황"
        />

        {/* 전체 통계 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard
            title="총 회원수"
            value={stats?.totalUsers || 0}
            icon={UsersIcon}
            variant="default"
          />
          <StatsCard
            title="활성 회원"
            value={stats?.activeUsers || 0}
            icon={UsersIcon}
            variant="success"
            trend={{ 
              isPositive: true, 
              value: `${Math.round(((stats?.activeUsers || 0) / (stats?.totalUsers || 1)) * 100)}%` 
            }}
          />
          <StatsCard
            title="총 서비스"
            value={stats?.totalServices || 0}
            icon={BriefcaseIcon}
            variant="info"
          />
          <StatsCard
            title="총 견적서"
            value={stats?.totalQuotes || 0}
            icon={DocumentIcon}
            variant="warning"
          />
          <StatsCard
            title="총 계약서"
            value={stats?.totalContracts || 0}
            icon={ContractIcon}
            variant="danger"
          />
        </div>

        {/* 평균 사용량 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">회원당 평균 사용량</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">서비스 등록</span>
                <span className="font-semibold">{stats?.avgServicesPerUser?.toFixed(1) || '0.0'}개</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">견적서 작성</span>
                <span className="font-semibold">{stats?.avgQuotesPerUser?.toFixed(1) || '0.0'}개</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">계약서 생성</span>
                <span className="font-semibold">{stats?.avgContractsPerUser?.toFixed(1) || '0.0'}개</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">사용률 분포</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">비활성 회원</span>
                <Badge variant="secondary">
                  {((stats?.totalUsers - stats?.activeUsers) || 0)}명
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">활성 회원</span>
                <Badge variant="success">
                  {stats?.activeUsers || 0}명
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">활성률</span>
                <Badge variant="info">
                  {Math.round(((stats?.activeUsers || 0) / (stats?.totalUsers || 1)) * 100)}%
                </Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 건강도</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">중사용자</span>
                <Badge variant="warning">
                  {heavyUsers.length}명
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">전환율</span>
                <Badge variant="success">
                  {Math.round(((stats?.totalContracts || 0) / (stats?.totalQuotes || 1)) * 100)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">서비스 활용도</span>
                <Badge variant="info">
                  {Math.round(((stats?.totalQuotes || 0) / (stats?.totalServices || 1)) * 100)}%
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* 중사용자 목록 */}
        {heavyUsers.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangleIcon size={20} className="text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">중사용자 목록</h3>
              <Badge variant="warning">{heavyUsers.length}명</Badge>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      서비스
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      견적서
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      계약서
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      가입일
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {heavyUsers.map((user, index) => (
                    <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getUsageLevel(user.servicesCount, 'services').color}>
                          {user.servicesCount}개
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getUsageLevel(user.quotesCount, 'quotes').color}>
                          {user.quotesCount}개
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getUsageLevel(user.contractsCount, 'contracts').color}>
                          {user.contractsCount}개
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 새로고침 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={fetchUsageStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>
    </Layout>
  );
}