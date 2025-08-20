// components/auth/LoginForm.js - 로그인 폼 (리다이렉트 수정)
import React, { useState } from 'react';
import { Button, Input, Alert } from '../ui/DesignSystem';

export default function LoginForm({ onSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 페이지 강제 새로고침으로 리다이렉트
        window.location.href = '/dashboard';
        
        // onSuccess 콜백도 실행
        onSuccess?.(data.user);
      } else {
        setError(data.error || '로그인에 실패했습니다');
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      setError('로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}
      
      <Input
        name="email"
        type="email"
        placeholder="이메일"
        value={formData.email}
        onChange={handleChange}
        required
      />
      
      <Input
        name="password"
        type="password"
        placeholder="비밀번호"
        value={formData.password}
        onChange={handleChange}
        required
      />
      
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}