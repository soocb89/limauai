'use client'

import { useRef, useState } from 'react'
import { useUploadKB } from '@/hooks/use-kb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function DocumentUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const uploadMutation = useUploadKB()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !title.trim()) {
      toast.error('Title is required before uploading')
      return
    }
    try {
      const result = await uploadMutation.mutateAsync({ file, title: title.trim(), category })
      toast.success(`Uploaded: ${result.chunks} chunks added`)
      setTitle('')
      setCategory('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2 border rounded-lg p-4">
      <p className="font-medium text-sm">Upload Document (PDF / DOCX / TXT / CSV / XLSX)</p>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
        </div>
        <div className="w-36">
          <Label className="text-xs">Category</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Optional" />
        </div>
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.docx,.txt,.csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploadMutation.isPending}
      >
        {uploadMutation.isPending ? 'Uploading…' : 'Choose File'}
      </Button>
    </div>
  )
}
