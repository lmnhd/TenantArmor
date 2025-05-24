"use client";

import { useState } from 'react';
import SidebarNav from '../components/common/sidebar-nav';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 border-r bg-card transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex flex-col items-center space-y-2">
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
              <span className="text-xl font-bold text-primary text-center">TenantArmor</span>
            </Link>
            
            {/* Close button for mobile */}
            <div className="flex items-center space-x-2">
              <UserButton afterSignOutUrl="/" />
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <SidebarNav onNavigate={() => setSidebarOpen(false)} />
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 md:ml-64">
        {/* Mobile header with hamburger menu */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <span className="text-lg font-semibold">TenantArmor</span>
          <div className="w-8" /> {/* Spacer for centering */}
        </header>
        
        <main className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 