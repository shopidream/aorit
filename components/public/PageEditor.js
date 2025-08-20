// components/public/PageEditor.js - 공개 페이지 관리 대시보드
import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Badge, 
  StatsCard, 
  Alert
} from '../ui/DesignSystem';
import { 
  UsersIcon, 
  CheckCircleIcon, 
  BriefcaseIcon,
  EyeIcon,
  ExternalLinkIcon,
  TrendingUpIcon
} from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';

export default function PageEditor({ onSave }) {
  const { getAuthHeaders, user } = useAuthContext();
  const [pageData, setPageData] = useState({
    slug: '',
    isActive: true
  });
  const [stats, setStats] = useState({
    activeServices: 0,
    completedContracts: 0,
    totalQuotes: 0,
    pageViews: 0
  });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPageData();
    fetchStats();
    fetchServices();
  }, []);

  const fetchPageData = async () => {
    try {
      const response = await fetch('/api/public-page', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data) {
        setPageData(data);
      } else {
        // 기본 slug 설정 (사용자명 기반)
        setPageData(prev => ({
          ...prev,
          slug: user?.username || user?.name?.toLowerCase().replace(/\s+/g, '-') || ''
        }));
      }
    } catch (error) {
      console.error('페이지 데이터 조회 실패:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [servicesRes, contractsRes, quotesRes] = await Promise.all([
        fetch('/api/services', { headers: getAuthHeaders() }),
        fetch('/api/contracts', { headers: getAuthHeaders() }),
        fetch('/api/quotes', { headers: getAuthHeaders() })
      ]);

      const services = await servicesRes.json();
      const contracts = await contractsRes.json();
      const quotes = await quotesRes.json();

      setStats({
        activeServices: Array.isArray(services) ? services.filter(s => s.isActive).length : 0,
        completedContracts: Array.isArray(contracts) ? contracts.filter(c => c.status === 'completed').length : 0,
        totalQuotes: Array.isArray(quotes) ? quotes.length : 0,
        pageViews: Math.floor(Math.random() * 500) + 100 // 임시 - 실제로는 analytics API 연동
      });
    } catch (error) {
      console.error('통계 조회 실패:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services', { headers: getAuthHeaders() });
      const data = await response.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('서비스 조회 실패:', error);
      setServices([]);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/public-page', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(pageData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('공개 페이지 설정이 저장되었습니다');
        onSave?.(data);
      } else {
        setError(data.error || '저장에 실패했습니다');
      }
    } catch (error) {
      setError('저장 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = async (serviceId, isActive) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        fetchServices();
        fetchStats();
        setSuccess('서비스 공개 설정이 변경되었습니다');
      }
    } catch (error) {
      setError('서비스 설정 변경에 실패했습니다');
    }
  };

  const getPageUrl = () => {
    if (typeof window !== 'undefined' && pageData.slug) {
      return `${window.location.origin}/public/${pageData.slug}`;
    }
    return '';
  };

  return (
    <div className="space-y-8">
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* 성과 통계 - 하나의 카드에 통합 */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-6">성과 현황</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.activeServices}</div>
            <div className="text-sm text-gray-600">활성 서비스</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-2">{stats.completedContracts}</div>
            <div className="text-sm text-gray-600">완료 계약</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-600 mb-2">{stats.totalQuotes}</div>
            <div className="text-sm text-gray-600">총 견적</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.pageViews}</div>
            <div className="text-sm text-gray-600">페이지 조회</div>
          </div>
        </div>
      </Card>

      {/* 페이지 설정 */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">페이지 설정</h3>
        <div className="space-y-4">
          
          {/* 페이지 공개/비공개 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900">페이지 공개</h4>
              <p className="text-sm text-gray-600">
                공개하면 누구나 당신의 서비스를 확인할 수 있습니다
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={pageData.isActive}
                onChange={(e) => setPageData({...pageData, isActive: e.target.checked})}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 페이지 URL */}
          {pageData.isActive && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">공개 페이지 주소</h4>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-white px-3 py-2 rounded border flex-1">
                  {getPageUrl()}
                </code>
                {getPageUrl() && (
                  <Button
                    variant="outline"
                    size="sm"
                    as="a"
                    href={getPageUrl()}
                    target="_blank"
                    icon={ExternalLinkIcon}
                  >
                    열기
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 서비스 공개 관리 */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">서비스 공개 관리</h3>
        <div className="space-y-3">
          {services.length > 0 ? (
            services.map((service) => (
              <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{service.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>가격: {service.price?.toLocaleString()}원</span>
                    {service.category && (
                      <Badge variant="secondary" size="sm">
                        {service.category.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={service.isActive ? "success" : "secondary"} size="sm">
                    {service.isActive ? "공개" : "비공개"}
                  </Badge>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={service.isActive}
                      onChange={(e) => handleServiceToggle(service.id, e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BriefcaseIcon size={48} className="mx-auto mb-4 text-gray-300" />
              <p>등록된 서비스가 없습니다</p>
              <Button variant="outline" size="sm" className="mt-2">
                서비스 등록하기
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 페이지 최적화 팁 */}
      <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
        <div className="flex items-start gap-3">
          <TrendingUpIcon size={24} className="text-emerald-600 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-emerald-800 mb-2">페이지 최적화 팁</h3>
            <ul className="space-y-1 text-sm text-emerald-700">
              <li>• 프로필 정보를 완성해서 신뢰도를 높이세요</li>
              <li>• 포트폴리오를 추가해서 실력을 보여주세요</li>
              <li>• 서비스 설명을 구체적으로 작성하세요</li>
              <li>• 가격을 명확히 표시해서 문의를 늘리세요</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={loading} className="flex-1">
          {loading ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </div>
  );
}