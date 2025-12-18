'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/stores/workspace-store'
import type { Tables } from '@/types/database'

type Workspace = Tables<'workspaces'>

async function fetchWorkspaces(): Promise<Workspace[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('워크스페이스 목록 조회 오류:', error)
    throw error
  }

  return data || []
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
