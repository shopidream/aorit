// components/ui/DesignSystem.js - 통일된 네이비/블루 색상 체계 + 모던 Input 스타일
import React from 'react';

// 내장 SVG 아이콘 컴포넌트들
const Settings = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-3.5L19 6.5M5 19.5 6.5 18M18.5 18 17 19.5M6.5 6.5 5 5"/>
  </svg>
);

const FileText = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const Calculator = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="12" y2="14"/>
    <line x1="8" y1="18" x2="12" y2="18"/>
    <circle cx="16" cy="16" r="2"/>
  </svg>
);

const Users = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const TrendingUp = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/>
    <polyline points="16,7 22,7 22,13"/>
  </svg>
);

const Plus = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const Search = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

const Check = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const X = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const AlertTriangle = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const Info = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const CheckCircle = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const XCircle = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const Clock = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const ArrowRight = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12,5 19,12 12,19"/>
  </svg>
);

const Home = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const BarChart3 = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);

const FileContract = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <circle cx="10" cy="20" r="2"/>
    <circle cx="14" cy="20" r="2"/>
  </svg>
);

const Briefcase = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const Bot = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
    <line x1="8" y1="16" x2="8" y2="16"/>
    <line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);

const Sparkles = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M9 12l2 2 4-4"/>
    <path d="M21 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
    <path d="M3 12c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
    <path d="M12 21c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
    <path d="M12 3c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z"/>
    <path d="M18.364 18.364c.39.39 1.024.39 1.414 0s.39-1.024 0-1.414-.024-.39-1.414 0-.39 1.024 0 1.414z"/>
    <path d="M4.222 4.222c.39.39 1.024.39 1.414 0s.39-1.024 0-1.414-1.024-.39-1.414 0-.39 1.024 0 1.414z"/>
  </svg>
);

// Button 컴포넌트 - 통일된 네이비/블루 색상 체계
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  as = 'button',
  href,
  target,
  icon: IconComponent,
  iconPosition = 'left',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none border border-transparent focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    // 기본 액션 버튼 - 네이비 블루
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md focus:ring-blue-500',
    
    // 보조 액션 버튼 - 에메랄드 (성공/완료 등)
    secondary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:bg-emerald-700 active:bg-emerald-800 shadow-sm hover:shadow-md focus:ring-emerald-500',
    
    // 경고/주의 버튼 - 앰버
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:bg-amber-600 active:bg-amber-700 shadow-sm hover:shadow-md focus:ring-amber-500',
    
    // 위험/삭제 버튼 - 레드
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md focus:ring-red-500',
    
    // 아웃라인 버튼 - 네이비 블루 테두리
    outline: 'border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-50 focus:bg-blue-50 active:bg-blue-100 focus:ring-blue-500',
    
    // 고스트 버튼 - 투명 배경
    ghost: 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100 active:bg-gray-200 focus:ring-gray-500',
    
    // 성공 상태 버튼
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:bg-emerald-700 active:bg-emerald-800 shadow-sm hover:shadow-md focus:ring-emerald-500'
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[36px] gap-2',
    md: 'px-6 py-3 text-base min-h-[44px] gap-2',
    lg: 'px-8 py-4 text-lg min-h-[52px] gap-3'
  };
  
  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'} ${className}`;
  
  const content = (
    <>
      {IconComponent && iconPosition === 'left' && (
        <IconComponent size={iconSizes[size]} />
      )}
      {children}
      {IconComponent && iconPosition === 'right' && (
        <IconComponent size={iconSizes[size]} />
      )}
    </>
  );
  
  if (as === 'a') {
    return (
      <a href={href} target={target} className={classes} {...props}>
        {content}
      </a>
    );
  }
  
  return (
    <button 
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
};

// Input 컴포넌트 - 모던 스타일 적용
export const Input = ({ 
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error = false,
  className = '',
  label,
  helpText,
  icon: IconComponent,
  iconPosition = 'left',
  ...props 
}) => {
  const baseClasses = 'block w-full px-4 py-3 text-base border rounded-xl transition-all duration-200 focus:outline-none focus:ring-4';
  
  // 모던 스타일 적용
  const normalClasses = 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-blue-500/15 hover:border-gray-300';
  const errorClasses = error ? 'border-red-300 bg-red-50 text-red-900 placeholder:text-red-400 focus:border-red-500 focus:ring-red-500/15' : normalClasses;
  const disabledClasses = disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : '';
  const iconClasses = IconComponent ? (iconPosition === 'left' ? 'pl-11' : 'pr-11') : '';
  
  // placeholder 스타일링
  const placeholderClasses = 'placeholder:text-gray-400';
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {IconComponent && (
          <div className={`absolute inset-y-0 ${iconPosition === 'left' ? 'left-0' : 'right-0'} pl-3 flex items-center pointer-events-none`}>
            <IconComponent size={18} className="text-gray-400" />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`${baseClasses} ${errorClasses} ${disabledClasses} ${iconClasses} ${placeholderClasses} ${className}`}
          {...props}
        />
      </div>
      {helpText && (
        <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {helpText}
        </p>
      )}
    </div>
  );
};

// Textarea 컴포넌트 - 모던 스타일 적용
export const Textarea = ({ 
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error = false,
  className = '',
  label,
  helpText,
  rows = 4,
  ...props 
}) => {
  const baseClasses = 'block w-full px-4 py-3 text-base border rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 resize-y';
  
  // 모던 스타일 적용
  const normalClasses = 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-blue-500/15 hover:border-gray-300';
  const errorClasses = error ? 'border-red-300 bg-red-50 text-red-900 placeholder:text-red-400 focus:border-red-500 focus:ring-red-500/15' : normalClasses;
  const disabledClasses = disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : '';
  
  // placeholder 스타일링
  const placeholderClasses = 'placeholder:text-gray-400';
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        rows={rows}
        className={`${baseClasses} ${errorClasses} ${disabledClasses} ${placeholderClasses} ${className}`}
        {...props}
      />
      {helpText && (
        <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {helpText}
        </p>
      )}
    </div>
  );
};

// Select 컴포넌트 - 새로 추가 (모던 스타일)
export const Select = ({ 
  value,
  onChange,
  required = false,
  disabled = false,
  error = false,
  className = '',
  label,
  helpText,
  children,
  placeholder,
  ...props 
}) => {
  const baseClasses = 'block w-full px-4 py-3 text-base border rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 appearance-none bg-no-repeat bg-right bg-[length:16px_16px] pr-10';
  
  // 모던 스타일 적용
  const normalClasses = 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-blue-500/15 hover:border-gray-300';
  const errorClasses = error ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500/15' : normalClasses;
  const disabledClasses = disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : '';
  
  // 화살표 아이콘 CSS
  const arrowBg = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e";
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`${baseClasses} ${errorClasses} ${disabledClasses} ${className}`}
          style={{ backgroundImage: `url("${arrowBg}")` }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
      </div>
      {helpText && (
        <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {helpText}
        </p>
      )}
    </div>
  );
};

// Card 컴포넌트 - 개선된 디자인과 여백
export const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  selected = false,
  padding = 'default',
  variant = 'default',
  ...props 
}) => {
  let cardClasses = 'bg-white rounded-2xl border transition-all duration-300';
  
  // 선택 상태별 스타일
  if (selected) {
    cardClasses = 'bg-blue-50 rounded-2xl border-2 border-blue-600 shadow-lg transition-all duration-300';
  } else {
    // 기본 카드 스타일
    cardClasses += ' border-gray-200 shadow-sm';
    
    // 호버 효과 (데스크톱만)
    if (hover) {
      cardClasses += ' hover:shadow-lg hover:-translate-y-1 hover:border-gray-300 cursor-pointer';
    }
  }
  
  // 패딩 옵션
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8'
  };
  
  // 터치 디바이스에서의 활성 상태
  const touchClasses = 'active:scale-[0.98] active:shadow-sm';
  
  return (
    <div 
      className={`${cardClasses} ${paddingClasses[padding]} ${hover ? touchClasses : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Alert 컴포넌트 - 통일된 색상 체계
export const Alert = ({ 
  type = 'info', 
  title, 
  children, 
  className = '',
  dismissible = false,
  onDismiss
}) => {
  const types = {
    info: { 
      style: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: Info
    },
    success: { 
      style: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: CheckCircle
    },
    warning: { 
      style: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: AlertTriangle
    },
    error: { 
      style: 'bg-red-50 border-red-200 text-red-800',
      icon: XCircle
    }
  };
  
  const config = types[type];
  const IconComponent = config.icon;
  
  return (
    <div className={`border-2 rounded-xl p-4 ${config.style} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent size={20} />
        </div>
        <div className="ml-3 flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm leading-relaxed">{children}</div>
        </div>
        {dismissible && (
          <button 
            onClick={onDismiss}
            className="flex-shrink-0 ml-3 p-1 hover:bg-black/5 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

// Badge 컴포넌트 - 통일된 색상 체계
export const Badge = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  icon: IconComponent
}) => {
  const variants = {
    // 기본 - 네이비 블루
    primary: 'bg-blue-100 text-blue-800 border border-blue-200',
    
    // 성공 - 에메랄드
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    
    // 경고 - 앰버
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    
    // 위험 - 레드
    danger: 'bg-red-100 text-red-800 border border-red-200',
    
    // 정보 - 블루
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    
    // 보조 - 그레이
    secondary: 'bg-gray-100 text-gray-800 border border-gray-200'
  };
  
  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2'
  };
  
  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {IconComponent && <IconComponent size={iconSizes[size]} />}
      {children}
    </span>
  );
};

// LoadingSpinner 컴포넌트 - 통일된 색상
export const LoadingSpinner = ({ size = 'md', className = '', color = 'blue' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  const colors = {
    blue: 'border-gray-200 border-t-blue-600',
    emerald: 'border-gray-200 border-t-emerald-600',
    gray: 'border-gray-200 border-t-gray-600'
  };
  
  return (
    <div className={`animate-spin rounded-full border-4 ${colors[color]} ${sizes[size]} ${className}`}></div>
  );
};

// SearchBox 컴포넌트 - 모던 스타일 적용
export const SearchBox = ({ 
  value, 
  onChange, 
  placeholder = "검색...", 
  onSearch,
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={18} className="text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:outline-none transition-all duration-200 hover:border-gray-300 placeholder:text-gray-400"
        onKeyPress={(e) => e.key === 'Enter' && onSearch && onSearch()}
      />
    </div>
  );
};

// StatsCard 컴포넌트 - 통일된 색상과 개선된 스타일
export const StatsCard = ({ 
  title, 
  value, 
  icon: IconComponent, 
  trend,
  className = '',
  variant = 'default'
}) => {
  const variants = {
    default: 'bg-blue-50 border-blue-100',
    success: 'bg-emerald-50 border-emerald-100',
    warning: 'bg-amber-50 border-amber-100',
    danger: 'bg-red-50 border-red-100'
  };

  const iconVariants = {
    default: 'bg-blue-100 text-blue-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    danger: 'bg-red-100 text-red-600'
  };

  return (
    <Card className={`border-2 ${variants[variant]} ${className}`} padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
        {IconComponent && (
          <div className={`p-3 rounded-xl ${iconVariants[variant]}`}>
            <IconComponent size={24} />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="text-3xl font-bold text-gray-900">
          {typeof value === 'number' && value > 1000 
            ? value.toLocaleString() 
            : value
          }
        </div>
        {trend && (
          <div className="flex items-center space-x-1">
            <span className={`text-sm font-semibold ${
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? '↗' : '↘'} {trend.value}
            </span>
            <span className="text-sm text-gray-500">vs 지난 달</span>
          </div>
        )}
      </div>
    </Card>
  );
};

// QuickActionCard 컴포넌트 - 통일된 색상과 개선된 인터랙션
export const QuickActionCard = ({ 
  title, 
  description, 
  icon: IconComponent, 
  onClick,
  className = '',
  variant = 'default'
}) => {
  const variants = {
    default: 'hover:border-blue-500 hover:bg-blue-50 group-hover:bg-blue-100',
    success: 'hover:border-emerald-500 hover:bg-emerald-50 group-hover:bg-emerald-100',
    warning: 'hover:border-amber-500 hover:bg-amber-50 group-hover:bg-amber-100'
  };

  const iconVariants = {
    default: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    success: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    warning: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-6 text-left border-2 border-gray-200 rounded-xl ${variants[variant]} hover:shadow-md active:scale-[0.98] transition-all duration-200 group ${className}`}
    >
      <div className="flex items-start space-x-4">
        {IconComponent && (
          <div className={`flex-shrink-0 p-3 rounded-xl transition-colors duration-200 ${iconVariants[variant]}`}>
            <IconComponent size={24} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
            {title}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
};

// PageHeader 컴포넌트 - 개선된 여백과 타이포그래피
export const PageHeader = ({ 
  title, 
  description, 
  action,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      <div className="flex-1">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
        {description && (
          <p className="text-xl text-gray-600 leading-relaxed">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

// EmptyState 컴포넌트 - 통일된 색상
export const EmptyState = ({ 
  icon: IconComponent, 
  title, 
  description,
  action,
  className = '' 
}) => {
  return (
    <Card className={`text-center py-16 ${className}`}>
      {IconComponent && (
        <div className="mx-auto mb-6 p-4 bg-gray-100 rounded-full w-fit">
          <IconComponent size={48} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
      {action && action}
    </Card>
  );
};

// ProgressBar 컴포넌트 - 새로 추가
export const ProgressBar = ({
  value = 0,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const variants = {
    primary: 'bg-blue-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    danger: 'bg-red-600'
  };
  
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{percentage.toFixed(0)}%</span>
          <span>{value}/{max}</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div 
          className={`${variants[variant]} ${sizes[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Divider 컴포넌트 - 새로 추가
export const Divider = ({ 
  orientation = 'horizontal', 
  className = '',
  text 
}) => {
  if (orientation === 'vertical') {
    return <div className={`w-px bg-gray-200 ${className}`} />;
  }
  
  if (text) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500 font-medium">{text}</span>
        </div>
      </div>
    );
  }
  
  return <hr className={`border-gray-200 ${className}`} />;
};

// 아이콘들을 쉽게 사용할 수 있도록 export
export { 
  Settings as SettingsIcon,
  FileText as DocumentIcon,
  Calculator as CalculatorIcon,
  Users as UsersIcon,
  TrendingUp as TrendingUpIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Check as CheckIcon,
  X as XIcon,
  AlertTriangle as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Clock as ClockIcon,
  ArrowRight as ArrowRightIcon,
  Home as HomeIcon,
  BarChart3 as ChartIcon,
  FileContract as ContractIcon,
  Briefcase as BriefcaseIcon,
  Bot as BotIcon,
  Sparkles as SparklesIcon
};

// 유틸리티 함수들 - 개선된 포맷팅
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('ko-KR').format(number);
};

export const formatShortDate = (date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: '2-digit',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

export const formatRelativeTime = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((now - target) / 1000);
  
  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  
  return formatDate(date);
};