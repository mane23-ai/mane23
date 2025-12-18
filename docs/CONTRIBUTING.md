# 개발 가이드

## 코드 스타일

### TypeScript

- 엄격한 타입 사용 (`strict: true`)
- `any` 타입 사용 지양
- 인터페이스보다 타입 별칭 선호 (일관성)

```typescript
// Good
type User = {
  id: string;
  name: string;
  email: string;
};

// Avoid
interface User {
  id: string;
  name: string;
  email: string;
}
```

### React 컴포넌트

- 함수형 컴포넌트만 사용
- Props 타입은 컴포넌트 위에 정의

```typescript
type ButtonProps = {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
};

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button className={cn('btn', variant)} onClick={onClick}>
      {children}
    </button>
  );
}
```

### 파일 명명 규칙

- 컴포넌트: `PascalCase.tsx` (예: `UserCard.tsx`)
- 유틸리티: `kebab-case.ts` (예: `format-date.ts`)
- 훅: `use-kebab-case.ts` (예: `use-auth.ts`)
- 타입: `types.ts` 또는 `[domain].types.ts`

### 폴더 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 라우트 그룹
│   ├── (dashboard)/       # 대시보드 라우트 그룹
│   └── api/               # API Routes
├── components/
│   ├── ui/                # shadcn/ui 기본 컴포넌트
│   ├── shared/            # 공통 컴포넌트
│   └── [domain]/          # 도메인별 컴포넌트
├── lib/
│   ├── supabase/          # Supabase 클라이언트
│   └── utils/             # 유틸리티 함수
├── hooks/                 # Custom Hooks
├── stores/                # Zustand 스토어
└── types/                 # 전역 타입
```

---

## Git 컨벤션

### 브랜치 전략

```
main                    # 프로덕션
├── develop            # 개발 통합
│   ├── feature/xxx    # 기능 개발
│   ├── fix/xxx        # 버그 수정
│   └── refactor/xxx   # 리팩토링
```

### 커밋 메시지

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 변경

**예시:**
```
feat(projects): add project creation form

- Add form validation with zod
- Add Supabase insert mutation
- Add success toast notification

Closes #123
```

### Pull Request

1. 브랜치 생성: `git checkout -b feature/xxx`
2. 커밋: `git commit -m "feat(scope): description"`
3. 푸시: `git push origin feature/xxx`
4. PR 생성 및 리뷰 요청

---

## 상태 관리

### 서버 상태: TanStack Query

```typescript
// src/hooks/use-projects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => fetchProjects(workspaceId),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['projects', variables.workspaceId],
      });
    },
  });
}
```

### 클라이언트 상태: Zustand

```typescript
// src/stores/ui-store.ts
import { create } from 'zustand';

type UIStore = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

---

## API 개발

### API Route 구조

```typescript
// src/app/api/projects/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '인증 필요' } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspace_id');

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'QUERY_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
```

### Server Actions (권장)

```typescript
// src/app/(dashboard)/projects/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createProject(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const workspaceId = formData.get('workspace_id') as string;

  const { error } = await supabase
    .from('projects')
    .insert({ name, workspace_id: workspaceId });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/projects');
  return { success: true };
}
```

---

## 컴포넌트 개발

### shadcn/ui 사용

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function ProjectForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>새 프로젝트</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Input name="name" placeholder="프로젝트 이름" />
          <Button type="submit">생성</Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 공통 컴포넌트

```typescript
// src/components/shared/page-header.tsx
type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4 border-b">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
```

---

## 테스트

### 단위 테스트 (옵션)

```typescript
// src/lib/utils/__tests__/format-date.test.ts
import { formatDate } from '../format-date';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('2024년 1월 15일');
  });
});
```

### E2E 테스트 (옵션)

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## 에러 처리

### 클라이언트 에러

```typescript
'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    toast.error('오류가 발생했습니다');
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2>문제가 발생했습니다</h2>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
```

### API 에러

```typescript
// src/lib/api-error.ts
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500
  ) {
    super(message);
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof APIError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }

  console.error(error);
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류' } },
    { status: 500 }
  );
}
```

---

## 성능 최적화

### 이미지 최적화

```typescript
import Image from 'next/image';

<Image
  src="/hero.png"
  alt="Hero"
  width={800}
  height={400}
  priority  // LCP 이미지에 사용
/>
```

### 동적 임포트

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

### React Suspense

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  );
}
```
