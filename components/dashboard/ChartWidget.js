// components/dashboard/ChartWidget.js - 차트 위젯
import React, { useState, useEffect } from 'react';
import { Card, Select } from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';

export default function ChartWidget({ className = "" }) {
  const { getAuthHeaders } = useAuthContext();
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('revenue');
  const [period, setPeriod] = useState('6months');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [chartType, period]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      // 실제 데이터 조회 (여기서는 mock 데이터)
      const [quotesRes, contractsRes] = await Promise.all([
        fetch('/api/quotes', { headers: getAuthHeaders() }),
        fetch('/api/contracts', { headers: getAuthHeaders() })
      ]);

      const quotes = await quotesRes.json();
      const contracts = await contractsRes.json();

      // 월별 데이터 생성
      const monthlyData = generateMonthlyData(quotes, contracts, chartType, period);
      setChartData(monthlyData);
    } catch (error) {
      console.error('차트 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (quotes, contracts, type, period) => {
    const months = period === '6months' ? 6 : 12;
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('ko-KR', { month: 'short' });
      
      let value = 0;
      
      if (type === 'revenue') {
        // 해당 월의 승인된 견적 합계
        value = quotes
          .filter(q => {
            const qDate = new Date(q.createdAt);
            return qDate.getMonth() === date.getMonth() && 
                   qDate.getFullYear() === date.getFullYear() &&
                   q.status === 'accepted';
          })
          .reduce((sum, q) => sum + (q.amount || 0), 0);
      } else if (type === 'quotes') {
        // 해당 월의 견적 개수
        value = quotes.filter(q => {
          const qDate = new Date(q.createdAt);
          return qDate.getMonth() === date.getMonth() && 
                 qDate.getFullYear() === date.getFullYear();
        }).length;
      } else if (type === 'contracts') {
        // 해당 월의 계약 개수
        value = contracts.filter(c => {
          const cDate = new Date(c.createdAt);
          return cDate.getMonth() === date.getMonth() && 
                 cDate.getFullYear() === date.getFullYear();
        }).length;
      }
      
      data.push({ month: monthStr, value });
    }
    
    return data;
  };

  const getMaxValue = () => {
    return Math.max(...chartData.map(d => d.value), 1);
  };

  const chartOptions = [
    { value: 'revenue', label: '매출' },
    { value: 'quotes', label: '견적 수' },
    { value: 'contracts', label: '계약 수' }
  ];

  const periodOptions = [
    { value: '6months', label: '최근 6개월' },
    { value: '12months', label: '최근 12개월' }
  ];

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">통계 차트</h3>
        
        <div className="flex space-x-2">
          <Select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            options={chartOptions}
            className="text-sm"
          />
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={periodOptions}
            className="text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">차트 로딩 중...</div>
        </div>
      ) : (
        <div className="h-64">
          {/* 간단한 바 차트 */}
          <div className="flex items-end justify-between h-full space-x-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-end justify-center h-48">
                  <div
                    className="w-full bg-primary rounded-t transition-all duration-500"
                    style={{
                      height: `${(item.value / getMaxValue()) * 100}%`,
                      minHeight: item.value > 0 ? '4px' : '0'
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-600 text-center">
                  <div>{item.month}</div>
                  <div className="font-medium">
                    {chartType === 'revenue' 
                      ? `${(item.value / 10000).toFixed(0)}만원`
                      : `${item.value}개`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && chartData.length === 0 && (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>표시할 데이터가 없습니다</p>
          </div>
        </div>
      )}
    </Card>
  );
}