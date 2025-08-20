// contexts/AuthContext.js - 인증 컨텍스트 (401 자동 로그아웃 처리 추가)
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 브라우저에서만 실행
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          console.log('저장된 사용자 정보:', userData);
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    console.log('로그인:', userData);
    setUser(userData);
  };

  const logout = () => {
    console.log('로그아웃');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 쿠키도 삭제
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
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

  // 401 자동 로그아웃 처리를 위한 fetch 래퍼
  const authenticatedFetch = async (url, options = {}) => {
    const authHeaders = getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...authHeaders
      }
    });

    // 401 응답 시 자동 로그아웃
    if (response.status === 401) {
      console.warn('토큰이 만료되었습니다. 자동 로그아웃 처리합니다.');
      logout();
      
      // 로그인 페이지로 리다이렉트 (옵션)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return response;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    getAuthHeaders,
    authenticatedFetch // 새로운 함수 추가
  };

  // 로그를 한 번만 출력 (디버깅용)
  useEffect(() => {
    console.log('AuthContext 초기화 완료:', { 
      username: user?.username,  // username 필드 확인
      name: user?.name,          // 실제 이름
      loading, 
      isAuthenticated: !!user 
    });
  }, [user, loading]);

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