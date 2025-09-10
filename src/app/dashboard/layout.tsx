
'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import Header from '@/components/dashboard/header';
import SidebarContent from '@/components/dashboard/sidebar-content';
import MobileNav from '@/components/dashboard/mobile-nav';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSidebarOpen(!isMobile);
    }
  }, [isMobile]);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background flex-col gap-8 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-primary/10 z-0"></div>
         <div className="absolute h-48 w-48 rounded-full bg-primary/20 blur-3xl animate-pulse -top-10 -left-10"></div>
         <div className="absolute h-48 w-48 rounded-full bg-primary/20 blur-3xl animate-pulse -bottom-10 -right-10"></div>
        <div className="z-10 flex flex-col items-center gap-6">
          <Logo className="h-28 w-28 text-primary" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-xl font-medium text-foreground">Loading your dashboard</p>
            <p className="text-sm text-muted-foreground">Please wait a moment...</p>
          </div>
          <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
      <Sidebar className="hidden md:flex md:flex-shrink-0">
        <SidebarContent />
      </Sidebar>
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <SidebarInset className={cn(
            "p-4 sm:p-6 lg:p-8",
            "pb-24 md:pb-8" // Add more padding-bottom for mobile nav
            )}>
              {children}
            </SidebarInset>
        </main>
      </div>
      {isMobile && <MobileNav />}
    </SidebarProvider>
  );
}
