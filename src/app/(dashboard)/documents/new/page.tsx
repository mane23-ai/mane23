'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentForm } from '@/components/documents/document-form'
import { useWorkspaceStore } from '@/stores/workspace-store'
import { Card, CardContent } from '@/components/ui/card'

export default function NewDocumentPage() {
  const router = useRouter()
  const { currentWorkspace } = useWorkspaceStore()

  const handleSuccess = () => {
    router.push('/documents')
  }

  const handleCancel = () => {
    router.back()
  }

  if (!currentWorkspace) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/documents">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">문서 업로드</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">워크스페이스를 선택해주세요</p>
            <p className="text-sm text-muted-foreground">
              문서를 업로드하려면 워크스페이스가 필요합니다.
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
          <Link href="/documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">문서 업로드</h1>
      </div>
      <div className="max-w-2xl">
        <DocumentForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
