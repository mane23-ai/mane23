'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  FileText,
  ExternalLink,
  Upload,
  MoreHorizontal,
  Trash2,
  Eye,
  Download,
  Link as LinkIcon,
  FileUp,
  Globe,
  BookOpen,
  AlertCircle,
  Loader2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { useDocuments, useDeleteDocument } from '@/hooks/use-documents'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { toast } from 'sonner'

const sourceTypeConfig = {
  internal: { label: '내부 문서', icon: BookOpen, color: 'text-blue-500' },
  external: { label: '외부 문서', icon: Globe, color: 'text-green-500' },
  uploaded: { label: '업로드', icon: FileUp, color: 'text-purple-500' },
}

function DocumentCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DocumentsPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)

  const {
    data: documents,
    isLoading,
    error,
  } = useDocuments({ workspaceId })

  const deleteDocument = useDeleteDocument()

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.content?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesSource = sourceFilter === 'all' || doc.source_type === sourceFilter
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'project' && doc.project_id) ||
      (activeTab === 'general' && !doc.project_id)
    return matchesSearch && matchesSource && matchesTab
  }) ?? []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    try {
      await deleteDocument.mutateAsync(documentToDelete)
      toast.success('문서가 삭제되었습니다')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '삭제에 실패했습니다')
    } finally {
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    }
  }

  // 워크스페이스 미선택 상태
  if (!workspaceId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="문서"
          description="프로젝트 관련 문서를 검색하고 관리하세요. AI가 자동으로 요약해드립니다."
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">워크스페이스를 선택해주세요</p>
            <p className="text-sm text-muted-foreground">
              문서를 보려면 워크스페이스가 필요합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="문서"
        description="프로젝트 관련 문서를 검색하고 관리하세요. AI가 자동으로 요약해드립니다."
        action={
          <div className="flex gap-2">
            <Button variant="outline">
              <Globe className="mr-2 h-4 w-4" />
              웹 검색
            </Button>
            <Button asChild>
              <Link href="/documents/new">
                <Upload className="mr-2 h-4 w-4" />
                문서 업로드
              </Link>
            </Button>
          </div>
        }
      />

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              문서를 불러오는 중 오류가 발생했습니다. 새로고침해주세요.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="project">프로젝트 문서</TabsTrigger>
            <TabsTrigger value="general">일반 문서</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="문서 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="출처" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 출처</SelectItem>
                <SelectItem value="internal">내부 문서</SelectItem>
                <SelectItem value="external">외부 문서</SelectItem>
                <SelectItem value="uploaded">업로드</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <DocumentCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="문서가 없습니다"
              description={
                searchQuery || sourceFilter !== 'all' || activeTab !== 'all'
                  ? '검색 조건에 맞는 문서가 없습니다.'
                  : '문서를 업로드하거나 웹에서 검색하여 추가하세요.'
              }
              action={
                !searchQuery && sourceFilter === 'all' && activeTab === 'all' ? (
                  <Button asChild>
                    <Link href="/documents/new">
                      <Upload className="mr-2 h-4 w-4" />
                      첫 문서 업로드
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((doc) => {
                const sourceType = sourceTypeConfig[doc.source_type || 'internal']
                const SourceIcon = sourceType.icon

                // summary JSON 파싱
                const summary = doc.summary as {
                  reference?: string
                  submission?: string
                } | null

                return (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="rounded-lg bg-muted p-2">
                          <SourceIcon className={`h-5 w-5 ${sourceType.color}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{doc.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{doc.source_author || '작성자 미상'}</span>
                                {doc.project_id && (
                                  <>
                                    <span>·</span>
                                    <Link
                                      href={`/projects/${doc.project_id}`}
                                      className="text-primary hover:underline"
                                    >
                                      프로젝트 연결됨
                                    </Link>
                                  </>
                                )}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/documents/${doc.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    상세 보기
                                  </Link>
                                </DropdownMenuItem>
                                {doc.source_url && (
                                  <DropdownMenuItem asChild>
                                    <a
                                      href={doc.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      원본 보기
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                {doc.file_path && (
                                  <DropdownMenuItem>
                                    <Download className="mr-2 h-4 w-4" />
                                    다운로드
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteClick(doc.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  삭제
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Summary */}
                          {summary?.reference && (
                            <div className="rounded-lg bg-muted/50 p-3">
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {summary.reference}
                              </p>
                            </div>
                          )}

                          {/* Meta */}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1">
                              <SourceIcon className={`h-3 w-3 ${sourceType.color}`} />
                              {sourceType.label}
                            </Badge>
                            {doc.source_url && (
                              <Badge variant="secondary" className="gap-1">
                                <LinkIcon className="h-3 w-3" />
                                링크
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatDate(doc.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
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
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDocument.isPending}
            >
              {deleteDocument.isPending && (
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
