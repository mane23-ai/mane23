import { createClient } from '@/lib/supabase/server'
import { createContentSchema } from '@/lib/validations/content'
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
    const status = searchParams.get('status')
    const contentType = searchParams.get('content_type')

    let query = supabase
      .from('contents')
      .select('*')
      .order('created_at', { ascending: false })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data, error } = await query

    if (error) {
      console.error('콘텐츠 목록 조회 오류:', error)
      return NextResponse.json({ error: '콘텐츠 목록을 불러오는데 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('콘텐츠 API 오류:', error)
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

    const validationResult = createContentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력값이 유효하지 않습니다', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const contentData = validationResult.data

    // 워크스페이스 소유권 확인
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', contentData.workspace_id)
      .eq('owner_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: '워크스페이스에 대한 권한이 없습니다' }, { status: 403 })
    }

    const insertData: Insertable<'contents'> = {
      workspace_id: contentData.workspace_id,
      topic_id: contentData.topic_id,
      title: contentData.title,
      body: contentData.body,
      content_type: contentData.content_type,
      purpose_tags: contentData.purpose_tags,
      status: contentData.status,
      verification: contentData.verification || {},
      published_channels: {},
      metadata: {},
    }

    const { data, error } = await supabase
      .from('contents')
      .insert(insertData as never)
      .select()
      .single()

    if (error) {
      console.error('콘텐츠 생성 오류:', error)
      return NextResponse.json({ error: '콘텐츠 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('콘텐츠 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
