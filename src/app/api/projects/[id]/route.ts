import { createClient } from '@/lib/supabase/server'
import { updateProjectSchema } from '@/lib/validations/project'
import { NextResponse } from 'next/server'
import type { Updatable } from '@/types/database'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 프로젝트 조회
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
      }
      console.error('프로젝트 조회 오류:', error)
      return NextResponse.json({ error: '프로젝트를 불러오는데 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('프로젝트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
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
    const validationResult = updateProjectSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력값이 유효하지 않습니다', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data
    const updateData: Updatable<'projects'> = {
      ...validatedData,
      github_repo_url: validatedData.github_repo_url || null,
    }

    // 프로젝트 수정
    const { data, error } = await supabase
      .from('projects')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
      }
      console.error('프로젝트 수정 오류:', error)
      return NextResponse.json({ error: '프로젝트 수정에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('프로젝트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 프로젝트 삭제
    const { error } = await supabase.from('projects').delete().eq('id', id)

    if (error) {
      console.error('프로젝트 삭제 오류:', error)
      return NextResponse.json({ error: '프로젝트 삭제에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ message: '프로젝트가 삭제되었습니다' })
  } catch (error) {
    console.error('프로젝트 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
