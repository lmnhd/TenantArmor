"use client"

import { usePathname } from 'next/navigation'
import { Header } from './header'

export function ConditionalHeader() {
  const pathname = usePathname()
  
  // Don't show header on dashboard pages since they have their own sidebar navigation
  if (pathname?.startsWith('/dashboard')) {
    return null
  }
  
  return <Header />
} 