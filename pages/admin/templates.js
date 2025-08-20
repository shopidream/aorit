// pages/admin/templates.js - 템플릿 관리 페이지 (카테고리 수정)
import { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { 
  PageHeader, 
  Card, 
  Button, 
  SearchBox, 
  Badge, 
  Alert,
  LoadingSpinner,
  EmptyState,
  Divider
} from '../../components/ui/DesignSystem';
import { 
  FileText, 
  Upload, 
  Settings, 
  Filter,
  Eye,
  Edit3,
  Trash2,
  BarChart3,
  Users,
  CheckCircle,
  AlertTriangle,
  Plus,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

// 템플릿 카테고리 (순서 변경 및 제조/공급 추가)
let TEMPLATE_CATEGORIES = [
  '용역/프로젝트',
  '파트너십/제휴',
  '거래/구매',
  '제조/공급',  // 새로 추가
  '근로/고용',
  '비밀/보안',
  '투자/자금',
  '기타/일반'
];

export default function TemplatesPage() {
  const { user } = useAuthContext();
  
  // 데이터 상태
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // 필터 및 검색
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // 템플릿 생성 모달
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [templateContent, setTemplateContent] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  
  // 미리보기 및 수정 모달
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    description: '',
    content: ''
  });

  // 새 카테고리 추가 모달
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // 카테고리 순서 조절 모달
  const [showCategoryOrderModal, setShowCategoryOrderModal] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState([...TEMPLATE_CATEGORIES]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('템플릿 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 새 카테고리 추가
  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory = newCategoryName.trim();
    if (!TEMPLATE_CATEGORIES.includes(newCategory)) {
      TEMPLATE_CATEGORIES.push(newCategory);
      setCategoryOrder([...TEMPLATE_CATEGORIES]);
      setNewCategoryName('');
      setShowNewCategoryModal(false);
      alert('새 카테고리가 추가되었습니다!');
    } else {
      alert('이미 존재하는 카테고리입니다.');
    }
  };

  // 카테고리 순서 조절
  const moveCategoryUp = (index) => {
    if (index === 0) return;
    const newOrder = [...categoryOrder];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    setCategoryOrder(newOrder);
  };

  const moveCategoryDown = (index) => {
    if (index === categoryOrder.length - 1) return;
    const newOrder = [...categoryOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setCategoryOrder(newOrder);
  };

  const saveCategoryOrder = () => {
    TEMPLATE_CATEGORIES.length = 0;
    TEMPLATE_CATEGORIES.push(...categoryOrder);
    setShowCategoryOrderModal(false);
    alert('카테고리 순서가 저장되었습니다!');
  };

  // 템플릿 생성
  const handleManualUpload = async () => {
    if (!templateContent.trim() || !templateName.trim()) {
      alert('템플릿 이름과 내용을 입력해주세요.');
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: templateName,
          category: templateCategory || 'general',
          content: templateContent,
          description: `수동 입력으로 생성된 템플릿`
        })
      });

      if (response.ok) {
        alert('템플릿이 성공적으로 생성되었습니다!');
        setShowUploadModal(false);
        setTemplateContent('');
        setTemplateName('');
        setTemplateCategory('');
        fetchTemplates();
      } else {
        const error = await response.json();
        alert(`오류: ${error.error}`);
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 템플릿 삭제
  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('정말로 이 템플릿을 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/templates?id=${templateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('템플릿이 삭제되었습니다.');
        fetchTemplates();
      } else {
        const error = await response.json();
        alert(`삭제 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 미리보기 모달
  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  // 수정 모달
  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setEditFormData({
      name: template.name,
      category: template.category,
      description: template.description || '',
      content: template.content
    });
    setShowEditModal(true);
  };

  // 템플릿 수정 저장
  const handleSaveEdit = async () => {
    if (!editFormData.name.trim() || !editFormData.content.trim()) {
      alert('템플릿 이름과 내용은 필수입니다.');
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/templates?id=${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        alert('템플릿이 수정되었습니다.');
        setShowEditModal(false);
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        const error = await response.json();
        alert(`수정 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('수정 오류:', error);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 필터링된 템플릿 목록
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (

        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>

    );
  }

  return (

      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">템플릿 관리</h1>
            <p className="text-gray-600 mt-1">계약서 템플릿을 관리하고 편집할 수 있습니다.</p>
          </div>
          <Button onClick={() => setShowUploadModal(true)} className="flex items-center space-x-2 w-fit">
            <Plus className="w-4 h-4" />
            <span>템플릿 업로드</span>
          </Button>
        </div>

        {/* 검색 및 필터 */}
        <Card>
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <SearchBox
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="템플릿 이름 또는 설명으로 검색..."
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                >
                  <option value="">모든 카테고리</option>
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewCategoryModal(true)}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  title="새 카테고리 추가"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCategoryOrder([...TEMPLATE_CATEGORIES]);
                    setShowCategoryOrderModal(true);
                  }}
                  className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  title="카테고리 순서 조절"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* 템플릿 목록 */}
        {filteredTemplates.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="템플릿이 없습니다"
            description="새로운 템플릿을 업로드하여 시작하세요."
          >
            <Button onClick={() => setShowUploadModal(true)} className="mt-4">
              템플릿 업로드
            </Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                      <Badge variant="secondary">{template.category}</Badge>
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        className="p-1 text-gray-400 hover:text-blue-600"
                        onClick={() => handlePreviewTemplate(template)}
                        title="미리보기"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-gray-400 hover:text-green-600"
                        onClick={() => handleEditTemplate(template)}
                        title="수정"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-gray-400 hover:text-red-600"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>변수 {template.variables?.length || 0}개</span>
                    <span>사용 {template.usageCount || 0}회</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <Badge variant={template.status === 'active' ? 'success' : 'warning'}>
                        {template.status === 'active' ? '활성' : '비활성'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 카테고리 순서 조절 모달 */}
        {showCategoryOrderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">카테고리 순서 조절</h2>
                <button
                  onClick={() => setShowCategoryOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {categoryOrder.map((category, index) => (
                    <div key={category} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm font-medium text-gray-900">{category}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveCategoryUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="위로 이동"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveCategoryDown(index)}
                          disabled={index === categoryOrder.length - 1}
                          className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="아래로 이동"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setShowCategoryOrderModal(false)}>
                    취소
                  </Button>
                  <Button onClick={saveCategoryOrder}>
                    순서 저장
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 새 카테고리 추가 모달 */}
        {showNewCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">새 카테고리 추가</h2>
                <button
                  onClick={() => setShowNewCategoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 이름</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="예: 제조/공급, 라이선스 등"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">계약서 종류를 나타내는 이름을 입력하세요</p>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowNewCategoryModal(false)}>
                    취소
                  </Button>
                  <Button onClick={handleAddNewCategory} disabled={!newCategoryName.trim()}>
                    추가
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 템플릿 생성 모달 */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">새 템플릿 생성</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 이름 *</label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="예: 웹사이트 개발 용역계약서"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                    <div className="flex gap-2">
                      <select
                        value={templateCategory}
                        onChange={(e) => setTemplateCategory(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">카테고리 선택</option>
                        {TEMPLATE_CATEGORIES.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowNewCategoryModal(true)}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        title="새 카테고리 추가"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 내용 *</label>
                    <textarea
                      value={templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
                      placeholder="기존 계약서 내용을 붙여넣어 주세요.&#10;&#10;예시:&#10;&#10;제 1 조 (계약의 목적)&#10;본 계약은 갑이 을에게 웹사이트 개발을 의뢰하고, 을은 이를 수행함을 목적으로 한다.&#10;&#10;제 2 조 (계약 금액 및 지급방법)&#10;본 계약의 총 금액은 금 3,000,000원정으로 한다.&#10;..."
                      rows={15}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      기존 계약서 내용을 그대로 붙여넣으세요. AI가 자동으로 조항을 분석하고 조항검토 페이지에 추가합니다.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setShowUploadModal(false)} disabled={isUploading}>
                      취소
                    </Button>
                    <Button
                      onClick={handleManualUpload}
                      disabled={isUploading || !templateContent.trim() || !templateName.trim()}
                      className="min-w-[100px]"
                    >
                      {isUploading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          생성 중...
                        </>
                      ) : (
                        '템플릿 생성'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 미리보기 모달 */}
        {showPreviewModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">템플릿 미리보기: {selectedTemplate.name}</h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-700">카테고리</label>
                    <p className="text-sm text-gray-900">{selectedTemplate.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">생성일</label>
                    <p className="text-sm text-gray-900">{new Date(selectedTemplate.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">변수 개수</label>
                    <p className="text-sm text-gray-900">{selectedTemplate.variables?.length || 0}개</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">사용 횟수</label>
                    <p className="text-sm text-gray-900">{selectedTemplate.usageCount || 0}회</p>
                  </div>
                </div>

                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">변수 목록</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedTemplate.variables.map((variable, index) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-sm text-blue-600">{variable.name}</span>
                            <Badge variant="outline">{variable.type}</Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{variable.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTemplate.clauses && selectedTemplate.clauses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">분석된 조항 ({selectedTemplate.clauses.length}개)</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedTemplate.clauses.map((clause, index) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{clause.categoryName || clause.category}</h4>
                            <div className="flex space-x-2">
                              <Badge variant="outline" className="text-xs">
                                신뢰도: {Math.round((clause.confidence || 0) * 100)}%
                              </Badge>
                              <Badge variant={clause.importance === 'high' ? 'destructive' : clause.importance === 'medium' ? 'warning' : 'secondary'}>
                                {clause.importance || 'low'}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-3">{clause.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">템플릿 내용</h3>
                  <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {selectedTemplate.content}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 수정 모달 */}
        {showEditModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">템플릿 수정: {selectedTemplate.name}</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 이름 *</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {TEMPLATE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                    <input
                      type="text"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 내용 *</label>
                    <textarea
                      value={editFormData.content}
                      onChange={(e) => setEditFormData({...editFormData, content: e.target.value})}
                      rows={15}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                    <p className="mt-2 text-sm text-gray-500">내용을 수정하면 조항이 재분석됩니다.</p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={isUploading}>
                      취소
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={isUploading || !editFormData.name.trim() || !editFormData.content.trim()}
                      className="min-w-[100px]"
                    >
                      {isUploading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          저장 중...
                        </>
                      ) : (
                        '저장'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

  );
}