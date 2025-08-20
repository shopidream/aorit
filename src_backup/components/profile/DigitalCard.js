// src/components/profile/DigitalCard.js

import React, { useState, useRef } from 'react';

const DigitalCard = ({ profileData, isEditing = false, onSave }) => {
  const [editData, setEditData] = useState(profileData || getDefaultProfile());
  const [activeTab, setActiveTab] = useState('basic');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const canvasRef = useRef(null);

  const tabs = [
    { id: 'basic', label: '기본 정보', icon: '👤' },
    { id: 'contact', label: '연락처', icon: '📱' },
    { id: 'social', label: 'SNS', icon: '🌐' },
    { id: 'portfolio', label: '포트폴리오', icon: '💼' },
    { id: 'design', label: '디자인', icon: '🎨' }
  ];

  const handleInputChange = (section, field, value) => {
    setEditData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editData);
    }
  };

  const handleImageUpload = (section, field, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleInputChange(section, field, e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCardImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 캔버스 크기 설정 (명함 비율 3.5:2 인치)
    canvas.width = 350;
    canvas.height = 200;
    
    // 배경색
    const bgColor = editData.design.backgroundColor || '#ffffff';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 프로필 이미지
    if (editData.basic.profileImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 20, 20, 60, 60);
      };
      img.src = editData.basic.profileImage;
    }
    
    // 텍스트 스타일
    const textColor = editData.design.textColor || '#000000';
    ctx.fillStyle = textColor;
    
    // 이름
    ctx.font = 'bold 18px Arial';
    ctx.fillText(editData.basic.name || '이름', 100, 35);
    
    // 직책
    ctx.font = '14px Arial';
    ctx.fillText(editData.basic.title || '직책', 100, 55);
    
    // 회사
    ctx.font = '12px Arial';
    ctx.fillText(editData.basic.company || '회사명', 100, 75);
    
    // 연락처
    ctx.font = '10px Arial';
    ctx.fillText(editData.contact.email || 'email@example.com', 20, 110);
    ctx.fillText(editData.contact.phone || '010-0000-0000', 20, 125);
    ctx.fillText(editData.contact.website || 'www.website.com', 20, 140);
    
    return canvas.toDataURL();
  };

  const downloadCard = () => {
    const dataURL = generateCardImage();
    const link = document.createElement('a');
    link.download = `${editData.basic.name || 'digital-card'}.png`;
    link.href = dataURL;
    link.click();
  };

  const renderBasicInfo = () => (
    <div className="form-section">
      <h4>기본 정보</h4>
      
      <div className="profile-image-upload">
        <div className="image-preview">
          {editData.basic.profileImage ? (
            <img src={editData.basic.profileImage} alt="Profile" />
          ) : (
            <div className="placeholder">📷</div>
          )}
        </div>
        {isEditing && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload('basic', 'profileImage', e.target.files[0])}
          />
        )}
      </div>
      
      <div className="form-grid">
        <div className="form-group">
          <label>이름 *</label>
          {isEditing ? (
            <input
              type="text"
              value={editData.basic.name}
              onChange={(e) => handleInputChange('basic', 'name', e.target.value)}
              placeholder="이름을 입력하세요"
            />
          ) : (
            <div className="display-value">{editData.basic.name}</div>
          )}
        </div>
        
        <div className="form-group">
          <label>직책</label>
          {isEditing ? (
            <input
              type="text"
              value={editData.basic.title}
              onChange={(e) => handleInputChange('basic', 'title', e.target.value)}
              placeholder="직책을 입력하세요"
            />
          ) : (
            <div className="display-value">{editData.basic.title}</div>
          )}
        </div>
        
        <div className="form-group">
          <label>회사/조직</label>
          {isEditing ? (
            <input
              type="text"
              value={editData.basic.company}
              onChange={(e) => handleInputChange('basic', 'company', e.target.value)}
              placeholder="회사명을 입력하세요"
            />
          ) : (
            <div className="display-value">{editData.basic.company}</div>
          )}
        </div>
        
        <div className="form-group full-width">
          <label>한 줄 소개</label>
          {isEditing ? (
            <textarea
              value={editData.basic.bio}
              onChange={(e) => handleInputChange('basic', 'bio', e.target.value)}
              placeholder="간단한 소개를 입력하세요"
              rows="3"
            />
          ) : (
            <div className="display-value">{editData.basic.bio}</div>
          )}
        </div>
        
        <div className="form-group full-width">
          <label>전문 분야</label>
          {isEditing ? (
            <input
              type="text"
              value={editData.basic.expertise}
              onChange={(e) => handleInputChange('basic', 'expertise', e.target.value)}
              placeholder="전문 분야를 쉼표로 구분하여 입력하세요"
            />
          ) : (
            <div className="display-value">
              {editData.basic.expertise?.split(',').map((skill, index) => (
                <span key={index} className="skill-tag">{skill.trim()}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContactInfo = () => (
    <div className="form-section">
      <h4>연락처 정보</h4>
      
      <div className="form-grid">
        <div className="form-group">
          <label>이메일 *</label>
          {isEditing ? (
            <input
              type="email"
              value={editData.contact.email}
              onChange={(e) => handleInputChange('contact', 'email', e.target.value)}
              placeholder="email@example.com"
            />
          ) : (
            <div className="display-value">
              <a href={`mailto:${editData.contact.email}`}>{editData.contact.email}</a>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>전화번호</label>
          {isEditing ? (
            <input
              type="tel"
              value={editData.contact.phone}
              onChange={(e) => handleInputChange('contact', 'phone', e.target.value)}
              placeholder="010-1234-5678"
            />
          ) : (
            <div className="display-value">
              <a href={`tel:${editData.contact.phone}`}>{editData.contact.phone}</a>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>웹사이트</label>
          {isEditing ? (
            <input
              type="url"
              value={editData.contact.website}
              onChange={(e) => handleInputChange('contact', 'website', e.target.value)}
              placeholder="https://www.example.com"
            />
          ) : (
            <div className="display-value">
              <a href={editData.contact.website} target="_blank" rel="noopener noreferrer">
                {editData.contact.website}
              </a>
            </div>
          )}
        </div>
        
        <div className="form-group full-width">
          <label>주소</label>
          {isEditing ? (
            <textarea
              value={editData.contact.address}
              onChange={(e) => handleInputChange('contact', 'address', e.target.value)}
              placeholder="주소를 입력하세요"
              rows="2"
            />
          ) : (
            <div className="display-value">{editData.contact.address}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSocialLinks = () => (
    <div className="form-section">
      <h4>SNS & 온라인 프로필</h4>
      
      <div className="form-grid">
        <div className="form-group">
          <label>LinkedIn</label>
          {isEditing ? (
            <input
              type="url"
              value={editData.social.linkedin}
              onChange={(e) => handleInputChange('social', 'linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
          ) : (
            <div className="display-value">
              {editData.social.linkedin && (
                <a href={editData.social.linkedin} target="_blank" rel="noopener noreferrer">
                  🔗 LinkedIn
                </a>
              )}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>GitHub</label>
          {isEditing ? (
            <input
              type="url"
              value={editData.social.github}
              onChange={(e) => handleInputChange('social', 'github', e.target.value)}
              placeholder="https://github.com/username"
            />
          ) : (
            <div className="display-value">
              {editData.social.github && (
                <a href={editData.social.github} target="_blank" rel="noopener noreferrer">
                  💻 GitHub
                </a>
              )}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>Behance</label>
          {isEditing ? (
            <input
              type="url"
              value={editData.social.behance}
              onChange={(e) => handleInputChange('social', 'behance', e.target.value)}
              placeholder="https://behance.net/username"
            />
          ) : (
            <div className="display-value">
              {editData.social.behance && (
                <a href={editData.social.behance} target="_blank" rel="noopener noreferrer">
                  🎨 Behance
                </a>
              )}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>Instagram</label>
          {isEditing ? (
            <input
              type="url"
              value={editData.social.instagram}
              onChange={(e) => handleInputChange('social', 'instagram', e.target.value)}
              placeholder="https://instagram.com/username"
            />
          ) : (
            <div className="display-value">
              {editData.social.instagram && (
                <a href={editData.social.instagram} target="_blank" rel="noopener noreferrer">
                  📸 Instagram
                </a>
              )}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>YouTube</label>
          {isEditing ? (
            <input
              type="url"
              value={editData.social.youtube}
              onChange={(e) => handleInputChange('social', 'youtube', e.target.value)}
              placeholder="https://youtube.com/channel/..."
            />
          ) : (
            <div className="display-value">
              {editData.social.youtube && (
                <a href={editData.social.youtube} target="_blank" rel="noopener noreferrer">
                  📺 YouTube
                </a>
              )}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>기타 SNS</label>
          {isEditing ? (
            <input
              type="url"
              value={editData.social.other}
              onChange={(e) => handleInputChange('social', 'other', e.target.value)}
              placeholder="기타 SNS 링크"
            />
          ) : (
            <div className="display-value">
              {editData.social.other && (
                <a href={editData.social.other} target="_blank" rel="noopener noreferrer">
                  🌐 기타 링크
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPortfolio = () => (
    <div className="form-section">
      <h4>포트폴리오 & 성과</h4>
      
      <div className="form-grid">
        <div className="form-group">
          <label>완료 프로젝트 수</label>
          {isEditing ? (
            <input
              type="number"
              value={editData.portfolio.completedProjects}
              onChange={(e) => handleInputChange('portfolio', 'completedProjects', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          ) : (
            <div className="display-value stat-number">
              {editData.portfolio.completedProjects || 0}개
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>고객 만족도</label>
          {isEditing ? (
            <input
              type="number"
              min="0"
              max="100"
              value={editData.portfolio.satisfactionRate}
              onChange={(e) => handleInputChange('portfolio', 'satisfactionRate', parseInt(e.target.value) || 0)}
              placeholder="95"
            />
          ) : (
            <div className="display-value stat-number">
              {editData.portfolio.satisfactionRate || 0}%
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>경력 (년)</label>
          {isEditing ? (
            <input
              type="number"
              value={editData.portfolio.experience}
              onChange={(e) => handleInputChange('portfolio', 'experience', parseInt(e.target.value) || 0)}
              placeholder="5"
            />
          ) : (
            <div className="display-value stat-number">
              {editData.portfolio.experience || 0}년
            </div>
          )}
        </div>
        
        <div className="form-group full-width">
          <label>주요 성과 / 수상 내역</label>
          {isEditing ? (
            <textarea
              value={editData.portfolio.achievements}
              onChange={(e) => handleInputChange('portfolio', 'achievements', e.target.value)}
              placeholder="주요 성과나 수상 내역을 입력하세요"
              rows="3"
            />
          ) : (
            <div className="display-value">{editData.portfolio.achievements}</div>
          )}
        </div>
        
        <div className="form-group full-width">
          <label>포트폴리오 링크</label>
          {isEditing ? (
            <input
              type="url"
              value={editData.portfolio.portfolioUrl}
              onChange={(e) => handleInputChange('portfolio', 'portfolioUrl', e.target.value)}
              placeholder="https://portfolio.example.com"
            />
          ) : (
            <div className="display-value">
              {editData.portfolio.portfolioUrl && (
                <a href={editData.portfolio.portfolioUrl} target="_blank" rel="noopener noreferrer">
                  🔗 포트폴리오 보기
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDesignSettings = () => (
    <div className="form-section">
      <h4>명함 디자인 설정</h4>
      
      <div className="form-grid">
        <div className="form-group">
          <label>배경색</label>
          <input
            type="color"
            value={editData.design.backgroundColor}
            onChange={(e) => handleInputChange('design', 'backgroundColor', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>텍스트 색상</label>
          <input
            type="color"
            value={editData.design.textColor}
            onChange={(e) => handleInputChange('design', 'textColor', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>테마</label>
          <select
            value={editData.design.theme}
            onChange={(e) => handleInputChange('design', 'theme', e.target.value)}
          >
            <option value="modern">모던</option>
            <option value="classic">클래식</option>
            <option value="creative">크리에이티브</option>
            <option value="minimal">미니멀</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>폰트</label>
          <select
            value={editData.design.font}
            onChange={(e) => handleInputChange('design', 'font', e.target.value)}
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
        </div>
      </div>
      
      {/* 실시간 미리보기 */}
      <div className="card-preview">
        <h5>명함 미리보기</h5>
        <canvas 
          ref={canvasRef} 
          width="350" 
          height="200" 
          style={{ border: '1px solid #ddd', maxWidth: '100%' }}
        />
        <button type="button" onClick={generateCardImage} className="btn-secondary">
          미리보기 업데이트
        </button>
        <button type="button" onClick={downloadCard} className="btn-primary">
          명함 다운로드
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic': return renderBasicInfo();
      case 'contact': return renderContactInfo();
      case 'social': return renderSocialLinks();
      case 'portfolio': return renderPortfolio();
      case 'design': return renderDesignSettings();
      default: return renderBasicInfo();
    }
  };

  return (
    <div className="digital-card-container">
      <div className="card-header">
        <h2>디지털 명함</h2>
        <div className="header-actions">
          {isEditing && (
            <button onClick={handleSave} className="btn-primary">
              저장
            </button>
          )}
          <button 
            onClick={() => setIsPreviewMode(!isPreviewMode)} 
            className="btn-secondary"
          >
            {isPreviewMode ? '편집 모드' : '미리보기'}
          </button>
        </div>
      </div>

      {isPreviewMode ? (
        <div className="card-preview-mode">
          <DigitalCardPreview data={editData} />
        </div>
      ) : (
        <div className="card-editor">
          {/* 탭 네비게이션 */}
          <div className="tab-navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
};

// 디지털 명함 미리보기 컴포넌트
const DigitalCardPreview = ({ data }) => {
  return (
    <div className="digital-card-preview" style={{
      backgroundColor: data.design.backgroundColor,
      color: data.design.textColor,
      fontFamily: data.design.font
    }}>
      <div className="card-front">
        <div className="profile-section">
          {data.basic.profileImage && (
            <img src={data.basic.profileImage} alt="Profile" className="profile-image" />
          )}
          <div className="profile-info">
            <h3 className="name">{data.basic.name}</h3>
            <p className="title">{data.basic.title}</p>
            <p className="company">{data.basic.company}</p>
          </div>
        </div>
        
        <div className="contact-section">
          <div className="contact-item">
            <span className="icon">📧</span>
            <span>{data.contact.email}</span>
          </div>
          <div className="contact-item">
            <span className="icon">📞</span>
            <span>{data.contact.phone}</span>
          </div>
          <div className="contact-item">
            <span className="icon">🌐</span>
            <span>{data.contact.website}</span>
          </div>
        </div>
        
        <div className="bio-section">
          <p>{data.basic.bio}</p>
        </div>
        
        <div className="social-links">
          {data.social.linkedin && <a href={data.social.linkedin}>💼</a>}
          {data.social.github && <a href={data.social.github}>💻</a>}
          {data.social.behance && <a href={data.social.behance}>🎨</a>}
          {data.social.instagram && <a href={data.social.instagram}>📸</a>}
          {data.social.youtube && <a href={data.social.youtube}>📺</a>}
        </div>
      </div>
    </div>
  );
};

// 기본 프로필 데이터
function getDefaultProfile() {
  return {
    basic: {
      name: '',
      title: '',
      company: '',
      bio: '',
      expertise: '',
      profileImage: ''
    },
    contact: {
      email: '',
      phone: '',
      website: '',
      address: ''
    },
    social: {
      linkedin: '',
      github: '',
      behance: '',
      instagram: '',
      youtube: '',
      other: ''
    },
    portfolio: {
      completedProjects: 0,
      satisfactionRate: 0,
      experience: 0,
      achievements: '',
      portfolioUrl: ''
    },
    design: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      theme: 'modern',
      font: 'Arial'
    }
  };
}

export default DigitalCard;