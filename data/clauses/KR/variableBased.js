// data/clauses/KR/variableBased.js - 변수 기반 조항 시스템

// 기본 필수 조항 (모든 계약 공통)
export const BASE_CLAUSES = {
    contract_purpose: {
      id: 'contract_purpose',
      title: '계약 목적',
      content: `본 계약은 발주자가 수행자에게 {serviceDescription}을 의뢰하고, 수행자가 이를 성실히 수행함을 목적으로 한다.`,
      variables: [],
      essential: true,
      order: 1
    },
    
    parties: {
      id: 'parties',
      title: '계약 당사자',
      content: `발주자(갑): {clientName}
  수행자(을): {providerName}
  연락처: {contactInfo}`,
      variables: [],
      essential: true,
      order: 2
    },
  
    payment_basic: {
      id: 'payment_basic',
      title: '계약금액',
      content: `계약 총액: {totalAmount}원 (부가세 포함)`,
      variables: [],
      essential: true,
      order: 3
    },

    payment_detailed: {
      id: 'payment_detailed',
      title: '상세 지급 조건',
      content: `① 계약 총액: {totalAmount}원 (부가세 {vatIncluded})
  ② 지급 방식: {paymentSchedule}
  ③ 지급 일정: 각 단계별 완료 확인 후 7일 이내 지급
  ④ 지연 시 연체료: 연 {penaltyRate}% 적용
  ⑤ 지급 계좌: 계약 체결 시 별도 통보
  ⑥ 세금계산서: 지급일 기준 발행`,
      variables: [],
      essential: true,
      order: 3
    },

    payment_guarantee: {
      id: 'payment_guarantee',
      title: '지급 보증',
      content: `① 선금 보증: 착수금 지급 시 이행보증서 또는 보증보험증권 제출
  ② 보증 금액: 선급금의 100%
  ③ 보증 기간: 해당 단계 완료 시까지
  ④ 보증 해지: 단계별 완료 확인 후 자동 해지`,
      variables: [],
      essential: false,
      order: 4
    },

    payment_detailed: {
      id: 'payment_detailed',
      title: '상세 지급 조건',
      content: `① 계약 총액: {totalAmount}원 (부가세 {vatIncluded})
  ② 지급 방식: {paymentSchedule}
  ③ 지급 일정: 각 단계별 완료 확인 후 7일 이내 지급
  ④ 지연 시 연체료: 연 {penaltyRate}% 적용
  ⑤ 지급 계좌: 계약 체결 시 별도 통보
  ⑥ 세금계산서: 지급일 기준 발행`,
      variables: [],
      essential: true,
      order: 3
    },
  
    payment_guarantee: {
      id: 'payment_guarantee',
      title: '지급 보증',
      content: `① 선금 보증: 착수금 지급 시 이행보증서 또는 보증보험증권 제출
  ② 보증 금액: 선급금의 100%
  ③ 보증 기간: 해당 단계 완료 시까지
  ④ 보증 해지: 단계별 완료 확인 후 자동 해지`,
      variables: [],
      essential: false,
      order: 4
    },
  };
  
  // 1. 실행주기별 조항
  export const EXECUTION_CYCLE_CLAUSES = {
    single_completion: {
      id: 'single_completion',
      title: '단발성 완료 조건',
      content: `① 계약기간: {startDate} ~ {endDate}
  ② 완료 기준: 모든 결과물 인도 및 갑의 최종 승인
  ③ 계약 종료: 완료와 동시에 자동 종료`,
      variables: ['execution_cycle:single'],
      essential: true,
      order: 10
    },
  
    continuous_service: {
      id: 'continuous_service', 
      title: '지속적 서비스 조건',
      content: `① 서비스 기간: {startDate} ~ {endDate}
  ② 연속적 제공: 중단 없는 서비스 제공 의무
  ③ 해지 통보: {noticePeriod}일 전 서면 통지
  ④ 업무 인수인계: 해지 시 원활한 이관 의무`,
      variables: ['execution_cycle:continuous'],
      essential: true,
      order: 11
    },
  
    periodic_renewal: {
      id: 'periodic_renewal',
      title: '주기적 갱신 조건', 
      content: `① 수행 주기: {serviceCycle}
  ② 자동 갱신: 해지 의사 없으면 동일 조건으로 연장
  ③ 갱신 거부: {renewalNotice}일 전 서면 통지`,
      variables: ['execution_cycle:periodic'],
      essential: true,
      order: 12
    }
  };
  
  // 2. 서비스형태별 조항
  export const SERVICE_TYPE_CLAUSES = {
    manufacturing_deliverable: {
      id: 'manufacturing_deliverable',
      title: '제조형 결과물 조항',
      content: `① 결과물 명세: {deliverableSpecs}
  ② 품질 기준: {qualityStandards}
  ③ 저작권 이전: 완료 시 갑에게 완전 양도
  ④ 하자 보증: 완료 후 {warrantyPeriod} 무상 수정`,
      variables: ['service_type:manufacturing'],
      essential: true,
      order: 20
    },
  
    service_performance: {
      id: 'service_performance',
      title: '용역형 수행 조항',
      content: `① 작업 범위: {workScope}
  ② 수행 방법: {performanceMethod}
  ③ 완료 기준: {completionCriteria}
  ④ 안전 의무: 작업 중 안전사고 예방 조치`,
      variables: ['service_type:service'],
      essential: true,
      order: 21
    },
  
    consulting_advice: {
      id: 'consulting_advice',
      title: '자문형 조언 조항',
      content: `① 자문 범위: {consultingScope}
  ② 전문성 보장: 해당 분야 전문 지식 기반 조언
  ③ 책임 한계: 조언 제공에 한정, 실행 결과 책임 제외
  ④ 비밀 유지: 취득 정보의 엄격한 기밀 보호`,
      variables: ['service_type:consulting'],
      essential: true,
      order: 22
    },
  
    complex_service: {
      id: 'complex_service',
      title: '복합형 서비스 조항',
      content: `① 서비스 구성: 제조 + 용역 + 자문의 종합 서비스
  ② 단계별 구분: 각 서비스별 별도 완료 기준 적용
  ③ 통합 관리: 전체 프로젝트 총괄 관리 체계
  ④ 단계별 검수: 각 단계 완료 시 개별 승인`,
      variables: ['service_type:complex'],
      essential: true,
      order: 23
    }
  };
  
  // 3. 복잡도별 조항
  export const COMPLEXITY_CLAUSES = {
    simple_workflow: {
      id: 'simple_workflow',
      title: '단순 작업 절차',
      content: `① 작업 절차: 단순하고 명확한 프로세스
  ② 수정 제한: 최대 1회 무상 수정
  ③ 검수 방법: 완료 후 즉시 확인 가능
  ④ 커뮤니케이션: 필요시 연락, 정기 보고 생략`,
      variables: ['complexity:simple'],
      essential: false,
      order: 30
    },
  
    standard_process: {
      id: 'standard_process',
      title: '표준 작업 절차',
      content: `① 단계별 진행: {milestones}
  ② 수정 범위: {maxRevisions}회 무상 수정
  ③ 중간 검수: 주요 단계별 승인 절차
  ④ 정기 보고: 주간 진행 상황 공유`,
      variables: ['complexity:medium'],
      essential: true,
      order: 31
    },
  
    complex_management: {
      id: 'complex_management',
      title: '복합 프로젝트 관리',
      content: `① 세부 계획: 상세 프로젝트 계획서 작성
  ② 수정 협의: 범위 내 수정은 협의로 결정
  ③ 품질 관리: 각 단계별 품질 검수 체계
  ④ 전담 관리: 프로젝트 매니저 배정
  ⑤ 정기 미팅: 주간 진행 회의 및 월간 전체 리뷰`,
      variables: ['complexity:complex'],
      essential: true,
      order: 32
    }
  };
  
  // 4. 프로젝트규모별 조항
  export const PROJECT_SCALE_CLAUSES = {
    small_scale_payment: {
      id: 'small_scale_payment',
      title: '소규모 지급 조건',
      content: `① 지급 방식: 완료 후 일괄 지급 (기본)
  ② 선지급 가능: 갑 요청 시 30% 선지급 가능
  ③ 손해배상 한도: 계약금액의 100% 한도
  ④ 간소 절차: 복잡한 관리 절차 생략`,
      variables: ['project_scale:small'],
      essential: true,
      order: 40
    },
  
    medium_scale_payment: {
      id: 'medium_scale_payment',
      title: '중간규모 지급 조건',
      content: `① 분할 지급: 착수금 30% + 완료금 70%
  ② 보증 조건: 착수금 지급 시 간단한 보증
  ③ 손해배상 한도: 계약금액의 150% 한도
  ④ 중간 점검: 50% 진행 시점 중간 검토`,
      variables: ['project_scale:medium'],
      essential: true,
      order: 41
    },
  
    large_scale_management: {
      id: 'large_scale_management',
      title: '대규모 프로젝트 관리',
      content: `① 다단계 지급: 착수 20% + 중간 50% + 완료 30%
  ② 이행 보증: 계약이행보증서 또는 보증금 예치
  ③ 손해배상: 실손해액 배상 (한도 없음)
  ④ 보험 가입: 손해배상책임보험 가입 의무
  ⑤ 전문 관리: 전담 팀 구성 및 정기 보고`,
      variables: ['project_scale:large'],
      essential: true,
      order: 42
    }
  };
  
  // 5. 장소특성별 조항
  export const LOCATION_CLAUSES = {
    remote_work: {
      id: 'remote_work',
      title: '원격 작업 조건',
      content: `① 작업 방식: 비대면 원격 작업
  ② 자료 전달: 이메일, 클라우드 등 온라인 전달
  ③ 소통 방법: 화상회의, 메신저 등 온라인 소통
  ④ 출장비 없음: 교통비, 숙박비 등 부대비용 없음`,
      variables: ['location:remote'],
      essential: false,
      order: 50
    },
  
    onsite_work: {
      id: 'onsite_work',
      title: '현장 작업 조건',
      content: `① 작업 장소: {workLocation}
  ② 현장 안전: 안전수칙 준수 및 사고 예방 의무
  ③ 출장비 지급: {travelExpense} 지급 방식
  ④ 현장 출입: 지정된 시간 내 출입 및 보안 준수
  ⑤ 시설 이용: 갑의 시설 이용 시 원상복구 의무`,
      variables: ['location:onsite'],
      essential: true,
      order: 51
    },
  
    hybrid_work: {
      id: 'hybrid_work',
      title: '혼합 작업 조건',
      content: `① 작업 구분: 원격 + 현장 작업 병행
  ② 현장 작업: {onsiteRatio} 현장, {remoteRatio} 원격
  ③ 출장비 산정: 현장 작업일에 대해서만 지급
  ④ 일정 조율: 현장/원격 일정 사전 협의`,
      variables: ['location:hybrid'],
      essential: true,
      order: 52
    }
  };
  
  // 6. 자재·장비별 조항
  export const EQUIPMENT_CLAUSES = {
    intangible_service: {
      id: 'intangible_service',
      title: '무형 서비스 조건',
      content: `① 서비스 성격: 지식, 노하우, 정보 기반 서비스
  ② 장비 책임: 물리적 장비 관련 책임 없음
  ③ 지식재산권: 기존 노하우는 을의 고유 자산 유지
  ④ 자료 보안: 디지털 자료의 보안 관리 의무`,
      variables: ['equipment:intangible'],
      essential: false,
      order: 60
    },
  
    small_equipment: {
      id: 'small_equipment',
      title: '소규모 장비 관리',
      content: `① 장비 범위: 일반 도구, 소형 장비, 소량 자재
  ② 장비 관리: 정상 사용 범위 내 관리 책임
  ③ 손상 기준: 정상 마모는 인정, 과실 손상은 배상
  ④ 반환 의무: 작업 완료 후 원상태로 반환`,
      variables: ['equipment:small'],
      essential: true,
      order: 61
    },
  
    large_equipment: {
      id: 'large_equipment',
      title: '대형·고가 장비 관리',
      content: `① 장비 범위: 고가 장비, 전문 기계, 대량 자재
  ② 보험 가입: 장비 손해에 대한 보험 가입 의무
  ③ 안전 관리: 전문 자격자 조작 및 안전 수칙 준수
  ④ 점검 의무: 작업 전후 장비 상태 점검 및 기록
  ⑤ 사고 대응: 장비 사고 시 즉시 신고 및 응급조치`,
      variables: ['equipment:large'],
      essential: true,
      order: 62
    }
  };
  
  // 조건부 파생 조항 (특정 변수 조합에서만 적용)
  export const CONDITIONAL_CLAUSES = {
    onsite_safety: {
      id: 'onsite_safety',
      title: '현장 안전 관리',
      content: `① 안전 교육: 작업 전 안전교육 이수 의무
  ② 보호 장비: 안전모, 안전화 등 착용 의무
  ③ 사고 신고: 사고 발생 시 즉시 갑에게 신고
  ④ 응급 조치: 사고 시 응급처치 및 구호 조치
  ⑤ 안전 점검: 작업 중 수시 안전 점검 실시`,
      conditions: ['location:onsite', 'equipment:small'],
      conditions_operator: 'OR',
      essential: true,
      order: 70
    },
  
    equipment_insurance: {
      id: 'equipment_insurance',
      title: '장비 손해 보험',
      content: `① 보험 가입: 장비 손해배상책임보험 가입
  ② 보험 금액: 장비 가액의 100% 이상
  ③ 보험 기간: 계약 기간 + 30일
  ④ 보험금 처리: 사고 시 보험 우선 처리 후 부족분 배상`,
      conditions: ['equipment:large'],
      essential: true,
      order: 71
    },
  
    revision_limits: {
      id: 'revision_limits',
      title: '수정 작업 제한',
      content: `① 무상 수정: 제조형 서비스 {maxRevisions}회 무상
  ② 수정 범위: 원래 요구사항 범위 내 수정만 가능
  ③ 추가 수정: 무상 횟수 초과 시 시간당 {hourlyRate}원
  ④ 범위 초과: 요구사항 변경은 별도 계약`,
      conditions: ['service_type:manufacturing', 'complexity:medium'],
      conditions_operator: 'AND',
      essential: true,
      order: 72
    },
  
    performance_guarantee: {
      id: 'performance_guarantee',
      title: '성과 보증 조건',
      content: `① 성과 기준: {performanceKPI}
  ② 평가 방법: 객관적 지표 기반 정량 평가
  ③ 미달 시 조치: 무상 보완 또는 부분 환불
  ④ 평가 시점: 완료 후 {evaluationPeriod} 내 평가`,
      conditions: ['project_scale:large', 'complexity:complex'],
      conditions_operator: 'AND',
      essential: true,
      order: 73
    },

    
    payment_split_management: {
      id: 'payment_split_management',
      title: '분할 지급 관리',
      content: `① 지급 일정: {paymentSchedule}
  ② 지급 조건: 각 단계별 완료 확인 후 지급
  ③ 지연 시 연체료: 연 {penaltyRate}% 적용
  ④ 선금 보증: 착수금 지급 시 이행보증서 제출`,
      conditions: ['project_scale:medium', 'project_scale:large'],
      conditions_operator: 'OR',
      essential: true,
      order: 75
    },


    travel_expense_policy: {
      id: 'travel_expense_policy',
      title: '출장비 정책',
      content: `① 출장비 부담: {travelPolicy}
  ② 교통비: 실비 정산 (대중교통 우선)
  ③ 숙박비: 1박당 10만원 한도 내 실비
  ④ 일비: 1일당 3만원 지급
  ⑤ 사전 승인: 출장 전 발주자 사전 승인 필요`,
      conditions: ['location:onsite', 'location:hybrid'],
      conditions_operator: 'OR',
      essential: true,
      order: 76
    },

    insurance_requirement: {
      id: 'insurance_requirement',
      title: '보험 가입 의무',
      content: `① 보험 가입: 손해배상책임보험 가입 의무
  ② 보험 금액: 계약금액의 200% 이상
  ③ 보험 기간: 계약 기간 전체 + 30일
  ④ 보험증서 제출: 계약 체결 시 보험증서 제출
  ⑤ 갱신 의무: 보험 만료 시 자동 갱신`,
      conditions: ['insuranceRequired:yes'],
      essential: true,
      order: 77
    },

    performance_evaluation: {
      id: 'performance_evaluation',
      title: '성과 측정 및 평가',
      content: `① 평가 방법: {evaluationMethod}
  ② 평가 기준: 품질, 일정, 소통 3개 영역
  ③ 평가 시점: 완료 후 7일 이내
  ④ 평가 결과: 우수(90점 이상), 보통(70-89점), 미흡(70점 미만)
  ⑤ 개선 조치: 미흡 시 무상 보완 또는 부분 환불`,
      conditions: ['project_scale:medium', 'project_scale:large'],
      conditions_operator: 'OR',
      essential: true,
      order: 78
    },
    

    simplified_procedure: {
      id: 'simplified_procedure',
      title: '간소화 절차',
      content: `① 문서 간소화: 복잡한 계약 문서 생략
  ② 빠른 의사결정: 48시간 내 피드백 원칙
  ③ 유연한 변경: 경미한 변경은 구두 합의 가능
  ④ 신속 정산: 완료 즉시 대금 지급`,
      conditions: ['project_scale:small', 'complexity:simple'],
      conditions_operator: 'AND',
      essential: false,
      order: 74
    }
  };
  
  // 마감 조항 (모든 계약 공통)
  export const CLOSING_CLAUSES = {
    effective_date: {
      id: 'effective_date',
      title: '계약 효력',
      content: `본 계약은 양 당사자 서명과 동시에 효력이 발생한다.`,
      variables: [],
      essential: true,
      order: 90
    },
  
    governing_law: {
      id: 'governing_law',
      title: '분쟁 해결',
      content: `본 계약과 관련된 분쟁은 대한민국 법률에 따라 해결하며, 관할법원은 {jurisdiction}으로 한다.`,
      variables: [],
      essential: true,
      order: 91
    }
  };
  
  // 전체 조항 통합
  export const ALL_CLAUSES = {
    ...BASE_CLAUSES,
    ...EXECUTION_CYCLE_CLAUSES,
    ...SERVICE_TYPE_CLAUSES,
    ...COMPLEXITY_CLAUSES,
    ...PROJECT_SCALE_CLAUSES,
    ...LOCATION_CLAUSES,
    ...EQUIPMENT_CLAUSES,
    ...CONDITIONAL_CLAUSES,
    ...CLOSING_CLAUSES
  };