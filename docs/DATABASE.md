# 데이터베이스 스키마

## ERD 개요

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ workspaces  │──────<│  projects   │──────<│vibe_sessions│
└─────────────┘       └─────────────┘       └─────────────┘
      │                     │                     │
      │                     │                     │
      ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  contents   │       │  documents  │       │vibe_commands│
└─────────────┘       └─────────────┘       └─────────────┘
      │
      │
      ▼
┌──────────────────────┐
│marketing_distributions│
└──────────────────────┘
```

## 테이블 정의

### workspaces (워크스페이스)

사용자의 작업 공간 단위. 공통 자산과 설정을 관리.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| name | TEXT | 워크스페이스 이름 |
| owner_id | UUID | 소유자 ID (auth.users 참조) |
| settings | JSONB | 워크스페이스 설정 |
| created_at | TIMESTAMPTZ | 생성 시간 |
| updated_at | TIMESTAMPTZ | 수정 시간 |

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspaces" ON workspaces
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own workspaces" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own workspaces" ON workspaces
  FOR DELETE USING (owner_id = auth.uid());
```

### projects (프로젝트)

의뢰/개발 프로젝트 단위. GitHub 레포와 1:1 매칭.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| workspace_id | UUID | 소속 워크스페이스 |
| name | TEXT | 프로젝트 이름 |
| description | TEXT | 프로젝트 설명 |
| status | TEXT | 상태 (planning/development/review/deployed/archived) |
| github_repo_url | TEXT | GitHub 레포지토리 URL |
| github_repo_id | TEXT | GitHub 레포지토리 ID |
| client_info | JSONB | 의뢰인 정보 |
| budget | JSONB | 예산/지급 정보 |
| metadata | JSONB | 추가 메타데이터 |
| created_at | TIMESTAMPTZ | 생성 시간 |
| updated_at | TIMESTAMPTZ | 수정 시간 |

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'development', 'review', 'deployed', 'archived')),
  github_repo_url TEXT,
  github_repo_id TEXT,
  client_info JSONB DEFAULT '{}',
  budget JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX idx_projects_status ON projects(status);

-- RLS 정책
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace projects" ON projects
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );
```

### vibe_sessions (바이브 코딩 세션)

바이브 코딩 세션 정보.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| project_id | UUID | 프로젝트 ID |
| status | TEXT | 상태 (active/completed/failed) |
| created_at | TIMESTAMPTZ | 생성 시간 |
| completed_at | TIMESTAMPTZ | 완료 시간 |

```sql
CREATE TABLE vibe_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_vibe_sessions_project_id ON vibe_sessions(project_id);

ALTER TABLE vibe_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access project vibe sessions" ON vibe_sessions
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );
```

### vibe_commands (바이브 코딩 명령)

개별 바이브 코딩 명령 및 실행 결과.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| session_id | UUID | 세션 ID |
| user_input | TEXT | 사용자 자연어 입력 |
| ai_interpretation | JSONB | AI 해석 결과 |
| cli_commands | JSONB | 실행된 CLI 명령들 |
| execution_result | JSONB | 실행 결과 |
| code_changes | JSONB | 코드 변경 내역 |
| status | TEXT | 상태 (pending/executing/completed/failed) |
| created_at | TIMESTAMPTZ | 생성 시간 |

```sql
CREATE TABLE vibe_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES vibe_sessions(id) ON DELETE CASCADE,
  user_input TEXT NOT NULL,
  ai_interpretation JSONB,
  cli_commands JSONB,
  execution_result JSONB,
  code_changes JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vibe_commands_session_id ON vibe_commands(session_id);

ALTER TABLE vibe_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access session commands" ON vibe_commands
  FOR ALL USING (
    session_id IN (
      SELECT id FROM vibe_sessions WHERE project_id IN (
        SELECT id FROM projects WHERE workspace_id IN (
          SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
      )
    )
  );
```

### content_topics (콘텐츠 주제)

콘텐츠 주제 체계 관리.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| workspace_id | UUID | 워크스페이스 ID |
| name | TEXT | 주제 이름 |
| description | TEXT | 주제 설명 |
| category | TEXT | 카테고리 |
| tags | TEXT[] | 태그 배열 |
| parent_topic_id | UUID | 상위 주제 ID |
| metadata | JSONB | 추가 메타데이터 |
| created_at | TIMESTAMPTZ | 생성 시간 |

```sql
CREATE TABLE content_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  parent_topic_id UUID REFERENCES content_topics(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_content_topics_workspace_id ON content_topics(workspace_id);
CREATE INDEX idx_content_topics_category ON content_topics(category);

ALTER TABLE content_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace topics" ON content_topics
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );
```

### contents (콘텐츠)

실제 콘텐츠 데이터.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| workspace_id | UUID | 워크스페이스 ID |
| topic_id | UUID | 주제 ID |
| title | TEXT | 제목 |
| body | TEXT | 본문 |
| content_type | TEXT | 콘텐츠 타입 |
| purpose_tags | TEXT[] | 목적 태그 |
| status | TEXT | 상태 |
| verification | JSONB | 검증 결과 |
| published_channels | JSONB | 배포된 채널 |
| metadata | JSONB | 메타데이터 |
| created_at | TIMESTAMPTZ | 생성 시간 |
| updated_at | TIMESTAMPTZ | 수정 시간 |

```sql
CREATE TABLE contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES content_topics(id),
  title TEXT NOT NULL,
  body TEXT,
  content_type TEXT,
  purpose_tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
  verification JSONB DEFAULT '{}',
  published_channels JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contents_workspace_id ON contents(workspace_id);
CREATE INDEX idx_contents_topic_id ON contents(topic_id);
CREATE INDEX idx_contents_status ON contents(status);

ALTER TABLE contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace contents" ON contents
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );
```

### documents (문서)

내부/외부 문서 관리.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| workspace_id | UUID | 워크스페이스 ID |
| project_id | UUID | 프로젝트 ID (선택) |
| title | TEXT | 문서 제목 |
| content | TEXT | 문서 내용 |
| source_type | TEXT | 출처 타입 (internal/external/uploaded) |
| source_url | TEXT | 출처 URL |
| source_author | TEXT | 작성자 |
| collected_at | TIMESTAMPTZ | 수집 시점 |
| summary | JSONB | AI 요약 |
| file_path | TEXT | Storage 경로 |
| metadata | JSONB | 메타데이터 |
| created_at | TIMESTAMPTZ | 생성 시간 |

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  content TEXT,
  source_type TEXT CHECK (source_type IN ('internal', 'external', 'uploaded')),
  source_url TEXT,
  source_author TEXT,
  collected_at TIMESTAMPTZ,
  summary JSONB DEFAULT '{}',
  file_path TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX idx_documents_project_id ON documents(project_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace documents" ON documents
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );
```

### marketing_channels (마케팅 채널)

마케팅 채널 설정.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| workspace_id | UUID | 워크스페이스 ID |
| channel_type | TEXT | 채널 타입 |
| channel_name | TEXT | 채널 이름 |
| credentials | JSONB | 인증 정보 (암호화) |
| settings | JSONB | 채널 설정 |
| is_active | BOOLEAN | 활성화 여부 |
| created_at | TIMESTAMPTZ | 생성 시간 |

```sql
CREATE TABLE marketing_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  credentials JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_marketing_channels_workspace_id ON marketing_channels(workspace_id);

ALTER TABLE marketing_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace channels" ON marketing_channels
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );
```

### marketing_distributions (마케팅 배포)

콘텐츠 배포 이력.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| content_id | UUID | 콘텐츠 ID |
| channel_id | UUID | 채널 ID |
| distributed_content | TEXT | 가공된 콘텐츠 |
| external_id | TEXT | 외부 게시물 ID |
| external_url | TEXT | 외부 URL |
| status | TEXT | 상태 |
| metrics | JSONB | 성과 지표 |
| published_at | TIMESTAMPTZ | 배포 시간 |
| created_at | TIMESTAMPTZ | 생성 시간 |

```sql
CREATE TABLE marketing_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES marketing_channels(id),
  distributed_content TEXT,
  external_id TEXT,
  external_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed')),
  metrics JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_marketing_distributions_content_id ON marketing_distributions(content_id);
CREATE INDEX idx_marketing_distributions_channel_id ON marketing_distributions(channel_id);

ALTER TABLE marketing_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access content distributions" ON marketing_distributions
  FOR ALL USING (
    content_id IN (
      SELECT id FROM contents WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );
```

### accounting_records (회계 기록)

수입/지출 기록.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| workspace_id | UUID | 워크스페이스 ID |
| project_id | UUID | 프로젝트 ID (선택) |
| record_type | TEXT | 기록 타입 (income/expense) |
| amount | DECIMAL | 금액 |
| description | TEXT | 설명 |
| category | TEXT | 카테고리 |
| tax_info | JSONB | 세금 정보 |
| receipt_path | TEXT | 영수증 경로 |
| recorded_date | DATE | 기록 날짜 |
| created_at | TIMESTAMPTZ | 생성 시간 |

```sql
CREATE TABLE accounting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  record_type TEXT NOT NULL CHECK (record_type IN ('income', 'expense')),
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  category TEXT,
  tax_info JSONB DEFAULT '{}',
  receipt_path TEXT,
  recorded_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_accounting_records_workspace_id ON accounting_records(workspace_id);
CREATE INDEX idx_accounting_records_project_id ON accounting_records(project_id);
CREATE INDEX idx_accounting_records_recorded_date ON accounting_records(recorded_date);

ALTER TABLE accounting_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace records" ON accounting_records
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );
```

### ai_decision_logs (AI 판단 로그)

모든 AI 판단 기록.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| workspace_id | UUID | 워크스페이스 ID |
| related_entity_type | TEXT | 관련 엔티티 타입 |
| related_entity_id | UUID | 관련 엔티티 ID |
| decision_type | TEXT | 판단 타입 |
| input_data | JSONB | 입력 데이터 |
| output_data | JSONB | 출력 데이터 |
| reasoning | TEXT | 판단 근거 |
| confidence_score | DECIMAL | 신뢰도 점수 |
| created_at | TIMESTAMPTZ | 생성 시간 |

```sql
CREATE TABLE ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  related_entity_type TEXT,
  related_entity_id UUID,
  decision_type TEXT,
  input_data JSONB,
  output_data JSONB,
  reasoning TEXT,
  confidence_score DECIMAL(3, 2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_decision_logs_workspace_id ON ai_decision_logs(workspace_id);
CREATE INDEX idx_ai_decision_logs_entity ON ai_decision_logs(related_entity_type, related_entity_id);

ALTER TABLE ai_decision_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace logs" ON ai_decision_logs
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );
```

### api_keys (API 키 관리)

외부 서비스 API 키 관리.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| workspace_id | UUID | 워크스페이스 ID |
| project_id | UUID | 프로젝트 ID (NULL=글로벌) |
| service_name | TEXT | 서비스 이름 |
| encrypted_key | TEXT | 암호화된 키 |
| is_active | BOOLEAN | 활성화 여부 |
| last_used_at | TIMESTAMPTZ | 마지막 사용 시간 |
| created_at | TIMESTAMPTZ | 생성 시간 |

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  service_name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_api_keys_workspace_id ON api_keys(workspace_id);
CREATE INDEX idx_api_keys_service_name ON api_keys(service_name);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace api keys" ON api_keys
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );
```

## 트리거 및 함수

### updated_at 자동 업데이트

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contents_updated_at
  BEFORE UPDATE ON contents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 사용자 생성 시 기본 워크스페이스 생성

```sql
CREATE OR REPLACE FUNCTION create_default_workspace()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspaces (name, owner_id)
  VALUES ('My Workspace', NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_workspace();
```
