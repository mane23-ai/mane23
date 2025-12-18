'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Tables } from '@/types/database'
import type {
  CreateMarketingChannelInput,
  UpdateMarketingChannelInput,
} from '@/lib/validations/marketing'

type MarketingChannel = Tables<'marketing_channels'>

interface MarketingChannelsQueryParams {
  workspace_id?: string
  is_active?: boolean
  channel_type?: string
}

async function fetchMarketingChannels(
  params: MarketingChannelsQueryParams
): Promise<MarketingChannel[]> {
  const searchParams = new URLSearchParams()
  if (params.workspace_id) searchParams.set('workspace_id', params.workspace_id)
  if (params.is_active !== undefined) searchParams.set('is_active', String(params.is_active))
  if (params.channel_type) searchParams.set('channel_type', params.channel_type)

  const response = await fetch(`/api/marketing-channels?${searchParams.toString()}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '마케팅 채널 목록을 불러오는데 실패했습니다')
  }
  return response.json()
}

async function fetchMarketingChannel(id: string): Promise<MarketingChannel> {
  const response = await fetch(`/api/marketing-channels/${id}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '마케팅 채널을 불러오는데 실패했습니다')
  }
  return response.json()
}

async function createMarketingChannel(
  data: CreateMarketingChannelInput
): Promise<MarketingChannel> {
  const response = await fetch('/api/marketing-channels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '마케팅 채널 생성에 실패했습니다')
  }
  return response.json()
}

async function updateMarketingChannel({
  id,
  data,
}: {
  id: string
  data: UpdateMarketingChannelInput
}): Promise<MarketingChannel> {
  const response = await fetch(`/api/marketing-channels/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '마케팅 채널 수정에 실패했습니다')
  }
  return response.json()
}

async function deleteMarketingChannel(id: string): Promise<void> {
  const response = await fetch(`/api/marketing-channels/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '마케팅 채널 삭제에 실패했습니다')
  }
}

export function useMarketingChannels(params: MarketingChannelsQueryParams = {}) {
  return useQuery({
    queryKey: ['marketing-channels', params],
    queryFn: () => fetchMarketingChannels(params),
    enabled: !!params.workspace_id,
  })
}

export function useMarketingChannel(id: string | undefined) {
  return useQuery({
    queryKey: ['marketing-channels', id],
    queryFn: () => fetchMarketingChannel(id!),
    enabled: !!id,
  })
}

export function useCreateMarketingChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMarketingChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-channels'] })
    },
  })
}

export function useUpdateMarketingChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMarketingChannel,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marketing-channels'] })
      queryClient.setQueryData(['marketing-channels', data.id], data)
    },
  })
}

export function useDeleteMarketingChannel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteMarketingChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-channels'] })
    },
  })
}
