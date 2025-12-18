'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Send,
  Calendar,
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  Settings,
  Loader2,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useMarketingChannels, useDeleteMarketingChannel } from '@/hooks/use-marketing-channels'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { toast } from 'sonner'

// 채널 타입 설정
const channelTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  blog_tistory: { label: '티스토리', icon: '📝', color: 'text-orange-500' },
  blog_naver: { label: '네이버 블로그', icon: '📗', color: 'text-green-500' },
  youtube: { label: '유튜브', icon: '🎬', color: 'text-red-500' },
  instagram: { label: '인스타그램', icon: '📷', color: 'text-pink-500' },
  twitter: { label: 'X (Twitter)', icon: '🐦', color: 'text-blue-400' },
  facebook: { label: '페이스북', icon: '👥', color: 'text-blue-600' },
  linkedin: { label: '링크드인', icon: '💼', color: 'text-blue-700' },
  threads: { label: '스레드', icon: '🧵', color: 'text-gray-800' },
  other: { label: '기타', icon: '📢', color: 'text-gray-500' },
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  )
}

function ChannelCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Skeleton className="h-6 w-8 mx-auto" />
              <Skeleton className="h-3 w-12 mx-auto mt-1" />
            </div>
            <div className="text-center">
              <Skeleton className="h-6 w-12 mx-auto" />
              <Skeleton className="h-3 w-12 mx-auto mt-1" />
            </div>
            <div className="text-center">
              <Skeleton className="h-6 w-10 mx-auto" />
              <Skeleton className="h-3 w-12 mx-auto mt-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MarketingPage() {
  const { currentWorkspace } = useWorkspaceStore()
  const workspaceId = currentWorkspace?.id

  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [channelToDelete, setChannelToDelete] = useState<string | null>(null)

  const {
    data: channels,
    isLoading,
    error,
  } = useMarketingChannels({ workspace_id: workspaceId })

  const deleteChannel = useDeleteMarketingChannel()

  // 필터링된 채널
  const filteredChannels = channels?.filter((channel) => {
    const matchesType = channelFilter === 'all' || channel.channel_type === channelFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && channel.is_active) ||
      (statusFilter === 'inactive' && !channel.is_active)
    return matchesType && matchesStatus
  }) ?? []

  // 통계 계산
  const totalChannels = channels?.length ?? 0
  const activeChannels = channels?.filter((c) => c.is_active).length ?? 0
  const channelTypes = [...new Set(channels?.map((c) => c.channel_type) ?? [])]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleDeleteClick = (channelId: string) => {
    setChannelToDelete(channelId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!channelToDelete) return

    try {
      await deleteChannel.mutateAsync(channelToDelete)
      toast.success('마케팅 채널이 삭제되었습니다')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '삭제에 실패했습니다')
    } finally {
      setDeleteDialogOpen(false)
      setChannelToDelete(null)
    }
  }

  // 워크스페이스 미선택 상태
  if (!workspaceId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="마케팅"
          description="콘텐츠를 다양한 채널에 배포하고 성과를 추적하세요."
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">워크스페이스를 선택해주세요</p>
            <p className="text-sm text-muted-foreground">
              마케팅 채널을 보려면 워크스페이스가 필요합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="마케팅"
        description="콘텐츠를 다양한 채널에 배포하고 성과를 추적하세요."
        action={
          <Button asChild>
            <Link href="/marketing/channels/new">
              <Plus className="mr-2 h-4 w-4" />
              채널 연결
            </Link>
          </Button>
        }
      />

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              마케팅 채널을 불러오는 중 오류가 발생했습니다. 새로고침해주세요.
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
            <CardHeader className="pb-2">
              <CardDescription>전체 채널</CardDescription>
              <CardTitle className="text-2xl">{totalChannels}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                연결된 모든 마케팅 채널
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>활성 채널</CardDescription>
              <CardTitle className="text-2xl text-green-600">{activeChannels}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                현재 운영 중인 채널
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>비활성 채널</CardDescription>
              <CardTitle className="text-2xl text-gray-500">
                {totalChannels - activeChannels}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                일시 중지된 채널
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>채널 종류</CardDescription>
              <CardTitle className="text-2xl">{channelTypes.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                연결된 플랫폼 유형
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList>
          <TabsTrigger value="channels" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            채널 관리
          </TabsTrigger>
          <TabsTrigger value="distributions" className="gap-2">
            <Send className="h-4 w-4" />
            배포 현황
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            배포 일정
          </TabsTrigger>
        </TabsList>

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="채널 타입" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 타입</SelectItem>
                <SelectItem value="blog_tistory">티스토리</SelectItem>
                <SelectItem value="blog_naver">네이버 블로그</SelectItem>
                <SelectItem value="youtube">유튜브</SelectItem>
                <SelectItem value="instagram">인스타그램</SelectItem>
                <SelectItem value="twitter">X (Twitter)</SelectItem>
                <SelectItem value="facebook">페이스북</SelectItem>
                <SelectItem value="linkedin">링크드인</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Channel List */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <ChannelCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredChannels.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="마케팅 채널이 없습니다"
              description={
                channelFilter !== 'all' || statusFilter !== 'all'
                  ? '검색 조건에 맞는 채널이 없습니다.'
                  : '마케팅 채널을 연결하여 콘텐츠를 배포하세요.'
              }
              action={
                channelFilter === 'all' && statusFilter === 'all' ? (
                  <Button asChild>
                    <Link href="/marketing/channels/new">
                      <Plus className="mr-2 h-4 w-4" />
                      첫 채널 연결
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredChannels.map((channel) => {
                const typeConfig = channelTypeConfig[channel.channel_type] || channelTypeConfig.other
                const settings = channel.settings as {
                  posts_count?: number
                  total_views?: number
                  engagement_rate?: number
                  goal_progress?: number
                } | null

                return (
                  <Card key={channel.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{typeConfig.icon}</span>
                          <div>
                            <CardTitle className="text-base">{channel.channel_name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{typeConfig.label}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={channel.is_active ? 'default' : 'secondary'}
                            className="gap-1"
                          >
                            {channel.is_active ? (
                              <Wifi className="h-3 w-3" />
                            ) : (
                              <WifiOff className="h-3 w-3" />
                            )}
                            {channel.is_active ? '활성' : '비활성'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/marketing/${channel.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  편집
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/marketing/${channel.id}/settings`}>
                                  <Settings className="mr-2 h-4 w-4" />
                                  설정
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteClick(channel.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold">{settings?.posts_count ?? 0}</p>
                            <p className="text-xs text-muted-foreground">게시물</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">
                              {settings?.total_views
                                ? settings.total_views >= 1000
                                  ? `${(settings.total_views / 1000).toFixed(1)}K`
                                  : settings.total_views
                                : 0}
                            </p>
                            <p className="text-xs text-muted-foreground">조회수</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold">
                              {settings?.engagement_rate?.toFixed(1) ?? 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">참여율</p>
                          </div>
                        </div>

                        {/* Goal Progress */}
                        {settings?.goal_progress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">목표 달성률</span>
                              <span className="font-medium">{settings.goal_progress}%</span>
                            </div>
                            <Progress value={settings.goal_progress} className="h-2" />
                          </div>
                        )}

                        {/* Created Date */}
                        <p className="text-xs text-muted-foreground">
                          연결일: {formatDate(channel.created_at)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Distributions Tab */}
        <TabsContent value="distributions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>배포 현황</CardTitle>
              <CardDescription>콘텐츠 배포 및 성과 추적 기능입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Send className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">배포 기능</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    콘텐츠에서 각 채널로 배포하면 여기에서 현황을 확인할 수 있습니다.
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/contents">
                      콘텐츠 목록 보기
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>배포 일정</CardTitle>
              <CardDescription>예약된 콘텐츠 배포 일정을 확인하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">캘린더 뷰</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    캘린더 기능은 곧 추가될 예정입니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>마케팅 채널을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 채널 연결 정보가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteChannel.isPending}
            >
              {deleteChannel.isPending && (
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
