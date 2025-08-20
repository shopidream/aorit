// pages/register.js - 헤더 추가 버전
import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuthContext } from '../contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthContext();

  const handleSuccess = (userData) => {
    login(userData);
    router.push('/dashboard');
  };

  return (
    <>
      <Head>
        <title>회원가입 - Aorit</title>
        <meta name="description" content="Aorit에 가입하여 AI 계약서 자동화 서비스를 시작하세요." />
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
                  href="/login"
                  className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 border border-gray-300"
                >
                  로그인
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* 메인 컨텐츠 */}
        <div className="flex justify-center items-center min-h-screen pt-16">
          <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl p-10 shadow-2xl w-full max-w-md mx-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
              <p className="text-gray-600">새 계정을 만드세요</p>
            </div>
            
            <RegisterForm onSuccess={handleSuccess} />
            
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  로그인
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