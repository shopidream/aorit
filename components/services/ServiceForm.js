import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  Input, 
  Textarea, 
  Card, 
  Alert, 
  Badge,
  LoadingSpinner,
  EmptyState
} from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import { normalizeService, extractText } from '../../lib/dataTypes';
import {
  Settings as SettingsIcon,
  Upload as UploadIcon,
  Image as ImageIcon,
  Plus as PlusIcon,
  X as XIcon,
  Trash2 as DeleteIcon,
  Star as StarIcon,
  CheckCircle as ActiveIcon,
  XCircle as InactiveIcon,
  Sparkles as PlanIcon
} from 'lucide-react';

export default function ServiceForm({ onSuccess, initialData = null, isEditMode = false }) {
  const { getAuthHeaders } = useAuthContext();
  const fileInputRef = useRef(null);
  
  const service = normalizeService(initialData);

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
    if (initialData?.isPlan === true || initialData?.isPlan === 1 || initialData?.isPlan === '1') return true;
    if (service?.isPlan === true || service?.isPlan === 1 || service?.isPlan === '1') return true;
    return false;
  };

  const [formData, setFormData] = useState(() => {
    const initialFormData = {
      categoryId: service.category?.id || service.categoryId || initialData?.categoryId || '', 
      title: service.title || '',
      description: service.description || '',
      price: service.price || 0,
      duration: service.duration || '',
      images: service.images || service.image || [],
      features: service.features || [],
      isActive: service.isActive !== undefined ? service.isActive : true,
      isPlan: getIsPlanValue()
    };
    
    return initialFormData;
  });

  // 편집 모드일 때 초기 데이터 설정
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        categoryId: service.category?.id || service.categoryId || initialData?.categoryId || '', 
        title: service.title || '',
        description: service.description || '',
        price: service.price || 0,
        duration: service.duration || '',
        images: typeof service.images === 'string' ? JSON.parse(service.images) : (service.images || []),
        features: service.features || [],
        isActive: service.isActive !== undefined ? service.isActive : true,
        isPlan: getIsPlanValue()
      });
    }
  }, [isEditMode, initialData]);

  const fetchCategories = async () => {
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

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.title || !formData.description) {
      setError('필수 필드를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = isEditMode && initialData?.id ? `/api/services/${initialData.id}` : '/api/services';
      const method = isEditMode && initialData?.id ? 'PUT' : 'POST';
      
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
        onSuccess?.(data);
        
        // 생성 모드일 때만 폼 초기화
        if (!isEditMode) {
          setFormData({
            categoryId: '',
            title: '',
            description: '',
            price: 0,
            duration: '',
            images: [],
            features: [],
            isActive: true,
            isPlan: false
          });
        }
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

  return (
    <div className="space-y-6">
      {error && <Alert type="error">{error}</Alert>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
          <div className="space-y-4">
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
                  className="block w-full px-4 py-3 text-base border border-gray-200 bg-gray-50 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:outline-none transition-all duration-200 hover:border-gray-300"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <Textarea
              name="description"
              label="서비스 소개"
              value={formData.description}
              onChange={handleChange}
              placeholder="서비스에 대한 상세한 설명을 입력하세요"
              rows={4}
              required
            />

            <Input
              name="duration"
              label="예상 기간"
              value={formData.duration}
              onChange={handleChange}
              placeholder="예: 2-3주"
            />
          </div>
        </Card>

        {/* 이미지 업로드 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">서비스 이미지</h3>
          
          {/* 이미지 미리보기 */}
          <div className="mb-6">
            {imageUploading ? (
              <div className="aspect-[4/3] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-sm font-medium text-gray-600">업로드 중...</p>
                </div>
              </div>
            ) : formData.images && Array.isArray(formData.images) && formData.images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={image} 
                        alt={`서비스 이미지 ${index + 1}`}
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
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-[4/3] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                <EmptyState
                  icon={ImageIcon}
                  title="이미지를 추가하세요"
                  description="서비스를 잘 보여줄 수 있는 이미지를 업로드하세요"
                  className="bg-transparent shadow-none border-none"
                />
              </div>
            )}
          </div>

          {/* 업로드 버튼 */}
          <div className="space-y-3">
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading || (Array.isArray(formData.images) && formData.images.length >= 3)}
              variant="outline"
              icon={UploadIcon}
              className="w-full"
            >
              이미지 추가 ({Array.isArray(formData.images) ? formData.images.length : 0}/3)
            </Button>
            <p className="text-xs text-gray-500 text-center">
              최대 3장, 각 1MB 이하의 이미지를 업로드할 수 있습니다
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </Card>

        {/* 주요 기능 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">주요 기능</h3>
          <EditableList
            items={formData.features}
            onAdd={addFeature}
            onRemove={removeFeature}
            addLabel="기능 추가"
            bgColor="bg-emerald-50"
            borderColor="border-emerald-400"
          />
        </Card>

        {/* 서비스 설정 */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">서비스 설정</h3>
          <div className="space-y-4">
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
        </Card>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={loading}
            size="lg"
            className="min-w-32"
          >
            {loading 
              ? `${isEditMode ? '수정' : '등록'} 중...` 
              : `서비스 ${isEditMode ? '수정' : '등록'}`
            }
          </Button>
        </div>
      </form>
    </div>
  );
}