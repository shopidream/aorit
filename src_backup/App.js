// 📁 App.js - 메인 애플리케이션 (라우팅, 페이지 전환만 담당)

import React, { useState, useEffect } from 'react';
import ProposalForm from './components/documents/proposal/ProposalForm.js';
import ContractPreview from './components/documents/contract/ContractPreview.js';
import AdminDashboard from './components/admin/AdminDashboard.js';
import { storage } from './utils.js';
import { initTheme, toggleTheme } from './styles/designSystem.js'; // 🔥 추가된 부분

function App() {
  // 애플리케이션 상태
  const [currentPage, setCurrentPage] = useState('form'); // 'form' | 'preview' | 'saved' | 'admin'
  const [currentContract, setCurrentContract] = useState(null);
  const [savedContracts, setSavedContracts] = useState([]);

  // 컴포넌트 마운트 시 저장된 계약서 목록 로드 + 테마 초기화
  useEffect(() => {
    loadSavedContracts();
    initTheme(); // 🔥 추가된 부분
  }, []);

  // 저장된 계약서 목록 로드
  const loadSavedContracts = () => {
    try {
      const contracts = [];
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith('contract_') && key !== 'contract_form_data') {
          const contractData = storage.load(key);
          if (contractData) {
            contracts.push({
              ...contractData,
              storageKey: key
            });
          }
        }
      });
      
      // 생성일 기준 내림차순 정렬
      contracts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSavedContracts(contracts);
    } catch (error) {
      console.error('저장된 계약서 로드 실패:', error);
    }
  };

  // 계약서 생성 완료 핸들러
  const handleContractGenerated = (contract) => {
    setCurrentContract(contract);
    setCurrentPage('preview');
    
    // 저장된 계약서 목록 업데이트
    loadSavedContracts();
  };

  // 미리보기에서 뒤로가기
  const handleBackToForm = () => {
    setCurrentPage('form');
    setCurrentContract(null);
  };

  // 계약서 수정하기
  const handleEditContract = () => {
    setCurrentPage('form');
    // 현재 계약서 데이터를 폼에 다시 로드하는 로직은 ProposalForm에서 처리
  };

  // 저장된 계약서 선택
  const handleSelectSavedContract = (contract) => {
    setCurrentContract(contract);
    setCurrentPage('preview');
  };

  // 저장된 계약서 삭제
  const handleDeleteContract = (storageKey) => {
    if (window.confirm('정말로 이 계약서를 삭제하시겠습니까?')) {
      storage.remove(storageKey);
      loadSavedContracts();
      
      // 현재 보고 있는 계약서를 삭제한 경우
      if (currentContract && currentContract.id === storageKey.replace('contract_', '')) {
        setCurrentContract(null);
        setCurrentPage('form');
      }
    }
  };

  // 전체 계약서 삭제
  const handleClearAllContracts = () => {
    if (window.confirm('모든 저장된 계약서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      savedContracts.forEach(contract => {
        storage.remove(contract.storageKey);
      });
      setSavedContracts([]);
      setCurrentContract(null);
      setCurrentPage('form');
      alert('모든 계약서가 삭제되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* 헤더 */}
      <header className="bg-surface-elevated shadow-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-primary">
                펫돌(주) 비즈니스 제안 시스템
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                서비스 소개부터 계약 체결까지 통합 관리 플랫폼
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 🔥 다크모드 토글 버튼 추가 */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-surface-hover text-text-primary hover:bg-surface-active transition-colors"
                title="테마 변경"
              >
                🌙
              </button>

              {/* 페이지 네비게이션 */}
              <button
                onClick={() => {
                  setCurrentPage('form');
                  setCurrentContract(null);
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'form'
                    ? 'bg-primary text-white'
                    : 'bg-surface-hover text-text-primary hover:bg-surface-active'
                }`}
              >
                📝 새 제안서
              </button>
              
              {savedContracts.length > 0 && (
                <button
                  onClick={() => setCurrentPage(currentPage === 'saved' ? 'form' : 'saved')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'saved'
                      ? 'bg-success text-white'
                      : 'bg-surface-hover text-text-primary hover:bg-surface-active'
                  }`}
                >
                  📁 저장된 계약서 ({savedContracts.length})
                </button>
              )}

              <button
                onClick={() => setCurrentPage(currentPage === 'admin' ? 'form' : 'admin')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'admin'
                    ? 'bg-accent text-white'
                    : 'bg-surface-hover text-text-primary hover:bg-surface-active'
                }`}
              >
                ⚙️ 관리자
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="py-8">
        {/* 제안서 작성 페이지 */}
        {currentPage === 'form' && (
          <ProposalForm onContractGenerated={handleContractGenerated} />
        )}

        {/* 계약서 미리보기 페이지 */}
        {currentPage === 'preview' && (
          <ContractPreview
            currentContract={currentContract}
            onBack={handleBackToForm}
            onEdit={handleEditContract}
          />
        )}

        {/* 관리자 페이지 */}
        {currentPage === 'admin' && (
          <AdminDashboard />
        )}

        {/* 저장된 계약서 목록 페이지 */}
        {currentPage === 'saved' && (
          <div className="max-w-6xl mx-auto px-6">
            <div className="bg-surface-elevated rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">저장된 계약서 목록</h2>
                {savedContracts.length > 0 && (
                  <button
                    onClick={handleClearAllContracts}
                    className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    🗑️ 전체 삭제
                  </button>
                )}
              </div>

              {savedContracts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-text-secondary text-4xl mb-4">📄</div>
                  <p className="text-text-secondary mb-4">저장된 계약서가 없습니다.</p>
                  <button
                    onClick={() => setCurrentPage('form')}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    새 제안서 만들기
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedContracts.map((contract) => (
                    <div
                      key={contract.storageKey}
                      className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-surface"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-text-primary truncate flex-1">
                          {contract.formData?.clientCompany || '미정'}
                        </h3>
                        <button
                          onClick={() => handleDeleteContract(contract.storageKey)}
                          className="text-danger hover:text-red-700 ml-2"
                          title="삭제"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="space-y-2 text-sm text-text-secondary mb-4">
                        <div>
                          <span className="font-medium">계약 유형:</span>
                          <span className="ml-1">
                            {contract.type === 'store' ? '쇼피파이 스토어' : '마케팅 플랫폼'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">금액:</span>
                          <span className="ml-1 text-success font-medium">
                            {contract.amounts?.totalAmountNumber || '0'}원
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">생성일:</span>
                          <span className="ml-1">
                            {new Date(contract.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleSelectSavedContract(contract)}
                        className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        계약서 보기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-surface-elevated border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-sm text-text-secondary mb-4 md:mb-0">
              <p>© 2025 펫돌(주). All rights reserved.</p>
              <p className="mt-1">
                경기도 성남시 분당구 동판교로 52번길 9-4 | 사업자등록번호: 144-81-24257
              </p>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-text-secondary">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-success rounded-full mr-2"></span>
                시스템 정상 운영 중
              </div>
              <div>
                📞 02-1666-4125
              </div>
              <div>
                📧 cs@shopidream.com
              </div>
            </div>
          </div>
          
          {/* 개발 정보 */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-between text-xs text-text-tertiary">
              <div>
                <span className="font-medium">Version:</span> 3.0.0 | 
                <span className="font-medium ml-2">Last Updated:</span> {new Date().toLocaleDateString('ko-KR')}
              </div>
              <div className="mt-2 md:mt-0">
                <span className="inline-flex items-center px-2 py-1 bg-primary-light text-primary rounded-full text-xs">
                  🚀 폴더 구조 개선
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-success-light text-success rounded-full text-xs ml-2">
                  ✨ 관리자 페이지 추가
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 개발자 도구 (개발 환경에서만 표시) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-surface-elevated text-text-primary p-3 rounded-lg shadow-lg text-xs max-w-xs border border-border">
          <div className="font-medium mb-2">🛠️ 개발자 정보</div>
          <div className="space-y-1">
            <div>현재 페이지: {currentPage}</div>
            <div>저장된 계약서: {savedContracts.length}개</div>
            <div>현재 계약서: {currentContract ? '있음' : '없음'}</div>
            <div>로컬스토리지 항목: {Object.keys(localStorage).length}개</div>
          </div>
          <button
            onClick={() => console.log('App State:', { currentPage, currentContract, savedContracts })}
            className="mt-2 px-2 py-1 bg-primary text-white rounded text-xs hover:bg-blue-700"
          >
            콘솔에 상태 출력
          </button>
        </div>
      )}

      {/* 전역 스타일 및 유틸리티 */}
      <style jsx global>{`
        /* 인쇄용 스타일 */
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .contract-content {
            max-width: none !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
          }
        }
        
        /* 스크롤바 커스터마이징 */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: var(--color-surface-hover);
        }
        ::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-tertiary);
        }
        
        /* 라인 클램프 유틸리티 */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* 애니메이션 */
        .fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;