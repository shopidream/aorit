// contexts/AuthContext.js - JWT 토큰 통합 인증 컨텍스트
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  // NextAuth 세션을 JWT 토큰으로 변환
  const convertSessionToJWT = async (sessionUser) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: sessionUser.email,
          isNextAuth: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // localStorage에 토큰 저장
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return data.user;
      }
    } catch (error) {
      console.error('JWT 토큰 생성 실패:', error);
    }
    return null;
  };

  useEffect(() => {
    if (status === 'loading') return;

    const initializeAuth = async () => {
      // NextAuth 세션이 있는 경우
      if (session?.user) {
        const existingToken = localStorage.getItem('token');
        
        // 이미 JWT 토큰이 있으면 재사용
        if (existingToken) {
          try {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (savedUser.email === session.user.email) {
              setUser(savedUser);
              setLoading(false);
              return;
            }
          } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }

        // JWT 토큰 생성
        const jwtUser = await convertSessionToJWT(session.user);
        if (jwtUser) {
          setUser(jwtUser);
        }
        setLoading(false);
        return;
      }

      // NextAuth 세션이 없으면 localStorage 확인
      if (typeof window !== 'undefined') {
        try {
          const token = localStorage.getItem('token');
          const savedUser = localStorage.getItem('user');
          
          if (token && savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
          }
        } catch (error) {
          console.error('사용자 정보 로드 실패:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [session, status]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    if (session) {
      await signOut({ redirect: false });
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      window.location.href = '/';
    }
    setUser(null);
  };

  const getAuthHeaders = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
    return {};
  };

  const authenticatedFetch = async (url, options = {}) => {
    const authHeaders = getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...authHeaders
      }
    });

    if (response.status === 401) {
      await logout();
    }

    return response;
  };

  const value = {
    user,
    loading: loading || status === 'loading',
    isAuthenticated: !!user,
    login,
    logout,
    getAuthHeaders,
    authenticatedFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}