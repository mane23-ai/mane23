'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Code2,
  Github,
  ExternalLink,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Clock,
  CheckCircle,
  User,
  Mail,
  Calendar,
  GitBranch,
  GitCommit,
  Play,
  History,
  Settings,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useProject, useDeleteProject } from '@/hooks/use-projects'
import { ProjectForm } from '@/components/projects/project-form'
import { toast } from 'sonner'

const statusConfig = {
  planning: { label: '기획', color: 'bg-slate-500' },
  development: { label: '개발', color: 'bg-blue-500' },
  review: { label: '검토', color: 'bg-yellow-500' },
  deployed: { label: '배포됨', color: 'bg-green-500' },
  archived: { label: '보관됨', color: 'bg-gray-500' },
}

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-10 w-96" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { data: project, isLoading, error } = useProject(projectId)
  const deleteProject = useDeleteProject()

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(projectId)
      toast.success('프로젝트가 삭제되었습니다')
      router.push('/projects')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '삭제에 실패했습니다')
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
  }

  if (isLoading) {
    return <ProjectDetailSkeleton />
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">프로젝트를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : '요청한 프로젝트가 존재하지 않습니다.'}
        </p>
        <Button className="mt-4" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            프로젝트 목록으로
          </Link>
        </Button>
      </div>
    )
  }

  const status = statusConfig[project.status]
  const budget = project.budget as { total?: number; paid?: number } | null
  const clientInfo = project.client_info as { name?: string; email?: string; company?: string } | null
  const metadata = project.metadata as { tech_stack?: string[] } | null

  const budgetTotal = budget?.total ?? 0
  const budgetPaid = budget?.paid ?? 0
  const paymentProgress = budgetTotal > 0 ? (budgetPaid / budgetTotal) * 100 : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant="secondary" className="gap-1.5">
              <span className={`h-2 w-2 rounded-full ${status.color}`} />
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {project.description || '설명 없음'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}/vibe`}>
              <Code2 className="mr-2 h-4 w-4" />
              바이브 코딩
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                편집
              </DropdownMenuItem>
              {project.github_repo_url && (
                <DropdownMenuItem asChild>
                  <a
                    href={project.github_repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">개요</TabsTrigger>
              <TabsTrigger value="vibe-sessions">바이브 코딩 세션</TabsTrigger>
              <TabsTrigger value="documents">문서</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Quick Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>바이브 코딩 세션</CardDescription>
                    <CardTitle className="text-2xl">0</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      아직 세션이 없습니다
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>지급 현황</CardDescription>
                    <CardTitle className="text-2xl">{Math.round(paymentProgress)}%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(budgetPaid)} / {formatCurrency(budgetTotal)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>프로젝트 문서</CardDescription>
                    <CardTitle className="text-2xl">0</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      아직 문서가 없습니다
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Tech Stack */}
              {metadata?.tech_stack && metadata.tech_stack.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">기술 스택</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {metadata.tech_stack.map((tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State for Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">최근 활동</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Code2 className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      아직 활동 내역이 없습니다
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href={`/projects/${project.id}/vibe`}>
                        <Play className="mr-2 h-4 w-4" />
                        바이브 코딩 시작
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vibe Sessions Tab */}
            <TabsContent value="vibe-sessions" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  바이브 코딩 세션
                </p>
                <Button asChild>
                  <Link href={`/projects/${project.id}/vibe`}>
                    <Play className="mr-2 h-4 w-4" />
                    새 세션 시작
                  </Link>
                </Button>
              </div>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Code2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">세션 없음</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    바이브 코딩 세션을 시작하여 AI와 함께 개발하세요.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  프로젝트 관련 문서
                </p>
                <Button size="sm" asChild>
                  <Link href="/documents">
                    <Plus className="mr-2 h-4 w-4" />
                    문서 추가
                  </Link>
                </Button>
              </div>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">문서 없음</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    프로젝트와 관련된 문서를 추가하세요.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">의뢰인 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clientInfo?.name || clientInfo?.email ? (
                <>
                  {clientInfo.name && (
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-muted p-2">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{clientInfo.name}</p>
                        {clientInfo.company && (
                          <p className="text-sm text-muted-foreground">{clientInfo.company}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {clientInfo.email && (
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-muted p-2">
                        <Mail className="h-4 w-4" />
                      </div>
                      <a
                        href={`mailto:${clientInfo.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {clientInfo.email}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">의뢰인 정보가 없습니다</p>
              )}
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">예산 및 지급</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">지급 현황</span>
                  <span className="font-medium">
                    {formatCurrency(budgetPaid)} / {formatCurrency(budgetTotal)}
                  </span>
                </div>
                <Progress value={paymentProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {Math.round(paymentProgress)}% 완료
                </p>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">총 예산</span>
                  <span className="font-medium">{formatCurrency(budgetTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">지급 완료</span>
                  <span className="font-medium text-green-600">{formatCurrency(budgetPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">잔액</span>
                  <span className="font-medium">{formatCurrency(budgetTotal - budgetPaid)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">일정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">생성일</p>
                  <p className="font-medium">{formatDate(project.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">최근 업데이트</p>
                  <p className="font-medium">{formatDate(project.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GitHub */}
          {project.github_repo_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">GitHub 레포지토리</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  <a
                    href={project.github_repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate"
                  >
                    {project.github_repo_url.replace('https://github.com/', '')}
                  </a>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={project.github_repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    GitHub에서 열기
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 프로젝트와 관련된 모든 데이터가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>프로젝트 편집</DialogTitle>
          </DialogHeader>
          <ProjectForm
            project={project}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
