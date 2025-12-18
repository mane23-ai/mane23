'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Tables } from '@/types/database'
import type { CreateDocumentInput, UpdateDocumentInput } from '@/lib/validations/document'

type Document = Tables<'documents'>

interface DocumentsQueryParams {
  workspaceId?: string
  projectId?: string
  sourceType?: Document['source_type']
}

async function fetchDocuments(params: DocumentsQueryParams = {}): Promise<Document[]> {
  const searchParams = new URLSearchParams()
  if (params.workspaceId) searchParams.set('workspace_id', params.workspaceId)
  if (params.projectId) searchParams.set('project_id', params.projectId)
  if (params.sourceType) searchParams.set('source_type', params.sourceType)

  const url = `/api/documents${searchParams.toString() ? `?${searchParams}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '문서 목록을 불러오는데 실패했습니다')
  }

  return response.json()
}

async function fetchDocument(id: string): Promise<Document> {
  const response = await fetch(`/api/documents/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '문서를 불러오는데 실패했습니다')
  }

  return response.json()
}

async function createDocument(data: CreateDocumentInput): Promise<Document> {
  const response = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '문서 생성에 실패했습니다')
  }

  return response.json()
}

async function updateDocument({
  id,
  data,
}: {
  id: string
  data: UpdateDocumentInput
}): Promise<Document> {
  const response = await fetch(`/api/documents/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '문서 수정에 실패했습니다')
  }

  return response.json()
}

async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`/api/documents/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '문서 삭제에 실패했습니다')
  }
}

export function useDocuments(params: DocumentsQueryParams = {}) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => fetchDocuments(params),
    enabled: !!params.workspaceId,
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => fetchDocument(id),
    enabled: !!id,
  })
}

export function useCreateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateDocument,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.setQueryData(['documents', data.id], data)
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
