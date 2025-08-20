// src/components/ui/DesignSystem.js - 재사용 가능한 UI 컴포넌트들

import React from 'react';
import { designSystem, getButtonStyles, getBadgeStyles, getCardStyles, getFormFieldStyles } from '../../styles/designSystem';

// 🎨 Button 컴포넌트
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseStyles = getButtonStyles(variant, size);
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${disabledStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// 🏷️ Badge 컴포넌트
export const Badge = ({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const styles = getBadgeStyles(variant);
  
  return (
    <span className={`${styles} ${className}`} {...props}>
      {children}
    </span>
  );
};

// 📦 Card 컴포넌트
export const Card = ({ 
  children, 
  type = 'default', 
  isSelected = false, 
  className = '', 
  onClick,
  ...props 
}) => {
  const styles = getCardStyles(type, isSelected);
  const clickable = onClick ? 'cursor-pointer' : '';
  
  return (
    <div 
      className={`${styles} ${clickable} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// 📝 Input 컴포넌트
export const Input = ({ 
  label,
  error,
  className = '',
  id,
  ...props 
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const inputStyles = getFormFieldStyles(!!error);
  
  return (
    <div className={designSystem.form.group}>
      {label && (
        <label htmlFor={inputId} className={designSystem.form.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${inputStyles} ${className}`}
        {...props}
      />
      {error && (
        <p className={designSystem.form.error}>{error}</p>
      )}
    </div>
  );
};

// 📝 Textarea 컴포넌트
export const Textarea = ({ 
  label,
  error,
  className = '',
  id,
  rows = 4,
  ...props 
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const baseStyles = designSystem.form.textarea;
  const errorStyles = error ? 'border-danger focus:border-danger focus:ring-danger/20' : '';
  
  return (
    <div className={designSystem.form.group}>
      {label && (
        <label htmlFor={textareaId} className={designSystem.form.label}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`${baseStyles} ${errorStyles} ${className}`}
        {...props}
      />
      {error && (
        <p className={designSystem.form.error}>{error}</p>
      )}
    </div>
  );
};

// 📋 Select 컴포넌트
export const Select = ({ 
  label,
  error,
  options = [],
  className = '',
  id,
  placeholder = '선택하세요',
  ...props 
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const selectStyles = getFormFieldStyles(!!error);
  
  return (
    <div className={designSystem.form.group}>
      {label && (
        <label htmlFor={selectId} className={designSystem.form.label}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`${selectStyles} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className={designSystem.form.error}>{error}</p>
      )}
    </div>
  );
};

// 🗂️ Tabs 컴포넌트
export const Tabs = ({ 
  tabs = [], 
  activeTab, 
  onTabChange, 
  className = '' 
}) => {
  return (
    <div className={className}>
      <nav className={designSystem.tabs.container}>
        <div className={designSystem.tabs.list}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`${designSystem.tabs.tab} ${
                activeTab === tab.id 
                  ? designSystem.tabs.tabActive 
                  : designSystem.tabs.tabInactive
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
      <div className={designSystem.tabs.content}>
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

// 🎯 Loading Spinner 컴포넌트
export const LoadingSpinner = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  return (
    <div className={`${sizeClasses[size]} ${designSystem.animations.loadingSpinner} ${className}`}>
      <div className="w-full h-full border-2 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
};

// 🚨 Alert 컴포넌트
export const Alert = ({ 
  type = 'info', 
  title, 
  children, 
  className = '',
  onClose,
  ...props 
}) => {
  const typeStyles = {
    success: 'bg-success-light text-success border-success',
    warning: 'bg-warning-light text-warning border-warning',
    error: 'bg-danger-light text-danger border-danger',
    info: 'bg-blue-50 text-blue-700 border-blue-200'
  };

  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  };

  return (
    <div 
      className={`p-4 rounded-lg border ${typeStyles[type]} ${className}`}
      {...props}
    >
      <div className="flex items-start">
        <span className="mr-3 text-lg">{icons[type]}</span>
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div>{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-current hover:opacity-70 transition-opacity"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// 🎭 Modal 컴포넌트
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '',
  size = 'md',
  ...props 
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 백드롭 */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`relative w-full ${sizeClasses[size]} bg-surface-elevated rounded-3xl shadow-2xl border border-border ${designSystem.animations.fadeInScale} ${className}`}
          {...props}
        >
          {/* 헤더 */}
          {(title || onClose) && (
            <div className="flex items-center justify-between p-6 border-b border-border">
              {title && <h3 className={designSystem.typography.h3}>{title}</h3>}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          
          {/* 바디 */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// 🎨 Theme Toggle 컴포넌트
export const ThemeToggle = ({ className = '' }) => {
  const [theme, setTheme] = React.useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'light';
  });

  const handleToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-lg bg-surface-hover text-text-primary hover:bg-surface-active transition-colors ${className}`}
      title="테마 변경"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

// 📊 Progress Bar 컴포넌트
export const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  className = '',
  showLabel = false,
  variant = 'primary'
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const variantStyles = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-text-secondary mb-1">
          <span>진행률</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className="w-full bg-surface-hover rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${variantStyles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// 🔄 Skeleton 컴포넌트
export const Skeleton = ({ 
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded'
}) => {
  return (
    <div 
      className={`${width} ${height} ${rounded} bg-surface-hover animate-pulse ${className}`}
    />
  );
};

// 💡 Tooltip 컴포넌트
export const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  className = '' 
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div 
          className={`absolute z-10 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap ${positionStyles[position]} ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

// 🎪 Accordion 컴포넌트
export const AccordionItem = ({ 
  title, 
  children, 
  isOpen, 
  onToggle, 
  className = '' 
}) => {
  return (
    <div className={`border border-border rounded-lg ${className}`}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 text-left bg-surface hover:bg-surface-hover transition-colors flex items-center justify-between"
      >
        <span className="font-medium text-text-primary">{title}</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-4 py-3 border-t border-border bg-surface">
          {children}
        </div>
      )}
    </div>
  );
};

// 기본 export
export default {
  Button,
  Badge,
  Card,
  Input,
  Textarea,
  Select,
  Tabs,
  LoadingSpinner,
  Alert,
  Modal,
  ThemeToggle,
  ProgressBar,
  Skeleton,
  Tooltip,
  AccordionItem
};