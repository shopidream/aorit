// components/layout/Footer.js - 랜딩페이지와 동일한 푸터 컴포넌트
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer({ className = "" }) {
  return (
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
  );
}