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
  ExternalLink,
  Calendar,
  User,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  Upload,
  Globe,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
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
import { useDocument, useDeleteDocument } from '@/hooks/use-documents'
import { DocumentForm } from '@/components/documents/document-form'
import { toast } from 'sonner'

const sourceTypeConfig = {
  internal: { label: '내부 문서', icon: FolderOpen },
  external: { label: '외부 문서', icon: Globe },
  uploaded: { label: '업로드', icon: Upload },
}

function DocumentDetailSkeleton() {
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

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { data: document, isLoading, error } = useDocument(documentId)
  const deleteDocument = useDeleteDocument()

  const handleDelete = async () => {
    try {
      await deleteDocument.mutateAsync(documentId)
      toast.success('문서가 삭제되었습니다')
      router.push('/documents')
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
    return <DocumentDetailSkeleton />
  }

  if (error || !document) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">문서를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : '요청한 문서가 존재하지 않습니다.'}
        </p>
        <Button className="mt-4" asChild>
          <Link href="/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            문서 목록으로
          </Link>
        </Button>
      </div>
    )
  }

  const sourceType = sourceTypeConfig[document.source_type || 'uploaded'] || sourceTypeConfig.uploaded
  const SourceIcon = sourceType.icon
  const summary = document.summary as { text?: string; keywords?: string[] } | null

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
          <Link href="/documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{document.title}</h1>
            <Badge variant="secondary" className="gap-1.5">
              <SourceIcon className="h-3 w-3" />
              {sourceType.label}
            </Badge>
          </div>
          {document.source_author && (
            <p className="text-muted-foreground mt-1">작성자: {document.source_author}</p>
          )}
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
              {document.source_url && (
                <DropdownMenuItem asChild>
                  <a href={document.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    원본 보기
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
        {/* Left Column - Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          {summary?.text && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">요약</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{summary.text}</p>
                {summary.keywords && summary.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {summary.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">내용</CardTitle>
            </CardHeader>
            <CardContent>
              {document.content ? (
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                  {document.content}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  문서 내용이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">문서 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{sourceType.label}</p>
                  <p className="text-sm text-muted-foreground">문서 유형</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">생성:</span>
                  <span>{formatDate(document.created_at)}</span>
                </div>
                {document.collected_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">수집:</span>
                    <span>{formatDate(document.collected_at)}</span>
                  </div>
                )}
                {document.source_author && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">작성자:</span>
                    <span>{document.source_author}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Source Link */}
          {document.source_url && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">원본 링크</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={document.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate"
                  >
                    {document.source_url}
                  </a>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <a href={document.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    원본에서 열기
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문서를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 문서가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDocument.isPending}
            >
              {deleteDocument.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>문서 편집</DialogTitle>
          </DialogHeader>
          <DocumentForm
            document={document}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
