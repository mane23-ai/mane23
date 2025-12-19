'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useWorkspaceStore } from '@/stores/workspace-store'
import type { Tables } from '@/types/database'
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from '@/lib/validations/workspace'

type Workspace = Tables<'workspaces'>

async function fetchWorkspaces(): Promise<Workspace[]> {
  const response = await fetch('/api/workspaces')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '워크스페이스 목록을 불러오는데 실패했습니다')
  }
  return response.json()
}

async function fetchWorkspace(id: string): Promise<Workspace> {
  const response = await fetch(`/api/workspaces/${id}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '워크스페이스를 불러오는데 실패했습니다')
  }
  return response.json()
}

async function createWorkspace(data: CreateWorkspaceInput): Promise<Workspace> {
  const response = await fetch('/api/workspaces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '워크스페이스 생성에 실패했습니다')
  }
  return response.json()
}

async function updateWorkspace({
  id,
  data,
}: {
  id: string
  data: UpdateWorkspaceInput
}): Promise<Workspace> {
  const response = await fetch(`/api/workspaces/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '워크스페이스 수정에 실패했습니다')
  }
  return response.json()
}

async function deleteWorkspace(id: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '워크스페이스 삭제에 실패했습니다')
  }
}

export function useWorkspaces() {
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()

  const query = useQuery({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
  })

  // 워크스페이스가 없으면 첫 번째 워크스페이스 자동 선택
  useEffect(() => {
    if (!currentWorkspace && query.data && query.data.length > 0) {
      setCurrentWorkspace(query.data[0])
    }
  }, [currentWorkspace, query.data, setCurrentWorkspace])

  return {
    workspaces: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    currentWorkspace,
    setCurrentWorkspace,
  }
}

export function useWorkspace(id: string | undefined) {
  return useQuery({
    queryKey: ['workspaces', id],
    queryFn: () => fetchWorkspace(id!),
    enabled: !!id,
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  const { setCurrentWorkspace } = useWorkspaceStore()

  return useMutation({
    mutationFn: createWorkspace,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      // 새로 만든 워크스페이스를 현재 워크스페이스로 설정
      setCurrentWorkspace(data)
    },
  })
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient()
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()

  return useMutation({
    mutationFn: updateWorkspace,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      queryClient.setQueryData(['workspaces', data.id], data)
      // 현재 워크스페이스가 수정된 경우 업데이트
      if (currentWorkspace?.id === data.id) {
        setCurrentWorkspace(data)
      }
    },
  })
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()

  return useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      // 현재 워크스페이스가 삭제된 경우 초기화
      if (currentWorkspace?.id === deletedId) {
        setCurrentWorkspace(null)
      }
    },
  })
}
