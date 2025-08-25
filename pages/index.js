// pages/index.js - Aorit 글래스모피즘 랜딩페이지
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuthContext } from '../contexts/AuthContext';
import { 
  CheckCircle, 
  ArrowRight, 
  Zap, 
  FileText, 
  Users, 
  Shield,
  Smartphone,
  Globe,
  TrendingUp,
  Star,
  Play,
  CreditCard,
  Clock,
  Award,
  Sparkles,
  Brain,
  Lock
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceInput, setServiceInput] = useState('');
  const [generatedServices, setGeneratedServices] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
    
    // 스크롤 감지
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, loading, router]);

  // 예시 카드 클릭 핸들러
  const handleExampleClick = (text) => {
    setServiceInput(text);
  };

  // 서비스 생성 핸들러
  const handleGenerateService = async () => {
    if (!serviceInput.trim()) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch('/api/ai/generate-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessDescription: serviceInput })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setGeneratedServices(data.services || data.suggestedServices);
        setShowServiceModal(true);
      } else {
        setError(data.error || 'AI 서비스 생성에 실패했습니다');
      }
    } catch (error) {
      console.error('서비스 생성 실패:', error);
      setError('서비스 생성 중 오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  // 서비스 추가 핸들러 (개별 서비스)
  const handleAddService = (service) => {
    localStorage.setItem('pendingService', JSON.stringify(service));
    router.push('/login?from=service-generation');
  };

  // 카테고리 이름 매핑
  const getCategoryName = (categoryId) => {
    const categoryMap = {
      'cleaning': '청소',
      'education': '교육', 
      'design': '디자인',
      'development': '개발',
      'marketing': '마케팅',
      'consulting': '컨설팅',
      'others': '기타'
    };
    return categoryMap[categoryId] || '전문서비스';
  };

  if (!mounted) return null;
  if (loading) return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100" />;
  if (isAuthenticated) return null;

  return (
    <>
      <Head>
        <title>Aorit - AI 계약서 자동화 플랫폼</title>
        <meta name="description" content="AI로 견적서와 계약서를 자동 생성하고, 온라인 서명까지. 프리랜서와 소상공인을 위한 올인원 계약 관리 솔루션" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/aorit-favicon.png" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Aorit - AI 계약서 자동화 플랫폼" />
        <meta property="og:description" content="AI로 견적서와 계약서를 자동 생성하고, 온라인 서명까지" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://kr.aorit.com" />
      </Head>

      <div className="min-h-screen overflow-hidden">
        {/* 네비게이션 - 스크롤에 따라 변경 */}
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'backdrop-blur-xl bg-white/95 border-b border-gray-200 shadow-lg' 
            : 'backdrop-blur-xl bg-black/20 border-b border-white/20 shadow-lg'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="relative w-32 h-8">
                  <Image
                    src={isScrolled ? "/images/aorit-logo.png" : "/images/aorit-logo-white.png"}
                    alt="Aorit"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
  <Link 
    href="/login"
    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base transition-all duration-300 backdrop-blur-md ${
      isScrolled
        ? 'text-gray-700 hover:text-gray-900 bg-white/90 border border-gray-300'
        : 'text-white hover:text-white/80 bg-white/10 border border-white/30 hover:bg-white/20'
    }`}
  >
    로그인
  </Link>
  
  <Link 
    href="/register"
    className="px-4 py-1.5 sm:px-6 sm:py-2 text-sm sm:text-base rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/20"
  >
    무료 시작하기
  </Link>
</div>

            </div>
          </div>
        </nav>

        {/* Hero 섹션 - 영상 배경 */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden pt-16">
          {/* 유튜브 영상 배경 */}
          <div className="absolute inset-0 w-full h-full">
            <iframe
              className="absolute top-1/2 left-1/2 w-[177.77777778vh] h-[56.25vw] min-h-full min-w-full transform -translate-x-1/2 -translate-y-1/2"
              src="https://www.youtube.com/embed/vp2hGeMFac4?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playlist=vp2hGeMFac4"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
            
            {/* 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/90 to-black/95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-black/20 to-purple-900/30"></div>
          </div>

          {/* Hero 콘텐츠 */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

            {/* 글라데이션 글라스모피즘 뱃지 */}
  <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30 backdrop-blur-md border border-white/30 rounded-full text-white font-semibold text-sm shadow-lg">
    베타버전 출시
  </div>
            

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 drop-shadow-2xl whitespace-nowrap">
  AI로 만드는{' '}
  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
    스마트 견적 계약
  </span>
</h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
            웹페이지{' '}
              <span className="font-semibold text-yellow-300">5분 완성.</span> 모바일 링크로 견적과 계약서 서명까지
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link 
                href="/register"
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-2xl hover:shadow-purple-500/25 hover:scale-105 backdrop-blur-sm"
              >
                <span className="text-lg font-semibold">무료로 시작하기</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button 
                onClick={() => setShowVideoModal(true)}
                className="inline-flex items-center px-8 py-4 backdrop-blur-xl bg-white/20 border border-white/40 text-white rounded-xl hover:bg-white/30 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Play className="mr-2 w-5 h-5" />
                <span className="text-lg font-medium">데모 보기</span>
              </button>
            </div>

            {/* 특징 배지들 */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="backdrop-blur-xl bg-white/20 border border-white/40 px-4 py-2 rounded-full text-white flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                AI 작성 웹사이트
              </div>
              <div className="backdrop-blur-xl bg-white/20 border border-white/40 px-4 py-2 rounded-full text-white flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                링크로 바로 고객과 소통
              </div>
              <div className="backdrop-blur-xl bg-white/20 border border-white/40 px-4 py-2 rounded-full text-white flex items-center">
                <Smartphone className="w-4 h-4 mr-2" />
                모바일에서 바로 서명
              </div>
            </div>
          </div>
        </section>

        {/* 프로세스 섹션 */}
        <section className="relative z-10 py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                간단한 <span className="text-purple-600">4단계</span>로 완료
              </h2>
              <p className="text-xl text-gray-600">
                복잡한 계약서 작성, 이제 AI가 대신 처리합니다
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  icon: <FileText className="w-8 h-8" />,
                  title: "서비스 등록",
                  description: "몇 줄만 적으면, 서비스가 웹페이지로 생성됩니다. " 
                },
                {
                  step: "02", 
                  icon: <TrendingUp className="w-8 h-8" />,
                  title: "견적서 생성",
                  description: "고객 문의가 오면, 모바일에서 견적서를 만들어 원클릭 전송하세요."
                },
                {
                  step: "03",
                  icon: <Shield className="w-8 h-8" />,
                  title: "계약서 작성", 
                  description: "고객이 견적을 승인하면, 몇 분 만에 안전한 계약서를 제작하세요."
                },
                {
                  step: "04",
                  icon: <Smartphone className="w-8 h-8" />,
                  title: "온라인 서명",
                  description: "계약서는 링크로 전달하고, 휴대폰으로 간편하게 서명하세요."
                }
              ].map((item, index) => (
                <div key={index} className="relative group">
                  <div className="backdrop-blur-md bg-white/60 border border-white/30 rounded-2xl p-6 hover:bg-white/80 transition-all duration-300 hover:shadow-2xl hover:scale-105">
                    {/* 단계 번호를 더 눈에 띄게 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        {item.step}
                      </div>
                      {index < 3 && (
                        <ArrowRight className="w-5 h-5 text-purple-400 opacity-60" />
                      )}
                    </div>
                    <div className="text-purple-600 mb-4">{item.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI 채팅 섹션 - 다크모드 */}
        <section className="relative z-10 py-20 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                <span className="text-blue-400">어떤 일</span>을 하시나요?
              </h2>
              <p className="text-xl text-gray-300">
              간단히 작성하면, 맞춤 서비스가 만들어집니다.
              </p>
            </div>

            {/* 채팅 입력창 - Google 스타일 다크모드 */}
            <div className="max-w-2xl mx-auto mb-12">
              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-center">
                  {error}
                </div>
              )}
              <div className="flex items-center bg-slate-800/50 border border-slate-600/50 rounded-full shadow-2xl hover:shadow-purple-500/25 transition-shadow p-2"
                onDrop={(e) => e.preventDefault()}
                onDragOver={(e) => e.preventDefault()}
              >
                <textarea
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  placeholder=""
                  className="flex-1 resize-none border-0 rounded-l-full px-6 py-4 focus:outline-none placeholder-gray-400 text-white bg-transparent"
                  rows="1"
                ></textarea>
                <button 
                  onClick={handleGenerateService}
                  disabled={!serviceInput.trim() || isGenerating}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      생성 중...
                    </>
                  ) : (
                    '서비스 생성하기'
                  )}
                </button>
              </div>
            </div>

            {/* 예시 카드 3개 - 다크모드 */}
            <div className="grid md:grid-cols-3 gap-6">
              <div 
                onClick={() => handleExampleClick('신축 아파트 입주청소를 해요. 화장실, 주방, 거실을 깔끔하게 청소합니다. ')}
                className="bg-slate-800/50 border border-slate-600/50 rounded-2xl p-6 cursor-pointer hover:bg-slate-800/70 transition-colors hover:shadow-xl hover:shadow-blue-500/25"
                draggable={false}
              >
                <h3 className="text-xl font-bold text-blue-400 mb-2">청소 서비스 예시</h3>
                <p className="text-gray-300 leading-relaxed">신축 아파트 입주청소를 해요. 화장실, 주방, 거실을 깔끔하게 청소합니다. </p>
              </div>
              
              <div 
                onClick={() => handleExampleClick('중학생 수학 과외를 해요. 일주일에 2번 1:1로 개인 맞춤 지도합니다.')}
                className="bg-slate-800/50 border border-slate-600/50 rounded-2xl p-6 cursor-pointer hover:bg-slate-800/70 transition-colors hover:shadow-xl hover:shadow-emerald-500/25"
                draggable={false}
              >
                <h3 className="text-xl font-bold text-emerald-400 mb-2">과외 서비스 예시</h3>
                <p className="text-gray-300 leading-relaxed">중학생 수학 과외를 해요. 일주일에 2번 1:1로 개인 맞춤 지도합니다. </p>
              </div>
              
              <div 
                onClick={() => handleExampleClick('작은 카페 웹사이트 디자인을 해요. 심플하고 세련되게 제작합니다. ')}
                className="bg-slate-800/50 border border-slate-600/50 rounded-2xl p-6 cursor-pointer hover:bg-slate-800/70 transition-colors hover:shadow-xl hover:shadow-purple-500/25"
                draggable={false}
              >
                <h3 className="text-xl font-bold text-purple-400 mb-2">웹사이트 디자인 예시</h3>
                <p className="text-gray-300 leading-relaxed">작은 카페 웹사이트 디자인을 해요. 심플하고 세련되게 제작합니다. </p>
              </div>
            </div>
          </div>
        </section>

        {/* 기능 섹션 - 라이트모드로 변경 */}
        <section className="relative z-10 py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                <span className="text-purple-600">AI 기술</span>로 더 스마트하게
              </h2>
              <p className="text-xl text-gray-600">
                전문가 수준의 계약서를 누구나 쉽게 만들 수 있습니다
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Zap className="w-12 h-12 text-yellow-500" />,
                  title: "AI 스마트 계약서",
                  description: "AI가 수만개의 계약서를 학습/검토하여 최적의 계약서를 자동 생성합니다",
                  features: ["서비스 정밀 분석", "맞춤 계약 생성", "온라인 간편 절차"]
                },
                {
                  icon: <Globe className="w-12 h-12 text-blue-500" />,
                  title: "글로벌 지원 예정",
                  description: "한국 계약서는 물론 해외 계약서도 지원하는 글로벌 업무 시스템입니다",
                  features: ["다국가 법률 지원", "다국어 계약서 작성", "현지 법률 규정 준수"]
                },
                {
                  icon: <Shield className="w-12 h-12 text-green-500" />,
                  title: "다양한 검증",
                  description: "법률 검토를 거친 안전한 계약서 템플릿을 제공합니다",
                  features: ["완성도 높은 계약서", "AI 시스템으로 위험도 판별", "고객 검증 시스템"]
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100">
                  <div className="mb-6">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                  
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-700 leading-relaxed">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="relative z-10 py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-3xl p-12">
              <div className="flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-purple-600 mr-3" />
                <h2 className="text-4xl font-bold text-gray-900">
                  지금 시작해보세요
                </h2>
              </div>
              <p className="text-xl text-gray-600 mb-8">
                복잡한 계약서 작성, 이제 AI가 5분만에 해결해드립니다.<br />
                무료로 시작하고 필요할 때만 업그레이드하세요.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/register"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-2xl hover:shadow-purple-500/25 hover:scale-105"
                >
                  <span className="text-lg font-semibold">무료로 시작하기</span>
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                
                <Link 
                  href="/login"
                  className="inline-flex items-center px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span className="text-lg font-medium">이미 계정이 있나요?</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 푸터 */}
<footer className="relative z-10 bg-gray-900 text-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div className="grid md:grid-cols-3 gap-8 mb-8">
      {/* 로고 및 설명 */}
      <div>
        <div className="relative w-32 h-8 mb-4">
          <Image
            src="/images/aorit-logo-white.png"
            alt="Aorit"
            fill
            className="object-contain"
          />
        </div>
        <p className="text-gray-400 leading-relaxed">
          아오릿 - AI 기반 계약서 자동화 플랫폼
        </p>
      </div>
      
      {/* 정책 및 약관 */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">정책 및 약관</h4>
        <div className="space-y-3">
          <Link href="/terms" className="block text-gray-400 hover:text-white transition-colors">
            이용약관
          </Link>
          <Link href="/privacy" className="block text-gray-400 hover:text-white transition-colors">
            개인정보처리방침
          </Link>
          <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors">
            고객지원
          </Link>
        </div>
      </div>
      
      {/* 고객센터 */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4">고객센터</h4>
        <div className="space-y-2 text-sm text-gray-400">
          <p className="text-2xl font-bold text-white"></p>
          <p>평일 09:00 - 18:00</p>
          <p>주말 및 공휴일 휴무</p>
          <p className="mt-3">
            <a href="mailto:cs@aorit.com" className="text-blue-400 hover:text-blue-300 transition-colors">
              cs@aorit.com
            </a>
          </p>
        </div>
      </div>
    </div>
    
    {/* 저작권 정보 */}
    <div className="pt-8 border-t border-gray-800 text-center">
      <p className="text-gray-400 text-sm">
        &copy; 2025 펫돌(주) All rights reserved.
      </p>
    </div>
  </div>
</footer>

        {/* 영상 모달 */}
        {showVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative w-full max-w-6xl mx-4 aspect-video">
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl font-bold z-10"
              >
                ✕
              </button>
              <iframe
                className="w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/vp2hGeMFac4?autoplay=1&mute=0&controls=1&showinfo=1&rel=0"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* 서비스 생성 결과 모달 - 4개 카드 */}
        {showServiceModal && generatedServices && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowServiceModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold z-10"
              >
                ✕
              </button>
              
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">AI가 맞춤 서비스를 생성했습니다!</h3>
                  <p className="text-gray-600">3가지 다양한 서비스 옵션을 확인하고 선택하세요</p>
                </div>

                {/* 3개 서비스 카드 그리드 - 콤팩트 세로 스타일 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {generatedServices.map((service, index) => (
                    <div key={service.id || index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      {/* 서비스 헤더 */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h4>
                          <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold text-blue-600">
                              {(service.price || service.estimatedPrice || 100000).toLocaleString()}원
                            </div>
                            <span className="text-sm text-gray-500">{service.duration || '협의'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {getCategoryName(service.categoryId || service.category)}
                          </span>
                        </div>
                      </div>

                      {/* 서비스 설명 */}
                      <div className="mb-4">
                        <p className="text-gray-700 text-sm leading-relaxed">{service.description}</p>
                      </div>

                      {/* 포함 내용 */}
                      <div className="mb-6">
                        <h5 className="text-sm font-semibold text-gray-900 mb-2">포함 내용</h5>
                        <ul className="space-y-1">
                          {(service.features || ['전문 서비스', '맞춤 상담', '품질 보장']).slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 서비스 추가 버튼 */}
                      <button
                        onClick={() => handleAddService(service)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                      >
                        이 서비스 추가하기
                      </button>
                    </div>
                  ))}
                </div>

                {/* 하단 액션 */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowServiceModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    다시 생성하기
                  </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('pendingServices', JSON.stringify(generatedServices));
                      router.push('/login?from=service-generation');
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    모든 서비스 추가하기
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  * 서비스 추가 후 언제든지 수정하실 수 있습니다
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}