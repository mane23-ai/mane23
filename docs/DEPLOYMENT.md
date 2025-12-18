# 배포 가이드

## 배포 환경

- **호스팅**: Vercel
- **데이터베이스**: Supabase Cloud
- **도메인**: 커스텀 도메인 (옵션)

---

## 1. Vercel 배포

### 1.1 Vercel 계정 연결

1. [vercel.com](https://vercel.com) 접속
2. GitHub 계정으로 로그인
3. "Add New Project" 클릭
4. 저장소 선택

### 1.2 프로젝트 설정

**Framework Preset**: Next.js (자동 감지)

**Build & Development Settings**:
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 1.3 환경 변수 설정

Vercel Dashboard > Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GITHUB_CLIENT_ID=Iv1.xxx
GITHUB_CLIENT_SECRET=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

> ⚠️ `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에 노출됩니다.

### 1.4 배포 실행

```bash
# Vercel CLI 사용
npm i -g vercel
vercel

# 또는 GitHub push 시 자동 배포
git push origin main
```

---

## 2. Supabase 프로덕션 설정

### 2.1 프로젝트 보안 강화

**Database > Settings**:
- Connection Pooling 활성화
- SSL 강제 적용

**Authentication > URL Configuration**:
- Site URL: `https://your-domain.vercel.app`
- Redirect URLs: `https://your-domain.vercel.app/**`

### 2.2 RLS 정책 검증

모든 테이블에 적절한 RLS 정책이 적용되었는지 확인:

```sql
-- RLS 활성화 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 2.3 백업 설정

**Database > Backups**:
- Point in Time Recovery 활성화 (Pro 플랜)
- 주기적 백업 확인

---

## 3. 커스텀 도메인 설정

### 3.1 Vercel 도메인 추가

1. Project Settings > Domains
2. "Add Domain" 클릭
3. 도메인 입력 (예: `app.yourdomain.com`)

### 3.2 DNS 설정

도메인 제공업체에서 DNS 레코드 추가:

```
# A 레코드 (루트 도메인)
Type: A
Name: @
Value: 76.76.21.21

# CNAME 레코드 (서브도메인)
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### 3.3 Supabase URL 업데이트

1. Supabase Dashboard > Authentication > URL Configuration
2. Site URL 업데이트: `https://app.yourdomain.com`
3. Redirect URLs 업데이트

### 3.4 환경 변수 업데이트

Vercel에서 `NEXT_PUBLIC_APP_URL` 업데이트:
```
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

---

## 4. GitHub OAuth 프로덕션 설정

### 4.1 프로덕션 OAuth App 생성

GitHub > Settings > Developer settings > OAuth Apps:

1. New OAuth App
2. 정보 입력:
   - Application name: `프로덕션 앱 이름`
   - Homepage URL: `https://app.yourdomain.com`
   - Authorization callback URL: `https://xxx.supabase.co/auth/v1/callback`

### 4.2 환경 변수 업데이트

```
GITHUB_CLIENT_ID=<production-client-id>
GITHUB_CLIENT_SECRET=<production-client-secret>
```

---

## 5. 모니터링 및 로깅

### 5.1 Vercel Analytics

Project Settings > Analytics 활성화

### 5.2 에러 모니터링 (옵션)

Sentry 또는 LogRocket 연동:

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 5.3 Supabase 로그

Supabase Dashboard > Logs:
- API 로그 확인
- Auth 로그 확인
- Database 로그 확인

---

## 6. 배포 체크리스트

### 배포 전

- [ ] 모든 환경 변수 설정 완료
- [ ] Supabase RLS 정책 검증
- [ ] 프로덕션 빌드 테스트 (`npm run build`)
- [ ] TypeScript 오류 없음
- [ ] ESLint 오류 없음

### 배포 후

- [ ] 로그인/회원가입 테스트
- [ ] 주요 기능 동작 확인
- [ ] 모바일 반응형 확인
- [ ] 에러 로그 모니터링
- [ ] 성능 지표 확인

---

## 7. 롤백

### Vercel 롤백

1. Deployments 탭 이동
2. 이전 배포 선택
3. "..." > "Promote to Production" 클릭

### 데이터베이스 롤백

Supabase Dashboard > Database > Backups에서 복원

---

## 8. CI/CD 파이프라인

### GitHub Actions 예시

`.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 9. 비용 관리

### Vercel

- **Hobby (무료)**: 개인 프로젝트용
- **Pro ($20/월)**: 상업용, 팀 기능

### Supabase

- **Free**: 500MB DB, 1GB Storage
- **Pro ($25/월)**: 8GB DB, 100GB Storage

### 비용 최적화 팁

1. Supabase Connection Pooling 사용
2. 이미지 최적화 (Next.js Image)
3. API 캐싱 적용
4. 불필요한 실시간 구독 제거
