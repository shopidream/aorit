// pages/login.js - NextAuth 구글 OAuth 추가
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signIn, getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, isAuthenticated, loading: authLoading } = useAuthContext();
  const router = useRouter();

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log('이미 로그인됨 - 대시보드로 이동');
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        document.cookie = `token=${data.token}; path=/; max-age=86400`;
        login(data.user);
        
        setTimeout(() => {
          router.replace('/dashboard');
        }, 100);
      } else {
        setError(data.message || '로그인 실패');
      }
    } catch (err) {
      console.error('로그인 에러:', err);
      setError('서버 연결 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    
    try {
      const result = await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: false
      });

      if (result?.error) {
        setError('구글 로그인에 실패했습니다.');
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (err) {
      console.error('구글 로그인 에러:', err);
      setError('구글 로그인 중 오류가 발생했습니다.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // 로딩 중이면 로딩 표시
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // 이미 로그인된 경우 빈 화면
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">대시보드로 이동 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>로그인 - Aorit</title>
        <meta name="description" content="Aorit에 로그인하여 AI 계약서 자동화 서비스를 이용하세요." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/aorit-favicon.png" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* 네비게이션 */}
        <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/95 border-b border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center">
                <div className="relative w-32 h-8">
                  <Image
                    src="/images/aorit-logo.png"
                    alt="Aorit"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
              
              <div className="flex items-center space-x-4">
                <Link 
                  href="/register"
                  className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 border border-gray-300"
                >
                  회원가입
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* 메인 컨텐츠 */}
        <div className="flex justify-center items-center min-h-screen pt-16">
          <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl p-10 shadow-2xl w-full max-w-md mx-4">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">로그인</h1>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* 구글 로그인 버튼 */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full mb-6 bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center"
            >
              {googleLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 mr-2"></div>
                  구글로 로그인 중...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  구글로 계속하기
                </div>
              )}
            </button>

            {/* 구분선 */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    로그인 중...
                  </div>
                ) : (
                  '로그인'
                )}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                계정이 없으신가요?{' '}
                <Link 
                  href="/register" 
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  회원가입
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <Link 
                href="/" 
                className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                ← 홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}