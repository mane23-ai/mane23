# AI 운영 시스템 (mane23)

AI 기반 비즈니스 운영 관리 시스템입니다. 프로젝트, 콘텐츠, 마케팅, 회계를 통합 관리하고 AI 어시스턴트를 활용한 바이브 코딩 기능을 제공합니다.

## 주요 기능

- **프로젝트 관리**: 프로젝트 생성, 수정, 삭제 및 진행 상황 추적
- **콘텐츠 관리**: 콘텐츠 작성, 편집, 상태 관리
- **문서 관리**: 문서 업로드 및 관리
- **마케팅 채널**: YouTube, Instagram, 블로그 등 마케팅 채널 연동 및 성과 추적
- **회계 관리**: 수입/지출 거래 기록 및 재무 보고서
- **바이브 코딩**: AI 어시스턴트를 활용한 자연어 기반 코드 생성
- **워크스페이스**: 팀 단위 워크스페이스 관리

## 기술 스택

### Frontend
- **Next.js 16** - App Router, Turbopack
- **React 19** - 최신 React 기능 활용
- **TypeScript** - 타입 안정성
- **Tailwind CSS 4** - 스타일링
- **Radix UI** - 접근성 높은 UI 컴포넌트
- **Zustand** - 클라이언트 상태 관리
- **TanStack Query** - 서버 상태 관리

### Backend
- **Supabase** - 인증, 데이터베이스, 실시간 기능
- **Anthropic Claude API** - AI 기능

### 유효성 검사 & 폼
- **Zod v4** - 스키마 유효성 검사
- **React Hook Form** - 폼 관리

## 시작하기

### 필수 요구사항

- Node.js 20+
- npm 또는 yarn
- Supabase 프로젝트

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic (선택사항 - 바이브 코딩 기능)
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

개발 서버는 기본적으로 http://localhost:3000 에서 실행됩니다.

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (dashboard)/       # 대시보드 페이지
│   │   ├── projects/      # 프로젝트 관리
│   │   ├── contents/      # 콘텐츠 관리
│   │   ├── documents/     # 문서 관리
│   │   ├── marketing/     # 마케팅 채널
│   │   ├── accounting/    # 회계 관리
│   │   └── settings/      # 설정
│   └── api/               # API 라우트
├── components/            # React 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   ├── projects/         # 프로젝트 관련 컴포넌트
│   ├── contents/         # 콘텐츠 관련 컴포넌트
│   ├── marketing/        # 마케팅 관련 컴포넌트
│   └── accounting/       # 회계 관련 컴포넌트
├── hooks/                 # 커스텀 React 훅
├── lib/                   # 유틸리티 및 설정
│   ├── supabase/         # Supabase 클라이언트
│   ├── validations/      # Zod 스키마
│   └── ai/               # AI 관련 유틸리티
├── stores/                # Zustand 스토어
└── types/                 # TypeScript 타입 정의
```

## 스크립트

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # ESLint 검사
```

## 배포

### Vercel 배포

가장 쉬운 배포 방법은 [Vercel Platform](https://vercel.com)을 사용하는 것입니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mane23-ai/mane23)

## 라이선스

MIT License

## 기여

이슈와 풀 리퀘스트는 언제나 환영합니다.
