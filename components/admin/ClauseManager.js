// components/admin/ClauseManager.js - 조항 관리 컴포넌트 (DB 기반 동적 카테고리)
import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { 
  Card, 
  Button, 
  SearchBox, 
  Badge, 
  Alert,
  LoadingSpinner,
  EmptyState,
  Divider,
  Input,
  Textarea,
  Select
} from '../ui/DesignSystem';
import { 
  FileText, 
  Edit3, 
  Trash2,
  Plus,
  Save,
  X,
  Eye,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3,
  Tag,
  Code
} from 'lucide-react';

const TEMPLATE_TYPES = {
  standard: { name: '표준', color: 'primary' },
  flexible: { name: '유연', color: 'success' }
};

const INDUSTRIES = {
  general: '일반',
  technology: '기술',
  creative: '창작',
  marketing: '마케팅',
  consulting: '컨설팅',
  retail: '소매',
  restaurant: '요식업',
  beauty: '뷰티',
  fitness: '피트니스',
  education: '교육',
  medical: '의료',
  finance: '금융'
};

const COMPLEXITY_LEVELS = {
  simple: '간단',
  standard: '표준',
  complex: '복잡'
};

export default function ClauseManager({ onClauseUpdate }) {
  const { getAuthHeaders } = useAuthContext();
  
  const [clauses, setClauses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClause, setSelectedClause] = useState(null);
  const [saving, setSaving] = useState(false);

  // 동적 카테고리 로드
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    type: 'standard',
    industry: 'general',
    complexity: 'standard',
    tags: '',
    variables: ''
  });

  // 카테고리 로드
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch('/api/admin/categories?level=1', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const categoryList = data.categories || [];
        setCategories(categoryList);
        
        // 첫 번째 카테고리를 기본값으로 설정
        if (categoryList.length > 0 && !formData.category) {
          setFormData(prev => ({ 
            ...prev, 
            category: categoryList[0].name 
          }));
        }
      } else {
        console.error('카테고리 로드 실패');
        setCategories([]);
      }
    } catch (error) {
      console.error('카테고리 로드 오류:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    loadCategories();
    loadClauses();
  }, [loadCategories]);

  const loadClauses = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/clauses/templates', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setClauses(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '조항을 불러올 수 없습니다');
        setClauses([]);
      }
    } catch (error) {
      console.error('조항 로드 오류:', error);
      setError('조항을 불러오는데 실패했습니다');
      setClauses([]);
    } finally {
      setLoading(false);
    }
  };

  // 카테고리명 찾기 헬퍼 함수
  const getCategoryName = useCallback((categoryKey) => {
    if (!categories.length) return categoryKey;
    
    const category = categories.find(cat => 
      cat.name === categoryKey || 
      cat.id === categoryKey ||
      cat.name.includes(categoryKey)
    );
    
    return category ? category.name : categoryKey;
  }, [categories]);

  const filteredClauses = clauses.filter(clause => {
    if (!clause) return false;
    
    const matchesSearch = (clause.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (clause.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
                           clause.category === categoryFilter ||
                           getCategoryName(clause.category) === categoryFilter;
    
    const matchesType = typeFilter === 'all' || clause.type === typeFilter;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: categories.length > 0 ? categories[0].name : '',
      type: 'standard',
      industry: 'general',
      complexity: 'standard',
      tags: '',
      variables: ''
    });
  };

  const handleCreate = () => {
    resetForm();
    setSelectedClause(null);
    setShowCreateModal(true);
  };

  const handleEdit = (clause) => {
    if (!clause) return;
    
    setSelectedClause(clause);
    setFormData({
      title: clause.title || '',
      content: clause.content || '',
      category: clause.category || (categories.length > 0 ? categories[0].name : ''),
      type: clause.type || 'standard',
      industry: clause.industry || 'general',
      complexity: clause.complexity || 'standard',
      tags: Array.isArray(clause.tags) ? clause.tags.join(', ') : 
            (typeof clause.tags === 'string' ? clause.tags : ''),
      variables: Array.isArray(clause.variables) ? clause.variables.join(', ') : 
                (typeof clause.variables === 'string' ? clause.variables : '')
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('제목과 내용은 필수입니다');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const variablesArray = formData.variables.split(',').map(variable => variable.trim()).filter(variable => variable);

      const payload = {
        ...formData,
        tags: tagsArray,
        variables: variablesArray
      };

      const url = selectedClause 
        ? `/api/admin/clauses/templates/${selectedClause.id}`
        : '/api/admin/clauses/templates';
      
      const method = selectedClause ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const savedClause = await response.json();
        
        if (selectedClause) {
          setClauses(prev => prev.map(c => c.id === selectedClause.id ? savedClause : c));
        } else {
          setClauses(prev => [savedClause, ...prev]);
        }
        
        setShowCreateModal(false);
        setShowEditModal(false);
        resetForm();
        setSelectedClause(null);
        
        if (onClauseUpdate) {
          onClauseUpdate();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || '저장에 실패했습니다');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      setError('저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (clauseId) => {
    if (!clauseId || !confirm('이 조항을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/clauses/templates/${clauseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setClauses(prev => prev.filter(c => c.id !== clauseId));
        
        if (onClauseUpdate) {
          onClauseUpdate();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || '삭제에 실패했습니다');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      setError('삭제 중 오류가 발생했습니다');
    }
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedClause(null);
    resetForm();
    setError('');
  };

  if (categoriesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">카테고리를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 헤더 및 액션 */}
      <Card className="bg-white/70 backdrop-blur-sm border-white/20">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <SearchBox
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="조항 제목이나 내용으로 검색..."
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              disabled={categoriesLoading}
              className="px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:outline-none transition-all duration-200 disabled:opacity-50"
            >
              <option value="all">모든 카테고리</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:outline-none transition-all duration-200"
            >
              <option value="all">모든 타입</option>
              <option value="standard">표준</option>
              <option value="flexible">유연</option>
            </select>

            <Button
              variant="primary"
              icon={Plus}
              onClick={handleCreate}
              disabled={categoriesLoading}
            >
              새 조항
            </Button>
          </div>
        </div>
      </Card>

      {/* 조항 목록 */}
      {loading ? (
        <Card className="bg-white/70 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">조항을 불러오는 중...</span>
          </div>
        </Card>
      ) : filteredClauses.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="조항이 없습니다"
          description="새로운 조항을 추가하거나 검색 조건을 변경해보세요."
          action={
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleCreate}
              disabled={categoriesLoading}
            >
              첫 조항 추가
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredClauses.map((clause) => {
            if (!clause || !clause.id) return null;
            
            return (
              <Card 
                key={clause.id}
                className="bg-white/70 backdrop-blur-sm border-white/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{clause.title}</h3>
                      <Badge variant={TEMPLATE_TYPES[clause.type]?.color || 'secondary'}>
                        {TEMPLATE_TYPES[clause.type]?.name || clause.type}
                      </Badge>
                      <Badge variant="secondary">
                        {getCategoryName(clause.category)}
                      </Badge>
                      {clause.industry && clause.industry !== 'general' && (
                        <Badge variant="info">
                          {INDUSTRIES[clause.industry] || clause.industry}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {(clause.content || '').substring(0, 200)}...
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span className="flex items-center">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        사용 {clause.usageCount || 0}회
                      </span>
                      <span className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        신뢰도 {Math.round((clause.confidence || 1) * 100)}%
                      </span>
                      {clause.complexity && (
                        <span>복잡도: {COMPLEXITY_LEVELS[clause.complexity] || clause.complexity}</span>
                      )}
                      <span>수정: {clause.updatedAt ? new Date(clause.updatedAt).toLocaleDateString() : '알 수 없음'}</span>
                    </div>

                    {/* 태그 표시 */}
                    {clause.tags && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(Array.isArray(clause.tags) ? clause.tags : []).map((tag, index) => (
                          <Badge key={index} variant="secondary" size="sm">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={() => {/* 미리보기 기능 */}}
                    >
                      보기
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit3}
                      onClick={() => handleEdit(clause)}
                    >
                      편집
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDelete(clause.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 결과 요약 */}
      {!loading && filteredClauses.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-white/20">
          <div className="text-center text-gray-600">
            전체 {clauses.length}개 중 {filteredClauses.length}개 조항 표시
          </div>
        </Card>
      )}

      {/* 조항 생성/편집 모달 */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-white/90 backdrop-blur-sm border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedClause ? '조항 편집' : '새 조항 추가'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                icon={X}
                onClick={closeModals}
              />
            </div>
            
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="조항 제목"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="조항 제목을 입력하세요"
                  required
                />
                
                <Select
                  label="카테고리"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  disabled={categoriesLoading || categories.length === 0}
                  required
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="조항 타입"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  required
                >
                  <option value="standard">표준</option>
                  <option value="flexible">유연</option>
                </Select>

                <Select
                  label="적용 업종"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                >
                  {Object.entries(INDUSTRIES).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </Select>

                <Select
                  label="복잡도"
                  value={formData.complexity}
                  onChange={(e) => setFormData(prev => ({ ...prev, complexity: e.target.value }))}
                >
                  {Object.entries(COMPLEXITY_LEVELS).map(([key, name]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </Select>
              </div>

              {/* 조항 내용 */}
              <Textarea
                label="조항 내용"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="조항 내용을 입력하세요. {{변수명}} 형태로 변수를 사용할 수 있습니다."
                rows={8}
                required
              />

              {/* 태그 및 변수 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="태그"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="태그를 쉼표로 구분하여 입력 (예: 웹개발, 이커머스)"
                  helpText="검색 및 분류에 사용됩니다"
                />
                
                <Input
                  label="변수"
                  value={formData.variables}
                  onChange={(e) => setFormData(prev => ({ ...prev, variables: e.target.value }))}
                  placeholder="변수를 쉼표로 구분하여 입력 (예: contractAmount, clientName)"
                  helpText="템플릿에서 치환될 변수들"
                />
              </div>
            </div>
            
            {/* 액션 버튼 */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={closeModals}
                disabled={saving}
              >
                취소
              </Button>
              <Button
                variant="primary"
                icon={Save}
                onClick={handleSave}
                disabled={saving || !formData.title.trim() || !formData.content.trim() || categoriesLoading}
              >
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}