// components/portfolio/PortfolioList.js - 포트폴리오 목록
import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';

export default function PortfolioList() {
  const { getAuthHeaders } = useAuthContext();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch('/api/portfolio', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error('포트폴리오 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePortfolio = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await fetch(`/api/portfolio/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchPortfolio();
    } catch (error) {
      console.error('포트폴리오 삭제 실패:', error);
    }
  };

  if (loading) return <div>로딩 중...</div>;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {portfolio.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          {item.imageUrl && (
            <div className="aspect-video bg-gray-100">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {item.description}
            </p>
            
            <div className="flex justify-between items-center">
              {item.link ? (
                <Button
                  variant="outline"
                  size="sm"
                  as="a"
                  href={item.link}
                  target="_blank"
                >
                  보기
                </Button>
              ) : (
                <div></div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deletePortfolio(item.id)}
                className="text-red-600 hover:text-red-700"
              >
                삭제
              </Button>
            </div>
          </div>
        </Card>
      ))}
      
      {portfolio.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          등록된 포트폴리오가 없습니다.
        </div>
      )}
    </div>
  );
}