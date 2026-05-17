'use client'

import { createContext, useContext } from 'react'

const RoleContext = createContext<'admin' | 'agent'>('agent')

export function RoleProvider({
  role,
  children,
}: {
  role: 'admin' | 'agent'
  children: React.ReactNode
}) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
}

export function useRole() {
  return useContext(RoleContext)
}
