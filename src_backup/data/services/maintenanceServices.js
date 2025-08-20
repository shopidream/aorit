// 📁 data/services/maintenanceServices.js - 월간 관리 서비스

export const maintenanceServices = [
    {
      id: "basic_maintenance",
      name: "기본 유지보수 및 컨설팅",
      price: 1000000,
      category: "월간 관리 서비스",
      type: "maintenance",
      description: "Shopify 기본 유지보수 및 기술 지원 서비스",
      unit: "월",
      details: [
        "Shopify 테마 버그 수정",
        "간단한 UI 텍스트 변경",
        "간단한 앱 설치 및 설정 지원 (월 1건)",
        "고객 문의에 대한 응답: 24시간 이내 회신"
      ],
      deliverables: [
        "월간 사이트 상태 점검 리포트",
        "버그 수정 및 개선사항 적용",
        "기술 문의 응답 서비스",
        "월 1회 화상 컨설팅 세션"
      ]
    },
    {
      id: "seo_maintenance",
      name: "기본 + 구글 SEO 관리",
      price: 2000000,
      category: "월간 관리 서비스",
      type: "maintenance",
      description: "기본 유지보수 + 전문적인 SEO 최적화 서비스",
      unit: "월",
      details: [
        "기본 유지보수 서비스 전체 포함",
        "주요 페이지 메타태그 최적화 (제품, 컬렉션, 블로그)",
        "키워드 분석 및 반영 (월 1회 리포트 제공)",
        "Google Search Console 세팅 및 모니터링",
        "크롤링 에러 수정",
        "월간 SEO 리포트"
      ],
      deliverables: [
        "기본 패키지 전체 서비스",
        "월간 키워드 순위 리포트",
        "SEO 개선사항 실행 리포트",
        "Search Console 데이터 분석 리포트",
        "경쟁사 SEO 분석 (분기별)"
      ]
    },
    {
      id: "full_management",
      name: "기본 + 구글 SEO + 광고관리",
      price: 3000000,
      category: "월간 관리 서비스",
      type: "maintenance",
      description: "완전한 디지털 마케팅 관리 서비스",
      unit: "월",
      details: [
        "SEO 패키지 전체 서비스 포함",
        "Google Ads 계정 설정 및 연결",
        "브랜드 캠페인 및 쇼핑 광고 설정",
        "월 광고 예산 50~100만 원 기준 관리",
        "광고 효율 리포트 제공 (CTR, CPA 등)",
        "키워드 및 예산 최적화 (월 2회 조정)"
      ],
      deliverables: [
        "SEO 패키지 전체 서비스",
        "월간 광고 성과 리포트",
        "광고 예산 최적화 리포트",
        "키워드 성과 분석 및 개선안",
        "월 2회 광고 최적화 실행",
        "ROI 개선을 위한 전략 제안"
      ]
    }
  ];