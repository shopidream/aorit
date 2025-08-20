// pages/_app.js
import Head from 'next/head';
import React from 'react';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import Layout from '../components/layout/Layout';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();
  
  // 레이아웃 제외 페이지 (고객용 및 인증 페이지)
  const noLayoutPages = [
    '/login',
    '/register', 
    '/contracts/sign/',
    '/public/',
    '/shared/',
    '/contracts/public/'
  ];
  
  // 현재 경로가 레이아웃 제외 페이지인지 확인
  const shouldShowLayout = !(
    router.pathname === '/' || // 랜딩페이지는 정확히 매칭
    router.pathname === '/contact' || // Contact 페이지 추가
    noLayoutPages.some(page => router.pathname.startsWith(page))
  );

  return (
    <SessionProvider session={session}>
      <AuthProvider>
        <Head>
          <link rel="icon" href="/images/aorit-favicon.png" />
          <title>Aorit - 간편한 온라인 견적과 계약</title>
        </Head>
        {shouldShowLayout ? (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        ) : (
          <Component {...pageProps} />
        )}
      </AuthProvider>
    </SessionProvider>
  );
}