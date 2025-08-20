// components/catalog/ShareModal.js - 공유 모달 컴포넌트
import React, { useState } from 'react';
import { Card, Button } from '../ui/DesignSystem';
import { X, Copy, ExternalLink, Share2 } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, shareUrl, serviceCount }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  const handlePreview = () => {
    window.open(shareUrl, '_blank');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '서비스 소개',
        text: '전문적인 서비스를 확인해보세요',
        url: shareUrl
      });
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Share2 size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">서비스 공유</h3>
              <p className="text-sm text-gray-600">{serviceCount}개 서비스</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          
          {/* 링크 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              공유 링크
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <Button
                size="sm"
                variant={copied ? "success" : "outline"}
                icon={Copy}
                onClick={handleCopy}
              >
                {copied ? '복사됨' : '복사'}
              </Button>
            </div>
          </div>

          {/* QR 코드 */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              QR 코드
            </label>
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
              <img 
                src={qrCodeUrl} 
                alt="QR Code"
                className="w-30 h-30"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div 
                className="w-30 h-30 bg-gray-100 flex items-center justify-center text-gray-500 text-xs hidden"
              >
                QR 코드 로딩 실패
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              icon={ExternalLink}
              onClick={handlePreview}
            >
              새 탭에서 미리보기
            </Button>
            
            {navigator.share && (
              <Button
                variant="outline"
                className="w-full"
                icon={Share2}
                onClick={handleShare}
              >
                모바일 공유하기
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}