'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectForm } from '@/components/projects/project-form'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function NewProjectPage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()

  const handleSuccess = () => {
    router.push('/projects')
  }

  const handleCancel = () => {
    router.back()
  }

  if (!currentWorkspace) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">새 프로젝트</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">워크스페이스를 선택해주세요</p>
            <p className="text-sm text-muted-foreground">
              프로젝트를 생성하려면 워크스페이스가 필요합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">새 프로젝트</h1>
      </div>
      <div className="max-w-2xl">
        <ProjectForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
