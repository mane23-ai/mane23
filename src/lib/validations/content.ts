import { z } from 'zod'

export const contentStatusSchema = z.enum(['draft', 'review', 'approved', 'published', 'archived'])

export const contentTypeSchema = z.enum(['blog', 'video_script', 'social_post', 'newsletter', 'documentation'])

export const verificationSchema = z.object({
  blue_team_score: z.number().min(0).max(1).optional(),
  red_team_score: z.number().min(0).max(1).optional(),
  verified_at: z.string().optional(),
  verified_by: z.string().optional(),
}).optional()

export const createContentSchema = z.object({
  workspace_id: z.string().uuid('유효한 워크스페이스 ID가 필요합니다'),
  topic_id: z.string().uuid('유효한 주제 ID가 필요합니다').optional().nullable(),
  title: z.string().min(1, '제목을 입력하세요').max(200, '제목은 200자 이내로 입력하세요'),
  body: z.string().max(50000, '본문은 50000자 이내로 입력하세요').optional().nullable(),
  content_type: z.string().optional().nullable(),
  purpose_tags: z.array(z.string()).optional().nullable(),
  status: contentStatusSchema.optional().default('draft'),
  verification: verificationSchema,
})

export const updateContentSchema = createContentSchema.partial().omit({ workspace_id: true })

export type CreateContentInput = z.infer<typeof createContentSchema>
export type UpdateContentInput = z.infer<typeof updateContentSchema>

// Form에서 사용할 입력 타입 (z.input 사용)
export type ContentFormInput = z.input<typeof createContentSchema>
