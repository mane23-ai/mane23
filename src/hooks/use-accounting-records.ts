'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Tables } from '@/types/database'
import type {
  CreateAccountingRecordInput,
  UpdateAccountingRecordInput,
} from '@/lib/validations/accounting'

type AccountingRecord = Tables<'accounting_records'>

interface AccountingRecordsQueryParams {
  workspaceId?: string
  projectId?: string
  recordType?: 'income' | 'expense'
  startDate?: string
  endDate?: string
}

async function fetchAccountingRecords(
  params: AccountingRecordsQueryParams
): Promise<AccountingRecord[]> {
  const searchParams = new URLSearchParams()
  if (params.workspaceId) searchParams.set('workspace_id', params.workspaceId)
  if (params.projectId) searchParams.set('project_id', params.projectId)
  if (params.recordType) searchParams.set('record_type', params.recordType)
  if (params.startDate) searchParams.set('start_date', params.startDate)
  if (params.endDate) searchParams.set('end_date', params.endDate)

  const response = await fetch(`/api/accounting-records?${searchParams.toString()}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '회계 기록 목록을 불러오는데 실패했습니다')
  }
  return response.json()
}

async function fetchAccountingRecord(id: string): Promise<AccountingRecord> {
  const response = await fetch(`/api/accounting-records/${id}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '회계 기록을 불러오는데 실패했습니다')
  }
  return response.json()
}

async function createAccountingRecord(
  data: CreateAccountingRecordInput
): Promise<AccountingRecord> {
  const response = await fetch('/api/accounting-records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '회계 기록 생성에 실패했습니다')
  }
  return response.json()
}

async function updateAccountingRecord({
  id,
  data,
}: {
  id: string
  data: UpdateAccountingRecordInput
}): Promise<AccountingRecord> {
  const response = await fetch(`/api/accounting-records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '회계 기록 수정에 실패했습니다')
  }
  return response.json()
}

async function deleteAccountingRecord(id: string): Promise<void> {
  const response = await fetch(`/api/accounting-records/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '회계 기록 삭제에 실패했습니다')
  }
}

export function useAccountingRecords(params: AccountingRecordsQueryParams = {}) {
  return useQuery({
    queryKey: ['accounting-records', params],
    queryFn: () => fetchAccountingRecords(params),
    enabled: !!params.workspaceId,
  })
}

export function useAccountingRecord(id: string | undefined) {
  return useQuery({
    queryKey: ['accounting-records', id],
    queryFn: () => fetchAccountingRecord(id!),
    enabled: !!id,
  })
}

export function useCreateAccountingRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAccountingRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-records'] })
    },
  })
}

export function useUpdateAccountingRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAccountingRecord,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accounting-records'] })
      queryClient.setQueryData(['accounting-records', data.id], data)
    },
  })
}

export function useDeleteAccountingRecord() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAccountingRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-records'] })
    },
  })
}

// 합계 계산 유틸리티 훅
export function useAccountingSummary(params: AccountingRecordsQueryParams = {}) {
  const { data: records, ...rest } = useAccountingRecords(params)

  const summary = records?.reduce(
    (acc, record) => {
      if (record.record_type === 'income') {
        acc.totalIncome += record.amount
      } else {
        acc.totalExpense += record.amount
      }
      return acc
    },
    { totalIncome: 0, totalExpense: 0, balance: 0 }
  )

  if (summary) {
    summary.balance = summary.totalIncome - summary.totalExpense
  }

  return {
    ...rest,
    data: records,
    summary: summary || { totalIncome: 0, totalExpense: 0, balance: 0 },
  }
}
