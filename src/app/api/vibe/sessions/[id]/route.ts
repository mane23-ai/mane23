import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateVibeSessionSchema } from '@/lib/validations/vibe'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/vibe/sessions/[id] - 바이브 세션 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('vibe_sessions')
      .select(`
        *,
        projects!inner (
          id,
          name,
          workspace_id,
          workspaces!inner (
            owner_id
          )
        ),
        vibe_commands (
          *
        )
      `)
      .eq('id', id)
      .eq('projects.workspaces.owner_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 })
      }
      console.error('Vibe session fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Vibe session GET error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// PUT /api/vibe/sessions/[id] - 바이브 세션 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = updateVibeSessionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    // 세션 소유권 확인
    const { data: session, error: sessionError } = await supabase
      .from('vibe_sessions')
      .select(`
        id,
        projects!inner (
          workspaces!inner (
            owner_id
          )
        )
      `)
      .eq('id', id)
      .eq('projects.workspaces.owner_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('vibe_sessions')
      .update(validationResult.data as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Vibe session update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Vibe session PUT error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// DELETE /api/vibe/sessions/[id] - 바이브 세션 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 세션 소유권 확인
    const { data: session, error: sessionError } = await supabase
      .from('vibe_sessions')
      .select(`
        id,
        projects!inner (
          workspaces!inner (
            owner_id
          )
        )
      `)
      .eq('id', id)
      .eq('projects.workspaces.owner_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 })
    }

    const { error } = await supabase.from('vibe_sessions').delete().eq('id', id)

    if (error) {
      console.error('Vibe session delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Vibe session DELETE error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
