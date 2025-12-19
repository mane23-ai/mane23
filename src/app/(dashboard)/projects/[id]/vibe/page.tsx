'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  Terminal,
  Code2,
  FileCode,
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
  AlertCircle,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useProject } from '@/hooks/use-projects';
import {
  useVibeSessions,
  useVibeSession,
  useCreateVibeSession,
  useVibeCommands,
  useExecuteVibeCommand,
} from '@/hooks/use-vibe';
import type { Tables } from '@/types/database';

type VibeCommand = Tables<'vibe_commands'>;

export default function VibeCodingPage() {
  const params = useParams();
  const projectId = params.id as string;

  // 프로젝트 데이터 조회
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(projectId);

  // 세션 관리
  const { data: sessions, isLoading: sessionsLoading } = useVibeSessions(projectId);
  const createSession = useCreateVibeSession();

  // 현재 활성 세션 (가장 최근 active 세션 또는 첫 번째 세션)
  const activeSession = sessions?.find((s) => s.status === 'active') || sessions?.[0];
  const { data: sessionWithCommands, refetch: refetchSession } = useVibeSession(activeSession?.id);

  // 명령어 관리
  const { data: commands = [], refetch: refetchCommands } = useVibeCommands(activeSession?.id);
  const executeCommand = useExecuteVibeCommand();

  // UI 상태
  const [inputValue, setInputValue] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 스크롤을 맨 아래로
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [commands]);

  // 세션 생성 (없는 경우)
  const ensureSession = useCallback(async () => {
    if (!activeSession && !createSession.isPending) {
      await createSession.mutateAsync({ project_id: projectId });
    }
  }, [activeSession, createSession, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || executeCommand.isPending) return;

    // 세션이 없으면 생성
    let sessionId = activeSession?.id;
    if (!sessionId) {
      const newSession = await createSession.mutateAsync({ project_id: projectId });
      sessionId = newSession.id;
    }

    // 명령어 실행
    await executeCommand.mutateAsync({
      session_id: sessionId,
      user_input: inputValue.trim(),
    });

    setInputValue('');
    refetchCommands();
    refetchSession();
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
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
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
      default:
        return '알 수 없음';
    }
  };

  // 로딩 상태
  if (projectLoading || sessionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  // 에러 상태
  if (projectError || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold">프로젝트를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mt-2">
          {projectError instanceof Error ? projectError.message : '프로젝트 정보를 불러올 수 없습니다.'}
        </p>
        <Button className="mt-4" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            프로젝트 목록으로
          </Link>
        </Button>
      </div>
    );
  }

  // AI 해석 정보 파싱
  const parseAiInterpretation = (aiInterpretation: unknown) => {
    if (!aiInterpretation) return null;
    if (typeof aiInterpretation === 'string') {
      try {
        return JSON.parse(aiInterpretation);
      } catch {
        return { reasoning: aiInterpretation };
      }
    }
    return aiInterpretation as {
      intent?: string;
      confidence?: number;
      suggestedActions?: string[];
      reasoning?: string;
    };
  };

  // CLI 명령어 파싱
  const parseCliCommands = (cliCommands: unknown): string[] => {
    if (!cliCommands) return [];
    if (Array.isArray(cliCommands)) return cliCommands;
    if (typeof cliCommands === 'string') {
      try {
        const parsed = JSON.parse(cliCommands);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [cliCommands];
      }
    }
    return [];
  };

  // 코드 변경 파싱
  const parseCodeChanges = (codeChanges: unknown): { file: string; type: string }[] => {
    if (!codeChanges) return [];
    if (Array.isArray(codeChanges)) return codeChanges as { file: string; type: string }[];
    if (typeof codeChanges === 'string') {
      try {
        const parsed = JSON.parse(codeChanges);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', isFullscreen && 'fixed inset-0 z-50 bg-background p-4')}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/projects/${projectId}`}>
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
            <Badge variant={executeCommand.isPending ? 'default' : 'secondary'} className="gap-1.5">
              {executeCommand.isPending ? (
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
                <Button variant="outline" size="icon" onClick={() => { refetchCommands(); refetchSession(); }}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>새로고침</TooltipContent>
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
                  {activeSession && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      세션: {activeSession.id.slice(0, 8)}...
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={ensureSession}
                    disabled={createSession.isPending}
                  >
                    {createSession.isPending ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    새 세션
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
                      {!activeSession && (
                        <Button
                          className="mt-4"
                          onClick={ensureSession}
                          disabled={createSession.isPending}
                        >
                          {createSession.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              세션 생성 중...
                            </>
                          ) : (
                            '새 세션 시작'
                          )}
                        </Button>
                      )}
                    </div>
                  ) : (
                    commands.map((cmd, index) => {
                      const aiInterpretation = parseAiInterpretation(cmd.ai_interpretation);
                      const cliCommands = parseCliCommands(cmd.cli_commands);
                      const codeChanges = parseCodeChanges(cmd.code_changes);
                      const executionResult = cmd.execution_result as { success?: boolean; output?: string; error?: string } | null;

                      return (
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
                                  {new Date(cmd.created_at).toLocaleTimeString('ko-KR')}
                                </span>
                                {getStatusIcon(cmd.status)}
                                <span className="text-xs text-muted-foreground">
                                  {getStatusLabel(cmd.status)}
                                </span>
                              </div>
                              <p className="text-sm">{cmd.user_input}</p>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(cmd.user_input, cmd.id)}
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
                          {aiInterpretation && (
                            <div className="ml-8 mt-2">
                              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Code2 className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Claude 해석
                                    {aiInterpretation.confidence !== undefined && (
                                      <span className="ml-2 text-xs">
                                        (신뢰도: {Math.round(aiInterpretation.confidence * 100)}%)
                                      </span>
                                    )}
                                  </span>
                                </div>
                                {aiInterpretation.intent && (
                                  <p className="text-sm">
                                    <span className="font-medium">의도:</span> {aiInterpretation.intent}
                                  </p>
                                )}
                                {aiInterpretation.reasoning && (
                                  <p className="text-sm text-muted-foreground">
                                    {aiInterpretation.reasoning}
                                  </p>
                                )}
                                {aiInterpretation.suggestedActions && aiInterpretation.suggestedActions.length > 0 && (
                                  <div className="text-sm">
                                    <span className="font-medium">제안 작업:</span>
                                    <ul className="list-disc list-inside ml-2 text-muted-foreground">
                                      {aiInterpretation.suggestedActions.map((action: string, i: number) => (
                                        <li key={i}>{action}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* CLI Commands */}
                          {cliCommands.length > 0 && (
                            <div className="ml-8 mt-2">
                              <div className="rounded-lg bg-zinc-950 p-3 font-mono text-xs">
                                {cliCommands.map((cliCmd, i) => (
                                  <div key={i} className="text-green-400">
                                    $ {cliCmd}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Execution Result */}
                          {executionResult && (
                            <div className="ml-8 mt-2">
                              <div className={cn(
                                'rounded-lg p-3 font-mono text-xs whitespace-pre-wrap',
                                executionResult.success ? 'bg-zinc-950 text-zinc-300' : 'bg-red-950/50 text-red-300'
                              )}>
                                {executionResult.output || executionResult.error || '결과 없음'}
                              </div>
                            </div>
                          )}

                          {/* Code Changes */}
                          {codeChanges.length > 0 && (
                            <div className="ml-8 mt-2">
                              <div className="flex items-center gap-2 mb-2">
                                <FileCode className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  변경된 파일 ({codeChanges.length})
                                </span>
                              </div>
                              <div className="space-y-1">
                                {codeChanges.map((change, i) => (
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
                        </div>
                      );
                    })
                  )}

                  {/* Executing Indicator */}
                  {executeCommand.isPending && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Claude가 작업 중입니다...
                    </div>
                  )}

                  {/* Error Display */}
                  {executeCommand.isError && (
                    <div className="flex items-center gap-2 text-sm text-red-500">
                      <XCircle className="h-4 w-4" />
                      {executeCommand.error instanceof Error ? executeCommand.error.message : '명령어 실행 실패'}
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
                    disabled={executeCommand.isPending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!inputValue.trim() || executeCommand.isPending}>
                    {executeCommand.isPending ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                  Enter로 전송 · Claude가 자연어를 분석하여 코드 작업을 수행합니다
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
                    <span className="text-muted-foreground">세션 상태</span>
                    <Badge variant={activeSession?.status === 'active' ? 'default' : 'secondary'}>
                      {activeSession?.status === 'active' ? '활성' : activeSession?.status || '없음'}
                    </Badge>
                  </div>
                  {activeSession && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">시작 시간</span>
                      <span className="font-medium text-xs">
                        {new Date(activeSession.created_at).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
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
                      .flatMap((c) => parseCodeChanges(c.code_changes))
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
                    {commands.flatMap((c) => parseCodeChanges(c.code_changes)).length === 0 && (
                      <p className="text-xs text-muted-foreground">변경 사항 없음</p>
                    )}
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
