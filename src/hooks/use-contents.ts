'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Tables } from '@/types/database'
import type { CreateContentInput, UpdateContentInput } from '@/lib/validations/content'

type Content = Tables<'contents'>

interface ContentsQueryParams {
  workspaceId?: string
  status?: Content['status']
  contentType?: string
}

async function fetchContents(params: ContentsQueryParams = {}): Promise<Content[]> {
  const searchParams = new URLSearchParams()
  if (params.workspaceId) searchParams.set('workspace_id', params.workspaceId)
  if (params.status) searchParams.set('status', params.status)
  if (params.contentType) searchParams.set('content_type', params.contentType)

  const url = `/api/contents${searchParams.toString() ? `?${searchParams}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '콘텐츠 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

async function fetchContent(id: string): Promise<Content> {
  const response = await fetch(`/api/contents/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '콘텐츠를 불러오는데 실패했습니다')
  }

  return response.json()
}

async function createContent(data: CreateContentInput): Promise<Content> {
  const response = await fetch('/api/contents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '콘텐츠 생성에 실패했습니다')
  }

  return response.json()
}

async function updateContent({
  id,
  data,
}: {
  id: string
  data: UpdateContentInput
}): Promise<Content> {
  const response = await fetch(`/api/contents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '콘텐츠 수정에 실패했습니다')
  }

  return response.json()
}

async function deleteContent(id: string): Promise<void> {
  const response = await fetch(`/api/contents/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '콘텐츠 삭제에 실패했습니다')
  }
}

export function useContents(params: ContentsQueryParams = {}) {
  return useQuery({
    queryKey: ['contents', params],
    queryFn: () => fetchContents(params),
  })
}

export function useContent(id: string) {
  return useQuery({
    queryKey: ['contents', id],
    queryFn: () => fetchContent(id),
    enabled: !!id,
  })
}

export function useCreateContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] })
    },
  })
}

export function useUpdateContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateContent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contents'] })
      queryClient.setQueryData(['contents', data.id], data)
    },
  })
}

export function useDeleteContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] })
    },
  })
}
