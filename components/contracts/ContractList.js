import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import ContractCard from './ContractCard';

export default function ContractList() {
  const { getAuthHeaders, user } = useAuthContext();
  const router = useRouter();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContracts, setSelectedContracts] = useState([]);

  const userRole = user?.role || 'customer';

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
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
      setLoading(false);
    }
  };

  const handleContractSelect = (contract) => {
    if (!contract?.id) return;
    
    setSelectedContracts(prev => {
      const isSelected = prev.find(c => c.id === contract.id);
      if (isSelected) {
        return prev.filter(c => c.id !== contract.id);
      } else {
        return [...prev, contract];
      }
    });
  };

  const handleContractDetail = (contract) => {
    if (!contract?.id) return;
    router.push(`/contracts/${contract.id}`);
  };

  const handleContractEdit = (contract) => {
    if (!contract?.id) return;
    router.push(`/contracts/${contract.id}?edit=true`);
  };

  const handleBulkAction = (action) => {
    if (selectedContracts.length === 0) return;
    
    switch (action) {
      case 'download':
        alert('다중 계약서 다운로드 기능 준비 중입니다.');
        break;
      case 'archive':
        alert('다중 계약서 아카이브 기능 준비 중입니다.');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">계약서 목록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedContracts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-900">
                선택된 계약서: {selectedContracts.length}개
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('download')}
              >
                일괄 다운로드
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('archive')}
              >
                아카이브
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setSelectedContracts([])}
              >
                선택 해제
              </Button>
            </div>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedContracts.map(contract => (
              <span key={contract.id} className="inline-flex items-center px-3 py-1 text-xs font-medium bg-purple-100 text-purple-600 rounded-full">
                계약서 #{contract.id}
              </span>
            ))}
          </div>
        </Card>
      )}

      {contracts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">생성된 계약이 없습니다</h3>
          <p className="text-gray-600">승인된 견적서로 계약서를 생성해보세요.</p>
          <Button 
            variant="primary" 
            className="mt-4"
            onClick={() => router.push('/quotes?from=contracts')}
          >
            견적서 확인하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              userRole={userRole}
              onContractDetail={handleContractDetail}
              onContractEdit={handleContractEdit}
              isSelected={!!selectedContracts.find(c => c.id === contract.id)}
              onClick={() => handleContractSelect(contract)}
            />
          ))}
        </div>
      )}
    </div>
  );
}