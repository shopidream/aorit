# My Contract App

프리랜서와 소기업을 위한 계약서 자동 생성 플랫폼

## 🚀 주요 기능

### 📋 계약서 자동 생성
- **업종별 맞춤 조항**: 디자인, 개발, 마케팅, 컨설팅 등 업종에 맞는 계약 조항 자동 선택
- **평이한 언어**: 법률 용어 대신 이해하기 쉬운 평이한 언어로 작성
- **전자서명**: 양방향 전자서명으로 계약 체결
- **이메일 발송**: 계약서 자동 발송 및 서명 요청

### 💼 비즈니스 관리
- **서비스 등록**: 제공하는 서비스/상품 등록 및 관리
- **견적서 작성**: 고객별 맞춤 견적서 생성
- **고객 관리**: 고객 정보 및 프로젝트 이력 관리
- **대시보드**: 매출, 계약 현황 등 비즈니스 통계

### 🌐 공개 페이지
- **프로필 페이지**: `/username` 형태의 개인 브랜드 페이지
- **포트폴리오**: 작업 사례 및 리뷰 관리
- **서비스 쇼케이스**: 제공 서비스 공개 및 견적 요청 접수

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (Prisma ORM)
- **Authentication**: JWT
- **Email**: Nodemailer
- **UI Components**: Custom Design System

## 📦 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd my-contract-app
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
```bash
cp .env.example .env
```

### 4. 데이터베이스 설정
```bash
npm run db:generate
npm run db:push
```

### 5. 개발 서버 실행
```bash
npm run dev
```

앱이 `http://localhost:3100`에서 실행됩니다.

## 📁 프로젝트 구조

```
my-contract-app/
├── components/
│   ├── auth/           # 로그인/회원가입
│   ├── contracts/      # 계약서 관련
│   ├── dashboard/      # 대시보드
│   ├── layout/         # 레이아웃
│   └── ui/             # 공통 UI 컴포넌트
├── pages/
│   ├── api/            # API 라우트
│   ├── contracts/      # 계약서 페이지
│   └── dashboard/      # 대시보드 페이지
├── lib/
│   ├── contractGenerator.js  # 계약서 생성 로직
│   ├── emailService.js      # 이메일 발송
│   └── validation.js        # 유효성 검사
├── templates/
│   └── email/          # 이메일 템플릿
├── prisma/
│   └── schema.prisma   # 데이터베이스 스키마
└── styles/
    └── globals.css     # 글로벌 스타일
```

## 🔧 주요 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 데이터베이스 마이그레이션
npm run db:migrate

# 데이터베이스 스튜디오
npm run db:studio
```

## 📧 이메일 설정

개발환경에서는 콘솔에 이메일 내용이 출력됩니다.
운영환경에서는 `.env` 파일에 SMTP 설정을 추가하세요:

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## 🔒 보안

- JWT 토큰 기반 인증
- 입력값 검증 및 XSS 방지
- CSRF 보호
- 파일 업로드 제한

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.