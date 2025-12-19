import { z } from 'zod'

export const vibeSessionStatusSchema = z.enum(['active', 'completed', 'failed'])

export const createVibeSessionSchema = z.object({
  project_id: z.string().uuid('유효한 프로젝트 ID가 필요합니다'),
})

export const updateVibeSessionSchema = z.object({
  status: vibeSessionStatusSchema.optional(),
  completed_at: z.string().optional(),
})

export const vibeCommandStatusSchema = z.enum(['pending', 'executing', 'completed', 'failed'])

export const createVibeCommandSchema = z.object({
  session_id: z.string().uuid('유효한 세션 ID가 필요합니다'),
  user_input: z.string().min(1, '명령어를 입력하세요').max(5000, '명령어가 너무 깁니다'),
})

export const updateVibeCommandSchema = z.object({
  ai_interpretation: z.any().optional(),
  cli_commands: z.array(z.string()).optional(),
  execution_result: z.any().optional(),
  code_changes: z.array(z.any()).optional(),
  status: vibeCommandStatusSchema.optional(),
})

export type CreateVibeSessionInput = z.infer<typeof createVibeSessionSchema>
export type UpdateVibeSessionInput = z.infer<typeof updateVibeSessionSchema>
export type CreateVibeCommandInput = z.infer<typeof createVibeCommandSchema>
export type UpdateVibeCommandInput = z.infer<typeof updateVibeCommandSchema>
