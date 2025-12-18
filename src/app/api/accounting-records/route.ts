import { createClient } from '@/lib/supabase/server'
import { createAccountingRecordSchema } from '@/lib/validations/accounting'
import { NextResponse } from 'next/server'
import type { Insertable } from '@/types/database'

export async function GET(request: Request) {
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
    const projectId = searchParams.get('project_id')
    const recordType = searchParams.get('record_type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let query = supabase
      .from('accounting_records')
      .select('*')
      .order('recorded_date', { ascending: false })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (recordType) {
      query = query.eq('record_type', recordType)
    }

    if (startDate) {
      query = query.gte('recorded_date', startDate)
    }

    if (endDate) {
      query = query.lte('recorded_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('회계 기록 목록 조회 오류:', error)
      return NextResponse.json({ error: '회계 기록 목록을 불러오는데 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('회계 기록 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()

    const validationResult = createAccountingRecordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력값이 유효하지 않습니다', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const recordData = validationResult.data

    // 워크스페이스 소유권 확인
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', recordData.workspace_id)
      .eq('owner_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: '워크스페이스에 대한 권한이 없습니다' }, { status: 403 })
    }

    const insertData: Insertable<'accounting_records'> = {
      workspace_id: recordData.workspace_id,
      project_id: recordData.project_id,
      record_type: recordData.record_type,
      amount: recordData.amount,
      description: recordData.description,
      category: recordData.category,
      tax_info: recordData.tax_info || {},
      receipt_path: recordData.receipt_path,
      recorded_date: recordData.recorded_date,
    }

    const { data, error } = await supabase
      .from('accounting_records')
      .insert(insertData as never)
      .select()
      .single()

    if (error) {
      console.error('회계 기록 생성 오류:', error)
      return NextResponse.json({ error: '회계 기록 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('회계 기록 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
