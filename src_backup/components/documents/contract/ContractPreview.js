// src/components/documents/contract/ContractPreview.js

import React, { useState } from 'react';
import { designSystem, getButtonStyles, getBadgeStyles } from '../../../styles/designSystem';

const ContractPreview = ({ 
  contractData,
  onSave,
  onEdit,
  onSign,
  onDownload,
  isEditable = false,
  showSignature = true
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [signatures, setSignatures] = useState({
    client: false,
    contractor: false
  });

  const handleSign = async (party) => {
    setIsLoading(true);
    try {
      setSignatures(prev => ({ ...prev, [party]: true }));
      if (onSign) await onSign(party);
    } catch (error) {
      console.error('서명 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = () => {
    if (signatures.client && signatures.contractor) return { label: '계약 완료', variant: 'success' };
    if (signatures.client || signatures.contractor) return { label: '서명 대기', variant: 'maintenance' };
    return { label: '서명 필요', variant: 'default' };
  };

  if (!contractData) {
    return (
      <div className={`${designSystem.layout.flexCol} items-center py-16`}>
        <div className="text-6xl mb-4">📄</div>
        <p className={designSystem.typography.h4}>계약서 데이터가 없습니다</p>
      </div>
    );
  }

  const status = getStatus();

  return (
    <div className={designSystem.layout.container}>
      {/* 헤더 */}
      <div className={`${designSystem.layout.flexRow} justify-between items-center mb-8 p-6 bg-white rounded-2xl border`}>
        <div className={designSystem.layout.flexRow}>
          <div>
            <h1 className={designSystem.typography.h2}>계약서 미리보기</h1>
            <p className={designSystem.typography.bodySmall}>
              계약번호: {contractData.contractNumber || 'CT-' + Date.now().toString().slice(-6)}
            </p>
          </div>
          <div className={getBadgeStyles(status.variant)}>
            {status.label}
          </div>
        </div>
        
        <div className={`${designSystem.layout.flexRow} gap-3`}>
          {isEditable && (
            <button onClick={() => onEdit?.(contractData)} className={getButtonStyles('outline')}>
              수정
            </button>
          )}
          <button onClick={() => window.print()} className={getButtonStyles('outline')}>
            인쇄
          </button>
          <button 
            onClick={() => onDownload?.(contractData)} 
            className={getButtonStyles('secondary')}
            disabled={isLoading}
          >
            {isLoading ? '생성 중...' : 'PDF 다운로드'}
          </button>
          {onSave && (
            <button onClick={() => onSave(contractData)} className={getButtonStyles('primary')}>
              저장
            </button>
          )}
        </div>
      </div>

      {/* 계약서 본문 */}
      <div className={`${designSystem.layout.spacingCard} bg-white rounded-2xl border`}>
        {/* 제목 */}
        <div className="text-center mb-12 pb-8 border-b-2 border-gray-900">
          <h1 className={`${designSystem.typography.h1} text-4xl font-bold mb-4`}>
            {contractData.title || '용역계약서'}
          </h1>
          <div className={`${designSystem.layout.flexRow} justify-between mt-6`}>
            <span className={designSystem.typography.bodySmall}>
              계약일자: {contractData.contractDate || new Date().toLocaleDateString('ko-KR')}
            </span>
            <span className={designSystem.typography.bodySmall}>
              계약번호: {contractData.contractNumber || 'CT-' + Date.now().toString().slice(-6)}
            </span>
          </div>
        </div>

        {/* 계약 당사자 */}
        <div className="mb-12">
          <h2 className={`${designSystem.typography.h3} mb-6`}>계약 당사자</h2>
          <div className={`${designSystem.layout.grid} md:grid-cols-2 gap-8`}>
            <div className={`${designSystem.form.fieldset} bg-gray-50`}>
              <h3 className={`${designSystem.typography.h4} mb-4`}>발주자 (갑)</h3>
              <div className={designSystem.layout.spacingCard}>
                <div><strong>회사명:</strong> {contractData.client?.company || '(주)회사이름'}</div>
                <div><strong>대표자:</strong> {contractData.client?.representative || '대표자명'}</div>
                <div><strong>연락처:</strong> {contractData.client?.phone || '010-0000-0000'}</div>
                <div><strong>이메일:</strong> {contractData.client?.email || 'client@company.com'}</div>
              </div>
            </div>

            <div className={`${designSystem.form.fieldset} bg-gray-50`}>
              <h3 className={`${designSystem.typography.h4} mb-4`}>수급자 (을)</h3>
              <div className={designSystem.layout.spacingCard}>
                <div><strong>회사명:</strong> {contractData.contractor?.company || '수급자 회사명'}</div>
                <div><strong>대표자:</strong> {contractData.contractor?.representative || '대표자명'}</div>
                <div><strong>연락처:</strong> {contractData.contractor?.phone || '010-0000-0000'}</div>
                <div><strong>이메일:</strong> {contractData.contractor?.email || 'contractor@company.com'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 계약 목적 */}
        <div className="mb-8">
          <p className={`${designSystem.typography.body} text-center`}>
            상기 당사자들은 <strong>{contractData.project?.title || '프로젝트명'}</strong>에 관한 용역계약을 다음과 같이 체결한다.
          </p>
        </div>

        {/* 주요 조항들 */}
        <div className={designSystem.layout.spacingSection}>
          {/* 제1조 용역의 내용 */}
          <div className="mb-8">
            <h3 className={`${designSystem.typography.h4} mb-4`}>제1조 (용역의 내용 및 범위)</h3>
            <div className="border-l-4 border-violet-500 bg-violet-50 pl-6 py-4">
              <p className={designSystem.typography.body}>
                갑은 을에게 다음 용역을 위탁하고, 을은 이를 성실히 수행하기로 한다.
              </p>
              {contractData.services && (
                <ul className="mt-4 space-y-2">
                  {contractData.services.map((service, index) => (
                    <li key={index} className={`${designSystem.typography.body} flex items-start`}>
                      <span className="mr-2">•</span>
                      <span>{service.name}: {service.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 제2조 계약기간 */}
          <div className="mb-8">
            <h3 className={`${designSystem.typography.h4} mb-4`}>제2조 (계약기간)</h3>
            <div className="border-l-4 border-emerald-500 bg-emerald-50 pl-6 py-4">
              <p className={designSystem.typography.body}>
                본 계약의 이행기간은 
                <strong> {contractData.project?.startDate || '시작일'}부터 {contractData.project?.endDate || '완료일'}까지</strong>로 한다.
              </p>
            </div>
          </div>

          {/* 제3조 계약금액 */}
          <div className="mb-8">
            <h3 className={`${designSystem.typography.h4} mb-4`}>제3조 (계약금액 및 지급방법)</h3>
            <div className="border-l-4 border-orange-500 bg-orange-50 pl-6 py-4">
              <p className={designSystem.typography.body}>
                본 계약의 총 대금은 <strong className="text-xl text-orange-700">
                  {new Intl.NumberFormat('ko-KR').format(contractData.calculation?.total || 0)}원
                </strong> (부가세 포함)으로 한다.
              </p>
              
              <div className="mt-4">
                {contractData.paymentTerms === 'installment' ? (
                  <div className="space-y-2">
                    <div>• 계약금 (30%): {new Intl.NumberFormat('ko-KR').format(Math.round((contractData.calculation?.total || 0) * 0.3))}원 - 계약 체결 시</div>
                    <div>• 중간금 (40%): {new Intl.NumberFormat('ko-KR').format(Math.round((contractData.calculation?.total || 0) * 0.4))}원 - 중간 산출물 인도 시</div>
                    <div>• 잔금 (30%): {new Intl.NumberFormat('ko-KR').format(Math.round((contractData.calculation?.total || 0) * 0.3))}원 - 최종 완료 후 7일 이내</div>
                  </div>
                ) : (
                  <div>• 일괄 지급: {new Intl.NumberFormat('ko-KR').format(contractData.calculation?.total || 0)}원 - 완료 후 7일 이내</div>
                )}
              </div>
            </div>
          </div>

          {/* 제4조 기타 조건 */}
          <div className="mb-8">
            <h3 className={`${designSystem.typography.h4} mb-4`}>제4조 (기타 조건)</h3>
            <div className="border-l-4 border-blue-500 bg-blue-50 pl-6 py-4 space-y-2">
              <p>• 수정 횟수: {contractData.revisionLimit || 3}회</p>
              <p>• 납품 방식: {contractData.deliveryMethod === 'digital' ? '디지털 파일' : contractData.deliveryMethod === 'physical' ? '실물 배송' : '디지털 + 실물'}</p>
              <p>• 보증 기간: {contractData.warrantyPeriod || 30}일</p>
            </div>
          </div>
        </div>

        {/* 서명란 */}
        {showSignature && (
          <div className="mt-16 pt-8 border-t-2 border-gray-900">
            <h3 className={`${designSystem.typography.h3} text-center mb-8`}>계약당사자</h3>
            
            <div className={`${designSystem.layout.grid} md:grid-cols-2 gap-12`}>
              <div className="text-center">
                <h4 className={`${designSystem.typography.h4} mb-6`}>발주자 (갑)</h4>
                <div className={`${designSystem.form.fieldset} h-32 flex flex-col justify-between`}>
                  <div>
                    <p>회사명: {contractData.client?.company || '(주)회사이름'}</p>
                    <p>대표자: {contractData.client?.representative || '대표자명'}</p>
                  </div>
                  
                  {signatures.client ? (
                    <div className={`${designSystem.colors.status.success} p-4 rounded-lg`}>
                      <p>✓ 서명 완료: {new Date().toLocaleDateString('ko-KR')}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSign('client')}
                      disabled={isLoading}
                      className={getButtonStyles('primary')}
                    >
                      서명하기
                    </button>
                  )}
                </div>
              </div>

              <div className="text-center">
                <h4 className={`${designSystem.typography.h4} mb-6`}>수급자 (을)</h4>
                <div className={`${designSystem.form.fieldset} h-32 flex flex-col justify-between`}>
                  <div>
                    <p>회사명: {contractData.contractor?.company || '수급자 회사명'}</p>
                    <p>대표자: {contractData.contractor?.representative || '대표자명'}</p>
                  </div>
                  
                  {signatures.contractor ? (
                    <div className={`${designSystem.colors.status.success} p-4 rounded-lg`}>
                      <p>✓ 서명 완료: {new Date().toLocaleDateString('ko-KR')}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSign('contractor')}
                      disabled={isLoading}
                      className={getButtonStyles('primary')}
                    >
                      서명하기
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractPreview;