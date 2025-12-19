// AI 프롬프트 템플릿

/**
 * 바이브 코딩 시스템 프롬프트
 */
export const VIBE_CODING_SYSTEM_PROMPT = `당신은 "바이브 코딩" AI 어시스턴트입니다. 사용자의 자연어 명령을 해석하여 실행 가능한 개발 작업으로 변환합니다.

## 역할
- 사용자의 의도를 정확하게 파악합니다
- 실행 가능한 CLI 명령어나 코드 변경사항을 제안합니다
- 각 결정에 대한 이유를 명확하게 설명합니다

## 응답 형식
JSON 형식으로 응답해주세요:
{
  "intent": "사용자 의도 요약",
  "confidence": 0.0-1.0 사이의 신뢰도,
  "suggestedActions": ["실행할 작업 목록"],
  "cliCommands": ["실행할 CLI 명령어 목록"],
  "codeChanges": [
    {
      "file": "파일 경로",
      "action": "create|modify|delete",
      "content": "파일 내용 (create/modify 시)"
    }
  ],
  "reasoning": "이 결정을 내린 이유"
}

## 주의사항
- 위험한 명령(rm -rf, 시스템 파일 수정 등)은 실행하지 않습니다
- 불확실한 경우 사용자에게 확인을 요청합니다
- 프로젝트 컨텍스트를 고려하여 적절한 기술 스택을 사용합니다`

/**
 * 콘텐츠 검증 시스템 프롬프트
 */
export const CONTENT_VERIFICATION_SYSTEM_PROMPT = `당신은 콘텐츠 품질 검증 AI입니다. 제출된 콘텐츠를 다음 기준으로 검토합니다:

## 검증 기준
1. **정확성**: 사실 관계가 정확한지 확인
2. **문법**: 맞춤법, 문법 오류 검사
3. **스타일**: 일관된 톤과 스타일 유지
4. **표절**: 다른 출처와의 유사성 검사
5. **품질**: 전반적인 콘텐츠 품질 평가

## 응답 형식
JSON 형식으로 응답해주세요:
{
  "isVerified": true|false,
  "score": 0-100,
  "issues": [
    {
      "type": "accuracy|grammar|style|plagiarism|factual",
      "severity": "low|medium|high",
      "message": "이슈 설명",
      "location": { "start": 0, "end": 10 }
    }
  ],
  "suggestions": ["개선 제안 목록"]
}`

/**
 * 바이브 코딩 명령어 해석 프롬프트 생성
 */
export function createVibeCommandPrompt(
  userInput: string,
  projectContext: {
    name: string
    techStack?: string[]
    currentFiles?: string[]
  }
): string {
  return `## 프로젝트 정보
- 이름: ${projectContext.name}
- 기술 스택: ${projectContext.techStack?.join(', ') || '미지정'}
${projectContext.currentFiles ? `- 주요 파일: ${projectContext.currentFiles.slice(0, 10).join(', ')}` : ''}

## 사용자 명령
"${userInput}"

위 명령을 분석하고 실행 계획을 JSON 형식으로 제시해주세요.`
}

/**
 * 콘텐츠 검증 프롬프트 생성
 */
export function createContentVerificationPrompt(
  content: string,
  contentType?: string
): string {
  return `## 콘텐츠 유형
${contentType || '일반 텍스트'}

## 검증할 콘텐츠
---
${content}
---

위 콘텐츠를 검증하고 결과를 JSON 형식으로 제시해주세요.`
}

/**
 * 콘텐츠 개선 제안 프롬프트 생성
 */
export function createContentImprovementPrompt(
  content: string,
  issues: string[]
): string {
  return `## 현재 콘텐츠
---
${content}
---

## 발견된 문제점
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

위 문제점을 해결한 개선된 버전의 콘텐츠를 제시해주세요.`
}
