'use client';

import { useRouter } from 'next/navigation';
import { Bell, Search, User, LogOut, Moon, Sun, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/stores/ui-store';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const { sidebarOpen } = useUIStore();
  const { user, isLoading, signOut } = useAuth();

  // 사용자 이름 가져오기
  const getUserName = () => {
    if (!user) return '사용자';
    return user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자';
  };

  // 사용자 이메일 가져오기
  const getUserEmail = () => {
    return user?.email || '';
  };

  // 아바타 URL 가져오기
  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || '';
  };

  // 이니셜 가져오기
  const getInitials = () => {
    const name = getUserName();
    if (name.length >= 2) {
      // 한글인 경우 첫 두 글자
      if (/[가-힣]/.test(name)) {
        return name.slice(0, 2);
      }
      // 영문인 경우 첫 글자만 대문자로
      return name.charAt(0).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // 로그아웃 처리
  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header
      className={cn(
        'fixed top-0 z-30 flex h-16 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300',
        sidebarOpen ? 'left-64' : 'left-16',
        'right-0'
      )}
    >
      <div className="flex w-full items-center justify-between px-4">
        {/* Search */}
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="프로젝트, 콘텐츠, 문서 검색..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">테마 변경</span>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  3
                </Badge>
                <span className="sr-only">알림</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>알림</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <span className="font-medium">새 의뢰 요청</span>
                <span className="text-xs text-muted-foreground">
                  김철수님이 새 프로젝트 의뢰를 보냈습니다.
                </span>
                <span className="text-xs text-muted-foreground">10분 전</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <span className="font-medium">바이브 코딩 완료</span>
                <span className="text-xs text-muted-foreground">
                  &apos;로그인 기능 추가&apos; 작업이 완료되었습니다.
                </span>
                <span className="text-xs text-muted-foreground">1시간 전</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <span className="font-medium">콘텐츠 검증 완료</span>
                <span className="text-xs text-muted-foreground">
                  블루팀/레드팀 검증이 완료되었습니다.
                </span>
                <span className="text-xs text-muted-foreground">3시간 전</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                {isLoading ? (
                  <Skeleton className="h-9 w-9 rounded-full" />
                ) : (
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={getAvatarUrl()} alt={getUserName()} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium leading-none">{getUserName()}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {getUserEmail()}
                      </p>
                    </>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <User className="mr-2 h-4 w-4" />
                프로필
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                설정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
