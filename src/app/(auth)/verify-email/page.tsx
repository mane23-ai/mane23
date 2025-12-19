'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>이메일을 확인해주세요</CardTitle>
        <CardDescription>
          {email ? (
            <>
              <span className="font-medium text-foreground">{email}</span>
              <br />
              위 주소로 인증 이메일을 발송했습니다.
            </>
          ) : (
            '입력하신 이메일 주소로 인증 메일을 발송했습니다.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p className="mb-2">📬 이메일이 도착하지 않았나요?</p>
          <ul className="list-inside list-disc space-y-1 text-left">
            <li>스팸 폴더를 확인해주세요</li>
            <li>이메일 주소가 올바른지 확인해주세요</li>
            <li>몇 분 후에 다시 시도해주세요</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button asChild className="w-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            로그인 페이지로 이동
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          이메일 인증 후 로그인할 수 있습니다
        </p>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>이메일을 확인해주세요</CardTitle>
        </CardHeader>
      </Card>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
