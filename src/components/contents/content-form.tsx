'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createContentSchema, type CreateContentInput, type ContentFormInput } from '@/lib/validations/content'
import { useCreateContent, useUpdateContent } from '@/hooks/use-contents'
import { useWorkspaceStore } from '@/stores/workspace-store'
import type { Tables } from '@/types/database'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ContentFormProps {
  content?: Tables<'contents'>
  onSuccess?: () => void
  onCancel?: () => void
}

const statusOptions = [
  { value: 'draft', label: '초안' },
  { value: 'review', label: '검토중' },
  { value: 'approved', label: '승인됨' },
  { value: 'published', label: '게시됨' },
  { value: 'archived', label: '보관됨' },
] as const

const contentTypeOptions = [
  { value: 'blog', label: '블로그' },
  { value: 'video_script', label: '영상 스크립트' },
  { value: 'social_post', label: '소셜 포스트' },
  { value: 'newsletter', label: '뉴스레터' },
  { value: 'documentation', label: '문서' },
] as const

export function ContentForm({ content, onSuccess, onCancel }: ContentFormProps) {
  const { currentWorkspace } = useWorkspaceStore()
  const createContent = useCreateContent()
  const updateContent = useUpdateContent()

  const isEditing = !!content

  const form = useForm<ContentFormInput>({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      workspace_id: content?.workspace_id || currentWorkspace?.id || '',
      topic_id: content?.topic_id || null,
      title: content?.title || '',
      body: content?.body || '',
      content_type: content?.content_type || 'blog',
      purpose_tags: content?.purpose_tags || [],
      status: content?.status || 'draft',
      verification: (content?.verification as ContentFormInput['verification']) || {},
    },
  })

  // Zustand persist hydration 후 workspace_id 업데이트
  useEffect(() => {
    if (currentWorkspace?.id && !content) {
      const currentValue = form.getValues('workspace_id')
      if (!currentValue || currentValue === '') {
        form.setValue('workspace_id', currentWorkspace.id)
      }
    }
  }, [currentWorkspace?.id, content, form])

  const onSubmit = async (data: ContentFormInput) => {
    const validatedData = data as CreateContentInput
    try {
      if (isEditing && content) {
        await updateContent.mutateAsync({
          id: content.id,
          data: {
            title: validatedData.title,
            body: validatedData.body,
            content_type: validatedData.content_type,
            purpose_tags: validatedData.purpose_tags,
            status: validatedData.status,
            verification: validatedData.verification,
          },
        })
        toast.success('콘텐츠가 수정되었습니다')
      } else {
        await createContent.mutateAsync(validatedData)
        toast.success('콘텐츠가 생성되었습니다')
      }
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다')
    }
  }

  const isLoading = createContent.isPending || updateContent.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '콘텐츠 수정' : '새 콘텐츠'}</CardTitle>
        <CardDescription>
          {isEditing ? '콘텐츠 정보를 수정합니다' : '새로운 콘텐츠를 작성합니다'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목</FormLabel>
                  <FormControl>
                    <Input placeholder="콘텐츠 제목을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="content_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>콘텐츠 유형</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="유형을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contentTypeOptions.map((option) => (
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>상태</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="상태를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
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
            </div>

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>본문</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="콘텐츠 본문을 입력하세요"
                      className="min-h-[300px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>마크다운 형식을 지원합니다</FormDescription>
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
