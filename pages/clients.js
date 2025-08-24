// pages/clients.js - 고객 관리 페이지 (ServiceCatalog 패턴 적용)
import React, { useState, useEffect } from 'react';
import ClientForm from '../components/clients/ClientForm';
import ClientCard from '../components/clients/ClientCard';
import { 
  Card, 
  Button, 
  Badge,
  PageHeader,
  LoadingSpinner,
  EmptyState,
  UsersIcon, 
  DocumentIcon, 
  CheckIcon,
  PlusIcon,
  FloatingActionBar
} from '../components/ui/DesignSystem';
import { 
  ArrowLeft,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

// 모던한 Tabs 컴포넌트
const Tabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="border-b border-gray-200 mb-8">
    <nav className="-mb-px flex space-x-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`py-4 px-2 border-b-2 font-semibold text-base transition-all duration-200 ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </div>
        </button>
      ))}
    </nav>
  </div>
);

export default function ClientsPage() {
  const { isAuthenticated, loading, getAuthHeaders } = useAuthContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('list');
  const [clients, setClients] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deletingClient, setDeletingClient] = useState(null);
  const [selectedClients, setSelectedClients] = useState([]);

  // URL 파라미터 확인
  const { from, services } = router.query;
  const isFromServices = from === 'services' && services;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchClients();
    }
  }, [isAuthenticated, refreshKey]);

  const fetchClients = async () => {
    setClientsLoading(true);
    try {
      const response = await fetch('/api/clients', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setClients(data);
      } else {
        console.error('API에서 배열이 아닌 데이터를 받았습니다:', data);
        setClients([]);
      }
    } catch (error) {
      console.error('고객 조회 실패:', error);
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  };

  const handleClientCreated = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('list');
  };

  // 고객 선택/해제
  const handleClientSelect = (client) => {
    console.log('고객 선택:', client.name, client.id);
    setSelectedClients(prev => {
      const isSelected = prev.find(c => c.id === client.id);
      return isSelected ? prev.filter(c => c.id !== client.id) : [client];
    });
  };

  // 상세보기 (편집과 동일)
  const handleClientDetail = (client) => {
    setEditingClient(client);
    setActiveTab('edit');
  };

  const handleClientEdit = (client) => {
    setEditingClient(client);
    setActiveTab('edit');
  };

  // 견적서 작성
  const handleCreateQuote = () => {
    if (selectedClients.length === 0) return;
    
    const client = selectedClients[0];
    
    if (isFromServices) {
      router.push(`/quotes/create?client=${client.id}&services=${services}`);
    } else {
      router.push(`/services?from=clients&client=${client.id}`);
    }
  };

  const handleDeleteClient = async (clientId, clientName) => {
    if (!confirm(`정말로 "${clientName}" 고객을 삭제하시겠습니까?\n\n※ 기존 견적서와 계약서는 보존되며, 고객 목록에서만 삭제됩니다.`)) {
      return;
    }

    setDeletingClient(clientId);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setRefreshKey(prev => prev + 1);
        if (editingClient && editingClient.id === clientId) {
          setEditingClient(null);
          setActiveTab('list');
        }
        setSelectedClients(prev => prev.filter(c => c.id !== clientId));
        alert('고객이 성공적으로 삭제되었습니다.');
      } else {
        const data = await response.json();
        alert(data.error || '고객 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('고객 삭제 오류:', error);
      alert('고객 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingClient(null);
    }
  };

  const handleClientUpdated = () => {
    setRefreshKey(prev => prev + 1);
    setEditingClient(null);
    setActiveTab('list');
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { 
      id: 'list', 
      label: '고객 목록',
      icon: <UsersIcon size={20} />
    },
    ...(editingClient ? [{ 
      id: 'edit', 
      label: '고객 편집',
      icon: <Edit size={20} />
    }] : [])
  ];

  return (
      <div className="max-w-6xl space-y-8">
        
        {/* 페이지 헤더 */}
        <PageHeader
          title={
            <div className="flex items-center gap-3">
              <span>고객 관리</span>
              <Badge variant="info" icon={UsersIcon}>
                {clients.length}명
              </Badge>
            </div>
          }
          description={
            isFromServices 
              ? '견적서 작성을 위해 고객을 선택하세요'
              : '고객 정보를 등록하고 관리하세요'
          }
          action={
            <div className="flex items-center gap-3">
              {isFromServices && (
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                  icon={ArrowLeft}
                  size="sm"
                >
                  서비스 선택으로 돌아가기
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => setActiveTab('create')}
                icon={PlusIcon}
              >
                새 고객 등록
              </Button>
            </div>
          }
        />

        {/* 진행 상황 표시 */}
        {isFromServices && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DocumentIcon size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">견적 작성 진행 중</h3>
                <p className="text-blue-700 text-sm">
                  선택된 서비스: <strong>{services?.split(',').length}개</strong> | 
                  다음 단계: 고객 선택 → 견적서 작성
                </p>
              </div>
            </div>
          </Card>
        )}



        {/* 탭 네비게이션 */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* 탭 콘텐츠 */}
        <div className="min-h-[400px]">
          {activeTab === 'list' && (
            <div className="space-y-8">
              
              {/* 고객 카드 그리드 */}
              {clientsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <LoadingSpinner size="lg" />
                    <p className="text-gray-600">고객 목록 로딩 중...</p>
                  </div>
                </div>
              ) : Array.isArray(clients) && clients.length > 0 ? (
                <div>
                  <div className="border-b border-gray-200 pb-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">등록된 고객</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {clients.map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        onClientDetail={handleClientDetail}
                        onClientEdit={handleClientEdit}
                        isSelected={!!selectedClients.find(c => c.id === client.id)}
                        onClick={() => handleClientSelect(client)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={UsersIcon}
                  title="등록된 고객이 없습니다"
                  description="새 고객을 등록해서 견적서를 작성해보세요"
                  action={
                    <Button
                      variant="primary"
                      onClick={() => setActiveTab('create')}
                      icon={PlusIcon}
                    >
                      첫 고객 등록하기
                    </Button>
                  }
                />
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <Card>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <PlusIcon size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">새 고객 등록</h2>
                    <p className="text-gray-600">고객 정보를 입력해서 등록하세요</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('list')}
                    icon={ArrowLeft}
                  >
                    고객 목록으로 돌아가기
                  </Button>
                </div>
                
                <ClientForm 
                  onSuccess={(newClient) => {
                    handleClientCreated();
                    setSelectedClient(newClient);
                    if (isFromServices) {
                      setTimeout(() => {
                        router.push(`/quotes/create?client=${newClient.id}&services=${services}`);
                      }, 1000);
                    }
                  }} 
                />
                
                {selectedClient && isFromServices && (
                  <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200 mt-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 rounded-xl">
                        <CheckIcon size={24} className="text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-emerald-800 mb-1">등록 완료!</h3>
                        <p className="text-emerald-700">
                          새 고객 '{selectedClient.name}'이 등록되었습니다.
                        </p>
                      </div>
                      <Button 
                        variant="success" 
                        onClick={() => {
                          if (selectedClient && isFromServices) {
                            router.push(`/quotes/create?client=${selectedClient.id}&services=${services}`);
                          } else if (selectedClient) {
                            router.push(`/services?from=clients&client=${selectedClient.id}`);
                          }
                        }}
                        icon={CheckIcon}
                      >
                        이 고객으로 견적서 작성하기
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'edit' && editingClient && (
            <Card>
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Edit size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">고객 정보 편집</h2>
                      <p className="text-gray-600">"{editingClient.name}" 고객의 정보를 수정하세요</p>
                    </div>
                  </div>
                  
                  {/* 삭제 버튼 */}
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDeleteClient(editingClient.id, editingClient.name)}
                    disabled={deletingClient === editingClient.id}
                  >
                    {deletingClient === editingClient.id ? '삭제 중...' : '고객 삭제'}
                  </Button>
                </div>
                
                <div className="mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingClient(null);
                      setActiveTab('list');
                    }}
                    icon={ArrowLeft}
                  >
                    고객 목록으로 돌아가기
                  </Button>
                </div>
                
                <ClientForm 
                  initialData={editingClient}
                  onSuccess={handleClientUpdated}
                  isEditMode={true}
                />
              </div>
            </Card>
          )}
        </div>
        {/* 플로팅 액션바 */}
        {selectedClients.length > 0 && (
          <FloatingActionBar
            actions={[
              { 
                label: '상세', 
                onClick: () => handleClientDetail(selectedClients[0]), 
                show: selectedClients.length === 1 
              },
              { 
                label: isFromServices ? '견적 작성' : '견적서 작성', 
                onClick: handleCreateQuote, 
                variant: 'primary' 
              }
            ]}
            onClear={() => setSelectedClients([])}
          />
        )}
      </div>
  );
}