'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { resetPassword } from '@/lib/auth/actions';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(email);

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.success) {
        setIsSubmitted(true);
        toast.success(result.message || '비밀번호 재설정 이메일을 발송했습니다.');
      }
    } catch (error) {
      toast.error('요청 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>이메일을 확인해주세요</CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">{email}</span>
            <br />
            위 주소로 비밀번호 재설정 링크를 발송했습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="mb-2">이메일이 도착하지 않았나요?</p>
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
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">비밀번호 찾기</h1>
        <p className="text-sm text-muted-foreground">
          가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  발송 중...
                </>
              ) : (
                '재설정 링크 발송'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            비밀번호가 기억나셨나요?{' '}
            <Link href="/login" className="text-primary hover:underline">
              로그인
            </Link>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
