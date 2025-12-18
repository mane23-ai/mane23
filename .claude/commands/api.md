---
description: Next.js API 라우트 생성 (Route Handlers)
---

$ARGUMENTS 경로에 API 라우트를 생성합니다.

## API 라우트 구조

### 목록/생성 라우트 (route.ts)
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  // 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  // 데이터 조회
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  // 생성 로직
}
```

### 단일 항목 라우트 ([id]/route.ts)
- GET: 단일 항목 조회
- PUT: 항목 수정
- DELETE: 항목 삭제

## 패턴 참조
- Supabase 서버 클라이언트: src/lib/supabase/server.ts
- 인증 액션: src/lib/auth/actions.ts

## 에러 처리
- 401: 인증 필요
- 403: 권한 없음
- 404: 리소스 없음
- 500: 서버 에러
