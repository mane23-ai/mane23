'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Tables } from '@/types/database'
import type { CreateVibeSessionInput, CreateVibeCommandInput } from '@/lib/validations/vibe'

type VibeSession = Tables<'vibe_sessions'>
type VibeCommand = Tables<'vibe_commands'>

interface VibeSessionWithCommands extends VibeSession {
  vibe_commands?: VibeCommand[]
  projects?: {
    id: string
    name: string
    workspace_id: string
  }
}

// 세션 목록 조회
async function fetchVibeSessions(projectId?: string): Promise<VibeSessionWithCommands[]> {
  const params = new URLSearchParams()
  if (projectId) params.set('project_id', projectId)

  const response = await fetch(`/api/vibe/sessions?${params.toString()}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '세션 목록을 불러오는데 실패했습니다')
  }
  return response.json()
}

// 세션 상세 조회
async function fetchVibeSession(id: string): Promise<VibeSessionWithCommands> {
  const response = await fetch(`/api/vibe/sessions/${id}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '세션을 불러오는데 실패했습니다')
  }
  return response.json()
}

// 세션 생성
async function createVibeSession(data: CreateVibeSessionInput): Promise<VibeSession> {
  const response = await fetch('/api/vibe/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '세션 생성에 실패했습니다')
  }
  return response.json()
}

// 세션 종료
async function completeVibeSession(id: string): Promise<VibeSession> {
  const response = await fetch(`/api/vibe/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '세션 종료에 실패했습니다')
  }
  return response.json()
}

// 세션 삭제
async function deleteVibeSession(id: string): Promise<void> {
  const response = await fetch(`/api/vibe/sessions/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '세션 삭제에 실패했습니다')
  }
}

// 명령어 목록 조회
async function fetchVibeCommands(sessionId: string): Promise<VibeCommand[]> {
  const response = await fetch(`/api/vibe/commands?session_id=${sessionId}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '명령어 목록을 불러오는데 실패했습니다')
  }
  return response.json()
}

// 명령어 실행
async function executeVibeCommand(data: CreateVibeCommandInput): Promise<VibeCommand> {
  const response = await fetch('/api/vibe/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '명령어 실행에 실패했습니다')
  }
  return response.json()
}

// 세션 목록 훅
export function useVibeSessions(projectId?: string) {
  return useQuery({
    queryKey: ['vibe-sessions', projectId],
    queryFn: () => fetchVibeSessions(projectId),
    enabled: !!projectId,
  })
}

// 세션 상세 훅
export function useVibeSession(id: string | undefined) {
  return useQuery({
    queryKey: ['vibe-sessions', id],
    queryFn: () => fetchVibeSession(id!),
    enabled: !!id,
  })
}

// 세션 생성 훅
export function useCreateVibeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createVibeSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vibe-sessions'] })
      queryClient.setQueryData(['vibe-sessions', data.id], data)
    },
  })
}

// 세션 종료 훅
export function useCompleteVibeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: completeVibeSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vibe-sessions'] })
      queryClient.setQueryData(['vibe-sessions', data.id], data)
    },
  })
}

// 세션 삭제 훅
export function useDeleteVibeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteVibeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vibe-sessions'] })
    },
  })
}

// 명령어 목록 훅
export function useVibeCommands(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['vibe-commands', sessionId],
    queryFn: () => fetchVibeCommands(sessionId!),
    enabled: !!sessionId,
  })
}

// 명령어 실행 훅
export function useExecuteVibeCommand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: executeVibeCommand,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['vibe-commands', data.session_id],
      })
      queryClient.invalidateQueries({
        queryKey: ['vibe-sessions', data.session_id],
      })
    },
  })
}
