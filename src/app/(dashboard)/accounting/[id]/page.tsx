'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Receipt,
  FolderKanban,
  Tag,
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
import { useAccountingRecord, useDeleteAccountingRecord } from '@/hooks/use-accounting-records'
import { RecordForm } from '@/components/accounting/record-form'
import { toast } from 'sonner'

function RecordDetailSkeleton() {
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
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  )
}

export default function RecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const recordId = params.id as string

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { data: record, isLoading, error } = useAccountingRecord(recordId)
  const deleteRecord = useDeleteAccountingRecord()

  const handleDelete = async () => {
    try {
      await deleteRecord.mutateAsync(recordId)
      toast.success('거래 기록이 삭제되었습니다')
      router.push('/accounting')
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
    return <RecordDetailSkeleton />
  }

  if (error || !record) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">거래 기록을 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : '요청한 거래 기록이 존재하지 않습니다.'}
        </p>
        <Button className="mt-4" asChild>
          <Link href="/accounting">
            <ArrowLeft className="mr-2 h-4 w-4" />
            회계로
          </Link>
        </Button>
      </div>
    )
  }

  const isIncome = record.record_type === 'income'
  const taxInfo = record.tax_info as { rate?: number; amount?: number; type?: string } | null

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
          <Link href="/accounting">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {record.description || (isIncome ? '수입' : '지출')}
            </h1>
            <Badge variant={isIncome ? 'default' : 'destructive'}>
              {isIncome ? '수입' : '지출'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {formatDate(record.recorded_date)}
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
        {/* Left Column - Amount */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">금액</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`rounded-full p-3 ${isIncome ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {isIncome ? (
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <div>
                  <p className={`text-3xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(record.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isIncome ? '수입' : '지출'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {record.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">설명</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{record.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Tax Info */}
          {taxInfo && (taxInfo.rate || taxInfo.amount) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">세금 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {taxInfo.type && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">세금 유형</span>
                    <span>{taxInfo.type}</span>
                  </div>
                )}
                {taxInfo.rate !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">세율</span>
                    <span>{taxInfo.rate}%</span>
                  </div>
                )}
                {taxInfo.amount !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">세금액</span>
                    <span>{formatCurrency(taxInfo.amount)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">거래 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{isIncome ? '수입' : '지출'}</p>
                  <p className="text-sm text-muted-foreground">거래 유형</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">거래일:</span>
                  <span>{formatDate(record.recorded_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">등록일:</span>
                  <span>{formatDate(record.created_at)}</span>
                </div>
              </div>
              {record.category && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{record.category}</Badge>
                  </div>
                </>
              )}
              {record.project_id && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    <Link href={`/projects/${record.project_id}`} className="text-sm text-primary hover:underline">
                      연결된 프로젝트 보기
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>거래 기록을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 거래 기록이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRecord.isPending}
            >
              {deleteRecord.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>거래 기록 편집</DialogTitle>
          </DialogHeader>
          <RecordForm
            record={record}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
