'use client'

import { useState } from 'react'
import { useUsers, useCreateUser, useDeleteUser, useResetPassword } from '@/hooks/use-users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Trash2, KeyRound, Plus } from 'lucide-react'

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'agent'>('agent')
  const create = useCreateUser()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await create.mutateAsync({ username, password, role })
      toast.success('User created')
      setUsername(''); setPassword(''); setRole('agent')
      setOpen(false)
      onCreated()
    } catch {
      toast.error('Failed to create user')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm"><Plus className="h-4 w-4 mr-1" />New User</Button>} />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="new-username">Username</Label>
            <Input id="new-username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-password">Password</Label>
            <Input id="new-password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <div className="flex gap-2">
              {(['agent', 'admin'] as const).map(r => (
                <Button key={r} type="button" variant={role === r ? 'default' : 'outline'} size="sm"
                  onClick={() => setRole(r)} className="capitalize">{r}</Button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={create.isPending || !username || !password}>
            {create.isPending ? 'Creating…' : 'Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordDialog({ userId, username }: { userId: string; username: string }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const reset = useResetPassword()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await reset.mutateAsync({ id: userId, password })
      toast.success('Password reset')
      setPassword('')
      setOpen(false)
    } catch {
      toast.error('Failed to reset password')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" variant="ghost" className="h-7 w-7" title="Reset password"><KeyRound className="h-3.5 w-3.5" /></Button>} />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password — {username}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="reset-pw">New Password</Label>
            <Input id="reset-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={reset.isPending || !password}>
            {reset.isPending ? 'Saving…' : 'Save'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function UsersPage() {
  const { data: users = [], isLoading, refetch } = useUsers()
  const deleteUser = useDeleteUser()

  async function handleDelete(id: string, username: string) {
    if (!confirm(`Delete user "${username}"?`)) return
    await deleteUser.mutateAsync(id)
    toast.success('User deleted')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage admin and agent accounts</p>
        </div>
        <CreateUserDialog onCreated={refetch} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('en-GB')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <ResetPasswordDialog userId={u.id} username={u.username} />
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(u.id, u.username)} disabled={deleteUser.isPending}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
