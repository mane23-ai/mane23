import { createClient } from '@/lib/supabase/server'
import { createProjectSchema } from '@/lib/validations/project'
import { NextResponse } from 'next/server'
import type { Insertable } from '@/types/database'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // URL 파라미터에서 workspace_id 추출
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspace_id')
    const status = searchParams.get('status')

    // 프로젝트 목록 조회
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('프로젝트 목록 조회 오류:', error)
      return NextResponse.json({ error: '프로젝트 목록을 불러오는데 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('프로젝트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 요청 본문 파싱
    const body = await request.json()

    // 유효성 검사
    const validationResult = createProjectSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력값이 유효하지 않습니다', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const projectData = validationResult.data

    // 워크스페이스 소유권 확인
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', projectData.workspace_id)
      .eq('owner_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: '워크스페이스에 대한 권한이 없습니다' }, { status: 403 })
    }

    // 프로젝트 생성
    const insertData: Insertable<'projects'> = {
      workspace_id: projectData.workspace_id,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      github_repo_url: projectData.github_repo_url || null,
      client_info: projectData.client_info || {},
      budget: projectData.budget || {},
      metadata: {},
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(insertData as never)
      .select()
      .single()

    if (error) {
      console.error('프로젝트 생성 오류:', error)
      return NextResponse.json({ error: '프로젝트 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('프로젝트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
