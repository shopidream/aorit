// pages/login.js - 헤더 추가 버전
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthContext } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, loading: authLoading } = useAuthContext();
  const router = useRouter();

  // 이미 로그인된 경우 리다이렉트 (한 번만)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log('이미 로그인됨 - 대시보드로 이동');
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated]); // router 제거

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // 토큰과 사용자 정보 저장 (localStorage + 쿠키)
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 쿠키에도 토큰 저장 (middleware용)
        document.cookie = `token=${data.token}; path=/; max-age=86400`; // 24시간
        
        // AuthContext 업데이트
        login(data.user);
        
        console.log('로그인 성공 - 대시보드로 이동');
        
        // 잠시 후 리다이렉트 (상태 업데이트 완료 대기)
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

  // 이미 로그인된 경우 빈 화면 (리다이렉트 대기)
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
        {/* 네비게이션 - Sticky Header */}
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
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사용자명
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="사용자명을 입력하세요"
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