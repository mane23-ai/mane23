import { createClient } from '@/lib/supabase/server'
import type { AIDecisionLog } from './types'

interface LogDecisionParams {
  workspaceId: string
  relatedEntityType?: string
  relatedEntityId?: string
  decisionType: string
  inputData?: Record<string, unknown>
  outputData?: Record<string, unknown>
  reasoning?: string
  confidenceScore?: number
}

/**
 * AI 결정을 데이터베이스에 로깅
 */
export async function logAIDecision(
  params: LogDecisionParams
): Promise<AIDecisionLog | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_decision_logs')
      .insert({
        workspace_id: params.workspaceId,
        related_entity_type: params.relatedEntityType || null,
        related_entity_id: params.relatedEntityId || null,
        decision_type: params.decisionType,
        input_data: params.inputData || null,
        output_data: params.outputData || null,
        reasoning: params.reasoning || null,
        confidence_score: params.confidenceScore || null,
      } as never)
      .select()
      .single()

    if (error || !data) {
      console.error('AI decision log error:', error)
      return null
    }

    // 타입 단언
    const log = data as {
      id: string
      workspace_id: string
      related_entity_type: string | null
      related_entity_id: string | null
      decision_type: string
      input_data: Record<string, unknown> | null
      output_data: Record<string, unknown> | null
      reasoning: string | null
      confidence_score: number | null
      created_at: string
    }

    return {
      id: log.id,
      workspaceId: log.workspace_id,
      relatedEntityType: log.related_entity_type,
      relatedEntityId: log.related_entity_id,
      decisionType: log.decision_type,
      inputData: log.input_data,
      outputData: log.output_data,
      reasoning: log.reasoning,
      confidenceScore: log.confidence_score,
      createdAt: log.created_at,
    }
  } catch (error) {
    console.error('Failed to log AI decision:', error)
    return null
  }
}

/**
 * 특정 엔티티와 관련된 AI 결정 로그 조회
 */
export async function getDecisionLogs(
  workspaceId: string,
  options?: {
    entityType?: string
    entityId?: string
    decisionType?: string
    limit?: number
  }
): Promise<AIDecisionLog[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('ai_decision_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (options?.entityType) {
      query = query.eq('related_entity_type', options.entityType)
    }
    if (options?.entityId) {
      query = query.eq('related_entity_id', options.entityId)
    }
    if (options?.decisionType) {
      query = query.eq('decision_type', options.decisionType)
    }
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Decision logs fetch error:', error)
      return []
    }

    // 타입 단언
    type LogRecord = {
      id: string
      workspace_id: string
      related_entity_type: string | null
      related_entity_id: string | null
      decision_type: string
      input_data: Record<string, unknown> | null
      output_data: Record<string, unknown> | null
      reasoning: string | null
      confidence_score: number | null
      created_at: string
    }

    return ((data || []) as LogRecord[]).map((log) => ({
      id: log.id,
      workspaceId: log.workspace_id,
      relatedEntityType: log.related_entity_type,
      relatedEntityId: log.related_entity_id,
      decisionType: log.decision_type,
      inputData: log.input_data,
      outputData: log.output_data,
      reasoning: log.reasoning,
      confidenceScore: log.confidence_score,
      createdAt: log.created_at,
    }))
  } catch (error) {
    console.error('Failed to get decision logs:', error)
    return []
  }
}

/**
 * 결정 로그 통계 조회
 */
export async function getDecisionStats(workspaceId: string): Promise<{
  totalDecisions: number
  avgConfidence: number
  byType: Record<string, number>
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_decision_logs')
      .select('decision_type, confidence_score')
      .eq('workspace_id', workspaceId)

    if (error || !data) {
      return { totalDecisions: 0, avgConfidence: 0, byType: {} }
    }

    // 타입 단언
    const logs = data as { decision_type: string | null; confidence_score: number | null }[]

    const totalDecisions = logs.length
    const avgConfidence =
      logs.reduce((sum, log) => sum + (log.confidence_score || 0), 0) /
      (totalDecisions || 1)

    const byType = logs.reduce(
      (acc, log) => {
        const type = log.decision_type || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return { totalDecisions, avgConfidence, byType }
  } catch (error) {
    console.error('Failed to get decision stats:', error)
    return { totalDecisions: 0, avgConfidence: 0, byType: {} }
  }
}
