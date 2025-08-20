// components/portfolio/PortfolioForm.js - 포트폴리오 등록 폼
import React, { useState } from 'react';
import { Button, Input, Textarea, Alert } from '../ui/DesignSystem';
import ImageUpload from '../ui/ImageUpload';
import { useAuthContext } from '../../contexts/AuthContext';

export default function PortfolioForm({ onSuccess }) {
  const { getAuthHeaders } = useAuthContext();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess?.(data);
        setFormData({ title: '', description: '', link: '', imageUrl: '' });
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('포트폴리오 등록 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (imageUrl) => {
    setFormData({ ...formData, imageUrl });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert type="error">{error}</Alert>}
      
      <Input
        name="title"
        placeholder="프로젝트 제목"
        value={formData.title}
        onChange={handleChange}
        required
      />
      
      <Textarea
        name="description"
        placeholder="프로젝트 설명"
        value={formData.description}
        onChange={handleChange}
        rows={4}
      />
      
      <Input
        name="link"
        placeholder="프로젝트 링크 (선택사항)"
        value={formData.link}
        onChange={handleChange}
      />
      
      <div>
        <label className="block text-sm font-medium mb-2">프로젝트 이미지</label>
        <ImageUpload
          currentImage={formData.imageUrl}
          onImageChange={handleImageChange}
          width={300}
          height={200}
        />
      </div>
      
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? '등록 중...' : '포트폴리오 등록'}
      </Button>
    </form>
  );
}