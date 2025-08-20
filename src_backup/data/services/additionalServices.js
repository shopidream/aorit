// 📁 data/services/additionalServices.js - 추가 개발 서비스

export const additionalServices = [
    // Shopify 고급 기능 구성
    {
      id: "premium_review_system",
      name: "프리미엄 리뷰 시스템 구축 (L앱/J앱 연동)",
      price: 500000,
      category: "Shopify 고급 기능",
      type: "addon",
      description: "리뷰 수집 자동화 및 이메일 요청 기능 설정"
    },
    {
      id: "advanced_product_options",
      name: "고급 제품 옵션 시스템 구축",
      price: 1000000,
      category: "Shopify 고급 기능",
      type: "addon",
      description: "인쇄·의류 등 맞춤형 복합 옵션 기능 설계 및 설정"
    },
    {
      id: "email_automation",
      name: "이메일 자동화 마케팅 시스템 구축",
      price: 1000000,
      category: "Shopify 고급 기능",
      type: "addon",
      description: "고객 세그먼트 기반 리마케팅 시나리오 자동화"
    },
    {
      id: "live_chat",
      name: "실시간 고객 응대 채팅 기능 도입",
      price: 100000,
      category: "Shopify 고급 기능",
      type: "addon",
      description: "런칭 초기 고객 대응을 위한 라이브챗 설치 및 세팅"
    },
    {
      id: "analytics_system",
      name: "고객 행동 분석 시스템 구축",
      price: 300000,
      category: "Shopify 고급 기능",
      type: "addon",
      description: "사용자 행동 기반 데이터 수집 및 마케팅 활용 기반 마련"
    },
    {
      id: "loyalty_program",
      name: "리워드·추천인 프로그램 구축",
      price: 1000000,
      category: "Shopify 고급 기능",
      type: "addon",
      description: "포인트 적립 및 바이럴 기반 추천 네트워크 시스템 설정"
    },
  
    // 구글 SEO 향상 기능
    {
      id: "multilingual_site",
      name: "다국어 사이트 구축 (최대 20개 언어)",
      price: 1000000,
      category: "구글 SEO 향상",
      type: "addon",
      description: "국제 SEO 최적화를 위한 다국어 콘텐츠 구조 설정"
    },
    {
      id: "broken_link_checker",
      name: "사이트 내 깨진 링크 자동 진단 및 제거",
      price: 200000,
      category: "구글 SEO 향상",
      type: "addon",
      description: "구글 색인 오류 방지를 위한 필수 유지 기능"
    },
    {
      id: "alt_tag_optimization",
      name: "이미지 Alt 태그 자동 최적화",
      price: 200000,
      category: "구글 SEO 향상",
      type: "addon",
      description: "SEO 점수 향상을 위한 이미지 메타정보 자동 생성"
    },
    {
      id: "social_login",
      name: "멀티 소셜 로그인 연동",
      price: 500000,
      category: "구글 SEO 향상",
      type: "social_login",
      unit: "개",
      description: "Google, Meta, Naver, Kakao 등 계정 통합 로그인 기능 구축"
    },
  
    // 디지털 마케팅 통합 설정
    {
      id: "google_marketing_integration",
      name: "구글 마케팅 플랫폼 세팅 및 Shopify 통합 연동",
      price: 1000000,
      category: "디지털 마케팅 통합",
      type: "addon",
      description: "서치 콘솔, 사이트맵, 전환추적 연동 등 마케팅 기초 설정"
    },
    {
      id: "ga4_setup",
      name: "Google Analytics GA4 + UA 이중 설정 및 최적화",
      price: 1000000,
      category: "디지털 마케팅 통합",
      type: "addon",
      description: "고급 전환 추적 및 사용자 행동 데이터 분석 환경 구축"
    },
    {
      id: "google_ads_setup",
      name: "Google Ads 통합 광고 세팅",
      price: 2000000,
      category: "디지털 마케팅 통합",
      type: "addon",
      description: "브랜드/키워드 캠페인 구성 및 타겟링크 연동 최적화"
    },
  
    // Shopify 전문 SEO 설정
    {
      id: "shopify_seo_package",
      name: "Shopify SEO 통합 최적화 패키지",
      price: 2000000,
      category: "Shopify 전문 SEO",
      type: "addon",
      description: "키워드 리서치, 구조 최적화, 메타·콘텐츠·구조 마크업 전체 개선"
    },
  
    // 외부 검색엔진 최적화
    {
      id: "global_search_registration",
      name: "글로벌 검색엔진 등록 지원",
      price: 1000000,
      category: "외부 검색엔진 최적화",
      type: "addon",
      description: "Bing, Naver 등 비구글 채널에 대한 색인 등록 대행"
    },
    {
      id: "search_console_diagnosis",
      name: "Google Search Console 오류 진단 및 수정",
      price: 1000000,
      category: "외부 검색엔진 최적화",
      type: "addon",
      description: "색인 누락, 크롤링 차단 등 SEO 장애 요소 분석 및 조치"
    },
  
    // 커스텀 서비스
    {
      id: "custom_theme_design",
      name: "커스터마이징 테마 디자인",
      price: "협의",
      category: "커스텀 서비스",
      type: "custom",
      description: "Figma/자체디자인에 맞추어 개발(6개월 이상 프로젝트)"
    },
    {
      id: "custom_development",
      name: "커스터마이징 기능",
      price: 80000,
      category: "커스텀 서비스",
      type: "hourly",
      unit: "시간",
      description: "커스텀 기능개발, CSS (80,000원/시간)"
    },
    {
      id: "consulting",
      name: "유선/Zoom 컨설팅",
      price: 200000,
      category: "커스텀 서비스",
      type: "hourly",
      unit: "시간",
      description: "쇼피파이와 글로벌판매 관련 컨설팅 (200,000원/시간)"
    }
  ];