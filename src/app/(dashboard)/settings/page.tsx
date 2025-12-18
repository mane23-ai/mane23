'use client';

import { useState } from 'react';
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
  Palette,
  Globe,
  Shield,
  Webhook,
  Github,
  Youtube,
  Instagram,
} from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    projectUpdates: true,
    contentVerification: true,
    marketing: false,
  });

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
                  <Input id="name" placeholder="홍길동" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" type="email" placeholder="user@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">소개</Label>
                <Textarea
                  id="bio"
                  placeholder="간단한 자기소개를 입력하세요."
                  rows={3}
                />
              </div>
              <Button>저장</Button>
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
                <Input id="workspace-name" placeholder="My Workspace" />
              </div>
              <Button>저장</Button>
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
                  />
                  <Button variant="outline">저장</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Claude API 사용을 위한 키입니다.
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
                  />
                  <Button variant="outline">저장</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  GitHub 레포지토리 연동을 위한 토큰입니다.
                </p>
              </div>
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
                <Button variant="outline">연결됨</Button>
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
                <Button>연결하기</Button>
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
                <Button>연결하기</Button>
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
                <Button>연결하기</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
