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
import { createProjectSchema, type CreateProjectInput, type ProjectFormInput } from '@/lib/validations/project'
import { useCreateProject, useUpdateProject } from '@/hooks/use-projects'
import { useWorkspaceStore } from '@/stores/workspace-store'
import type { Tables } from '@/types/database'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProjectFormProps {
  project?: Tables<'projects'>
  onSuccess?: () => void
  onCancel?: () => void
}

const statusOptions = [
  { value: 'planning', label: '기획' },
  { value: 'development', label: '개발' },
  { value: 'review', label: '검토' },
  { value: 'deployed', label: '배포됨' },
  { value: 'archived', label: '보관됨' },
] as const

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const { currentWorkspace } = useWorkspaceStore()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()

  const isEditing = !!project

  const form = useForm<ProjectFormInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      workspace_id: project?.workspace_id || currentWorkspace?.id || '',
      name: project?.name || '',
      description: project?.description || '',
      status: project?.status || 'planning',
      github_repo_url: project?.github_repo_url || '',
      client_info: (project?.client_info as ProjectFormInput['client_info']) || {},
      budget: (project?.budget as ProjectFormInput['budget']) || {},
    },
  })

  // Zustand persist hydration 후 workspace_id 업데이트
  useEffect(() => {
    if (currentWorkspace?.id && !project) {
      const currentValue = form.getValues('workspace_id')
      if (!currentValue || currentValue === '') {
        form.setValue('workspace_id', currentWorkspace.id)
      }
    }
  }, [currentWorkspace?.id, project, form])

  const onSubmit = async (data: ProjectFormInput) => {
    const validatedData = data as CreateProjectInput
    try {
      if (isEditing && project) {
        await updateProject.mutateAsync({
          id: project.id,
          data: {
            name: validatedData.name,
            description: validatedData.description,
            status: validatedData.status,
            github_repo_url: validatedData.github_repo_url,
            client_info: validatedData.client_info,
            budget: validatedData.budget,
          },
        })
        toast.success('프로젝트가 수정되었습니다')
      } else {
        await createProject.mutateAsync(validatedData)
        toast.success('프로젝트가 생성되었습니다')
      }
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다')
    }
  }

  const isLoading = createProject.isPending || updateProject.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '프로젝트 수정' : '새 프로젝트'}</CardTitle>
        <CardDescription>
          {isEditing ? '프로젝트 정보를 수정합니다' : '새로운 프로젝트를 생성합니다'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로젝트 이름</FormLabel>
                  <FormControl>
                    <Input placeholder="프로젝트 이름을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="프로젝트에 대한 설명을 입력하세요"
                      className="min-h-[100px]"
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

            <FormField
              control={form.control}
              name="github_repo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub 저장소 URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://github.com/username/repo"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>프로젝트와 연결할 GitHub 저장소 URL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="client_info.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>클라이언트 이름</FormLabel>
                    <FormControl>
                      <Input placeholder="클라이언트 이름" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_info.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>클라이언트 이메일</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="client@example.com"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="budget.total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>총 예산 (원)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget.paid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>지급된 금액 (원)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
