'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Tables, Insertable, Updatable } from '@/types/database'
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project'

type Project = Tables<'projects'>

interface ProjectsQueryParams {
  workspaceId?: string
  status?: Project['status']
}

// 프로젝트 목록 조회
async function fetchProjects(params: ProjectsQueryParams = {}): Promise<Project[]> {
  const searchParams = new URLSearchParams()
  if (params.workspaceId) searchParams.set('workspace_id', params.workspaceId)
  if (params.status) searchParams.set('status', params.status)

  const url = `/api/projects${searchParams.toString() ? `?${searchParams}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '프로젝트 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

// 단일 프로젝트 조회
async function fetchProject(id: string): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '프로젝트를 불러오는데 실패했습니다')
  }

  return response.json()
}

// 프로젝트 생성
async function createProject(data: CreateProjectInput): Promise<Project> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '프로젝트 생성에 실패했습니다')
  }

  return response.json()
}

// 프로젝트 수정
async function updateProject({
  id,
  data,
}: {
  id: string
  data: UpdateProjectInput
}): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '프로젝트 수정에 실패했습니다')
  }

  return response.json()
}

// 프로젝트 삭제
async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '프로젝트 삭제에 실패했습니다')
  }
}

// 프로젝트 목록 훅
export function useProjects(params: ProjectsQueryParams = {}) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => fetchProjects(params),
  })
}

// 단일 프로젝트 훅
export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
  })
}

// 프로젝트 생성 훅
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// 프로젝트 수정 훅
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.setQueryData(['projects', data.id], data)
    },
  })
}

// 프로젝트 삭제 훅
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
