'use client'

import {
  FolderKanban,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Code2,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjects } from '@/hooks/use-projects'
import { useContents } from '@/hooks/use-contents'
import { useAccountingSummary } from '@/hooks/use-accounting-records'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

const statusConfig = {
  planning: { label: '기획', variant: 'secondary' as const },
  development: { label: '개발', variant: 'default' as const },
  review: { label: '검토', variant: 'outline' as const },
  deployed: { label: '배포됨', variant: 'default' as const },
  archived: { label: '보관됨', variant: 'secondary' as const },
  draft: { label: '초안', variant: 'secondary' as const },
  approved: { label: '승인됨', variant: 'default' as const },
  published: { label: '게시됨', variant: 'default' as const },
}

const contentTypeLabels: Record<string, string> = {
  blog: '블로그',
  video_script: '영상 스크립트',
  social_post: '소셜 포스트',
  newsletter: '뉴스레터',
  documentation: '문서',
}

function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko })
  } catch {
    return dateString
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjects({ workspaceId })

  const {
    data: contents,
    isLoading: contentsLoading,
    error: contentsError,
  } = useContents({ workspaceId })

  const {
    summary: accountingSummary,
    isLoading: accountingLoading,
  } = useAccountingSummary({ workspaceId })

  // 통계 계산
  const activeProjects = projects?.filter((p) =>
    ['planning', 'development', 'review'].includes(p.status)
  ).length || 0

  const totalContents = contents?.length || 0

  const pendingContents = contents?.filter((c) =>
    ['draft', 'review'].includes(c.status)
  ).length || 0

  const stats = [
    {
      title: '진행 중 프로젝트',
      value: activeProjects,
      description: '활성 상태',
      icon: FolderKanban,
    },
    {
      title: '작성된 콘텐츠',
      value: totalContents,
      description: '총 개수',
      icon: FileText,
    },
    {
      title: '이번 달 수익',
      value: formatCurrency(accountingSummary.totalIncome),
      description: `지출: ${formatCurrency(accountingSummary.totalExpense)}`,
      icon: TrendingUp,
      trend: accountingSummary.balance > 0
        ? { value: Math.round((accountingSummary.balance / (accountingSummary.totalIncome || 1)) * 100), isPositive: true }
        : undefined,
    },
    {
      title: '대기 중 작업',
      value: pendingContents,
      description: '검토 필요',
      icon: Clock,
    },
  ]

  // 최근 프로젝트 (최대 3개)
  const recentProjects = projects?.slice(0, 3) || []

  // 최근 콘텐츠 (최대 3개)
  const recentContents = contents?.slice(0, 3) || []

  // 대기 중인 작업 생성
  const pendingTasks = [
    ...(contents?.filter((c) => c.status === 'review').slice(0, 2).map((c) => ({
      id: c.id,
      title: '콘텐츠 검토 대기',
      description: `"${c.title}" 검토가 필요합니다`,
      type: 'verification' as const,
    })) || []),
    ...(contents?.filter((c) => c.status === 'approved').slice(0, 1).map((c) => ({
      id: c.id,
      title: '배포 승인',
      description: `"${c.title}" 배포 대기 중`,
      type: 'publish' as const,
    })) || []),
  ]

  const isLoading = projectsLoading || contentsLoading || accountingLoading
  const hasError = projectsError || contentsError

  if (!workspaceId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="대시보드"
          description="프로젝트, 콘텐츠, 수익 현황을 한눈에 확인하세요."
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">워크스페이스를 선택해주세요</p>
            <p className="text-sm text-muted-foreground">
              대시보드를 보려면 워크스페이스가 필요합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description="프로젝트, 콘텐츠, 수익 현황을 한눈에 확인하세요."
      />

      {/* Stats */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              데이터를 불러오는 중 오류가 발생했습니다. 새로고침해주세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">최근 프로젝트</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">
                전체 보기 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <ProjectsSkeleton />
            ) : recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderKanban className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">아직 프로젝트가 없습니다</p>
                <Button variant="link" size="sm" asChild className="mt-2">
                  <Link href="/projects/new">첫 프로젝트 만들기</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {(project.client_info as { name?: string })?.name || '클라이언트 미지정'} ·{' '}
                        {formatRelativeTime(project.updated_at)}
                      </p>
                    </div>
                    <Badge variant={statusConfig[project.status]?.variant || 'secondary'}>
                      {statusConfig[project.status]?.label || project.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Contents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">최근 콘텐츠</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/contents">
                전체 보기 <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {contentsLoading ? (
              <ProjectsSkeleton />
            ) : recentContents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">아직 콘텐츠가 없습니다</p>
                <Button variant="link" size="sm" asChild className="mt-2">
                  <Link href="/contents/new">첫 콘텐츠 작성하기</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentContents.map((content) => (
                  <div
                    key={content.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <Link
                        href={`/contents/${content.id}`}
                        className="font-medium hover:underline"
                      >
                        {content.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {contentTypeLabels[content.content_type || ''] || content.content_type} ·{' '}
                        {formatRelativeTime(content.created_at)}
                      </p>
                    </div>
                    <Badge variant={statusConfig[content.status]?.variant || 'secondary'}>
                      {statusConfig[content.status]?.label || content.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">대기 중인 작업</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mb-2" />
                <p className="text-sm text-muted-foreground">모든 작업이 완료되었습니다!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className="rounded-full bg-muted p-2">
                      {task.type === 'verification' && (
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      )}
                      {task.type === 'publish' && (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/contents/${task.id}`}>처리하기</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">빠른 작업</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/projects/new">
                <FolderKanban className="mr-2 h-4 w-4" />
                새 프로젝트 생성
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/contents/new">
                <FileText className="mr-2 h-4 w-4" />
                콘텐츠 작성
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/projects">
                <Code2 className="mr-2 h-4 w-4" />
                바이브 코딩 시작
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
