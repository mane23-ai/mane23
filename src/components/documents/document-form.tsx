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
import { createDocumentSchema, type CreateDocumentInput, type DocumentFormInput } from '@/lib/validations/document'
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-documents'
import { useWorkspaceStore } from '@/stores/workspace-store'
import type { Tables } from '@/types/database'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentFormProps {
  document?: Tables<'documents'>
  projectId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const sourceTypeOptions = [
  { value: 'internal', label: '내부 문서' },
  { value: 'external', label: '외부 문서' },
  { value: 'uploaded', label: '업로드됨' },
] as const

export function DocumentForm({ document, projectId, onSuccess, onCancel }: DocumentFormProps) {
  const { currentWorkspace } = useWorkspaceStore()
  const createDocument = useCreateDocument()
  const updateDocument = useUpdateDocument()

  const isEditing = !!document

  const form = useForm<DocumentFormInput>({
    resolver: zodResolver(createDocumentSchema),
    defaultValues: {
      workspace_id: document?.workspace_id || currentWorkspace?.id || '',
      project_id: document?.project_id || projectId || null,
      title: document?.title || '',
      content: document?.content || '',
      source_type: document?.source_type || 'internal',
      source_url: document?.source_url || '',
      source_author: document?.source_author || '',
      summary: (document?.summary as DocumentFormInput['summary']) || {},
    },
  })

  // Zustand persist hydration 후 workspace_id 업데이트
  useEffect(() => {
    if (currentWorkspace?.id && !document) {
      const currentValue = form.getValues('workspace_id')
      if (!currentValue || currentValue === '') {
        form.setValue('workspace_id', currentWorkspace.id)
      }
    }
  }, [currentWorkspace?.id, document, form])

  const onSubmit = async (data: DocumentFormInput) => {
    const validatedData = data as CreateDocumentInput
    try {
      if (isEditing && document) {
        await updateDocument.mutateAsync({
          id: document.id,
          data: {
            title: validatedData.title,
            content: validatedData.content,
            source_type: validatedData.source_type,
            source_url: validatedData.source_url,
            source_author: validatedData.source_author,
            summary: validatedData.summary,
          },
        })
        toast.success('문서가 수정되었습니다')
      } else {
        await createDocument.mutateAsync(validatedData)
        toast.success('문서가 생성되었습니다')
      }
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다')
    }
  }

  const isLoading = createDocument.isPending || updateDocument.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '문서 수정' : '새 문서'}</CardTitle>
        <CardDescription>
          {isEditing ? '문서 정보를 수정합니다' : '새로운 문서를 추가합니다'}
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
                    <Input placeholder="문서 제목을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="source_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>출처 유형</FormLabel>
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
                        {sourceTypeOptions.map((option) => (
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
                name="source_author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>작성자</FormLabel>
                    <FormControl>
                      <Input placeholder="작성자 이름" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="source_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>출처 URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/document"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>외부 문서의 경우 원본 URL을 입력하세요</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>내용</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="문서 내용을 입력하세요"
                      className="min-h-[200px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary.reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>참고 요약</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="AI가 생성한 참고용 요약"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>문서의 핵심 내용 요약</FormDescription>
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
