// pages/privacy.js - 개인정보처리방침 페이지
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, Lock, Eye, UserX, FileText, Mail, Phone } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>개인정보처리방침 - Aorit</title>
        <meta name="description" content="Aorit 개인정보처리방침입니다." />
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
                <Shield className="w-4 h-4" />
                <span>개인정보처리방침</span>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* 헤더 섹션 */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-12 text-white">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">개인정보처리방침</h1>
                  <p className="text-emerald-100 mt-2">시행일자: 2025년 8월 21일</p>
                </div>
              </div>
              <p className="text-emerald-50 leading-relaxed">
                Aorit는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 안전하게 보호하기 위해 다음과 같은 개인정보처리방침을 수립·운영하고 있습니다.
              </p>
            </div>

            {/* 방침 내용 */}
            <div className="px-8 py-12">
              <div className="prose prose-gray max-w-none">
                
                {/* 1. 수집하는 개인정보 항목 */}
                <section className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">1</div>
                    <h2 className="text-2xl font-bold text-gray-900">수집하는 개인정보 항목</h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    회사는 서비스 제공을 위하여 아래와 같은 개인정보를 수집할 수 있습니다.
                  </p>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <UserX className="w-5 h-5 mr-2" />
                        회원가입 시
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 이름</li>
                        <li>• 이메일 주소</li>
                        <li>• 비밀번호</li>
                        <li>• 휴대전화 번호(선택)</li>
                        <li>• 회사명(선택)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                      <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                        <Eye className="w-5 h-5 mr-2" />
                        서비스 이용 시
                      </h4>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>• 결제 정보</li>
                        <li>• 서비스 이용 기록</li>
                        <li>• 접속 로그</li>
                        <li>• 쿠키, IP 주소</li>
                        <li>• 브라우저 정보</li>
                      </ul>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                      <h4 className="font-semibold text-amber-900 mb-3 flex items-center">
                        <Mail className="w-5 h-5 mr-2" />
                        고객 지원 시
                      </h4>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• 문의 내용</li>
                        <li>• 첨부 파일</li>
                        <li>• 연락처</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 2. 개인정보 수집 및 이용 목적 */}
                <section className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">2</div>
                    <h2 className="text-2xl font-bold text-gray-900">개인정보 수집 및 이용 목적</h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    회사는 수집한 개인정보를 다음의 목적을 위해 사용합니다.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">✓</div>
                      <span className="text-gray-700">회원 관리 (회원 식별, 본인 확인, 계정 관리)</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">✓</div>
                      <span className="text-gray-700">서비스 제공 (AI 견적 및 계약 서비스, 결제 및 정산, 콘텐츠 제공)</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">✓</div>
                      <span className="text-gray-700">고객 문의 응대 및 기술 지원</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">✓</div>
                      <span className="text-gray-700">서비스 개선 및 신규 기능 개발</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">✓</div>
                      <span className="text-gray-700">법적 의무 준수 및 분쟁 해결</span>
                    </div>
                  </div>
                </section>

                {/* 3. 개인정보 보유 및 이용 기간 */}
                <section className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">3</div>
                    <h2 className="text-2xl font-bold text-gray-900">개인정보 보유 및 이용 기간</h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    원칙적으로 개인정보는 수집 및 이용 목적 달성 시 지체 없이 파기합니다.<br />
                    다만, 관련 법령에 따라 일정 기간 보관해야 하는 경우는 예외로 합니다.
                  </p>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <ul className="space-y-3">
                      <li className="flex items-start space-x-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700"><strong>계약 또는 청약 철회 기록:</strong> 5년 (전자상거래법)</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700"><strong>대금 결제 및 재화 등의 공급에 관한 기록:</strong> 5년 (전자상거래법)</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700"><strong>소비자 불만 또는 분쟁 처리 기록:</strong> 3년 (전자상거래법)</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-gray-700"><strong>로그인 기록:</strong> 3개월 (통신비밀보호법)</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* 4. 개인정보 제3자 제공 */}
                <section className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">4</div>
                    <h2 className="text-2xl font-bold text-gray-900">개인정보 제3자 제공</h2>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4">
                    <p className="text-red-800 font-semibold mb-2">
                      회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
                    </p>
                    <p className="text-red-700 text-sm">다만, 아래의 경우에는 예외로 합니다.</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start space-x-3">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700">이용자가 사전에 동의한 경우</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700">법령에 근거하여 수사기관, 법원 등 공공기관의 요청이 있는 경우</span>
                    </li>
                  </ul>
                </section>

                {/* 5. 개인정보 처리 위탁 */}
                <section className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">5</div>
                    <h2 className="text-2xl font-bold text-gray-900">개인정보 처리 위탁</h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁할 수 있습니다.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">클라우드 서버 운영</h4>
                      <p className="text-sm text-blue-800">AWS, Google Cloud, 기타 서버 제공사</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">결제 처리</h4>
                      <p className="text-sm text-purple-800">PG사(예: Stripe, Toss Payments 등)</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-semibold text-amber-900 mb-2">이메일/문자 발송</h4>
                      <p className="text-sm text-amber-800">SendGrid, Twilio 등</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                    위탁 시 계약을 통해 개인정보 보호 관련 안전조치를 이행합니다.
                  </p>
                </section>

                {/* 6. 이용자의 권리 및 행사 방법 */}
                <section className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">6</div>
                    <h2 className="text-2xl font-bold text-gray-900">이용자의 권리 및 행사 방법</h2>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                    <p className="text-emerald-800 leading-relaxed mb-4">
                      이용자는 언제든지 자신의 개인정보를 <strong>열람, 수정, 삭제, 처리 정지</strong>를 요청할 수 있습니다.
                    </p>
                    <ul className="space-y-2 text-emerald-700">
                      <li className="flex items-start space-x-3">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span>회원 탈퇴 시 보관 의무가 없는 개인정보는 즉시 파기됩니다.</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></span>
                        <span>권리 행사는 이메일 또는 고객센터를 통해 요청하실 수 있습니다.</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* 7. 개인정보 파기 절차 및 방법 */}
                <section className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">7</div>
                    <h2 className="text-2xl font-bold text-gray-900">개인정보 파기 절차 및 방법</h2>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700">목적 달성 후 즉시 파기하며, 종이에 출력된 개인정보는 분쇄기로 파기합니다.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700">전자적 파일 형태의 정보는 복구 불가능한 기술적 방법으로 삭제합니다.</span>
                    </li>
                  </ul>
                </section>

                {/* 8. 쿠키의 사용 */}
                <section className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">8</div>
                    <h2 className="text-2xl font-bold text-gray-900">쿠키의 사용</h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    회사는 서비스 향상 및 맞춤형 서비스를 제공하기 위해 쿠키를 사용할 수 있습니다.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                    <strong>쿠키 설정 거부 방법:</strong> 브라우저 상단 메뉴 {'>'} 설정 {'>'} 개인정보 {'>'} 쿠키 차단 선택
                    </p>
                  </div>
                </section>

                {/* 9. 개인정보의 안전성 확보 조치 */}
                <section className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">9</div>
                    <h2 className="text-2xl font-bold text-gray-900">개인정보의 안전성 확보 조치</h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    회사는 개인정보 보호를 위해 다음과 같은 조치를 취하고 있습니다.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 bg-blue-50 p-4 rounded-lg">
                      <Lock className="w-6 h-6 text-blue-600" />
                      <span className="text-blue-800 font-medium">개인정보의 암호화 저장</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-purple-50 p-4 rounded-lg">
                      <Shield className="w-6 h-6 text-purple-600" />
                      <span className="text-purple-800 font-medium">해킹 및 악성코드 방지 프로그램</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-amber-50 p-4 rounded-lg">
                      <Eye className="w-6 h-6 text-amber-600" />
                      <span className="text-amber-800 font-medium">개인정보 접근 권한 최소화</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-emerald-50 p-4 rounded-lg">
                      <FileText className="w-6 h-6 text-emerald-600" />
                      <span className="text-emerald-800 font-medium">정기적인 보안 점검</span>
                    </div>
                  </div>
                </section>

                {/* 10. 개인정보 보호책임자 */}
                <section className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">10</div>
                    <h2 className="text-2xl font-bold text-gray-900">개인정보 보호책임자</h2>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <UserX className="w-6 h-6 text-emerald-600" />
                        </div>
                        <p className="font-semibold text-emerald-900">이주용</p>
                        <p className="text-sm text-emerald-700">개인정보 보호책임자</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Mail className="w-6 h-6 text-emerald-600" />
                        </div>
                        <p className="font-semibold text-emerald-900">이메일</p>
                        <p className="text-sm text-emerald-700">cs@aorit.com</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Phone className="w-6 h-6 text-emerald-600" />
                        </div>
                        <p className="font-semibold text-emerald-900">연락처</p>
                        <p className="text-sm text-emerald-700">+82-2-1666-4125</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 11. 개정 고지 의무 */}
                <section className="mb-12">
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg mr-4">11</div>
                    <h2 className="text-2xl font-bold text-gray-900">개정 고지 의무</h2>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <p className="text-blue-800 leading-relaxed">
                      개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 개정될 수 있으며, 
                      개정 시 <strong>최소 7일 전</strong> 홈페이지를 통해 공지합니다.
                    </p>
                  </div>
                </section>

              </div>
            </div>
          </div>

          {/* 하단 링크 */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/terms" 
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <FileText className="w-4 h-4 mr-2" />
              이용약관 보기
            </Link>
            <Link 
              href="/" 
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              서비스 시작하기
            </Link>
          </div>
        </main>

      </div>
    </>
  );
}