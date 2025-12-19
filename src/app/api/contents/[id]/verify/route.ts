import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateCompletion,
  hasApiKey,
  CONTENT_VERIFICATION_SYSTEM_PROMPT,
  createContentVerificationPrompt,
  logAIDecision,
} from '@/lib/ai'
import type { ContentVerification, VerificationIssue } from '@/lib/ai/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/contents/[id]/verify - 콘텐츠 검증
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // 콘텐츠 조회 및 소유권 확인
    const { data: contentData, error: contentError } = await supabase
      .from('contents')
      .select(`
        *,
        workspaces!inner (
          owner_id
        )
      `)
      .eq('id', id)
      .eq('workspaces.owner_id', user.id)
      .single()

    if (contentError || !contentData) {
      return NextResponse.json(
        { error: '콘텐츠를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 타입 단언
    const content = contentData as {
      id: string
      workspace_id: string
      body: string | null
      content_type: string | null
    }

    if (!content.body || content.body.trim().length === 0) {
      return NextResponse.json(
        { error: '검증할 콘텐츠 내용이 없습니다' },
        { status: 400 }
      )
    }

    let verification: ContentVerification

    // AI 검증 (API 키가 있는 경우)
    if (hasApiKey()) {
      try {
        const prompt = createContentVerificationPrompt(
          content.body,
          content.content_type || undefined
        )

        const response = await generateCompletion(
          [{ role: 'user', content: prompt }],
          {
            systemPrompt: CONTENT_VERIFICATION_SYSTEM_PROMPT,
            temperature: 0.2,
          }
        )

        // AI 응답 파싱
        try {
          const parsed = JSON.parse(response.content)
          verification = {
            isVerified: parsed.isVerified ?? false,
            score: parsed.score ?? 0,
            issues: (parsed.issues || []).map((issue: VerificationIssue) => ({
              type: issue.type || 'accuracy',
              severity: issue.severity || 'low',
              message: issue.message || '',
              location: issue.location,
            })),
            suggestions: parsed.suggestions || [],
            verifiedAt: new Date().toISOString(),
          }
        } catch {
          // JSON 파싱 실패 시 기본 검증 결과
          verification = {
            isVerified: false,
            score: 0,
            issues: [
              {
                type: 'accuracy',
                severity: 'medium',
                message: 'AI 검증 결과를 파싱할 수 없습니다',
              },
            ],
            suggestions: [response.content],
            verifiedAt: new Date().toISOString(),
          }
        }

        // AI 결정 로깅
        await logAIDecision({
          workspaceId: content.workspace_id,
          relatedEntityType: 'content',
          relatedEntityId: content.id,
          decisionType: 'content_verification',
          inputData: {
            contentId: content.id,
            contentType: content.content_type,
            bodyLength: content.body.length,
          },
          outputData: verification as unknown as Record<string, unknown>,
          confidenceScore: verification.score / 100,
        })
      } catch (aiError) {
        console.error('AI verification error:', aiError)
        verification = createSimulatedVerification(content.body)
      }
    } else {
      // API 키가 없는 경우 시뮬레이션
      verification = createSimulatedVerification(content.body)
    }

    // 콘텐츠 verification 필드 업데이트
    const { data: updatedContent, error: updateError } = await supabase
      .from('contents')
      .update({
        verification: verification as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Content update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      content: updatedContent,
      verification,
    })
  } catch (error) {
    console.error('Content verify POST error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 시뮬레이션 검증 결과 생성
function createSimulatedVerification(body: string): ContentVerification {
  const issues: VerificationIssue[] = []
  let score = 100

  // 간단한 규칙 기반 검증
  if (body.length < 100) {
    issues.push({
      type: 'style',
      severity: 'low',
      message: '콘텐츠가 너무 짧습니다. 더 자세한 내용을 추가해주세요.',
    })
    score -= 10
  }

  if (body.length > 10000) {
    issues.push({
      type: 'style',
      severity: 'low',
      message: '콘텐츠가 매우 깁니다. 섹션을 나누는 것을 고려해주세요.',
    })
    score -= 5
  }

  // 특수문자 과다 사용 체크
  const specialCharRatio = (body.match(/[!?]{2,}/g) || []).length
  if (specialCharRatio > 3) {
    issues.push({
      type: 'style',
      severity: 'low',
      message: '특수문자를 과다하게 사용하고 있습니다.',
    })
    score -= 5
  }

  // 맞춤법 체크 시뮬레이션 (한글 기준)
  const commonErrors = ['됬', '되요', '됄', '되서']
  for (const error of commonErrors) {
    if (body.includes(error)) {
      issues.push({
        type: 'grammar',
        severity: 'medium',
        message: `맞춤법 오류: "${error}"를 확인해주세요.`,
      })
      score -= 10
    }
  }

  return {
    isVerified: score >= 70,
    score: Math.max(0, score),
    issues,
    suggestions: issues.length > 0
      ? ['발견된 문제를 수정하면 콘텐츠 품질이 향상됩니다.']
      : ['콘텐츠 품질이 좋습니다!'],
    verifiedAt: new Date().toISOString(),
  }
}
