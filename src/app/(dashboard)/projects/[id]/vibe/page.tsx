'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  Terminal,
  Code2,
  FileCode,
  GitCommit,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Copy,
  Check,
  History,
  Settings,
  Maximize2,
  Minimize2,
  Play,
  Square,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// 임시 프로젝트 데이터
const projectData = {
  '1': { name: '웹 대시보드 개발', github_repo_url: 'https://github.com/user/dashboard' },
  '2': { name: 'API 서버 구축', github_repo_url: 'https://github.com/user/api-server' },
};

interface VibeCommand {
  id: string;
  userInput: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  aiInterpretation?: string;
  cliCommands?: string[];
  output?: string;
  codeChanges?: {
    file: string;
    type: 'created' | 'modified' | 'deleted';
    diff?: string;
  }[];
  timestamp: Date;
  duration?: number;
}

// 임시 명령 히스토리
const initialCommands: VibeCommand[] = [
  {
    id: '1',
    userInput: '사용자 인증 기능을 추가해줘. 이메일과 비밀번호로 로그인할 수 있어야 해.',
    status: 'completed',
    aiInterpretation: '이메일/비밀번호 기반 로그인 기능을 구현합니다. Supabase Auth를 사용하여 인증 시스템을 구축하겠습니다.',
    cliCommands: [
      'npm install @supabase/supabase-js @supabase/ssr',
      'claude code "Create auth context and login form component"',
    ],
    output: `✓ Installing dependencies...
✓ Creating src/lib/supabase/client.ts
✓ Creating src/components/auth/login-form.tsx
✓ Creating src/app/(auth)/login/page.tsx
✓ Updating src/middleware.ts

Done! Created authentication system with:
- Login form component
- Supabase client configuration
- Protected route middleware`,
    codeChanges: [
      { file: 'src/lib/supabase/client.ts', type: 'created' },
      { file: 'src/components/auth/login-form.tsx', type: 'created' },
      { file: 'src/app/(auth)/login/page.tsx', type: 'created' },
      { file: 'src/middleware.ts', type: 'modified' },
    ],
    timestamp: new Date('2024-01-15T14:30:00'),
    duration: 45,
  },
  {
    id: '2',
    userInput: '대시보드에 사용자 통계 차트를 추가해줘',
    status: 'completed',
    aiInterpretation: '대시보드 페이지에 사용자 통계를 시각화하는 차트 컴포넌트를 추가합니다. Recharts 라이브러리를 사용하겠습니다.',
    cliCommands: [
      'npm install recharts',
      'claude code "Create user statistics chart component"',
    ],
    output: `✓ Installing recharts...
✓ Creating src/components/dashboard/user-stats-chart.tsx
✓ Updating src/app/(dashboard)/page.tsx

Chart component created with:
- Line chart for daily active users
- Bar chart for registration trends
- Responsive design`,
    codeChanges: [
      { file: 'src/components/dashboard/user-stats-chart.tsx', type: 'created' },
      { file: 'src/app/(dashboard)/page.tsx', type: 'modified' },
    ],
    timestamp: new Date('2024-01-15T14:35:00'),
    duration: 32,
  },
];

export default function VibeCodingPage() {
  const params = useParams();
  const projectId = params.id as string;
  const project = projectData[projectId as keyof typeof projectData];

  const [commands, setCommands] = useState<VibeCommand[]>(initialCommands);
  const [inputValue, setInputValue] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('terminal');

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 스크롤을 맨 아래로
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [commands]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isExecuting) return;

    const newCommand: VibeCommand = {
      id: Date.now().toString(),
      userInput: inputValue,
      status: 'pending',
      timestamp: new Date(),
    };

    setCommands((prev) => [...prev, newCommand]);
    setInputValue('');
    setIsExecuting(true);

    // 시뮬레이션: AI 해석 단계
    setTimeout(() => {
      setCommands((prev) =>
        prev.map((cmd) =>
          cmd.id === newCommand.id
            ? {
                ...cmd,
                status: 'executing',
                aiInterpretation: `"${inputValue}" 요청을 분석하고 실행합니다...`,
                cliCommands: ['claude code "' + inputValue + '"'],
              }
            : cmd
        )
      );
    }, 1000);

    // 시뮬레이션: 실행 완료
    setTimeout(() => {
      setCommands((prev) =>
        prev.map((cmd) =>
          cmd.id === newCommand.id
            ? {
                ...cmd,
                status: 'completed',
                output: `✓ 요청을 성공적으로 처리했습니다.

작업 내용:
- 요청 분석 완료
- 코드 생성/수정 완료
- 테스트 통과

변경된 파일: 2개`,
                codeChanges: [
                  { file: 'src/components/example.tsx', type: 'created' },
                  { file: 'src/app/page.tsx', type: 'modified' },
                ],
                duration: 28,
              }
            : cmd
        )
      );
      setIsExecuting(false);
    }, 3000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusIcon = (status: VibeCommand['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'executing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusLabel = (status: VibeCommand['status']) => {
    switch (status) {
      case 'pending':
        return '대기 중';
      case 'executing':
        return '실행 중';
      case 'completed':
        return '완료';
      case 'failed':
        return '실패';
    }
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">프로젝트를 찾을 수 없습니다</h2>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            프로젝트 목록으로
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', isFullscreen && 'fixed inset-0 z-50 bg-background p-4')}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/dashboard/projects/${projectId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold">바이브 코딩</h1>
              </div>
              <p className="text-sm text-muted-foreground">{project.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isExecuting ? 'default' : 'secondary'} className="gap-1.5">
              {isExecuting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  실행 중
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  준비됨
                </>
              )}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFullscreen ? '일반 모드' : '전체 화면'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>세션 히스토리</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>설정</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Main Content */}
        <div className={cn('grid gap-4', isFullscreen ? 'grid-cols-1 h-[calc(100vh-120px)]' : 'lg:grid-cols-3')}>
          {/* Terminal Panel */}
          <Card className={cn('flex flex-col', isFullscreen ? 'h-full' : 'lg:col-span-2')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  터미널
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    초기화
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Command Output Area */}
              <ScrollArea
                ref={scrollAreaRef}
                className={cn('flex-1 px-4', isFullscreen ? 'h-[calc(100vh-280px)]' : 'h-[400px]')}
              >
                <div className="space-y-4 pb-4">
                  {commands.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Code2 className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">바이브 코딩 시작</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                        자연어로 원하는 기능을 설명하면 Claude가 코드를 작성합니다.
                        아래 입력창에 요청사항을 입력해보세요.
                      </p>
                    </div>
                  ) : (
                    commands.map((cmd, index) => (
                      <div key={cmd.id} className="space-y-2">
                        {index > 0 && <Separator className="my-4" />}

                        {/* User Input */}
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-primary p-1.5">
                            <ChevronRight className="h-3 w-3 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-primary">You</span>
                              <span className="text-xs text-muted-foreground">
                                {cmd.timestamp.toLocaleTimeString('ko-KR')}
                              </span>
                              {getStatusIcon(cmd.status)}
                              <span className="text-xs text-muted-foreground">
                                {getStatusLabel(cmd.status)}
                              </span>
                            </div>
                            <p className="text-sm">{cmd.userInput}</p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(cmd.userInput, cmd.id)}
                              >
                                {copiedId === cmd.id ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>복사</TooltipContent>
                          </Tooltip>
                        </div>

                        {/* AI Response */}
                        {cmd.aiInterpretation && (
                          <div className="ml-8 mt-2">
                            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <Code2 className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  Claude 해석
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {cmd.aiInterpretation}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* CLI Commands */}
                        {cmd.cliCommands && cmd.cliCommands.length > 0 && (
                          <div className="ml-8 mt-2">
                            <div className="rounded-lg bg-zinc-950 p-3 font-mono text-xs">
                              {cmd.cliCommands.map((cliCmd, i) => (
                                <div key={i} className="text-green-400">
                                  $ {cliCmd}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Output */}
                        {cmd.output && (
                          <div className="ml-8 mt-2">
                            <div className="rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-300 whitespace-pre-wrap">
                              {cmd.output}
                            </div>
                          </div>
                        )}

                        {/* Code Changes */}
                        {cmd.codeChanges && cmd.codeChanges.length > 0 && (
                          <div className="ml-8 mt-2">
                            <div className="flex items-center gap-2 mb-2">
                              <FileCode className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">
                                변경된 파일 ({cmd.codeChanges.length})
                              </span>
                            </div>
                            <div className="space-y-1">
                              {cmd.codeChanges.map((change, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs rounded px-2 py-1 bg-muted/50"
                                >
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-[10px] px-1',
                                      change.type === 'created' && 'text-green-500 border-green-500/50',
                                      change.type === 'modified' && 'text-yellow-500 border-yellow-500/50',
                                      change.type === 'deleted' && 'text-red-500 border-red-500/50'
                                    )}
                                  >
                                    {change.type === 'created' ? 'A' : change.type === 'modified' ? 'M' : 'D'}
                                  </Badge>
                                  <code className="text-muted-foreground">{change.file}</code>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Duration */}
                        {cmd.duration && cmd.status === 'completed' && (
                          <div className="ml-8 mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {cmd.duration}초 소요
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* Executing Indicator */}
                  {isExecuting && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Claude가 작업 중입니다...
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="자연어로 원하는 기능을 설명하세요... (예: 사용자 인증 기능을 추가해줘)"
                    disabled={isExecuting}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!inputValue.trim() || isExecuting}>
                    {isExecuting ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                  Enter로 전송 · Claude Code CLI가 자동으로 코드를 작성합니다
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar - Hidden in fullscreen */}
          {!isFullscreen && (
            <div className="space-y-4">
              {/* Quick Commands */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">빠른 명령</CardTitle>
                  <CardDescription>자주 사용하는 명령어</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    '새 컴포넌트 만들어줘',
                    'API 엔드포인트 추가해줘',
                    '테스트 코드 작성해줘',
                    '버그 수정해줘',
                    '코드 리팩토링해줘',
                  ].map((cmd, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      className="w-full justify-start text-sm h-auto py-2"
                      onClick={() => {
                        setInputValue(cmd);
                        inputRef.current?.focus();
                      }}
                    >
                      <Play className="h-3 w-3 mr-2 text-muted-foreground" />
                      {cmd}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Session Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">세션 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">실행된 명령</span>
                    <span className="font-medium">{commands.length}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">성공</span>
                    <span className="font-medium text-green-500">
                      {commands.filter((c) => c.status === 'completed').length}개
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">실패</span>
                    <span className="font-medium text-red-500">
                      {commands.filter((c) => c.status === 'failed').length}개
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">총 소요 시간</span>
                    <span className="font-medium">
                      {commands.reduce((sum, c) => sum + (c.duration || 0), 0)}초
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">변경된 파일</span>
                    <span className="font-medium">
                      {commands.reduce((sum, c) => sum + (c.codeChanges?.length || 0), 0)}개
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Changes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">최근 변경</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {commands
                      .flatMap((c) => c.codeChanges || [])
                      .slice(-5)
                      .reverse()
                      .map((change, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1',
                              change.type === 'created' && 'text-green-500 border-green-500/50',
                              change.type === 'modified' && 'text-yellow-500 border-yellow-500/50',
                              change.type === 'deleted' && 'text-red-500 border-red-500/50'
                            )}
                          >
                            {change.type === 'created' ? '+' : change.type === 'modified' ? '~' : '-'}
                          </Badge>
                          <code className="text-muted-foreground truncate">{change.file}</code>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
