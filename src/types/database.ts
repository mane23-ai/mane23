export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          status: 'planning' | 'development' | 'review' | 'deployed' | 'archived';
          github_repo_url: string | null;
          github_repo_id: string | null;
          client_info: Json;
          budget: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          status?: 'planning' | 'development' | 'review' | 'deployed' | 'archived';
          github_repo_url?: string | null;
          github_repo_id?: string | null;
          client_info?: Json;
          budget?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          status?: 'planning' | 'development' | 'review' | 'deployed' | 'archived';
          github_repo_url?: string | null;
          github_repo_id?: string | null;
          client_info?: Json;
          budget?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      vibe_sessions: {
        Row: {
          id: string;
          project_id: string;
          status: 'active' | 'completed' | 'failed';
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          status?: 'active' | 'completed' | 'failed';
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          status?: 'active' | 'completed' | 'failed';
          created_at?: string;
          completed_at?: string | null;
        };
      };
      vibe_commands: {
        Row: {
          id: string;
          session_id: string;
          user_input: string;
          ai_interpretation: Json | null;
          cli_commands: Json | null;
          execution_result: Json | null;
          code_changes: Json | null;
          status: 'pending' | 'executing' | 'completed' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_input: string;
          ai_interpretation?: Json | null;
          cli_commands?: Json | null;
          execution_result?: Json | null;
          code_changes?: Json | null;
          status?: 'pending' | 'executing' | 'completed' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_input?: string;
          ai_interpretation?: Json | null;
          cli_commands?: Json | null;
          execution_result?: Json | null;
          code_changes?: Json | null;
          status?: 'pending' | 'executing' | 'completed' | 'failed';
          created_at?: string;
        };
      };
      content_topics: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          category: string | null;
          tags: string[] | null;
          parent_topic_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          parent_topic_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          tags?: string[] | null;
          parent_topic_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      contents: {
        Row: {
          id: string;
          workspace_id: string;
          topic_id: string | null;
          title: string;
          body: string | null;
          content_type: string | null;
          purpose_tags: string[] | null;
          status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
          verification: Json;
          published_channels: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          topic_id?: string | null;
          title: string;
          body?: string | null;
          content_type?: string | null;
          purpose_tags?: string[] | null;
          status?: 'draft' | 'review' | 'approved' | 'published' | 'archived';
          verification?: Json;
          published_channels?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          topic_id?: string | null;
          title?: string;
          body?: string | null;
          content_type?: string | null;
          purpose_tags?: string[] | null;
          status?: 'draft' | 'review' | 'approved' | 'published' | 'archived';
          verification?: Json;
          published_channels?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          title: string;
          content: string | null;
          source_type: 'internal' | 'external' | 'uploaded' | null;
          source_url: string | null;
          source_author: string | null;
          collected_at: string | null;
          summary: Json;
          file_path: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          title: string;
          content?: string | null;
          source_type?: 'internal' | 'external' | 'uploaded' | null;
          source_url?: string | null;
          source_author?: string | null;
          collected_at?: string | null;
          summary?: Json;
          file_path?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string | null;
          title?: string;
          content?: string | null;
          source_type?: 'internal' | 'external' | 'uploaded' | null;
          source_url?: string | null;
          source_author?: string | null;
          collected_at?: string | null;
          summary?: Json;
          file_path?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      marketing_channels: {
        Row: {
          id: string;
          workspace_id: string;
          channel_type: string;
          channel_name: string;
          credentials: Json;
          settings: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          channel_type: string;
          channel_name: string;
          credentials?: Json;
          settings?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          channel_type?: string;
          channel_name?: string;
          credentials?: Json;
          settings?: Json;
          is_active?: boolean;
          created_at?: string;
        };
      };
      marketing_distributions: {
        Row: {
          id: string;
          content_id: string;
          channel_id: string | null;
          distributed_content: string | null;
          external_id: string | null;
          external_url: string | null;
          status: 'scheduled' | 'published' | 'failed';
          metrics: Json;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          channel_id?: string | null;
          distributed_content?: string | null;
          external_id?: string | null;
          external_url?: string | null;
          status?: 'scheduled' | 'published' | 'failed';
          metrics?: Json;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string;
          channel_id?: string | null;
          distributed_content?: string | null;
          external_id?: string | null;
          external_url?: string | null;
          status?: 'scheduled' | 'published' | 'failed';
          metrics?: Json;
          published_at?: string | null;
          created_at?: string;
        };
      };
      accounting_records: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          record_type: 'income' | 'expense';
          amount: number;
          description: string | null;
          category: string | null;
          tax_info: Json;
          receipt_path: string | null;
          recorded_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          record_type: 'income' | 'expense';
          amount: number;
          description?: string | null;
          category?: string | null;
          tax_info?: Json;
          receipt_path?: string | null;
          recorded_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string | null;
          record_type?: 'income' | 'expense';
          amount?: number;
          description?: string | null;
          category?: string | null;
          tax_info?: Json;
          receipt_path?: string | null;
          recorded_date?: string;
          created_at?: string;
        };
      };
      ai_decision_logs: {
        Row: {
          id: string;
          workspace_id: string;
          related_entity_type: string | null;
          related_entity_id: string | null;
          decision_type: string | null;
          input_data: Json | null;
          output_data: Json | null;
          reasoning: string | null;
          confidence_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          decision_type?: string | null;
          input_data?: Json | null;
          output_data?: Json | null;
          reasoning?: string | null;
          confidence_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          decision_type?: string | null;
          input_data?: Json | null;
          output_data?: Json | null;
          reasoning?: string | null;
          confidence_score?: number | null;
          created_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string | null;
          service_name: string;
          encrypted_key: string;
          is_active: boolean;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          service_name: string;
          encrypted_key: string;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string | null;
          service_name?: string;
          encrypted_key?: string;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
