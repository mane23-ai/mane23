import { createClient } from '@/lib/supabase/server'
import { updateDocumentSchema } from '@/lib/validations/document'
import { NextResponse } from 'next/server'
import type { Updatable } from '@/types/database'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteParams) {
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

    const { data, error } = await supabase.from('documents').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '문서를 찾을 수 없습니다' }, { status: 404 })
      }
      console.error('문서 조회 오류:', error)
      return NextResponse.json({ error: '문서를 불러오는데 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('문서 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
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

    const validationResult = updateDocumentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력값이 유효하지 않습니다', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data
    const updateData: Updatable<'documents'> = validatedData

    const { data, error } = await supabase
      .from('documents')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: '문서를 찾을 수 없습니다' }, { status: 404 })
      }
      console.error('문서 수정 오류:', error)
      return NextResponse.json({ error: '문서 수정에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('문서 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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

    const { error } = await supabase.from('documents').delete().eq('id', id)

    if (error) {
      console.error('문서 삭제 오류:', error)
      return NextResponse.json({ error: '문서 삭제에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ message: '문서가 삭제되었습니다' })
  } catch (error) {
    console.error('문서 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
