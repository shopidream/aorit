// src/engines/clauseSelector.js

import { paymentTerms, lumpSumPayment, advancePayment } from '../data/clauses/KR/financial/payment.js';
import { requiredClausesKR, recommendedClausesKR, industrySpecificClauses, validateClauseCombination } from '../../legalSystems/KR/requiredClauses.js';

/**
 * 조건에 따라 적절한 계약 조항들을 선택하는 엔진
 * @param {Object} conditions - 계약 조건
 * @param {string} conditions.country - 국가 코드 (KR, US, etc.)
 * @param {string} conditions.industry - 업종 (design, software, marketing, etc.) 
 * @param {number} conditions.budget - 예산
 * @param {string} conditions.projectType - 프로젝트 유형
 * @param {number} conditions.duration - 예상 소요 기간 (일)
 * @param {Array} conditions.customTriggers - 사용자 정의 트리거
 * @returns {Object} 선택된 조항들과 추천사항
 */
export function selectClauses(conditions) {
  const {
    country = "KR",
    industry = "general", 
    budget = 0,
    projectType = "standard",
    duration = 30,
    customTriggers = []
  } = conditions;

  // 1. 기본 트리거 생성
  const triggers = generateTriggers(budget, duration, projectType, customTriggers);
  
  // 2. 사용 가능한 모든 조항 로드 (현재는 payment만, 추후 확장)
  const availableClauses = loadAvailableClauses(country, industry);
  
  // 3. 트리거 기반 조항 필터링
  const selectedClauses = filterClausesByTriggers(availableClauses, triggers);
  
  // 4. 필수 조항 추가
  const requiredClauses = addRequiredClauses(selectedClauses, country, industry);
  
  // 5. 충돌 검사 및 검증
  const validationResult = validateClauseCombination(requiredClauses);
  
  // 6. 추천 조항 제안
  const recommendations = generateRecommendations(triggers, industry, validationResult);

  return {
    selectedClauses: requiredClauses,
    triggers,
    validation: validationResult,
    recommendations,
    metadata: {
      totalClauses: requiredClauses.length,
      riskLevel: validationResult.riskLevel,
      country,
      industry
    }
  };
}

/**
 * 예산, 기간, 프로젝트 유형에 따라 트리거 생성
 */
function generateTriggers(budget, duration, projectType, customTriggers) {
  const triggers = [...customTriggers];
  
  // 예산 기반 트리거
  if (budget < 500000) triggers.push("budget_under_500", "small_project");
  else if (budget > 1000000) triggers.push("budget_over_1000", "large_project");
  
  // 기간 기반 트리거  
  if (duration <= 14) triggers.push("short_term");
  else if (duration >= 60) triggers.push("long_term_project");
  
  // 프로젝트 유형 기반 트리거
  if (projectType === "custom") triggers.push("custom_development", "custom_requirements");
  if (projectType === "rush") triggers.push("urgent_delivery");
  
  // 지급 방식 추론
  if (budget > 1000000 || duration > 30) {
    triggers.push("installment");
  } else {
    triggers.push("lump_sum");
  }
  
  return [...new Set(triggers)]; // 중복 제거
}

/**
 * 국가와 업종에 따라 사용 가능한 조항들 로드
 */
function loadAvailableClauses(country, industry) {
  const clauses = [];
  
  // 금융 조항들 (현재 구현된 부분)
  clauses.push(paymentTerms, lumpSumPayment, advancePayment);
  
  // TODO: 다른 카테고리 조항들도 로드
  // clauses.push(...copyrightClauses);
  // clauses.push(...timelineClauses);
  // clauses.push(...terminationClauses);
  
  return clauses;
}

/**
 * 트리거에 맞는 조항들 필터링
 */
function filterClausesByTriggers(availableClauses, triggers) {
  return availableClauses.filter(clause => {
    // 트리거 중 하나라도 매칭되면 포함
    return clause.triggers.some(trigger => triggers.includes(trigger));
  });
}

/**
 * 필수 조항들 추가 (누락된 경우)
 */
function addRequiredClauses(selectedClauses, country, industry) {
  const result = [...selectedClauses];
  
  // 업종별 필수 조항 추가
  const industryRequired = industrySpecificClauses[industry] || [];
  
  // TODO: 실제 조항 객체로 변환하여 추가
  // (현재는 ID만 있으므로 추후 구현)
  
  return result;
}

/**
 * 상황에 맞는 추천 조항 생성
 */
function generateRecommendations(triggers, industry, validationResult) {
  const recommendations = [];
  
  // 리스크 기반 추천
  if (validationResult.riskLevel === 'high') {
    recommendations.push({
      type: "risk_mitigation",
      title: "리스크 완화 조항 추가 권장",
      description: "현재 계약 조건이 고위험으로 분류됩니다. 손해배상 제한 조항을 추가하는 것을 권장합니다.",
      suggestedClauses: ["liability_limit_kr_001", "force_majeure_kr_001"]
    });
  }
  
  // 업종별 추천
  if (industry === 'design') {
    recommendations.push({
      type: "industry_specific",
      title: "디자인 업종 특화 조항",
      description: "디자인 프로젝트의 특성상 수정 횟수 제한과 원본 파일 제공 조항을 권장합니다.",
      suggestedClauses: ["revision_limit_kr_001", "source_file_delivery_kr_001"]
    });
  }
  
  // 트리거 기반 추천
  if (triggers.includes("long_term_project")) {
    recommendations.push({
      type: "project_specific", 
      title: "장기 프로젝트 보완 조항",
      description: "장기 프로젝트의 경우 중간 점검 및 범위 변경 대응 조항을 권장합니다.",
      suggestedClauses: ["milestone_kr_001", "scope_change_kr_001"]
    });
  }
  
  return recommendations;
}

/**
 * 특정 조항을 강제로 추가
 */
export function addClause(currentClauses, newClauseId, country = "KR") {
  // 기존 조항과 충돌 검사
  const newClause = findClauseById(newClauseId, country);
  if (!newClause) return { success: false, error: "조항을 찾을 수 없습니다." };
  
  const updatedClauses = [...currentClauses, newClause];
  const validation = validateClauseCombination(updatedClauses);
  
  if (validation.conflicts.length > 0) {
    return { 
      success: false, 
      error: "추가하려는 조항이 기존 조항과 충돌합니다.", 
      conflicts: validation.conflicts 
    };
  }
  
  return { success: true, clauses: updatedClauses };
}

/**
 * 특정 조항 제거
 */
export function removeClause(currentClauses, clauseIdToRemove) {
  const updatedClauses = currentClauses.filter(clause => clause.id !== clauseIdToRemove);
  const validation = validateClauseCombination(updatedClauses);
  
  return { 
    success: true, 
    clauses: updatedClauses,
    validation
  };
}

// 헬퍼 함수
function findClauseById(clauseId, country) {
  // TODO: 실제 조항 데이터베이스에서 검색
  const allClauses = [paymentTerms, lumpSumPayment, advancePayment];
  return allClauses.find(clause => clause.id === clauseId);
}