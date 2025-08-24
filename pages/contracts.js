// pages/contracts.js - 계약 관리 페이지 (간단한 목록 방식)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ContractCard from '../components/contracts/ContractCard';
import { 
  Button, 
  Badge, 
  PageHeader, 
  EmptyState, 
  LoadingSpinner,
  ContractIcon,
  PlusIcon,
  FloatingActionBar
} from '../components/ui/DesignSystem';
import { useAuthContext } from '../contexts/AuthContext';

export default function ContractsPage() {
  const { getAuthHeaders, isAuthenticated, loading, user } = useAuthContext();
  const router = useRouter();
  const [contracts, setContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [selectedContracts, setSelectedContracts] = useState([]);

  const userRole = user?.role || 'customer';

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchContracts();
    }
  }, [isAuthenticated]);

  const fetchContracts = async () => {
    setContractsLoading(true);
    try {
      const response = await fetch('/api/contracts', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setContracts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('계약 조회 실패:', error);
      setContracts([]);
    } finally {
      setContractsLoading(false);
    }
  };

  const handleCreateContract = () => {
    router.push('/quotes?from=contracts');
  };

  const handleContractDetail = (contract) => {
    if (!contract?.id) return;
    router.push(`/contracts/${contract.id}`);
  };

  const handleContractSelect = (contract) => {
    setSelectedContracts(prev => {
      const isSelected = prev.find(c => c.id === contract.id);
      return isSelected ? prev.filter(c => c.id !== contract.id) : [contract];
    });
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

  return (
      <div className="max-w-6xl space-y-8">
        
        {/* 페이지 헤더 */}
        <PageHeader
          title={
            <div className="flex items-center gap-3">
              <span>계약 관리</span>
              <Badge variant="info" icon={ContractIcon}>
                {contracts.length}개
              </Badge>
            </div>
          }
          description="승인된 견적서로 계약서를 생성하고 관리하세요"
          action={
            <Button
              variant="primary"
              onClick={handleCreateContract}
              icon={PlusIcon}
            >
              견적서로 계약 생성
            </Button>
          }
        />

        {/* 계약서 목록 */}
        <div className="space-y-8">
          {contractsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600">계약서 목록 로딩 중...</p>
              </div>
            </div>
          ) : contracts.length === 0 ? (
            <EmptyState
              icon={ContractIcon}
              title="생성된 계약이 없습니다"
              description="승인된 견적서로 계약서를 생성해보세요"
              action={
                <Button
                  variant="primary"
                  onClick={handleCreateContract}
                  icon={PlusIcon}
                >
                  견적서 확인하기
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {contracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  userRole={userRole}
                  onContractDetail={handleContractDetail}
                  isSelected={!!selectedContracts.find(c => c.id === contract.id)}
                  onClick={() => handleContractSelect(contract)}
                />
              ))}
            </div>
          )}
        </div>
        {/* 플로팅 액션바 */}
        {selectedContracts.length > 0 && (
          <FloatingActionBar
            actions={[
              { 
                label: '상세', 
                onClick: () => handleContractDetail(selectedContracts[0]), 
                show: selectedContracts.length === 1 
              },

              { 
                label: '계약서 새로 작성', 
                onClick: handleCreateContract, 
                variant: 'primary' 
              }
            ]}
            onClear={() => setSelectedContracts([])}
          />
        )}
      </div>
  );
}