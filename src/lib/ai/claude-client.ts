import Anthropic from '@anthropic-ai/sdk'
import type { AICompletionOptions, AICompletionResponse, AIMessage } from './types'

// Claude API 클라이언트 싱글톤
let anthropicClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

// 기본 설정
const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
const DEFAULT_MAX_TOKENS = 4096
const DEFAULT_TEMPERATURE = 0.7

/**
 * Claude API를 사용하여 텍스트 생성
 */
export async function generateCompletion(
  messages: AIMessage[],
  options: AICompletionOptions = {}
): Promise<AICompletionResponse> {
  const client = getClient()

  const {
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
    systemPrompt,
  } = options

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
  })

  const textContent = response.content.find((block) => block.type === 'text')
  const content = textContent && 'text' in textContent ? textContent.text : ''

  return {
    content,
    model: response.model,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    stopReason: response.stop_reason || 'unknown',
  }
}

/**
 * 단일 프롬프트로 빠르게 응답 생성
 */
export async function quickCompletion(
  prompt: string,
  options: AICompletionOptions = {}
): Promise<string> {
  const response = await generateCompletion(
    [{ role: 'user', content: prompt }],
    options
  )
  return response.content
}

/**
 * 스트리밍 응답 생성 (서버 사이드)
 */
export async function* streamCompletion(
  messages: AIMessage[],
  options: AICompletionOptions = {}
): AsyncGenerator<string> {
  const client = getClient()

  const {
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
    systemPrompt,
  } = options

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }
}

/**
 * API 키 유효성 검사
 */
export async function validateApiKey(): Promise<boolean> {
  try {
    const client = getClient()
    // 간단한 요청으로 API 키 확인
    await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    })
    return true
  } catch (error) {
    console.error('API key validation failed:', error)
    return false
  }
}

/**
 * 현재 API 키가 설정되어 있는지 확인
 */
export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}
