// 📁 data/services/marketingServices.js - 마케팅 플랫폼 구축 서비스

export const marketingServices = [
    {
      id: "google_platform_basic",
      name: "Shopify 연동 및 구글 마케팅 채널 세팅 (기본형)",
      price: 1000000,
      period: "1~2주",
      category: "마케팅 플랫폼 구축",
      type: "service",
      description: "Shopify 기반 구글 마케팅 채널 연동 및 초기 세팅 지원",
      details: [
        "Google Search Console 통합 및 사이트맵 등록",
        "GA4 설정 및 맞춤형 데이터 수집 환경 구축", 
        "Google Ads 연동 및 기본 태그 설치"
      ],
      deliverables: [
        "Search Console 계정 설정 및 사이트 인증",
        "사이트맵 생성 및 등록",
        "GA4 기본 설정 및 전환 이벤트 추가",
        "UA 연동 설정 (지원 종료 전까지)",
        "Google Ads 계정 연동",
        "기본 추적 코드 설치",
        "설정 완료 리포트 제공"
      ]
    },
    {
      id: "google_platform_advanced",
      name: "구글 광고·분석 환경 고도화 패키지",
      price: 2000000,
      period: "2~3주",
      category: "마케팅 플랫폼 구축",
      type: "service",
      description: "데이터 기반 마케팅을 위한 고도화된 분석 환경 구축",
      details: [
        "GA4 + Google Ads 전환추적 통합 설정",
        "브랜드 및 키워드 중심 광고 캠페인 초기 설정",
        "분석 도구 간 유기적 데이터 연동 및 성능 추적 체계 구축"
      ],
      deliverables: [
        "고급 전환 추적 설정 (구매, 가입, 문의 등)",
        "Enhanced Ecommerce 설정",
        "Google Ads 고급 전환 추적 연동",
        "맞춤 세그먼트 및 맞춤 측정기준 설정",
        "브랜드 및 타겟 키워드 캠페인 구조 설계",
        "자동 입찰 전략 기본 설정",
        "Data Studio 대시보드 구성",
        "월간 성과 리포트 템플릿 제공"
      ]
    },
    {
      id: "facebook_platform",
      name: "Shopify / Meta 통합 마케팅 환경 구축 패키지",
      price: 3000000,
      period: "2~3주",
      category: "마케팅 플랫폼 구축",
      type: "service",
      description: "Meta 생태계 통합 마케팅 환경 구축",
      details: [
        "Facebook 페이지 및 Instagram 연동",
        "Meta 픽셀 및 Conversions API 기반 이벤트 추적 설정",
        "계정 보안 및 광고 운영을 위한 구조 최적화"
      ],
      deliverables: [
        "광고 계정 생성 및 권한 설정",
        "Facebook 페이지 최적화 및 Instagram 비즈니스 연동",
        "Meta 픽셀 설치 및 고급 이벤트 설정",
        "Conversions API 연동 구성"
      ]
    }
  ];