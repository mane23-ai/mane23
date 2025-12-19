import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createVibeCommandSchema } from '@/lib/validations/vibe'
import {
  generateCompletion,
  hasApiKey,
  VIBE_CODING_SYSTEM_PROMPT,
  createVibeCommandPrompt,
  logAIDecision,
} from '@/lib/ai'

// GET /api/vibe/commands - 바이브 명령어 목록 조회
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
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id가 필요합니다' },
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
      .eq('id', sessionId)
      .eq('projects.workspaces.owner_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('vibe_commands')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Vibe commands fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Vibe commands GET error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// POST /api/vibe/commands - 바이브 명령어 실행
export async function POST(request: NextRequest) {
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
    const validationResult = createVibeCommandSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      )
    }

    // 세션 및 프로젝트 정보 조회
    const { data: sessionData, error: sessionError } = await supabase
      .from('vibe_sessions')
      .select(`
        id,
        projects!inner (
          id,
          name,
          workspace_id,
          metadata,
          workspaces!inner (
            owner_id
          )
        )
      `)
      .eq('id', validationResult.data.session_id)
      .eq('projects.workspaces.owner_id', user.id)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 })
    }

    // 타입 단언
    const session = sessionData as {
      id: string
      projects: {
        id: string
        name: string
        workspace_id: string
        metadata: Record<string, unknown>
      }
    }

    // 명령어 레코드 생성 (pending 상태)
    const { data: commandData, error: insertError } = await supabase
      .from('vibe_commands')
      .insert({
        session_id: validationResult.data.session_id,
        user_input: validationResult.data.user_input,
        status: 'pending' as const,
      } as never)
      .select()
      .single()

    if (insertError || !commandData) {
      console.error('Vibe command insert error:', insertError)
      return NextResponse.json({ error: insertError?.message || '명령어 생성 실패' }, { status: 500 })
    }

    // 타입 단언으로 command 객체 정의
    const command = commandData as { id: string; session_id: string; user_input: string; status: string }

    // AI 처리 (API 키가 있는 경우에만)
    if (hasApiKey()) {
      try {
        // 상태를 executing으로 업데이트
        await supabase
          .from('vibe_commands')
          .update({ status: 'executing' } as never)
          .eq('id', command.id)

        const project = session.projects
        const projectContext = {
          name: project.name,
          techStack: (project.metadata as { techStack?: string[] })?.techStack,
        }

        const prompt = createVibeCommandPrompt(
          validationResult.data.user_input,
          projectContext
        )

        const response = await generateCompletion(
          [{ role: 'user', content: prompt }],
          {
            systemPrompt: VIBE_CODING_SYSTEM_PROMPT,
            temperature: 0.3,
          }
        )

        // AI 응답 파싱
        let aiInterpretation = null
        let cliCommands = null
        let codeChanges = null

        try {
          const parsed = JSON.parse(response.content)
          aiInterpretation = {
            intent: parsed.intent,
            confidence: parsed.confidence,
            suggestedActions: parsed.suggestedActions,
            reasoning: parsed.reasoning,
          }
          cliCommands = parsed.cliCommands
          codeChanges = parsed.codeChanges
        } catch {
          // JSON 파싱 실패 시 텍스트로 저장
          aiInterpretation = {
            intent: 'parse_error',
            confidence: 0,
            suggestedActions: [],
            reasoning: response.content,
          }
        }

        // AI 결정 로깅
        await logAIDecision({
          workspaceId: project.workspace_id,
          relatedEntityType: 'vibe_command',
          relatedEntityId: command.id,
          decisionType: 'vibe_interpretation',
          inputData: { userInput: validationResult.data.user_input },
          outputData: { aiInterpretation, cliCommands, codeChanges },
          reasoning: aiInterpretation?.reasoning,
          confidenceScore: aiInterpretation?.confidence,
        })

        // 명령어 레코드 업데이트
        const { data: updatedCommand, error: updateError } = await supabase
          .from('vibe_commands')
          .update({
            ai_interpretation: aiInterpretation,
            cli_commands: cliCommands,
            code_changes: codeChanges,
            status: 'completed',
          } as never)
          .eq('id', command.id)
          .select()
          .single()

        if (updateError) {
          console.error('Vibe command update error:', updateError)
        }

        return NextResponse.json(updatedCommand || command, { status: 201 })
      } catch (aiError) {
        console.error('AI processing error:', aiError)
        // AI 처리 실패 시 failed 상태로 업데이트
        await supabase
          .from('vibe_commands')
          .update({
            status: 'failed',
            execution_result: {
              success: false,
              error: aiError instanceof Error ? aiError.message : 'AI 처리 실패',
            },
          } as never)
          .eq('id', command.id)
      }
    }

    // API 키가 없는 경우 시뮬레이션 응답
    const simulatedResponse = {
      ai_interpretation: {
        intent: '시뮬레이션 모드',
        confidence: 0,
        suggestedActions: ['API 키를 설정하면 실제 AI 분석이 가능합니다'],
        reasoning: 'ANTHROPIC_API_KEY가 설정되지 않아 시뮬레이션 모드로 동작합니다',
      },
      cli_commands: null,
      code_changes: null,
      status: 'completed' as const,
    }

    const { data: updatedCommand } = await supabase
      .from('vibe_commands')
      .update(simulatedResponse as never)
      .eq('id', command.id)
      .select()
      .single()

    return NextResponse.json(updatedCommand || command, { status: 201 })
  } catch (error) {
    console.error('Vibe commands POST error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
