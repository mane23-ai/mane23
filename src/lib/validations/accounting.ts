import { z } from 'zod'

export const recordTypeSchema = z.enum(['income', 'expense'])

export const taxInfoSchema = z
  .object({
    tax_rate: z.number().min(0).max(100).optional(),
    tax_amount: z.number().min(0).optional(),
    tax_type: z.string().optional(),
    invoice_number: z.string().optional(),
  })
  .optional()

export const createAccountingRecordSchema = z.object({
  workspace_id: z.string().uuid('유효한 워크스페이스 ID가 필요합니다'),
  project_id: z.string().uuid('유효한 프로젝트 ID가 필요합니다').optional().nullable(),
  record_type: recordTypeSchema,
  amount: z.number().min(0, '금액은 0 이상이어야 합니다'),
  description: z.string().max(500, '설명은 500자 이내로 입력하세요').optional().nullable(),
  category: z.string().max(50, '카테고리는 50자 이내로 입력하세요').optional().nullable(),
  tax_info: taxInfoSchema,
  receipt_path: z.string().optional().nullable(),
  recorded_date: z.string().min(1, '기록일을 입력하세요'),
})

export const updateAccountingRecordSchema = createAccountingRecordSchema
  .partial()
  .omit({ workspace_id: true })

export type CreateAccountingRecordInput = z.infer<typeof createAccountingRecordSchema>
export type UpdateAccountingRecordInput = z.infer<typeof updateAccountingRecordSchema>

// Form에서 사용할 입력 타입 (z.input 사용)
export type AccountingRecordFormInput = z.input<typeof createAccountingRecordSchema>
