// src/engines/contractBuilder.js

import contractStructureKR from '../../legalSystems/KR/contractStructure.json';

/**
 * 선택된 조항들을 조합하여 완전한 계약서 생성
 * @param {Array} clauses - 선택된 조항 배열
 * @param {Object} projectData - 프로젝트 정보
 * @param {Object} parties - 계약 당사자 정보
 * @param {string} country - 국가 코드
 * @returns {Object} 생성된 계약서 객체
 */
export function buildContract(clauses, projectData, parties, country = "KR") {
  const structure = getContractStructure(country);
  
  // 1. 변수 치환을 위한 데이터 준비
  const variables = prepareVariables(projectData, parties);
  
  // 2. 섹션별로 조항 매핑
  const sections = mapClausesToSections(clauses, structure);
  
  // 3. 각 섹션 내용 생성
  const processedSections = sections.map(section => 
    processSectionContent(section, variables)
  );
  
  // 4. 헤더 및 기본 정보 생성
  const header = generateContractHeader(projectData, parties, variables);
  
  // 5. 서명란 생성
  const signature = generateSignatureSection(parties, structure.signature);
  
  // 6. 최종 계약서 조합
  return {
    header,
    sections: processedSections,
    signature,
    metadata: {
      generatedAt: new Date().toISOString(),
      country,
      totalSections: processedSections.length,
      contractType: projectData.contractType || "용역계약서"
    }
  };
}

/**
 * 국가별 계약서 구조 가져오기
 */
function getContractStructure(country) {
  // 현재는 KR만 구현, 추후 다른 국가 구조 추가
  switch(country) {
    case "KR":
      return contractStructureKR;
    default:
      return contractStructureKR; // fallback
  }
}

/**
 * 변수 치환용 데이터 준비
 */
function prepareVariables(projectData, parties) {
  const today = new Date();
  
  return {
    // 날짜 관련
    contractDate: formatKoreanDate(today),
    startDate: formatKoreanDate(new Date(projectData.startDate)),
    endDate: formatKoreanDate(new Date(projectData.endDate)),
    
    // 당사자 정보
    clientName: parties.client.name,
    clientCompany: parties.client.company,
    clientAddress: parties.client.address,
    clientContact: parties.client.contact,
    clientRepresentative: parties.client.representative,
    
    contractorName: parties.contractor.name,
    contractorCompany: parties.contractor.company,
    contractorAddress: parties.contractor.address,
    contractorContact: parties.contractor.contact,
    contractorRepresentative: parties.contractor.representative,
    
    // 프로젝트 정보
    projectTitle: projectData.title,
    projectDescription: projectData.description,
    totalAmount: formatKoreanCurrency(projectData.totalAmount),
    
    // 지급 관련 (분할 지급인 경우)
    firstPayment: projectData.firstPayment ? formatKoreanCurrency(projectData.firstPayment) : "",
    secondPayment: projectData.secondPayment ? formatKoreanCurrency(projectData.secondPayment) : "",
    finalPayment: projectData.finalPay