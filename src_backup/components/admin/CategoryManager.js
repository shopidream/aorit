import React, { useState, useEffect } from 'react';
import serviceManager from '../../data/serviceManager.js';
import { getButtonStyles, getBadgeStyles } from '../../styles/designSystem.js';

const CategoryManager = ({ onUpdate }) => {
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    const categoryData = serviceManager.getServicesByStage();
    setCategories(categoryData);
    if (onUpdate) onUpdate();
  };

  const getCategoryDescription = (name) => {
    const descriptions = {
      '1️⃣ 스토어 제작': '온라인 스토어 구축을 위한 종합 서비스',
      '2️⃣ 기능 확장': '스토어 기능 확장을 위한 고급 개발 서비스',
      '3️⃣ 마케팅 구축': '디지털 마케팅 인프라 구축 및 운영 서비스',
      '4️⃣ 운영/관리': '지속적인 유지보수 및 관리 서비스',
      '5️⃣ 커스텀 서비스': '맞춤형 개발 및 컨설팅 서비스'
    };
    return descriptions[name] || '서비스 카테고리';
  };

  const getCategoryStats = (services) => {
    const totalServices = services.length;
    const priceRange = services
      .filter(s => typeof s.price === 'number')
      .map(s => s.price);
    
    const minPrice = priceRange.length > 0 ? Math.min(...priceRange) : 0;
    const maxPrice = priceRange.length > 0 ? Math.max(...priceRange) : 0;

    return { totalServices, minPrice, maxPrice };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">카테고리 관리</h2>
        <p className="text-gray-600 mb-6">
          서비스 카테고리별 현황을 확인하고 관리할 수 있습니다.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(categories).map(([categoryName, services]) => {
            const stats = getCategoryStats(services);
            return (
              <div
                key={categoryName}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCategory(categoryName)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{categoryName}</h3>
                  <span className={getBadgeStyles('primary')}>
                    {stats.totalServices}개 서비스
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {getCategoryDescription(categoryName)}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    가격대: {stats.minPrice > 0 ? `${stats.minPrice.toLocaleString()}원` : '협의'} 
                    ~ {stats.maxPrice > 0 ? `${stats.maxPrice.toLocaleString()}원` : '협의'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(categoryName);
                    }}
                    className={getButtonStyles('primary', 'sm')}
                  >
                    상세보기
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 선택된 카테고리 상세보기 */}
      {selectedCategory && categories[selectedCategory] && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">{selectedCategory} 상세정보</h3>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            {categories[selectedCategory].map((service) => (
              <div key={service.id} className="border border-gray-100 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  <span className={`text-sm font-bold ${
                    typeof service.price === 'number' ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {typeof service.price === 'number' 
                      ? `${service.price.toLocaleString()}원` 
                      : service.price
                    }
                  </span>
                </div>
                <p className="text-sm text-gray-600">{service.description}</p>
                {service.period && (
                  <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    기간: {service.period}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;