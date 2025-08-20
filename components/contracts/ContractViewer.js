// components/contracts/ContractViewer.js - 개선된 계약서 뷰어 컴포넌트

import React, { useState } from 'react';
import { Card, Badge, Button } from '../ui/DesignSystem';
import { generateSimpleContractHTML } from '../../lib/contractGenerator';
import { FileText, Download, Send, Eye, EyeOff, AlertCircle, CheckCircle, Clock, User, Building } from 'lucide-react';

export default function ContractViewer({ contract }) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [expandedClauses, setExpandedClauses] = useState(new Set());

  if (!contract) {
    return (
      <div className="flex items-center justify-center p-12 bg-gray-50 rounded-lg">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">계약서 정보가 없습니다</p>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    const configs = {
      draft: { color: 'secondary', text: '초안', icon: Clock },
      pending: { color: 'warning', text: '서명 대기', icon: Clock },
      active: { color: 'success', text: '진행중', icon: CheckCircle },
      completed: { color: 'info', text: '완료', icon: CheckCircle },
      cancelled: { color: 'error', text: '취소됨', icon: AlertCircle }
    };
    return configs[status] || configs.draft;
  };

  const statusConfig = getStatusConfig(contract.status);
  const StatusIcon = statusConfig.icon;

  const hasAllSignatures = () => {
    const signatures = contract.signatures || [];
    const hasFreelancer = signatures.some(s => s.signerType === 'freelancer' || s.signerType === 'provider');
    const hasClient = signatures.some(s => s.signerType === 'client');
    return hasFreelancer && hasClient;
  };

  const downloadContract = () => {
    if (contract.content) {
      try {
        const contractData = typeof contract.content === 'string' ? 
          JSON.parse(contract.content) : contract.content;
        
        const html = generateSimpleContractHTML(contractData);
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `계약서_${contract.id}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('다운로드 실패:', error);
        alert('계약서 다운로드 중 오류가 발생했습니다.');
      }
    }
  };

  const toggleClauseExpansion = (clauseId) => {
    const newExpanded = new Set(expandedClauses);
    if (newExpanded.has(clauseId)) {
      newExpanded.delete(clauseId);
    } else {
      newExpanded.add(clauseId);
    }
    setExpandedClauses(newExpanded);
  };

  const contractData = typeof contract.content === 'string' ? 
    JSON.parse(contract.content) : contract.content;
  
  const metadata = contractData?.metadata || {};
  const contractInfo = contractData?.contractInfo || {};
  const selectedClauses = contractData?.clauses || contract.clauses || [];
  const paymentSchedule = contractData?.paymentSchedule || {};

  // 견적서 동기화 정보 확인
  const isQuoteSync = metadata?.quoteIntegration?.paymentSync || false;
  const vatExcluded = metadata?.quoteIntegration?.vatExcluded || false;

  // 계약 정보 통합 (실제 계약서 데이터 우선)
  const getContractTitle = () => {
    return contractInfo.title || 
           contractData?.title || 
           `${contractInfo.project?.title || '서비스'} 계약서`;
  };

  const getContractAmount = () => {
    return contractInfo.project?.totalAmount || 
           contractInfo.project?.amount || 
           contractData?.totalAmount ||
           contract.quote?.amount || 
           0;
  };

  const getContractDate = () => {
    return contractData?.contractDate || 
           new Date(contract.createdAt).toLocaleDateString('ko-KR').replace(/\./g, '. ');
  };

  const getClientInfo = () => {
    return {
      name: contractInfo.client?.name || contract.client?.name || '발주자',
      email: contractInfo.client?.email || contract.client?.email,
      phone: contractInfo.client?.phone || contract.client?.phone,
      company: contractInfo.client?.company || contract.client?.company
    };
  };

  const getProviderInfo = () => {
    return {
      name: contractInfo.provider?.name || 'ShopIDream',
      email: contractInfo.provider?.email || 'cs@shopidream.com',
      phone: contractInfo.provider?.phone || '02-1234-5678',
      address: contractInfo.provider?.address
    };
  };

  const formatAmountWithVAT = (amount) => {
    const formattedAmount = amount.toLocaleString();
    return vatExcluded ? `${formattedAmount}원 (부가세 별도)` : `${formattedAmount}원`;
  };

  const clientInfo = getClientInfo();
  const providerInfo = getProviderInfo();

  return (
    <div className="space-y-6">
      {/* 계약서 헤더 */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <FileText className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              {getContractTitle()}
            </h1>
          </div>
          
          <div className="flex justify-center items-center gap-4 mb-4">
            <span className="text-sm text-gray-600">계약번호: #{contract.id}</span>
            <Badge variant={statusConfig.color} className="flex items-center space-x-1">
              <StatusIcon className="w-3 h-3" />
              <span>{statusConfig.text}</span>
            </Badge>
            {hasAllSignatures() && (
              <Badge variant="success" className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>서명완료</span>
              </Badge>
            )}
            {isQuoteSync && (
              <Badge variant="info" className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>견적서 동기화</span>
              </Badge>
            )}
          </div>

          <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
            <div>계약일: {getContractDate()}</div>
            {metadata.contractLength && (
              <div>계약서 유형: {metadata.contractLength}</div>
            )}
            {metadata.riskLevel && (
              <div>위험도: {metadata.riskLevel}</div>
            )}
          </div>
        </div>

        <div className="flex justify-center space-x-3">
          <Button onClick={downloadContract} variant="outline" size="sm" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>계약서 다운로드</span>
          </Button>
          
          <Button 
            onClick={() => setShowFullContent(!showFullContent)} 
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
          >
            {showFullContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showFullContent ? '요약 보기' : '전체 보기'}</span>
          </Button>
        </div>
      </Card>

      {/* 계약 내용 (견적서와 동기화) */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 text-lg flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          계약 내용
        </h3>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">서비스명</div>
              <div className="font-bold text-gray-900 text-lg">
                {contractInfo.project?.title || contractInfo.project?.services?.[0]?.name || '서비스 계약'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">계약금액</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatAmountWithVAT(getContractAmount())}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">계약일자</div>
              <div className="font-bold text-gray-900 text-lg">
                {getContractDate()}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 지급 조건 (견적서 동기화) */}
      {paymentSchedule && Object.keys(paymentSchedule).length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 text-lg flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            지급 조건
            {isQuoteSync && (
              <Badge variant="info" size="sm" className="ml-2">견적서 연동</Badge>
            )}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentSchedule.downRate > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-blue-600 font-bold text-lg">{paymentSchedule.downRate}%</div>
                <div className="text-sm text-gray-600">계약금</div>
                <div className="text-sm font-medium">{paymentSchedule.downAmount?.toLocaleString()}원</div>
              </div>
            )}
            
            {paymentSchedule.middleRate > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-yellow-600 font-bold text-lg">{paymentSchedule.middleRate}%</div>
                <div className="text-sm text-gray-600">중도금</div>
                <div className="text-sm font-medium">{paymentSchedule.middleAmount?.toLocaleString()}원</div>
              </div>
            )}
            
            {paymentSchedule.finalRate > 0 && (
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-green-600 font-bold text-lg">{paymentSchedule.finalRate}%</div>
                <div className="text-sm text-gray-600">
                  {paymentSchedule.downRate === 0 && paymentSchedule.middleRate === 0 ? '전액' : '잔금'}
                </div>
                <div className="text-sm font-medium">{paymentSchedule.finalAmount?.toLocaleString()}원</div>
              </div>
            )}
          </div>
          
          {vatExcluded && (
            <div className="mt-4 text-center">
              <Badge variant="warning" size="sm">모든 금액은 부가세 별도입니다</Badge>
            </div>
          )}
        </Card>
      )}

      {/* 계약 요약 */}
      {!showFullContent && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 text-lg flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            계약 요약
          </h3>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
            <div className="grid md:grid-cols-2 gap-6 text-center">
              <div>
                <div className="text-sm text-gray-600">작업 기간</div>
                <div className="font-semibold text-gray-900">
                  {contractInfo.project?.duration || '30일'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">계약서 길이</div>
                <div className="font-semibold text-gray-900">
                  {metadata.lengthOption?.name || '표준형'} ({selectedClauses.length}개 조항)
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 당사자 정보 */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 text-lg">계약 당사자</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-blue-700 flex items-center">
              <User className="w-4 h-4 mr-2" />
              발주자 (갑)
            </h4>
            <div className="space-y-2 text-sm">
              <div><strong>이름:</strong> {clientInfo.name}</div>
              {clientInfo.email && (
                <div><strong>이메일:</strong> {clientInfo.email}</div>
              )}
              {clientInfo.phone && (
                <div><strong>연락처:</strong> {clientInfo.phone}</div>
              )}
              {clientInfo.company && (
                <div className="flex items-center">
                  <Building className="w-3 h-3 mr-1" />
                  <strong>회사:</strong> {clientInfo.company}
                </div>
              )}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-purple-700 flex items-center">
              <User className="w-4 h-4 mr-2" />
              수행자 (을)
            </h4>
            <div className="space-y-2 text-sm">
              <div><strong>이름:</strong> {providerInfo.name}</div>
              <div><strong>이메일:</strong> {providerInfo.email}</div>
              <div><strong>연락처:</strong> {providerInfo.phone}</div>
              {providerInfo.address && (
                <div><strong>주소:</strong> {providerInfo.address}</div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 프로젝트 정보 */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 text-lg flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          프로젝트 정보
        </h3>
        
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-lg">
          <div className="text-center mb-4">
            <h4 className="text-xl font-bold text-purple-700 mb-2">
              {contractInfo.project?.title || '서비스 제공'}
            </h4>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatAmountWithVAT(getContractAmount())}
            </div>
            <p className="text-gray-600">
              작업기간: {contractInfo.project?.duration || '30일'}
            </p>
          </div>

          {contractInfo.project?.description && (
            <div className="text-sm text-gray-700 p-4 bg-white rounded-lg">
              <strong>상세 내용:</strong> {contractInfo.project.description}
            </div>
          )}

          {contractInfo.project?.services && contractInfo.project.services.length > 1 && (
            <div className="mt-4">
              <h5 className="font-semibold mb-2">포함 서비스:</h5>
              <div className="grid gap-2">
                {contractInfo.project.services.map((service, index) => (
                  <div key={index} className="text-sm p-2 bg-white rounded border-l-4 border-purple-400">
                    <div className="font-medium">{service.name}</div>
                    {service.description && (
                      <div className="text-gray-600 text-xs">{service.description}</div>
                    )}
                    {service.price && (
                      <div className="text-purple-600 font-bold text-xs">
                        {formatAmountWithVAT(service.price)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 계약 조항 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            계약 조항 ({selectedClauses.length}개)
          </h3>
          <div className="flex gap-2">
            {metadata.generatedBy && (
              <Badge variant="info" className="text-xs">
                {metadata.generatedBy.includes('gpt') && metadata.generatedBy.includes('claude') ? 'GPT+Claude 생성' : 'AI 생성'}
              </Badge>
            )}
            {metadata.contractLength && (
              <Badge variant="secondary" className="text-xs">
                {metadata.lengthOption?.name || metadata.contractLength}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {selectedClauses.map((clause, index) => {
            const clauseId = clause.id || index;
            const isExpanded = expandedClauses.has(clauseId);
            const isEssential = clause.essential;
            const riskLevel = clause.riskLevel || 'medium';
            
            return (
              <div key={clauseId} className={`border-l-4 pl-4 py-3 rounded-r-lg ${
                riskLevel === 'high' ? 'border-red-400 bg-red-50' :
                riskLevel === 'medium' ? 'border-yellow-400 bg-yellow-50' :
                'border-green-400 bg-green-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <span>제{index + 1}조 ({clause.title})</span>
                    {isEssential && (
                      <Badge variant="error" size="sm">필수</Badge>
                    )}
                    <Badge variant={
                      riskLevel === 'high' ? 'error' :
                      riskLevel === 'medium' ? 'warning' : 'success'
                    } size="sm">
                      {riskLevel}
                    </Badge>
                  </h4>
                  
                  {clause.content && clause.content.length > 200 && (
                    <button
                      onClick={() => toggleClauseExpansion(clauseId)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {isExpanded ? '접기' : '더보기'}
                    </button>
                  )}
                </div>
                
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {isExpanded || !clause.content || clause.content.length <= 200 
                    ? clause.content 
                    : `${clause.content.substring(0, 200)}...`
                  }
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 서명 정보 */}
      {contract.signatures && contract.signatures.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 text-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            서명 정보
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {contract.signatures.map((signature) => (
              <div key={signature.id} className="text-center p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-semibold text-gray-900">{signature.signerName}</p>
                <p className="text-sm text-gray-600">
                  {signature.signerType === 'freelancer' || signature.signerType === 'provider' ? '수행자' : '발주자'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(signature.signedAt).toLocaleDateString('ko-KR')} {new Date(signature.signedAt).toLocaleTimeString('ko-KR')}
                </p>
              </div>
            ))}
          </div>
          
          {hasAllSignatures() && (
            <div className="text-center mt-6 p-4 bg-green-100 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">
                  양측 서명이 완료되어 계약이 확정되었습니다
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 메타데이터 (개발/디버그용) */}
      {showFullContent && metadata && Object.keys(metadata).length > 0 && (
        <Card className="p-6 bg-gray-50">
          <h3 className="font-semibold mb-4 text-lg text-gray-700">기술 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {metadata.completeness && (
              <div className="text-center">
                <div className="font-bold text-purple-600">{metadata.completeness}%</div>
                <div className="text-gray-600">완성도</div>
              </div>
            )}
            {metadata.processingTime && (
              <div className="text-center">
                <div className="font-bold text-blue-600">{Math.round(metadata.processingTime/1000)}s</div>
                <div className="text-gray-600">생성시간</div>
              </div>
            )}
            {metadata.lengthOption?.name && (
              <div className="text-center">
                <div className="font-bold text-green-600">{metadata.lengthOption.name}</div>
                <div className="text-gray-600">계약서 유형</div>
              </div>
            )}
            {metadata.generatedBy && (
              <div className="text-center">
                <div className="font-bold text-orange-600">
                  {metadata.generatedBy.includes('collaboration') ? 'GPT+Claude' : 'AI'}
                </div>
                <div className="text-gray-600">생성방식</div>
              </div>
            )}
          </div>
          
          {metadata.quoteIntegration && (
            <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <h4 className="font-semibold text-blue-700 mb-2">견적서 동기화 정보</h4>
              <div className="text-xs space-y-1">
                <div>지급조건 동기화: {metadata.quoteIntegration.paymentSync ? '✅' : '❌'}</div>
                <div>납기일 동기화: {metadata.quoteIntegration.deliverySync ? '✅' : '❌'}</div>
                <div>검수일 동기화: {metadata.quoteIntegration.inspectionSync ? '✅' : '❌'}</div>
                <div>부가세 별도: {metadata.quoteIntegration.vatExcluded ? '✅' : '❌'}</div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}