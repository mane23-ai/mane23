# AI 기반 프리랜서 운영 시스템

1인 프리랜서 개발자/강의자를 위한 AI 기반 통합 운영 대시보드

## 개요

개발·강의·콘텐츠·마케팅·의뢰 관리를 단일 대시보드에서 운영할 수 있는 시스템입니다.

### 핵심 기능

- **대시보드 기반 바이브 코딩**: 자연어로 작업 지시 → Claude Code CLI 실행
- **프로젝트 관리**: 의뢰 접수, GitHub 연동, 작업 히스토리
- **콘텐츠 관리**: 주제 기반 콘텐츠 생성 및 배포
- **문서 검색/요약**: 내부/외부 문서 통합 검색, AI 요약
- **마케팅 자동화**: 멀티 채널 콘텐츠 배포
- **AI 검증**: 블루팀/레드팀 다단계 검증

## 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions, WebSocket
- **Database**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **AI**: Anthropic Claude API, Claude Code CLI
- **Deployment**: Vercel

## 시작하기

### 사전 요구사항

- Node.js 18.17+
- npm 또는 pnpm
- Supabase 계정
- GitHub 계정 (OAuth용)

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd <project-name>

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.local.example .env.local
# .env.local 파일을 편집하여 필요한 값 입력

# 개발 서버 실행
npm run dev
```

### 환경 변수

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# AI APIs
ANTHROPIC_API_KEY=your-anthropic-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 페이지
│   ├── (dashboard)/       # 대시보드 페이지
│   └── api/               # API Routes
├── components/            # React 컴포넌트
├── lib/                   # 유틸리티 및 라이브러리
├── hooks/                 # Custom Hooks
├── stores/                # Zustand 스토어
└── types/                 # TypeScript 타입
```

## 문서

- [아키텍처](./ARCHITECTURE.md)
- [데이터베이스 스키마](./DATABASE.md)
- [API 명세](./API.md)
- [개발 환경 설정](./SETUP.md)
- [배포 가이드](./DEPLOYMENT.md)
- [개발 가이드](./CONTRIBUTING.md)

## 라이선스

Private - All rights reserved
