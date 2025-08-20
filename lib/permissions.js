// lib/permissions.js - 권한 체크 유틸리티
export const ROLES = {
    ADMIN: 'admin',
    FREELANCER: 'freelancer',
    CLIENT: 'client'
  };
  
  export const PERMISSIONS = {
    // 서비스 관련
    CREATE_SERVICE: 'create_service',
    READ_SERVICE: 'read_service',
    UPDATE_SERVICE: 'update_service',
    DELETE_SERVICE: 'delete_service',
    
    // 고객 관련
    CREATE_CLIENT: 'create_client',
    READ_CLIENT: 'read_client',
    UPDATE_CLIENT: 'update_client',
    DELETE_CLIENT: 'delete_client',
    
    // 견적 관련
    CREATE_QUOTE: 'create_quote',
    READ_QUOTE: 'read_quote',
    UPDATE_QUOTE: 'update_quote',
    DELETE_QUOTE: 'delete_quote',
    SEND_QUOTE: 'send_quote',
    
    // 계약 관련
    CREATE_CONTRACT: 'create_contract',
    READ_CONTRACT: 'read_contract',
    UPDATE_CONTRACT: 'update_contract',
    DELETE_CONTRACT: 'delete_contract',
    SIGN_CONTRACT: 'sign_contract',
    
    // 프로필 관련
    UPDATE_PROFILE: 'update_profile',
    VIEW_PROFILE: 'view_profile',
    
    // 공개 페이지 관련
    MANAGE_PUBLIC_PAGE: 'manage_public_page',
    
    // 관리자 전용
    MANAGE_USERS: 'manage_users',
    VIEW_ANALYTICS: 'view_analytics',
    SYSTEM_SETTINGS: 'system_settings'
  };
  
  // 역할별 권한 매핑
  export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
      // 모든 권한
      ...Object.values(PERMISSIONS)
    ],
    
    [ROLES.FREELANCER]: [
      PERMISSIONS.CREATE_SERVICE,
      PERMISSIONS.READ_SERVICE,
      PERMISSIONS.UPDATE_SERVICE,
      PERMISSIONS.DELETE_SERVICE,
      
      PERMISSIONS.CREATE_CLIENT,
      PERMISSIONS.READ_CLIENT,
      PERMISSIONS.UPDATE_CLIENT,
      PERMISSIONS.DELETE_CLIENT,
      
      PERMISSIONS.CREATE_QUOTE,
      PERMISSIONS.READ_QUOTE,
      PERMISSIONS.UPDATE_QUOTE,
      PERMISSIONS.DELETE_QUOTE,
      PERMISSIONS.SEND_QUOTE,
      
      PERMISSIONS.CREATE_CONTRACT,
      PERMISSIONS.READ_CONTRACT,
      PERMISSIONS.UPDATE_CONTRACT,
      PERMISSIONS.DELETE_CONTRACT,
      PERMISSIONS.SIGN_CONTRACT,
      
      PERMISSIONS.UPDATE_PROFILE,
      PERMISSIONS.VIEW_PROFILE,
      PERMISSIONS.MANAGE_PUBLIC_PAGE
    ],
    
    [ROLES.CLIENT]: [
      PERMISSIONS.VIEW_PROFILE,
      PERMISSIONS.READ_QUOTE,
      PERMISSIONS.READ_CONTRACT,
      PERMISSIONS.SIGN_CONTRACT
    ]
  };
  
  // 권한 체크 함수
  export const hasPermission = (user, permission) => {
    if (!user || !user.role) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  };
  
  // 여러 권한 체크 (AND 조건)
  export const hasAllPermissions = (user, permissions) => {
    return permissions.every(permission => hasPermission(user, permission));
  };
  
  // 여러 권한 체크 (OR 조건)
  export const hasAnyPermission = (user, permissions) => {
    return permissions.some(permission => hasPermission(user, permission));
  };
  
  // 역할 체크
  export const hasRole = (user, role) => {
    return user?.role === role;
  };
  
  // 관리자인지 체크
  export const isAdmin = (user) => {
    return hasRole(user, ROLES.ADMIN);
  };
  
  // 프리랜서인지 체크
  export const isFreelancer = (user) => {
    return hasRole(user, ROLES.FREELANCER);
  };
  
  // 소유자인지 체크 (자신의 데이터에만 접근 가능)
  export const isOwner = (user, resourceUserId) => {
    return user?.id === resourceUserId;
  };
  
  // 소유자이거나 관리자인지 체크
  export const canAccess = (user, resourceUserId) => {
    return isAdmin(user) || isOwner(user, resourceUserId);
  };
  
  // API 권한 체크 미들웨어용 함수
  export const checkPermission = (permission) => {
    return (user) => {
      if (!user) throw new Error('인증이 필요합니다');
      
      if (!hasPermission(user, permission)) {
        throw new Error('권한이 없습니다');
      }
      
      return true;
    };
  };
  
  // 리소스 접근 권한 체크
  export const checkResourceAccess = (user, resourceUserId, requiredPermission = null) => {
    if (!user) throw new Error('인증이 필요합니다');
    
    // 관리자는 모든 리소스에 접근 가능
    if (isAdmin(user)) return true;
    
    // 소유자 체크
    if (!isOwner(user, resourceUserId)) {
      throw new Error('해당 리소스에 접근할 권한이 없습니다');
    }
    
    // 추가 권한 체크
    if (requiredPermission && !hasPermission(user, requiredPermission)) {
      throw new Error('필요한 권한이 없습니다');
    }
    
    return true;
  };
  
  // 권한별 UI 표시 제어
  export const getPermissionConfig = (user) => {
    return {
      canCreateService: hasPermission(user, PERMISSIONS.CREATE_SERVICE),
      canEditService: hasPermission(user, PERMISSIONS.UPDATE_SERVICE),
      canDeleteService: hasPermission(user, PERMISSIONS.DELETE_SERVICE),
      
      canCreateClient: hasPermission(user, PERMISSIONS.CREATE_CLIENT),
      canEditClient: hasPermission(user, PERMISSIONS.UPDATE_CLIENT),
      canDeleteClient: hasPermission(user, PERMISSIONS.DELETE_CLIENT),
      
      canCreateQuote: hasPermission(user, PERMISSIONS.CREATE_QUOTE),
      canSendQuote: hasPermission(user, PERMISSIONS.SEND_QUOTE),
      canEditQuote: hasPermission(user, PERMISSIONS.UPDATE_QUOTE),
      
      canCreateContract: hasPermission(user, PERMISSIONS.CREATE_CONTRACT),
      canSignContract: hasPermission(user, PERMISSIONS.SIGN_CONTRACT),
      canEditContract: hasPermission(user, PERMISSIONS.UPDATE_CONTRACT),
      
      canEditProfile: hasPermission(user, PERMISSIONS.UPDATE_PROFILE),
      canManagePublicPage: hasPermission(user, PERMISSIONS.MANAGE_PUBLIC_PAGE),
      
      canViewAnalytics: hasPermission(user, PERMISSIONS.VIEW_ANALYTICS),
      canManageUsers: hasPermission(user, PERMISSIONS.MANAGE_USERS),
      
      isAdmin: isAdmin(user),
      isFreelancer: isFreelancer(user)
    };
  };