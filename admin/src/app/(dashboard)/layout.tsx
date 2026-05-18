import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { Sidebar } from '@/components/Sidebar'
import { RoleProvider } from '@/components/RoleProvider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let role: 'admin' | 'agent' = 'agent'
  try {
    const token = cookies().get('admin_session')?.value
    if (token) {
      const secret = new TextEncoder().encode(process.env.SESSION_SECRET)
      const { payload } = await jwtVerify(token, secret)
      role = ((payload.role as string) === 'admin' ? 'admin' : 'agent')
    }
  } catch {}

  return (
    <RoleProvider role={role}>
      <div className="flex h-[100dvh] overflow-hidden">
        <Sidebar role={role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </RoleProvider>
  )
}
