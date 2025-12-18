import { z } from 'zod'

export const sourceTypeSchema = z.enum(['internal', 'external', 'uploaded'])

export const summarySchema = z.object({
  reference: z.string().optional(),
  submission: z.string().optional(),
  key_points: z.array(z.string()).optional(),
}).optional()

export const createDocumentSchema = z.object({
  workspace_id: z.string().uuid('유효한 워크스페이스 ID가 필요합니다'),
  project_id: z.string().uuid('유효한 프로젝트 ID가 필요합니다').optional().nullable(),
  title: z.string().min(1, '제목을 입력하세요').max(200, '제목은 200자 이내로 입력하세요'),
  content: z.string().max(100000, '내용은 100000자 이내로 입력하세요').optional().nullable(),
  source_type: sourceTypeSchema.optional().nullable(),
  source_url: z.union([
    z.string().url('유효한 URL을 입력하세요'),
    z.literal(''),
  ]).optional().nullable(),
  source_author: z.string().max(100, '작성자는 100자 이내로 입력하세요').optional().nullable(),
  collected_at: z.string().optional().nullable(),
  summary: summarySchema,
  file_path: z.string().optional().nullable(),
})

export const updateDocumentSchema = createDocumentSchema.partial().omit({ workspace_id: true })

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>

// Form에서 사용할 입력 타입 (z.input 사용)
export type DocumentFormInput = z.input<typeof createDocumentSchema>
