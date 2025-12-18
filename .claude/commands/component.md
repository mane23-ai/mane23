---
description: React 컴포넌트 생성 (TypeScript + shadcn/ui)
---

$ARGUMENTS 컴포넌트를 생성합니다.

## 컴포넌트 구조

```tsx
'use client'

import { ... } from '@/components/ui/...'

interface {ComponentName}Props {
  // Props 정의
}

export function {ComponentName}({ ...props }: {ComponentName}Props) {
  return (
    // JSX
  )
}
```

## 패턴 참조
- UI 컴포넌트: src/components/ui/ 활용
- 공유 컴포넌트: src/components/shared/ 패턴 참조
- 대시보드 컴포넌트: src/components/dashboard/ 참조

## 컴포넌트 유형
- **카드**: Card, CardHeader, CardContent, CardFooter 사용
- **폼**: Form, FormField, FormItem, FormLabel, FormControl 사용
- **테이블**: Table, TableHeader, TableBody, TableRow, TableCell 사용
- **다이얼로그**: Dialog, DialogTrigger, DialogContent 사용

## 스타일링
- Tailwind CSS 사용
- cn() 유틸리티로 조건부 클래스 적용
- 반응형 디자인 (sm:, md:, lg: 프리픽스)
