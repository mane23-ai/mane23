'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Calendar,
  Tag,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useContent, useDeleteContent, useUpdateContent } from '@/hooks/use-contents'
import { ContentForm } from '@/components/contents/content-form'
import { toast } from 'sonner'

const statusConfig = {
  draft: { label: '초안', icon: FileText, color: 'bg-slate-500' },
  review: { label: '검토 중', icon: Clock, color: 'bg-yellow-500' },
  approved: { label: '승인됨', icon: CheckCircle, color: 'bg-green-500' },
  published: { label: '게시됨', icon: Send, color: 'bg-blue-500' },
  archived: { label: '보관됨', icon: FileText, color: 'bg-gray-500' },
}

const contentTypeConfig: Record<string, string> = {
  blog: '블로그',
  video_script: '영상 스크립트',
  social_post: '소셜 포스트',
  newsletter: '뉴스레터',
  documentation: '문서',
}

function ContentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  )
}

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contentId = params.id as string

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { data: content, isLoading, error } = useContent(contentId)
  const deleteContent = useDeleteContent()
  const updateContent = useUpdateContent()

  const handleDelete = async () => {
    try {
      await deleteContent.mutateAsync(contentId)
      toast.success('콘텐츠가 삭제되었습니다')
      router.push('/contents')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '삭제에 실패했습니다')
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateContent.mutateAsync({
        id: contentId,
        data: { status: newStatus as 'draft' | 'review' | 'approved' | 'published' | 'archived' },
      })
      toast.success('상태가 변경되었습니다')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '상태 변경에 실패했습니다')
    }
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
  }

  if (isLoading) {
    return <ContentDetailSkeleton />
  }

  if (error || !content) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">콘텐츠를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : '요청한 콘텐츠가 존재하지 않습니다.'}
        </p>
        <Button className="mt-4" asChild>
          <Link href="/contents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            콘텐츠 목록으로
          </Link>
        </Button>
      </div>
    )
  }

  const status = statusConfig[content.status]
  const StatusIcon = status.icon
  const verification = content.verification as {
    blue_team?: { passed?: boolean; score?: number }
    red_team?: { risk_score?: number }
  } | null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{content.title}</h1>
            <Badge variant="secondary" className="gap-1.5">
              <span className={`h-2 w-2 rounded-full ${status.color}`} />
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {contentTypeConfig[content.content_type || ''] || '기타'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            편집
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {content.status === 'draft' && (
                <DropdownMenuItem onClick={() => handleStatusChange('review')}>
                  <Clock className="mr-2 h-4 w-4" />
                  검토 요청
                </DropdownMenuItem>
              )}
              {content.status === 'review' && (
                <DropdownMenuItem onClick={() => handleStatusChange('approved')}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  승인
                </DropdownMenuItem>
              )}
              {content.status === 'approved' && (
                <DropdownMenuItem onClick={() => handleStatusChange('published')}>
                  <Send className="mr-2 h-4 w-4" />
                  게시
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
        {/* Left Column - Content Body */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">본문</CardTitle>
            </CardHeader>
            <CardContent>
              {content.body ? (
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                  {content.body}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  아직 작성된 내용이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">상태 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${status.color} bg-opacity-10`}>
                  <StatusIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{status.label}</p>
                  <p className="text-sm text-muted-foreground">현재 상태</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">생성:</span>
                  <span>{formatDate(content.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">수정:</span>
                  <span>{formatDate(content.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags Card */}
          {content.purpose_tags && content.purpose_tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">태그</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {content.purpose_tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Card */}
          {verification && (verification.blue_team || verification.red_team) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">검증 결과</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {verification.blue_team && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">블루팀 점수</span>
                    </div>
                    <Badge variant="secondary">
                      {Math.round((verification.blue_team.score ?? 0) * 100)}%
                    </Badge>
                  </div>
                )}
                {verification.red_team && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(verification.red_team.risk_score ?? 0) > 0.3 ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm">리스크 점수</span>
                    </div>
                    <Badge
                      variant={(verification.red_team.risk_score ?? 0) > 0.3 ? 'destructive' : 'secondary'}
                    >
                      {Math.round((verification.red_team.risk_score ?? 0) * 100)}%
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
              onClick={handleDelete}
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>콘텐츠 편집</DialogTitle>
          </DialogHeader>
          <ContentForm
            content={content}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
