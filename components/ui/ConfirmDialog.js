import React from 'react';
import { 
  Button, 
  Card, 
  LoadingSpinner,
  WarningIcon as AlertTriangle,
  InfoIcon as Info,
  CheckCircleIcon as CheckCircle,
  XIcon as X 
} from '../ui/DesignSystem';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "확인",
  message = "이 작업을 계속하시겠습니까?",
  confirmText = "확인",
  cancelText = "취소",
  type = "default", // default, danger, warning, success
  loading = false,
  className = ""
}) {
  
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmVariant: 'danger',
          emoji: '⚠️'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          confirmVariant: 'warning',
          emoji: '🔔'
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          confirmVariant: 'success',
          emoji: '✅'
        };
      default:
        return {
          icon: Info,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmVariant: 'primary',
          emoji: '❓'
        };
    }
  };

  const typeConfig = getTypeConfig();
  const IconComponent = typeConfig.icon;

  const handleConfirm = async () => {
    if (loading) return;
    await onConfirm();
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md shadow-2xl transform transition-all duration-200 ${className}`}>
        <div className="text-center space-y-6">
          
          {/* 아이콘 */}
          <div className="flex justify-center">
            <div className={`p-4 rounded-full ${typeConfig.iconBg}`}>
              <IconComponent size={32} className={typeConfig.iconColor} />
            </div>
          </div>
          
          {/* 제목 */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {title}
            </h3>
            
            {/* 메시지 */}
            <p className="text-gray-600 leading-relaxed text-base">
              {message}
            </p>
          </div>
          
          {/* 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              size="lg"
              className="flex-1"
            >
              {cancelText}
            </Button>
            
            <Button
              variant={typeConfig.confirmVariant}
              onClick={handleConfirm}
              disabled={loading}
              size="lg"
              className="flex-1"
              icon={loading ? LoadingSpinner : undefined}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" color="white" />
                  <span>처리 중...</span>
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </div>

          {/* 타입별 추가 안내 */}
          {type === 'danger' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-700">
                ⚠️ 이 작업은 되돌릴 수 없습니다. 신중하게 결정해주세요.
              </p>
            </div>
          )}
          
          {type === 'warning' && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-700">
                🔔 작업을 진행하기 전에 한 번 더 확인해주세요.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// 편의를 위한 사전 정의된 다이얼로그들
export const DeleteConfirmDialog = (props) => (
  <ConfirmDialog
    type="danger"
    title="삭제 확인"
    message="정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    confirmText="삭제"
    cancelText="취소"
    {...props}
  />
);

export const SaveConfirmDialog = (props) => (
  <ConfirmDialog
    type="success"
    title="저장 확인"
    message="변경사항을 저장하시겠습니까?"
    confirmText="저장"
    cancelText="취소"
    {...props}
  />
);

export const WarningConfirmDialog = (props) => (
  <ConfirmDialog
    type="warning"
    title="주의"
    message="이 작업을 계속하시겠습니까?"
    confirmText="계속"
    cancelText="취소"
    {...props}
  />
);