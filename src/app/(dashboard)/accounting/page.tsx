'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  TrendingUp,
  DollarSign,
  Receipt,
  Calendar,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { useAccountingSummary, useDeleteAccountingRecord } from '@/hooks/use-accounting-records'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { toast } from 'sonner'

const categoryConfig: Record<string, { color: string; label: string }> = {
  development: { color: 'bg-blue-500', label: '개발비' },
  design: { color: 'bg-purple-500', label: '디자인비' },
  consulting: { color: 'bg-green-500', label: '컨설팅' },
  hosting: { color: 'bg-orange-500', label: '호스팅/인프라' },
  tools: { color: 'bg-indigo-500', label: '도구/소프트웨어' },
  marketing: { color: 'bg-pink-500', label: '마케팅' },
  other: { color: 'bg-gray-500', label: '기타' },
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-16 mt-2" />
      </CardContent>
    </Card>
  )
}

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  )
}

export default function AccountingPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<string>('month')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)

  const {
    data: records,
    summary,
    isLoading,
    error,
  } = useAccountingSummary({ workspaceId })

  const deleteRecord = useDeleteAccountingRecord()

  const filteredRecords = records?.filter((record) => {
    const matchesSearch = record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true
    const matchesType = typeFilter === 'all' || record.record_type === typeFilter
    return matchesSearch && matchesType
  }) ?? []

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

  const handleDeleteClick = (recordId: string) => {
    setRecordToDelete(recordId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return

    try {
      await deleteRecord.mutateAsync(recordToDelete)
      toast.success('회계 기록이 삭제되었습니다')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '삭제에 실패했습니다')
    } finally {
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
    }
  }

  // 세금 합계 계산
  const totalTax = records?.reduce((sum, r) => {
    const taxInfo = r.tax_info as { tax_rate?: number; amount?: number } | null
    return sum + (taxInfo?.amount || 0)
  }, 0) ?? 0

  // 카테고리별 집계
  const incomeByCategory = records?.filter(r => r.record_type === 'income').reduce((acc, r) => {
    const cat = r.category || 'other'
    acc[cat] = (acc[cat] || 0) + r.amount
    return acc
  }, {} as Record<string, number>) ?? {}

  const expenseByCategory = records?.filter(r => r.record_type === 'expense').reduce((acc, r) => {
    const cat = r.category || 'other'
    acc[cat] = (acc[cat] || 0) + r.amount
    return acc
  }, {} as Record<string, number>) ?? {}

  // 워크스페이스 미선택 상태
  if (!workspaceId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="회계"
          description="수입과 지출을 관리하고 세금 정보를 추적하세요."
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">워크스페이스를 선택해주세요</p>
            <p className="text-sm text-muted-foreground">
              회계 기록을 보려면 워크스페이스가 필요합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="회계"
        description="수입과 지출을 관리하고 세금 정보를 추적하세요."
        action={
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              내보내기
            </Button>
            <Button asChild>
              <Link href="/accounting/new">
                <Plus className="mr-2 h-4 w-4" />
                기록 추가
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
              회계 기록을 불러오는 중 오류가 발생했습니다. 새로고침해주세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>총 수입</CardDescription>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
              <p className="text-xs text-muted-foreground mt-1">이번 달</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>총 지출</CardDescription>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p>
              <p className="text-xs text-muted-foreground mt-1">이번 달</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>순수익</CardDescription>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.balance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">수입 - 지출</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>예상 세금</CardDescription>
              <Receipt className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalTax)}</p>
              <p className="text-xs text-muted-foreground mt-1">원천징수 합계</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="list" className="gap-2">
              <FileText className="h-4 w-4" />
              거래 내역
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              요약
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-2">
              <Receipt className="h-4 w-4" />
              세금
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[120px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">이번 주</SelectItem>
                <SelectItem value="month">이번 달</SelectItem>
                <SelectItem value="quarter">이번 분기</SelectItem>
                <SelectItem value="year">올해</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="거래 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="income">수입</SelectItem>
                <SelectItem value="expense">지출</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Records Table */}
          {isLoading ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>프로젝트</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead className="text-right">세금</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="거래 내역이 없습니다"
              description={
                searchQuery || typeFilter !== 'all'
                  ? '검색 조건에 맞는 거래 내역이 없습니다.'
                  : '수입과 지출을 기록하여 재무 관리를 시작하세요.'
              }
              action={
                !searchQuery && typeFilter === 'all' ? (
                  <Button asChild>
                    <Link href="/accounting/new">
                      <Plus className="mr-2 h-4 w-4" />
                      첫 거래 기록
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>프로젝트</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead className="text-right">세금</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const taxInfo = record.tax_info as { tax_rate?: number; amount?: number; invoice_number?: string } | null
                    const category = categoryConfig[record.category || 'other'] || categoryConfig.other

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {formatDate(record.recorded_date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {record.record_type === 'income' ? (
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-500" />
                            )}
                            <span>{record.description || '설명 없음'}</span>
                            {record.receipt_path && (
                              <Receipt className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${category.color}`} />
                            {category.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.project_id ? (
                            <Link
                              href={`/projects/${record.project_id}`}
                              className="text-primary hover:underline"
                            >
                              프로젝트 연결됨
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            record.record_type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {record.record_type === 'income' ? '+' : '-'}
                          {formatCurrency(record.amount)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {taxInfo?.tax_rate ? (
                            <span className="text-sm">
                              {taxInfo.tax_rate}%
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/accounting/${record.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  수정
                                </Link>
                              </DropdownMenuItem>
                              {record.receipt_path && (
                                <DropdownMenuItem>
                                  <Receipt className="mr-2 h-4 w-4" />
                                  영수증 보기
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteClick(record.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>카테고리별 수입</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(incomeByCategory).length === 0 ? (
                    <p className="text-sm text-muted-foreground">수입 기록이 없습니다.</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(incomeByCategory).map(([cat, amount]) => {
                        const category = categoryConfig[cat] || categoryConfig.other
                        return (
                          <div key={cat} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`h-3 w-3 rounded-full ${category.color}`} />
                              <span>{category.label}</span>
                            </div>
                            <span className="font-medium text-green-600">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>카테고리별 지출</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(expenseByCategory).length === 0 ? (
                    <p className="text-sm text-muted-foreground">지출 기록이 없습니다.</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(expenseByCategory).map(([cat, amount]) => {
                        const category = categoryConfig[cat] || categoryConfig.other
                        return (
                          <div key={cat} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`h-3 w-3 rounded-full ${category.color}`} />
                              <span>{category.label}</span>
                            </div>
                            <span className="font-medium text-red-600">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tax Tab */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>세금 정보</CardTitle>
              <CardDescription>원천징수 및 세금 관련 정보를 확인하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="rounded-lg border p-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32 mt-2" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">원천징수 합계</p>
                      <p className="text-2xl font-bold mt-1">{formatCurrency(totalTax)}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">예상 종합소득세</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(Math.round(summary.balance * 0.15))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">15% 기준 (예상치)</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">총 수입</p>
                      <p className="text-2xl font-bold mt-1 text-green-600">
                        {formatCurrency(summary.totalIncome)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      ⚠️ 표시된 세금 정보는 예상치이며, 정확한 세금 계산을 위해서는 세무사와 상담하시기
                      바랍니다.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
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
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRecord.isPending}
            >
              {deleteRecord.isPending && (
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
