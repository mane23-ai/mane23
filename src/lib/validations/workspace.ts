import { z } from 'zod'

export const workspaceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    projectUpdates: z.boolean().optional(),
    contentVerification: z.boolean().optional(),
    marketing: z.boolean().optional(),
  }).optional(),
  apiKeys: z.object({
    anthropic: z.string().optional(),
    github: z.string().optional(),
  }).optional(),
}).optional()

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, '워크스페이스 이름을 입력하세요').max(100, '이름은 100자 이내로 입력하세요'),
  settings: workspaceSettingsSchema,
})

export const updateWorkspaceSchema = createWorkspaceSchema.partial()

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>
export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>
