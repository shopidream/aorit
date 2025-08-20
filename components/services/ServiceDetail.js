// components/services/ServiceDetail.js - 구조적으로 안정적인 서비스 상세보기
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from '../ui/DesignSystem';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Clock, 
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// 마크다운 렌더러 - 확장 가능한 구조
const MARKDOWN_RULES = [
  { pattern: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
  { pattern: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
  { pattern: /^### (.+)$/gm, replacement: '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-900">$1</h3>' },
  { pattern: /^## (.+)$/gm, replacement: '<h2 class="text-xl font-semibold mt-8 mb-4 text-gray-900">$1</h2>' },
  { pattern: /^# (.+)$/gm, replacement: '<h1 class="text-2xl font-bold mt-10 mb-6 text-gray-900">$1</h1>' },
  { pattern: /\n/g, replacement: '<br>' }
];

const renderMarkdown = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return MARKDOWN_RULES.reduce((result, rule) => 
    result.replace(rule.pattern, rule.replacement), text
  );
};

// 안전한 JSON 파싱 유틸리티
const safeJsonParse = (data, fallback = []) => {
  if (!data || data === '') return fallback;
  if (typeof data === 'object') return Array.isArray(data) ? data : fallback;
  
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

// 이미지 갤러리 컴포넌트
const ImageGallery = ({ images, title, currentIndex, onIndexChange }) => {
  if (!images.length) {
    return (
      <div className="aspect-video bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
        <span className="text-gray-500">이미지가 없습니다</span>
      </div>
    );
  }

  const nextImage = () => onIndexChange((currentIndex + 1) % images.length);
  const prevImage = () => onIndexChange((currentIndex - 1 + images.length) % images.length);

  return (
    <div className="space-y-4">
      {/* 메인 이미지 */}
      <div className="aspect-video bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 relative">
        <img 
          src={images[currentIndex]} 
          alt={`${title} 이미지 ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = '/placeholder-image.jpg'; // 기본 이미지 설정
          }}
        />
        
        {/* 슬라이더 컨트롤 */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-lg shadow-sm border border-gray-200 hover:bg-white transition-colors"
              aria-label="이전 이미지"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-lg shadow-sm border border-gray-200 hover:bg-white transition-colors"
              aria-label="다음 이미지"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </>
        )}
      </div>
      
      {/* 썸네일 리스트 */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={`thumb-${index}`}
              onClick={() => onIndexChange(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                index === currentIndex 
                  ? 'border-blue-600' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img 
                src={image} 
                alt={`${title} 썸네일 ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/placeholder-thumbnail.jpg';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 기능 목록 컴포넌트
const FeaturesList = ({ features, limit = 5 }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!features.length) return null;

  const displayFeatures = showAll ? features : features.slice(0, limit);
  const hasMore = features.length > limit;

  return (
    <Card>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">주요 기능</h3>
      <div className="space-y-3">
        {displayFeatures.map((feature, index) => (
          <div key={`feature-${index}`} className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <span className="text-gray-700">{feature}</span>
          </div>
        ))}
      </div>
      
      {hasMore && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            icon={showAll ? ChevronUp : ChevronDown}
          >
            {showAll 
              ? '접기' 
              : `${features.length - limit}개 기능 더보기`
            }
          </Button>
        </div>
      )}
    </Card>
  );
};

// 제공 결과물 컴포넌트
const DeliverablesList = ({ deliverables }) => {
  if (!deliverables.length) return null;

  return (
    <Card>
      <h3 className="text-xl font-semibold text-gray-900 mb-4">제공 결과물</h3>
      <div className="space-y-2">
        {deliverables.map((deliverable, index) => (
          <div key={`deliverable-${index}`} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <Star size={16} className="text-emerald-600 flex-shrink-0" />
            <span className="text-gray-700">{deliverable}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// 메인 컴포넌트
export default function ServiceDetail({ 
  service, 
  user, 
  profile, 
  userRole = 'customer', 
  onBack, 
  onEdit, 
  onDelete, 
  deleting = false 
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 데이터 안전성 보장 및 메모이제이션
  const serviceData = useMemo(() => {
    if (!service) return null;

    return {
      id: service.id,
      title: service.title || '제목 없음',
      description: service.description || '',
      price: typeof service.price === 'number' ? service.price : null,
      duration: service.duration || '',
      category: service.category || null,
      images: safeJsonParse(service.images),
      features: safeJsonParse(service.features),
      deliverables: safeJsonParse(service.deliverables)
    };
  }, [service]);

  // 서비스 데이터가 없는 경우 처리
  if (!serviceData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">서비스 정보를 불러올 수 없습니다.</p>
        {onBack && (
          <Button variant="outline" onClick={onBack} className="mt-4">
            돌아가기
          </Button>
        )}
      </div>
    );
  }

  // 관리자 권한 체크
  const isAdmin = ['admin', 'freelancer'].includes(userRole);
  const canEdit = isAdmin && onEdit;
  const canDelete = isAdmin && onDelete;

  return (
    <div className="space-y-8">
      
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        {onBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            icon={ArrowLeft}
          >
            목록으로 돌아가기
          </Button>
        )}
        
        {/* 관리자용 버튼들 */}
        {(canEdit || canDelete) && (
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                icon={Edit}
                onClick={() => onEdit(serviceData)}
              >
                편집
              </Button>
            )}
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => onDelete(serviceData.id, serviceData.title)}
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : '삭제'}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto">
        
        {/* 서비스 기본 정보 */}
        <div className="mb-8">
          {serviceData.category && (
            <Badge variant="primary" size="sm" className="mb-4">
              {serviceData.category.name}
            </Badge>
          )}
          
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {serviceData.title}
          </h1>
          
          <div className="flex items-center gap-6">
            <div className="text-3xl font-bold text-blue-600">
              {serviceData.price ? `${serviceData.price.toLocaleString()}원` : '견적 문의'}
            </div>
          </div>
        </div>

        {/* 메인 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">
          
          {/* 왼쪽: 이미지 갤러리 */}
          <ImageGallery
            images={serviceData.images}
            title={serviceData.title}
            currentIndex={currentImageIndex}
            onIndexChange={setCurrentImageIndex}
          />

          {/* 오른쪽: 서비스 정보 */}
          <div className="space-y-6">
            
            {/* 예상 기간 */}
            {serviceData.duration && serviceData.duration.trim() !== '' && (
              <Card>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">예상 기간</h3>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock size={20} className="text-blue-600" />
                  <span className="text-lg">{serviceData.duration}</span>
                </div>
              </Card>
            )}

            {/* 주요 기능 */}
            <FeaturesList features={serviceData.features} />

            {/* 제공 결과물 */}
            <DeliverablesList deliverables={serviceData.deliverables} />
          </div>
        </div>

        {/* 서비스 소개 섹션 (전체 너비) */}
        {serviceData.description && (
          <Card>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">서비스 소개</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {serviceData.description}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}