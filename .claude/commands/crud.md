---
description: Supabase 테이블에 대한 CRUD 코드 생성 (API + React Query 훅 + Zod 스키마 + 폼)
---

$ARGUMENTS 테이블에 대한 전체 CRUD 코드를 생성합니다.

## 생성 순서

### 1. 타입 확인
src/types/database.ts에서 해당 테이블의 Row, Insert, Update 타입을 확인합니다.

### 2. API 라우트 생성
- `src/app/api/{table}/route.ts` - GET (목록), POST (생성)
- `src/app/api/{table}/[id]/route.ts` - GET (단일), PUT (수정), DELETE (삭제)

### 3. Zod 스키마 생성
- `src/lib/validations/{table}.ts` - 생성/수정용 스키마

### 4. React Query 훅 생성
- `src/hooks/use-{table}.ts` - useQuery, useMutation 훅

### 5. 폼 컴포넌트 생성
- `src/components/{table}/{table}-form.tsx` - React Hook Form + Zod 폼

## 패턴 참조
- API: src/lib/supabase/server.ts 패턴 사용
- 훅: src/hooks/use-auth.ts 패턴 참조
- 폼: src/components/ui/form.tsx 컴포넌트 활용

## 주의사항
- RLS 정책에 따라 workspace_id 필터링 필수
- 에러 핸들링 표준화 (NextResponse.json)
- 한글 에러 메시지 사용
