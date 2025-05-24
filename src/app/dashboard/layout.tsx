import SidebarNav from '../components/common/sidebar-nav';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed top-0 left-0 z-30 h-screen w-64 border-r bg-card">
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
            <UserButton afterSignOutUrl="/" />
          </div>
          <SidebarNav />
        </div>
      </aside>
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
} 