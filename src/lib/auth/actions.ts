'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export type AuthResult = {
  error?: string;
  success?: boolean;
  message?: string;
};

/**
 * 이메일/비밀번호 로그인
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error.message),
    };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

/**
 * 이메일/비밀번호 회원가입
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get('origin') || 'http://localhost:3000';

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        name,
        full_name: name,
      },
    },
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error.message),
    };
  }

  return {
    success: true,
    message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
  };
}

/**
 * OAuth 로그인 (GitHub, Google)
 */
export async function signInWithOAuth(
  provider: 'github' | 'google'
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get('origin') || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error.message),
    };
  }

  if (data.url) {
    return { url: data.url };
  }

  return { error: 'OAuth URL을 생성할 수 없습니다.' };
}

/**
 * 로그아웃
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get('origin') || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error.message),
    };
  }

  return {
    success: true,
    message: '비밀번호 재설정 이메일을 발송했습니다.',
  };
}

/**
 * 비밀번호 업데이트
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error.message),
    };
  }

  return {
    success: true,
    message: '비밀번호가 변경되었습니다.',
  };
}

/**
 * 현재 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * 에러 메시지 한글 변환
 */
function getAuthErrorMessage(message: string): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'Email not confirmed': '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
    'User already registered': '이미 가입된 이메일입니다.',
    'Password should be at least 6 characters':
      '비밀번호는 최소 6자 이상이어야 합니다.',
    'Email rate limit exceeded':
      '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    'Signup requires a valid password':
      '유효한 비밀번호를 입력해주세요.',
    'Unable to validate email address: invalid format':
      '유효한 이메일 주소를 입력해주세요.',
    'New password should be different from the old password':
      '새 비밀번호는 기존 비밀번호와 달라야 합니다.',
  };

  return errorMessages[message] || message;
}
