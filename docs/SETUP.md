# 개발 환경 설정 가이드

## 사전 요구사항

### 필수 소프트웨어

- **Node.js**: 18.17 이상 (20.x 권장)
- **npm**: 9.x 이상 또는 pnpm 8.x 이상
- **Git**: 최신 버전

### 권장 에디터

- **VS Code** 또는 **Cursor**
  - 확장 프로그램: ESLint, Prettier, Tailwind CSS IntelliSense

### 계정 및 서비스

- **Supabase 계정**: [supabase.com](https://supabase.com)
- **GitHub 계정**: OAuth 연동용
- **Anthropic 계정**: Claude API 사용 (선택)

---

## 1. 프로젝트 클론 및 의존성 설치

```bash
# 저장소 클론
git clone <repository-url>
cd <project-name>

# 의존성 설치
npm install
# 또는
pnpm install
```

---

## 2. Supabase 설정

### 2.1 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: 프로젝트 이름
   - Database Password: 강력한 비밀번호 설정
   - Region: Northeast Asia (ap-northeast-1) 권장

### 2.2 데이터베이스 스키마 적용

1. SQL Editor 열기
2. `supabase/migrations/001_initial_schema.sql` 내용 실행

또는 Supabase CLI 사용:

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref <project-ref>

# 마이그레이션 실행
supabase db push
```

### 2.3 인증 설정

**이메일 인증:**
1. Authentication > Providers > Email 활성화
2. Confirm email 옵션 설정

**GitHub OAuth:**
1. GitHub > Settings > Developer settings > OAuth Apps
2. New OAuth App 생성:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Client ID, Client Secret 복사
4. Supabase Dashboard > Authentication > Providers > GitHub 활성화
5. Client ID, Secret 입력

### 2.4 Storage 설정

1. Storage > New bucket
2. 버킷 생성:
   - `documents`: 문서 파일 저장
   - `receipts`: 영수증 이미지 저장

```sql
-- Storage 정책 (SQL Editor에서 실행)
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 2.5 API 키 확인

Project Settings > API에서 확인:
- `anon` (public) key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`

---

## 3. 환경 변수 설정

### 3.1 .env.local 파일 생성

```bash
cp .env.local.example .env.local
```

### 3.2 환경 변수 값 설정

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# GitHub OAuth (옵션)
GITHUB_CLIENT_ID=Iv1.xxx
GITHUB_CLIENT_SECRET=xxx

# Anthropic Claude API (옵션)
ANTHROPIC_API_KEY=sk-ant-xxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. 개발 서버 실행

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 접속
# http://localhost:3000
```

---

## 5. 주요 스크립트

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버
npm run start

# 린트 검사
npm run lint

# 타입 검사
npm run type-check

# 포맷팅
npm run format
```

---

## 6. shadcn/ui 컴포넌트 추가

필요한 컴포넌트 추가:

```bash
# 개별 추가
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input

# 여러 개 한번에
npx shadcn@latest add button card input label table dialog dropdown-menu tabs toast
```

---

## 7. 디버깅

### VS Code 디버그 설정

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Supabase 로컬 개발 (옵션)

```bash
# Supabase 로컬 인스턴스 시작
supabase start

# 로컬 URL 사용
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
```

---

## 8. 트러블슈팅

### Node.js 버전 문제

```bash
# nvm 사용 시
nvm install 20
nvm use 20
```

### 패키지 설치 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
rm package-lock.json
npm install
```

### Supabase 연결 오류

1. 환경 변수 확인
2. Supabase 프로젝트 상태 확인 (Paused 상태인지)
3. RLS 정책 확인

### TypeScript 오류

```bash
# 타입 생성 (Supabase)
npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
```

---

## 9. 추가 도구 설정

### Prettier 설정

`.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### ESLint 설정

`.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn"
  }
}
```

### Git Hooks (옵션)

```bash
# husky 설치
npm install -D husky lint-staged

# husky 초기화
npx husky init

# pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

`.lintstagedrc`:

```json
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```
