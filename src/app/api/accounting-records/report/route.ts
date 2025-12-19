import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/accounting-records/report - 회계 리포트 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const format = searchParams.get('format') || 'json' // json, csv

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id가 필요합니다' },
        { status: 400 }
      )
    }

    // 워크스페이스 소유권 확인
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: '워크스페이스를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 회계 기록 조회
    let query = supabase
      .from('accounting_records')
      .select(`
        *,
        projects (
          id,
          name
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('recorded_date', { ascending: false })

    if (startDate) {
      query = query.gte('recorded_date', startDate)
    }
    if (endDate) {
      query = query.lte('recorded_date', endDate)
    }

    const { data: records, error: recordsError } = await query

    if (recordsError) {
      console.error('Accounting records fetch error:', recordsError)
      return NextResponse.json({ error: recordsError.message }, { status: 500 })
    }

    // 통계 계산
    const summary = calculateSummary(records || [])

    // 월별 집계
    const monthlyData = calculateMonthlyData(records || [])

    // 카테고리별 집계
    const categoryData = calculateCategoryData(records || [])

    // 프로젝트별 집계
    const projectData = calculateProjectData(records || [])

    const report = {
      period: {
        start: startDate || 'all',
        end: endDate || 'all',
      },
      summary,
      monthlyData,
      categoryData,
      projectData,
      records: records || [],
      generatedAt: new Date().toISOString(),
    }

    // CSV 형식 요청 시
    if (format === 'csv') {
      const csv = generateCSV(records || [])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="accounting-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Accounting report GET error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

interface AccountingRecord {
  id: string
  record_type: 'income' | 'expense'
  amount: number
  description: string | null
  category: string | null
  recorded_date: string
  projects?: { id: string; name: string } | null
}

function calculateSummary(records: AccountingRecord[]) {
  const totalIncome = records
    .filter((r) => r.record_type === 'income')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalExpense = records
    .filter((r) => r.record_type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0)

  const balance = totalIncome - totalExpense

  const incomeCount = records.filter((r) => r.record_type === 'income').length
  const expenseCount = records.filter((r) => r.record_type === 'expense').length

  return {
    totalIncome,
    totalExpense,
    balance,
    incomeCount,
    expenseCount,
    totalRecords: records.length,
  }
}

function calculateMonthlyData(records: AccountingRecord[]) {
  const monthlyMap = new Map<string, { income: number; expense: number }>()

  for (const record of records) {
    const month = record.recorded_date.substring(0, 7) // YYYY-MM
    const current = monthlyMap.get(month) || { income: 0, expense: 0 }

    if (record.record_type === 'income') {
      current.income += record.amount
    } else {
      current.expense += record.amount
    }

    monthlyMap.set(month, current)
  }

  return Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      ...data,
      balance: data.income - data.expense,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

function calculateCategoryData(records: AccountingRecord[]) {
  const categoryMap = new Map<string, { income: number; expense: number; count: number }>()

  for (const record of records) {
    const category = record.category || '미분류'
    const current = categoryMap.get(category) || { income: 0, expense: 0, count: 0 }

    if (record.record_type === 'income') {
      current.income += record.amount
    } else {
      current.expense += record.amount
    }
    current.count++

    categoryMap.set(category, current)
  }

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      ...data,
    }))
    .sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
}

function calculateProjectData(records: AccountingRecord[]) {
  const projectMap = new Map<string, { name: string; income: number; expense: number; count: number }>()

  for (const record of records) {
    const projectId = record.projects?.id || 'none'
    const projectName = record.projects?.name || '프로젝트 미지정'
    const current = projectMap.get(projectId) || { name: projectName, income: 0, expense: 0, count: 0 }

    if (record.record_type === 'income') {
      current.income += record.amount
    } else {
      current.expense += record.amount
    }
    current.count++

    projectMap.set(projectId, current)
  }

  return Array.from(projectMap.entries())
    .map(([projectId, data]) => ({
      projectId,
      ...data,
      profit: data.income - data.expense,
    }))
    .sort((a, b) => b.profit - a.profit)
}

function generateCSV(records: AccountingRecord[]): string {
  const BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const headers = ['날짜', '유형', '금액', '카테고리', '설명', '프로젝트']
  const rows = records.map((record) => [
    record.recorded_date,
    record.record_type === 'income' ? '수입' : '지출',
    record.amount.toString(),
    record.category || '',
    record.description || '',
    record.projects?.name || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  return BOM + csvContent
}
