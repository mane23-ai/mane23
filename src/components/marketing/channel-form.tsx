'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  createMarketingChannelSchema,
  type CreateMarketingChannelInput,
  type MarketingChannelFormInput,
} from '@/lib/validations/marketing'
import { useCreateMarketingChannel, useUpdateMarketingChannel } from '@/hooks/use-marketing-channels'
import { useWorkspaceStore } from '@/stores/workspace-store'
import type { Tables } from '@/types/database'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ChannelFormProps {
  channel?: Tables<'marketing_channels'>
  onSuccess?: () => void
  onCancel?: () => void
}

const channelTypeOptions = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'blog', label: '블로그' },
  { value: 'newsletter', label: '뉴스레터' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
] as const

export function ChannelForm({ channel, onSuccess, onCancel }: ChannelFormProps) {
  const { currentWorkspace } = useWorkspaceStore()
  const createChannel = useCreateMarketingChannel()
  const updateChannel = useUpdateMarketingChannel()

  const isEditing = !!channel

  const form = useForm<MarketingChannelFormInput>({
    resolver: zodResolver(createMarketingChannelSchema),
    defaultValues: {
      workspace_id: channel?.workspace_id || currentWorkspace?.id || '',
      channel_type: channel?.channel_type || '',
      channel_name: channel?.channel_name || '',
      credentials: (channel?.credentials as MarketingChannelFormInput['credentials']) || {},
      settings: (channel?.settings as MarketingChannelFormInput['settings']) || {},
      is_active: channel?.is_active ?? true,
    },
  })

  // Zustand persist hydration 후 workspace_id 업데이트
  useEffect(() => {
    if (currentWorkspace?.id && !channel) {
      const currentValue = form.getValues('workspace_id')
      if (!currentValue || currentValue === '') {
        form.setValue('workspace_id', currentWorkspace.id)
      }
    }
  }, [currentWorkspace?.id, channel, form])

  const onSubmit = async (data: MarketingChannelFormInput) => {
    const validatedData = data as CreateMarketingChannelInput
    try {
      if (isEditing && channel) {
        await updateChannel.mutateAsync({
          id: channel.id,
          data: {
            channel_type: validatedData.channel_type,
            channel_name: validatedData.channel_name,
            credentials: validatedData.credentials,
            settings: validatedData.settings,
            is_active: validatedData.is_active,
          },
        })
        toast.success('마케팅 채널이 수정되었습니다')
      } else {
        await createChannel.mutateAsync(validatedData)
        toast.success('마케팅 채널이 생성되었습니다')
      }
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다')
    }
  }

  const isLoading = createChannel.isPending || updateChannel.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '마케팅 채널 수정' : '새 마케팅 채널'}</CardTitle>
        <CardDescription>
          {isEditing ? '마케팅 채널 정보를 수정합니다' : '새로운 마케팅 채널을 추가합니다'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="channel_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>채널 이름</FormLabel>
                  <FormControl>
                    <Input placeholder="채널 이름을 입력하세요" {...field} />
                  </FormControl>
                  <FormDescription>예: 내 유튜브 채널, 공식 인스타그램</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="channel_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>채널 유형</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="유형을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {channelTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">활성화</FormLabel>
                    <FormDescription>이 채널을 콘텐츠 배포에 사용합니다</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credentials.api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API 키 (선택)</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="API 키를 입력하세요"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>채널 연동에 필요한 API 키</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                취소
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? '수정' : '생성'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
