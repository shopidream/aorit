import React, { useState, useEffect } from 'react';
import { Button, Input, Alert, Card } from '../ui/DesignSystem';
import { useAuthContext } from '../../contexts/AuthContext';
import { User, Building, CreditCard, PenTool, Settings } from 'lucide-react';

// 간단한 Textarea 컴포넌트
const Textarea = ({ name, placeholder, value, onChange, rows = 4, className = '', ...props }) => (
  <textarea
    name={name}
    placeholder={placeholder}
    value={value || ''}
    onChange={onChange}
    rows={rows}
    className={`block w-full px-4 py-3 text-base border border-gray-200 bg-gray-50 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:outline-none transition-all duration-200 hover:border-gray-300 placeholder:text-gray-400 resize-y ${className}`}
    {...props}
  />
);

export default function ProfileForm({ onSuccess }) {
  const { getAuthHeaders, user } = useAuthContext();
  const [formData, setFormData] = useState({
    contactName: '', contactPhone: '', contactEmail: '',
    companyName: '', ceoName: '', businessNumber: '', companyPhone: '', companyEmail: '', companyAddress: '',
    businessType: '', businessItem: '', companyFax: '',
    bankName: '', accountNumber: '', accountHolder: '',
    signatureImage: '', stampImage: '', stampSize: 60, // 도장 크기 기본값 60px
    bio: '', website: '', instagram: '', facebook: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState({ signature: false, stamp: false });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: user.name || '',
        contactEmail: user.email || '',
        companyPhone: prev.contactPhone,
        companyEmail: user.email || ''
      }));
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile', { headers: getAuthHeaders() });
      const data = await response.json();
      
      if (data) {
        const snsLinks = data.snsLinks ? JSON.parse(data.snsLinks) : {};
        setFormData(prev => ({
          ...prev,
          contactName: data.contactName || prev.contactName,
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || prev.contactEmail,
          companyName: data.companyName || '',
          ceoName: data.ceoName || '',
          businessNumber: data.businessNumber || '',
          companyPhone: data.companyPhone || prev.contactPhone,
          companyEmail: data.companyEmail || prev.contactEmail,
          companyAddress: data.companyAddress || '',
          businessType: data.businessType || '',
          businessItem: data.businessItem || '',
          companyFax: data.companyFax || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          accountHolder: data.accountHolder || '',
          signatureImage: data.signatureImage || '',
          stampImage: data.stampImage || '',
          stampSize: data.stampSize || 60, // 저장된 도장 크기 로드
          bio: data.bio || '',
          website: data.website || '',
          instagram: snsLinks.instagram || '',
          facebook: snsLinks.facebook || ''
        }));
      }
    } catch (error) {
      console.error('프로필 조회 실패:', error);
    }
  };

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    
    // 파일 크기 체크 (1MB 제한)
    if (file.size > 1 * 1024 * 1024) {
      alert('이미지 크기는 1MB 이하여야 합니다.');
      return;
    }

    // 파일 형식 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));
    setError('');

    try {
      // FormData 방식으로 업로드
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('type', 'profile'); // 프로필 이미지 타입

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: getAuthHeaders(), // Authorization 헤더만 포함
        body: uploadFormData
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const imageUrl = data.url || data.filePath;
        setFormData(prev => ({
          ...prev,
          [type === 'signature' ? 'signatureImage' : 'stampImage']: imageUrl
        }));
        console.log(`${type} 업로드 성공:`, imageUrl);
      } else {
        console.error('업로드 실패:', data);
        setError(data.error || '이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('업로드 중 오류:', error);
      setError('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'businessNumber') {
      const numbers = value.replace(/\D/g, '');
      let formatted = numbers;
      if (numbers.length > 3) formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      if (numbers.length > 5) formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
      setFormData({ ...formData, [name]: formatted });
    } else if (name === 'contactPhone') {
      setFormData({ ...formData, [name]: value, companyPhone: formData.companyPhone || value });
    } else if (name === 'contactEmail') {
      setFormData({ ...formData, [name]: value, companyEmail: formData.companyEmail || value });
    } else if (name === 'stampSize') {
      setFormData({ ...formData, [name]: parseInt(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.contactName || !formData.contactEmail || !formData.companyName) {
      setError('담당자명, 담당자 이메일, 회사명은 필수입니다.');
      setLoading(false);
      return;
    }

    if (formData.businessNumber && !/^\d{3}-?\d{2}-?\d{5}$/.test(formData.businessNumber)) {
      setError('사업자번호는 123-12-12345 형식으로 입력해주세요.');
      setLoading(false);
      return;
    }

    const { instagram, facebook, ...profileData } = formData;
    const snsLinks = {};
    if (instagram) snsLinks.instagram = instagram;
    if (facebook) snsLinks.facebook = facebook;

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          ...profileData,
          businessNumber: profileData.businessNumber.replace(/-/g, ''),
          snsLinks: Object.keys(snsLinks).length > 0 ? snsLinks : null
        })
      });

      const data = await response.json();
      if (response.ok) {
        onSuccess?.(data);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('프로필 수정 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert type="error">{error}</Alert>}
      
      {/* 담당자 정보 */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <User size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-800">담당자 정보</h3>
            <p className="text-sm text-blue-600">연락처와 기본 정보</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input name="contactName" placeholder="담당자명 *" value={formData.contactName} onChange={handleChange} required />
          <Input name="contactPhone" placeholder="담당자 휴대폰" value={formData.contactPhone} onChange={handleChange} />
          <Input name="contactEmail" type="email" placeholder="담당자 이메일 *" value={formData.contactEmail} onChange={handleChange} required />
        </div>
      </Card>

      {/* 회사 정보 */}
      <Card className="bg-emerald-50 border-emerald-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Building size={20} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-800">회사 정보</h3>
            <p className="text-sm text-emerald-600">사업자 정보와 주소</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="companyName" placeholder="회사명 *" value={formData.companyName} onChange={handleChange} required />
            <Input name="ceoName" placeholder="대표이사명" value={formData.ceoName} onChange={handleChange} />
            <Input name="businessNumber" placeholder="사업자번호 (123-12-12345)" value={formData.businessNumber} onChange={handleChange} maxLength={12} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="businessType" placeholder="업태 (서비스업, 도매업 등)" value={formData.businessType} onChange={handleChange} />
            <Input name="businessItem" placeholder="종목 (웹개발, 디자인 등)" value={formData.businessItem} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="companyPhone" placeholder="회사전화" value={formData.companyPhone} onChange={handleChange} />
            <Input name="companyFax" placeholder="팩스번호" value={formData.companyFax} onChange={handleChange} />
            <Input name="companyEmail" type="email" placeholder="회사이메일" value={formData.companyEmail} onChange={handleChange} />
          </div>
          <Input name="companyAddress" placeholder="회사주소" value={formData.companyAddress} onChange={handleChange} />
        </div>
      </Card>

      {/* 계좌 정보 */}
      <Card className="bg-amber-50 border-amber-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-amber-100 rounded-xl">
            <CreditCard size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-800">계좌 정보</h3>
            <p className="text-sm text-amber-600">대금 입금을 위한 계좌</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input name="bankName" placeholder="은행명 (예: 국민은행)" value={formData.bankName} onChange={handleChange} />
          <Input name="accountNumber" placeholder="계좌번호" value={formData.accountNumber} onChange={handleChange} />
          <Input name="accountHolder" placeholder="예금주명" value={formData.accountHolder} onChange={handleChange} />
        </div>
        <p className="text-sm text-amber-700 mt-3">계약서 및 견적서에 표시되는 정보입니다.</p>
      </Card>

      {/* 서명 정보 */}
      <Card className="bg-purple-50 border-purple-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-100 rounded-xl">
            <PenTool size={20} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-purple-800">서명 정보</h3>
            <p className="text-sm text-purple-600">계약서 서명용 이미지</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 사인 이미지 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">사인 이미지</label>
            {formData.signatureImage && (
              <div className="mb-3">
                <img src={formData.signatureImage} alt="사인" className="max-w-full h-20 object-contain border border-gray-300 rounded-lg bg-white p-2" />
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageUpload(e.target.files[0], 'signature')} 
              disabled={uploading.signature} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50" 
            />
            {uploading.signature && <p className="text-sm text-purple-600 mt-2">업로드 중...</p>}
          </div>

          {/* 도장 이미지 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">도장 이미지</label>
            {formData.stampImage && (
              <div className="mb-3 flex items-center gap-4">
                <img 
                  src={formData.stampImage} 
                  alt="도장" 
                  style={{ width: `${formData.stampSize}px`, height: `${formData.stampSize}px` }}
                  className="object-contain border border-gray-300 rounded-lg bg-white p-1" 
                />
                <div className="text-sm text-gray-600">
                  <p>미리보기</p>
                  <p>{formData.stampSize}px × {formData.stampSize}px</p>
                </div>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageUpload(e.target.files[0], 'stamp')} 
              disabled={uploading.stamp} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50" 
            />
            {uploading.stamp && <p className="text-sm text-purple-600 mt-2">업로드 중...</p>}
            
            {/* 도장 크기 조절 슬라이더 */}
            {formData.stampImage && (
              <div className="mt-4 p-4 bg-purple-25 border border-purple-200 rounded-lg">
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  도장 크기: {formData.stampSize}px
                </label>
                <input
                  type="range"
                  name="stampSize"
                  min="40"
                  max="120"
                  step="5"
                  value={formData.stampSize}
                  onChange={handleChange}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-purple-600 mt-1">
                  <span>작게</span>
                  <span>보통(법인도장)</span>
                  <span>크게</span>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  실제 도장 크기에 맞게 조절하세요. 계약서에서 이 크기로 표시됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-purple-700 mt-4">PNG 파일 권장 (배경 투명). 계약서 서명시 사용됩니다. 최대 1MB.</p>
      </Card>

      {/* 기타 정보 */}
      <Card className="bg-gray-50 border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Settings size={20} className="text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">기타 정보</h3>
            <p className="text-sm text-gray-600">회사 소개와 소셜 링크</p>
          </div>
        </div>
        <div className="space-y-4">
          <Textarea name="bio" placeholder="회사 소개" value={formData.bio} onChange={handleChange} rows={3} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="website" placeholder="웹사이트 URL" value={formData.website} onChange={handleChange} />
            <Input name="instagram" placeholder="Instagram ID" value={formData.instagram} onChange={handleChange} />
            <Input name="facebook" placeholder="Facebook ID" value={formData.facebook} onChange={handleChange} />
          </div>
        </div>
      </Card>
      
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? '저장 중...' : '프로필 저장'}
      </Button>

      {/* 슬라이더 스타일링 */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
        }
      `}</style>
    </form>
  );
}