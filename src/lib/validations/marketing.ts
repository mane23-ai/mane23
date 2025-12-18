import { z } from 'zod'

export const channelTypeSchema = z.enum([
  'youtube',
  'instagram',
  'tiktok',
  'blog',
  'newsletter',
  'twitter',
  'linkedin',
  'facebook',
])

export const credentialsSchema = z
  .object({
    api_key: z.string().optional(),
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
  })
  .optional()

export const settingsSchema = z
  .object({
    auto_publish: z.boolean().optional(),
    schedule_enabled: z.boolean().optional(),
    default_tags: z.array(z.string()).optional(),
  })
  .optional()

export const createMarketingChannelSchema = z.object({
  workspace_id: z.string().uuid('유효한 워크스페이스 ID가 필요합니다'),
  channel_type: z.string().min(1, '채널 유형을 선택하세요'),
  channel_name: z.string().min(1, '채널 이름을 입력하세요').max(100, '이름은 100자 이내로 입력하세요'),
  credentials: credentialsSchema,
  settings: settingsSchema,
  is_active: z.boolean().optional().default(true),
})

export const updateMarketingChannelSchema = createMarketingChannelSchema
  .partial()
  .omit({ workspace_id: true })

export type CreateMarketingChannelInput = z.infer<typeof createMarketingChannelSchema>
export type UpdateMarketingChannelInput = z.infer<typeof updateMarketingChannelSchema>

// Form에서 사용할 입력 타입 (z.input 사용)
export type MarketingChannelFormInput = z.input<typeof createMarketingChannelSchema>
