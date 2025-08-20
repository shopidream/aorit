import { useState } from 'react';

export default function PortfolioList({ portfolios = [], onEdit, onDelete, onToggleStatus }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  const filteredPortfolios = portfolios.filter(portfolio => {
    if (filter === 'all') return true;
    return portfolio.status === filter;
  });

  const sortedPortfolios = [...filteredPortfolios].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'category') return a.category.localeCompare(b.category);
    if (sortBy === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      featured: 'bg-blue-100 text-blue-800'
    };
    const labels = {
      active: '활성',
      inactive: '비활성',
      featured: '추천'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status] || badges.active}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (portfolios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">포트폴리오 없음</h3>
          <p className="mt-1 text-sm text-gray-500">새로운 포트폴리오를 추가해보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 필터 및 정렬 */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체 ({portfolios.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === 'active' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            활성 ({portfolios.filter(p => p.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('featured')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === 'featured' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            추천 ({portfolios.filter(p => p.status === 'featured').length})
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
        >
          <option value="createdAt">최신순</option>
          <option value="title">제목순</option>
          <option value="category">카테고리순</option>
        </select>
      </div>

      {/* 포트폴리오 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPortfolios.map((portfolio) => (
          <div key={portfolio.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* 이미지 */}
            {portfolio.imageUrl && (
              <div className="h-48 bg-gray-200 overflow-hidden">
                <img
                  src={portfolio.imageUrl}
                  alt={portfolio.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="p-4">
              {/* 제목과 상태 */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {portfolio.title}
                </h3>
                {getStatusBadge(portfolio.status)}
              </div>

              {/* 카테고리 */}
              {portfolio.category && (
                <p className="text-sm text-gray-500 mb-2">{portfolio.category}</p>
              )}

              {/* 설명 */}
              {portfolio.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {portfolio.description}
                </p>
              )}

              {/* 태그 */}
              {portfolio.tags && portfolio.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {portfolio.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {portfolio.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{portfolio.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  {portfolio.projectUrl && (
                    <a
                      href={portfolio.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      보기
                    </a>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => onToggleStatus?.(portfolio.id, portfolio.status)}
                    className="text-gray-500 hover:text-gray-700"
                    title="상태 변경"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => onEdit?.(portfolio)}
                    className="text-blue-600 hover:text-blue-800"
                    title="수정"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => onDelete?.(portfolio.id)}
                    className="text-red-600 hover:text-red-800"
                    title="삭제"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}