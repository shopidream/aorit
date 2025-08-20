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
              
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login"
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    isScrolled
                      ? 'text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300'
                      : 'text-white hover:text-white/80 backdrop-blur-md bg-white/10 border border-white/30 hover:bg-white/20'
                  }`}
                >
                  로그인
                </Link>
                <Link 
                  href="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl border border-white/20"
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
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/85 to-black/95"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-black/20 to-purple-900/30"></div>
          </div>

          {/* Hero 콘텐츠 */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* 베타 배지 */}
            <div className="inline-flex items-center px-4 py-2 mb-8 backdrop-blur-xl bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-white/40 rounded-full shadow-lg">
              <Sparkles className="w-4 h-4 text-yellow-300 mr-2" />
              <span className="text-sm font-medium text-white">베타 버전 출시</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 drop-shadow-2xl">
              AI로 만드는{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                스마트 계약서
              </span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
              수천 개 계약 사례를 학습한 AI가{' '}
              <span className="font-semibold text-yellow-300">단 5분</span>만에 견적과 계약을 완료합니다
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
                수천 계약 사례 학습 AI
              </div>
              <div className="backdrop-blur-xl bg-white/20 border border-white/40 px-4 py-2 rounded-full text-white flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                5분 완료
              </div>
              <div className="backdrop-blur-xl bg-white/20 border border-white/40 px-4 py-2 rounded-full text-white flex items-center">
                <Smartphone className="w-4 h-4 mr-2" />
                모바일 서명 지원
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
                  description: "제공하는 서비스를 AI가 분석하여 자동으로 등록합니다"
                },
                {
                  step: "02", 
                  icon: <TrendingUp className="w-8 h-8" />,
                  title: "견적서 생성",
                  description: "고객 정보만 입력하면 전문적인 견적서가 자동 완성됩니다"
                },
                {
                  step: "03",
                  icon: <Shield className="w-8 h-8" />,
                  title: "계약서 작성", 
                  description: "법률 검증된 계약서 템플릿으로 안전한 계약서를 생성합니다"
                },
                {
                  step: "04",
                  icon: <Smartphone className="w-8 h-8" />,
                  title: "온라인 서명",
                  description: "고객이 모바일에서 간편하게 서명하고 계약을 완료합니다"
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

        {/* 기능 섹션 */}
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
                  title: "AI 자동 완성",
                  description: "AI가 수천개의 계약서를 검토하여 자동 생성합니다",
                  features: ["템플릿 자동 선택", "조항 맞춤 생성", "법률 용어 검증"]
                },
                {
                  icon: <Globe className="w-12 h-12 text-blue-500" />,
                  title: "글로벌 호환",
                  description: "한국 계약법은 물론 해외 계약서도 지원하는 국제 표준 시스템입니다",
                  features: ["다국가 법률 지원", "다국어 번역", "현지화 템플릿"]
                },
                {
                  icon: <Shield className="w-12 h-12 text-green-500" />,
                  title: "법률 검증",
                  description: "법무법인 검토를 거친 안전한 계약서 템플릿을 제공합니다",
                  features: ["변호사 검토 완료", "판례 기반 작성", "리스크 최소화"]
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100">
                  <div className="mb-6">{feature.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                  
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-700">
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

        {/* 가격 섹션 - 다크모드 */}
        <section className="relative z-10 py-20 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                <span className="text-blue-400">요금 안내</span>
              </h2>
              <p className="text-xl text-gray-300">
                필요한 만큼만 사용하고, 언제든지 변경 가능합니다
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Basic",
                  price: "무료",
                  period: "영구",
                  description: "개인 사용자를 위한 기본 플랜",
                  features: [
                    "월 3개 계약서",
                    "기본 템플릿 5개",
                    "이메일 지원",
                    "기본 전자서명"
                  ],
                  buttonText: "무료 시작",
                  buttonHref: "/register",
                  popular: false,
                  icon: <CreditCard className="w-6 h-6" />
                },
                {
                  name: "Pro",
                  price: "29,000원",
                  period: "월",
                  description: "소상공인과 프리랜서를 위한 프로 플랜",
                  features: [
                    "무제한 계약서",
                    "모든 템플릿 이용",
                    "AI 맞춤 생성",
                    "우선 기술지원",
                    "고급 전자서명",
                    "계약서 분석"
                  ],
                  buttonText: "Pro 시작",
                  buttonHref: "/register",
                  popular: true,
                  icon: <Star className="w-6 h-6" />
                },
                {
                  name: "Enterprise",
                  price: "문의",
                  period: "맞춤",
                  description: "기업을 위한 맞춤형 솔루션",
                  features: [
                    "Pro 플랜 모든 기능",
                    "팀 협업 도구",
                    "API 연동",
                    "전담 매니저",
                    "온사이트 교육",
                    "맞춤 개발"
                  ],
                  buttonText: "문의하기",
                  buttonHref: "/contact",
                  popular: false,
                  icon: <Award className="w-6 h-6" />
                }
              ].map((plan, index) => (
                <div key={index} className={`relative border rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-400/50 shadow-xl' 
                    : 'bg-slate-800/50 border-slate-600/50'
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center shadow-lg">
                        <Star className="w-4 h-4 mr-1" />
                        인기
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4 text-blue-400">
                      {plan.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-white mb-1">
                      {plan.price}
                      {plan.price !== "무료" && plan.price !== "문의" && (
                        <span className="text-lg font-normal text-gray-300">/{plan.period}</span>
                      )}
                    </div>
                    <p className="text-gray-300">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-200">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.buttonHref}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-center block ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    }`}
                  >
                    {plan.buttonText}
                  </Link>
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
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <div className="relative w-32 h-8 mb-4">
                  <Image
                    src="/images/aorit-logo-white.png"
                    alt="Aorit"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-gray-400">
                  AI 기반 계약서 자동화 플랫폼
                </p>
              </div>
              
              <div className="flex space-x-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">이용약관</a>
                <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
                <a href="#" className="hover:text-white transition-colors">고객지원</a>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
              <p>&copy; 2025 Aorit. All rights reserved.</p>
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
      </div>
    </>
  );
}