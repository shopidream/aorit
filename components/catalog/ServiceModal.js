import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  Input, 
  Textarea, 
  Card, 
  Badge, 
  Alert, 
  PageHeader, 
  LoadingSpinner,
  EmptyState,
  QuickActionCard
} from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import ModalWrapper from './ModalWrapper';
import { normalizeService, renderTextList, formatPrice, extractText } from '../../lib/dataTypes';
import {
  Settings as SettingsIcon,
  FileText as DocumentIcon,
  Upload as UploadIcon,
  Image as ImageIcon,
  Plus as PlusIcon,
  X as XIcon,
  Edit as EditIcon,
  Trash2 as DeleteIcon,
  Star as StarIcon,
  Clock as ClockIcon,
  DollarSign as PriceIcon,
  Tag as CategoryIcon,
  CheckCircle as ActiveIcon,
  XCircle as InactiveIcon,
  Sparkles as PlanIcon
} from 'lucide-react';

export default function ServiceModal({ 
  service: rawService, 
  isEditMode: initialEditMode, 
  userRole, 
  isOpen, 
  onClose, 
  onServiceSaved 
}) {
  const { getAuthHeaders } = useAuthContext();
  const fileInputRef = useRef(null);
  
  const service = normalizeService(rawService);

  const canEdit = ['admin', 'user', 'freelancer'].includes(userRole);
  
  const [editMode, setEditMode] = useState(initialEditMode || false);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  
  // isPlan 값 안전하게 처리
  const getIsPlanValue = () => {
    if (rawService?.isPlan === true || rawService?.isPlan === 1 || rawService?.isPlan === '1') return true;
    if (service?.isPlan === true || service?.isPlan === 1 || service?.isPlan === '1') return true;
    return false;
  };

  const [formData, setFormData] = useState(() => {
    const initialData = {
      categoryId: service.category?.id || service.categoryId || rawService?.categoryId || '', 
      title: service.title || '',
      description: service.description || '',
      price: service.price || 0,
      duration: service.duration || '',
      images: service.images || service.image || [],
      features: service.features || [],
      isActive: service.isActive !== undefined ? service.isActive : true,
      isPlan: getIsPlanValue()
    };
    
    return initialData;
  });

  const fetchCategories = async () => {
    if (!canEdit) return;
    
    setCategoriesLoading(true);
    try {
      const response = await fetch('/api/categories', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('카테고리명을 입력해주세요.');
      return;
    }

    setAddingCategory(true);
    setError('');

    try {
      const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          id: categoryId,
          name: newCategoryName.trim(),
          type: 'standard',
          contractTitle: `${newCategoryName.trim()} 서비스 계약서`
        })
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories(prev => [...prev, newCategory]);
        setFormData(prev => ({ ...prev, categoryId: newCategory.id }));
        setNewCategoryName('');
        setShowAddCategory(false);
      } else {
        const data = await response.json();
        setError(data.error || '카테고리 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 생성 오류:', error);
      setError('카테고리 생성 중 오류가 발생했습니다.');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!confirm(`"${categoryName}" 카테고리를 정말 삭제하시겠습니까?`)) {
      return;
    }
  
    setDeletingCategory(categoryId);
    setError('');
  
    try {
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ categoryId })
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        if (formData.categoryId === categoryId) {
          setFormData(prev => ({ ...prev, categoryId: '' }));
        }
      } else {
        setError(data.error || '카테고리 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 삭제 오류:', error);
      setError('카테고리 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingCategory(null);
    }
  };

  useEffect(() => {
    const fetchServiceData = async () => {
      if (service.id && !service.id.toString().startsWith('ai_')) {
        try {
          const response = await fetch(`/api/services/${service.id}`, {
            headers: getAuthHeaders()
          });
          
          if (response.ok) {
            const freshData = await response.json();
            
            if (editMode) {
              setFormData({
                categoryId: freshData.category?.id || freshData.categoryId || '', 
                title: freshData.title || '',
                description: freshData.description || '',
                price: freshData.price || 0,
                duration: freshData.duration || '',
                images: typeof freshData.images === 'string' ? JSON.parse(freshData.images) : (freshData.images || []),
                features: freshData.features || [],
                isActive: freshData.isActive !== undefined ? freshData.isActive : true,
                isPlan: freshData.isPlan || false
              });
            } else {
              setServiceData({
                ...freshData,
                images: typeof freshData.images === 'string' ? JSON.parse(freshData.images) : (freshData.images || [])
              });
            }
          }
        } catch (error) {
          console.error('서비스 데이터 가져오기 실패:', error);
        }
      }
    };

    fetchServiceData();
    
    if (editMode) {
      fetchCategories();
    }
  }, [editMode, service.id, isOpen]);

  const handleEditToggle = () => {
    if (editMode) {
      setFormData({
        categoryId: service.category?.id || service.categoryId || '', 
        title: service.title || '',
        description: service.description || '',
        price: service.price || 0,
        duration: service.duration || '',
        images: service.images || service.image || [],
        features: service.features || [],
        isActive: service.isActive !== undefined ? service.isActive : true,
        isPlan: getIsPlanValue()
      });
      setError('');
    }
    setEditMode(!editMode);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;

    if (formData.images.length + files.length > 3) {
      setError('이미지는 최대 3장까지 업로드 가능합니다.');
      return;
    }

    setImageUploading(true);
    setError('');

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name}: 이미지 파일만 업로드 가능합니다.`);
        }

        if (file.size > 1 * 1024 * 1024) {
          throw new Error(`${file.name}: 이미지 크기는 1MB 이하여야 합니다.`);
        }

        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('type', 'service');

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: uploadFormData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `${file.name}: 업로드에 실패했습니다.`);
        }

        return data.url || data.filePath;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      setError(error.message || '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageRemove = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files);
    }
  };

  const handleSave = async () => {
    if (!formData.categoryId || !formData.title || !formData.description) {
      setError('필수 필드를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = service.id ? `/api/services/${service.id}` : '/api/services';
      const method = service.id ? 'PUT' : 'POST';
      
      const saveData = {
        ...formData,
        images: JSON.stringify(formData.images)
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(saveData)
      });

      const data = await response.json();

      if (response.ok) {
        onServiceSaved?.(data);
        setEditMode(false);
      } else {
        setError(data.error || '저장 중 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('서비스 저장 오류:', error);
      setError('서비스 저장 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!service.id) return;
    
    if (!confirm(`"${service.title}" 서비스를 정말 삭제하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        onServiceSaved?.();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || '삭제 중 오류가 발생했습니다');
      }
    } catch (error) {
      console.error('서비스 삭제 오류:', error);
      setError('서비스 삭제 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    const feature = prompt('기능을 입력하세요:');
    if (feature && feature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature.trim()]
      }));
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const SafeFeaturesList = ({ features, className = "mb-8" }) => {
    const featuresDisplay = renderTextList(features);
    
    if (!featuresDisplay || !featuresDisplay.items || featuresDisplay.items.length === 0) return null;
    
    return (
      <Card className={className}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <StarIcon size={20} className="text-emerald-600" />
          </div>
          <h4 className="text-lg font-bold text-gray-900">주요 기능</h4>
        </div>
        <div className="space-y-3">
          {featuresDisplay.items.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-gray-700">{String(feature)}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const EditableList = ({ items, onAdd, onRemove, addLabel, bgColor, borderColor }) => (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((item, index) => {
          const displayText = extractText(item, '항목');
          return (
            <div key={index} className={`flex items-center gap-3 p-4 ${bgColor} rounded-xl border-l-4 ${borderColor}`}>
              <span className="flex-1 text-sm text-gray-700">{String(displayText)}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
              >
                <XIcon size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        onClick={onAdd}
        icon={PlusIcon}
        className="w-full"
      >
        {addLabel}
      </Button>
    </div>
  );

  const [serviceData, setServiceData] = useState(service);
  const currentData = editMode ? formData : serviceData;
  const title = editMode ? (service.id ? '서비스 편집' : '새 서비스 등록') : '서비스 상세보기';

  // 임시 서비스(AI 생성)인지 확인
  const isTemporaryService = service?.id && typeof service.id === 'string' && service.id.startsWith('ai_');
  
  const headerActions = canEdit && !isTemporaryService && (
    <div className="flex items-center gap-3">
      {editMode ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditToggle}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
            icon={loading ? LoadingSpinner : undefined}
          >
            {loading ? '저장 중...' : '저장'}
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleEditToggle}
          icon={EditIcon}
        >
          편집
        </Button>
      )}
    </div>
  );

  return (
    <ModalWrapper 
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      error={error}
      headerActions={headerActions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] gap-8">
        
        {/* 왼쪽: 이미지 영역 */}
        <div className="bg-gray-50 p-8 rounded-2xl">
          <div className="space-y-6">
            {/* 이미지 슬라이드 영역 */}
            <div className="aspect-[4/3] bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
              {imageUploading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm font-medium text-gray-600">업로드 중...</p>
                  </div>
                </div>
              ) : currentData.images && Array.isArray(currentData.images) && currentData.images.length > 0 ? (
                <div className="h-full space-y-4 overflow-y-auto p-4">
                  {currentData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={image} 
                          alt={`${currentData.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="w-full h-full hidden items-center justify-center text-gray-400 text-sm bg-gray-100"
                          style={{ display: 'none' }}
                        >
                          이미지 로딩 실패
                        </div>
                      </div>
                      {editMode && (
                        <button
                          onClick={() => handleImageRemove(index)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                        >
                          <XIcon size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ImageIcon}
                  title="서비스 이미지"
                  description="이미지가 없습니다"
                  className="h-full flex items-center justify-center"
                />
              )}
            </div>

            {/* 업로드 버튼 (편집 모드일 때만) */}
            {editMode && (
              <div className="space-y-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading || (Array.isArray(currentData.images) && currentData.images.length >= 3)}
                  variant="outline"
                  icon={UploadIcon}
                  className="w-full"
                >
                  이미지 추가 ({Array.isArray(currentData.images) ? currentData.images.length : 0}/3)
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  최대 3장, 각 1MB 이하의 이미지를 업로드할 수 있습니다
                </p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* 오른쪽: 폼 또는 상세 정보 */}
        <div className="p-8 flex flex-col">
          
          {editMode ? (
            <div className="space-y-8 flex-1">
              <PageHeader 
                title={service.id ? "서비스 편집" : "새 서비스 등록"}
                description="서비스 정보를 입력하세요"
              />

              <div className="space-y-6">
                {/* 카테고리 선택 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-700">
                      서비스 카테고리 <span className="text-red-500">*</span>
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCategoryManagement(!showCategoryManagement)}
                      icon={SettingsIcon}
                    >
                      카테고리 관리
                    </Button>
                  </div>
                  
                  {categoriesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <LoadingSpinner size="sm" />
                      카테고리 로딩 중...
                    </div>
                  ) : (
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleChange}
                      required
                      className="block w-full px-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                    >
                      <option value="">서비스 카테고리를 선택하세요</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {String(category.name || '미분류')} {category._count?.services > 0 && `(${category._count.services}개 서비스)`}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* 카테고리 관리 섹션 */}
                  {showCategoryManagement && (
                    <Card className="bg-gray-50 border-2 border-gray-200">
                      <div className="space-y-6">
                        {/* 기존 카테고리 목록 */}
                        {categories.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-700">기존 카테고리</h4>
                            <div className="space-y-2">
                              {categories.map(category => (
                                <div key={category.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{category.name}</span>
                                    {category._count?.services > 0 && (
                                      <Badge variant="secondary" size="sm" className="ml-2">
                                        {category._count.services}개 서비스
                                      </Badge>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(category.id, category.name)}
                                    disabled={deletingCategory === category.id}
                                    icon={deletingCategory === category.id ? LoadingSpinner : DeleteIcon}
                                  >
                                    {deletingCategory === category.id ? '삭제 중...' : '삭제'}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 새 카테고리 추가 */}
                        <div className="border-t pt-6">
                          <h4 className="text-sm font-bold text-gray-700 mb-4">새 카테고리 추가</h4>
                          {showAddCategory ? (
                            <div className="space-y-3">
                              <Input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="새 카테고리명 입력"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCategory();
                                  }
                                }}
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  onClick={handleAddCategory}
                                  disabled={addingCategory || !newCategoryName.trim()}
                                  variant="primary"
                                  size="sm"
                                  icon={addingCategory ? LoadingSpinner : PlusIcon}
                                  className="flex-1"
                                >
                                  {addingCategory ? '추가 중...' : '추가'}
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => {
                                    setShowAddCategory(false);
                                    setNewCategoryName('');
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  취소
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => setShowAddCategory(true)}
                              variant="outline"
                              icon={PlusIcon}
                              className="w-full"
                            >
                              새 카테고리 추가
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                <Input
                  name="title"
                  label="서비스명"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="서비스명을 입력하세요"
                  required
                />

                <Input
                  name="price"
                  type="number"
                  label="기본 가격"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0"
                  required
                />

                <Textarea
                  name="description"
                  label="상세 설명"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="서비스에 대한 상세한 설명을 입력하세요"
                  rows={4}
                />

                <Input
                  name="duration"
                  label="예상 기간"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="예: 2-3주"
                />

                {/* 플랜 설정 */}
                <Card className="border-2 border-purple-200 bg-purple-50">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="isPlan"
                      checked={formData.isPlan}
                      onChange={handleChange}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2">
                      <PlanIcon size={18} className="text-purple-600" />
                      <label className="text-sm font-semibold text-gray-700">
                        이 서비스를 플랜으로 등록
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 ml-7">
                    같은 카테고리의 플랜 서비스 중 1개만 선택 가능합니다
                  </p>
                </Card>

                {/* 주요 기능 */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">주요 기능</label>
                  <EditableList
                    items={formData.features}
                    onAdd={addFeature}
                    onRemove={removeFeature}
                    addLabel="기능 추가"
                    bgColor="bg-emerald-50"
                    borderColor="border-emerald-400"
                  />
                </div>

                {/* 서비스 활성화 */}
                <Card className="border-2 border-gray-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      {formData.isActive ? (
                        <ActiveIcon size={18} className="text-emerald-600" />
                      ) : (
                        <InactiveIcon size={18} className="text-gray-400" />
                      )}
                      <label className="text-sm font-semibold text-gray-700">
                        서비스 활성화
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 ml-7">
                    비활성화 시 고객에게 노출되지 않습니다
                  </p>
                </Card>
              </div>

              {/* 삭제 버튼 - 편집 모드이고 기존 서비스일 때만 표시 */}
              {service.id && !isTemporaryService && (
                <div className="pt-8 border-t border-gray-200">
                  <Button
                    onClick={handleDelete}
                    disabled={loading}
                    variant="danger"
                    icon={loading ? LoadingSpinner : DeleteIcon}
                    className="w-full"
                  >
                    {loading ? '삭제 중...' : '서비스 삭제'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-8">
                <PageHeader 
                  title="서비스 정보"
                  description="서비스 상세 내용을 확인하세요"
                />

                {/* 서비스 기본 정보 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="primary" icon={CategoryIcon}>
                      {String(currentData.category?.name || '미분류')}
                    </Badge>
                    
                    {getIsPlanValue() && (
                      <Badge variant="secondary" icon={PlanIcon}>
                        플랜 서비스
                      </Badge>
                    )}
                    
                    <Badge variant={currentData.isActive ? 'success' : 'secondary'} 
                           icon={currentData.isActive ? ActiveIcon : InactiveIcon}>
                      {currentData.isActive ? '활성' : '비활성'}
                    </Badge>
                    
                    {currentData.duration && (
                      <Badge variant="info" icon={ClockIcon}>
                        {String(currentData.duration)}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-3xl font-bold text-gray-900">{String(currentData.title)}</h3>
                </div>

                {/* 가격 정보 */}
                <Card className="bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <PriceIcon size={24} className="text-emerald-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">서비스 가격</h4>
                  </div>
                  <div className="text-3xl font-bold text-emerald-700">
                    {formatPrice(currentData.price)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">기본 가격 (부가세 별도)</p>
                </Card>

                {/* 서비스 설명 */}
                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DocumentIcon size={20} className="text-blue-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">서비스 설명</h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {String(currentData.description)}
                  </p>
                </Card>

                {/* 주요 기능 */}
                <SafeFeaturesList features={currentData.features} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}