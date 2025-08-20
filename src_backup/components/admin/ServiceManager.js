import React, { useState, useEffect } from 'react';
import serviceManager from '../../data/serviceManager.js';
import { getButtonStyles, getBadgeStyles, getInputStyles } from '../../styles/designSystem.js';

const ServiceManager = ({ onUpdate }) => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedService, setSelectedService] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, selectedCategory]);

  const loadServices = () => {
    setServices(serviceManager.services);
    if (onUpdate) onUpdate();
  };

  const filterServices = () => {
    let filtered = [...services];

    // 검색어 필터링
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term) ||
        service.category.toLowerCase().includes(term)
      );
    }

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    setFilteredServices(filtered);
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(services.map(service => service.category))];
    return categories.sort();
  };

  const formatPrice = (price, unit) => {
    if (typeof price === 'number') {
      return `${price.toLocaleString()}원${unit ? `/${unit}` : ''}`;
    }
    return price;
  };

  const getServiceTypeColor = (type) => {
    const colors = {
      'plan': 'bg-violet-100 text-violet-800',
      'maintenance': 'bg-emerald-100 text-emerald-800',
      'service': 'bg-blue-100 text-blue-800',
      'addon': 'bg-orange-100 text-orange-800',
      'hourly': 'bg-pink-100 text-pink-800',
      'custom': 'bg-gray-100 text-gray-800',
      'social_login': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setShowEditModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">서비스 관리</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <input
              type="text"
              placeholder="서비스명, 설명, 카테고리로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={getInputStyles()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={getInputStyles()}
            >
              <option value="all">전체 카테고리</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            총 {filteredServices.length}개의 서비스가 있습니다.
          </p>
          <button className={getButtonStyles('primary', 'md')}>
            + 새 서비스 추가
          </button>
        </div>
      </div>

      {/* 서비스 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  서비스명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가격
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{service.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{service.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{service.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getServiceTypeColor(service.type)}`}>
                      {service.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(service.price, service.unit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{service.period || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditService(service)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      편집
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 편집 모달 */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">서비스 편집</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">서비스명</label>
                  <input
                    type="text"
                    value={selectedService.name}
                    className={getInputStyles()}
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    value={selectedService.description}
                    rows={3}
                    className={getInputStyles()}
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                    <input
                      type="text"
                      value={selectedService.category}
                      className={getInputStyles()}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                    <input
                      type="text"
                      value={selectedService.type}
                      className={getInputStyles()}
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">가격</label>
                    <input
                      type="text"
                      value={formatPrice(selectedService.price, selectedService.unit)}
                      className={getInputStyles()}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기간</label>
                    <input
                      type="text"
                      value={selectedService.period || ''}
                      className={getInputStyles()}
                      readOnly
                    />
                  </div>
                </div>

                {/* 포함 서비스 */}
                {selectedService.includedServices && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">포함 서비스</label>
                    <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                      {Object.entries(selectedService.includedServices).map(([category, services]) => (
                        <div key={category} className="mb-2">
                          <h4 className="font-medium text-sm text-gray-900 mb-1">{category}</h4>
                          <ul className="text-xs text-gray-600 ml-4">
                            {services.map((service, index) => (
                              <li key={index} className="mb-1">
                                • {typeof service === 'string' ? service : service.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={handleCloseModal}
                    className={getButtonStyles('outline', 'md')}
                  >
                    닫기
                  </button>
                  <button className={getButtonStyles('primary', 'md')}>
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManager;