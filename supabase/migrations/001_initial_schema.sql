-- AI 기반 프리랜서 운영 시스템 - 초기 스키마
-- Version: 001
-- Created: 2024

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 워크스페이스 (Workspaces)
-- ===========================================
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workspaces" ON workspaces
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own workspaces" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own workspaces" ON workspaces
  FOR DELETE USING (owner_id = auth.uid());

-- ===========================================
-- 프로젝트 (Projects)
-- ===========================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
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

CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX idx_projects_status ON projects(status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace projects" ON projects
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- ===========================================
-- 바이브 코딩 세션 (Vibe Sessions)
-- ===========================================
CREATE TABLE vibe_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_vibe_sessions_project_id ON vibe_sessions(project_id);
CREATE INDEX idx_vibe_sessions_status ON vibe_sessions(status);

ALTER TABLE vibe_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access project vibe sessions" ON vibe_sessions
  FOR ALL USING (
    project_id IN (
      SELECT id FROM projects WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

-- ===========================================
-- 바이브 코딩 명령 (Vibe Commands)
-- ===========================================
CREATE TABLE vibe_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES vibe_sessions(id) ON DELETE CASCADE NOT NULL,
  user_input TEXT NOT NULL,
  ai_interpretation JSONB,
  cli_commands JSONB,
  execution_result JSONB,
  code_changes JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vibe_commands_session_id ON vibe_commands(session_id);
CREATE INDEX idx_vibe_commands_status ON vibe_commands(status);

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

-- ===========================================
-- 콘텐츠 주제 (Content Topics)
-- ===========================================
CREATE TABLE content_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
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
CREATE INDEX idx_content_topics_parent ON content_topics(parent_topic_id);

ALTER TABLE content_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace topics" ON content_topics
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- ===========================================
-- 콘텐츠 (Contents)
-- ===========================================
CREATE TABLE contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
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
CREATE INDEX idx_contents_content_type ON contents(content_type);

ALTER TABLE contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace contents" ON contents
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- ===========================================
-- 문서 (Documents)
-- ===========================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
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
CREATE INDEX idx_documents_source_type ON documents(source_type);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace documents" ON documents
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- ===========================================
-- 마케팅 채널 (Marketing Channels)
-- ===========================================
CREATE TABLE marketing_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  channel_type TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  credentials JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_marketing_channels_workspace_id ON marketing_channels(workspace_id);
CREATE INDEX idx_marketing_channels_type ON marketing_channels(channel_type);

ALTER TABLE marketing_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace channels" ON marketing_channels
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- ===========================================
-- 마케팅 배포 (Marketing Distributions)
-- ===========================================
CREATE TABLE marketing_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
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
CREATE INDEX idx_marketing_distributions_status ON marketing_distributions(status);

ALTER TABLE marketing_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access content distributions" ON marketing_distributions
  FOR ALL USING (
    content_id IN (
      SELECT id FROM contents WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

-- ===========================================
-- 회계 기록 (Accounting Records)
-- ===========================================
CREATE TABLE accounting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
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
CREATE INDEX idx_accounting_records_type ON accounting_records(record_type);

ALTER TABLE accounting_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace records" ON accounting_records
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- ===========================================
-- AI 판단 로그 (AI Decision Logs)
-- ===========================================
CREATE TABLE ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
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
CREATE INDEX idx_ai_decision_logs_type ON ai_decision_logs(decision_type);

ALTER TABLE ai_decision_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access workspace logs" ON ai_decision_logs
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );

-- ===========================================
-- API 키 관리 (API Keys)
-- ===========================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
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

-- ===========================================
-- 트리거 함수: updated_at 자동 업데이트
-- ===========================================
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

-- ===========================================
-- 트리거 함수: 사용자 생성 시 기본 워크스페이스 생성
-- ===========================================
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
