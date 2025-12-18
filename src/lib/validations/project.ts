import { z } from 'zod'

export const projectStatusSchema = z.enum([
  'planning',
  'development',
  'review',
  'deployed',
  'archived',
])

export const clientInfoSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
}).optional()

export const budgetSchema = z.object({
  total: z.number().min(0).optional(),
  paid: z.number().min(0).optional(),
  currency: z.string().default('KRW'),
}).optional()

export const createProjectSchema = z.object({
  workspace_id: z.string().uuid('유효한 워크스페이스 ID가 필요합니다'),
  name: z.string().min(1, '프로젝트 이름을 입력하세요').max(100, '이름은 100자 이내로 입력하세요'),
  description: z.string().max(1000, '설명은 1000자 이내로 입력하세요').optional().nullable(),
  status: projectStatusSchema.optional().default('planning'),
  github_repo_url: z.string().url('유효한 URL을 입력하세요').optional().nullable().or(z.literal('')),
  client_info: clientInfoSchema,
  budget: budgetSchema,
})

export const updateProjectSchema = createProjectSchema.partial().omit({ workspace_id: true })

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

// Form에서 사용할 입력 타입 (z.input 사용)
export type ProjectFormInput = z.input<typeof createProjectSchema>
