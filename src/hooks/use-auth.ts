'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  });
  const supabaseRef = useRef<ReturnType<typeof import('@/lib/supabase/client').createClient> | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') {
      setState({ user: null, session: null, isLoading: false });
      return;
    }

    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setState({ user: null, session: null, isLoading: false });
      return;
    }

    // 이미 초기화되었으면 스킵
    if (initializedRef.current) return;
    initializedRef.current = true;

    // 동적으로 Supabase 클라이언트 import
    const initAuth = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        supabaseRef.current = supabase;

        // 현재 세션 가져오기
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setState({
          user: session?.user ?? null,
          session,
          isLoading: false,
        });

        // 인증 상태 변경 구독
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setState({
            user: session?.user ?? null,
            session,
            isLoading: false,
          });
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState({ user: null, session: null, isLoading: false });
      }
    };

    const cleanup = initAuth();

    return () => {
      cleanup.then((unsubscribe) => unsubscribe?.());
    };
  }, []);

  const signOut = useCallback(async () => {
    if (supabaseRef.current) {
      await supabaseRef.current.auth.signOut();
    }
  }, []);

  return {
    ...state,
    signOut,
    isAuthenticated: !!state.user,
  };
}

/**
 * 사용자 프로필 정보 훅
 */
export function useUserProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<{
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null>(null);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.user_metadata?.name || user.user_metadata?.full_name || null,
        email: user.email || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      });
    } else {
      setProfile(null);
    }
  }, [user]);

  return {
    profile,
    isLoading: authLoading,
  };
}
