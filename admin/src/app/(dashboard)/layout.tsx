import { headers } from 'next/headers'
import { Sidebar } from '@/components/Sidebar'
import { RoleProvider } from '@/components/RoleProvider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const role = (headers().get('x-user-role') ?? 'agent') as 'admin' | 'agent'
  return (
    <RoleProvider role={role}>
      <div className="flex h-[100dvh] overflow-hidden">
        {/* @ts-expect-error role prop will be added to Sidebar in Task 11 */}
        <Sidebar role={role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </RoleProvider>
  )
}
