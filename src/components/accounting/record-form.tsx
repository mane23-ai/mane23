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
import {
  createAccountingRecordSchema,
  type CreateAccountingRecordInput,
  type AccountingRecordFormInput,
} from '@/lib/validations/accounting'
import {
  useCreateAccountingRecord,
  useUpdateAccountingRecord,
} from '@/hooks/use-accounting-records'
import { useWorkspaceStore } from '@/stores/workspace-store'
import type { Tables } from '@/types/database'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface RecordFormProps {
  record?: Tables<'accounting_records'>
  projectId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

const recordTypeOptions = [
  { value: 'income', label: '수입' },
  { value: 'expense', label: '지출' },
] as const

const categoryOptions = [
  { value: 'development', label: '개발비' },
  { value: 'design', label: '디자인비' },
  { value: 'consulting', label: '컨설팅' },
  { value: 'hosting', label: '호스팅/인프라' },
  { value: 'tools', label: '도구/소프트웨어' },
  { value: 'marketing', label: '마케팅' },
  { value: 'other', label: '기타' },
] as const

export function RecordForm({ record, projectId, onSuccess, onCancel }: RecordFormProps) {
  const { currentWorkspace } = useWorkspaceStore()
  const createRecord = useCreateAccountingRecord()
  const updateRecord = useUpdateAccountingRecord()

  const isEditing = !!record

  const form = useForm<AccountingRecordFormInput>({
    resolver: zodResolver(createAccountingRecordSchema),
    defaultValues: {
      workspace_id: record?.workspace_id || currentWorkspace?.id || '',
      project_id: record?.project_id || projectId || null,
      record_type: record?.record_type || 'income',
      amount: record?.amount || 0,
      description: record?.description || '',
      category: record?.category || '',
      tax_info: (record?.tax_info as AccountingRecordFormInput['tax_info']) || {},
      receipt_path: record?.receipt_path || '',
      recorded_date: record?.recorded_date || new Date().toISOString().split('T')[0],
    },
  })

  // Zustand persist hydration 후 workspace_id 업데이트
  useEffect(() => {
    if (currentWorkspace?.id && !record) {
      const currentValue = form.getValues('workspace_id')
      if (!currentValue || currentValue === '') {
        form.setValue('workspace_id', currentWorkspace.id)
      }
    }
  }, [currentWorkspace?.id, record, form])

  const onSubmit = async (data: AccountingRecordFormInput) => {
    const validatedData = data as CreateAccountingRecordInput
    try {
      if (isEditing && record) {
        await updateRecord.mutateAsync({
          id: record.id,
          data: {
            record_type: validatedData.record_type,
            amount: validatedData.amount,
            description: validatedData.description,
            category: validatedData.category,
            tax_info: validatedData.tax_info,
            receipt_path: validatedData.receipt_path,
            recorded_date: validatedData.recorded_date,
          },
        })
        toast.success('회계 기록이 수정되었습니다')
      } else {
        await createRecord.mutateAsync(validatedData)
        toast.success('회계 기록이 생성되었습니다')
      }
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다')
    }
  }

  const isLoading = createRecord.isPending || updateRecord.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '회계 기록 수정' : '새 회계 기록'}</CardTitle>
        <CardDescription>
          {isEditing ? '회계 기록을 수정합니다' : '새로운 수입 또는 지출 기록을 추가합니다'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="record_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>유형</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="유형을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recordTypeOptions.map((option) => (
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
                name="recorded_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>기록일</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>금액 (원)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카테고리</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => (
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="기록에 대한 설명을 입력하세요"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tax_info.tax_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>세율 (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>부가세 등 세율</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax_info.invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>세금계산서 번호</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="세금계산서 번호"
                        {...field}
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
