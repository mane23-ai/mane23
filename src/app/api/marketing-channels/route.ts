import { createClient } from '@/lib/supabase/server'
import { createMarketingChannelSchema } from '@/lib/validations/marketing'
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
    const isActive = searchParams.get('is_active')
    const channelType = searchParams.get('channel_type')

    let query = supabase
      .from('marketing_channels')
      .select('*')
      .order('created_at', { ascending: false })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (channelType) {
      query = query.eq('channel_type', channelType)
    }

    const { data, error } = await query

    if (error) {
      console.error('마케팅 채널 목록 조회 오류:', error)
      return NextResponse.json({ error: '마케팅 채널 목록을 불러오는데 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('마케팅 채널 API 오류:', error)
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

    const validationResult = createMarketingChannelSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '입력값이 유효하지 않습니다', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const channelData = validationResult.data

    // 워크스페이스 소유권 확인
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', channelData.workspace_id)
      .eq('owner_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: '워크스페이스에 대한 권한이 없습니다' }, { status: 403 })
    }

    const insertData: Insertable<'marketing_channels'> = {
      workspace_id: channelData.workspace_id,
      channel_type: channelData.channel_type,
      channel_name: channelData.channel_name,
      credentials: channelData.credentials || {},
      settings: channelData.settings || {},
      is_active: channelData.is_active ?? true,
    }

    const { data, error } = await supabase
      .from('marketing_channels')
      .insert(insertData as never)
      .select()
      .single()

    if (error) {
      console.error('마케팅 채널 생성 오류:', error)
      return NextResponse.json({ error: '마케팅 채널 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('마케팅 채널 API 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
