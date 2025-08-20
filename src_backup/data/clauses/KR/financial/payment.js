// src/data/clauses/KR/financial/payment.js

export const paymentTerms = {
    id: "payment_installment_kr_001",
    category: "financial",
    triggers: ["installment", "budget_over_1000", "long_term_project"],
    conflicts: ["lump_sum_only", "pay_on_completion"],
    alternatives: ["payment_escrow_kr", "milestone_payment_kr"],
    riskLevel: "medium",
    plainText: "총 비용은 3회 분할 납부로 진행되며, 프로젝트 시작 전 30%, 중간 산출물 전달 후 40%, 완료 후 30%를 지급합니다.",
    legalText: "본 계약의 총 대금은 3회 분할하여 지급되며, 1차(계약금) 총액의 30%, 2차(중간지급) 총액의 40%, 3차(잔금) 총액의 30%로 분할하여 청구한다. 각 지급은 해당 단계 완료 후 7영업일 이내에 지급되어야 한다.",
    explanations: {
      why: "큰 프로젝트의 경우 리스크 분산을 위해 분할 지급 방식이 안전합니다.",
      when: "계약 금액이 100만원을 넘거나, 개발/디자인 등 기간이 긴 작업일 경우 추천됩니다.",
      risk: "중간 단계에서 클라이언트가 지불을 거부할 가능성이 있으므로 중간 산출물 기준을 명확히 해야 합니다."
    }
  };
  
  export const lumpSumPayment = {
    id: "payment_lump_sum_kr_001", 
    category: "financial",
    triggers: ["small_project", "budget_under_500", "short_term"],
    conflicts: ["installment", "milestone_payment"],
    alternatives: ["payment_installment_kr_001"],
    riskLevel: "low",
    plainText: "총 비용은 프로젝트 완료 후 일괄 지급됩니다.",
    legalText: "본 계약의 총 대금은 최종 결과물 인도 완료 후 7영업일 이내에 일괄 지급한다.",
    explanations: {
      why: "소규모 프로젝트의 경우 간단한 일괄 지급이 효율적입니다.",
      when: "계약 금액이 50만원 미만이거나 작업 기간이 2주 이내일 경우 적합합니다.",
      risk: "수급자 입장에서 작업 완료 전까지 현금 흐름이 없어 자금 부담이 있을 수 있습니다."
    }
  };
  
  export const advancePayment = {
    id: "payment_advance_kr_001",
    category: "financial", 
    triggers: ["high_cost_materials", "subcontractor_needed", "custom_development"],
    conflicts: ["pay_on_completion"],
    alternatives: ["payment_installment_kr_001"],
    riskLevel: "high",
    plainText: "프로젝트 시작 전 총 비용의 50%를 선지급하고, 완료 후 나머지 50%를 지급합니다.",
    legalText: "본 계약의 총 대금 중 50%는 계약 체결과 동시에 선지급하며, 나머지 50%는 최종 결과물 인도 완료 후 7영업일 이내에 지급한다.",
    explanations: {
      why: "재료비나 외주비가 많이 드는 프로젝트에서 수급자의 자금 부담을 덜어줍니다.",
      when: "제조업, 대형 개발 프로젝트, 고가 재료 사용 시 필요합니다.",
      risk: "발주자 입장에서 선지급 후 프로젝트가 중단될 위험이 있으므로 신중히 선택해야 합니다."
    }
  };