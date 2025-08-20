// src/components/admin/AdminDashboard.js

import React, { useState } from 'react';
import { designSystem, getButtonStyles, getTabStyles } from '../../styles/designSystem';

const AdminDashboard = ({ services = [], onServiceUpdate }) => {
  const [activeTab, setActiveTab] = useState('services');
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    category: 'general'
  });

  const tabs = [
    { id: 'services', label: '서비스 관리' },
    { id: 'templates', label: '템플릿 관리' },
    { id: 'settings', label: '설정' }
  ];

  const handleServiceSave = (service) => {
    if (onServiceUpdate) {
      onServiceUpdate(service);
    }
    setEditingService(null);
  };

  const handleNewServiceSave = () => {
    if (newService.name && newService.price) {
      const service = {
        ...newService,
        id: Date.now().toString(),
        price: parseInt(newService.price)
      };
      handleServiceSave(service);
      setNewService({ name: '', description: '', price: '', category: 'general' });
    }
  };

  return (
    <div className={designSystem.layout.container}>
      <div className="mb-8">
        <h1 className={designSystem.typography.h1}>관리자 대시보드</h1>
        <p className={designSystem.typography.body}>서비스와 템플릿을 관리하세요</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className={designSystem.tabs.container}>
        <div className={designSystem.tabs.list}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={getTabStyles(activeTab === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className={designSystem.tabs.content}>
        {activeTab === 'services' && (
          <div>
            {/* 새 서비스 추가 */}
            <div className={`${designSystem.form.fieldset} mb-8`}>
              <h3 className={designSystem.typography.h3}>새 서비스 추가</h3>
              <div className={designSystem.layout.formGrid}>
                <input
                  type="text"
                  placeholder="서비스명"
                  value={newService.name}
                  onChange={(e) => setNewService(prev => ({...prev, name: e.target.value}))}
                  className={designSystem.form.input}
                />
                <input
                  type="number"
                  placeholder="가격"
                  value={newService.price}
                  onChange={(e) => setNewService(prev => ({...prev, price: e.target.value}))}
                  className={designSystem.form.input}
                />
                <select
                  value={newService.category}
                  onChange={(e) => setNewService(prev => ({...prev, category: e.target.value}))}
                  className={designSystem.form.select}
                >
                  <option value="general">일반</option>
                  <option value="design">디자인</option>
                  <option value="development">개발</option>
                  <option value="marketing">마케팅</option>
                </select>
                <button onClick={handleNewServiceSave} className={getButtonStyles('primary')}>
                  추가
                </button>
              </div>
              <textarea
                placeholder="서비스 설명"
                value={newService.description}
                onChange={(e) => setNewService(prev => ({...prev, description: e.target.value}))}
                className={`${designSystem.form.textarea} mt-4`}
                rows="2"
              />
            </div>

            {/* 서비스 목록 */}
            <div className={designSystem.layout.grid}>
              {services.map(service => (
                <ServiceEditCard
                  key={service.id}
                  service={service}
                  isEditing={editingService === service.id}
                  onEdit={() => setEditingService(service.id)}
                  onSave={handleServiceSave}
                  onCancel={() => setEditingService(null)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className={`${designSystem.layout.flexCol} items-center py-16`}>
            <div className="text-6xl mb-4">📋</div>
            <p className={designSystem.typography.h4}>템플릿 관리</p>
            <p className={designSystem.typography.body}>곧 추가될 예정입니다</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={`${designSystem.layout.flexCol} items-center py-16`}>
            <div className="text-6xl mb-4">⚙️</div>
            <p className={designSystem.typography.h4}>설정</p>
            <p className={designSystem.typography.body}>곧 추가될 예정입니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 서비스 편집 카드
const ServiceEditCard = ({ service, isEditing, onEdit, onSave, onCancel }) => {
  const [editData, setEditData] = useState(service);

  const handleSave = () => {
    onSave({ ...editData, price: parseInt(editData.price) });
  };

  if (isEditing) {
    return (
      <div className={`${designSystem.form.fieldset} p-4`}>
        <div className={designSystem.layout.spacingCard}>
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData(prev => ({...prev, name: e.target.value}))}
            className={designSystem.form.input}
          />
          <input
            type="number"
            value={editData.price}
            onChange={(e) => setEditData(prev => ({...prev, price: e.target.value}))}
            className={designSystem.form.input}
          />
          <textarea
            value={editData.description}
            onChange={(e) => setEditData(prev => ({...prev, description: e.target.value}))}
            className={designSystem.form.textarea}
            rows="2"
          />
          <div className={`${designSystem.layout.flexRow} gap-2`}>
            <button onClick={handleSave} className={getButtonStyles('primary', 'sm')}>
              저장
            </button>
            <button onClick={onCancel} className={getButtonStyles('outline', 'sm')}>
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${designSystem.form.fieldset} p-4 cursor-pointer`} onClick={onEdit}>
      <h4 className={designSystem.typography.h4}>{service.name}</h4>
      <p className={designSystem.typography.body}>{service.description}</p>
      <p className={`${designSystem.typography.h5} ${designSystem.colors.primary.text}`}>
        {new Intl.NumberFormat('ko-KR').format(service.price)}원
      </p>
    </div>
  );
};

export default AdminDashboard;