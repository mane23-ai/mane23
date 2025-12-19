// AI 관련 타입 정의

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AICompletionOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

export interface AICompletionResponse {
  content: string
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
  }
  stopReason: string
}

// 바이브 코딩 관련 타입
export interface VibeCommand {
  id: string
  sessionId: string
  userInput: string
  aiInterpretation: AIInterpretation | null
  cliCommands: string[] | null
  executionResult: ExecutionResult | null
  codeChanges: CodeChange[] | null
  status: 'pending' | 'executing' | 'completed' | 'failed'
  createdAt: string
}

export interface AIInterpretation {
  intent: string
  confidence: number
  suggestedActions: string[]
  reasoning: string
}

export interface ExecutionResult {
  success: boolean
  output: string
  error?: string
  duration: number
}

export interface CodeChange {
  file: string
  action: 'create' | 'modify' | 'delete'
  diff?: string
  content?: string
}

// 콘텐츠 검증 관련 타입
export interface ContentVerification {
  isVerified: boolean
  score: number
  issues: VerificationIssue[]
  suggestions: string[]
  verifiedAt: string
}

export interface VerificationIssue {
  type: 'accuracy' | 'grammar' | 'style' | 'plagiarism' | 'factual'
  severity: 'low' | 'medium' | 'high'
  message: string
  location?: {
    start: number
    end: number
  }
}

// AI 결정 로그 타입
export interface AIDecisionLog {
  id: string
  workspaceId: string
  relatedEntityType: string | null
  relatedEntityId: string | null
  decisionType: string | null
  inputData: Record<string, unknown> | null
  outputData: Record<string, unknown> | null
  reasoning: string | null
  confidenceScore: number | null
  createdAt: string
}
