export const INDUSTRY_DEFINITIONS = {
    design: {
      name: '디자인',
      icon: '🎨',
      description: '로고, 브랜딩, 웹디자인, 그래픽 디자인',
      keyDecisions: ['revisionCount', 'copyrightTransfer', 'deliverables', 'urgentWork'],
      specialClauses: [
        'design_copyright_exception',
        'portfolio_usage_rights', 
        'design_revision_process',
        'source_file_delivery'
      ],
      defaults: {
        revisionCount: 3,
        warrantyPeriod: '1month',
        paymentMethod: 'split'
      }
    },
  
    development: {
      name: '개발',
      icon: '💻',
      description: '웹사이트, 앱, 소프트웨어 개발',
      keyDecisions: ['paymentMethod', 'copyrightTransfer', 'warrantyPeriod', 'urgentWork'],
      specialClauses: [
        'source_code_ownership',
        'technical_support_period',
        'bug_fix_responsibility', 
        'hosting_responsibility'
      ],
      defaults: {
        warrantyPeriod: '3months',
        paymentMethod: 'milestone',
        revisionCount: 2
      }
    },
  
    marketing: {
      name: '마케팅',
      icon: '📈',
      description: 'SNS 마케팅, 광고 대행, 브랜드 마케팅',
      keyDecisions: ['paymentMethod', 'performanceMetrics', 'adBudgetResponsibility'],
      specialClauses: [
        'performance_not_guaranteed',
        'ad_account_ownership',
        'content_approval_process'
      ],
      defaults: {
        paymentMethod: 'monthly',
        reportingCycle: 'monthly'
      }
    },
  
    consulting: {
      name: '컨설팅',
      icon: '💼',
      description: '비즈니스 컨설팅, 전략 기획',
      keyDecisions: ['paymentMethod', 'deliverables', 'confidentialityLevel'],
      specialClauses: [
        'consulting_scope_limitation',
        'implementation_not_guaranteed',
        'confidentiality_enhanced'
      ],
      defaults: {
        paymentMethod: 'milestone',
        confidentialityLevel: 'high'
      }
    },
  
    content: {
      name: '콘텐츠',
      icon: '✍️',
      description: '카피라이팅, 영상 제작, 콘텐츠 기획',
      keyDecisions: ['revisionCount', 'copyrightTransfer', 'deliverables'],
      specialClauses: [
        'content_originality_guarantee',
        'plagiarism_prevention',
        'content_usage_rights'
      ],
      defaults: {
        revisionCount: 2,
        copyrightTransfer: 'full'
      }
    },
  
    photography: {
      name: '사진/영상',
      icon: '📸',
      description: '제품 촬영, 홍보 영상, 프로필 촬영',
      keyDecisions: ['copyrightTransfer', 'deliverables', 'retakePolicy'],
      specialClauses: [
        'image_usage_rights',
        'retake_conditions',
        'weather_delay_clause'
      ],
      defaults: {
        copyrightTransfer: 'limited',
        retakePolicy: 'weather_only'
      }
    }
  };
  
  export const DECISION_OPTIONS = {
    revisionCount: {
      title: '수정 횟수',
      icon: '🔄',
      options: [
        { value: 1, label: '1회', desc: '명확한 요구사항', riskLevel: 'low' },
        { value: 2, label: '2회', desc: '소규모 프로젝트', riskLevel: 'low' },
        { value: 3, label: '3회 (권장)', desc: '표준 프로젝트', riskLevel: 'medium' },
        { value: 5, label: '5회', desc: '복잡한 프로젝트', riskLevel: 'medium' }
      ]
    },
  
    paymentMethod: {
      title: '결제 방식',
      icon: '💰',
      options: [
        { value: 'advance', label: '선결제 100%', desc: '작업 시작 전 전액', riskLevel: 'low' },
        { value: 'completion', label: '완료 후 일괄', desc: '작업 완료 후 100%', riskLevel: 'high' },
        { value: 'split', label: '50% + 50%', desc: '착수금 + 완료금', riskLevel: 'medium' },
        { value: 'milestone', label: '30% + 30% + 40%', desc: '단계별 지급', riskLevel: 'medium' }
      ]
    },
  
    copyrightTransfer: {
      title: '작업물 소유권',
      icon: '📄',
      options: [
        { value: 'full', label: '완전 양도', desc: '고객이 모든 권리 소유', riskLevel: 'medium' },
        { value: 'limited', label: '제한적 양도', desc: '포트폴리오 사용권 유지', riskLevel: 'low' },
        { value: 'license', label: '사용권만', desc: '저작권은 제작자 유지', riskLevel: 'low' }
      ]
    },
  
    urgentWork: {
      title: '긴급 작업',
      icon: '⚡',
      options: [
        { value: 'extra_50', label: '50% 할증', desc: '추가 비용 청구', riskLevel: 'low' },
        { value: 'extra_100', label: '100% 할증', desc: '2배 비용', riskLevel: 'low' },
        { value: 'negotiable', label: '협의', desc: '상황에 따라 결정', riskLevel: 'medium' },
        { value: 'refuse', label: '거절', desc: '긴급 작업 불가', riskLevel: 'high' }
      ]
    }
  };
  
  export const STANDARD_CLAUSES = {
    confidentiality: {
      title: '비밀유지 의무',
      content: '양 당사자는 업무 과정에서 알게 된 상대방의 기밀정보를 제3자에게 누설하지 않으며, 본 계약 종료 후 2년간 이를 유지한다.',
      legalBasis: '부정경쟁방지법 제10조',
      alwaysInclude: true
    },
  
    intellectualProperty: {
      title: '지식재산권 보호', 
      content: '양 당사자는 상대방의 기존 지식재산권을 침해하지 않으며, 제3자의 권리 침해 시 이를 즉시 통보한다.',
      legalBasis: '저작권법 제136조',
      alwaysInclude: true
    },
  
    disputeResolution: {
      title: '분쟁 해결 절차',
      content: '계약 관련 분쟁 발생 시 당사자간 협의를 우선하며, 해결되지 않을 경우 {관할법원}의 판단을 따른다.',
      legalBasis: '민사소송법 제2조',
      alwaysInclude: true,
      autoFill: ['관할법원']
    },
  
    contractTermination: {
      title: '계약 해지 조건',
      content: '중대한 계약 위반, 파산·부도, 기타 계약 유지가 어려운 사유 발생 시 7일 전 통보 후 해지할 수 있다.',
      legalBasis: '민법 제544조',
      alwaysInclude: true
    },
  
    forcemajeure: {
      title: '불가항력 조항',
      content: '천재지변, 전쟁, 정부의 명령 등 불가항력으로 인한 계약 이행 지연 또는 불가능은 계약 위반으로 보지 않는다.',
      legalBasis: '민법 제537조',
      alwaysInclude: true
    }
  };
  
  export const JURISDICTION_MAPPING = {
    '서울': '서울중앙지방법원',
    '강남구': '서울중앙지방법원',
    '서초구': '서울중앙지방법원',
    '송파구': '서울중앙지방법원',
    '마포구': '서울서부지방법원',
    '은평구': '서울서부지방법원',
    '노원구': '서울북부지방법원',
    '강북구': '서울북부지방법원',
    '성남시': '수원지방법원 성남지원',
    '용인시': '수원지방법원',
    '수원시': '수원지방법원',
    '부천시': '인천지방법원 부천지원',
    '인천': '인천지방법원',
    '부산': '부산지방법원',
    '대구': '대구지방법원',
    'default': '서울중앙지방법원'
  };
  
  export const analyzeContractRisk = (industry, decisions) => {
    let riskScore = 0;
    let riskFactors = [];
    
    Object.entries(decisions).forEach(([key, value]) => {
      const decisionDef = DECISION_OPTIONS[key];
      if (!decisionDef) return;
      
      const selectedOption = decisionDef.options?.find(opt => opt.value == value);
      
      if (selectedOption) {
        switch(selectedOption.riskLevel) {
          case 'high': riskScore += 3; riskFactors.push(`${decisionDef.title}: ${selectedOption.label}`); break;
          case 'medium': riskScore += 1; break;
          case 'low': riskScore += 0; break;
        }
      }
    });
    
    return {
      score: riskScore,
      level: riskScore >= 6 ? 'high' : riskScore >= 3 ? 'medium' : 'low',
      factors: riskFactors
    };
  };