'use client'

import { useRef } from 'react'
import { useImportCustomers } from '@/hooks/use-customers'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function ExcelImport() {
  const inputRef = useRef<HTMLInputElement>(null)
  const importMutation = useImportCustomers()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await importMutation.mutateAsync(file)
      toast.success(`Imported ${result.imported} customers`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={importMutation.isPending}
      >
        {importMutation.isPending ? 'Importing…' : 'Import Excel'}
      </Button>
    </div>
  )
}
