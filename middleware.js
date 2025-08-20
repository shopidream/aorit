// middleware.js - 임시 비활성화
import { NextResponse } from 'next/server';

export function middleware(request) {
  // 모든 요청 허용 (테스트용)
  console.log('Middleware: 모든 요청 허용 -', request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: []  // 빈 배열로 설정하여 비활성화
};