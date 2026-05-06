'use client'

import { useState } from 'react'
import { useKB } from '@/hooks/use-kb'
import { KBTable } from '@/components/KBTable'
import { KBForm } from '@/components/KBForm'
import { DocumentUpload } from '@/components/DocumentUpload'
import { GapAnalysis } from '@/components/GapAnalysis'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KBEntry } from '@/hooks/use-kb'

export default function KnowledgeBasePage() {
  const { data: entries = [], isLoading } = useKB()
  const [editEntry, setEditEntry] = useState<KBEntry | null>(null)
  const [showForm, setShowForm] = useState(false)

  function handleEdit(entry: KBEntry) {
    setEditEntry(entry)
    setShowForm(true)
  }

  function handleDone() {
    setShowForm(false)
    setEditEntry(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Knowledge Base</h1>
        <Button onClick={() => { setEditEntry(null); setShowForm(true) }}>+ Add Entry</Button>
      </div>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="upload">Upload Doc</TabsTrigger>
          <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="mt-4 space-y-4">
          {showForm && (
            <div className="border rounded-lg p-4">
              <h2 className="font-medium mb-3">{editEntry ? 'Edit Entry' : 'New Entry'}</h2>
              <KBForm entry={editEntry} onDone={handleDone} />
            </div>
          )}
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <KBTable entries={entries} onEdit={handleEdit} />
          )}
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <DocumentUpload />
        </TabsContent>

        <TabsContent value="gaps" className="mt-4">
          <GapAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  )
}
