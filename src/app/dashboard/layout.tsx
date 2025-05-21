import SidebarNav from '../components/common/sidebar-nav';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed top-0 left-0 z-30 h-screen w-64 border-r bg-card">
        <div className="p-6">
          <h1 className="text-2xl font-bold">TenantArmor</h1>
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