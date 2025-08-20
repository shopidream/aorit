// components/auth/RegisterForm.js - 회원가입 폼
import React, { useState } from 'react';
import { Button, Input, Alert } from '../ui/DesignSystem';

export default function RegisterForm({ onSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess?.(data.user);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('회원가입 중 오류가 발생했습니다');
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
        name="name"
        type="text"
        placeholder="이름"
        value={formData.name}
        onChange={handleChange}
        required
      />
      
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
        {loading ? '가입 중...' : '회원가입'}
      </Button>
    </form>
  );
}