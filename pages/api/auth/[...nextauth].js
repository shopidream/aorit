// pages/api/auth/[...nextauth].js - NextAuth 설정
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // 구글 OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    
    // 기존 이메일/비밀번호 로그인
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.');
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user || !user.password) {
            throw new Error('등록되지 않은 이메일입니다.');
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValidPassword) {
            throw new Error('비밀번호가 일치하지 않습니다.');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified
          };
        } catch (error) {
          console.error('로그인 오류:', error);
          throw new Error(error.message || '로그인에 실패했습니다.');
        }
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // 처음 로그인 시
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.emailVerified = user.emailVerified;
        
        // 소셜 로그인 시 계정 연결 정보 저장
        if (account?.provider === 'google') {
          token.provider = 'google';
          token.isNewUser = !user.emailVerified; // 구글로 처음 가입한 경우
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
        session.user.provider = token.provider;
        session.user.isNewUser = token.isNewUser;
      }
      
      return session;
    },
    
    async signIn({ user, account, profile }) {
      try {
        // 구글 로그인 시 추가 처리
        if (account.provider === 'google') {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          });

          // 기존 사용자가 있다면 구글 계정 연결
          if (existingUser) {
            // 이미 구글로 연결된 계정인지 확인
            const existingAccount = await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: 'google',
                  providerAccountId: account.providerAccountId
                }
              }
            });

            if (!existingAccount) {
              // 구글 계정 정보 연결
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token
                }
              });
            }

            // 사용자 정보 업데이트 (이름, 이메일 검증)
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                emailVerified: new Date() // 구글 로그인 시 이메일 자동 검증
              }
            });

            user.id = existingUser.id;
            user.role = existingUser.role;
          } else {
            // 새 사용자 생성 (NextAuth Adapter가 자동 처리)
            user.role = 'user';
            user.emailVerified = new Date();
          }
        }

        return true;
      } catch (error) {
        console.error('로그인 처리 오류:', error);
        return false;
      }
    },
    
    async redirect({ url, baseUrl }) {
      // 로그인 후 리다이렉트 처리
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return `${baseUrl}/dashboard`;
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/auth/error',
    newUser: '/auth/welcome' // 새 사용자 온보딩 페이지
  },
  
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`사용자 로그인: ${user.email} (${account.provider})`);
      
      // 새 사용자 환영 이벤트
      if (isNewUser) {
        console.log(`새 사용자 가입: ${user.email}`);
        // 여기에 환영 이메일 발송 등 추가 로직
      }
    },
    
    async createUser({ user }) {
      console.log(`새 사용자 생성: ${user.email}`);
    }
  },
  
  debug: process.env.NODE_ENV === 'development',
  
  secret: process.env.NEXTAUTH_SECRET,
});