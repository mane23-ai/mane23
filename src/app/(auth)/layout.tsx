import Link from 'next/link';
import { Code2 } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-10 text-white">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-2">
            <Code2 className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold">Mane</span>
        </div>

        <div className="space-y-6">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;바이브 코딩으로 개발 생산성이 3배 이상 향상되었습니다.
              자연어로 원하는 기능을 설명하면 Claude가 알아서 코드를 작성해주니까요.&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">
              - 프리랜서 개발자
            </footer>
          </blockquote>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold">3x</p>
              <p className="text-sm text-zinc-400">생산성 향상</p>
            </div>
            <div>
              <p className="text-3xl font-bold">50+</p>
              <p className="text-sm text-zinc-400">프로젝트 완료</p>
            </div>
            <div>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-zinc-400">만족도</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-zinc-400">
          AI 기반 프리랜서 운영 시스템
        </p>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-[400px] space-y-6">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="rounded-lg bg-primary p-2">
              <Code2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Mane</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
