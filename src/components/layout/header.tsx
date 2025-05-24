"use client"

import Link from 'next/link'
import Image from 'next/image'
import { UserButton, SignInButton, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { useAuthenticatedRouting } from '@/lib/utils/auth-routing'

export function Header() {
  const { isSignedIn, user } = useUser()
  const { routeToPricing } = useAuthenticatedRouting()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <Image 
            src="/TenantArmor-NoText.svg" 
            alt="TenantArmor Logo" 
            width={32} 
            height={32}
            className="h-8 w-8 brightness-0 invert dark:brightness-100 dark:invert-0 opacity-80"
            style={{
              filter: 'brightness(0) invert(1)',
            }}
          />
          <span className="text-2xl font-bold text-primary">TenantArmor</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/about" className="text-muted-foreground hover:text-foreground">
            About
          </Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          {isSignedIn && (
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {isSignedIn ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <SignInButton mode="modal">
                <Button variant="ghost">Sign In</Button>
              </SignInButton>
              <Button onClick={() => routeToPricing()}>Get Started</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 