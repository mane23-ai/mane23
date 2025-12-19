'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Bell,
  Key,
  Webhook,
  Github,
  Youtube,
  Instagram,
  Globe,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth, useUserProfile } from '@/hooks/use-auth';
import { useWorkspaces, useUpdateWorkspace, useCreateWorkspace } from '@/hooks/use-workspaces';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile } = useUserProfile();
  const { workspaces, currentWorkspace, isLoading: workspacesLoading, setCurrentWorkspace } = useWorkspaces();
  const updateWorkspace = useUpdateWorkspace();
  const createWorkspace = useCreateWorkspace();

  // 프로필 폼 상태
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    bio: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // 워크스페이스 폼 상태
  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
  });
  const [workspaceSaved, setWorkspaceSaved] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  // 알림 설정 상태
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    projectUpdates: true,
    contentVerification: true,
    marketing: false,
  });
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [notificationsSaved, setNotificationsSaved] = useState(false);

  // API 키 상태
  const [apiKeys, setApiKeys] = useState({
    anthropic: '',
    github: '',
  });
  const [apiKeysSaving, setApiKeysSaving] = useState(false);
  const [apiKeysSaved, setApiKeysSaved] = useState(false);

  // 프로필 데이터 로드
  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        email: profile.email || '',
        bio: user?.user_metadata?.bio || '',
      });
    }
  }, [profile, user]);

  // 워크스페이스 데이터 로드
  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceForm({
        name: currentWorkspace.name || '',
      });
      // 워크스페이스 설정에서 알림 설정 로드
      const settings = currentWorkspace.settings as Record<string, unknown> | null;
      if (settings?.notifications) {
        const notifSettings = settings.notifications as typeof notifications;
        setNotifications(prev => ({
          ...prev,
          ...notifSettings,
        }));
      }
    }
  }, [currentWorkspace]);

  // 프로필 저장
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          name: profileForm.name,
          full_name: profileForm.name,
          bio: profileForm.bio,
        },
      });

      if (error) throw error;
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (error) {
      console.error('Profile save error:', error);
      setProfileError(error instanceof Error ? error.message : '프로필 저장에 실패했습니다');
    } finally {
      setProfileSaving(false);
    }
  };

  // 워크스페이스 저장
  const handleSaveWorkspace = async () => {
    setWorkspaceError(null);
    setWorkspaceSaved(false);

    try {
      if (currentWorkspace) {
        await updateWorkspace.mutateAsync({
          id: currentWorkspace.id,
          data: { name: workspaceForm.name },
        });
      } else {
        // 워크스페이스가 없으면 새로 생성
        await createWorkspace.mutateAsync({
          name: workspaceForm.name,
        });
      }
      setWorkspaceSaved(true);
      setTimeout(() => setWorkspaceSaved(false), 3000);
    } catch (error) {
      console.error('Workspace save error:', error);
      setWorkspaceError(error instanceof Error ? error.message : '워크스페이스 저장에 실패했습니다');
    }
  };

  // 알림 설정 저장
  const handleSaveNotifications = async () => {
    if (!currentWorkspace) return;

    setNotificationsSaving(true);
    setNotificationsSaved(false);

    try {
      const currentSettings = currentWorkspace.settings as Record<string, unknown> || {};
      await updateWorkspace.mutateAsync({
        id: currentWorkspace.id,
        data: {
          settings: {
            ...currentSettings,
            notifications,
          },
        },
      });
      setNotificationsSaved(true);
      setTimeout(() => setNotificationsSaved(false), 3000);
    } catch (error) {
      console.error('Notifications save error:', error);
    } finally {
      setNotificationsSaving(false);
    }
  };

  // API 키 저장
  const handleSaveApiKey = async (keyType: 'anthropic' | 'github') => {
    if (!currentWorkspace) return;

    setApiKeysSaving(true);
    setApiKeysSaved(false);

    try {
      const currentSettings = currentWorkspace.settings as Record<string, unknown> || {};
      const apiKeysSettings = (currentSettings.apiKeys || {}) as Record<string, string>;

      await updateWorkspace.mutateAsync({
        id: currentWorkspace.id,
        data: {
          settings: {
            ...currentSettings,
            apiKeys: {
              ...apiKeysSettings,
              [keyType]: apiKeys[keyType],
            },
          },
        },
      });
      setApiKeysSaved(true);
      setTimeout(() => setApiKeysSaved(false), 3000);

      // 저장 후 입력 필드 초기화 (보안)
      setApiKeys(prev => ({ ...prev, [keyType]: '' }));
    } catch (error) {
      console.error('API key save error:', error);
    } finally {
      setApiKeysSaving(false);
    }
  };

  // 로딩 상태
  if (authLoading || workspacesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="설정"
        description="계정, 알림, 연동 등 시스템 설정을 관리하세요."
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            프로필
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            알림
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-4 w-4" />
            API 키
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Webhook className="h-4 w-4" />
            연동
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>프로필 정보</CardTitle>
              <CardDescription>
                기본 프로필 정보를 수정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    placeholder="홍길동"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={profileForm.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">소개</Label>
                <Textarea
                  id="bio"
                  placeholder="간단한 자기소개를 입력하세요."
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>
              {profileError && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {profileError}
                </div>
              )}
              <Button onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : profileSaved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    저장됨
                  </>
                ) : (
                  '저장'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>워크스페이스</CardTitle>
              <CardDescription>
                워크스페이스 정보를 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">워크스페이스 이름</Label>
                <Input
                  id="workspace-name"
                  placeholder="My Workspace"
                  value={workspaceForm.name}
                  onChange={(e) => setWorkspaceForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              {workspaceError && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  {workspaceError}
                </div>
              )}
              <Button
                onClick={handleSaveWorkspace}
                disabled={updateWorkspace.isPending || createWorkspace.isPending}
              >
                {(updateWorkspace.isPending || createWorkspace.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : workspaceSaved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    저장됨
                  </>
                ) : (
                  currentWorkspace ? '저장' : '워크스페이스 생성'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>알림 설정</CardTitle>
              <CardDescription>
                어떤 알림을 받을지 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>이메일 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    중요한 업데이트를 이메일로 받습니다.
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>푸시 알림</Label>
                  <p className="text-sm text-muted-foreground">
                    브라우저 푸시 알림을 받습니다.
                  </p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>프로젝트 업데이트</Label>
                  <p className="text-sm text-muted-foreground">
                    프로젝트 상태 변경, 새 의뢰 등의 알림
                  </p>
                </div>
                <Switch
                  checked={notifications.projectUpdates}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, projectUpdates: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>콘텐츠 검증 완료</Label>
                  <p className="text-sm text-muted-foreground">
                    블루팀/레드팀 검증 완료 시 알림
                  </p>
                </div>
                <Switch
                  checked={notifications.contentVerification}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, contentVerification: checked })
                  }
                />
              </div>
              <Separator />
              <Button onClick={handleSaveNotifications} disabled={notificationsSaving || !currentWorkspace}>
                {notificationsSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : notificationsSaved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    저장됨
                  </>
                ) : (
                  '알림 설정 저장'
                )}
              </Button>
              {!currentWorkspace && (
                <p className="text-xs text-muted-foreground">
                  알림 설정을 저장하려면 먼저 워크스페이스를 생성하세요.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API 키 관리</CardTitle>
              <CardDescription>
                외부 서비스 연동에 필요한 API 키를 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="anthropic-key"
                    type="password"
                    placeholder="sk-ant-..."
                    className="flex-1"
                    value={apiKeys.anthropic}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleSaveApiKey('anthropic')}
                    disabled={apiKeysSaving || !apiKeys.anthropic || !currentWorkspace}
                  >
                    {apiKeysSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : '저장'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Claude API 사용을 위한 키입니다. 바이브 코딩 기능에 사용됩니다.
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="github-token"
                    type="password"
                    placeholder="ghp_..."
                    className="flex-1"
                    value={apiKeys.github}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, github: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleSaveApiKey('github')}
                    disabled={apiKeysSaving || !apiKeys.github || !currentWorkspace}
                  >
                    {apiKeysSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : '저장'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  GitHub 레포지토리 연동을 위한 토큰입니다.
                </p>
              </div>
              {apiKeysSaved && (
                <div className="flex items-center gap-2 text-sm text-green-500">
                  <Check className="h-4 w-4" />
                  API 키가 저장되었습니다.
                </div>
              )}
              {!currentWorkspace && (
                <p className="text-xs text-muted-foreground">
                  API 키를 저장하려면 먼저 워크스페이스를 생성하세요.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>마케팅 채널 연동</CardTitle>
              <CardDescription>
                콘텐츠 배포를 위한 채널을 연결합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* GitHub */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-muted p-2">
                    <Github className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">GitHub</p>
                    <p className="text-sm text-muted-foreground">
                      프로젝트 레포지토리 연동
                    </p>
                  </div>
                </div>
                <Button variant="outline" disabled>
                  준비 중
                </Button>
              </div>

              {/* YouTube */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-muted p-2">
                    <Youtube className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium">YouTube</p>
                    <p className="text-sm text-muted-foreground">
                      영상 콘텐츠 업로드
                    </p>
                  </div>
                </div>
                <Button disabled>준비 중</Button>
              </div>

              {/* Instagram */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-muted p-2">
                    <Instagram className="h-5 w-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="font-medium">Instagram</p>
                    <p className="text-sm text-muted-foreground">
                      소셜 콘텐츠 게시
                    </p>
                  </div>
                </div>
                <Button disabled>준비 중</Button>
              </div>

              {/* Blog */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-muted p-2">
                    <Globe className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium">티스토리 / 네이버 블로그</p>
                    <p className="text-sm text-muted-foreground">
                      블로그 포스트 자동 게시
                    </p>
                  </div>
                </div>
                <Button disabled>준비 중</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
