// components/contracts/ContractCard.js - 디자인 개선 및 지불조건 동기화
import React from 'react';
import { Card, Badge, Button } from '../ui/DesignSystem';
import { ClockIcon } from '../ui/DesignSystem';
import { formatPrice } from '../../lib/dataTypes';

export default function ContractCard({ 
  contract, 
  userRole, 
  onContractDetail,
  onContractEdit,
  isSelected = false,
  onClick
}) {
  const canEdit = ['admin', 'user', 'freelancer'].includes(userRole);

  // 상태별 설정 - 통일된 색상 체계
  const getStatusVariant = (status) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'pending': return 'warning';
      case 'active': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'draft': return '초안';
      case 'pending': return '서명 대기';
      case 'active': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  // 서명 정보
  const getSignatureInfo = () => {
    const signatures = contract.signatures || [];
    const freelancerSigned = signatures.some(s => s.signerType === 'freelancer' || s.signerType === 'provider');
    const clientSigned = signatures.some(s => s.signerType === 'client');
    
    if (freelancerSigned && clientSigned) {
      return { 
        text: '양방 서명 완료', 
        variant: 'success',
        signedDate: signatures.find(s => s.signerType === 'client')?.signedAt || 
                   signatures.find(s => s.signerType === 'freelancer')?.signedAt
      };
    }
    if (freelancerSigned || clientSigned) {
      return { 
        text: '부분 서명', 
        variant: 'warning',
        signedDate: signatures[0]?.signedAt
      };
    }
    return { 
      text: '서명 대기', 
      variant: 'secondary',
      signedDate: null
    };
  };

  const signatureInfo = getSignatureInfo();

  // 지불조건 파싱 개선 - 견적서에서 가져오기
  const getPaymentInfo = () => {
    // 먼저 견적서의 metadata에서 확인
    if (contract.quote?.metadata) {
      try {
        const quoteMetadata = JSON.parse(contract.quote.metadata);
        const paymentTerms = quoteMetadata.paymentTerms || {};
        
        if (paymentTerms.type === 'installment' && paymentTerms.schedule && Array.isArray(paymentTerms.schedule)) {
          const validPayments = paymentTerms.schedule.filter(p => p.percentage > 0);
          const totalPayments = validPayments.length;
          const firstPayment = validPayments.find(p => p.order === 1) || validPayments[0];
          
          if (totalPayments === 1) {
            return '일시불 (완료 후 지급)';
          } else {
            return `${totalPayments}회 분할 (1차: ${firstPayment?.percentage || 0}%)`;
          }
        } else if (paymentTerms.type === 'full') {
          if (paymentTerms.dueDate) {
            const dueDate = new Date(paymentTerms.dueDate).toLocaleDateString('ko-KR');
            return `일시불 (${dueDate})`;
          } else {
            return '일시불 (완료 후 지급)';
          }
        }
      } catch (e) {
        console.error('견적서 지불조건 파싱 오류:', e);
      }
    }
    
    // 백업: 계약서 자체 metadata 확인
    if (contract.metadata) {
      try {
        const metadata = JSON.parse(contract.metadata);
        const paymentTerms = metadata.paymentTerms || {};
        
        if (paymentTerms.type === 'installment' && paymentTerms.schedule && Array.isArray(paymentTerms.schedule)) {
          const totalPayments = paymentTerms.schedule.length;
          const firstPayment = paymentTerms.schedule.find(p => p.order === 1) || paymentTerms.schedule[0];
          return `${totalPayments}회 분할 (1차: ${firstPayment?.percentage || 0}%)`;
        } else if (paymentTerms.type === 'full') {
          if (paymentTerms.dueDate) {
            const dueDate = new Date(paymentTerms.dueDate).toLocaleDateString('ko-KR');
            return `일시불 (${dueDate})`;
          } else {
            return '일시불 (완료 후 지급)';
          }
        }
      } catch (e) {
        console.error('계약서 지불조건 파싱 오류:', e);
      }
    }
    
    return '지불조건 미정';
  };

  // 계약 제목 생성 (무엇을 계약했는지 명확하게)
  const getContractTitle = () => {
    // 1. 계약서 제목이 있으면 우선 사용
    if (contract.title && contract.title.trim()) {
      return contract.title;
    }
    
    // 2. 견적서 제목 사용
    if (contract.quote?.title && contract.quote.title.trim()) {
      return contract.quote.title;
    }
    
    // 3. 서비스 제목 사용
    if (contract.quote?.service?.title) {
      return `${contract.quote.service.title} 계약`;
    }
    
    // 4. 기본값
    return '서비스 계약';
  };

  return (
    <Card 
      hover={true}
      selected={isSelected}
      className="h-full flex flex-col relative"
      onClick={onClick}
    >
      {/* 계약서 번호 - 우측 상단에 작게 */}
      <div className="absolute top-4 right-4">
        <Badge variant="secondary" size="sm" className="text-xs">
          #{contract.id}
        </Badge>
      </div>

      {/* 메인 제목 - 무엇을 계약했는지 */}
      <div className="mb-4 pr-16"> {/* 우측 여백으로 번호와 겹치지 않게 */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
          {getContractTitle()}
        </h3>
      </div>

      {/* 고객 회사명 - 두 번째로 중요 */}
      <div className="mb-4">
        <div className="text-lg font-semibold text-emerald-700">
          {contract.client?.company || contract.client?.name || '고객 정보 없음'}
        </div>
        {contract.client?.company && contract.client?.name && (
          <div className="text-sm text-gray-600 mt-1">
            담당: {contract.client.name}
          </div>
        )}
      </div>

      {/* 계약 금액 - 세 번째로 중요 */}
      <div className="mb-6">
        <div className="text-2xl font-bold text-blue-600">
          {formatPrice(contract.amount || contract.quote?.amount || 0)}
        </div>
        <div className="text-xs text-gray-500 mt-1">부가세 별도</div>
      </div>

      {/* 지불조건 */}
      <div className="mb-6 flex-1">
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <span className="font-medium text-gray-700">지불조건: </span>
          {getPaymentInfo()}
        </div>
      </div>

      {/* 상태 및 날짜 */}
      <div className="flex items-center justify-between mb-4">
        <Badge 
          variant={getStatusVariant(contract.status)}
          size="sm"
        >
          {getStatusLabel(contract.status)}
        </Badge>
        
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <ClockIcon size={14} />
          {new Date(contract.createdAt).toLocaleDateString('ko-KR')}
        </div>
      </div>

      {/* 서명 상태 */}
      <div className="flex items-center justify-between mb-6">
        <Badge 
          variant={signatureInfo.variant}
          size="sm"
        >
          {signatureInfo.text}
        </Badge>
        
        {signatureInfo.signedDate && (
          <div className="text-xs text-gray-500">
            서명: {new Date(signatureInfo.signedDate).toLocaleDateString('ko-KR')}
          </div>
        )}
      </div>

      {/* 선택 상태 표시 */}
      {isSelected && (
        <div className="mb-4">
          <Badge variant="primary" size="sm">
            선택됨
          </Badge>
        </div>
      )}

      {/* 하단 버튼 영역 */}
      <div className="flex gap-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onContractDetail?.(contract);
          }}
        >
          상세보기
        </Button>
        
        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onContractEdit?.(contract);
            }}
          >
            편집
          </Button>
        )}
      </div>
    </Card>
  );
}