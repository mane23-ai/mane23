'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  Video,
  Send,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Mail,
  BookOpen,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useContents, useDeleteContent } from '@/hooks/use-contents'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { toast } from 'sonner'

const statusConfig = {
  draft: { label: '초안', icon: FileText, color: 'text-slate-500' },
  review: { label: '검토 중', icon: Clock, color: 'text-yellow-500' },
  approved: { label: '승인됨', icon: CheckCircle, color: 'text-green-500' },
  published: { label: '게시됨', icon: Send, color: 'text-blue-500' },
  archived: { label: '보관됨', icon: FileText, color: 'text-gray-500' },
}

const contentTypeConfig: Record<string, { label: string; icon: typeof FileText }> = {
  blog: { label: '블로그', icon: FileText },
  video_script: { label: '영상 스크립트', icon: Video },
  social_post: { label: '소셜 포스트', icon: Send },
  newsletter: { label: '뉴스레터', icon: Mail },
  documentation: { label: '문서', icon: BookOpen },
}

function ContentCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-14" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ContentsPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contentToDelete, setContentToDelete] = useState<string | null>(null)

  const {
    data: contents,
    isLoading,
    error,
  } = useContents({ workspaceId })

  const deleteContent = useDeleteContent()

  const filteredContents = contents?.filter((content) => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (content.body?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesStatus = statusFilter === 'all' || content.status === statusFilter
    const matchesType = typeFilter === 'all' || content.content_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  }) ?? []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleDeleteClick = (contentId: string) => {
    setContentToDelete(contentId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!contentToDelete) return

    try {
      await deleteContent.mutateAsync(contentToDelete)
      toast.success('콘텐츠가 삭제되었습니다')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '삭제에 실패했습니다')
    } finally {
      setDeleteDialogOpen(false)
      setContentToDelete(null)
    }
  }

  // 워크스페이스 미선택 상태
  if (!workspaceId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="콘텐츠"
          description="블로그, 영상 스크립트 등 콘텐츠를 관리하고 배포하세요."
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">워크스페이스를 선택해주세요</p>
            <p className="text-sm text-muted-foreground">
              콘텐츠를 보려면 워크스페이스가 필요합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="콘텐츠"
        description="블로그, 영상 스크립트 등 콘텐츠를 관리하고 배포하세요."
        action={
          <Button asChild>
            <Link href="/contents/new">
              <Plus className="mr-2 h-4 w-4" />
              새 콘텐츠
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="콘텐츠 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="draft">초안</SelectItem>
              <SelectItem value="review">검토 중</SelectItem>
              <SelectItem value="approved">승인됨</SelectItem>
              <SelectItem value="published">게시됨</SelectItem>
              <SelectItem value="archived">보관됨</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="타입" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 타입</SelectItem>
              <SelectItem value="blog">블로그</SelectItem>
              <SelectItem value="video_script">영상 스크립트</SelectItem>
              <SelectItem value="social_post">소셜 포스트</SelectItem>
              <SelectItem value="newsletter">뉴스레터</SelectItem>
              <SelectItem value="documentation">문서</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              콘텐츠를 불러오는 중 오류가 발생했습니다. 새로고침해주세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredContents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="콘텐츠가 없습니다"
          description={
            searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
              ? '검색 조건에 맞는 콘텐츠가 없습니다.'
              : '새 콘텐츠를 작성하여 마케팅을 시작하세요.'
          }
          action={
            !searchQuery && statusFilter === 'all' && typeFilter === 'all' ? (
              <Button asChild>
                <Link href="/contents/new">
                  <Plus className="mr-2 h-4 w-4" />
                  첫 콘텐츠 작성
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredContents.map((content) => {
            const status = statusConfig[content.status]
            const contentType = contentTypeConfig[content.content_type || ''] || {
              label: content.content_type || '기타',
              icon: FileText,
            }
            const StatusIcon = status.icon
            const TypeIcon = contentType.icon

            // verification JSON 파싱
            const verification = content.verification as {
              blue_team?: { passed?: boolean; score?: number }
              red_team?: { risk_score?: number }
            } | null

            return (
              <Card key={content.id}>
                <CardContent className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div className="rounded-lg bg-muted p-2">
                    <TypeIcon className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          href={`/contents/${content.id}`}
                          className="font-medium hover:underline"
                        >
                          {content.title}
                        </Link>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {content.body || '내용 없음'}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/contents/${content.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              편집
                            </Link>
                          </DropdownMenuItem>
                          {content.status === 'approved' && (
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              배포하기
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClick(content.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <StatusIcon className={`h-3 w-3 ${status.color}`} />
                        {status.label}
                      </Badge>
                      <Badge variant="secondary">{contentType.label}</Badge>
                      {content.purpose_tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDate(content.created_at)}
                      </span>
                    </div>

                    {/* Verification Status */}
                    {verification && verification.blue_team && (
                      <div className="flex items-center gap-4 pt-2 text-xs">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>블루팀: {Math.round((verification.blue_team.score ?? 0) * 100)}%</span>
                        </div>
                        {verification.red_team && (
                          <div className="flex items-center gap-1">
                            {(verification.red_team.risk_score ?? 0) > 0.3 ? (
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            ) : (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                            <span>
                              리스크: {Math.round((verification.red_team.risk_score ?? 0) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>콘텐츠를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 콘텐츠가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteContent.isPending}
            >
              {deleteContent.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
