'use client'

import { useState } from 'react'
import { useCustomers } from '@/hooks/use-customers'
import { CustomerTable } from '@/components/CustomerTable'
import { ExcelImport } from '@/components/ExcelImport'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('')
  const { data: customers = [], isLoading } = useCustomers({ search: search || undefined, language: language || undefined })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <ExcelImport />
      </div>
      <div className="flex gap-3">
        <Input
          placeholder="Search name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={language} onValueChange={(v) => setLanguage(v ?? '')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="ms">Malay</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="zh">Chinese</SelectItem>
            <SelectItem value="ta">Tamil</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : (
        <CustomerTable customers={customers} />
      )}
    </div>
  )
}
