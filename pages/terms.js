// pages/terms.js - 이용약관 페이지
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FileText, Shield, Users, Scale } from 'lucide-react';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>이용약관 - Aorit</title>
        <meta name="description" content="Aorit 서비스 이용약관입니다." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/aorit-favicon.png" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  <span>홈으로</span>
                </Link>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="relative w-24 h-6">
                  <Image
                    src="/images/aorit-logo.png"
                    alt="Aorit"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FileText className="w-4 h-4" />
                <span>이용약관</span>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* 헤더 섹션 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12 text-white">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Scale className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Aorit 이용약관</h1>
                  <p className="text-blue-100 mt-2">최종 수정일: 2025년 1월</p>
                </div>
              </div>
            </div>

            {/* 약관 내용 */}
            <div className="px-8 py-12">
              <div className="prose prose-gray max-w-none">
                
                {/* 제1조 */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                    제1조 (목적)
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    이 약관은 Aorit(이하 "회사"라 함)가 제공하는 AI 기반 견적서 및 계약서 작성 서비스(이하 "서비스"라 함)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                  </p>
                </section>

                {/* 제2조 */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                    제2조 (정의)
                  </h2>
                  <div className="space-y-4">
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                      <p className="text-gray-700 leading-relaxed">"회원"이라 함은 본 약관에 동의하고 회사와 이용계약을 체결하여 서비스를 이용하는 자를 말합니다.</p>
                    </div>
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                      <p className="text-gray-700 leading-relaxed">"서비스"라 함은 회사가 제공하는 AI 기반의 견적서 생성, 계약서 작성, 저장, 관리 등과 관련된 기능 일체를 의미합니다.</p>
                    </div>
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">3</span>
                      <p className="text-gray-700 leading-relaxed">"콘텐츠"라 함은 회원이 서비스를 통해 입력하거나 생성하는 모든 데이터, 문서, 파일을 의미합니다.</p>
                    </div>
                  </div>
                </section>

                {/* 제3조 */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                    제3조 (약관의 효력 및 변경)
                  </h2>
                  <div className="space-y-4">
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                      <p className="text-gray-700 leading-relaxed">본 약관은 회원이 서비스에 가입함과 동시에 효력이 발생합니다.</p>
                    </div>
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                      <p className="text-gray-700 leading-relaxed">회사는 합리적인 사유가 발생할 경우 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있으며, 변경된 약관은 서비스 내 공지 또는 이메일 등을 통해 사전 공지합니다.</p>
                    </div>
                  </div>
                </section>

                {/* 제4조 */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                    제4조 (이용계약 체결)
                  </h2>
                  <div className="space-y-4">
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                      <p className="text-gray-700 leading-relaxed">회원은 회사가 정한 절차에 따라 가입 신청을 하고, 회사가 이를 승낙함으로써 이용계약이 성립됩니다.</p>
                    </div>
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                      <div className="text-gray-700 leading-relaxed">
                        <p className="mb-2">회사는 다음 각 호의 경우 신청을 거부할 수 있습니다.</p>
                        <ul className="ml-4 space-y-1">
                          <li className="flex items-start">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>타인의 명의를 도용하거나 허위 정보를 기재한 경우</span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>서비스 운영을 현저히 저해할 우려가 있는 경우</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 제5조 */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                    제5조 (서비스의 제공)
                  </h2>
                  <div className="space-y-4">
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                      <div className="text-gray-700 leading-relaxed">
                        <p className="mb-2">회사는 회원에게 다음과 같은 서비스를 제공합니다.</p>
                        <ul className="ml-4 space-y-1">
                          <li className="flex items-start">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>AI 기반 견적서 생성 및 관리</span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>AI 기반 계약서 생성 및 관리</span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>생성된 문서의 저장 및 열람 기능</span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>기타 회사가 추가 개발하거나 제공하는 서비스</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                      <p className="text-gray-700 leading-relaxed">회사는 서비스의 일부 또는 전부를 변경, 중단할 수 있으며, 이 경우 회원에게 사전 통지합니다.</p>
                    </div>
                  </div>
                </section>

                {/* 제6조 */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                    제6조 (회원의 의무)
                  </h2>
                  <div className="space-y-4">
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                      <div className="text-gray-700 leading-relaxed">
                        <p className="mb-2">회원은 서비스를 이용함에 있어 다음 행위를 하여서는 안 됩니다.</p>
                        <ul className="ml-4 space-y-1">
                          <li className="flex items-start">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>허위 정보 입력 또는 타인의 정보 도용</span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>불법적이거나 법령에 위반되는 문서 생성</span>
                          </li>
                          <li className="flex items-start">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <span>회사의 서비스 운영을 방해하는 행위</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                      <p className="text-gray-700 leading-relaxed">회원은 본 약관 및 관련 법령을 준수하여야 합니다.</p>
                    </div>
                  </div>
                </section>

                {/* 제7조 */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                    제7조 (지식재산권)
                  </h2>
                  <div className="space-y-4">
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                      <p className="text-gray-700 leading-relaxed">서비스와 관련된 모든 저작권 및 지식재산권은 회사에 귀속됩니다.</p>
                    </div>
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                      <p className="text-gray-700 leading-relaxed">회원이 서비스를 통해 작성한 콘텐츠의 저작권은 회원에게 귀속되나, 서비스 제공을 위한 범위 내에서 회사가 이를 사용할 수 있습니다.</p>
                    </div>
                  </div>
                </section>

                {/* 제8조 */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                    제8조 (책임의 제한)
                  </h2>
                  <div className="space-y-4">
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                      <p className="text-gray-700 leading-relaxed">회사는 AI가 생성한 계약서, 견적서의 법적 효력 또는 적합성에 대해 보증하지 않으며, 최종적인 검토 및 책임은 회원에게 있습니다.</p>
                    </div>
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                      <p className="text-gray-700 leading-relaxed">회사는 천재지변, 시스템 장애, 외부 요인 등 불가항력으로 인한 서비스 중단에 대해서는 책임을 지지 않습니다.</p>
                    </div>
                  </div>
                </section>

                {/* 제9조 */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                    제9조 (이용요금 및 결제)
                  </h2>
                  <div className="space-y-4">
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                      <p className="text-gray-700 leading-relaxed">서비스 이용에 따른 요금은 회사가 별도로 정한 정책에 따릅니다.</p>
                    </div>
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                      <p className="text-gray-700 leading-relaxed">회원은 회사가 지정하는 방법에 따라 이용 요금을 납부하여야 합니다.</p>
                    </div>
                  </div>
                </section>

                {/* 제10조 */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                    제10조 (계약 해지 및 이용제한)
                  </h2>
                  <div className="space-y-4">
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                      <p className="text-gray-700 leading-relaxed">회원은 언제든지 서비스 탈퇴를 신청할 수 있으며, 회사는 이를 즉시 처리합니다.</p>
                    </div>
                    <div className="flex">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                      <p className="text-gray-700 leading-relaxed">회원이 본 약관을 위반하거나 서비스 운영을 방해할 경우, 회사는 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.</p>
                    </div>
                  </div>
                </section>

                {/* 제11조 */}
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-blue-100">
                    제11조 (준거법 및 분쟁 해결)
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    본 약관은 대한민국 법률에 따라 해석되며, 서비스와 관련하여 발생하는 분쟁에 대해서는 회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.
                  </p>
                </section>

              </div>
            </div>
          </div>

          {/* 하단 링크 */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/privacy" 
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Shield className="w-4 h-4 mr-2" />
              개인정보처리방침 보기
            </Link>
            <Link 
              href="/" 
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              서비스 시작하기
            </Link>
          </div>
        </main>


      </div>
    </>
  );
}