import { createClient } from '@/lib/supabase/server'
import { createDocumentSchema } from '@/lib/validations/document'
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
    const sourceType = searchParams.get('source_type')

    let query = supabase.from('documents').select('*').order('created_at', { ascending: false })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (sourceType) {
      query = query.eq('source_type', sourceType)
    }

    const { data, error } = await query

    if (error) {
      console.error('문서 목록 조회 오류:', error)
      return NextResponse.json({ error: '문서 목록을 불러오는데 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('문서 API 오류:', error)
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

    const validationResult = createDocumentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력값이 유효하지 않습니다', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const documentData = validationResult.data

    // 워크스페이스 소유권 확인
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', documentData.workspace_id)
      .eq('owner_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: '워크스페이스에 대한 권한이 없습니다' }, { status: 403 })
    }

    const insertData: Insertable<'documents'> = {
      workspace_id: documentData.workspace_id,
      project_id: documentData.project_id,
      title: documentData.title,
      content: documentData.content,
      source_type: documentData.source_type,
      source_url: documentData.source_url,
      source_author: documentData.source_author,
      collected_at: documentData.collected_at,
      summary: documentData.summary || {},
      file_path: documentData.file_path,
      metadata: {},
    }

    const { data, error } = await supabase
      .from('documents')
      .insert(insertData as never)
      .select()
      .single()

    if (error) {
      console.error('문서 생성 오류:', error)
      return NextResponse.json({ error: '문서 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('문서 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
