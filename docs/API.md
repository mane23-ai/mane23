# API 명세

## 개요

REST API + WebSocket 기반 API 구조.

- **Base URL**: `/api`
- **인증**: Bearer Token (Supabase Auth)
- **응답 형식**: JSON

## 인증

모든 API 요청은 Authorization 헤더에 Bearer 토큰 필요:

```
Authorization: Bearer <access_token>
```

## 공통 응답 형식

### 성공 응답

```json
{
  "success": true,
  "data": { ... }
}
```

### 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지"
  }
}
```

---

## 워크스페이스 API

### GET /api/workspaces

현재 사용자의 워크스페이스 목록 조회.

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Workspace",
      "settings": {},
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/workspaces/:id

특정 워크스페이스 조회.

### PATCH /api/workspaces/:id

워크스페이스 수정.

**Request Body**
```json
{
  "name": "New Name",
  "settings": {}
}
```

---

## 프로젝트 API

### GET /api/projects

프로젝트 목록 조회.

**Query Parameters**
- `workspace_id` (required): 워크스페이스 ID
- `status` (optional): 필터링할 상태
- `page` (optional): 페이지 번호
- `limit` (optional): 페이지당 항목 수

**Response**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Project Name",
        "description": "...",
        "status": "development",
        "github_repo_url": "https://github.com/...",
        "client_info": {},
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

### POST /api/projects

프로젝트 생성.

**Request Body**
```json
{
  "workspace_id": "uuid",
  "name": "New Project",
  "description": "프로젝트 설명",
  "client_info": {
    "name": "의뢰인 이름",
    "email": "client@example.com"
  },
  "github_repo_url": "https://github.com/..."
}
```

### GET /api/projects/:id

프로젝트 상세 조회.

### PATCH /api/projects/:id

프로젝트 수정.

**Request Body**
```json
{
  "name": "Updated Name",
  "status": "review"
}
```

### DELETE /api/projects/:id

프로젝트 삭제.

---

## 바이브 코딩 API

### WebSocket /api/vibe/ws

바이브 코딩 실시간 연결.

**연결**
```javascript
const ws = new WebSocket('wss://domain.com/api/vibe/ws');

// 인증
ws.send(JSON.stringify({
  type: 'auth',
  token: 'access_token',
  project_id: 'uuid'
}));
```

**메시지 타입**

1. **command** - 명령 전송
```json
{
  "type": "command",
  "session_id": "uuid",
  "input": "이 프로젝트에 로그인 기능 추가해줘"
}
```

2. **status** - 상태 업데이트 (서버 → 클라이언트)
```json
{
  "type": "status",
  "command_id": "uuid",
  "status": "executing",
  "message": "작업 분해 중..."
}
```

3. **output** - CLI 출력 (서버 → 클라이언트)
```json
{
  "type": "output",
  "command_id": "uuid",
  "stream": "stdout",
  "content": "Creating login component..."
}
```

4. **complete** - 명령 완료 (서버 → 클라이언트)
```json
{
  "type": "complete",
  "command_id": "uuid",
  "result": {
    "success": true,
    "code_changes": [
      {
        "file": "src/components/Login.tsx",
        "action": "created"
      }
    ]
  }
}
```

5. **error** - 에러 (서버 → 클라이언트)
```json
{
  "type": "error",
  "command_id": "uuid",
  "error": {
    "code": "EXECUTION_FAILED",
    "message": "명령 실행 실패"
  }
}
```

### GET /api/vibe/sessions

프로젝트의 바이브 코딩 세션 목록.

**Query Parameters**
- `project_id` (required): 프로젝트 ID

### GET /api/vibe/sessions/:id/commands

세션의 명령 히스토리.

---

## 콘텐츠 API

### GET /api/contents

콘텐츠 목록 조회.

**Query Parameters**
- `workspace_id` (required): 워크스페이스 ID
- `topic_id` (optional): 주제 ID로 필터
- `status` (optional): 상태로 필터
- `content_type` (optional): 콘텐츠 타입으로 필터

### POST /api/contents

콘텐츠 생성.

**Request Body**
```json
{
  "workspace_id": "uuid",
  "topic_id": "uuid",
  "title": "콘텐츠 제목",
  "body": "콘텐츠 본문...",
  "content_type": "blog",
  "purpose_tags": ["강의전환", "개발의뢰전환"]
}
```

### GET /api/contents/:id

콘텐츠 상세 조회.

### PATCH /api/contents/:id

콘텐츠 수정.

### DELETE /api/contents/:id

콘텐츠 삭제.

### POST /api/contents/:id/verify

콘텐츠 AI 검증 실행.

**Response**
```json
{
  "success": true,
  "data": {
    "blue_team": {
      "passed": true,
      "score": 0.85,
      "feedback": [
        "논리적 일관성 양호",
        "출처 명확"
      ]
    },
    "red_team": {
      "risk_score": 0.2,
      "risks": [],
      "recommendation": "auto_publish"
    }
  }
}
```

### POST /api/contents/:id/publish

콘텐츠 배포.

**Request Body**
```json
{
  "channel_ids": ["uuid1", "uuid2"]
}
```

---

## 문서 API

### GET /api/documents

문서 목록 조회.

**Query Parameters**
- `workspace_id` (required): 워크스페이스 ID
- `project_id` (optional): 프로젝트 ID로 필터
- `source_type` (optional): 출처 타입으로 필터

### POST /api/documents

문서 생성/업로드.

**Request Body (JSON)**
```json
{
  "workspace_id": "uuid",
  "project_id": "uuid",
  "title": "문서 제목",
  "content": "문서 내용",
  "source_type": "internal"
}
```

**Request Body (File Upload)**
```
Content-Type: multipart/form-data
- file: 업로드할 파일
- workspace_id: 워크스페이스 ID
- project_id: 프로젝트 ID (optional)
```

### GET /api/documents/:id

문서 상세 조회.

### DELETE /api/documents/:id

문서 삭제.

### POST /api/documents/search

문서 검색.

**Request Body**
```json
{
  "workspace_id": "uuid",
  "query": "검색어",
  "include_external": true,
  "limit": 10
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "uuid",
        "title": "문서 제목",
        "snippet": "검색어가 포함된 내용...",
        "source_type": "internal",
        "relevance_score": 0.95
      }
    ],
    "external_results": [
      {
        "title": "외부 문서",
        "url": "https://...",
        "snippet": "...",
        "source": "web"
      }
    ]
  }
}
```

### POST /api/documents/:id/summarize

문서 AI 요약.

**Request Body**
```json
{
  "type": "reference"  // "reference" | "submission"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "summary": "요약된 내용...",
    "key_points": ["포인트1", "포인트2"],
    "type": "reference"
  }
}
```

---

## 콘텐츠 주제 API

### GET /api/topics

주제 목록 조회.

### POST /api/topics

주제 생성.

### PATCH /api/topics/:id

주제 수정.

### DELETE /api/topics/:id

주제 삭제.

---

## 마케팅 채널 API

### GET /api/marketing/channels

채널 목록 조회.

### POST /api/marketing/channels

채널 추가.

**Request Body**
```json
{
  "workspace_id": "uuid",
  "channel_type": "blog_tistory",
  "channel_name": "내 티스토리",
  "credentials": {
    "access_token": "..."
  },
  "settings": {
    "max_length": 5000,
    "tone": "professional"
  }
}
```

### PATCH /api/marketing/channels/:id

채널 수정.

### DELETE /api/marketing/channels/:id

채널 삭제.

### GET /api/marketing/distributions

배포 이력 조회.

**Query Parameters**
- `content_id` (optional): 콘텐츠 ID로 필터
- `channel_id` (optional): 채널 ID로 필터

---

## 회계 API

### GET /api/accounting/records

회계 기록 조회.

**Query Parameters**
- `workspace_id` (required): 워크스페이스 ID
- `project_id` (optional): 프로젝트 ID
- `record_type` (optional): income | expense
- `start_date` (optional): 시작 날짜
- `end_date` (optional): 종료 날짜

### POST /api/accounting/records

회계 기록 추가.

**Request Body**
```json
{
  "workspace_id": "uuid",
  "project_id": "uuid",
  "record_type": "income",
  "amount": 1000000,
  "description": "프로젝트 완료 대금",
  "category": "development",
  "recorded_date": "2024-01-15"
}
```

### GET /api/accounting/summary

회계 요약.

**Query Parameters**
- `workspace_id` (required): 워크스페이스 ID
- `year` (optional): 연도

**Response**
```json
{
  "success": true,
  "data": {
    "total_income": 12000000,
    "total_expense": 3000000,
    "net": 9000000,
    "by_month": [
      { "month": 1, "income": 1000000, "expense": 250000 }
    ],
    "by_category": {
      "development": 8000000,
      "consulting": 4000000
    }
  }
}
```

---

## GitHub 연동 API

### POST /api/github/connect

GitHub OAuth 연결.

### GET /api/github/repos

연결된 GitHub 계정의 레포지토리 목록.

### POST /api/github/repos

새 레포지토리 생성.

**Request Body**
```json
{
  "name": "project-name",
  "description": "프로젝트 설명",
  "private": true
}
```

### GET /api/github/repos/:owner/:repo/commits

레포지토리 커밋 히스토리.

---

## AI 로그 API

### GET /api/ai/logs

AI 판단 로그 조회.

**Query Parameters**
- `workspace_id` (required): 워크스페이스 ID
- `entity_type` (optional): 엔티티 타입
- `entity_id` (optional): 엔티티 ID
- `decision_type` (optional): 판단 타입

---

## 에러 코드

| 코드 | 설명 |
|------|------|
| UNAUTHORIZED | 인증 실패 |
| FORBIDDEN | 권한 없음 |
| NOT_FOUND | 리소스 없음 |
| VALIDATION_ERROR | 유효성 검사 실패 |
| EXECUTION_FAILED | 실행 실패 |
| RATE_LIMITED | 요청 제한 초과 |
| INTERNAL_ERROR | 서버 내부 오류 |
