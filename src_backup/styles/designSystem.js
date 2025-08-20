// src/styles/designSystem.js - 기존 시스템 + CSS 변수 통합

export const designSystem = {
    // 🔥 CSS 변수 기반 색상 (기존 구조 유지하며 확장)
    colors: {
      primary: {
        gradient: 'from-violet-600 via-purple-600 to-indigo-600',
        solid: 'bg-primary',
        text: 'text-primary',
        border: 'border-primary-light'
      },
      secondary: {
        gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
        solid: 'bg-secondary',
        text: 'text-secondary',
        border: 'border-secondary-light'
      },
      neutral: {
        text: 'text-text-primary', // 🔥 CSS 변수 연결
        textLight: 'text-text-secondary', // 🔥 CSS 변수 연결
        border: 'border-border' // 🔥 CSS 변수 연결
      },
      status: {
        success: 'text-success bg-success-light border-success',
        warning: 'text-warning bg-warning-light border-warning',
        error: 'text-danger bg-danger-light border-danger',
        info: 'text-blue-600 bg-blue-50 border-blue-200'
      }
    },
  
    // 배경 및 그라데이션 (CSS 변수 통합)
    gradients: {
      primary: 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600',
      primaryLight: 'bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50',
      secondary: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500',
      card: 'bg-surface', // 🔥 CSS 변수
      cardSelected: 'bg-surface-active', // 🔥 CSS 변수
      cardHover: 'hover:bg-surface-hover' // 🔥 CSS 변수
    },
  
    // 그림자 (기존 유지)
    shadows: {
      card: 'shadow-lg',
      cardHover: 'hover:shadow-xl',
      cardSelected: 'shadow-xl shadow-violet-500/25',
      button: 'shadow-md',
      modal: 'shadow-2xl',
      floating: 'shadow-2xl'
    },
  
    // 테두리 (CSS 변수 통합)
    borders: {
      card: 'border border-border', // 🔥 CSS 변수
      cardHover: 'hover:border-border',
      cardSelected: 'border-primary',
      focus: 'focus:ring-2 focus:ring-primary/50 focus:border-primary',
      input: 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20' // 🔥 CSS 변수
    },
  
    // 둥근 모서리 (기존 유지)
    radius: {
      card: 'rounded-2xl',
      button: 'rounded-xl',
      input: 'rounded-lg',
      badge: 'rounded-full',
      modal: 'rounded-3xl'
    },
  
    // 애니메이션 (기존 animations.css와 연동)
    transitions: {
      base: 'transition-all duration-300 ease-out',
      fast: 'transition-all duration-200 ease-out',
      bounce: 'transition-transform duration-200 ease-out hover:scale-105',
      float: 'transition-transform duration-300 ease-out hover:-translate-y-1'
    },
  
    // 🔥 새로운 애니메이션 클래스 (animations.css 활용)
    animations: {
      fadeInUp: 'animate-fade-in-up',
      fadeInScale: 'animate-fade-in-scale',
      slideInRight: 'animate-slide-in-right',
      bounceSubtle: 'animate-bounce-subtle',
      pulseSubtle: 'animate-pulse-subtle',
      shake: 'animate-shake',
      hoverLift: 'hover-lift',
      hoverGlow: 'hover-glow',
      hoverScale: 'hover-scale',
      buttonRipple: 'button-ripple',
      gradientAnimated: 'gradient-animated',
      loadingSpinner: 'loading-spinner',
      staggerChildren: 'stagger-children',
      cardEntrance: 'card-entrance'
    },
  
    // 글래스모피즘 (CSS 변수 통합)
    glass: {
      light: 'backdrop-blur-sm bg-surface/80', // 🔥 CSS 변수
      medium: 'backdrop-blur-md bg-surface/60',
      strong: 'backdrop-blur-lg bg-surface/40'
    },
  
    // 레이아웃 (기존 유지)
    layout: {
      container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      grid: 'grid gap-6',
      flexRow: 'flex items-center gap-4',
      flexCol: 'flex flex-col gap-4',
      formGrid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
      spacingSection: 'space-y-8',
      spacingCard: 'space-y-4'
    },
  
    // 타이포그래피 (CSS 변수 통합)
    typography: {
      h1: 'text-3xl md:text-4xl font-bold text-text-primary', // 🔥 CSS 변수
      h2: 'text-2xl md:text-3xl font-bold text-text-primary',
      h3: 'text-xl md:text-2xl font-semibold text-text-primary',
      h4: 'text-lg md:text-xl font-semibold text-text-primary',
      h5: 'text-base md:text-lg font-semibold text-text-primary',
      body: 'text-base text-text-primary leading-relaxed', // 🔥 CSS 변수
      bodySmall: 'text-sm text-text-secondary', // 🔥 CSS 변수
      caption: 'text-xs text-text-tertiary', // 🔥 CSS 변수
      label: 'text-sm font-medium text-text-primary',
      error: 'text-sm text-danger', // 🔥 CSS 변수
      success: 'text-sm text-success' // 🔥 CSS 변수
    },
  
    // 폼 요소 (CSS 변수 통합)
    form: {
      fieldset: 'space-y-6 p-6 bg-surface-elevated rounded-xl border border-border', // 🔥 CSS 변수
      legend: 'text-lg font-semibold text-text-primary px-2',
      group: 'space-y-2',
      label: 'block text-sm font-medium text-text-primary',
      input: 'w-full px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors bg-surface text-text-primary', // 🔥 CSS 변수
      textarea: 'w-full px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-none bg-surface text-text-primary',
      select: 'w-full px-4 py-3 border border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors bg-surface text-text-primary',
      checkbox: 'h-4 w-4 text-primary focus:ring-primary border-border rounded',
      error: 'mt-1 text-sm text-danger'
    },
  
    // 탭 (CSS 변수 통합)
    tabs: {
      container: 'border-b border-border', // 🔥 CSS 변수
      list: 'flex space-x-8',
      tab: 'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
      tabActive: 'border-primary text-primary',
      tabInactive: 'border-transparent text-text-secondary hover:text-text-primary hover:border-border', // 🔥 CSS 변수
      content: 'py-6'
    }
  };
  
  // 카드 스타일 생성 (CSS 변수 통합)
  export const getCardStyles = (type, isSelected = false) => {
    const base = `${designSystem.radius.card} ${designSystem.transitions.base} ${designSystem.animations.cardEntrance}`;
    
    if (isSelected) return `${base} bg-surface-active border-primary ${designSystem.shadows.cardSelected}`;
    if (type === 'maintenance') return `${base} bg-success-light border-success shadow-lg`;
    if (type === 'hourly' || type === 'custom') return `${base} bg-warning-light border-warning shadow-lg`;
    if (type === 'plan') return `${base} bg-primary-light border-primary shadow-lg`;
    
    return `${base} bg-surface border-border ${designSystem.shadows.card} hover:border-primary/50 ${designSystem.shadows.cardHover} ${designSystem.animations.hoverLift}`;
  };
  
  // 버튼 스타일 생성 (CSS 변수 + 애니메이션 통합)
  export const getButtonStyles = (variant = 'primary', size = 'md') => {
    const base = `font-semibold ${designSystem.transitions.fast} ${designSystem.animations.buttonRipple}`;
    
    const variants = {
      primary: `${base} bg-primary text-white ${designSystem.shadows.button} hover:shadow-lg ${designSystem.radius.button}`,
      secondary: `${base} bg-secondary text-white ${designSystem.shadows.button} hover:shadow-lg ${designSystem.radius.button}`,
      outline: `${base} bg-surface text-primary border border-primary hover:bg-surface-hover ${designSystem.radius.button}`, // 🔥 CSS 변수
      ghost: `${base} text-primary hover:bg-surface-hover ${designSystem.radius.button}`, // 🔥 CSS 변수
      danger: `${base} bg-danger text-white hover:bg-red-700 ${designSystem.radius.button}`, // 🔥 CSS 변수
      success: `${base} bg-success text-white hover:bg-emerald-700 ${designSystem.radius.button}` // 🔥 CSS 변수
    };
  
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg'
    };
  
    return `${variants[variant]} ${sizes[size]}`;
  };
  
  // 뱃지 스타일 생성 (CSS 변수 통합)
  export const getBadgeStyles = (variant = 'default') => {
    const base = `inline-flex items-center px-3 py-1 text-xs font-medium ${designSystem.radius.badge}`;
    
    const variants = {
      default: `${base} bg-surface-hover text-text-secondary border border-border`, // 🔥 CSS 변수
      primary: `${base} bg-primary-light text-primary`,
      secondary: `${base} bg-secondary-light text-secondary`,
      maintenance: `${base} bg-success-light text-success`, // 🔥 CSS 변수
      premium: `${base} bg-primary-light text-primary`,
      success: `${base} bg-success-light text-success`
    };
  
    return variants[variant];
  };
  
  // 폼 필드 스타일 생성 (CSS 변수 통합)
  export const getFormFieldStyles = (hasError = false) => {
    const base = designSystem.form.input;
    if (hasError) {
      return `${base} border-danger focus:border-danger focus:ring-danger/20 ${designSystem.animations.shake}`;
    }
    return base;
  };
  
  // 탭 스타일 생성 (기존 유지)
  export const getTabStyles = (isActive = false) => {
    return `${designSystem.tabs.tab} ${
      isActive ? designSystem.tabs.tabActive : designSystem.tabs.tabInactive
    }`;
  };
  
  // 모달 스타일 (CSS 변수 통합)
  export const getModalStyles = () => {
    return `bg-surface-elevated ${designSystem.radius.modal} ${designSystem.shadows.modal} border border-border ${designSystem.animations.fadeInScale}`;
  };
  
  // 🔥 다크모드 토글 (data-theme 속성 사용)
  export const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  // 🔥 테마 초기화 (data-theme 속성 사용)
  export const initTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  };